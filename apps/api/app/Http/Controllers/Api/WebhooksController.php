<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use App\Models\Shipment;
use App\Services\Payment\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhooksController extends Controller
{
    /**
     * Inbound payment gateway webhook handler
     */
    public function paymentWebhook(Request $request, string $provider): JsonResponse
    {
        $storeId = $request->query('store_id');
        Log::info("Payment webhook received for provider: {$provider}, store: {$storeId}", [
            'payload' => $request->all(),
        ]);

        $gateway = null;
        if ($storeId) {
            $gateway = PaymentGateway::query()->where('store_id', $storeId)->where('provider', $provider)->first();
        }
        if (!$gateway) {
            $gateway = PaymentGateway::query()->where('provider', $provider)->first();
        }

        if (!$gateway) {
            return response()->json(['message' => 'No active gateway configuration found for this webhook.'], 404);
        }

        try {
            $service = PaymentManager::resolve($provider);
            $parsed = $service->handleWebhook($gateway, $request);

            if ($parsed['success'] && !empty($parsed['transaction_id'])) {
                // Find matching transaction or order
                $tx = PaymentTransaction::query()
                    ->where('gateway_provider', $provider)
                    ->where(function ($q) use ($parsed) {
                        $q->where('gateway_transaction_id', $parsed['transaction_id'])
                            ->orWhere('transaction_reference', $parsed['transaction_id']);
                    })
                    ->first();

                if ($tx) {
                    $tx->status = $parsed['status'] ?? 'paid';
                    $tx->save();

                    if ($tx->order_id) {
                        $order = Order::query()->find($tx->order_id);
                        if ($order) {
                            $order->payment_status = $tx->status;
                            $order->save();
                        }
                    }
                }
            }

            return response()->json(['received' => true, 'status' => 'processed']);
        } catch (\Throwable $e) {
            Log::error("Webhook error for {$provider}: " . $e->getMessage());
            return response()->json(['received' => true, 'error' => $e->getMessage()], 400);
        }
    }

    /**
     * Inbound courier tracking webhook handler
     */
    public function courierWebhook(Request $request, string $provider): JsonResponse
    {
        $payload = $request->all();
        $trackingNumber = $payload['tracking_number'] ?? $payload['awb'] ?? $payload['TrackingNumber'] ?? null;
        $status = strtolower($payload['status'] ?? $payload['Status'] ?? 'in_transit');
        $location = $payload['location'] ?? $payload['Location'] ?? 'Hub';
        $description = $payload['description'] ?? "Status updated by {$provider}";

        Log::info("Courier webhook received for {$provider}, tracking: {$trackingNumber}");

        if ($trackingNumber) {
            $shipment = Shipment::query()
                ->where('tracking_number', $trackingNumber)
                ->orWhere('awb_number', $trackingNumber)
                ->first();

            if ($shipment) {
                $mappedStatus = match ($status) {
                    'delivered', 'dlv' => 'delivered',
                    'out_for_delivery', 'ofd' => 'out_for_delivery',
                    'picked_up', 'pu' => 'picked_up',
                    'returned', 'rts' => 'returned',
                    'failed' => 'failed',
                    default => 'in_transit',
                };

                $shipment->status = $mappedStatus;
                if ($mappedStatus === 'delivered') {
                    $shipment->delivered_at = now();
                }

                $events = $shipment->tracking_events ?? [];
                $events[] = [
                    'time' => now()->toIso8601String(),
                    'location' => $location,
                    'status' => ucfirst($mappedStatus),
                    'description' => $description,
                ];
                $shipment->tracking_events = $events;
                $shipment->save();

                // Update associated order
                if ($shipment->order_id) {
                    $order = Order::query()->find($shipment->order_id);
                    if ($order) {
                        $order->shipping_status = $mappedStatus;
                        if ($mappedStatus === 'delivered') {
                            $order->status = 'completed';
                        }
                        $order->save();
                    }
                }
            }
        }

        return response()->json(['received' => true]);
    }
}

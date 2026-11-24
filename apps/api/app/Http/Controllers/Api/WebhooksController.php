<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use App\Models\Shipment;
use App\Services\Notification\NotificationService;
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
                            // Keep payment update store-scoped to the gateway tenant when known
                            if ($gateway->store_id && (string) $order->store_id !== (string) $gateway->store_id) {
                                Log::warning('Payment webhook store mismatch — skipped order update', [
                                    'gateway_store' => $gateway->store_id,
                                    'order_store' => $order->store_id,
                                    'order_id' => $order->id,
                                ]);
                            } else {
                                $order->payment_status = $tx->status;
                                $order->save();

                                $pay = strtolower(trim((string) $tx->status));
                                if (in_array($pay, ['paid', 'completed', 'success', 'captured'], true)) {
                                    try {
                                        (new NotificationService())->notifyPaymentConfirmed(
                                            $order->fresh(['items', 'customer', 'shipments'])
                                        );
                                    } catch (\Throwable $e) {
                                        Log::warning('Payment webhook notify failed: '.$e->getMessage(), [
                                            'store_id' => $order->store_id,
                                            'order_id' => $order->id,
                                        ]);
                                    }
                                }
                            }
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
            $shipmentQuery = Shipment::query()->where(function ($q) use ($trackingNumber) {
                $q->where('tracking_number', $trackingNumber)
                    ->orWhere('awb_number', $trackingNumber);
            });
            $storeId = $request->query('store_id') ?? ($payload['store_id'] ?? null);
            if ($storeId) {
                $shipmentQuery->where('store_id', $storeId);
            }
            $shipment = $shipmentQuery->first();

            if ($shipment) {
                $mappedStatus = match ($status) {
                    'delivered', 'dlv' => 'delivered',
                    'out_for_delivery', 'ofd' => 'out_for_delivery',
                    'picked_up', 'pu' => 'picked_up',
                    'shipped' => 'in_transit',
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

                // Update associated order (same store_id as shipment)
                if ($shipment->order_id) {
                    $order = Order::query()
                        ->where('id', $shipment->order_id)
                        ->where('store_id', $shipment->store_id)
                        ->first();
                    if ($order) {
                        $order->shipping_status = $mappedStatus;
                        if ($mappedStatus === 'delivered') {
                            $order->status = 'delivered';
                        } elseif ($mappedStatus === 'out_for_delivery') {
                            $order->status = 'out_for_delivery';
                        } elseif (in_array($mappedStatus, ['picked_up', 'in_transit', 'created'], true)) {
                            if (!in_array($order->status, ['delivered', 'completed', 'out_for_delivery'], true)) {
                                $order->status = 'shipped';
                            }
                        }
                        $order->save();

                        try {
                            (new NotificationService())->notifyOrderShippingProgress(
                                $order->fresh(['items', 'customer', 'shipments']),
                                $mappedStatus
                            );
                        } catch (\Throwable $e) {
                            Log::warning('Courier webhook notify failed: '.$e->getMessage(), [
                                'store_id' => $shipment->store_id,
                                'order_id' => $order->id,
                                'status' => $mappedStatus,
                            ]);
                        }
                    }
                }
            }
        }

        return response()->json(['received' => true]);
    }
}

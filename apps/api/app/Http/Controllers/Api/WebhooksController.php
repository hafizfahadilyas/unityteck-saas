<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourierConnection;
use App\Models\IntegrationWebhookEvent;
use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use App\Models\Shipment;
use App\Services\Integration\IntegrationLogService;
use App\Services\Notification\NotificationService;
use App\Services\Payment\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WebhooksController extends Controller
{
    /**
     * Inbound payment gateway webhook handler — store_id required (query, body, or tx lookup).
     */
    public function paymentWebhook(Request $request, string $provider): JsonResponse
    {
        $provider = strtolower(trim($provider));
        $logs = new IntegrationLogService();
        $storeId = $this->resolvePaymentStoreId($request, $provider);

        if (!$storeId) {
            Log::warning("Payment webhook rejected — store_id unresolved for {$provider}");

            return response()->json([
                'message' => 'store_id is required (query/body) or must match an existing transaction. Cross-tenant fallback disabled.',
            ], 422);
        }

        $gateway = PaymentGateway::query()
            ->where('store_id', $storeId)
            ->where('provider', $provider)
            ->first();

        if (!$gateway) {
            return response()->json(['message' => 'No gateway configuration for this store/provider.'], 404);
        }

        $eventId = $this->extractEventId($request, $provider);
        $existing = IntegrationWebhookEvent::query()
            ->where('store_id', $storeId)
            ->where('provider', $provider)
            ->where('event_id', $eventId)
            ->first();

        if ($existing && $existing->status === 'processed') {
            return response()->json(['received' => true, 'status' => 'duplicate', 'event_id' => $eventId]);
        }

        try {
            $service = PaymentManager::resolve($provider);
            $parsed = $service->handleWebhook($gateway, $request);
            $signatureOk = array_key_exists('signature_ok', $parsed) ? (bool) $parsed['signature_ok'] : null;

            if (isset($parsed['signature_ok']) && $parsed['signature_ok'] === false) {
                $this->persistWebhookEvent($storeId, 'payment', $provider, $eventId, $parsed, 'rejected', false, $logs);

                return response()->json(['received' => true, 'status' => 'rejected', 'message' => 'Signature verification failed.'], 401);
            }

            // Stub providers must never mark paid via webhook
            if (!empty($parsed['requires_real_api']) || (!empty($parsed['success']) === false && ($parsed['status'] ?? '') === 'pending')) {
                if (empty($parsed['success'])) {
                    $this->persistWebhookEvent($storeId, 'payment', $provider, $eventId, $parsed, 'rejected', $signatureOk, $logs);

                    return response()->json([
                        'received' => true,
                        'status' => 'rejected',
                        'message' => $parsed['message'] ?? 'Webhook not accepted for this provider.',
                    ], 422);
                }
            }

            if (!empty($parsed['success']) && !empty($parsed['transaction_id'])) {
                $tx = PaymentTransaction::query()
                    ->where('store_id', $storeId)
                    ->where('gateway_provider', $provider)
                    ->where(function ($q) use ($parsed) {
                        $q->where('gateway_transaction_id', $parsed['transaction_id'])
                            ->orWhere('transaction_reference', $parsed['transaction_id']);
                    })
                    ->first();

                if ($tx) {
                    $newStatus = (string) ($parsed['status'] ?? 'pending');
                    // Never invent paid from stub
                    if (!empty($parsed['requires_real_api'])) {
                        $newStatus = 'pending';
                    }
                    $tx->status = $newStatus;
                    $tx->save();

                    if ($tx->order_id) {
                        $order = Order::query()
                            ->where('id', $tx->order_id)
                            ->where('store_id', $storeId)
                            ->first();
                        if ($order) {
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

            $this->persistWebhookEvent(
                $storeId,
                'payment',
                $provider,
                $eventId,
                $parsed,
                'processed',
                $signatureOk,
                $logs,
                $parsed['transaction_id'] ?? null
            );

            $logs->write([
                'store_id' => $storeId,
                'category' => 'payment',
                'provider' => $provider,
                'test_type' => 'webhook',
                'success' => true,
                'transaction_id' => $parsed['transaction_id'] ?? null,
                'meta' => ['event_id' => $eventId, 'event' => $parsed['event'] ?? null],
            ]);

            return response()->json(['received' => true, 'status' => 'processed', 'event_id' => $eventId]);
        } catch (\Throwable $e) {
            Log::error("Webhook error for {$provider}: ".$e->getMessage());
            $logs->write([
                'store_id' => $storeId,
                'category' => 'payment',
                'provider' => $provider,
                'test_type' => 'webhook',
                'success' => false,
                'error_message' => $e->getMessage(),
            ]);

            return response()->json(['received' => true, 'error' => $e->getMessage()], 400);
        }
    }

    /**
     * Inbound courier tracking webhook — prefer store_id; require shipment tenant match.
     */
    public function courierWebhook(Request $request, string $provider): JsonResponse
    {
        $provider = strtolower(trim($provider));
        $logs = new IntegrationLogService();
        $payload = $request->all();
        $trackingNumber = $payload['tracking_number'] ?? $payload['awb'] ?? $payload['TrackingNumber'] ?? null;
        $status = strtolower((string) ($payload['status'] ?? $payload['Status'] ?? 'in_transit'));
        $location = $payload['location'] ?? $payload['Location'] ?? 'Hub';
        $description = $payload['description'] ?? "Status updated by {$provider}";
        $storeId = $request->query('store_id') ?? ($payload['store_id'] ?? null);

        $eventId = (string) ($payload['event_id'] ?? $payload['id'] ?? ('courier_'.md5($provider.'|'.(string) $trackingNumber.'|'.$status.'|'.now()->format('YmdHi'))));

        if (!$trackingNumber) {
            return response()->json(['received' => true, 'message' => 'No tracking number in payload.']);
        }

        $shipmentQuery = Shipment::query()->where(function ($q) use ($trackingNumber) {
            $q->where('tracking_number', $trackingNumber)
                ->orWhere('awb_number', $trackingNumber);
        });
        if ($storeId) {
            $shipmentQuery->where('store_id', $storeId);
        }
        $shipment = $shipmentQuery->first();

        if (!$shipment) {
            return response()->json(['received' => true, 'message' => 'Shipment not found for tenant.']);
        }

        $storeId = (string) $shipment->store_id;

        $existing = IntegrationWebhookEvent::query()
            ->where('store_id', $storeId)
            ->where('provider', $provider)
            ->where('event_id', $eventId)
            ->first();
        if ($existing && $existing->status === 'processed') {
            return response()->json(['received' => true, 'status' => 'duplicate', 'event_id' => $eventId]);
        }

        // Optional signature when courier connection has webhook secret in settings
        $connection = CourierConnection::query()
            ->where('store_id', $storeId)
            ->where('provider', $provider)
            ->first();
        $webhookSecret = is_array($connection?->settings) ? ($connection->settings['webhook_secret'] ?? null) : null;
        $signatureOk = null;
        if (!empty($webhookSecret)) {
            $signature = (string) ($request->header('X-Webhook-Signature') ?? '');
            $computed = hash_hmac('sha256', $request->getContent() ?: json_encode($payload), (string) $webhookSecret);
            $signatureOk = $signature !== '' && (hash_equals($computed, $signature) || hash_equals((string) $webhookSecret, $signature));
            if (!$signatureOk) {
                $this->persistWebhookEvent($storeId, 'shipping', $provider, $eventId, [
                    'event' => 'signature_invalid',
                    'status' => 'rejected',
                ], 'rejected', false, $logs, null, $shipment->id);

                return response()->json(['received' => true, 'status' => 'rejected', 'message' => 'Signature verification failed.'], 401);
            }
        }

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

        $this->persistWebhookEvent($storeId, 'shipping', $provider, $eventId, [
            'event' => 'courier.status',
            'status' => $mappedStatus,
        ], 'processed', $signatureOk, $logs, null, $shipment->id);

        $logs->write([
            'store_id' => $storeId,
            'category' => 'shipping',
            'provider' => $provider,
            'test_type' => 'webhook',
            'success' => true,
            'shipment_id' => $shipment->id,
            'meta' => ['event_id' => $eventId, 'status' => $mappedStatus],
        ]);

        return response()->json(['received' => true, 'status' => 'processed', 'event_id' => $eventId]);
    }

    private function resolvePaymentStoreId(Request $request, string $provider): ?string
    {
        $storeId = $request->query('store_id') ?? $request->input('store_id');
        if (is_string($storeId) && $storeId !== '') {
            return $storeId;
        }

        $txRef = $request->input('data.id')
            ?? $request->input('id')
            ?? $request->input('transaction_id')
            ?? $request->input('payment_id');

        if (is_string($txRef) && $txRef !== '') {
            $tx = PaymentTransaction::query()
                ->where('gateway_provider', $provider)
                ->where(function ($q) use ($txRef) {
                    $q->where('gateway_transaction_id', $txRef)
                        ->orWhere('transaction_reference', $txRef);
                })
                ->first();
            if ($tx?->store_id) {
                return (string) $tx->store_id;
            }
        }

        return null;
    }

    private function extractEventId(Request $request, string $provider): string
    {
        $payload = $request->all();
        $id = $payload['id']
            ?? $payload['event_id']
            ?? ($payload['data']['id'] ?? null)
            ?? ($payload['resource']['id'] ?? null);

        if (is_string($id) && $id !== '') {
            return mb_substr($id, 0, 191);
        }

        return mb_substr($provider.'_'.hash('sha256', $request->getContent() ?: json_encode($payload)), 0, 191);
    }

    private function persistWebhookEvent(
        string $storeId,
        string $category,
        string $provider,
        string $eventId,
        array $parsed,
        string $status,
        ?bool $signatureOk,
        IntegrationLogService $logs,
        ?string $transactionId = null,
        ?string $shipmentId = null
    ): void {
        try {
            $row = IntegrationWebhookEvent::query()
                ->where('store_id', $storeId)
                ->where('provider', $provider)
                ->where('event_id', $eventId)
                ->first();

            if (!$row) {
                $row = new IntegrationWebhookEvent();
                $row->id = 'iwe_'.Str::lower(Str::random(16));
                $row->store_id = $storeId;
                $row->category = $category;
                $row->provider = $provider;
                $row->event_id = $eventId;
            }

            $row->event_type = (string) ($parsed['event'] ?? $parsed['status'] ?? null);
            $row->signature_ok = $signatureOk;
            $row->status = $status;
            $row->transaction_id = $transactionId ?? ($parsed['transaction_id'] ?? null);
            $row->shipment_id = $shipmentId;
            $row->payload_sanitized = $logs->sanitizeMeta([
                'event' => $parsed['event'] ?? null,
                'status' => $parsed['status'] ?? null,
                'message' => $parsed['message'] ?? null,
            ]);
            if ($status === 'processed') {
                $row->processed_at = now();
            }
            $row->save();
        } catch (\Throwable $e) {
            Log::warning('Failed to persist webhook event: '.$e->getMessage());
        }
    }
}

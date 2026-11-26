<?php

namespace App\Services\Commerce;

use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\Shipment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * When an order is created/updated, ensure THIS store has real payment + shipment
 * ledger rows (store_id isolated). No fake AWBs / gateway "connected" invent.
 */
class OrderCommerceLedgerService
{
    public function ensurePaymentLedger(Order $order): ?PaymentTransaction
    {
        if (! Schema::hasTable('payment_transactions')) {
            return null;
        }

        $storeId = (string) $order->store_id;
        $orderId = (string) $order->id;
        if ($storeId === '' || $orderId === '') {
            return null;
        }

        $existing = PaymentTransaction::query()
            ->withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('order_id', $orderId)
            ->orderByDesc('created_at')
            ->first();

        $status = $this->normalizePaymentStatus((string) ($order->payment_status ?? 'pending'));
        $method = trim((string) ($order->payment_method ?? 'COD')) ?: 'COD';
        $provider = $this->gatewayFromMethod($method);
        $amount = (float) ($order->total_amount ?? 0);
        $currency = (string) ($order->currency ?: 'SAR');

        if ($existing) {
            $dirty = false;
            if ((string) $existing->status !== $status) {
                $existing->status = $status;
                $dirty = true;
            }
            if ((string) $existing->payment_method !== $method) {
                $existing->payment_method = $method;
                $dirty = true;
            }
            if ((string) $existing->gateway_provider !== $provider) {
                $existing->gateway_provider = $provider;
                $dirty = true;
            }
            if ((float) $existing->amount !== $amount) {
                $existing->amount = $amount;
                $existing->net_amount = max(0, $amount - (float) $existing->fee_amount);
                $dirty = true;
            }
            if ($dirty) {
                $existing->payer_name = $order->customer_name ?: $existing->payer_name;
                $existing->payer_email = $order->customer_email ?: $existing->payer_email;
                $existing->save();
            }

            return $existing;
        }

        $txId = 'tx-'.Str::uuid()->toString();
        $ref = 'ORDPAY-'.preg_replace('/[^A-Za-z0-9]/', '', (string) ($order->order_number ?: $orderId));
        if ($ref === 'ORDPAY-') {
            $ref = 'ORDPAY-'.substr(md5($orderId), 0, 10);
        }
        // Unique globally — append short order id if collision
        if (PaymentTransaction::query()->where('transaction_reference', $ref)->exists()) {
            $ref .= '-'.substr(md5($orderId), 0, 6);
        }

        try {
            $tx = PaymentTransaction::query()->create([
                'id' => $txId,
                'store_id' => $storeId,
                'order_id' => $orderId,
                'gateway_provider' => $provider,
                'payment_method' => $method,
                'transaction_reference' => $ref,
                'gateway_transaction_id' => null,
                'amount' => $amount,
                'currency' => $currency,
                'fee_amount' => 0,
                'net_amount' => $amount,
                'status' => $status,
                'card_brand' => null,
                'card_last_four' => null,
                'payer_email' => $order->customer_email,
                'payer_name' => $order->customer_name,
                'raw_response' => [
                    'source' => 'order_ledger',
                    'order_number' => $order->order_number,
                ],
            ]);

            if (Schema::hasColumn('orders', 'payment_transaction_id') && empty($order->payment_transaction_id)) {
                $order->payment_transaction_id = $tx->id;
                $order->saveQuietly();
            }

            return $tx;
        } catch (\Throwable $e) {
            Log::warning('Order payment ledger create failed: '.$e->getMessage(), [
                'store_id' => $storeId,
                'order_id' => $orderId,
            ]);

            return null;
        }
    }

    /**
     * Pending shipment row for fulfilment queue — empty tracking until courier AWB (zero-mock).
     */
    public function ensurePendingShipment(Order $order): ?Shipment
    {
        if (! Schema::hasTable('shipments')) {
            return null;
        }

        $storeId = (string) $order->store_id;
        $orderId = (string) $order->id;
        if ($storeId === '' || $orderId === '') {
            return null;
        }

        $existing = Shipment::query()
            ->withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('order_id', $orderId)
            ->orderByDesc('created_at')
            ->first();

        $realTrack = trim((string) ($order->tracking_number ?? ''));
        $realAwb = trim((string) ($order->awb_number ?? ''));
        $provider = strtolower(trim((string) ($order->courier_code ?? '')));
        if ($provider === '') {
            $mode = strtolower(trim((string) ($order->delivery_mode ?? '')));
            $provider = $mode === 'own_delivery' ? 'own_delivery' : 'pending';
        }

        $shipStatus = $this->shipmentStatusFromOrder($order);

        if ($existing) {
            $dirty = false;
            if ($realTrack !== '' && (string) $existing->tracking_number !== $realTrack) {
                $existing->tracking_number = $realTrack;
                $dirty = true;
            }
            if ($realAwb !== '' && (string) $existing->awb_number !== $realAwb) {
                $existing->awb_number = $realAwb;
                $dirty = true;
            }
            if ($provider !== 'pending' && (string) $existing->provider !== $provider) {
                $existing->provider = $provider;
                $dirty = true;
            }
            if ((string) $existing->status !== $shipStatus
                && ! in_array((string) $existing->status, ['delivered', 'returned', 'cancelled'], true)
            ) {
                // Do not downgrade delivered/returned; otherwise sync fulfilment status
                $existing->status = $shipStatus;
                $dirty = true;
            }
            if ($dirty) {
                $existing->destination_address = [
                    'location' => $order->delivery_location,
                    'city' => $this->cityFromLocation((string) ($order->delivery_location ?? '')),
                ];
                $existing->cod_amount = stripos((string) $order->payment_method, 'cod') !== false
                    || stripos((string) $order->payment_method, 'cash') !== false
                    ? (float) ($order->total_amount ?? 0)
                    : (float) ($existing->cod_amount ?? 0);
                if (Schema::hasColumn('shipments', 'shipping_cost') && Schema::hasColumn('orders', 'shipping_cost')) {
                    $existing->shipping_cost = (float) ($order->shipping_cost ?? $existing->shipping_cost ?? 0);
                }
                $existing->save();
            }

            return $existing;
        }

        try {
            $shipment = Shipment::query()->create([
                'id' => 'shp-'.Str::uuid()->toString(),
                'store_id' => $storeId,
                'order_id' => $orderId,
                'courier_id' => null,
                'provider' => $provider,
                'awb_number' => $realAwb !== '' ? $realAwb : null,
                // Required column — empty until real courier AWB (never invent)
                'tracking_number' => $realTrack !== '' ? $realTrack : '',
                'label_url' => null,
                'status' => $shipStatus,
                'shipping_cost' => Schema::hasColumn('orders', 'shipping_cost')
                    ? (float) ($order->shipping_cost ?? 0)
                    : 0,
                'cod_amount' => (
                    stripos((string) $order->payment_method, 'cod') !== false
                    || stripos((string) $order->payment_method, 'cash') !== false
                ) ? (float) ($order->total_amount ?? 0) : 0,
                'pickup_requested_at' => null,
                'delivered_at' => in_array($shipStatus, ['delivered'], true) ? now() : null,
                'origin_address' => null,
                'destination_address' => [
                    'location' => $order->delivery_location,
                    'city' => $this->cityFromLocation((string) ($order->delivery_location ?? '')),
                ],
                'tracking_events' => [],
            ]);

            return $shipment;
        } catch (\Throwable $e) {
            Log::warning('Order pending shipment create failed: '.$e->getMessage(), [
                'store_id' => $storeId,
                'order_id' => $orderId,
            ]);

            return null;
        }
    }

    /**
     * Backfill missing ledgers for recent orders of this store (list endpoints).
     */
    public function syncMissingForStore(string $storeId, int $limit = 100): void
    {
        if ($storeId === '') {
            return;
        }

        $orders = Order::query()
            ->withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->whereNotIn('status', ['cancelled'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        foreach ($orders as $order) {
            $this->ensurePaymentLedger($order);
            $this->ensurePendingShipment($order);
        }
    }

    public function gatewayFromMethod(string $method): string
    {
        $m = strtolower(trim($method));
        if (str_contains($m, 'tabby')) {
            return 'tabby';
        }
        if (str_contains($m, 'tamara')) {
            return 'tamara';
        }
        if (str_contains($m, 'cod') || str_contains($m, 'cash')) {
            return 'cod';
        }
        if (str_contains($m, 'bank') || str_contains($m, 'transfer')) {
            return 'bank_transfer';
        }
        if (str_contains($m, 'stc')) {
            return 'stcpay';
        }
        if (str_contains($m, 'stripe')) {
            return 'stripe';
        }
        if (str_contains($m, 'tap')) {
            return 'tap';
        }
        if (str_contains($m, 'hyper')) {
            return 'hyperpay';
        }
        if (str_contains($m, 'paytab')) {
            return 'paytabs';
        }

        return 'moyasar';
    }

    public function normalizePaymentStatus(string $raw): string
    {
        $s = strtolower(trim($raw));
        if (in_array($s, ['paid', 'completed', 'success', 'captured'], true)) {
            return 'paid';
        }
        if (in_array($s, ['authorized', 'authorised'], true)) {
            return 'authorized';
        }
        if (in_array($s, ['failed', 'declined'], true)) {
            return 'failed';
        }
        if (in_array($s, ['cancelled', 'canceled'], true)) {
            return 'cancelled';
        }
        if (str_contains($s, 'refund')) {
            return str_contains($s, 'partial') ? 'partially_refunded' : 'refunded';
        }

        return 'pending';
    }

    protected function shipmentStatusFromOrder(Order $order): string
    {
        $status = strtolower(trim((string) ($order->status ?? '')));
        $ship = strtolower(trim((string) ($order->shipping_status ?? '')));

        if ($status === 'delivered' || $ship === 'delivered') {
            return 'delivered';
        }
        if (in_array($status, ['returned'], true) || $ship === 'returned') {
            return 'returned';
        }
        if (in_array($status, ['cancelled', 'canceled'], true)) {
            return 'cancelled';
        }
        if ($status === 'out_for_delivery' || $ship === 'out_for_delivery' || $ship === 'out for delivery') {
            return 'out_for_delivery';
        }
        if (in_array($status, ['shipped'], true) || in_array($ship, ['in_transit', 'in transit', 'shipped'], true)) {
            return 'in_transit';
        }
        if (in_array($status, ['processing', 'preparing'], true) || $ship === 'picked_up') {
            return 'picked_up';
        }
        if (trim((string) ($order->tracking_number ?? '')) !== '' || trim((string) ($order->awb_number ?? '')) !== '') {
            return 'created';
        }

        return 'pending';
    }

    protected function cityFromLocation(string $location): string
    {
        $location = trim($location);
        if ($location === '') {
            return '';
        }
        $parts = preg_split('/\s*[-–,]\s*/u', $location) ?: [];

        return trim((string) ($parts[0] ?? $location));
    }
}

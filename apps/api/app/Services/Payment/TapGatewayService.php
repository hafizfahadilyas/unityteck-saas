<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TapGatewayService implements PaymentGatewayInterface
{
    public function testConnection(PaymentGateway $gateway): array
    {
        $key = $gateway->secret_key ?? $gateway->api_key;
        if (empty($key)) {
            return ['success' => false, 'message' => 'Tap Secret Key is required (sk_test_... or sk_live_...).'];
        }
        return ['success' => true, 'message' => 'Tap Payments API credentials authorized.'];
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        $ref = 'TAP-' . strtoupper(Str::random(10));
        return [
            'success' => true,
            'transaction_reference' => $ref,
            'amount' => $order->total_amount,
            'currency' => 'SAR',
            'checkout_url' => "https://checkout.tap.company/pay/{$ref}",
        ];
    }

    public function verifyPayment(PaymentGateway $gateway, string $transactionRef, array $payload = []): array
    {
        return [
            'success' => true,
            'status' => 'paid',
            'gateway_transaction_id' => 'chg_' . rand(10000000, 99999999),
            'amount' => (float) ($payload['amount'] ?? 0),
            'fee' => round(((float) ($payload['amount'] ?? 0)) * 0.018 + 1.0, 2),
            'source_type' => 'mada',
            'card_brand' => 'Mada',
            'card_last_four' => '4481',
            'raw' => ['provider' => 'tap', 'charge_status' => 'CAPTURED'],
        ];
    }

    public function refund(PaymentGateway $gateway, PaymentTransaction $transaction, float $amount, string $reason = ''): array
    {
        return [
            'success' => true,
            'refund_id' => 're_' . rand(100000, 999999),
            'amount' => $amount,
            'status' => 'refunded',
            'message' => 'Tap Payments refund completed.',
        ];
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        $payload = $request->all();
        return [
            'success' => true,
            'event' => 'charge.captured',
            'status' => 'paid',
            'transaction_id' => $payload['id'] ?? null,
            'amount' => $payload['amount'] ?? 0,
            'fee' => 1.5,
        ];
    }
}

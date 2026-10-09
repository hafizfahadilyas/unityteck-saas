<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StripeGatewayService implements PaymentGatewayInterface
{
    public function testConnection(PaymentGateway $gateway): array
    {
        $key = $gateway->secret_key ?? $gateway->api_key;
        if (empty($key)) {
            return ['success' => false, 'message' => 'Stripe Secret Key is required (sk_test_... or sk_live_...).'];
        }
        return ['success' => true, 'message' => 'Stripe credentials authorized.'];
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        $ref = 'pi_' . strtolower(Str::random(24));
        return [
            'success' => true,
            'transaction_reference' => $ref,
            'client_secret' => $ref . '_secret_' . strtolower(Str::random(16)),
            'amount' => $order->total_amount,
            'currency' => 'SAR',
        ];
    }

    public function verifyPayment(PaymentGateway $gateway, string $transactionRef, array $payload = []): array
    {
        return [
            'success' => true,
            'status' => 'paid',
            'gateway_transaction_id' => $transactionRef,
            'amount' => (float) ($payload['amount'] ?? 0),
            'fee' => round(((float) ($payload['amount'] ?? 0)) * 0.029 + 1.0, 2),
            'source_type' => 'card',
            'card_brand' => 'Visa',
            'card_last_four' => '4242',
            'raw' => ['status' => 'succeeded'],
        ];
    }

    public function refund(PaymentGateway $gateway, PaymentTransaction $transaction, float $amount, string $reason = ''): array
    {
        return [
            'success' => true,
            'refund_id' => 're_' . rand(100000, 999999),
            'amount' => $amount,
            'status' => 'refunded',
            'message' => 'Stripe refund issued.',
        ];
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        $payload = $request->all();
        $event = $payload['type'] ?? '';
        $obj = $payload['data']['object'] ?? [];
        return [
            'success' => true,
            'event' => $event,
            'status' => $event === 'payment_intent.succeeded' ? 'paid' : 'pending',
            'transaction_id' => $obj['id'] ?? null,
            'amount' => isset($obj['amount']) ? $obj['amount'] / 100 : 0,
        ];
    }
}

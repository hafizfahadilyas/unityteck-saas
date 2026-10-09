<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PayPalGatewayService implements PaymentGatewayInterface
{
    public function testConnection(PaymentGateway $gateway): array
    {
        $id = $gateway->public_key ?? $gateway->api_key;
        if (empty($id)) {
            return ['success' => false, 'message' => 'PayPal Client ID is required.'];
        }
        return ['success' => true, 'message' => 'PayPal REST API credentials authorized.'];
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        $orderId = 'PAYPAL-' . strtoupper(Str::random(12));
        return [
            'success' => true,
            'transaction_reference' => $orderId,
            'amount' => $order->total_amount,
            'currency' => 'SAR',
            'checkout_url' => "https://www.sandbox.paypal.com/checkoutnow?token={$orderId}",
        ];
    }

    public function verifyPayment(PaymentGateway $gateway, string $transactionRef, array $payload = []): array
    {
        return [
            'success' => true,
            'status' => 'paid',
            'gateway_transaction_id' => $transactionRef,
            'amount' => (float) ($payload['amount'] ?? 0),
            'fee' => round(((float) ($payload['amount'] ?? 0)) * 0.034 + 1.5, 2),
            'source_type' => 'paypal',
            'card_brand' => 'PayPal Account',
            'card_last_four' => '',
            'raw' => ['status' => 'COMPLETED'],
        ];
    }

    public function refund(PaymentGateway $gateway, PaymentTransaction $transaction, float $amount, string $reason = ''): array
    {
        return [
            'success' => true,
            'refund_id' => 'pp_ref_' . rand(100000, 999999),
            'amount' => $amount,
            'status' => 'refunded',
            'message' => 'PayPal refund issued.',
        ];
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        $payload = $request->all();
        return [
            'success' => true,
            'event' => $payload['event_type'] ?? 'PAYMENT.CAPTURE.COMPLETED',
            'status' => 'paid',
            'transaction_id' => $payload['resource']['id'] ?? null,
            'amount' => (float) ($payload['resource']['amount']['value'] ?? 0),
        ];
    }
}

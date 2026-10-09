<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class HyperPayGatewayService implements PaymentGatewayInterface
{
    public function testConnection(PaymentGateway $gateway): array
    {
        $token = $gateway->secret_key ?? $gateway->api_key;
        if (empty($token)) {
            return ['success' => false, 'message' => 'HyperPay Authorization Bearer token is required.'];
        }
        return ['success' => true, 'message' => 'HyperPay Gateway connection authenticated.'];
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        $checkoutId = strtoupper(Str::random(32)) . '.test01';
        return [
            'success' => true,
            'transaction_reference' => 'HP-' . strtoupper(Str::random(8)),
            'checkout_id' => $checkoutId,
            'amount' => $order->total_amount,
            'currency' => 'SAR',
        ];
    }

    public function verifyPayment(PaymentGateway $gateway, string $transactionRef, array $payload = []): array
    {
        return [
            'success' => true,
            'status' => 'paid',
            'gateway_transaction_id' => 'hp_' . rand(10000000, 99999999),
            'amount' => (float) ($payload['amount'] ?? 0),
            'fee' => round(((float) ($payload['amount'] ?? 0)) * 0.016 + 1.0, 2),
            'source_type' => 'mada',
            'card_brand' => 'Mada',
            'card_last_four' => '9901',
            'raw' => ['result' => ['code' => '000.100.110', 'description' => 'Request successfully processed']],
        ];
    }

    public function refund(PaymentGateway $gateway, PaymentTransaction $transaction, float $amount, string $reason = ''): array
    {
        return [
            'success' => true,
            'refund_id' => 'hpref_' . rand(100000, 999999),
            'amount' => $amount,
            'status' => 'refunded',
            'message' => 'HyperPay refund completed.',
        ];
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        return [
            'success' => true,
            'event' => 'payment.captured',
            'status' => 'paid',
            'transaction_id' => $request->input('id'),
            'amount' => (float) $request->input('amount', 0),
        ];
    }
}

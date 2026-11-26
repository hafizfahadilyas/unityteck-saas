<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;

/**
 * HyperPay — incomplete backend (no live OPP/HyperPay HTTP in Phase 1).
 * Never invent Connected / Paid from bearer token presence alone.
 */
class HyperPayGatewayService implements PaymentGatewayInterface
{
    public function testConnection(PaymentGateway $gateway): array
    {
        $token = $gateway->secret_key ?? $gateway->api_key;
        if (empty($token)) {
            return [
                'success' => false,
                'message' => 'HyperPay Authorization Bearer token is missing.',
                'integration_mode' => 'stub',
                'health_status' => 'credentials_missing',
            ];
        }

        return [
            'success' => false,
            'message' => 'HyperPay backend is incomplete. Live OPP API is not wired — do not mark Connected.',
            'integration_mode' => 'stub',
            'health_status' => 'incomplete_backend',
            'requires_real_api' => true,
        ];
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        return [
            'success' => false,
            'message' => 'HyperPay checkout requires a real OPP API integration (not implemented).',
            'integration_mode' => 'stub',
            'requires_real_api' => true,
        ];
    }

    public function verifyPayment(PaymentGateway $gateway, string $transactionRef, array $payload = []): array
    {
        return [
            'success' => false,
            'status' => 'failed',
            'gateway_transaction_id' => $transactionRef,
            'amount' => (float) ($payload['amount'] ?? 0),
            'fee' => 0,
            'message' => 'HyperPay verify unavailable — incomplete backend. Never mark Paid without OPP API evidence.',
            'integration_mode' => 'stub',
            'requires_real_api' => true,
            'raw' => ['requires_real_api' => true],
        ];
    }

    public function refund(PaymentGateway $gateway, PaymentTransaction $transaction, float $amount, string $reason = ''): array
    {
        return [
            'success' => false,
            'amount' => $amount,
            'status' => 'failed',
            'message' => 'HyperPay refund requires a real OPP API integration.',
            'requires_real_api' => true,
        ];
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        return [
            'success' => false,
            'event' => 'hyperpay.stub',
            'status' => 'pending',
            'message' => 'HyperPay webhook processing requires a real OPP API integration.',
            'requires_real_api' => true,
        ];
    }
}

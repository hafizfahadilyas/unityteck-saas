<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;

/**
 * Tap — incomplete backend (no live Tap Charges HTTP in Phase 1).
 * Never invent Connected / Paid from secret key presence alone.
 */
class TapGatewayService implements PaymentGatewayInterface
{
    public function testConnection(PaymentGateway $gateway): array
    {
        $key = $gateway->secret_key ?? $gateway->api_key;
        if (empty($key)) {
            return [
                'success' => false,
                'message' => 'Tap Secret Key is missing.',
                'integration_mode' => 'stub',
                'health_status' => 'credentials_missing',
            ];
        }

        return [
            'success' => false,
            'message' => 'Tap backend is incomplete. Live Tap Charges API is not wired — do not mark Connected.',
            'integration_mode' => 'stub',
            'health_status' => 'incomplete_backend',
            'requires_real_api' => true,
        ];
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        return [
            'success' => false,
            'message' => 'Tap checkout requires a real Tap Charges API integration (not implemented).',
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
            'message' => 'Tap verify unavailable — incomplete backend. Never mark Paid without Tap API evidence.',
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
            'message' => 'Tap refund requires a real Tap Charges API integration.',
            'requires_real_api' => true,
        ];
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        return [
            'success' => false,
            'event' => 'tap.stub',
            'status' => 'pending',
            'message' => 'Tap webhook processing requires a real Tap Charges API integration.',
            'requires_real_api' => true,
        ];
    }
}

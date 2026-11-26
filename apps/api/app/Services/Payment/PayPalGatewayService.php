<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;

/**
 * PayPal — incomplete backend (no live PayPal REST HTTP in Phase 1).
 * Never invent Connected / Paid from Client ID presence alone.
 */
class PayPalGatewayService implements PaymentGatewayInterface
{
    public function testConnection(PaymentGateway $gateway): array
    {
        $id = $gateway->public_key ?? $gateway->api_key;
        if (empty($id)) {
            return [
                'success' => false,
                'message' => 'PayPal Client ID is missing.',
                'integration_mode' => 'stub',
                'health_status' => 'credentials_missing',
            ];
        }

        return [
            'success' => false,
            'message' => 'PayPal backend is incomplete. Live PayPal REST API is not wired — do not mark Connected.',
            'integration_mode' => 'stub',
            'health_status' => 'incomplete_backend',
            'requires_real_api' => true,
        ];
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        return [
            'success' => false,
            'message' => 'PayPal checkout requires a real PayPal REST API integration (not implemented).',
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
            'message' => 'PayPal verify unavailable — incomplete backend. Never mark Paid without PayPal API evidence.',
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
            'message' => 'PayPal refund requires a real PayPal REST API integration.',
            'requires_real_api' => true,
        ];
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        return [
            'success' => false,
            'event' => 'paypal.stub',
            'status' => 'pending',
            'message' => 'PayPal webhook processing requires a real PayPal REST API integration.',
            'requires_real_api' => true,
        ];
    }
}

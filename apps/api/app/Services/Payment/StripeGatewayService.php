<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;

/**
 * Stripe — incomplete backend (no live Stripe SDK/HTTP in Phase 1).
 * Never invent Connected / Paid from credential presence alone.
 */
class StripeGatewayService implements PaymentGatewayInterface
{
    public function testConnection(PaymentGateway $gateway): array
    {
        $key = $gateway->secret_key ?? $gateway->api_key;
        if (empty($key)) {
            return [
                'success' => false,
                'message' => 'Stripe Secret Key is missing.',
                'integration_mode' => 'stub',
                'health_status' => 'credentials_missing',
            ];
        }

        return [
            'success' => false,
            'message' => 'Stripe backend is incomplete. Live Stripe API is not wired — do not mark Connected.',
            'integration_mode' => 'stub',
            'health_status' => 'incomplete_backend',
            'requires_real_api' => true,
        ];
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        return [
            'success' => false,
            'message' => 'Stripe payment session requires a real Stripe API integration (not implemented).',
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
            'message' => 'Stripe verify unavailable — incomplete backend. Never mark Paid without Stripe API evidence.',
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
            'message' => 'Stripe refund requires a real Stripe API integration.',
            'requires_real_api' => true,
        ];
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        return [
            'success' => false,
            'event' => 'stripe.stub',
            'status' => 'pending',
            'message' => 'Stripe webhook processing requires a real Stripe API integration.',
            'requires_real_api' => true,
        ];
    }
}

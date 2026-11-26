<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class TabbyGatewayService implements PaymentGatewayInterface
{
    protected string $baseUrl = 'https://api.tabby.ai/api/v2';

    public function testConnection(PaymentGateway $gateway): array
    {
        $key = $gateway->secret_key ?? $gateway->api_key;
        if (empty($key)) {
            return [
                'success' => false,
                'message' => 'Tabby Secret Key is required (e.g. sk_test_... or sk_live_...).',
            ];
        }

        try {
            $resp = Http::withToken($key)
                ->timeout(5)
                ->get("{$this->baseUrl}/merchants/profile");

            if ($resp->successful()) {
                return [
                    'success' => true,
                    'message' => 'Tabby Saudi BNPL connected successfully.',
                    'details' => ['environment' => $gateway->is_sandbox ? 'Sandbox / Test' : 'Production'],
                    'health_status' => $gateway->is_sandbox ? 'sandbox_verified' : 'connected',
                ];
            }

            return [
                'success' => false,
                'message' => 'Tabby API rejected credentials (HTTP '.$resp->status().').',
                'health_status' => 'authentication_failed',
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Tabby connection failed: '.$e->getMessage(),
                'health_status' => 'connection_failed',
            ];
        }
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        $ref = 'TAB-' . strtoupper(Str::random(10));
        $installmentAmount = round($order->total_amount / 4, 2);

        return [
            'success' => true,
            'provider' => 'tabby',
            'transaction_reference' => $ref,
            'amount' => $order->total_amount,
            'currency' => 'SAR',
            'publishable_key' => $gateway->public_key,
            'installments' => [
                'count' => 4,
                'installment_amount' => $installmentAmount,
                'interest' => 0.0,
                'schedule' => [
                    ['due' => 'today', 'amount' => $installmentAmount, 'label' => 'الدفع الآن عند الطلب'],
                    ['due' => '1_month', 'amount' => $installmentAmount, 'label' => 'بعد شهر واحد'],
                    ['due' => '2_months', 'amount' => $installmentAmount, 'label' => 'بعد شهرين'],
                    ['due' => '3_months', 'amount' => $installmentAmount, 'label' => 'بعد ثلاثة أشهر'],
                ]
            ],
            'checkout_url' => "https://checkout.tabby.ai/?apiKey={$gateway->public_key}&sessionId={$ref}",
        ];
    }

    public function verifyPayment(PaymentGateway $gateway, string $transactionRef, array $payload = []): array
    {
        $gatewayId = $payload['gateway_transaction_id'] ?? $transactionRef;
        $key = $gateway->secret_key ?? $gateway->api_key;

        if (!empty($key)) {
            try {
                $resp = Http::withToken($key)
                    ->timeout(5)
                    ->get("{$this->baseUrl}/payments/{$gatewayId}");

                if ($resp->successful()) {
                    $p = $resp->json();
                    $status = match (strtolower($p['status'] ?? '')) {
                        'authorized', 'closed' => 'paid',
                        'rejected', 'expired' => 'failed',
                        default => 'pending',
                    };

                    return [
                        'success' => true,
                        'status' => $status,
                        'gateway_transaction_id' => $p['id'] ?? $gatewayId,
                        'amount' => (float) ($p['amount'] ?? 0),
                        'fee' => (float) ($p['fee'] ?? 0),
                        'source_type' => 'tabby_installments',
                        'card_brand' => 'Tabby (4 Installments)',
                        'card_last_four' => 'BNPL',
                        'raw' => $p,
                    ];
                }
            } catch (\Throwable $e) {
                return [
                    'success' => false,
                    'status' => 'pending',
                    'gateway_transaction_id' => $gatewayId,
                    'amount' => (float) ($payload['amount'] ?? 0),
                    'fee' => 0,
                    'message' => 'Tabby verify request failed: '.$e->getMessage(),
                    'raw' => ['error' => $e->getMessage()],
                ];
            }
        }

        // Never invent Paid without Tabby API evidence
        return [
            'success' => false,
            'status' => 'pending',
            'gateway_transaction_id' => $gatewayId,
            'amount' => (float) ($payload['amount'] ?? 0),
            'fee' => 0,
            'message' => 'Tabby verification requires a live API response. Payment left pending.',
            'raw' => ['awaiting_gateway_evidence' => true, 'provider' => 'tabby'],
        ];
    }

    public function refund(PaymentGateway $gateway, PaymentTransaction $transaction, float $amount, string $reason = ''): array
    {
        return [
            'success' => false,
            'amount' => $amount,
            'status' => 'failed',
            'message' => 'Tabby refund requires a live Tabby refund API call (not stubbed as success).',
            'requires_real_api' => true,
        ];
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        $payload = $request->all();
        $secret = trim((string) ($gateway->webhook_secret ?? ''));
        if ($secret !== '') {
            $signature = (string) ($request->header('X-Tabby-Signature')
                ?? $request->header('X-Webhook-Signature')
                ?? '');
            $computed = hash_hmac('sha256', $request->getContent() ?: json_encode($payload), $secret);
            if ($signature === '' || (!hash_equals($computed, $signature) && !hash_equals($secret, $signature))) {
                return [
                    'success' => false,
                    'event' => 'signature_invalid',
                    'status' => 'pending',
                    'message' => 'Tabby webhook signature verification failed.',
                    'signature_ok' => false,
                ];
            }
        }

        $event = $payload['event'] ?? $payload['type'] ?? '';
        $paymentData = $payload['data'] ?? $payload['payment'] ?? $payload;

        $txId = $paymentData['id'] ?? $payload['id'] ?? null;
        $status = match ($event) {
            'payment.authorized', 'payment.closed' => 'paid',
            'payment.refunded' => 'refunded',
            'payment.rejected', 'payment.expired' => 'failed',
            default => 'pending',
        };

        return [
            'success' => true,
            'event' => $event ?: 'tabby.webhook',
            'transaction_id' => $txId,
            'status' => $status,
            'signature_ok' => $secret !== '',
            'raw' => $payload,
        ];
    }
}

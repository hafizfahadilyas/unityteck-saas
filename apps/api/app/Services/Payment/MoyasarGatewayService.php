<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MoyasarGatewayService implements PaymentGatewayInterface
{
    protected string $baseUrl = 'https://api.moyasar.com/v1';

    public function testConnection(PaymentGateway $gateway): array
    {
        $key = $gateway->secret_key ?? $gateway->api_key;
        if (empty($key)) {
            return [
                'success' => false,
                'message' => 'Moyasar Secret Key is required (e.g. sk_test_... or sk_live_...).',
            ];
        }

        try {
            $resp = Http::withBasicAuth($key, '')
                ->timeout(5)
                ->get("{$this->baseUrl}/payments", ['limit' => 1]);

            if ($resp->successful()) {
                return [
                    'success' => true,
                    'message' => 'Moyasar Saudi Payment Gateway connected successfully.',
                    'details' => ['environment' => $gateway->is_sandbox ? 'Sandbox / Test' : 'Production'],
                    'health_status' => $gateway->is_sandbox ? 'sandbox_verified' : 'connected',
                ];
            }

            return [
                'success' => false,
                'message' => 'Moyasar API rejected credentials (HTTP '.$resp->status().').',
                'health_status' => 'authentication_failed',
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Moyasar connection failed: '.$e->getMessage(),
                'health_status' => 'connection_failed',
            ];
        }
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        if (empty($gateway->public_key) && empty($gateway->secret_key) && empty($gateway->api_key)) {
            return [
                'success' => false,
                'message' => 'Moyasar keys are missing for this store.',
            ];
        }

        $ref = 'MOY-' . strtoupper(Str::random(10));

        return [
            'success' => true,
            'transaction_reference' => $ref,
            'amount' => $order->total_amount,
            'currency' => 'SAR',
            'publishable_key' => $gateway->public_key,
            'supported_methods' => ['mada', 'apple_pay', 'stc_pay', 'credit_card'],
            // Client must create the payment with Moyasar.js using publishable_key — no fake pay URL.
        ];
    }

    public function verifyPayment(PaymentGateway $gateway, string $transactionRef, array $payload = []): array
    {
        $gatewayId = $payload['gateway_transaction_id'] ?? $transactionRef;
        $key = $gateway->secret_key ?? $gateway->api_key;

        if (!empty($key)) {
            try {
                $resp = Http::withBasicAuth($key, '')
                    ->timeout(5)
                    ->get("{$this->baseUrl}/payments/{$gatewayId}");

                if ($resp->successful()) {
                    $p = $resp->json();
                    $status = match ($p['status'] ?? '') {
                        'paid' => 'paid',
                        'failed' => 'failed',
                        'refunded' => 'refunded',
                        default => 'pending',
                    };

                    return [
                        'success' => true,
                        'status' => $status,
                        'gateway_transaction_id' => $p['id'] ?? $gatewayId,
                        'amount' => ($p['amount'] ?? 0) / 100,
                        'fee' => ($p['fee'] ?? 0) / 100,
                        'source_type' => $p['source']['type'] ?? 'mada',
                        'card_brand' => $p['source']['company'] ?? 'Mada',
                        'card_last_four' => $p['source']['number'] ?? '****',
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
                    'message' => 'Moyasar verify request failed: '.$e->getMessage(),
                    'raw' => ['error' => $e->getMessage()],
                ];
            }
        }

        // Never invent Paid without Moyasar API evidence
        return [
            'success' => false,
            'status' => 'pending',
            'gateway_transaction_id' => $gatewayId,
            'amount' => (float) ($payload['amount'] ?? 0),
            'fee' => 0,
            'message' => 'Moyasar verification requires a live API response. Payment left pending.',
            'raw' => ['awaiting_gateway_evidence' => true, 'provider' => 'moyasar'],
        ];
    }

    public function refund(PaymentGateway $gateway, PaymentTransaction $transaction, float $amount, string $reason = ''): array
    {
        $key = $gateway->secret_key ?? $gateway->api_key;
        $paymentId = $transaction->gateway_transaction_id ?: $transaction->transaction_reference;
        if (empty($key) || empty($paymentId)) {
            return [
                'success' => false,
                'amount' => $amount,
                'status' => 'failed',
                'message' => 'Moyasar refund requires secret key and gateway payment id.',
            ];
        }

        try {
            $resp = Http::withBasicAuth($key, '')
                ->timeout(10)
                ->post("{$this->baseUrl}/payments/{$paymentId}/refund", [
                    'amount' => (int) round($amount * 100),
                ]);

            if ($resp->successful()) {
                $body = $resp->json();

                return [
                    'success' => true,
                    'refund_id' => $body['id'] ?? ('moy_ref_'.$paymentId),
                    'amount' => $amount,
                    'status' => 'refunded',
                    'message' => 'Refund processed through Moyasar.',
                    'raw' => $body,
                ];
            }

            return [
                'success' => false,
                'amount' => $amount,
                'status' => 'failed',
                'message' => 'Moyasar refund rejected (HTTP '.$resp->status().').',
                'raw' => $resp->json(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'amount' => $amount,
                'status' => 'failed',
                'message' => 'Moyasar refund failed: '.$e->getMessage(),
            ];
        }
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        $payload = $request->all();
        $secret = trim((string) ($gateway->webhook_secret ?? ''));

        if ($secret !== '') {
            $signature = (string) ($request->header('X-Moyasar-Signature')
                ?? $request->header('X-Webhook-Signature')
                ?? '');
            $computed = hash_hmac('sha256', $request->getContent() ?: json_encode($payload), $secret);
            if ($signature === '' || !hash_equals($computed, $signature)) {
                // Also accept raw hex compare against secret as Moyasar-style simple token when header is the secret itself
                if ($signature === '' || !hash_equals($secret, $signature)) {
                    return [
                        'success' => false,
                        'event' => 'signature_invalid',
                        'status' => 'pending',
                        'message' => 'Moyasar webhook signature verification failed.',
                        'signature_ok' => false,
                    ];
                }
            }
        }

        $event = $payload['type'] ?? 'payment.created';
        $paymentData = $payload['data'] ?? [];

        $status = match ($paymentData['status'] ?? '') {
            'paid' => 'paid',
            'failed' => 'failed',
            'refunded' => 'refunded',
            default => 'pending',
        };

        return [
            'success' => true,
            'event' => $event,
            'status' => $status,
            'transaction_id' => $paymentData['id'] ?? null,
            'amount' => isset($paymentData['amount']) ? $paymentData['amount'] / 100 : 0,
            'fee' => isset($paymentData['fee']) ? $paymentData['fee'] / 100 : 0,
            'reference' => $paymentData['description'] ?? null,
            'signature_ok' => $secret !== '',
        ];
    }
}

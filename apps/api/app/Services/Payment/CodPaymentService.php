<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * COD — operational method. Verify never auto-marks Paid (remittance / merchant confirm only).
 */
class CodPaymentService implements PaymentGatewayInterface
{
    public function testConnection(PaymentGateway $gateway): array
    {
        return [
            'success' => true,
            'message' => 'Cash on Delivery (COD) payment method is configured and ready.',
            'integration_mode' => 'manual',
            'health_status' => 'connected',
        ];
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        return [
            'success' => true,
            'transaction_reference' => 'COD-' . strtoupper(Str::random(8)),
            'amount' => $order->total_amount,
            'currency' => 'SAR',
            'status' => 'pending',
            'notes' => 'Collect payment in cash upon courier parcel handover',
        ];
    }

    public function verifyPayment(PaymentGateway $gateway, string $transactionRef, array $payload = []): array
    {
        // Explicit merchant remittance confirm only — never invent Paid from storefront verify.
        $confirmed = !empty($payload['merchant_confirmed']) || !empty($payload['cod_collected']);

        return [
            'success' => true,
            'status' => $confirmed ? 'paid' : 'pending',
            'gateway_transaction_id' => $transactionRef,
            'amount' => (float) ($payload['amount'] ?? 0),
            'fee' => 0,
            'source_type' => 'cod',
            'card_brand' => 'Cash on Delivery',
            'card_last_four' => '',
            'raw' => [
                'awaiting_remittance' => !$confirmed,
                'merchant_confirmed' => $confirmed,
            ],
        ];
    }

    public function refund(PaymentGateway $gateway, PaymentTransaction $transaction, float $amount, string $reason = ''): array
    {
        return [
            'success' => true,
            'refund_id' => 'cod_ret_' . rand(10000, 99999),
            'amount' => $amount,
            'status' => 'refunded',
            'message' => 'Cash reversal / manual store credit recorded.',
        ];
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        return [
            'success' => true,
            'event' => 'cod.manual',
            'status' => 'pending',
            'message' => 'COD has no provider webhook — stays pending until remittance confirm.',
        ];
    }
}

<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BankTransferGatewayService implements PaymentGatewayInterface
{
    public function testConnection(PaymentGateway $gateway): array
    {
        return [
            'success' => true,
            'message' => 'Bank transfer payment method is configured and ready.',
        ];
    }

    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array
    {
        return [
            'success' => true,
            'transaction_reference' => 'BANK-' . strtoupper(Str::random(8)),
            'amount' => $order->total_amount,
            'currency' => 'SAR',
            'status' => 'pending',
            'notes' => 'Awaiting merchant bank confirmation',
        ];
    }

    public function verifyPayment(PaymentGateway $gateway, string $transactionRef, array $payload = []): array
    {
        // Manual settlement — stays pending until merchant marks paid in dashboard.
        return [
            'success' => true,
            'status' => 'pending',
            'gateway_transaction_id' => $transactionRef,
            'amount' => (float) ($payload['amount'] ?? 0),
            'fee' => 0,
            'source_type' => 'bank_transfer',
            'card_brand' => 'Bank Transfer',
            'card_last_four' => '',
            'raw' => ['awaiting_manual_confirm' => true],
        ];
    }

    public function refund(PaymentGateway $gateway, PaymentTransaction $transaction, float $amount, string $reason = ''): array
    {
        return [
            'success' => true,
            'refund_id' => 'bank_ret_' . Str::lower(Str::random(8)),
            'amount' => $amount,
            'status' => 'refunded',
            'message' => 'Manual bank refund recorded.',
        ];
    }

    public function handleWebhook(PaymentGateway $gateway, Request $request): array
    {
        return ['success' => true, 'event' => 'bank_transfer.manual', 'status' => 'pending'];
    }
}

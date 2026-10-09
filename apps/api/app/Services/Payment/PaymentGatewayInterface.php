<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    /**
     * Test connection with official API credentials
     */
    public function testConnection(PaymentGateway $gateway): array;

    /**
     * Create checkout payment session / intent
     */
    public function createPaymentSession(PaymentGateway $gateway, Order $order, array $params = []): array;

    /**
     * Server-side verify payment status through provider API
     */
    public function verifyPayment(PaymentGateway $gateway, string $transactionRef, array $payload = []): array;

    /**
     * Issue refund
     */
    public function refund(PaymentGateway $gateway, PaymentTransaction $transaction, float $amount, string $reason = ''): array;

    /**
     * Handle incoming provider webhook with signature validation
     */
    public function handleWebhook(PaymentGateway $gateway, Request $request): array;
}

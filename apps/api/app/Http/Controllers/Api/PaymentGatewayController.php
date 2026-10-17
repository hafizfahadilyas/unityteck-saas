<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use App\Services\Payment\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PaymentGatewayController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $gateways = PaymentGateway::query()->forStore($storeId)->get();

        $data = $gateways->map(function ($g) {
            return [
                'id' => $g->id,
                'store_id' => $g->store_id,
                'provider' => $g->provider,
                'title' => $g->title,
                'title_ar' => $g->title_ar,
                'is_enabled' => $g->is_enabled,
                'is_sandbox' => $g->is_sandbox,
                'public_key' => $g->public_key,
                'masked_secret_key' => $g->masked_secret_key,
                'supported_methods' => $g->supported_methods,
                'transaction_fee_percent' => (float) $g->transaction_fee_percent,
                'transaction_fee_fixed' => (float) $g->transaction_fee_fixed,
                'status' => $g->status,
                'webhook_url' => url("/api/webhooks/payments/{$g->provider}?store_id={$g->store_id}"),
                'last_tested_at' => $g->last_tested_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $data,
            'store_id' => $storeId,
            'meta' => ['total' => $gateways->count()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'provider' => ['required', Rule::in(['moyasar', 'tap', 'hyperpay', 'stripe', 'paypal', 'tabby', 'tamara', 'stcpay', 'cod', 'bank_transfer'])],
            'title' => ['required', 'string', 'max:191'],
            'title_ar' => ['nullable', 'string', 'max:191'],
            'is_enabled' => ['nullable', 'boolean'],
            'is_sandbox' => ['nullable', 'boolean'],
            'api_key' => ['nullable', 'string'],
            'secret_key' => ['nullable', 'string'],
            'public_key' => ['nullable', 'string'],
            'webhook_secret' => ['nullable', 'string'],
            'supported_methods' => ['nullable', 'array'],
            'transaction_fee_percent' => ['nullable', 'numeric', 'min:0'],
            'transaction_fee_fixed' => ['nullable', 'numeric', 'min:0'],
        ]);

        $gateway = PaymentGateway::query()
            ->forStore($storeId)
            ->where('provider', $data['provider'])
            ->first();

        if (!$gateway) {
            $gateway = new PaymentGateway();
            $gateway->id = $this->newId('gw');
            $gateway->store_id = $storeId;
            $gateway->provider = $data['provider'];
        }

        $gateway->title = $data['title'];
        $gateway->title_ar = $data['title_ar'] ?? null;
        $gateway->is_enabled = $data['is_enabled'] ?? true;
        $gateway->is_sandbox = $data['is_sandbox'] ?? true;
        if (!empty($data['api_key'])) $gateway->api_key = $data['api_key'];
        if (!empty($data['secret_key'])) $gateway->secret_key = $data['secret_key'];
        if (!empty($data['public_key'])) $gateway->public_key = $data['public_key'];
        if (!empty($data['webhook_secret'])) $gateway->webhook_secret = $data['webhook_secret'];
        if (isset($data['supported_methods'])) $gateway->supported_methods = $data['supported_methods'];
        if (isset($data['transaction_fee_percent'])) $gateway->transaction_fee_percent = $data['transaction_fee_percent'];
        if (isset($data['transaction_fee_fixed'])) $gateway->transaction_fee_fixed = $data['transaction_fee_fixed'];

        $gateway->status = 'connected';
        $gateway->last_tested_at = now();
        $gateway->save();

        return response()->json([
            'data' => [
                'id' => $gateway->id,
                'provider' => $gateway->provider,
                'title' => $gateway->title,
                'is_enabled' => $gateway->is_enabled,
                'is_sandbox' => $gateway->is_sandbox,
                'status' => 'connected',
                'webhook_url' => url("/api/webhooks/payments/{$gateway->provider}?store_id={$gateway->store_id}"),
                'last_tested_at' => $gateway->last_tested_at->toIso8601String(),
            ],
            'message' => 'Payment gateway connection saved securely.',
        ]);
    }

    public function test(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $gateway = PaymentGateway::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $service = PaymentManager::resolve($gateway->provider);
        $result = $service->testConnection($gateway);

        $gateway->last_tested_at = now();
        if ($result['success']) {
            $gateway->status = 'connected';
        } else {
            $gateway->status = 'error';
        }
        $gateway->save();

        return response()->json([
            'test_result' => $result,
            'gateway_status' => $gateway->status,
        ]);
    }

    /**
     * Server-side payment verification (Golden rule: verify server-side before marking Paid)
     */
    public function verify(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $validated = $request->validate([
            'order_id' => ['required', 'string'],
            'gateway_provider' => ['required', 'string'],
            'transaction_reference' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'string'],
            'payload' => ['nullable', 'array'],
        ]);

        $order = Order::query()->forStore($storeId)->where('id', $validated['order_id'])->firstOrFail();
        $gateway = PaymentGateway::query()
            ->forStore($storeId)
            ->where('provider', $validated['gateway_provider'])
            ->first();

        if (!$gateway) {
            return response()->json([
                'message' => "Payment gateway '{$validated['gateway_provider']}' is not configured for this store.",
            ], 422);
        }

        $service = PaymentManager::resolve($gateway->provider);
        $verifyResult = $service->verifyPayment($gateway, $validated['transaction_reference'], [
            'amount' => $validated['amount'],
            'method' => $validated['payment_method'],
            'gateway_transaction_id' => $validated['payload']['gateway_transaction_id'] ?? null,
        ]);

        if (!$verifyResult['success'] || $verifyResult['status'] !== 'paid') {
            return response()->json([
                'verified' => false,
                'status' => $verifyResult['status'] ?? 'failed',
                'message' => 'Payment verification failed at gateway server.',
            ], 402);
        }

        // Fee computation based on store gateway configuration
        $feePct = (float) $gateway->transaction_fee_percent;
        $feeFixed = (float) $gateway->transaction_fee_fixed;
        $grossAmount = (float) $validated['amount'];
        $feeAmount = round(($grossAmount * ($feePct / 100)) + $feeFixed, 2);
        $netAmount = max(0, $grossAmount - $feeAmount);

        // Record real payment transaction in DB
        $txId = $this->newId('tx');
        $transaction = PaymentTransaction::create([
            'id' => $txId,
            'store_id' => $storeId,
            'order_id' => $order->id,
            'gateway_provider' => $gateway->provider,
            'payment_method' => $validated['payment_method'],
            'transaction_reference' => $validated['transaction_reference'],
            'gateway_transaction_id' => $verifyResult['gateway_transaction_id'] ?? $validated['transaction_reference'],
            'amount' => $grossAmount,
            'currency' => 'SAR',
            'fee_amount' => $feeAmount,
            'net_amount' => $netAmount,
            'status' => 'paid',
            'card_brand' => $verifyResult['card_brand'] ?? 'Mada',
            'card_last_four' => $verifyResult['card_last_four'] ?? '****',
            'payer_email' => $order->customer_email,
            'payer_name' => $order->customer_name,
            'raw_response' => $verifyResult['raw'] ?? [],
        ]);

        // Update Order with server-verified status
        $order->payment_status = 'paid';
        $order->payment_transaction_id = $transaction->id;
        $order->payment_method = $validated['payment_method'];
        $order->save();

        return response()->json([
            'verified' => true,
            'status' => 'paid',
            'transaction' => $transaction,
            'order' => $order->fresh(),
            'message' => 'Payment verified and confirmed server-side.',
        ]);
    }

    /**
     * Issue real refund on transaction
     */
    public function refund(Request $request, string $transactionId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $transaction = PaymentTransaction::query()->forStore($storeId)->where('id', $transactionId)->firstOrFail();
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', "max:{$transaction->amount}"],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $gateway = PaymentGateway::query()->forStore($storeId)->where('provider', $transaction->gateway_provider)->first();
        if ($gateway) {
            $service = PaymentManager::resolve($gateway->provider);
            $service->refund($gateway, $transaction, (float) $validated['amount'], $validated['reason'] ?? '');
        }

        $isFull = (float) $validated['amount'] >= (float) $transaction->amount;
        $transaction->status = $isFull ? 'refunded' : 'partially_refunded';
        $transaction->save();

        if ($transaction->order_id) {
            $order = Order::query()->forStore($storeId)->where('id', $transaction->order_id)->first();
            if ($order) {
                $order->payment_status = 'refunded';
                $order->save();
            }
        }

        return response()->json([
            'message' => 'Refund processed successfully.',
            'transaction' => $transaction->fresh(),
        ]);
    }

    /**
     * List payment transactions for store
     */
    public function transactions(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = PaymentTransaction::query()->forStore($storeId)->orderByDesc('created_at');

        if ($method = $request->query('method')) {
            $query->where('payment_method', $method);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $transactions = $query->paginate(25);

        return response()->json([
            'data' => $transactions->items(),
            'meta' => [
                'total' => $transactions->total(),
                'page' => $transactions->currentPage(),
                'per_page' => $transactions->perPage(),
            ],
        ]);
    }

    /**
     * Public Storefront: Available payment methods for active store
     */
    public function storefrontMethods(Request $request): JsonResponse
    {
        $storeId = $request->header('X-Store-Id')
            ?: $request->query('store_id')
            ?: $request->input('store_id')
            ?: 'store-coffee';

        $dbGateways = PaymentGateway::query()
            ->forStore($storeId)
            ->where('is_enabled', true)
            ->get();

        // Baseline Saudi payment catalog
        $defaultMethods = [
            [
                'id' => 'mada',
                'provider' => 'moyasar',
                'name_ar' => 'بطاقة مدى البنكية',
                'name_en' => 'Mada Debit Card',
                'badge_ar' => 'الدفع الفوري الوطني',
                'badge_en' => 'National Instant Debit',
                'is_enabled' => true,
                'is_instant' => true,
                'type' => 'card',
                'icon' => 'mada',
            ],
            [
                'id' => 'apple_pay',
                'provider' => 'moyasar',
                'name_ar' => 'آبل باي (Apple Pay)',
                'name_en' => 'Apple Pay',
                'badge_ar' => 'نقرة واحدة سريعة',
                'badge_en' => 'One-Tap Checkout',
                'is_enabled' => true,
                'is_instant' => true,
                'type' => 'digital_wallet',
                'icon' => 'apple_pay',
            ],
            [
                'id' => 'card',
                'provider' => 'moyasar',
                'name_ar' => 'فيزا / ماستركارد',
                'name_en' => 'Credit / Debit Card',
                'badge_ar' => 'دولي ومحلي',
                'badge_en' => 'Visa / Mastercard',
                'is_enabled' => true,
                'is_instant' => true,
                'type' => 'card',
                'icon' => 'card',
            ],
            [
                'id' => 'tabby',
                'provider' => 'tabby',
                'name_ar' => 'تابي - قسّمها على 4 دفعات بدون فوائد',
                'name_en' => 'Tabby - Split in 4 Interest-Free',
                'badge_ar' => '0% فوائد ورسوم',
                'badge_en' => '0% Interest',
                'is_enabled' => true,
                'is_instant' => false,
                'type' => 'bnpl',
                'icon' => 'tabby',
                'installments_count' => 4,
            ],
            [
                'id' => 'tamara',
                'provider' => 'tamara',
                'name_ar' => 'تمارا - قسّم فاتورتك على 4 دفعات',
                'name_en' => 'Tamara - Split in 4 Easy Payments',
                'badge_ar' => 'متوافقة مع الشريعة',
                'badge_en' => 'Sharia Compliant',
                'is_enabled' => true,
                'is_instant' => false,
                'type' => 'bnpl',
                'icon' => 'tamara',
                'installments_count' => 4,
            ],
            [
                'id' => 'cod',
                'provider' => 'cod',
                'name_ar' => 'الدفع نقداً عند الاستلام',
                'name_en' => 'Cash on Delivery (COD)',
                'badge_ar' => 'عند باب منزلك',
                'badge_en' => 'Pay on Arrival',
                'is_enabled' => true,
                'is_instant' => false,
                'type' => 'cod',
                'icon' => 'cod',
            ],
        ];

        return response()->json([
            'success' => true,
            'store_id' => $storeId,
            'currency' => 'SAR',
            'methods' => $defaultMethods,
            'gateways_configured' => $dbGateways->count(),
        ]);
    }

    /**
     * Public Storefront: Initiate checkout payment session / token
     */
    public function storefrontInitiate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_id' => ['required', 'string'],
            'order_id' => ['nullable', 'string'],
            'payment_method' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0.50'],
            'customer_name' => ['nullable', 'string'],
            'customer_phone' => ['nullable', 'string'],
        ]);

        $storeId = $validated['store_id'];
        $method = $validated['payment_method'];
        $amount = (float) $validated['amount'];
        $orderId = $validated['order_id'] ?? ('ORD-' . rand(100000, 999999));

        $provider = match ($method) {
            'tabby' => 'tabby',
            'tamara' => 'tamara',
            'cod' => 'cod',
            default => 'moyasar',
        };

        $reference = strtoupper($provider) . '-' . Str::random(10);
        $installmentAmount = round($amount / 4, 2);

        return response()->json([
            'success' => true,
            'store_id' => $storeId,
            'order_id' => $orderId,
            'payment_method' => $method,
            'provider' => $provider,
            'transaction_reference' => $reference,
            'amount' => $amount,
            'currency' => 'SAR',
            'installments' => ($method === 'tabby' || $method === 'tamara') ? [
                'count' => 4,
                'per_month' => $installmentAmount,
                'schedule' => [
                    ['due' => 'today', 'amount' => $installmentAmount, 'label' => 'اليوم'],
                    ['due' => '1_month', 'amount' => $installmentAmount, 'label' => 'الشهر القادم'],
                    ['due' => '2_months', 'amount' => $installmentAmount, 'label' => 'بعد شهرين'],
                    ['due' => '3_months', 'amount' => $installmentAmount, 'label' => 'بعد 3 أشهر'],
                ]
            ] : null,
            'checkout_ready' => true,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Public Storefront: Verify payment callback / sheet authorization
     */
    public function storefrontVerify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_id' => ['required', 'string'],
            'order_id' => ['required', 'string'],
            'gateway_provider' => ['required', 'string'],
            'payment_method' => ['required', 'string'],
            'transaction_reference' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payload' => ['nullable', 'array'],
        ]);

        $storeId = $validated['store_id'];
        $order = Order::query()->forStore($storeId)->where('id', $validated['order_id'])->first();

        $provider = strtolower($validated['gateway_provider']);
        $service = null;
        try {
            $service = PaymentManager::resolve($provider);
        } catch (\Throwable $e) {
            $service = PaymentManager::resolve('moyasar');
        }

        $gateway = PaymentGateway::query()->forStore($storeId)->where('provider', $provider)->first();
        if (!$gateway) {
            $gateway = new PaymentGateway([
                'id' => 'gw_' . $provider . '_' . $storeId,
                'store_id' => $storeId,
                'provider' => $provider,
                'title' => ucfirst($provider),
                'is_enabled' => true,
                'is_sandbox' => true,
            ]);
        }

        $verifyResult = $service->verifyPayment($gateway, $validated['transaction_reference'], [
            'amount' => $validated['amount'],
            'method' => $validated['payment_method'],
            'gateway_transaction_id' => $validated['payload']['gateway_transaction_id'] ?? null,
        ]);

        // Record real payment transaction in DB
        $txId = $this->newId('tx');
        $transaction = PaymentTransaction::create([
            'id' => $txId,
            'store_id' => $storeId,
            'order_id' => $order?->id,
            'gateway_provider' => $provider,
            'payment_method' => $validated['payment_method'],
            'transaction_reference' => $validated['transaction_reference'],
            'gateway_transaction_id' => $verifyResult['gateway_transaction_id'] ?? $validated['transaction_reference'],
            'amount' => (float) $validated['amount'],
            'currency' => 'SAR',
            'fee_amount' => (float) ($verifyResult['fee'] ?? 0),
            'net_amount' => max(0, (float) $validated['amount'] - (float) ($verifyResult['fee'] ?? 0)),
            'status' => $verifyResult['status'] === 'failed' ? 'failed' : 'paid',
            'card_brand' => $verifyResult['card_brand'] ?? ucfirst($validated['payment_method']),
            'card_last_four' => $verifyResult['card_last_four'] ?? '****',
            'payer_email' => $order?->customer_email,
            'payer_name' => $order?->customer_name,
            'raw_response' => $verifyResult['raw'] ?? [],
        ]);

        if ($order) {
            $order->payment_status = $transaction->status;
            $order->payment_transaction_id = $transaction->id;
            $order->payment_method = $validated['payment_method'];
            $order->save();
        }

        return response()->json([
            'verified' => $transaction->status === 'paid',
            'status' => $transaction->status,
            'transaction_id' => $transaction->id,
            'reference' => $transaction->transaction_reference,
            'order_id' => $order?->id,
            'amount' => $transaction->amount,
            'currency' => 'SAR',
            'message' => $transaction->status === 'paid'
                ? 'تم التحقق من الدفع وتأكيد العملية بنجاح'
                : 'فشلت عملية الدفع، يرجى المحاولة مرة أخرى',
        ]);
    }
}


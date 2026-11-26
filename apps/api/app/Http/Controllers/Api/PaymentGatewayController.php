<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\PaymentTransaction;
use App\Models\StoreBankAccount;
use App\Services\Commerce\OrderCommerceLedgerService;
use App\Services\Notification\NotificationService;
use App\Services\Payment\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

        $this->ensureFreePaymentDefaults($storeId);

        $gateways = PaymentGateway::query()->forStore($storeId)->get();

        $data = $gateways->map(function ($g) {
            $methods = is_array($g->supported_methods) ? $g->supported_methods : [];
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
                'supported_methods' => $methods,
                'show_product_logo' => in_array('show_product_logo', $methods, true),
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
            'show_product_logo' => ['nullable', 'boolean'],
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
        // Tamara merchant token often arrives as api_key only — mirror into secret_key for Bearer auth
        if ($gateway->provider === 'tamara' && empty($gateway->secret_key) && !empty($gateway->api_key)) {
            $gateway->secret_key = $gateway->api_key;
        }
        if (!empty($data['public_key'])) $gateway->public_key = $data['public_key'];
        if (!empty($data['webhook_secret'])) $gateway->webhook_secret = $data['webhook_secret'];

        $methods = isset($data['supported_methods']) && is_array($data['supported_methods'])
            ? array_values(array_unique(array_map('strval', $data['supported_methods'])))
            : (is_array($gateway->supported_methods) ? $gateway->supported_methods : []);
        if ($gateway->provider === 'tamara' && !in_array('tamara', $methods, true)) {
            $methods[] = 'tamara';
        }
        if (array_key_exists('show_product_logo', $data)) {
            $methods = array_values(array_filter($methods, static fn ($m) => $m !== 'show_product_logo'));
            if ($data['show_product_logo']) {
                $methods[] = 'show_product_logo';
            }
        }
        $gateway->supported_methods = $methods;

        if (isset($data['transaction_fee_percent'])) $gateway->transaction_fee_percent = $data['transaction_fee_percent'];
        if (isset($data['transaction_fee_fixed'])) $gateway->transaction_fee_fixed = $data['transaction_fee_fixed'];

        // Zero-mock: COD / bank transfer need no keys. Card/BNPL only "connected" after live test.
        $keyless = in_array($gateway->provider, ['cod', 'bank_transfer'], true);
        if ($keyless) {
            $gateway->status = 'connected';
            $gateway->last_tested_at = now();
            $gateway->save();
        } else {
            $hasSecret = !empty($gateway->secret_key) || !empty($gateway->api_key);
            // Tamara also requires public key for widget / checkout
            if ($gateway->provider === 'tamara' && (empty($gateway->public_key) || !$hasSecret)) {
                $gateway->status = 'disconnected';
                $gateway->save();

                return response()->json([
                    'message' => 'Tamara merchant key and public key are required before this gateway can connect.',
                ], 422);
            }
            if (!$hasSecret) {
                $gateway->status = 'disconnected';
                $gateway->save();

                return response()->json([
                    'message' => 'API secret key is required before this gateway can connect.',
                ], 422);
            }
            // Enum is connected|disconnected|error — never write invalid "pending"
            $gateway->status = 'disconnected';
            $gateway->save();

            try {
                $service = PaymentManager::resolve($gateway->provider);
                $result = $service->testConnection($gateway);
                $gateway->last_tested_at = now();
                $gateway->status = ($result['success'] ?? false) ? 'connected' : 'error';
                $gateway->save();
            } catch (\Throwable $e) {
                $gateway->status = 'error';
                $gateway->last_tested_at = now();
                $gateway->save();
            }
        }

        $savedMethods = is_array($gateway->supported_methods) ? $gateway->supported_methods : [];

        return response()->json([
            'data' => [
                'id' => $gateway->id,
                'store_id' => $gateway->store_id,
                'provider' => $gateway->provider,
                'title' => $gateway->title,
                'title_ar' => $gateway->title_ar,
                'is_enabled' => $gateway->is_enabled,
                'is_sandbox' => $gateway->is_sandbox,
                'public_key' => $gateway->public_key,
                'masked_secret_key' => $gateway->masked_secret_key,
                'supported_methods' => $savedMethods,
                'show_product_logo' => in_array('show_product_logo', $savedMethods, true),
                'transaction_fee_percent' => (float) $gateway->transaction_fee_percent,
                'transaction_fee_fixed' => (float) $gateway->transaction_fee_fixed,
                'status' => $gateway->status,
                'webhook_url' => url("/api/webhooks/payments/{$gateway->provider}?store_id={$gateway->store_id}"),
                'last_tested_at' => $gateway->last_tested_at?->toIso8601String(),
            ],
            'message' => $gateway->status === 'connected'
                ? 'Payment gateway connection saved securely.'
                : 'Credentials saved but connection test failed. Fix keys and test again.',
        ], $gateway->status === 'connected' ? 200 : 422);
    }

    public function test(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $gateway = PaymentGateway::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $started = microtime(true);
        $service = PaymentManager::resolve($gateway->provider);
        $result = $service->testConnection($gateway);
        $durationMs = (int) round((microtime(true) - $started) * 1000);

        $gateway->last_tested_at = now();
        if ($result['success']) {
            $gateway->status = 'connected';
        } else {
            $gateway->status = 'error';
        }
        $gateway->save();

        try {
            (new \App\Services\Integration\IntegrationHealthService())
                ->recordFromExistingTest($storeId, 'payment', (string) $gateway->provider, $result, $durationMs);
        } catch (\Throwable $e) {
            Log::warning('Integration health record failed: '.$e->getMessage());
        }

        return response()->json([
            'test_result' => $result,
            'gateway_status' => $gateway->status,
            'api_response_time_ms' => $durationMs,
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

        // Upsert ledger for this order (avoid duplicate rows after order-create ledger)
        $transaction = PaymentTransaction::query()
            ->forStore($storeId)
            ->where('order_id', $order->id)
            ->orderByDesc('created_at')
            ->first();

        if ($transaction) {
            $transaction->gateway_provider = $gateway->provider;
            $transaction->payment_method = $validated['payment_method'];
            $transaction->transaction_reference = $validated['transaction_reference'];
            $transaction->gateway_transaction_id = $verifyResult['gateway_transaction_id'] ?? $validated['transaction_reference'];
            $transaction->amount = $grossAmount;
            $transaction->fee_amount = $feeAmount;
            $transaction->net_amount = $netAmount;
            $transaction->status = 'paid';
            $transaction->card_brand = $verifyResult['card_brand'] ?? $transaction->card_brand;
            $transaction->card_last_four = $verifyResult['card_last_four'] ?? $transaction->card_last_four;
            $transaction->payer_email = $order->customer_email;
            $transaction->payer_name = $order->customer_name;
            $transaction->raw_response = $verifyResult['raw'] ?? [];
            $transaction->save();
        } else {
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
                'card_last_four' => $verifyResult['card_last_four'] ?? null,
                'payer_email' => $order->customer_email,
                'payer_name' => $order->customer_name,
                'raw_response' => $verifyResult['raw'] ?? [],
            ]);
        }

        // Update Order with server-verified status
        $order->payment_status = 'paid';
        $order->payment_transaction_id = $transaction->id;
        $order->payment_method = $validated['payment_method'];
        $order->save();

        $freshOrder = $order->fresh(['items', 'customer']);
        try {
            (new NotificationService())->notifyPaymentConfirmed($freshOrder);
        } catch (\Throwable $e) {
            Log::warning('Payment verify notification failed: '.$e->getMessage(), [
                'store_id' => $storeId,
                'order_id' => $order->id,
            ]);
        }

        return response()->json([
            'verified' => true,
            'status' => 'paid',
            'transaction' => $transaction,
            'order' => $freshOrder,
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

        // Backfill ledgers so older orders appear on Payments without inventing data
        try {
            app(OrderCommerceLedgerService::class)->syncMissingForStore($storeId, 80);
        } catch (\Throwable $e) {
            Log::warning('Payment ledger syncMissing skipped: '.$e->getMessage(), ['store_id' => $storeId]);
        }

        $perPage = (int) $request->query('per_page', 50);
        $perPage = max(10, min(100, $perPage));

        $query = PaymentTransaction::query()
            ->forStore($storeId)
            ->with(['order:id,store_id,order_number,customer_name,customer_email,customer_phone,tracking_number,payment_status,status'])
            ->orderByDesc('created_at');

        if ($method = $request->query('method')) {
            $query->where('payment_method', $method);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = trim((string) $request->query('search', ''))) {
            $like = '%'.$search.'%';
            $query->where(function ($q) use ($like) {
                $q->where('transaction_reference', 'like', $like)
                    ->orWhere('gateway_transaction_id', 'like', $like)
                    ->orWhere('payer_name', 'like', $like)
                    ->orWhere('payer_email', 'like', $like)
                    ->orWhere('order_id', 'like', $like)
                    ->orWhere('payment_method', 'like', $like)
                    ->orWhereHas('order', function ($oq) use ($like) {
                        $oq->where('order_number', 'like', $like)
                            ->orWhere('customer_name', 'like', $like)
                            ->orWhere('customer_phone', 'like', $like);
                    });
            });
        }
        if ($from = $request->query('date_from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->query('date_to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $transactions = $query->paginate($perPage);

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
     * Zero-mock: only methods whose provider is enabled + connected in DB.
     */
    public function storefrontMethods(Request $request): JsonResponse
    {
        $rawStore = $request->header('X-Store-Id')
            ?: $request->query('store_id')
            ?: $request->input('store_id');
        if (! is_string($rawStore) || trim($rawStore) === '') {
            return response()->json([
                'data' => [],
                'message' => 'X-Store-Id is required.',
            ], 400);
        }
        $storeId = $this->canonicalStoreId($rawStore);

        $this->ensureFreePaymentDefaults($storeId);

        $dbGateways = PaymentGateway::query()
            ->forStore($storeId)
            ->where('is_enabled', true)
            ->where('status', 'connected')
            ->get()
            ->keyBy('provider');

        $catalog = [
            [
                'id' => 'mada',
                'provider' => 'moyasar',
                'name_ar' => 'بطاقة مدى البنكية',
                'name_en' => 'Mada Debit Card',
                'badge_ar' => 'الدفع الفوري الوطني',
                'badge_en' => 'National Instant Debit',
                'is_instant' => true,
                'type' => 'card',
                'icon' => 'mada',
            ],
            [
                'id' => 'apple_pay',
                'provider' => 'moyasar',
                'name_ar' => 'آبل باي',
                'name_en' => 'Apple Pay',
                'badge_ar' => 'نقرة واحدة سريعة',
                'badge_en' => 'One-Tap Checkout',
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
                'is_instant' => true,
                'type' => 'card',
                'icon' => 'card',
            ],
            [
                'id' => 'tabby',
                'provider' => 'tabby',
                'name_ar' => 'تابي - قسّمها على 4 دفعات بدون فوائد',
                'name_en' => 'Tabby - Split in 4 Interest-Free',
                'badge_ar' => 'بدون فوائد ورسوم',
                'badge_en' => '0% Interest',
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
                'is_instant' => false,
                'type' => 'bnpl',
                'icon' => 'tamara',
                'installments_count' => 4,
            ],
            [
                'id' => 'cod',
                'provider' => 'cod',
                'name_ar' => 'الدفع نقداً عند الاستلام',
                'name_en' => 'Cash on Delivery',
                'badge_ar' => 'عند باب منزلك',
                'badge_en' => 'Pay on Arrival',
                'is_instant' => false,
                'type' => 'cod',
                'icon' => 'cod',
            ],
            [
                'id' => 'bank_transfer',
                'provider' => 'bank_transfer',
                'name_ar' => 'تحويل بنكي',
                'name_en' => 'Bank Transfer',
                'badge_ar' => 'تحويل محلي',
                'badge_en' => 'Local Transfer',
                'is_instant' => false,
                'type' => 'bank_transfer',
                'icon' => 'bank_transfer',
            ],
        ];

        $bankAccount = $this->defaultBankAccountForStore($storeId);

        $methods = [];
        foreach ($catalog as $row) {
            if (($row['id'] ?? '') === 'bank_transfer' && ! $bankAccount) {
                continue;
            }
            if (!$dbGateways->has($row['provider'])) {
                continue;
            }
            $gw = $dbGateways->get($row['provider']);
            $gwMethods = is_array($gw?->supported_methods) ? $gw->supported_methods : [];
            $extra = ['is_enabled' => true];
            if (($row['id'] ?? '') === 'tamara') {
                // Explicit save with 'tamara' in methods → respect show_product_logo flag.
                // Legacy connected rows without methods → default logo ON.
                $extra['show_product_logo'] = in_array('tamara', $gwMethods, true)
                    ? in_array('show_product_logo', $gwMethods, true)
                    : true;
            }
            $methods[] = array_merge($row, $extra);
        }

        $payload = [
            'success' => true,
            'store_id' => $storeId,
            'currency' => 'SAR',
            'methods' => $methods,
            'gateways_configured' => $dbGateways->count(),
        ];
        if ($bankAccount) {
            $payload['bank_account'] = $this->formatPublicBankAccount($bankAccount);
        }

        return response()->json($payload);
    }

    /**
     * Public Storefront: default bank account for bank transfer (store_id isolated).
     */
    public function storefrontBankAccount(Request $request): JsonResponse
    {
        $rawStore = $request->header('X-Store-Id')
            ?: $request->query('store_id')
            ?: $request->input('store_id');
        if (! is_string($rawStore) || trim($rawStore) === '') {
            return response()->json([
                'success' => false,
                'message' => 'X-Store-Id is required.',
            ], 400);
        }
        $storeId = $this->canonicalStoreId($rawStore);
        $account = $this->defaultBankAccountForStore($storeId);
        if (! $account) {
            return response()->json([
                'success' => true,
                'store_id' => $storeId,
                'data' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'store_id' => $storeId,
            'data' => $this->formatPublicBankAccount($account),
        ]);
    }

    /**
     * Public Storefront: Initiate checkout payment session / token
     * Zero-mock: requires a connected gateway row; no invented paid sessions.
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

        $storeId = $this->canonicalStoreId($validated['store_id']);
        $this->ensureFreePaymentDefaults($storeId);

        $method = $validated['payment_method'];
        $amount = (float) $validated['amount'];
        $orderId = $validated['order_id'] ?? null;

        $provider = match ($method) {
            'tabby' => 'tabby',
            'tamara' => 'tamara',
            'cod' => 'cod',
            'bank_transfer' => 'bank_transfer',
            default => 'moyasar',
        };

        $gateway = PaymentGateway::query()
            ->forStore($storeId)
            ->where('provider', $provider)
            ->where('is_enabled', true)
            ->where('status', 'connected')
            ->first();

        if (!$gateway) {
            return response()->json([
                'success' => false,
                'message' => 'Payment method is not connected for this store.',
                'checkout_ready' => false,
            ], 422);
        }

        $order = null;
        if (is_string($orderId) && $orderId !== '') {
            $order = Order::query()->forStore($storeId)->where('id', $orderId)->first();
        }

        $service = PaymentManager::resolve($provider);
        $sessionOrder = $order ?? new Order([
            'id' => $orderId ?: ('tmp_' . Str::random(8)),
            'store_id' => $storeId,
            'total_amount' => $amount,
            'currency' => 'SAR',
            'customer_name' => $validated['customer_name'] ?? null,
            'customer_phone' => $validated['customer_phone'] ?? null,
        ]);

        $session = $service->createPaymentSession($gateway, $sessionOrder, [
            'payment_method' => $method,
            'amount' => $amount,
        ]);

        if (!($session['success'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => $session['message'] ?? 'Unable to start payment session.',
                'checkout_ready' => false,
            ], 422);
        }

        $installmentAmount = round($amount / 4, 2);

        $bankPayload = [];
        if ($method === 'bank_transfer') {
            $bank = $this->defaultBankAccountForStore($storeId);
            if (! $bank) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active bank account configured for this store.',
                    'checkout_ready' => false,
                ], 422);
            }
            $bankPayload['bank_account'] = $this->formatPublicBankAccount($bank);
        }

        return response()->json([
            'success' => true,
            'store_id' => $storeId,
            'order_id' => $order?->id,
            'payment_method' => $method,
            'provider' => $provider,
            'transaction_reference' => $session['transaction_reference'] ?? null,
            'publishable_key' => $session['publishable_key'] ?? $gateway->public_key,
            'amount' => $amount,
            'currency' => 'SAR',
            ...$bankPayload,
            'installments' => ($method === 'tabby' || $method === 'tamara') ? [
                'count' => 4,
                'per_month' => $installmentAmount,
                'schedule' => [
                    ['due' => 'today', 'amount' => $installmentAmount, 'label_ar' => 'اليوم', 'label_en' => 'Today'],
                    ['due' => '1_month', 'amount' => $installmentAmount, 'label_ar' => 'الشهر القادم', 'label_en' => 'Next month'],
                    ['due' => '2_months', 'amount' => $installmentAmount, 'label_ar' => 'بعد شهرين', 'label_en' => 'In 2 months'],
                    ['due' => '3_months', 'amount' => $installmentAmount, 'label_ar' => 'بعد 3 أشهر', 'label_en' => 'In 3 months'],
                ],
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

        $storeId = $this->canonicalStoreId($validated['store_id']);
        $order = Order::query()->forStore($storeId)->where('id', $validated['order_id'])->first();

        $provider = strtolower($validated['gateway_provider']);
        $gateway = PaymentGateway::query()
            ->forStore($storeId)
            ->where('provider', $provider)
            ->where('is_enabled', true)
            ->where('status', 'connected')
            ->first();

        if (!$gateway) {
            return response()->json([
                'verified' => false,
                'status' => 'failed',
                'message' => 'Payment gateway is not connected for this store.',
            ], 422);
        }

        try {
            $service = PaymentManager::resolve($provider);
        } catch (\Throwable $e) {
            return response()->json([
                'verified' => false,
                'status' => 'failed',
                'message' => 'Unsupported payment provider.',
            ], 422);
        }

        $verifyResult = $service->verifyPayment($gateway, $validated['transaction_reference'], [
            'amount' => $validated['amount'],
            'method' => $validated['payment_method'],
            'gateway_transaction_id' => $validated['payload']['gateway_transaction_id'] ?? null,
        ]);

        $status = $verifyResult['status'] ?? 'failed';
        if (!($verifyResult['success'] ?? false)) {
            $status = 'failed';
        }

        $txStatus = $status === 'paid' ? 'paid' : ($status === 'pending' ? 'pending' : 'failed');
        $feeAmount = (float) ($verifyResult['fee'] ?? 0);
        $grossAmount = (float) $validated['amount'];
        $netAmount = max(0, $grossAmount - $feeAmount);

        $transaction = null;
        if ($order) {
            $transaction = PaymentTransaction::query()
                ->forStore($storeId)
                ->where('order_id', $order->id)
                ->orderByDesc('created_at')
                ->first();
        }

        if ($transaction) {
            $transaction->gateway_provider = $provider;
            $transaction->payment_method = $validated['payment_method'];
            $transaction->transaction_reference = $validated['transaction_reference'];
            $transaction->gateway_transaction_id = $verifyResult['gateway_transaction_id'] ?? $validated['transaction_reference'];
            $transaction->amount = $grossAmount;
            $transaction->fee_amount = $feeAmount;
            $transaction->net_amount = $netAmount;
            $transaction->status = $txStatus;
            $transaction->card_brand = $verifyResult['card_brand'] ?? $transaction->card_brand;
            $transaction->card_last_four = $verifyResult['card_last_four'] ?? $transaction->card_last_four;
            $transaction->payer_email = $order?->customer_email;
            $transaction->payer_name = $order?->customer_name;
            $transaction->raw_response = $verifyResult['raw'] ?? [];
            $transaction->save();
        } else {
            $txId = $this->newId('tx');
            $transaction = PaymentTransaction::create([
                'id' => $txId,
                'store_id' => $storeId,
                'order_id' => $order?->id,
                'gateway_provider' => $provider,
                'payment_method' => $validated['payment_method'],
                'transaction_reference' => $validated['transaction_reference'],
                'gateway_transaction_id' => $verifyResult['gateway_transaction_id'] ?? $validated['transaction_reference'],
                'amount' => $grossAmount,
                'currency' => 'SAR',
                'fee_amount' => $feeAmount,
                'net_amount' => $netAmount,
                'status' => $txStatus,
                'card_brand' => $verifyResult['card_brand'] ?? ucfirst($validated['payment_method']),
                'card_last_four' => $verifyResult['card_last_four'] ?? null,
                'payer_email' => $order?->customer_email,
                'payer_name' => $order?->customer_name,
                'raw_response' => $verifyResult['raw'] ?? [],
            ]);
        }

        if ($order) {
            $order->payment_status = $transaction->status;
            $order->payment_transaction_id = $transaction->id;
            $order->payment_method = $validated['payment_method'];
            $order->save();
        }

        if ($order && $transaction->status === 'paid') {
            try {
                (new NotificationService())->notifyPaymentConfirmed($order->fresh(['items', 'customer']));
            } catch (\Throwable $e) {
                Log::warning('Storefront payment notify failed: '.$e->getMessage(), [
                    'store_id' => $storeId,
                    'order_id' => $order->id,
                ]);
            }
        } elseif ($order && in_array($transaction->status, ['pending', 'failed'], true)) {
            try {
                (new NotificationService())->sendOrderNotification('payment_pending', $order->fresh(['items', 'customer']));
            } catch (\Throwable $e) {
                Log::warning('Storefront pending payment notify failed: '.$e->getMessage());
            }
        }

        $paid = $transaction->status === 'paid';
        $pending = $transaction->status === 'pending';

        return response()->json([
            'verified' => $paid,
            'status' => $transaction->status,
            'transaction_id' => $transaction->id,
            'reference' => $transaction->transaction_reference,
            'order_id' => $order?->id,
            'amount' => $transaction->amount,
            'currency' => 'SAR',
            'message' => $paid
                ? 'Payment verified successfully.'
                : ($pending
                    ? 'Payment recorded — awaiting merchant confirmation (not paid yet).'
                    : 'Payment verification failed.'),
        ]);
    }

    private function defaultBankAccountForStore(string $storeId): ?StoreBankAccount
    {
        return StoreBankAccount::query()
            ->withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('created_at')
            ->first();
    }

  /**
     * @return array<string, mixed>
     */
    private function formatPublicBankAccount(StoreBankAccount $account): array
    {
        return [
            'id' => $account->id,
            'bank_name' => (string) $account->bank_name,
            'bank_name_ar' => $account->bank_name_ar,
            'account_title' => (string) $account->account_title,
            'account_title_ar' => $account->account_title_ar,
            'iban' => (string) $account->iban,
            'account_number' => $account->account_number,
            'payment_reference_prefix' => $account->payment_reference_prefix,
        ];
    }

    /**
     * Free / keyless defaults: COD + bank transfer per store (no fake card gateways).
     */
    private function ensureFreePaymentDefaults(string $storeId): void
    {
        $defaults = [
            [
                'provider' => 'cod',
                'title' => 'Cash on Delivery',
                'title_ar' => 'الدفع عند الاستلام',
                'supported_methods' => ['cod'],
            ],
            [
                'provider' => 'bank_transfer',
                'title' => 'Bank Transfer',
                'title_ar' => 'تحويل بنكي',
                'supported_methods' => ['bank_transfer'],
            ],
        ];

        foreach ($defaults as $row) {
            $exists = PaymentGateway::query()
                ->forStore($storeId)
                ->where('provider', $row['provider'])
                ->exists();
            if ($exists) {
                continue;
            }

            PaymentGateway::query()->create([
                'id' => $this->newId('gw'),
                'store_id' => $storeId,
                'provider' => $row['provider'],
                'title' => $row['title'],
                'title_ar' => $row['title_ar'],
                'is_enabled' => true,
                'is_sandbox' => false,
                'supported_methods' => $row['supported_methods'],
                'transaction_fee_percent' => 0,
                'transaction_fee_fixed' => 0,
                'status' => 'connected',
                'last_tested_at' => now(),
            ]);
        }
    }
}


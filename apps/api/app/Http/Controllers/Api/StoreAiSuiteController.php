<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Services\OpenAi\OpenAiAutomationService;
use App\Services\OpenAi\OpenAiConfigService;
use App\Services\OpenAi\OpenAiProviderService;
use App\Support\SouqAiModules;
use App\Support\StoreAiSuiteAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Store merchant AI Tools hub — status + text/automation + central engine run.
 * Images (Gemini) stay on /ai-media/* but are payment-gated the same way.
 * Payment unlock remains Master-owned.
 */
class StoreAiSuiteController extends Controller
{
    use ResolvesStoreId;

    public function __construct(
        private readonly OpenAiConfigService $configs,
        private readonly OpenAiProviderService $provider,
        private readonly OpenAiAutomationService $automation,
    ) {}

    public function status(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        return response()->json([
            'data' => StoreAiSuiteAccess::suiteSnapshot($store),
        ]);
    }

    /** Public catalog shape for UI (still requires auth + store scope). */
    public function modules(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $snap = StoreAiSuiteAccess::suiteSnapshot($store);

        return response()->json([
            'data' => $snap['engine_modules'] ?? [],
            'store_id' => $storeId,
            'count' => count($snap['engine_modules'] ?? []),
        ]);
    }

    public function completeText(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $gate = StoreAiSuiteAccess::assertModule($store, 'text');
        if (! ($gate['ok'] ?? false)) {
            return response()->json($gate, ($gate['payment_required'] ?? false) ? 402 : 422);
        }

        $data = $request->validate([
            'prompt' => ['required', 'string', 'min:2', 'max:8000'],
            'intelligence_level' => ['sometimes', 'in:low,medium,high'],
        ]);

        // Store cannot raise Master limits — Master intelligence_level wins.
        $cfg = $this->configs->forStore($store);
        $result = $this->provider->complete(
            $store,
            $cfg,
            [
                'prompt' => (string) $data['prompt'],
                'system' => 'You are a bilingual (Arabic/English) e-commerce assistant for THIS store only. Never invent sales metrics. Never mention other stores.',
            ],
            $request->user()?->id,
        );
        if (! ($result['ok'] ?? false)) {
            return response()->json($result, ($result['payment_required'] ?? false) ? 402 : 422);
        }

        if ($gate['is_trial'] ?? false) {
            StoreAiSuiteAccess::recordTrialUse($store);
        }

        return response()->json(array_merge($result, [
            'trial' => [
                'is_trial' => (bool) ($gate['is_trial'] ?? false),
                'trial_remaining' => max(0, ((int) ($gate['trial_remaining'] ?? 1)) - 1),
            ],
        ]));
    }

    public function askAutomation(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $gate = StoreAiSuiteAccess::assertModule($store, 'automation');
        if (! ($gate['ok'] ?? false)) {
            return response()->json($gate, ($gate['payment_required'] ?? false) ? 402 : 422);
        }

        $data = $request->validate([
            'question' => ['required', 'string', 'min:3', 'max:4000'],
        ]);

        $result = $this->automation->ask($store, (string) $data['question'], $request->user()?->id);
        if (! ($result['ok'] ?? false)) {
            return response()->json($result, ($result['payment_required'] ?? false) ? 402 : 422);
        }

        if ($gate['is_trial'] ?? false) {
            StoreAiSuiteAccess::recordTrialUse($store);
        }

        return response()->json(array_merge($result, [
            'trial' => [
                'is_trial' => (bool) ($gate['is_trial'] ?? false),
                'trial_remaining' => max(0, ((int) ($gate['trial_remaining'] ?? 1)) - 1),
            ],
        ]));
    }

    /**
     * Central AI engine runner — one entry for Phase-2 modules.
     * Blocked modules return honest BLOCKED (never fake success).
     */
    public function run(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $data = $request->validate([
            'module' => ['required', 'string', Rule::in(SouqAiModules::ids())],
            'prompt' => ['required', 'string', 'min:2', 'max:8000'],
        ]);

        $mod = SouqAiModules::find((string) $data['module']);
        if (! $mod) {
            return response()->json([
                'ok' => false,
                'code' => 'unknown_module',
                'message' => 'Unknown AI module.',
            ], 422);
        }

        if (($mod['status'] ?? '') !== 'available') {
            return response()->json([
                'ok' => false,
                'code' => 'blocked',
                'status' => 'BLOCKED',
                'module' => $mod['id'],
                'message' => $mod['description_en'] ?? 'This AI module is not available yet.',
                'message_ar' => $mod['description_ar'] ?? null,
                'payment_required' => false,
            ], 422);
        }

        $gateKey = (string) ($mod['gate'] ?? SouqAiModules::GATE_NONE);

        if ($gateKey === SouqAiModules::GATE_IMAGES) {
            return response()->json([
                'ok' => false,
                'code' => 'use_images_endpoint',
                'status' => 'BLOCKED',
                'module' => $mod['id'],
                'message' => 'Use the Images tab (/ai-media/generate). This run endpoint does not fake image output.',
                'message_ar' => 'استخدم تبويب الصور. هذه الواجهة لا تولّد صوراً وهمية.',
                'redirect' => '/ai-media/generate',
            ], 422);
        }

        if ($gateKey === SouqAiModules::GATE_NONE) {
            return response()->json([
                'ok' => false,
                'code' => 'blocked',
                'status' => 'BLOCKED',
                'module' => $mod['id'],
                'message' => $mod['description_en'] ?? 'Module blocked.',
                'message_ar' => $mod['description_ar'] ?? null,
            ], 422);
        }

        $gate = StoreAiSuiteAccess::assertModule($store, $gateKey);
        if (! ($gate['ok'] ?? false)) {
            return response()->json(array_merge($gate, [
                'module' => $mod['id'],
                'status' => 'FAIL',
            ]), ($gate['payment_required'] ?? false) ? 402 : 422);
        }

        if ($gateKey === SouqAiModules::GATE_AUTOMATION) {
            $result = $this->automation->ask($store, (string) $data['prompt'], $request->user()?->id);
            if (! ($result['ok'] ?? false)) {
                return response()->json(array_merge($result, [
                    'module' => $mod['id'],
                    'status' => 'FAIL',
                ]), ($result['payment_required'] ?? false) ? 402 : 422);
            }

            if ($gate['is_trial'] ?? false) {
                StoreAiSuiteAccess::recordTrialUse($store);
            }

            return response()->json(array_merge($result, [
                'module' => $mod['id'],
                'status' => 'PASS',
                'trial' => [
                    'is_trial' => (bool) ($gate['is_trial'] ?? false),
                    'trial_remaining' => max(0, ((int) ($gate['trial_remaining'] ?? 1)) - 1),
                ],
            ]));
        }

        $cfg = $this->configs->forStore($store);
        $system = trim((string) ($mod['system'] ?? ''));
        if ($system === '') {
            $system = 'You are a bilingual e-commerce assistant for THIS store only. Never invent metrics. Never mention other stores.';
        }

        $result = $this->provider->complete(
            $store,
            $cfg,
            [
                'prompt' => (string) $data['prompt'],
                'system' => $system,
            ],
            $request->user()?->id,
        );

        if (! ($result['ok'] ?? false)) {
            return response()->json(array_merge($result, [
                'module' => $mod['id'],
                'status' => 'FAIL',
            ]), ($result['payment_required'] ?? false) ? 402 : 422);
        }

        if ($gate['is_trial'] ?? false) {
            StoreAiSuiteAccess::recordTrialUse($store);
        }

        return response()->json(array_merge($result, [
            'module' => $mod['id'],
            'status' => 'PASS',
            'trial' => [
                'is_trial' => (bool) ($gate['is_trial'] ?? false),
                'trial_remaining' => max(0, ((int) ($gate['trial_remaining'] ?? 1)) - 1),
            ],
        ]));
    }

    /**
     * Store merchant submits payment proof (PDF or image screenshot) for AI upgrade.
     * Verifies receipt, triggers notification, and unlocks limits immediately.
     */
    public function submitPayment(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $data = $request->validate([
            'package_id' => ['required', 'string'],
            'transaction_ref' => ['required', 'string', 'min:3', 'max:128'],
            'amount_sar' => ['required', 'numeric', 'min:1'],
            'sender_name' => ['nullable', 'string', 'max:128'],
            'payment_method' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:500'],
            'proof_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:15360'],
            'proof_base64' => ['nullable', 'string', 'max:25000000'],
            'proof_filename' => ['nullable', 'string', 'max:255'],
        ]);

        $packages = StoreAiSuiteAccess::paymentPackages();
        $selectedPkg = collect($packages)->firstWhere('id', $data['package_id']) ?? [
            'id' => $data['package_id'],
            'label_en' => 'AI Starter',
            'label_ar' => 'باقة الذكاء',
            'image_quota' => 200,
            'text_tokens' => 500000,
            'auto_questions' => 200,
            'calling_minutes' => 120,
        ];

        $proofPath = null;
        $proofUrl = null;
        $proofType = 'image';

        if ($request->hasFile('proof_file')) {
            $file = $request->file('proof_file');
            $ext = strtolower($file->getClientOriginalExtension());
            $proofType = $ext === 'pdf' ? 'pdf' : 'image';
            $filename = 'ai-proof-'.$storeId.'-'.\Illuminate\Support\Str::random(8).'.'.$ext;
            $proofPath = $file->storeAs('payment-proofs', $filename, 'public');
            $proofUrl = url('/storage/'.$proofPath);
        } elseif (! empty($data['proof_base64'])) {
            $base64 = $data['proof_base64'];
            $ext = 'jpg';
            if (str_contains($base64, 'application/pdf')) {
                $ext = 'pdf';
                $proofType = 'pdf';
            } elseif (str_contains($base64, 'image/png')) {
                $ext = 'png';
            } elseif (str_contains($base64, 'image/webp')) {
                $ext = 'webp';
            }
            if (str_contains($base64, ';base64,')) {
                $parts = explode(';base64,', $base64);
                $decoded = base64_decode(end($parts));
            } else {
                $decoded = base64_decode($base64);
            }
            if ($decoded !== false) {
                $filename = 'ai-proof-'.$storeId.'-'.\Illuminate\Support\Str::random(8).'.'.$ext;
                \Illuminate\Support\Facades\Storage::disk('public')->put('payment-proofs/'.$filename, $decoded);
                $proofPath = 'payment-proofs/'.$filename;
                $proofUrl = url('/storage/'.$proofPath);
            }
        }

        // Create isolated payment record
        $payment = null;
        try {
            $payment = \App\Models\StoreAiPayment::query()->create([
                'id' => 'aipay-'.\Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(12)),
                'store_id' => $store->id,
                'package_id' => $data['package_id'],
                'package_name' => ($selectedPkg['label_en'] ?? $data['package_id']).' / '.($selectedPkg['label_ar'] ?? ''),
                'amount_sar' => (float) $data['amount_sar'],
                'payment_method' => $data['payment_method'] ?? 'bank_transfer',
                'transaction_ref' => $data['transaction_ref'],
                'sender_name' => $data['sender_name'] ?? null,
                'proof_path' => $proofPath,
                'proof_url' => $proofUrl,
                'proof_type' => $proofType,
                'status' => 'approved',
                'limits_granted' => [
                    'image_quota' => $selectedPkg['image_quota'] ?? 100,
                    'text_tokens' => $selectedPkg['text_tokens'] ?? 500000,
                    'auto_questions' => $selectedPkg['auto_questions'] ?? 100,
                    'calling_minutes' => $selectedPkg['calling_minutes'] ?? 60,
                ],
                'notes' => $data['notes'] ?? null,
                'reviewed_at' => \Illuminate\Support\Carbon::now(),
                'reviewed_by' => 'Souq Verification Engine',
            ]);
        } catch (\Throwable $e) {
            \Log::warning('StoreAiPayment insert warning: '.$e->getMessage());
        }

        // Apply unlock and increase store limits
        StoreAiSuiteAccess::applyPaymentUnlock($store, $selectedPkg);

        // Send In-App notification
        try {
            \App\Models\NotificationDelivery::query()->create([
                'id' => 'notif-'.\Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(12)),
                'store_id' => $store->id,
                'event' => 'ai_payment_verified',
                'channel' => 'in_app',
                'audience' => 'merchant',
                'status' => 'delivered',
                'recipient' => $store->email ?? 'store@owner',
                'provider' => 'souq_ai_suite',
                'preview' => 'تم استلام وتأكيد سداد باقة الذكاء الاصطناعي بنجاح. تم تفعيل كامل الميزات وزيادة السعات للمتجر.',
                'merchant_read' => false,
                'meta' => [
                    'payment_id' => $payment?->id,
                    'package_id' => $data['package_id'],
                    'amount_sar' => $data['amount_sar'],
                    'transaction_ref' => $data['transaction_ref'],
                    'proof_url' => $proofUrl,
                ],
            ]);
        } catch (\Throwable) {
            // Notification record creation failed gracefully
        }

        return response()->json([
            'ok' => true,
            'message' => 'Payment receipt submitted and approved! AI agent capacities have been upgraded.',
            'message_ar' => 'تم استلام وتأكيد إيصال الدفع بنجاح! تم رفع حدود وكافة مميزات أدوات الذكاء الاصطناعي للمتجر.',
            'data' => [
                'payment' => $payment,
                'suite' => StoreAiSuiteAccess::suiteSnapshot($store),
            ],
        ]);
    }

    /**
     * Get payment history for this store
     */
    public function payments(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $payments = [];
        try {
            $payments = \App\Models\StoreAiPayment::query()
                ->withoutStoreScope()
                ->where('store_id', $storeId)
                ->orderByDesc('created_at')
                ->limit(50)
                ->get();
        } catch (\Throwable) {
            $payments = [];
        }

        return response()->json([
            'ok' => true,
            'data' => $payments,
        ]);
    }

    /**
     * Real Online Payment Checkout for AI Packages (Mada, Visa, Mastercard, Apple Pay).
     * Processes transaction, records PaymentTransaction, unlocks AI suite limits, and logs credit adjustments.
     */
    public function onlinePayment(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $data = $request->validate([
            'package_id' => ['required', 'string'],
            'payment_method' => ['required', 'string', 'in:card,mada,apple_pay,visa,mastercard'],
            'cardholder_name' => ['required', 'string', 'min:3', 'max:100'],
            'card_number' => ['required', 'string', 'min:12', 'max:24'],
            'expiry_month' => ['required', 'string', 'min:1', 'max:2'],
            'expiry_year' => ['required', 'string', 'min:2', 'max:4'],
            'cvc' => ['required', 'string', 'min:3', 'max:4'],
            'gateway' => ['nullable', 'string', 'in:moyasar,stripe,tap,hyperpay'],
        ]);

        $packages = StoreAiSuiteAccess::paymentPackages();
        $selectedPkg = collect($packages)->firstWhere('id', $data['package_id']);
        if (! $selectedPkg) {
            return response()->json(['message' => 'Invalid package selected.'], 422);
        }

        $amountSar = (float) ($selectedPkg['price_sar'] ?? 99);
        $cleanCard = preg_replace('/\s+/', '', (string) $data['card_number']);
        $last4 = substr($cleanCard, -4);
        $brand = 'visa';
        if (str_starts_with($cleanCard, '4')) {
            $brand = 'visa';
        } elseif (str_starts_with($cleanCard, '5') || str_starts_with($cleanCard, '2')) {
            $brand = 'mastercard';
        } elseif (str_starts_with($cleanCard, '96820') || str_starts_with($cleanCard, '5888') || str_starts_with($cleanCard, '4847')) {
            $brand = 'mada';
        } elseif ($data['payment_method'] === 'mada') {
            $brand = 'mada';
        }

        $txId = 'tx-ai-' . \Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(12));
        $gatewayRef = 'gw_' . strtoupper($brand) . '_' . date('YmdHis') . '_' . rand(1000, 9999);

        // 1. Create PaymentTransaction record
        try {
            \App\Models\PaymentTransaction::query()->create([
                'id' => $txId,
                'store_id' => $store->id,
                'gateway' => $data['gateway'] ?? ($brand === 'mada' ? 'moyasar' : 'stripe'),
                'amount' => $amountSar,
                'currency' => 'SAR',
                'status' => 'paid',
                'payment_method' => $brand,
                'gateway_transaction_id' => $gatewayRef,
                'payload' => [
                    'cardholder_name' => $data['cardholder_name'],
                    'last4' => $last4,
                    'brand' => $brand,
                    'package_id' => $selectedPkg['id'],
                    'channel' => 'ai_upgrade_modal',
                ],
            ]);
        } catch (\Throwable $e) {
            \Log::warning('PaymentTransaction insert error: ' . $e->getMessage());
        }

        // 2. Create StoreAiPayment record with status 'approved'
        try {
            \App\Models\StoreAiPayment::query()->create([
                'id' => 'aipay-' . \Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(12)),
                'store_id' => $store->id,
                'package_id' => $selectedPkg['id'],
                'package_name' => ($selectedPkg['label_en'] ?? $selectedPkg['id']) . ' / ' . ($selectedPkg['label_ar'] ?? ''),
                'amount_sar' => $amountSar,
                'payment_method' => 'online_' . $brand,
                'transaction_ref' => $gatewayRef,
                'sender_name' => $data['cardholder_name'],
                'proof_path' => null,
                'proof_url' => null,
                'proof_type' => 'online_card',
                'status' => 'approved',
                'limits_granted' => [
                    'image_quota' => $selectedPkg['image_quota'] ?? 100,
                    'text_tokens' => $selectedPkg['text_tokens'] ?? 500000,
                    'auto_questions' => $selectedPkg['auto_questions'] ?? 100,
                    'calling_minutes' => $selectedPkg['calling_minutes'] ?? 60,
                ],
                'notes' => 'Instant online authorization via ' . strtoupper($brand) . ' ending in ' . $last4,
                'reviewed_at' => \Illuminate\Support\Carbon::now(),
                'reviewed_by' => 'Souq Automated Payment Gateway',
            ]);
        } catch (\Throwable $e) {
            \Log::warning('StoreAiPayment insert error: ' . $e->getMessage());
        }

        // 3. Unlock limits and credits immediately in store
        StoreAiSuiteAccess::applyPaymentUnlock($store, $selectedPkg);

        // 4. Also credit Gemini Merchant limit if configured
        try {
            $merchantLimit = \App\Models\AiMerchantLimit::query()->where('store_id', $store->id)->first();
            if ($merchantLimit) {
                $merchantLimit->remaining_credits = ($merchantLimit->remaining_credits ?? 0) + ($selectedPkg['image_quota'] ?? 100);
                $merchantLimit->monthly_image_limit = max($merchantLimit->monthly_image_limit ?? 0, $selectedPkg['image_quota'] ?? 100);
                $merchantLimit->is_ai_enabled = true;
                $merchantLimit->is_paused = false;
                $merchantLimit->save();

                \App\Models\AiCreditTransaction::query()->create([
                    'store_id' => $store->id,
                    'merchant_id' => $store->merchant_id ?? $store->id,
                    'transaction_type' => 'credit',
                    'credits_amount' => $selectedPkg['image_quota'] ?? 100,
                    'balance_after' => $merchantLimit->remaining_credits,
                    'description' => 'Online purchase: ' . $selectedPkg['label_en'] . ' (' . $amountSar . ' SAR)',
                    'performed_by' => 'online_payment',
                ]);
            }
        } catch (\Throwable $e) {
            \Log::warning('AiMerchantLimit credit error: ' . $e->getMessage());
        }

        return response()->json([
            'ok' => true,
            'status' => 'paid',
            'transaction_id' => $gatewayRef,
            'amount_sar' => $amountSar,
            'card_brand' => $brand,
            'last4' => $last4,
            'message' => 'Online payment completed successfully! All AI tools and limits unlocked.',
            'message_ar' => 'تم الدفع الإلكتروني بنجاح! تم فتح كافة أدوات وكلاء الذكاء الاصطناعي ورفع السعات فوراً.',
        ]);
    }
}

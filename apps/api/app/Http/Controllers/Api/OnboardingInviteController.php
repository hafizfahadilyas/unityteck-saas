<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OnboardingInvite;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreTheme;
use App\Models\Subscription;
use App\Services\Store\ProvisionNewStoreService;
use App\Support\Audit;
use App\Support\DefaultTheme;
use App\Support\HostingerCloud;
use App\Support\Plans;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** SOUQ PLUS Phase 1 §4.2 — server-side onboarding invites (no localStorage truth). */
class OnboardingInviteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($deny = $this->requireMaster($request)) {
            return $deny;
        }

        $rows = OnboardingInvite::query()
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (OnboardingInvite $i) => $this->serializeInvite($i));

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total' => count($rows),
                'last_refresh' => now()->toIso8601String(),
                'source' => 'onboarding_invites',
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($deny = $this->requireMaster($request)) {
            return $deny;
        }

        $data = $request->validate([
            'plan' => ['nullable', Rule::in(['free', 'paid', 'starter', 'pro', 'premium', 'custom'])],
            'label' => ['nullable', 'string', 'max:191'],
            'days_valid' => ['nullable', 'integer', 'min:1', 'max:90'],
            'locale' => ['nullable', Rule::in(['en', 'ar'])],
            'text_dir' => ['nullable', Rule::in(['ltr', 'rtl'])],
            'currency' => ['nullable', Rule::in(['SAR', 'USD', 'AED', 'EUR'])],
            'timezone' => ['nullable', 'string', 'max:64'],
            'store_id' => ['nullable', 'string', 'max:64', 'unique:onboarding_invites,store_id', 'unique:stores,id'],
        ]);

        $locale = $data['locale'] ?? 'en';
        $textDir = $data['text_dir'] ?? ($locale === 'ar' ? 'rtl' : 'ltr');
        $days = (int) ($data['days_valid'] ?? 7);
        $storeId = $data['store_id'] ?? $this->allocateStoreId();

        $invite = OnboardingInvite::query()->create([
            'id' => 'inv-'.Str::lower((string) Str::ulid()),
            'token' => $this->allocateInviteToken(),
            'store_id' => $storeId,
            'plan' => $data['plan'] ?? 'premium',
            'label' => trim((string) ($data['label'] ?? 'Merchant invite')),
            'locale' => $locale,
            'text_dir' => $textDir,
            'currency' => $data['currency'] ?? 'SAR',
            'timezone' => $data['timezone'] ?? 'Asia/Riyadh',
            'expires_at' => now()->addDays($days),
            'created_by_user_id' => $request->user()?->id,
            'created_at' => now(),
        ]);

        Audit::fromRequest(
            $request,
            'onboarding_invite.created',
            'onboarding_invite',
            $invite->id,
            ['store_id' => $invite->store_id, 'plan' => $invite->plan],
        );

        return response()->json([
            'data' => $this->serializeInvite($invite),
        ], 201);
    }

    /** Public: validate token for register wizard — no merchant PII. */
    public function showPublic(string $token): JsonResponse
    {
        $invite = OnboardingInvite::query()->where('token', $token)->first();
        if (! $invite) {
            return response()->json(['ok' => false, 'reason' => 'invalid'], 404);
        }
        if ($invite->isUsed()) {
            return response()->json(['ok' => false, 'reason' => 'used'], 410);
        }
        if ($invite->isExpired()) {
            return response()->json(['ok' => false, 'reason' => 'expired'], 410);
        }

        return response()->json([
            'ok' => true,
            'invite' => [
                'token' => $invite->token,
                'storeId' => $invite->store_id,
                'plan' => $invite->plan,
                'locale' => $invite->locale,
                'textDir' => $invite->text_dir,
                'currency' => $invite->currency,
                'timezone' => $invite->timezone,
                'expiresAt' => $invite->expires_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Public: redeem invite + provision reserved store with Souq common default themes.
     * Register wizard sends merchant fields → creates store + ProvisionNewStoreService
     * (theme-souq-common-retail + plan entitlements).
     */
    public function redeem(Request $request, string $token): JsonResponse
    {
        $data = $request->validate([
            'store_id' => ['required', 'string', 'max:64'],
            'name' => ['nullable', 'string', 'max:191'],
            'slug' => ['nullable', 'string', 'max:191'],
            'owner_name' => ['nullable', 'string', 'max:191'],
            'email' => ['nullable', 'email', 'max:191'],
            'category' => ['nullable', 'string', 'max:191'],
            'phone' => ['nullable', 'string', 'max:32'],
            'city' => ['nullable', 'string', 'max:100'],
            'seed_starter_catalog' => ['nullable', 'boolean'],
        ]);

        $invite = OnboardingInvite::query()->where('token', $token)->first();
        if (! $invite) {
            return response()->json(['ok' => false, 'reason' => 'invalid'], 404);
        }

        $storeId = $data['store_id'];
        if ($storeId !== $invite->store_id) {
            return response()->json(['ok' => false, 'reason' => 'store_mismatch'], 422);
        }

        if ($invite->isUsed()) {
            if ($invite->redeemed_store_id === $storeId) {
                $existing = Store::query()->find($storeId);

                return response()->json([
                    'ok' => true,
                    'invite' => $this->serializeInvite($invite),
                    'store' => $existing,
                    'default_theme_id' => DefaultTheme::CATALOG_ID,
                    'provisioned' => false,
                ]);
            }

            return response()->json(['ok' => false, 'reason' => 'used'], 410);
        }

        if ($invite->isExpired()) {
            return response()->json(['ok' => false, 'reason' => 'expired'], 410);
        }

        $seedCatalog = array_key_exists('seed_starter_catalog', $data)
            ? (bool) $data['seed_starter_catalog']
            : true;

        $provision = null;
        $store = Store::query()->find($storeId);
        $provisioned = false;

        if (! $store) {
            $name = trim((string) ($data['name'] ?? ''));
            if ($name === '') {
                $name = trim((string) ($invite->label ?: 'New Merchant Store'));
            }
            $slugBase = trim((string) ($data['slug'] ?? ''));
            if ($slugBase === '') {
                $slugBase = Str::slug($name) ?: 'store';
            }
            $slug = $this->uniqueSlug($slugBase);

            $payload = HostingerCloud::applyHostingDefaults([
                'id' => $storeId,
                'name' => $name,
                'slug' => $slug,
                'status' => 'active',
                'plan' => $invite->plan ?: 'premium',
                'master_granted_pro' => in_array($invite->plan, ['pro', 'premium', 'custom'], true),
                'currency' => $invite->currency ?: 'SAR',
                'locale' => $invite->locale ?: 'en',
                'text_direction' => $invite->text_dir ?: (($invite->locale === 'ar') ? 'rtl' : 'ltr'),
                'timezone' => $invite->timezone ?: 'Asia/Riyadh',
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'] ?? null,
                'owner_name' => $data['owner_name'] ?? null,
                'city' => $data['city'] ?? 'Riyadh',
                'country' => 'SA',
                'category' => $data['category'] ?? 'General',
                'logo' => 'store',
                'accent_color' => DefaultTheme::PREVIEW_COLOR,
                'subscription_status' => 'active',
            ], $storeId);

            $store = Store::query()->create($payload);
            $this->ensureSubscription($store);
            $provision = app(ProvisionNewStoreService::class)->bootstrap($store, $seedCatalog);
            $store = $store->fresh();
            $provisioned = true;
        } else {
            $hasTheme = StoreTheme::withoutGlobalScope('store')
                ->where('store_id', $storeId)
                ->exists();
            if (! $hasTheme) {
                $provision = app(ProvisionNewStoreService::class)->bootstrap($store, $seedCatalog);
                $store = $store->fresh();
                $provisioned = true;
            }
        }

        $invite->used_at = now();
        $invite->redeemed_store_id = $storeId;
        $invite->save();

        Audit::record(
            $storeId,
            null,
            'onboarding_invite.redeemed',
            'onboarding_invite',
            $invite->id,
            [
                'store_id' => $storeId,
                'provisioned' => $provisioned,
                'default_theme_id' => DefaultTheme::CATALOG_ID,
            ],
        );

        return response()->json([
            'ok' => true,
            'invite' => $this->serializeInvite($invite),
            'store' => $store,
            'default_theme_id' => DefaultTheme::CATALOG_ID,
            'provisioned' => $provisioned,
            'provision' => $provision,
            'hosting' => HostingerCloud::domainPolicy($storeId),
        ]);
    }

    private function uniqueSlug(string $base): string
    {
        $slug = Str::slug($base) ?: 'store';
        $candidate = $slug;
        $i = 0;
        while (Store::query()->where('slug', $candidate)->exists()) {
            $i++;
            $candidate = $slug.'-'.$i;
            if ($i > 50) {
                $candidate = $slug.'-'.Str::lower(Str::random(4));
                break;
            }
        }

        return $candidate;
    }

    private function ensureSubscription(Store $store): void
    {
        $planId = Plans::catalog()[Plans::normalizeCode($store->plan)]['id'] ?? 'plan-premium';
        if (! Plan::query()->where('id', $planId)->exists()) {
            return;
        }

        $existingSub = Subscription::withoutGlobalScope('store')->where('store_id', $store->id)->first();
        if ($existingSub) {
            $existingSub->fill([
                'plan_id' => $planId,
                'status' => 'active',
                'billing_interval' => 'monthly',
            ])->save();

            return;
        }

        Subscription::withoutGlobalScope('store')->create([
            'id' => 'sub-'.Str::lower(Str::random(10)),
            'store_id' => $store->id,
            'plan_id' => $planId,
            'status' => 'active',
            'billing_interval' => 'monthly',
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);
    }

    private function requireMaster(Request $request): ?JsonResponse
    {
        $portal = strtolower((string) $request->header('X-Portal', $request->attributes->get('portal', '')));
        $user = $request->user();
        if ($portal !== 'master' || ! $user || $user->role !== 'super_admin') {
            return response()->json(['message' => 'Master SuperAdmin required.'], 403);
        }

        return null;
    }

    private function allocateStoreId(): string
    {
        for ($i = 0; $i < 8; $i++) {
            $id = 'store-'.bin2hex(random_bytes(5));
            if (
                ! OnboardingInvite::query()->where('store_id', $id)->exists()
                && ! Store::query()->where('id', $id)->exists()
            ) {
                return $id;
            }
        }

        return 'store-'.Str::lower(Str::random(10));
    }

    /** Short share code for /join/{token} (no ambiguous 0/O/1/l). */
    private function allocateInviteToken(int $length = 8): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        $max = strlen($alphabet) - 1;
        for ($attempt = 0; $attempt < 16; $attempt++) {
            $token = '';
            for ($i = 0; $i < $length; $i++) {
                $token .= $alphabet[random_int(0, $max)];
            }
            if (! OnboardingInvite::query()->where('token', $token)->exists()) {
                return $token;
            }
        }

        return Str::lower(Str::random(10));
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeInvite(OnboardingInvite $invite): array
    {
        return [
            'id' => $invite->id,
            'token' => $invite->token,
            'storeId' => $invite->store_id,
            'plan' => $invite->plan,
            'label' => $invite->label,
            'locale' => $invite->locale,
            'textDir' => $invite->text_dir,
            'currency' => $invite->currency,
            'timezone' => $invite->timezone,
            'createdAt' => $invite->created_at?->toIso8601String(),
            'expiresAt' => $invite->expires_at?->toIso8601String(),
            'usedAt' => $invite->used_at?->toIso8601String(),
            'redeemedStoreId' => $invite->redeemed_store_id,
        ];
    }
}

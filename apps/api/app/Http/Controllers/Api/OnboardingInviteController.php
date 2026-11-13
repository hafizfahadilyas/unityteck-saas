<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OnboardingInvite;
use App\Models\Store;
use App\Support\Audit;
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
            'plan' => ['nullable', Rule::in(['free', 'paid', 'pro', 'custom'])],
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
            'token' => bin2hex(random_bytes(24)),
            'store_id' => $storeId,
            'plan' => $data['plan'] ?? 'pro',
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

    /** Public: mark invite used when store is provisioned with reserved store_id. */
    public function redeem(Request $request, string $token): JsonResponse
    {
        $data = $request->validate([
            'store_id' => ['required', 'string', 'max:64'],
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
                return response()->json(['ok' => true, 'invite' => $this->serializeInvite($invite)]);
            }

            return response()->json(['ok' => false, 'reason' => 'used'], 410);
        }

        if ($invite->isExpired()) {
            return response()->json(['ok' => false, 'reason' => 'expired'], 410);
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
            ['store_id' => $storeId],
        );

        return response()->json(['ok' => true, 'invite' => $this->serializeInvite($invite)]);
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

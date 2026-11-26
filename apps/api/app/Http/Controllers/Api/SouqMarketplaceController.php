<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\ThemeCatalog;
use App\Services\Theme\ThemeEntitlementService;
use App\Support\Plans;
use App\Support\SouqAddOns;
use App\Support\SouqBilling;
use App\Support\SouqCommonThemes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

/**
 * CT-5 / CT-6 / CT-7 — public + store marketplace parity (plans, themes, add-ons).
 */
class SouqMarketplaceController extends Controller
{
    use ResolvesStoreId;

    /** Public: same SAR plans as dashboard (zero mock) + 1/6/12 periods. */
    public function publicPlans(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => SouqBilling::plansWithPeriods(),
            'billing_periods' => SouqBilling::billingPeriods(),
            'hosting' => SouqBilling::hostingCatalog(),
            'free_hosting_slots_remaining' => SouqBilling::freeHostingSlotsRemaining(),
            'inactivity' => SouqBilling::marketingBundle()['inactivity'],
            'platform' => [
                'name_en' => config('souq.name_en', 'Souq Platform'),
                'name_ar' => config('souq.name_ar', 'منصة سوق'),
            ],
        ]);
    }

    /** Full marketing bundle for Souq website (plans + addons + hosting + inactivity). */
    public function publicBundle(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => SouqBilling::marketingBundle(),
        ]);
    }

    /** Public: theme gallery with prices (locked until login + entitlement). */
    public function publicThemes(): JsonResponse
    {
        SouqCommonThemes::ensureCatalogRows();

        $query = ThemeCatalog::query()->orderBy('is_default', 'desc');
        if (Schema::hasColumn('themes_catalog', 'is_active')) {
            $query->where(function ($q) {
                $q->where('is_active', true)->orWhereNull('is_active');
            });
        }

        $rows = $query->get()->map(function (ThemeCatalog $t) {
            return [
                'id' => $t->id,
                'name' => $t->name,
                'name_ar' => $t->name_ar ?? null,
                'category' => $t->category,
                'tier' => $t->tier ?? null,
                'price_sar' => $t->price_sar !== null ? (int) $t->price_sar : null,
                'currency' => 'SAR',
                'included_in_tiers' => $t->included_in_tiers ?? [],
                'preview_color' => $t->preview_color,
                'is_default' => (bool) $t->is_default,
                'unlocked' => false,
                'lock_reason' => 'login_required',
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $rows,
        ]);
    }

    /** Public: AI / automation add-on matrix (price-first). */
    public function publicAddOns(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => SouqAddOns::publicMatrix(),
        ]);
    }

    /** Store-scoped add-ons with unlock flags. */
    public function storeAddOns(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }
        $store = Store::query()->findOrFail($storeId);

        return response()->json([
            'success' => true,
            'data' => SouqAddOns::forStore($store),
            'plans' => SouqBilling::plansWithPeriods(),
            'billing_periods' => SouqBilling::billingPeriods(),
            'hosting' => SouqBilling::hostingCatalog(),
            'inactivity' => SouqBilling::inactivityForStore($store),
            'free_hosting_slots_remaining' => SouqBilling::freeHostingSlotsRemaining(),
            'store_id' => $store->id,
            'plan_code' => Plans::effectiveCode($store),
        ]);
    }

    /**
     * CT-5 — purchase / request unlock for a marketplace theme.
     * Creates entitlement row; payment capture stays Master-owned (no fake Instant pay).
     */
    public function purchaseTheme(Request $request, string $themeId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'source' => ['sometimes', 'string', 'in:purchase,master_grant,subscription'],
            'confirm_payment' => ['sometimes', 'boolean'],
        ]);

        $store = Store::query()->findOrFail($storeId);
        $theme = ThemeCatalog::query()->find($themeId);
        if (! $theme) {
            return response()->json([
                'success' => false,
                'message' => 'Theme not found.',
                'message_ar' => 'القالب غير موجود.',
            ], 404);
        }

        $svc = app(ThemeEntitlementService::class);
        if ($svc->isUnlocked($store, $themeId)) {
            return response()->json([
                'success' => true,
                'already_unlocked' => true,
                'theme_id' => $themeId,
                'store_id' => $store->id,
            ]);
        }

        $source = $data['source'] ?? ThemeEntitlementService::SOURCE_PURCHASE;
        $isMaster = ($request->user()?->role ?? '') === 'super_admin'
            || ($request->user()?->role ?? '') === 'master';

        // Merchants: record purchase intent only after confirm_payment (Master confirms real money)
        if ($source === ThemeEntitlementService::SOURCE_MASTER_GRANT && ! $isMaster) {
            return response()->json([
                'success' => false,
                'message' => 'Only Master Admin can grant themes.',
                'message_ar' => 'الماستر فقط يمكنه منح القوالب.',
            ], 403);
        }

        if ($source === ThemeEntitlementService::SOURCE_PURCHASE && ! $isMaster && ! $request->boolean('confirm_payment')) {
            return response()->json([
                'success' => true,
                'pending_payment' => true,
                'theme_id' => $themeId,
                'price_sar' => $theme->price_sar !== null ? (int) $theme->price_sar : null,
                'currency' => 'SAR',
                'message' => 'Payment required. Master unlocks after payment confirmation.',
                'message_ar' => 'الدفع مطلوب. الماستر يفتح القالب بعد تأكيد الدفع.',
                'store_id' => $store->id,
            ]);
        }

        if (! Schema::hasTable('store_theme_entitlements')) {
            return response()->json([
                'success' => false,
                'message' => 'Theme entitlements table missing.',
            ], 503);
        }

        $ent = $svc->grant(
            $store,
            $themeId,
            $source,
            $theme->price_sar !== null ? (int) $theme->price_sar : null,
            $request->user()?->id,
        );

        return response()->json([
            'success' => true,
            'data' => $ent,
            'theme_id' => $themeId,
            'store_id' => $store->id,
            'unlocked' => true,
        ], 201);
    }
}

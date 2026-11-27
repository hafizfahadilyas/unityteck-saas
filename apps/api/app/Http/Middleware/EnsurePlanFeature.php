<?php

namespace App\Http\Middleware;

use App\Models\AiFeatureRegistry;
use App\Models\DashboardPageRegistry;
use App\Models\MerchantFeatureOverride;
use App\Models\MerchantPageVisibility;
use App\Models\Store;
use App\Support\Plans;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Master Admin Central Control & Plan Feature Enforcement Middleware.
 * Enforces 4-tier precedence:
 * Tier 1: Store Specific Feature Override (Store Override > Plan)
 * Tier 2: Global Feature Registry Status (Global Master Switch)
 * Tier 3: Store Specific Page Visibility (Master Admin Page Block)
 * Tier 4: Base Plan Feature Permission (Plans::hasFeature)
 */
class EnsurePlanFeature
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $storeId = $request->attributes->get('store_id')
            ?? $request->header('X-Store-Id');

        if (! $storeId) {
            // Master portal without store context — skip plan gate
            if (strtolower((string) $request->attributes->get('portal', '')) === 'master') {
                return $next($request);
            }

            return response()->json([
                'message' => 'X-Store-Id required for plan checks.',
            ], 400);
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        // Tier 1: Store Specific AI Feature Override
        $featRecord = AiFeatureRegistry::where('feature_code', $feature)
            ->orWhere('id', $feature)
            ->first();

        if ($featRecord) {
            $storeOverride = MerchantFeatureOverride::where('store_id', $store->id)
                ->where('feature_id', $featRecord->id)
                ->first();

            if ($storeOverride !== null) {
                if (! (bool) $storeOverride->is_enabled) {
                    return response()->json([
                        'message' => 'This feature has been explicitly disabled for your store by platform administration.',
                        'feature' => $feature,
                        'reason' => 'store_override_disabled',
                    ], 403);
                }

                // If explicitly enabled by Master Admin store override, grant access!
                return $next($request);
            }

            // Tier 2: Global Feature Registry Status
            if (! (bool) $featRecord->global_status || ! (bool) $featRecord->is_active) {
                return response()->json([
                    'message' => 'This feature is currently disabled globally across Souq Platform.',
                    'feature' => $feature,
                    'reason' => 'global_disabled',
                ], 403);
            }
        }

        // Tier 3: Store Specific Page Visibility Override
        $pageRecord = DashboardPageRegistry::where('route_key', $feature)->first();
        if ($pageRecord) {
            $pageOverride = MerchantPageVisibility::where('store_id', $store->id)
                ->where('page_id', $pageRecord->id)
                ->first();

            if ($pageOverride !== null && ! (bool) $pageOverride->is_visible) {
                return response()->json([
                    'message' => 'This page has been disabled for your store by platform administration.',
                    'page' => $feature,
                    'reason' => 'store_page_disabled',
                ], 403);
            }

            if (! (bool) $pageRecord->global_visibility) {
                return response()->json([
                    'message' => 'This page is currently disabled globally by platform administration.',
                    'page' => $feature,
                    'reason' => 'global_page_disabled',
                ], 403);
            }
        }

        // Tier 4: Base Plan Permission Check
        if (! Plans::hasFeature($store, $feature)) {
            $info = Plans::forStore($store);

            return response()->json([
                'message' => 'This feature is not included in your plan.',
                'feature' => $feature,
                'plan' => $info['code'],
                'upgrade_hint' => 'Ask Master Admin to upgrade or grant Pro.',
            ], 403);
        }

        return $next($request);
    }
}


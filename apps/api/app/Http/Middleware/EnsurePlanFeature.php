<?php

namespace App\Http\Middleware;

use App\Models\Store;
use App\Support\Plans;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Phase 2.6 — API-enforce plan feature flags (UI hide ≠ security).
 * Usage: middleware('plan.feature:coupons')
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

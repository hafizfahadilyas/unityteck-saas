<?php

namespace App\Http\Middleware;

use App\Models\Store;
use App\Support\Subscriptions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Phase 2.7 — block commerce writes when subscription expired/suspended.
 * Usage: middleware('subscription.writable')
 */
class EnsureSubscriptionWritable
{
    public function handle(Request $request, Closure $next): Response
    {
        $portal = strtolower((string) $request->attributes->get(
            'portal',
            $request->header('X-Portal', '')
        ));

        if ($portal === 'master') {
            return $next($request);
        }

        $storeId = $request->attributes->get('store_id')
            ?? $request->header('X-Store-Id');

        if (! $storeId) {
            return $next($request);
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        if (! Subscriptions::canWrite($store)) {
            $info = Subscriptions::forStore($store, false);

            return response()->json([
                'message' => $info['message'] ?? 'Subscription does not allow this action.',
                'subscription' => $info,
            ], 403);
        }

        return $next($request);
    }
}

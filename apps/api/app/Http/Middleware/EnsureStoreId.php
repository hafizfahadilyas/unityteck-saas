<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Requires X-Store-Id for store-scoped API routes.
 * Master portal requests may omit it when X-Portal: master is sent.
 */
class EnsureStoreId
{
    public function handle(Request $request, Closure $next): Response
    {
        $portal = strtolower((string) $request->header('X-Portal', ''));

        $user = $request->user();

        if ($portal === 'master') {
            if ($user && $user->role !== 'super_admin') {
                return response()->json([
                    'message' => 'Unauthorized portal access.',
                ], 403);
            }
            $request->attributes->set('portal', 'master');
            $request->attributes->set('store_id', null);

            return $next($request);
        }

        $storeId = $request->header('X-Store-Id');

        if ($storeId === null || trim($storeId) === '') {
            return response()->json([
                'message' => 'X-Store-Id header is required for store-scoped routes.',
            ], 400);
        }

        $storeId = trim($storeId);

        // If user is authenticated, ensure they belong to this store or are super_admin
        if ($user && $user->role !== 'super_admin') {
            $hasAccess = \App\Models\StoreUser::query()
                ->where('user_id', $user->id)
                ->where('store_id', $storeId)
                ->exists();

            if (! $hasAccess) {
                return response()->json([
                    'message' => 'Access denied to this store.',
                ], 403);
            }
        }

        $request->attributes->set('portal', 'store');
        $request->attributes->set('store_id', $storeId);

        return $next($request);
    }
}

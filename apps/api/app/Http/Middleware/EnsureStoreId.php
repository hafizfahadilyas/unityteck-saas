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

        $raw = $request->header('X-Store-Id');

        if ($raw === null || trim((string) $raw) === '') {
            return response()->json([
                'message' => 'X-Store-Id header is required for store-scoped routes.',
            ], 400);
        }

        // Resolve aliases / slug → canonical store id (must match Order::forStore + BelongsToStore scope)
        $storeId = $this->resolveStoreId(trim((string) $raw));

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

    /**
     * Canonical multi-tenant store id — same rules as ResolvesStoreId.
     */
    protected function resolveStoreId(string $raw): string
    {
        $s = strtolower(trim($raw));
        if (in_array($s, ['flowers', 'hadaya', 'makkah', 'giftshop'], true)) {
            return 'store-1';
        }
        if (in_array($s, ['coffee', 'roasters', 'hibrew'], true)) {
            return 'store-coffee';
        }
        if (in_array($s, ['bleco', 'car', 'cars', 'alsaeedi'], true)) {
            return 'store-bleco';
        }

        $matched = \App\Models\Store::query()
            ->where('id', $raw)
            ->orWhere('slug', $raw)
            ->orWhere('slug', $s)
            ->value('id');

        return $matched ? (string) $matched : trim($raw);
    }
}

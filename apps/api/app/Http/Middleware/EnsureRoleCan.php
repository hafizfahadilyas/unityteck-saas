<?php

namespace App\Http\Middleware;

use App\Models\StoreUser;
use App\Support\Roles;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Phase 2.3 — API-enforce role ability (frontend hide ≠ security).
 * Usage: middleware('role.can:products.write')
 */
class EnsureRoleCan
{
    public function handle(Request $request, Closure $next, string $ability): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $portal = strtolower((string) $request->attributes->get(
            'portal',
            $request->header('X-Portal', 'store')
        ));

        $role = Roles::normalize($user->role);

        if ($portal === 'master') {
            if ($role !== Roles::SUPER_ADMIN) {
                return response()->json([
                    'message' => 'Master Admin requires Super Admin role.',
                ], 403);
            }
        } else {
            $storeId = $request->attributes->get('store_id')
                ?? $request->header('X-Store-Id');

            if ($storeId) {
                $membership = StoreUser::query()
                    ->where('user_id', $user->id)
                    ->where('store_id', $storeId)
                    ->first();

                if ($membership) {
                    $role = Roles::normalize($membership->role);
                } elseif ($role === Roles::SUPER_ADMIN) {
                    // Master may act on a store when X-Store-Id set
                    $role = Roles::SUPER_ADMIN;
                } else {
                    return response()->json([
                        'message' => 'No store membership for this account.',
                    ], 403);
                }
            }
        }

        if (! Roles::can($role, $ability)) {
            return response()->json([
                'message' => 'This role cannot perform this action.',
                'role' => $role,
                'ability' => $ability,
            ], 403);
        }

        $request->attributes->set('auth_role', $role);

        return $next($request);
    }
}

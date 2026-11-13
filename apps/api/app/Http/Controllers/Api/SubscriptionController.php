<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\Subscription;
use App\Support\Audit;
use App\Support\Subscriptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubscriptionController extends Controller
{
    use ResolvesStoreId;

    /** Master: list all store subscriptions (platform overview). */
    public function index(Request $request): JsonResponse
    {
        $portal = strtolower((string) $request->header('X-Portal', $request->attributes->get('portal', '')));
        $user = $request->user();
        if ($portal !== 'master' || ! $user || $user->role !== 'super_admin') {
            return response()->json(['message' => 'Master SuperAdmin required.'], 403);
        }

        $stores = Store::query()->orderBy('name')->get();
        $rows = [];
        foreach ($stores as $store) {
            $resolved = Subscriptions::forStore($store, true);
            $raw = Subscription::query()
                ->where('store_id', $store->id)
                ->orderByDesc('created_at')
                ->first();
            $rows[] = [
                'store_id' => $store->id,
                'store_name' => $store->name,
                'plan' => $store->plan,
                'subscription_status' => $store->subscription_status ?? null,
                'lifecycle' => $resolved,
                'raw' => $raw,
            ];
        }

        $nearExpiry = collect($rows)->filter(function (array $row) {
            $ends = $row['lifecycle']['ends_at'] ?? null;
            if (! $ends) {
                return false;
            }
            $ts = strtotime((string) $ends);
            if ($ts === false) {
                return false;
            }
            $days = ($ts - time()) / 86400;

            return $days >= 0 && $days <= 14;
        })->count();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total' => count($rows),
                'near_expiry' => $nearExpiry,
                'last_refresh' => now()->toIso8601String(),
                'source' => 'subscriptions+stores',
            ],
        ]);
    }

    /** Current store subscription lifecycle (resolved). */
    public function current(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->findOrFail($storeId);
        $sub = Subscription::query()
            ->where('store_id', $storeId)
            ->orderByDesc('created_at')
            ->first();

        return response()->json([
            'data' => Subscriptions::forStore($store, true),
            'raw' => $sub,
            'store_id' => $storeId,
        ]);
    }

    /** Master: patch status / interval / dates. */
    public function update(Request $request, string $storeId): JsonResponse
    {
        $portal = strtolower((string) $request->header('X-Portal', ''));
        if ($portal !== 'master') {
            return response()->json(['message' => 'Master portal required.'], 403);
        }

        $store = Store::query()->findOrFail($storeId);

        $data = $request->validate([
            'status' => ['sometimes', Rule::in(Subscriptions::STATUSES)],
            'billing_interval' => ['sometimes', Rule::in(['monthly', 'yearly'])],
            'ends_at' => ['sometimes', 'nullable', 'date'],
            'grace_ends_at' => ['sometimes', 'nullable', 'date'],
            'renew' => ['sometimes', 'boolean'],
            'reason' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $sub = Subscription::query()
            ->where('store_id', $store->id)
            ->orderByDesc('created_at')
            ->first();

        $before = $sub ? [
            'status' => $sub->status,
            'billing_interval' => $sub->billing_interval,
            'ends_at' => optional($sub->ends_at)->toIso8601String(),
            'grace_ends_at' => optional($sub->grace_ends_at)->toIso8601String(),
        ] : null;

        if (! $sub) {
            $sub = Subscription::query()->create([
                'id' => 'sub-'.$store->id,
                'store_id' => $store->id,
                'plan_id' => 'plan-'.($store->plan ?: 'free'),
                'status' => 'trial',
                'billing_interval' => 'monthly',
                'starts_at' => now(),
                'ends_at' => now()->addDays(14),
            ]);
        }

        if (! empty($data['renew'])) {
            Subscriptions::renew($sub, $data['billing_interval'] ?? null);
        } else {
            if (isset($data['status'])) {
                $sub->status = $data['status'];
            }
            if (isset($data['billing_interval'])) {
                $sub->billing_interval = $data['billing_interval'];
            }
            if (array_key_exists('ends_at', $data)) {
                $sub->ends_at = $data['ends_at'];
            }
            if (array_key_exists('grace_ends_at', $data)) {
                $sub->grace_ends_at = $data['grace_ends_at'];
            }
            $sub->save();
        }

        $sub->refresh();

        Audit::fromRequest(
            $request,
            ! empty($data['renew']) ? 'subscription.renew' : 'subscription.update',
            'subscription',
            $sub->id,
            [
                'reason' => $data['reason'] ?? null,
                'before' => $before,
                'after' => [
                    'status' => $sub->status,
                    'billing_interval' => $sub->billing_interval,
                    'ends_at' => optional($sub->ends_at)->toIso8601String(),
                    'grace_ends_at' => optional($sub->grace_ends_at)->toIso8601String(),
                ],
            ],
            $storeId,
        );

        return response()->json([
            'data' => Subscriptions::forStore($store->fresh(), true),
            'raw' => $sub,
            'store_id' => $storeId,
        ]);
    }
}

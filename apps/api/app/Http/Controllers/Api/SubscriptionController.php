<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\Subscription;
use App\Support\Subscriptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubscriptionController extends Controller
{
    use ResolvesStoreId;

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
        ]);

        $sub = Subscription::query()
            ->where('store_id', $store->id)
            ->orderByDesc('created_at')
            ->first();

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

        return response()->json([
            'data' => Subscriptions::forStore($store->fresh(), true),
            'raw' => $sub,
            'store_id' => $storeId,
        ]);
    }
}

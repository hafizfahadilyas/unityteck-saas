<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerActivity;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;

class CustomerActivityController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        return $this->listActivities($request, $storeId);
    }

    public function forCustomer(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        Customer::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->where('id', $id)
            ->firstOrFail();

        $request->merge(['customer_id' => $id]);

        return $this->listActivities($request, $storeId);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $activity = $this->createActivity($request, $storeId);

        return response()->json(['data' => $activity], 201);
    }

    /**
     * Public storefront tracking — requires real store_id. No invented events.
     */
    public function storefrontStore(Request $request): JsonResponse
    {
        $rawStore = (string) ($request->input('store_id') ?: $request->header('X-Store-Id') ?: '');
        if (trim($rawStore) === '') {
            return response()->json(['message' => 'store_id is required.'], 422);
        }

        $storeId = $this->canonicalStoreId($rawStore);
        if (! Store::query()->where('id', $storeId)->exists()) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $surface = strtolower(trim((string) (
            $request->header('X-Storefront-Surface')
            ?? $request->input('meta.surface', '')
        )));
        if ($surface !== 'public_storefront') {
            return response()->json(['message' => 'Public storefront activities only.'], 403);
        }

        $key = 'sf-activity:'.$storeId.':'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 60)) {
            return response()->json(['message' => 'Too many attempts. Try again shortly.'], 429);
        }
        RateLimiter::hit($key, 60);

        $meta = $request->input('meta');
        if (! is_array($meta)) {
            $meta = [];
        }
        $meta['surface'] = 'public_storefront';
        $request->merge(['meta' => $meta]);

        $activity = $this->createActivity($request, $storeId);

        return response()->json(['data' => $activity], 201);
    }

    protected function listActivities(Request $request, string $storeId): JsonResponse
    {
        $query = CustomerActivity::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->orderByDesc('occurred_at');

        if ($customerId = $request->query('customer_id') ?: $request->input('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        if ($type = $request->query('type') ?: $request->query('activity_type')) {
            $query->where('activity_type', $type);
        }

        if ($from = $request->query('from_date') ?: $request->query('from')) {
            $query->where('occurred_at', '>=', $from);
        }

        if ($to = $request->query('to_date') ?: $request->query('to')) {
            $query->where('occurred_at', '<=', $to);
        }

        $perPage = min(100, max(1, (int) $request->query('per_page', 25)));
        $page = max(1, (int) $request->query('page', 1));

        if ($request->boolean('all')) {
            $rows = $query->get();

            return response()->json([
                'data' => $rows,
                'store_id' => $storeId,
                'meta' => [
                    'total' => $rows->count(),
                    'page' => 1,
                    'per_page' => max(1, $rows->count()),
                    'last_page' => 1,
                ],
            ]);
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $paginator->items(),
            'store_id' => $storeId,
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    protected function createActivity(Request $request, string $storeId): CustomerActivity
    {
        $data = $request->validate([
            'customer_id' => ['nullable', 'string', 'max:64'],
            'customer_name' => ['nullable', 'string', 'max:191'],
            'activity_type' => ['required', Rule::in(CustomerActivity::TYPES)],
            'product_id' => ['nullable', 'string', 'max:64'],
            'product_name' => ['nullable', 'string', 'max:191'],
            'order_id' => ['nullable', 'string', 'max:64'],
            'meta' => ['nullable', 'array'],
            'occurred_at' => ['nullable', 'date'],
        ]);

        if (! empty($data['customer_id'])) {
            $customer = Customer::query()
                ->withoutGlobalScope('store')
                ->forStore($storeId)
                ->where('id', $data['customer_id'])
                ->first();

            if (! $customer) {
                abort(response()->json(['message' => 'Customer not found for this store.'], 422));
            }

            if (empty($data['customer_name'])) {
                $data['customer_name'] = $customer->name;
            }
        }

        if (! empty($data['product_id'])) {
            $product = Product::query()
                ->withoutGlobalScope('store')
                ->forStore($storeId)
                ->where('id', $data['product_id'])
                ->first();

            if (! $product) {
                abort(response()->json(['message' => 'Product not found for this store.'], 422));
            }

            if (empty($data['product_name'])) {
                $data['product_name'] = $product->name;
            }
        }

        if (! empty($data['order_id'])) {
            $orderExists = Order::query()
                ->withoutGlobalScope('store')
                ->forStore($storeId)
                ->where('id', $data['order_id'])
                ->exists();

            if (! $orderExists) {
                abort(response()->json(['message' => 'Order not found for this store.'], 422));
            }
        }

        return CustomerActivity::query()->create([
            'id' => $this->newId('cact'),
            'store_id' => $storeId,
            'customer_id' => $data['customer_id'] ?? null,
            'customer_name' => $data['customer_name'] ?? null,
            'activity_type' => $data['activity_type'],
            'product_id' => $data['product_id'] ?? null,
            'product_name' => $data['product_name'] ?? null,
            'order_id' => $data['order_id'] ?? null,
            'meta' => $data['meta'] ?? null,
            'occurred_at' => $data['occurred_at'] ?? now(),
        ]);
    }
}

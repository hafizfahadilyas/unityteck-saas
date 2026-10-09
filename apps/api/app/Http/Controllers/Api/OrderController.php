<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = Order::query()
            ->forStore($storeId)
            ->with(['items', 'customer'])
            ->orderByDesc('order_date');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'data' => $query->get(),
            'store_id' => $storeId,
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $order = Order::query()
            ->forStore($storeId)
            ->with(['items', 'customer'])
            ->where('id', $id)
            ->firstOrFail();

        return response()->json(['data' => $order]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        return $this->processCreateOrder($request, $storeId);
    }

    public function storefrontStore(Request $request): JsonResponse
    {
        $storeId = (string) ($request->header('X-Store-Id') ?? $request->input('store_id', ''));
        if ($storeId === '') {
            return response()->json(['message' => 'Store ID required.'], 400);
        }

        $store = Store::query()->where('id', $storeId)->first();
        if (!$store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        return $this->processCreateOrder($request, $storeId);
    }

    protected function processCreateOrder(Request $request, string $storeId): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:191'],
            'customer_email' => ['nullable', 'email', 'max:191'],
            'customer_phone' => ['required', 'string', 'max:32'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
            'source' => ['nullable', 'string', 'max:64'],
            'source_details' => ['nullable', 'string', 'max:255'],
            'delivery_location' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['pending', 'processing', 'completed', 'cancelled'])],
            'payment_method' => ['nullable', 'string', 'max:64'],
            'payment_status' => ['nullable', 'string', 'max:64'],
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['nullable', 'string', 'max:64'],
            'items.*.name' => ['required_with:items', 'string', 'max:191'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.price' => ['required_with:items', 'numeric', 'min:0'],
        ]);

        $orderId = 'ord-' . (string) Str::uuid();
        $orderNum = 'WM-MK-' . rand(1000, 9999);
        $totalAmount = (float) $validated['total_amount'];
        $customerEmail = !empty($validated['customer_email']) ? trim($validated['customer_email']) : ('cust_' . rand(1000, 9999) . '@store.sa');
        $customerPhone = trim($validated['customer_phone']);
        $customerName = trim($validated['customer_name']);
        $city = !empty($validated['delivery_location']) ? trim(explode('-', $validated['delivery_location'])[0]) : 'Makkah';
        $source = !empty($validated['source']) ? $validated['source'] : 'Direct';

        // 1. Find or create real customer record for this store
        $customer = Customer::query()
            ->where('store_id', $storeId)
            ->where(function ($q) use ($customerEmail, $customerPhone) {
                $q->where('email', $customerEmail)
                  ->orWhere('phone', $customerPhone);
            })
            ->first();

        if ($customer) {
            $customer->total_orders = ($customer->total_orders ?? 0) + 1;
            $customer->total_spend = (float) ($customer->total_spend ?? 0) + $totalAmount;
            $customer->avg_order_value = $customer->total_orders > 0 ? round($customer->total_spend / $customer->total_orders, 2) : $totalAmount;
            $customer->last_order_date = now();
            if ($customer->total_spend >= 1500 || $customer->total_orders >= 3) {
                $customer->status = 'VIP';
                $customer->group = 'VIP';
            } elseif ($customer->status === 'Inactive' || $customer->status === 'New') {
                $customer->status = 'Active';
            }
            $customer->save();
        } else {
            $customer = Customer::query()->create([
                'id' => 'cust-' . (string) Str::uuid(),
                'store_id' => $storeId,
                'name' => $customerName,
                'email' => $customerEmail,
                'phone' => $customerPhone,
                'city' => $city,
                'country' => 'Saudi Arabia',
                'acquisition_source' => $source,
                'group' => 'Regular',
                'status' => 'New',
                'total_orders' => 1,
                'total_spend' => $totalAmount,
                'avg_order_value' => $totalAmount,
                'last_order_date' => now(),
            ]);
        }

        // 2. Create the Order
        $order = Order::query()->create([
            'id' => $orderId,
            'store_id' => $storeId,
            'order_number' => $orderNum,
            'customer_id' => $customer->id,
            'customer_name' => $customerName,
            'customer_email' => $customerEmail,
            'customer_phone' => $customerPhone,
            'items_count' => !empty($validated['items']) ? count($validated['items']) : 1,
            'items_summary' => !empty($validated['items']) ? implode(', ', array_column($validated['items'], 'name')) : 'Store Products',
            'total_amount' => $totalAmount,
            'currency' => $validated['currency'] ?? 'SAR',
            'source' => in_array($source, ['WhatsApp', 'Instagram', 'Google Ads', 'Facebook', 'Snapchat', 'Direct']) ? $source : 'Direct',
            'source_details' => $validated['source_details'] ?? null,
            'delivery_location' => $validated['delivery_location'] ?? 'Makkah',
            'status' => $validated['status'] ?? 'pending',
            'payment_method' => $validated['payment_method'] ?? 'Mada',
            'payment_status' => $validated['payment_status'] ?? 'Paid',
            'order_date' => now(),
        ]);

        // 3. Create items if provided
        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                $qty = (int) ($item['quantity'] ?? 1);
                $price = (float) ($item['price'] ?? 0);
                OrderItem::query()->create([
                    'order_id' => $orderId,
                    'store_id' => $storeId,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['name'],
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'subtotal' => $qty * $price,
                ]);
            }
        }

        // 4. Update Store stats
        $store = Store::query()->where('id', $storeId)->first();
        if ($store) {
            $store->orders_count = ($store->orders_count ?? 0) + 1;
            $store->revenue = (float) ($store->revenue ?? 0) + $totalAmount;
            $store->save();
        }

        return response()->json([
            'data' => $order->fresh(['items', 'customer']),
            'customer' => $customer->fresh(),
            'message' => 'Order and Customer updated successfully.',
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $order = Order::query()->forStore($storeId)->where('id', $id)->firstOrFail();

        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'processing', 'completed', 'cancelled'])],
        ]);

        $order->status = $data['status'];
        $order->save();

        return response()->json(['data' => $order->fresh(['items', 'customer'])]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $order = Order::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $order->delete();

        return response()->json(['data' => null, 'message' => 'Order deleted.']);
    }
}

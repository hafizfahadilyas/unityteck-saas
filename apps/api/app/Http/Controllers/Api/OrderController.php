<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Store;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

        if ($request->boolean('counts') || $request->boolean('summary')) {
            $statusCounts = Order::query()
                ->forStore($storeId)
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status');
            $total = Order::query()->forStore($storeId)->count();

            return response()->json([
                'store_id' => $storeId,
                'total' => $total,
                'by_status' => $statusCounts,
            ]);
        }

        $query = Order::query()
            ->forStore($storeId)
            ->with(['items', 'customer', 'returns']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($codStatus = $request->query('cod_status')) {
            $query->where('cod_status', $codStatus);
        }

        if ($refundStatus = $request->query('refund_status')) {
            $query->where('refund_status', $refundStatus);
        }

        if ($paymentMethod = $request->query('payment_method')) {
            $query->where('payment_method', $paymentMethod);
        }

        if ($paymentStatus = $request->query('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }

        if ($source = $request->query('source')) {
            $query->where('source', $source);
        }

        if ($fromDate = $request->query('from_date')) {
            $query->where('order_date', '>=', $fromDate);
        }

        if ($toDate = $request->query('to_date')) {
            $query->where('order_date', '<=', $toDate);
        }

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        $sort = (string) $request->query('sort', 'order_date');
        $allowedSorts = ['order_date', 'order_number', 'total_amount', 'status', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'order_date';
        }
        $dir = strtolower((string) $request->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sort, $dir);

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
                    'sort' => $sort,
                    'dir' => $dir,
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
                'sort' => $sort,
                'dir' => $dir,
            ],
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
            'items.*.variation_id' => ['nullable', 'string', 'max:64'],
            'items.*.name' => ['required_with:items', 'string', 'max:191'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.price' => ['required_with:items', 'numeric', 'min:0'],
        ]);

        return DB::transaction(function () use ($validated, $storeId) {
            $items = $validated['items'] ?? [];
            $lowStockAlerts = [];

            // 1. Pre-validate and lock stock for all items
            foreach ($items as $item) {
                $qty = (int) ($item['quantity'] ?? 1);
                $productId = $item['product_id'] ?? null;
                $variationId = $item['variation_id'] ?? null;

                if ($productId) {
                    $product = Product::query()
                        ->forStore($storeId)
                        ->where('id', $productId)
                        ->lockForUpdate()
                        ->first();

                    if ($product && (int) $product->stock < $qty) {
                        abort(response()->json([
                            'message' => "Insufficient stock for '{$product->name}'. Available: {$product->stock}, Requested: {$qty}",
                            'message_ar' => "المخزون غير كافٍ للمنتج '{$product->name}'. المتوفر: {$product->stock}، المطلوب: {$qty}",
                            'product_id' => $product->id,
                            'available_stock' => $product->stock,
                        ], 422));
                    }
                }

                if ($variationId) {
                    $variation = ProductVariation::query()
                        ->forStore($storeId)
                        ->where('id', $variationId)
                        ->lockForUpdate()
                        ->first();

                    if ($variation && (int) $variation->stock < $qty) {
                        abort(response()->json([
                            'message' => "Insufficient stock for variation SKU '{$variation->sku}'. Available: {$variation->stock}, Requested: {$qty}",
                            'message_ar' => "المخزون غير كافٍ للمتغير '{$variation->sku}'. المتوفر: {$variation->stock}، المطلوب: {$qty}",
                            'variation_id' => $variation->id,
                            'available_stock' => $variation->stock,
                        ], 422));
                    }
                }
            }

            // 2. Customer find or create
            $totalAmount = (float) $validated['total_amount'];
            $customerEmail = !empty($validated['customer_email']) ? trim($validated['customer_email']) : ('cust_' . rand(1000, 9999) . '@store.sa');
            $customerPhone = trim($validated['customer_phone']);
            $customerName = trim($validated['customer_name']);
            $city = !empty($validated['delivery_location']) ? trim(explode('-', $validated['delivery_location'])[0]) : 'Makkah';
            $source = !empty($validated['source']) ? $validated['source'] : 'Direct';

            $customer = Customer::query()
                ->where('store_id', $storeId)
                ->where(function ($q) use ($customerEmail, $customerPhone) {
                    $q->where('email', $customerEmail)
                      ->orWhere('phone', $customerPhone);
                })
                ->lockForUpdate()
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

            // 3. Create the Order
            $orderId = 'ord-' . (string) Str::uuid();
            $orderNum = 'WM-MK-' . rand(1000, 9999);

            $order = Order::query()->create([
                'id' => $orderId,
                'store_id' => $storeId,
                'order_number' => $orderNum,
                'customer_id' => $customer->id,
                'customer_name' => $customerName,
                'customer_email' => $customerEmail,
                'customer_phone' => $customerPhone,
                'items_count' => !empty($items) ? count($items) : 1,
                'items_summary' => !empty($items) ? implode(', ', array_column($items, 'name')) : 'Store Products',
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

            // 4. Create Items and Deduct Inventory Atomically
            if (!empty($items)) {
                foreach ($items as $item) {
                    $qty = (int) ($item['quantity'] ?? 1);
                    $price = (float) ($item['price'] ?? 0);
                    $productId = $item['product_id'] ?? null;
                    $variationId = $item['variation_id'] ?? null;

                    OrderItem::query()->create([
                        'order_id' => $orderId,
                        'store_id' => $storeId,
                        'product_id' => $productId,
                        'product_name' => $item['name'],
                        'quantity' => $qty,
                        'unit_price' => $price,
                        'subtotal' => $qty * $price,
                    ]);

                    if ($productId) {
                        $product = Product::query()->forStore($storeId)->where('id', $productId)->first();
                        if ($product) {
                            $newStock = max(0, (int) $product->stock - $qty);
                            $product->stock = $newStock;
                            if ($newStock === 0) {
                                $product->badge = 'out_of_stock';
                            }
                            $product->save();

                            if ($newStock <= 5) {
                                $lowStockAlerts[] = [
                                    'product_id' => $product->id,
                                    'name' => $product->name,
                                    'sku' => $product->sku,
                                    'remaining_stock' => $newStock,
                                    'is_out_of_stock' => $newStock === 0,
                                ];
                            }
                        }
                    }

                    if ($variationId) {
                        $variation = ProductVariation::query()->forStore($storeId)->where('id', $variationId)->first();
                        if ($variation) {
                            $newVarStock = max(0, (int) $variation->stock - $qty);
                            $variation->stock = $newVarStock;
                            $variation->save();
                        }
                    }
                }
            }

            // 5. Update Store stats
            $store = Store::query()->where('id', $storeId)->first();
            if ($store) {
                $store->orders_count = ($store->orders_count ?? 0) + 1;
                $store->revenue = (float) ($store->revenue ?? 0) + $totalAmount;
                $store->save();
            }

            // Trigger instant WhatsApp / SMS notification for new order (+966 Saudi)
            try {
                (new NotificationService())->sendOrderNotification('order_placed', $order);
            } catch (\Throwable $e) {
                Log::warning('Order notification error (order_placed): ' . $e->getMessage());
            }

            return response()->json([
                'data' => $order->fresh(['items', 'customer']),
                'customer' => $customer->fresh(),
                'low_stock_alerts' => $lowStockAlerts,
                'message' => 'Order and Customer created, inventory auto-deducted successfully.',
            ], 201);
        });
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $order = Order::query()->forStore($storeId)->with('items')->where('id', $id)->firstOrFail();

        $allowedStatuses = [
            'pending',
            'processing',
            'shipped',
            'out_for_delivery',
            'delivered',
            'completed',
            'cancellation_requested',
            'cancelled',
            'returned',
        ];

        $data = $request->validate([
            'status' => ['nullable', Rule::in($allowedStatuses)],
            'shipping_status' => ['nullable', 'string', 'max:64'],
            'tracking_number' => ['nullable', 'string', 'max:128'],
            'courier_code' => ['nullable', 'string', 'max:64'],
            'payment_status' => ['nullable', 'string', 'max:64'],
            'payment_method' => ['nullable', 'string', 'max:64'],
            'cod_status' => ['nullable', Rule::in(['not_cod', 'pending_collection', 'collected_by_courier', 'remitted_to_bank', 'failed_collection'])],
            'cod_notes' => ['nullable', 'string', 'max:255'],
            'refund_status' => ['nullable', Rule::in(['none', 'pending', 'approved', 'refunded', 'rejected'])],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
            'return_reason' => ['nullable', 'string', 'max:255'],
            'return_notes' => ['nullable', 'string'],
            'restock' => ['nullable', 'boolean'],
        ]);

        $prevStatus = $order->status;
        $newStatus = $data['status'] ?? $prevStatus;
        $shouldRestock = $request->boolean('restock', true);

        DB::transaction(function () use ($order, $prevStatus, $newStatus, $data, $shouldRestock, $storeId) {
            $order->status = $newStatus;

            if (isset($data['shipping_status'])) $order->shipping_status = $data['shipping_status'];
            if (isset($data['tracking_number'])) $order->tracking_number = $data['tracking_number'];
            if (isset($data['courier_code'])) $order->courier_code = $data['courier_code'];
            if (isset($data['payment_status'])) $order->payment_status = $data['payment_status'];
            if (isset($data['payment_method'])) $order->payment_method = $data['payment_method'];

            // COD handling
            if (isset($data['cod_status'])) {
                $order->cod_status = $data['cod_status'];
                if ($data['cod_status'] === 'collected_by_courier' && !$order->cod_collected_at) {
                    $order->cod_collected_at = now();
                    $order->payment_status = 'Paid';
                } elseif ($data['cod_status'] === 'remitted_to_bank' && !$order->cod_remitted_at) {
                    $order->cod_remitted_at = now();
                    $order->payment_status = 'Paid';
                }
            }
            if (isset($data['cod_notes'])) $order->cod_notes = $data['cod_notes'];

            // Returns & refunds
            if (isset($data['refund_status'])) $order->refund_status = $data['refund_status'];
            if (isset($data['refund_amount'])) $order->refund_amount = $data['refund_amount'];
            if (isset($data['return_reason'])) $order->return_reason = $data['return_reason'];
            if (isset($data['return_notes'])) $order->return_notes = $data['return_notes'];

            if ($newStatus === 'returned' && !$order->returned_at) {
                $order->returned_at = now();
                if ($order->refund_status === 'none') {
                    $order->refund_status = 'refunded';
                }
            }

            // Inventory auto-restock when moving to cancelled or returned
            $isInactiveNow = in_array($newStatus, ['cancelled', 'returned'], true);
            $wasActivePrev = !in_array($prevStatus, ['cancelled', 'returned'], true);

            if ($isInactiveNow && $wasActivePrev && $shouldRestock && !$order->restocked_at) {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        $product = Product::query()->forStore($storeId)->where('id', $item->product_id)->first();
                        if ($product) {
                            $product->stock = (int) $product->stock + (int) $item->quantity;
                            if ($product->badge === 'out_of_stock' && $product->stock > 0) {
                                $product->badge = null;
                            }
                            $product->save();
                        }
                    }
                    if ($item->variation_id) {
                        $variation = ProductVariation::query()->forStore($storeId)->where('id', $item->variation_id)->first();
                        if ($variation) {
                            $variation->stock = (int) $variation->stock + (int) $item->quantity;
                            $variation->save();
                        }
                    }
                }
                $order->restocked_at = now();
            }
            // Reactivating an inactive order: re-deduct product inventory
            elseif (!$isInactiveNow && in_array($prevStatus, ['cancelled', 'returned'], true) && $order->restocked_at) {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        $product = Product::query()->forStore($storeId)->where('id', $item->product_id)->first();
                        if ($product) {
                            $newStock = max(0, (int) $product->stock - (int) $item->quantity);
                            $product->stock = $newStock;
                            if ($newStock === 0) {
                                $product->badge = 'out_of_stock';
                            }
                            $product->save();
                        }
                    }
                    if ($item->variation_id) {
                        $variation = ProductVariation::query()->forStore($storeId)->where('id', $item->variation_id)->first();
                        if ($variation) {
                            $variation->stock = max(0, (int) $variation->stock - (int) $item->quantity);
                            $variation->save();
                        }
                    }
                }
                $order->restocked_at = null;
            }

            $order->save();
        });

        // Trigger transactional WhatsApp / SMS alerts on order status change (+966 Saudi)
        if ($newStatus !== $prevStatus) {
            try {
                $notificationService = new NotificationService();
                if ($newStatus === 'shipped') {
                    $notificationService->sendOrderNotification('order_shipped', $order);
                } elseif (in_array($newStatus, ['delivered', 'completed'], true)) {
                    $notificationService->sendOrderNotification('order_delivered', $order);
                } elseif (in_array($newStatus, ['cancelled', 'cancellation_requested'], true)) {
                    $notificationService->sendOrderNotification('order_cancelled', $order);
                }
            } catch (\Throwable $e) {
                Log::warning('Order status notification error (' . $newStatus . '): ' . $e->getMessage());
            }
        }

        return response()->json(['data' => $order->fresh(['items', 'customer', 'returns'])]);
    }

    public function processReturn(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $order = Order::query()->forStore($storeId)->with('items')->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:100'],
            'reason_details' => ['nullable', 'string', 'max:500'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
            'restock_inventory' => ['nullable', 'boolean'],
            'admin_notes' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', Rule::in(['requested', 'approved', 'rejected', 'completed'])],
            'items' => ['nullable', 'array'],
        ]);

        $status = $validated['status'] ?? 'approved';
        $restock = $request->boolean('restock_inventory', true);
        $refundAmount = isset($validated['refund_amount']) ? (float) $validated['refund_amount'] : (float) $order->total_amount;

        $returnRecord = DB::transaction(function () use ($order, $validated, $status, $restock, $refundAmount, $storeId) {
            $returnId = 'ret_' . Str::random(12);
            $returnNumber = 'RET-' . date('Ymd') . '-' . rand(1000, 9999);

            $ret = OrderReturn::create([
                'id' => $returnId,
                'store_id' => $storeId,
                'order_id' => $order->id,
                'return_number' => $returnNumber,
                'customer_name' => $order->customer_name,
                'reason' => $validated['reason'],
                'reason_details' => $validated['reason_details'] ?? null,
                'status' => $status,
                'refund_amount' => $refundAmount,
                'restock_inventory' => $restock,
                'items' => $validated['items'] ?? $order->items->toArray(),
                'admin_notes' => $validated['admin_notes'] ?? null,
                'requested_at' => now(),
                'processed_at' => ($status === 'approved' || $status === 'completed') ? now() : null,
            ]);

            if ($status === 'approved' || $status === 'completed') {
                $order->status = 'returned';
                $order->refund_status = 'refunded';
                $order->refund_amount = $refundAmount;
                $order->return_reason = $validated['reason'];
                $order->returned_at = now();

                if ($restock && !$order->restocked_at) {
                    foreach ($order->items as $item) {
                        if ($item->product_id) {
                            $product = Product::query()->forStore($storeId)->where('id', $item->product_id)->first();
                            if ($product) {
                                $product->stock = (int) $product->stock + (int) $item->quantity;
                                if ($product->badge === 'out_of_stock' && $product->stock > 0) {
                                    $product->badge = null;
                                }
                                $product->save();
                            }
                        }
                    }
                    $order->restocked_at = now();
                }
                $order->save();
            } elseif ($status === 'rejected') {
                $order->refund_status = 'rejected';
                $order->save();
            }

            return $ret;
        });

        return response()->json([
            'message' => 'Return processed successfully.',
            'return' => $returnRecord,
            'order' => $order->fresh(['items', 'customer', 'returns']),
        ]);
    }

    public function updateCodStatus(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $order = Order::query()->forStore($storeId)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'cod_status' => ['required', Rule::in(['pending_collection', 'collected_by_courier', 'remitted_to_bank', 'failed_collection'])],
            'cod_notes' => ['nullable', 'string', 'max:255'],
        ]);

        $order->cod_status = $validated['cod_status'];
        if ($validated['cod_status'] === 'collected_by_courier') {
            $order->cod_collected_at = now();
            $order->payment_status = 'Paid';
        } elseif ($validated['cod_status'] === 'remitted_to_bank') {
            $order->cod_remitted_at = now();
            $order->payment_status = 'Paid';
        }
        if (isset($validated['cod_notes'])) {
            $order->cod_notes = $validated['cod_notes'];
        }
        $order->save();

        return response()->json([
            'message' => 'COD status updated successfully.',
            'order' => $order->fresh(),
        ]);
    }

    public function codSummary(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $codOrders = Order::query()
            ->forStore($storeId)
            ->where(function ($q) {
                $q->where('payment_method', 'COD')
                  ->orWhere('payment_method', 'Cash on Delivery')
                  ->orWhere('cod_status', '!=', 'not_cod');
            });

        $totalCodOrders = (clone $codOrders)->count();
        $totalCodAmount = (float) (clone $codOrders)->sum('total_amount');

        $pendingCollection = (clone $codOrders)->where(function ($q) {
            $q->where('cod_status', 'pending_collection')
              ->orWhereNull('cod_status')
              ->orWhere('cod_status', 'not_cod');
        });
        $pendingCollectionCount = (clone $pendingCollection)->count();
        $pendingCollectionAmount = (float) (clone $pendingCollection)->sum('total_amount');

        $collectedByCourier = (clone $codOrders)->where('cod_status', 'collected_by_courier');
        $collectedCount = (clone $collectedByCourier)->count();
        $collectedAmount = (float) (clone $collectedByCourier)->sum('total_amount');

        $remittedToBank = (clone $codOrders)->where('cod_status', 'remitted_to_bank');
        $remittedCount = (clone $remittedToBank)->count();
        $remittedAmount = (float) (clone $remittedToBank)->sum('total_amount');

        return response()->json([
            'store_id' => $storeId,
            'summary' => [
                'total_orders' => $totalCodOrders,
                'total_amount' => $totalCodAmount,
                'pending_collection' => [
                    'count' => $pendingCollectionCount,
                    'amount' => $pendingCollectionAmount,
                ],
                'collected_by_courier' => [
                    'count' => $collectedCount,
                    'amount' => $collectedAmount,
                ],
                'remitted_to_bank' => [
                    'count' => $remittedCount,
                    'amount' => $remittedAmount,
                ],
            ],
        ]);
    }

    public function returnsIndex(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = OrderReturn::query()->forStore($storeId)->with('order');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $returns = $query->orderBy('created_at', 'desc')->paginate(25);

        return response()->json($returns);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $order = Order::query()->forStore($storeId)->with('items')->where('id', $id)->firstOrFail();

        DB::transaction(function () use ($order, $storeId) {
            // Restore inventory if active order is deleted
            if (!in_array($order->status, ['cancelled', 'returned'], true)) {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        $product = Product::query()->forStore($storeId)->where('id', $item->product_id)->first();
                        if ($product) {
                            $product->stock = (int) $product->stock + (int) $item->quantity;
                            if ($product->badge === 'out_of_stock' && $product->stock > 0) {
                                $product->badge = null;
                            }
                            $product->save();
                        }
                    }
                }
            }
            $order->delete();
        });

        return response()->json(['data' => null, 'message' => 'Order deleted and inventory restored.']);
    }
}

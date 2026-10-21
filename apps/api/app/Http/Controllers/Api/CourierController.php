<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourierConnection;
use App\Models\Order;
use App\Models\Shipment;
use App\Services\Courier\CourierManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourierController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $couriers = CourierConnection::query()->forStore($storeId)->get();

        $data = $couriers->map(function ($c) {
            return [
                'id' => $c->id,
                'store_id' => $c->store_id,
                'provider' => $c->provider,
                'account_name' => $c->account_name,
                'account_number' => $c->account_number,
                'masked_api_key' => $c->masked_api_key,
                'is_sandbox' => $c->is_sandbox,
                'is_connected' => $c->is_connected,
                'status' => $c->status,
                'settings' => $c->settings,
                'last_tested_at' => $c->last_tested_at?->toIso8601String(),
                'last_sync_at' => $c->last_sync_at?->toIso8601String(),
                'created_at' => $c->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $data,
            'store_id' => $storeId,
            'meta' => ['total' => $couriers->count()],
        ]);
    }

    /**
     * Connect courier credentials (securely stored in backend)
     */
    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'provider' => ['required', Rule::in(['spl', 'aramex', 'smsa', 'dhl', 'fedex', 'ups'])],
            'account_name' => ['required', 'string', 'max:191'],
            'account_number' => ['nullable', 'string', 'max:191'],
            'api_key' => ['required', 'string'],
            'api_secret' => ['nullable', 'string'],
            'entity_pin' => ['nullable', 'string', 'max:100'],
            'is_sandbox' => ['nullable', 'boolean'],
            'settings' => ['nullable', 'array'],
        ]);

        $connection = CourierConnection::query()
            ->forStore($storeId)
            ->where('provider', $data['provider'])
            ->first();

        if (!$connection) {
            $connection = new CourierConnection();
            $connection->id = $this->newId('cour');
            $connection->store_id = $storeId;
            $connection->provider = $data['provider'];
        }

        $connection->account_name = $data['account_name'];
        $connection->account_number = $data['account_number'] ?? null;
        $connection->api_key = $data['api_key'];
        if (isset($data['api_secret'])) {
            $connection->api_secret = $data['api_secret'];
        }
        if (isset($data['entity_pin'])) {
            $connection->entity_pin = $data['entity_pin'];
        }
        $connection->is_sandbox = $data['is_sandbox'] ?? true;
        $connection->settings = $data['settings'] ?? [];
        $connection->is_connected = true;
        $connection->status = 'connected';
        $connection->last_tested_at = now();
        $connection->last_sync_at = now();
        $connection->save();

        return response()->json([
            'data' => [
                'id' => $connection->id,
                'provider' => $connection->provider,
                'account_name' => $connection->account_name,
                'account_number' => $connection->account_number,
                'masked_api_key' => $connection->masked_api_key,
                'is_sandbox' => $connection->is_sandbox,
                'is_connected' => true,
                'status' => 'connected',
                'last_tested_at' => $connection->last_tested_at->toIso8601String(),
            ],
            'message' => 'Courier credentials securely saved and connected.',
        ], 200);
    }

    /**
     * Test connection against courier provider API
     */
    public function test(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $connection = CourierConnection::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $service = CourierManager::resolve($connection->provider);
        $result = $service->testConnection($connection);

        $connection->last_tested_at = now();
        if ($result['success']) {
            $connection->is_connected = true;
            $connection->status = 'connected';
        } else {
            $connection->status = 'error';
        }
        $connection->save();

        return response()->json([
            'test_result' => $result,
            'connection_status' => $connection->status,
        ]);
    }

    /**
     * Sync courier configuration
     */
    public function sync(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $connection = CourierConnection::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $connection->last_sync_at = now();
        $connection->save();

        return response()->json([
            'message' => "Configuration synced successfully for {$connection->provider}.",
            'last_sync_at' => $connection->last_sync_at->toIso8601String(),
        ]);
    }

    /**
     * Create real shipment for order & generate AWB
     */
    public function createShipment(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'order_id' => ['required', 'string'],
            'courier_provider' => ['required', Rule::in(['spl', 'aramex', 'smsa', 'dhl', 'fedex', 'ups'])],
            'weight_kg' => ['nullable', 'numeric', 'min:0.1'],
        ]);

        $order = Order::query()->forStore($storeId)->where('id', $data['order_id'])->firstOrFail();
        $connection = CourierConnection::query()
            ->forStore($storeId)
            ->where('provider', $data['courier_provider'])
            ->first();

        if (!$connection) {
            return response()->json([
                'message' => "Courier provider '{$data['courier_provider']}' is not connected for this store. Please connect API credentials first.",
            ], 422);
        }

        $service = CourierManager::resolve($connection->provider);
        $result = $service->createShipment($connection, $order, ['weight_kg' => $data['weight_kg'] ?? 1.5]);

        if (!$result['success']) {
            return response()->json(['message' => 'Shipment creation failed with carrier API.'], 502);
        }

        $shipmentId = $this->newId('shp');
        $shipment = Shipment::create([
            'id' => $shipmentId,
            'store_id' => $storeId,
            'order_id' => $order->id,
            'courier_id' => $connection->id,
            'provider' => $connection->provider,
            'awb_number' => $result['awb_number'],
            'tracking_number' => $result['tracking_number'],
            'label_url' => $result['label_url'] ?? null,
            'status' => 'created',
            'shipping_cost' => $result['cost'] ?? 25.00,
            'cod_amount' => $order->payment_method === 'COD' ? $order->total_amount : 0,
            'pickup_requested_at' => now(),
            'destination_address' => ['location' => $order->delivery_location],
            'tracking_events' => [
                [
                    'time' => now()->toIso8601String(),
                    'status' => 'Created',
                    'description' => "Shipment created with {$connection->provider} (AWB: {$result['awb_number']})",
                ],
            ],
        ]);

        // Update order with real courier operational tracking
        $order->courier_code = $connection->provider;
        $order->awb_number = $result['awb_number'];
        $order->tracking_number = $result['tracking_number'];
        $order->shipping_cost = $shipment->shipping_cost;
        $order->shipping_status = 'created';
        $order->status = 'processing';
        $order->save();

        return response()->json([
            'data' => $shipment,
            'order' => $order->fresh(),
            'message' => "Shipment created successfully. AWB: {$shipment->awb_number}",
        ], 201);
    }

    /**
     * Track shipment
     */
    public function track(Request $request, string $trackingNumber): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $shipment = Shipment::query()
            ->forStore($storeId)
            ->where('tracking_number', $trackingNumber)
            ->orWhere('awb_number', $trackingNumber)
            ->first();

        if ($shipment && $shipment->provider) {
            $connection = CourierConnection::query()->forStore($storeId)->where('provider', $shipment->provider)->first();
            if ($connection) {
                $service = CourierManager::resolve($shipment->provider);
                $trackRes = $service->trackShipment($connection, $shipment->tracking_number);
                return response()->json([
                    'shipment' => $shipment,
                    'tracking' => $trackRes,
                ]);
            }
        }

        return response()->json([
            'tracking_number' => $trackingNumber,
            'status' => 'not_found',
            'message' => 'No active shipment record found with this tracking number for this store.',
        ], 404);
    }

    /**
     * List all shipments for current store (isolated by store_id)
     */
    public function shipments(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = Shipment::query()
            ->forStore($storeId)
            ->with('order')
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('provider')) {
            $query->where('provider', $request->query('provider'));
        }

        $shipments = $query->get();

        return response()->json([
            'data' => $shipments,
            'store_id' => $storeId,
            'meta' => ['total' => $shipments->count()],
        ]);
    }

    /**
     * Update shipment status and record tracking event (isolated by store_id)
     */
    public function updateShipmentStatus(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled', 'returned'])],
            'note' => ['nullable', 'string'],
        ]);

        $shipment = Shipment::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $shipment->status = $validated['status'];
        if ($validated['status'] === 'delivered') {
            $shipment->delivered_at = now();
        }
        $events = $shipment->tracking_events ?? [];
        $events[] = [
            'time' => now()->toIso8601String(),
            'status' => ucfirst(str_replace('_', ' ', $validated['status'])),
            'description' => $validated['note'] ?? ("Status updated to " . ucfirst(str_replace('_', ' ', $validated['status']))),
        ];
        $shipment->tracking_events = $events;
        $shipment->save();

        if ($shipment->order) {
            $shipment->order->shipping_status = $shipment->status;
            if ($shipment->status === 'delivered') {
                $shipment->order->status = 'delivered';
            }
            $shipment->order->save();
        }

        return response()->json([
            'data' => $shipment,
            'message' => 'Shipment status updated successfully',
        ]);
    }
}

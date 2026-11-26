<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IntegrationHealthLog;
use App\Models\Store;
use App\Services\Integration\IntegrationHealthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IntegrationHealthController extends Controller
{
    public function __construct(
        private readonly IntegrationHealthService $health = new IntegrationHealthService(),
    ) {}

    /**
     * Master: aggregate payment + shipping health across stores.
     */
    public function index(Request $request): JsonResponse
    {
        $storeId = $request->query('store_id');
        if (is_string($storeId) && $storeId !== '') {
            if (!Store::query()->where('id', $storeId)->exists()) {
                return response()->json(['message' => 'Store not found.'], 404);
            }
        } else {
            $storeId = null;
        }

        return response()->json($this->health->aggregate($storeId));
    }

    /**
     * Master: one store detail.
     */
    public function show(Request $request, string $storeId): JsonResponse
    {
        if (!Store::query()->where('id', $storeId)->exists()) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $payload = $this->health->aggregate($storeId);
        $payments = array_values(array_filter($payload['data'], static fn ($r) => ($r['category'] ?? '') === 'payment'));
        $shipping = array_values(array_filter($payload['data'], static fn ($r) => ($r['category'] ?? '') === 'shipping'));

        return response()->json([
            'store_id' => $storeId,
            'payments' => $payments,
            'shipping' => $shipping,
            'meta' => $payload['meta'],
        ]);
    }

    /**
     * Master: run a discrete non-destructive test.
     */
    public function test(Request $request): JsonResponse
    {
        $data = $request->validate([
            'store_id' => ['required', 'string'],
            'category' => ['required', Rule::in(['payment', 'shipping'])],
            'provider' => ['required', 'string', 'max:64'],
            'test_type' => [
                'required',
                Rule::in([
                    'connection',
                    'authentication',
                    'payment_session',
                    'webhook',
                    'rates',
                    'shipment_create',
                    'tracking',
                    'label',
                ]),
            ],
            'allow_live' => ['nullable', 'boolean'],
        ]);

        if (!Store::query()->where('id', $data['store_id'])->exists()) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $result = $this->health->runTest(
            $data['store_id'],
            $data['category'],
            $data['provider'],
            $data['test_type'],
            ['allow_live' => (bool) ($data['allow_live'] ?? false)]
        );

        return response()->json($result, !empty($result['success']) ? 200 : 422);
    }

    /**
     * Master: full audit for one store (non-destructive connection probes).
     */
    public function audit(Request $request): JsonResponse
    {
        $data = $request->validate([
            'store_id' => ['required', 'string'],
        ]);

        if (!Store::query()->where('id', $data['store_id'])->exists()) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        return response()->json($this->health->runFullAudit($data['store_id']));
    }

    /**
     * Master: searchable sanitized integration logs.
     */
    public function logs(Request $request): JsonResponse
    {
        $data = $request->validate([
            'store_id' => ['nullable', 'string'],
            'provider' => ['nullable', 'string'],
            'category' => ['nullable', Rule::in(['payment', 'shipping'])],
            'success' => ['nullable', 'boolean'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $q = IntegrationHealthLog::query()->orderByDesc('created_at');
        if (!empty($data['store_id'])) {
            $q->where('store_id', $data['store_id']);
        }
        if (!empty($data['provider'])) {
            $q->where('provider', $data['provider']);
        }
        if (!empty($data['category'])) {
            $q->where('category', $data['category']);
        }
        if (array_key_exists('success', $data) && $data['success'] !== null) {
            $q->where('success', (bool) $data['success']);
        }
        if (!empty($data['from'])) {
            $q->where('created_at', '>=', $data['from']);
        }
        if (!empty($data['to'])) {
            $q->where('created_at', '<=', $data['to']);
        }

        $perPage = (int) ($data['per_page'] ?? 25);
        $page = $q->paginate($perPage);

        return response()->json([
            'data' => $page->items(),
            'meta' => [
                'total' => $page->total(),
                'per_page' => $page->perPage(),
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
            ],
        ]);
    }
}

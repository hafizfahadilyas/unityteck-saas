<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreAiDevRequest;
use App\Services\OpenAi\AiDeveloperDiagnosticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Phase 3 — Master-only AI developer diagnostics (read-only).
 * Merchants use store create endpoint only — never diagnose / never deploy.
 */
class MasterAiDeveloperController extends Controller
{
    public function __construct(
        private readonly AiDeveloperDiagnosticsService $diagnostics,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if (! Schema::hasTable('store_ai_dev_requests')) {
            return response()->json([
                'data' => [],
                'message' => 'store_ai_dev_requests not migrated yet.',
            ], 503);
        }

        $q = StoreAiDevRequest::query()->orderByDesc('created_at');
        if ($storeId = trim((string) $request->query('store_id', ''))) {
            $q->where('store_id', $storeId);
        }
        if ($status = trim((string) $request->query('status', ''))) {
            $q->where('status', $status);
        }

        $rows = $q->limit(100)->get();

        return response()->json([
            'data' => $rows,
            'count' => $rows->count(),
            'security' => [
                'auto_deploy_allowed' => false,
                'merchant_source_edit' => false,
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        if (! Schema::hasTable('store_ai_dev_requests')) {
            return response()->json(['message' => 'Table not migrated.'], 503);
        }

        $row = StoreAiDevRequest::query()->find($id);
        if (! $row) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json(['data' => $row]);
    }

    public function diagnose(Request $request): JsonResponse
    {
        $data = $request->validate([
            'store_id' => ['required', 'string', 'max:64'],
            'request_id' => ['nullable', 'string', 'max:64'],
        ]);

        $store = Store::query()->find($data['store_id']);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $req = null;
        if (! empty($data['request_id']) && Schema::hasTable('store_ai_dev_requests')) {
            $req = StoreAiDevRequest::query()
                ->where('id', $data['request_id'])
                ->where('store_id', $store->id)
                ->first();
            if (! $req) {
                return response()->json(['message' => 'Support request not found for store.'], 404);
            }
            $req->fill([
                'status' => 'diagnosing',
                'assigned_master_user_id' => $request->user()?->id,
                'auto_deploy_allowed' => false,
            ])->save();
        }

        $report = $this->diagnostics->diagnose($store, $req);

        if ($req) {
            $req->fill([
                'status' => 'awaiting_review',
                'diagnosis' => $report,
                'diagnosed_at' => now(),
                'auto_deploy_allowed' => false,
            ])->save();
        }

        return response()->json([
            'ok' => true,
            'data' => $report,
            'request' => $req,
        ]);
    }

    public function close(Request $request, string $id): JsonResponse
    {
        if (! Schema::hasTable('store_ai_dev_requests')) {
            return response()->json(['message' => 'Table not migrated.'], 503);
        }

        $row = StoreAiDevRequest::query()->find($id);
        if (! $row) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['closed', 'rejected'])],
            'master_notes' => ['nullable', 'string', 'max:4000'],
        ]);

        $row->fill([
            'status' => $data['status'],
            'master_notes' => $data['master_notes'] ?? $row->master_notes,
            'closed_at' => now(),
            'auto_deploy_allowed' => false,
        ])->save();

        return response()->json(['data' => $row]);
    }

    /** Hard ban — never implement auto deploy. */
    public function deployDenied(): JsonResponse
    {
        return response()->json([
            'ok' => false,
            'status' => 'BLOCKED',
            'code' => 'auto_deploy_forbidden',
            'message' => 'Automatic deploy of AI-generated fixes is forbidden. Master review + explicit deploy ask only.',
        ], 403);
    }
}

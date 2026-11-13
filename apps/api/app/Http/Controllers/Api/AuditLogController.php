<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** SOUQ PLUS Phase 1 — Master audit log read API. */
class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $portal = strtolower((string) $request->header('X-Portal', $request->attributes->get('portal', '')));
        $user = $request->user();
        if ($portal !== 'master' || ! $user || $user->role !== 'super_admin') {
            return response()->json(['message' => 'Master SuperAdmin required.'], 403);
        }

        $q = AuditLog::query()->orderByDesc('created_at');

        if ($action = trim((string) $request->query('action', ''))) {
            $q->where('action', 'like', '%'.$action.'%');
        }
        if ($entityType = trim((string) $request->query('entity_type', ''))) {
            $q->where('entity_type', $entityType);
        }
        if ($storeId = trim((string) $request->query('store_id', ''))) {
            $q->where('store_id', $storeId);
        }
        if ($userId = trim((string) $request->query('user_id', ''))) {
            $q->where('user_id', $userId);
        }
        if ($from = trim((string) $request->query('from', ''))) {
            $q->where('created_at', '>=', $from);
        }
        if ($to = trim((string) $request->query('to', ''))) {
            $q->where('created_at', '<=', $to);
        }

        $perPage = min(100, max(1, (int) $request->query('per_page', 50)));
        $page = max(1, (int) $request->query('page', 1));
        $paginator = $q->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'last_refresh' => now()->toIso8601String(),
                'source' => 'audit_logs',
            ],
        ]);
    }
}

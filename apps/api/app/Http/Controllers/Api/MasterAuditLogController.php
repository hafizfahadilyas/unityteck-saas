<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterCentralAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MasterAuditLogController extends Controller
{
    /**
     * Query and Filter Master Audit Logs
     */
    public function index(Request $request): JsonResponse
    {
        $query = MasterCentralAuditLog::orderBy('created_at', 'desc');

        if ($request->query('admin_id')) {
            $query->where('admin_id', $request->query('admin_id'));
        }
        if ($request->query('store_id')) {
            $query->where('store_id', $request->query('store_id'));
        }
        if ($request->query('domain')) {
            $query->where('domain', $request->query('domain'));
        }
        if ($request->query('action')) {
            $query->where('action', 'like', "%{$request->query('action')}%");
        }

        $perPage = (int) ($request->query('per_page') ?? 25);
        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'total_pages' => $logs->lastPage(),
                'total_records' => $logs->total(),
            ],
        ]);
    }
}

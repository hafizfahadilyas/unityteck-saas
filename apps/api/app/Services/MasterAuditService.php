<?php

namespace App\Services;

use App\Models\MasterCentralAuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class MasterAuditService
{
    /**
     * Record a Master Admin central control audit log entry.
     */
    public static function record(
        string $action,
        string $domain,
        ?string $storeId = null,
        ?string $merchantId = null,
        ?array $beforeState = null,
        ?array $afterState = null,
        ?string $reason = null,
        ?string $requestId = null
    ): MasterCentralAuditLog {
        $user = Auth::user();
        $adminId = $user ? $user->id : 'system';
        $ip = request()->ip();

        return MasterCentralAuditLog::create([
            'id' => 'audit_' . Str::uuid()->toString(),
            'admin_id' => $adminId,
            'merchant_id' => $merchantId,
            'store_id' => $storeId,
            'domain' => $domain,
            'action' => $action,
            'before_state' => $beforeState,
            'after_state' => $afterState,
            'reason' => $reason ?? 'Administrative update via Master Central Control Center',
            'ip_address' => $ip,
            'request_id' => $requestId ?? Str::random(16),
            'created_at' => now(),
        ]);
    }
}

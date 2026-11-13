<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * SOUQ PLUS Phase 1 — unified audit trail writer.
 * Never store passwords, OTP codes, or API secrets in meta.
 */
final class Audit
{
    private const REDACT_KEYS = [
        'password',
        'password_confirmation',
        'token',
        'secret',
        'api_key',
        'apiKey',
        'otp',
        'code',
        'authorization',
    ];

    /**
     * @param  array<string, mixed>|null  $meta
     */
    public static function record(
        ?string $storeId,
        ?string $userId,
        string $action,
        ?string $entityType = null,
        ?string $entityId = null,
        ?array $meta = null,
    ): void {
        try {
            AuditLog::query()->create([
                'id' => 'aud-'.Str::lower((string) Str::ulid()),
                'store_id' => $storeId,
                'user_id' => $userId,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'meta' => self::redact($meta),
                'created_at' => now(),
            ]);
        } catch (\Throwable) {
            // Audit must never break the primary mutation.
        }
    }

    public static function fromRequest(
        Request $request,
        string $action,
        ?string $entityType = null,
        ?string $entityId = null,
        ?array $meta = null,
        ?string $storeId = null,
    ): void {
        $user = $request->user();
        self::record(
            $storeId ?? (string) $request->attributes->get('store_id', '') ?: null,
            $user?->id,
            $action,
            $entityType,
            $entityId,
            $meta,
        );
    }

    /**
     * @param  array<string, mixed>|null  $meta
     * @return array<string, mixed>|null
     */
    public static function redact(?array $meta): ?array
    {
        if ($meta === null) {
            return null;
        }

        $out = [];
        foreach ($meta as $key => $value) {
            $k = strtolower((string) $key);
            if (in_array($k, self::REDACT_KEYS, true) || str_contains($k, 'password') || str_contains($k, 'secret')) {
                $out[$key] = '[redacted]';
                continue;
            }
            if (is_array($value)) {
                $out[$key] = self::redact($value) ?? [];
                continue;
            }
            $out[$key] = $value;
        }

        return $out;
    }
}

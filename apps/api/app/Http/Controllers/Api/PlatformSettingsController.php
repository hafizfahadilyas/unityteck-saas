<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Support\Audit;
use App\Support\PlatformSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** SOUQ PLUS Phase 1 §4.11 — persisted platform identity (Master). */
class PlatformSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $portal = strtolower((string) $request->header('X-Portal', $request->attributes->get('portal', '')));
        $user = $request->user();

        if ($portal === 'master') {
            if (! $user || $user->role !== 'super_admin') {
                return response()->json(['message' => 'Master SuperAdmin required.'], 403);
            }
        } elseif (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $merged = PlatformSettings::merged();
        $row = PlatformSetting::query()->find(PlatformSetting::ROW_ID);

        return response()->json([
            'data' => $merged,
            'meta' => [
                'updated_at' => $row?->updated_at?->toIso8601String(),
                'source' => 'platform_settings',
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $portal = strtolower((string) $request->header('X-Portal', ''));
        $user = $request->user();
        if ($portal !== 'master' || ! $user || $user->role !== 'super_admin') {
            return response()->json(['message' => 'Master SuperAdmin required.'], 403);
        }

        $data = $request->validate([
            'platformName' => ['nullable', 'string', 'max:191'],
            'platformNameAr' => ['nullable', 'string', 'max:191'],
            'platformTagline' => ['nullable', 'string', 'max:500'],
            'platformTaglineAr' => ['nullable', 'string', 'max:500'],
            'platformLogo' => ['nullable', 'string', 'max:500'],
            'supportEmail' => ['nullable', 'email', 'max:191'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'defaultLocale' => ['nullable', 'in:en,ar'],
            'defaultCurrency' => ['nullable', 'string', 'max:10'],
            'whatsappEnabled' => ['nullable', 'boolean'],
            'whatsappNumber' => ['nullable', 'string', 'max:32'],
            'socialLinks' => ['nullable', 'array'],
        ]);

        $row = PlatformSetting::query()->find(PlatformSetting::ROW_ID);
        $previous = is_array($row?->settings) ? $row->settings : [];
        $next = array_replace_recursive(PlatformSettings::defaults(), $previous, $data);

        if ($row) {
            $row->fill([
                'settings' => $next,
                'updated_by_user_id' => $user->id,
                'updated_at' => now(),
            ])->save();
        } else {
            PlatformSetting::query()->create([
                'id' => PlatformSetting::ROW_ID,
                'settings' => $next,
                'updated_by_user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Audit::fromRequest(
            $request,
            'platform_settings.updated',
            'platform_settings',
            PlatformSetting::ROW_ID,
            ['keys' => array_keys($data)],
        );

        return response()->json([
            'data' => $next,
            'meta' => [
                'updated_at' => now()->toIso8601String(),
                'source' => 'platform_settings',
            ],
        ]);
    }
}

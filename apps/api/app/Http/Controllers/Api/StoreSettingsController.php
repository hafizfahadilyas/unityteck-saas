<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreSettingsController extends Controller
{
    use ResolvesStoreId;

    /**
     * Get store settings.
     */
    public function show(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $storeSetting = StoreSetting::withoutGlobalScope('store')
            ->where('store_id', $id)
            ->first();

        return response()->json([
            'success' => true,
            'data' => $storeSetting?->settings ?? [],
            'store_id' => $id,
        ]);
    }

    public function subscribeNewsletter(Request $request): JsonResponse
    {
        $key = trim((string) ($request->input('store_id') ?? $request->header('X-Store-Id') ?? ''));
        $store = $key !== '' ? Store::query()->where('id', $key)->orWhere('slug', $key)->first() : null;
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }
        $email = strtolower(trim((string) $request->input('email', '')));
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['message' => 'Email is required.'], 422);
        }
        $row = StoreSetting::withoutGlobalScope('store')->where('store_id', $store->id)->first();
        $settings = is_array($row?->settings) ? $row->settings : [];
        $list = is_array($settings['newsletter_subscribers'] ?? null) ? $settings['newsletter_subscribers'] : [];
        $exists = false;
        foreach ($list as $item) {
            if (is_array($item) && strtolower((string) ($item['email'] ?? '')) === $email) {
                $exists = true;
            }
        }
        if (! $exists) {
            $list[] = ['email' => $email, 'created_at' => now()->toIso8601String()];
        }
        $settings['newsletter_subscribers'] = $list;
        if ($row) {
            $row->settings = $settings;
            $row->save();
        } else {
            StoreSetting::withoutGlobalScope('store')->create([
                'id' => $this->newId('set'),
                'store_id' => $store->id,
                'settings' => $settings,
            ]);
        }

        return response()->json([
            'success' => true,
            'store_id' => $store->id,
        ]);
    }

    /**
     * Update store settings.
     */
    public function update(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $data = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        $storeSetting = StoreSetting::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $id]);

        if (! $storeSetting->exists) {
            $storeSetting->id = $this->newId('sst');
            $storeSetting->store_id = $id;
        }

        $current = is_array($storeSetting->settings) ? $storeSetting->settings : [];
        $storeSetting->settings = array_merge($current, $data['settings']);
        $storeSetting->save();

        return response()->json([
            'success' => true,
            'data' => $storeSetting->settings,
            'message' => 'Store settings updated successfully.',
            'store_id' => $id,
        ]);
    }
}

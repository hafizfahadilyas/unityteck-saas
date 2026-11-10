<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StorefrontAnalyticsEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StorefrontAnalyticsController extends Controller
{
    public function storeEvent(Request $request): JsonResponse
    {
        $raw = (string) ($request->header('X-Store-Id') ?? $request->input('store_id', ''));
        if (trim($raw) === '') {
            return response()->json(['message' => 'Store ID required.'], 400);
        }

        $storeId = $this->resolvePublicStoreId($raw);
        if (! $storeId) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $validated = $request->validate([
            'event' => ['required', 'string', 'max:64'],
            'path' => ['nullable', 'string', 'max:512'],
            'source' => ['nullable', 'string', 'max:64'],
            'medium' => ['nullable', 'string', 'max:128'],
            'campaign' => ['nullable', 'string', 'max:191'],
            'customer_id' => ['nullable', 'string', 'max:64'],
            'session_key' => ['nullable', 'string', 'max:64'],
            'meta' => ['nullable', 'array'],
        ]);

        $eventName = strtolower(trim($validated['event']));
        $allowed = [
            'page_view',
            'product_view',
            'add_to_cart',
            'begin_checkout',
            'purchase',
            'search',
        ];
        if (! in_array($eventName, $allowed, true)) {
            return response()->json(['message' => 'Unsupported event.'], 422);
        }

        // Public storefront only — reject Store Admin / Master / preview pollution
        $surface = strtolower(trim((string) (
            $request->header('X-Storefront-Surface')
            ?? data_get($validated, 'meta.surface', '')
        )));
        if ($surface !== 'public_storefront') {
            return response()->json(['message' => 'Public storefront events only.'], 403);
        }
        $path = strtolower((string) ($validated['path'] ?? ''));
        if ($path !== '' && preg_match('/admin|dashboard|master-portal|\/master\b/', $path)) {
            return response()->json(['message' => 'Admin paths are not tracked as visits.'], 403);
        }

        $meta = is_array($validated['meta'] ?? null) ? $validated['meta'] : [];
        $meta['surface'] = 'public_storefront';

        // Count unique sessions as visits — never bump visitors_count on every page hit.
        if ($eventName === 'page_view') {
            $sessionKey = isset($validated['session_key']) ? trim((string) $validated['session_key']) : '';
            $shouldIncrement = true;
            if ($sessionKey !== '') {
                $already = StorefrontAnalyticsEvent::query()
                    ->where('store_id', $storeId)
                    ->where('event_name', 'page_view')
                    ->where('session_key', $sessionKey)
                    ->where('created_at', '>=', now()->subDay())
                    ->exists();
                $shouldIncrement = ! $already;
            }
            if ($shouldIncrement) {
                Store::query()->where('id', $storeId)->increment('visitors_count');
            }
        }

        $row = StorefrontAnalyticsEvent::query()->create([
            'id' => 'evt-'.(string) Str::uuid(),
            'store_id' => $storeId,
            'event_name' => $eventName,
            'path' => $validated['path'] ?? null,
            'source' => $validated['source'] ?? null,
            'medium' => $validated['medium'] ?? null,
            'campaign' => $validated['campaign'] ?? null,
            'customer_id' => $validated['customer_id'] ?? null,
            'session_key' => $validated['session_key'] ?? null,
            'meta' => $meta,
        ]);

        return response()->json(['success' => true, 'id' => $row->id], 201);
    }

    private function resolvePublicStoreId(string $raw): ?string
    {
        $s = strtolower(trim($raw));
        if ($s === '') {
            return null;
        }
        if (Store::query()->where('id', $raw)->exists()) {
            return $raw;
        }
        $matched = Store::query()->where('id', $raw)->orWhere('slug', $raw)->orWhere('slug', $s)->value('id');

        return $matched ?: null;
    }
}

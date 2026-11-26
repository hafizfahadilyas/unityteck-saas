<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\StoreUtmLink;
use App\Models\StorefrontAnalyticsEvent;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class UtmTrackingController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! Schema::hasTable('store_utm_links')) {
            return response()->json(['store_id' => $storeId, 'data' => []]);
        }

        $rows = StoreUtmLink::query()
            ->forStore($storeId)
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        $enriched = $rows->map(function (StoreUtmLink $link) use ($storeId) {
            $stats = $this->linkPerformance($storeId, $link);

            return [
                'id' => $link->id,
                'name' => $link->name,
                'platform_key' => $link->platform_key,
                'target_path' => $link->target_path,
                'product_id' => $link->product_id,
                'url' => $link->target_url,
                'source' => $link->utm_source,
                'medium' => $link->utm_medium,
                'campaign' => $link->utm_campaign,
                'term' => $link->utm_term,
                'content' => $link->utm_content,
                'created_at' => $link->created_at?->toIso8601String(),
                'clicks' => $stats['sessions'],
                'conversions' => $stats['orders'],
                'revenue' => $stats['revenue'],
            ];
        });

        return response()->json(['store_id' => $storeId, 'data' => $enriched->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! Schema::hasTable('store_utm_links')) {
            return response()->json(['message' => 'UTM links table missing. Run migrations.'], 503);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:191'],
            'platform_key' => ['nullable', 'string', 'max:64'],
            'target_path' => ['nullable', 'string', 'max:512'],
            'product_id' => ['nullable', 'string', 'max:64'],
            'target_url' => ['required', 'string', 'max:1024'],
            'utm_source' => ['required', 'string', 'max:128'],
            'utm_medium' => ['required', 'string', 'max:128'],
            'utm_campaign' => ['required', 'string', 'max:191'],
            'utm_term' => ['nullable', 'string', 'max:128'],
            'utm_content' => ['nullable', 'string', 'max:128'],
        ]);

        $row = StoreUtmLink::query()->create([
            'id' => 'utm-'.(string) Str::uuid(),
            'store_id' => $storeId,
            'name' => trim($validated['name']),
            'platform_key' => $validated['platform_key'] ?? null,
            'target_path' => $validated['target_path'] ?? null,
            'product_id' => $validated['product_id'] ?? null,
            'target_url' => trim($validated['target_url']),
            'utm_source' => strtolower(trim($validated['utm_source'])),
            'utm_medium' => strtolower(trim($validated['utm_medium'])),
            'utm_campaign' => strtolower(trim($validated['utm_campaign'])),
            'utm_term' => isset($validated['utm_term']) ? trim((string) $validated['utm_term']) ?: null : null,
            'utm_content' => isset($validated['utm_content']) ? strtolower(trim((string) $validated['utm_content'])) ?: null : null,
        ]);

        return response()->json(['success' => true, 'id' => $row->id], 201);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! Schema::hasTable('store_utm_links')) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $deleted = StoreUtmLink::query()
            ->forStore($storeId)
            ->where('id', $id)
            ->delete();

        if ($deleted < 1) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json(['success' => true]);
    }

    /**
     * @return array{sessions: int, orders: int, revenue: float}
     */
    private function linkPerformance(string $storeId, StoreUtmLink $link): array
    {
        $sessions = 0;
        $orders = 0;
        $revenue = 0.0;

        if (Schema::hasTable('storefront_analytics_events')) {
            $from = Carbon::now()->subDays(90)->startOfDay();
            $sessions = (int) StorefrontAnalyticsEvent::query()
                ->forStore($storeId)
                ->publicStorefront()
                ->where('event_name', 'page_view')
                ->where('campaign', $link->utm_campaign)
                ->where('medium', $link->utm_medium)
                ->whereBetween('created_at', [$from, Carbon::now()])
                ->where(function ($q) use ($link) {
                    $q->where('source', $this->canonicalSourceLabel($link->utm_source))
                        ->orWhere('source', 'like', '%'.$link->utm_source.'%');
                })
                ->distinct()
                ->count('session_key');
        }

        $ordersQuery = Order::query()
            ->forStore($storeId)
            ->where('status', '!=', 'cancelled')
            ->where('campaign', $link->utm_campaign)
            ->where('medium', $link->utm_medium);

        $orders = (clone $ordersQuery)->count();
        $revenue = (float) ((clone $ordersQuery)->sum('total_amount') ?? 0);

        return ['sessions' => $sessions, 'orders' => $orders, 'revenue' => $revenue];
    }

    private function canonicalSourceLabel(string $utmSource): string
    {
        $s = strtolower(trim($utmSource));
        return match (true) {
            str_contains($s, 'whatsapp') || $s === 'wa' => 'WhatsApp',
            str_contains($s, 'instagram') || $s === 'ig' => 'Instagram',
            str_contains($s, 'facebook') || $s === 'fb' => 'Facebook',
            str_contains($s, 'tiktok') => 'TikTok',
            str_contains($s, 'snap') => 'Snapchat',
            str_contains($s, 'google') => 'Google Ads',
            str_contains($s, 'telegram') => 'Referral',
            str_contains($s, 'email') => 'Referral',
            default => 'Referral',
        };
    }
}
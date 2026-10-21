<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\StoreSetting;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartInterceptController extends Controller
{
    use ResolvesStoreId;

    /**
     * Default configuration for Cart Intercept Popup (Flowers Store).
     */
    protected function defaultSettings(): array
    {
        return [
            'enabled' => true,
            'active_modal' => 'loyalty', // 'loyalty' | 'gift' | 'save_cart' | 'disabled'
            'loyalty_points' => 25,
            'discount_percent' => 10,
            'coupon_code' => 'HADAYA10',
            'title_en' => "Don't Lose Your Points!",
            'title_ar' => 'لا تفوّت نقاطك الذهبية!',
            'subtitle_en' => 'Log in and earn 25 points on this cart.',
            'subtitle_ar' => 'سجّل دخولك الآن واكسب 25 نقطة إضافية على هذه السلة.',
            'gift_title_en' => 'Your Gift is Ready!',
            'gift_title_ar' => 'هديتك بانتظارك!',
            'gift_subtitle_en' => 'Log in now and get 10% OFF automatically applied to your cart.',
            'gift_subtitle_ar' => 'سجّل دخولك الآن واحصل على خصم 10% يطبق تلقائياً على سلتك.',
            'save_cart_title_en' => 'Save Your Cart?',
            'save_cart_title_ar' => 'هل ترغب بحفظ سلتك؟',
            'save_cart_subtitle_en' => "As a guest, your cart might be lost. Log in and we'll save it for you across any device.",
            'save_cart_subtitle_ar' => 'كزائر، قد تفقد سلتك عند إغلاق المتصفح. سجّل دخولك وسنحفظها لك عبر جميع أجهزتك.',
        ];
    }

    /**
     * Helper to get StoreSetting record.
     */
    protected function getStoreSetting(string $storeId): StoreSetting
    {
        $setting = StoreSetting::withoutGlobalScope('store')->firstOrNew(['store_id' => $storeId]);
        if (! $setting->exists) {
            $setting->id = $this->newId('sst');
            $setting->store_id = $storeId;
            $setting->settings = [];
        }
        return $setting;
    }

    /**
     * Get Cart Intercept settings for a store.
     */
    public function getSettings(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $setting = $this->getStoreSetting($id);
        $settingsArray = is_array($setting->settings) ? $setting->settings : [];
        $interceptConfig = array_merge($this->defaultSettings(), $settingsArray['cart_intercept_config'] ?? []);

        return response()->json([
            'success' => true,
            'data' => $interceptConfig,
            'store_id' => $id,
        ]);
    }

    /**
     * Update Cart Intercept settings for a store.
     */
    public function updateSettings(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'active_modal' => ['required', 'string', 'in:loyalty,gift,save_cart,disabled'],
            'loyalty_points' => ['nullable', 'integer', 'min:1'],
            'discount_percent' => ['nullable', 'numeric', 'min:1', 'max:100'],
            'coupon_code' => ['nullable', 'string', 'max:32'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'title_ar' => ['nullable', 'string', 'max:255'],
            'subtitle_en' => ['nullable', 'string', 'max:500'],
            'subtitle_ar' => ['nullable', 'string', 'max:500'],
            'gift_title_en' => ['nullable', 'string', 'max:255'],
            'gift_title_ar' => ['nullable', 'string', 'max:255'],
            'gift_subtitle_en' => ['nullable', 'string', 'max:500'],
            'gift_subtitle_ar' => ['nullable', 'string', 'max:500'],
            'save_cart_title_en' => ['nullable', 'string', 'max:255'],
            'save_cart_title_ar' => ['nullable', 'string', 'max:255'],
            'save_cart_subtitle_en' => ['nullable', 'string', 'max:500'],
            'save_cart_subtitle_ar' => ['nullable', 'string', 'max:500'],
        ]);

        $setting = $this->getStoreSetting($id);
        $settingsArray = is_array($setting->settings) ? $setting->settings : [];
        $current = array_merge($this->defaultSettings(), $settingsArray['cart_intercept_config'] ?? []);
        $merged = array_merge($current, $data);

        $settingsArray['cart_intercept_config'] = $merged;
        $setting->settings = $settingsArray;
        $setting->save();

        return response()->json([
            'success' => true,
            'data' => $merged,
            'message' => 'Cart intercept settings updated successfully.',
            'store_id' => $id,
        ]);
    }

    /**
     * Public storefront tracking endpoint: records view or action, and assigns customer benefits.
     */
    public function trackAction(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $validated = $request->validate([
            'visitor_id' => ['required', 'string', 'max:128'],
            'customer_id' => ['nullable', 'string', 'max:128'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_email' => ['nullable', 'string', 'max:255'],
            'modal_type' => ['required', 'string', 'in:loyalty,gift,save_cart'],
            'action' => ['required', 'string', 'in:impression,collect_points,get_code,save_cart,continue_as_guest,later,dismissed'],
            'product_id' => ['nullable', 'string', 'max:128'],
            'product_name' => ['nullable', 'string', 'max:255'],
            'product_price' => ['nullable', 'numeric'],
            'product_image' => ['nullable', 'string', 'max:1000'],
            'cart_items' => ['nullable', 'array'],
        ]);

        $setting = $this->getStoreSetting($id);
        $settingsArray = is_array($setting->settings) ? $setting->settings : [];
        $trackingLogs = $settingsArray['cart_intercept_tracking'] ?? [];

        $isConversion = in_array($validated['action'], ['collect_points', 'get_code', 'save_cart']);
        $status = $isConversion
            ? 'converted'
            : ($validated['action'] === 'impression' ? 'viewed' : ($validated['action'] === 'dismissed' ? 'dismissed' : 'guest_continued'));

        $logEntry = [
            'id' => $this->newId('cit'),
            'visitor_id' => $validated['visitor_id'],
            'customer_id' => $validated['customer_id'] ?? null,
            'customer_name' => $validated['customer_name'] ?? null,
            'customer_email' => $validated['customer_email'] ?? null,
            'modal_type' => $validated['modal_type'],
            'action' => $validated['action'],
            'product_id' => $validated['product_id'] ?? null,
            'product_name' => $validated['product_name'] ?? null,
            'product_price' => $validated['product_price'] ?? null,
            'product_image' => $validated['product_image'] ?? null,
            'status' => $status,
            'ip' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'created_at' => Carbon::now()->toIso8601String(),
        ];

        // Keep most recent 500 tracking logs in store_settings for quick, efficient audit & dashboard
        array_unshift($trackingLogs, $logEntry);
        if (count($trackingLogs) > 500) {
            $trackingLogs = array_slice($trackingLogs, 0, 500);
        }
        $settingsArray['cart_intercept_tracking'] = $trackingLogs;

        // If customer is identified and converted, store in their customer profile rewards & saved carts
        $customerId = $validated['customer_id'] ?? $validated['customer_email'] ?? null;
        if ($customerId) {
            $customerRewards = $settingsArray['cart_intercept_customer_rewards'] ?? [];
            $existing = $customerRewards[$customerId] ?? [
                'loyalty_points' => 0,
                'claimed_coupons' => [],
                'saved_carts' => [],
            ];

            if ($validated['action'] === 'collect_points') {
                $points = (int) ($settingsArray['cart_intercept_config']['loyalty_points'] ?? 25);
                $existing['loyalty_points'] = ($existing['loyalty_points'] ?? 0) + $points;
                $existing['points_history'][] = [
                    'points' => $points,
                    'reason' => 'Cart Intercept Loyalty Reward',
                    'reason_ar' => 'مكافأة سلة هدايا مكة',
                    'date' => Carbon::now()->toIso8601String(),
                ];
            } elseif ($validated['action'] === 'get_code') {
                $code = $settingsArray['cart_intercept_config']['coupon_code'] ?? 'HADAYA10';
                $percent = (int) ($settingsArray['cart_intercept_config']['discount_percent'] ?? 10);
                $existing['claimed_coupons'][] = [
                    'code' => $code,
                    'discount_percent' => $percent,
                    'claimed_at' => Carbon::now()->toIso8601String(),
                    'is_used' => false,
                ];
            } elseif ($validated['action'] === 'save_cart' && ! empty($validated['cart_items'])) {
                $existing['saved_carts'][] = [
                    'id' => $this->newId('sc'),
                    'items' => $validated['cart_items'],
                    'product_preview' => $validated['product_name'] ?? 'Bouquet',
                    'saved_at' => Carbon::now()->toIso8601String(),
                ];
            }

            $customerRewards[$customerId] = $existing;
            $settingsArray['cart_intercept_customer_rewards'] = $customerRewards;
        }

        $setting->settings = $settingsArray;
        $setting->save();

        return response()->json([
            'success' => true,
            'message' => 'Tracking event recorded.',
            'entry' => $logEntry,
        ]);
    }

    /**
     * Get tracking audit logs and analytics for admin dashboard.
     */
    public function getTracking(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) {
            return $id;
        }

        $setting = $this->getStoreSetting($id);
        $settingsArray = is_array($setting->settings) ? $setting->settings : [];
        $logs = $settingsArray['cart_intercept_tracking'] ?? [];

        // Calculate real analytics metrics
        $totalImpressions = 0;
        $totalConverted = 0;
        $totalGuestContinued = 0;
        $totalDismissed = 0;
        $byModal = [
            'loyalty' => ['impressions' => 0, 'conversions' => 0],
            'gift' => ['impressions' => 0, 'conversions' => 0],
            'save_cart' => ['impressions' => 0, 'conversions' => 0],
        ];

        foreach ($logs as $log) {
            $modal = $log['modal_type'] ?? 'loyalty';
            if (! isset($byModal[$modal])) {
                $byModal[$modal] = ['impressions' => 0, 'conversions' => 0];
            }

            if ($log['action'] === 'impression') {
                $totalImpressions++;
                $byModal[$modal]['impressions']++;
            } elseif (in_array($log['action'], ['collect_points', 'get_code', 'save_cart'])) {
                $totalConverted++;
                $byModal[$modal]['conversions']++;
            } elseif (in_array($log['action'], ['continue_as_guest', 'later'])) {
                $totalGuestContinued++;
            } elseif ($log['action'] === 'dismissed') {
                $totalDismissed++;
            }
        }

        $conversionRate = $totalImpressions > 0
            ? round(($totalConverted / $totalImpressions) * 100, 1)
            : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'logs' => $logs,
                'metrics' => [
                    'total_impressions' => $totalImpressions,
                    'total_converted' => $totalConverted,
                    'total_guest_continued' => $totalGuestContinued,
                    'total_dismissed' => $totalDismissed,
                    'conversion_rate' => $conversionRate,
                    'by_modal' => $byModal,
                ],
            ],
            'store_id' => $id,
        ]);
    }

    /**
     * Get customer-specific rewards, claimed coupons, and saved carts for User CRM Profile.
     */
    public function getCustomerProfileRewards(Request $request, string $storeId, string $customerId): JsonResponse
    {
        $setting = $this->getStoreSetting($storeId);
        $settingsArray = is_array($setting->settings) ? $setting->settings : [];
        $customerRewards = $settingsArray['cart_intercept_customer_rewards'] ?? [];

        $data = $customerRewards[$customerId] ?? [
            'loyalty_points' => 0,
            'claimed_coupons' => [],
            'saved_carts' => [],
            'points_history' => [],
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
            'store_id' => $storeId,
            'customer_id' => $customerId,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationSettingsController extends Controller
{
    use ResolvesStoreId;

    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get store notification configuration and bilingual templates
     */
    public function getSettings(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->where('id', $storeId)->first();
        $storedSettings = $store && is_array($store->settings) ? ($store->settings['notifications'] ?? []) : [];

        $defaultConfig = [
            'store_id' => $storeId,
            'channels' => [
                'whatsapp' => [
                    'enabled' => $storedSettings['whatsapp']['enabled'] ?? true,
                    'provider' => $storedSettings['whatsapp']['provider'] ?? 'whatsapp_cloud_api',
                    'sender_phone' => $storedSettings['whatsapp']['sender_phone'] ?? '+966125558899',
                    'auto_notify_customer' => $storedSettings['whatsapp']['auto_notify_customer'] ?? true,
                    'auto_notify_merchant' => $storedSettings['whatsapp']['auto_notify_merchant'] ?? true,
                ],
                'sms' => [
                    'enabled' => $storedSettings['sms']['enabled'] ?? true,
                    'provider' => $storedSettings['sms']['provider'] ?? 'unifonic_ksa',
                    'sender_id' => $storedSettings['sms']['sender_id'] ?? 'MakkahGifts',
                    'auto_notify_customer' => $storedSettings['sms']['auto_notify_customer'] ?? true,
                    'auto_notify_merchant' => $storedSettings['sms']['auto_notify_merchant'] ?? false,
                ],
            ],
            'templates' => $storedSettings['templates'] ?? NotificationService::getDefaultTemplates(),
            'merchant_alert_phones' => $storedSettings['merchant_alert_phones'] ?? ['+966554128899'],
        ];

        return response()->json([
            'success' => true,
            'data' => $defaultConfig,
        ]);
    }

    /**
     * Update store notification configuration and custom templates
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->where('id', $storeId)->first();
        if (!$store) {
            return response()->json(['success' => false, 'message' => 'Store not found'], 404);
        }

        $validated = $request->validate([
            'channels' => ['required', 'array'],
            'templates' => ['required', 'array'],
            'merchant_alert_phones' => ['nullable', 'array'],
        ]);

        $currentSettings = is_array($store->settings) ? $store->settings : [];
        $currentSettings['notifications'] = $validated;
        $store->settings = $currentSettings;
        $store->save();

        return response()->json([
            'success' => true,
            'message' => 'Notification settings and bilingual templates saved successfully ✓',
            'data' => array_merge(['store_id' => $storeId], $validated),
        ]);
    }

    /**
     * Send test SMS / WhatsApp notification for simulated order
     */
    public function sendTestNotification(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $validated = $request->validate([
            'event' => ['required', 'string'],
            'recipient_phone' => ['required', 'string'],
            'channel' => ['required', 'in:whatsapp,sms,both'],
            'order_id' => ['nullable', 'string'],
        ]);

        $order = null;
        if (!empty($validated['order_id'])) {
            $order = Order::query()->where('store_id', $storeId)->where('id', $validated['order_id'])->first();
        }

        if (!$order) {
            // Simulated high-fidelity order for testing
            $order = new Order([
                'id' => 'ord-sim-' . rand(100, 999),
                'store_id' => $storeId,
                'order_number' => 'ORD-9842',
                'customer_name' => 'فهد العتيبي (Fahad Al-Otaibi)',
                'customer_phone' => $validated['recipient_phone'],
                'total' => 450.00,
                'payment_method' => 'Mada / Apple Pay',
                'delivery_location' => 'مكة المكرمة - حي العوالي',
                'shipping_company' => 'SMSA Express',
                'tracking_number' => 'SMSA-984210-SA',
                'status' => 'shipped',
            ]);
        }

        $channelSettings = [
            'whatsapp_enabled' => in_array($validated['channel'], ['whatsapp', 'both']),
            'sms_enabled' => in_array($validated['channel'], ['sms', 'both']),
        ];

        $res = $this->notificationService->sendOrderNotification(
            $validated['event'],
            $order,
            $channelSettings
        );

        return response()->json($res);
    }
}

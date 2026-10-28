<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationDelivery;
use App\Models\Order;
use App\Models\Store;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationSettingsController extends Controller
{
    use ResolvesStoreId;

    public function __construct(protected NotificationService $notificationService)
    {
    }

    public function getSettings(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $config = $this->notificationService->resolveStoreConfig($storeId);

        // Mask secrets — never leak tokens to UI; expose connection flags only for THIS store
        $wa = &$config['channels']['whatsapp'];
        $wa['access_token_set'] = !empty($wa['access_token']);
        $wa['connected'] = $this->notificationService->isWhatsAppConnected($wa);
        $wa['access_token'] = null;

        $sms = &$config['channels']['sms'];
        $sms['credentials_set'] = $this->notificationService->isSmsConnected($sms);
        $sms['connected'] = $sms['credentials_set'];
        $sms['app_sid'] = null;
        $sms['api_key'] = null;

        $email = &$config['channels']['email'];
        $email['connected'] = $this->notificationService->isEmailConnected($email);
        $email['ready'] = $email['connected'];
        if (!empty($email['smtp']['password'])) {
            $email['smtp']['password'] = null;
            $email['smtp']['password_set'] = true;
        } else {
            $email['smtp']['password_set'] = false;
        }

        $config['isolation'] = [
            'mode' => 'store_scoped',
            'store_id' => $storeId,
            'note' => 'WhatsApp, SMS, email, templates, and merchant alerts belong only to this store_id.',
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge(['store_id' => $storeId], $config),
        ]);
    }

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
            'channels.whatsapp' => ['nullable', 'array'],
            'channels.sms' => ['nullable', 'array'],
            'channels.email' => ['nullable', 'array'],
            'channels.email.smtp' => ['nullable', 'array'],
            'channels.email.allow_platform_mail' => ['nullable', 'boolean'],
            'channels.sms.app_sid' => ['nullable', 'string', 'max:255'],
            'channels.sms.api_key' => ['nullable', 'string', 'max:255'],
            'channels.sms.sender_id' => ['nullable', 'string', 'max:32'],
            'channels.sms.provider' => ['nullable', 'string', 'max:64'],
            'templates' => ['required', 'array'],
            'merchant_alert_phones' => ['nullable', 'array'],
            'merchant_alert_phones.*' => ['nullable', 'string', 'max:32'],
            'merchant_alert_emails' => ['nullable', 'array'],
            'merchant_alert_emails.*' => ['nullable', 'email', 'max:191'],
            'locale' => ['nullable', 'string', 'max:8'],
        ]);

        $currentSettings = is_array($store->settings) ? $store->settings : [];
        $prev = is_array($currentSettings['notifications'] ?? null) ? $currentSettings['notifications'] : [];

        // Do not wipe secrets when UI sends null placeholders
        foreach (['whatsapp', 'sms', 'email'] as $ch) {
            if (!isset($validated['channels'][$ch]) || !is_array($validated['channels'][$ch])) {
                continue;
            }
            foreach (['access_token', 'app_sid', 'api_key'] as $secret) {
                if (array_key_exists($secret, $validated['channels'][$ch])
                    && ($validated['channels'][$ch][$secret] === null || $validated['channels'][$ch][$secret] === '')
                ) {
                    unset($validated['channels'][$ch][$secret]);
                }
            }
            if ($ch === 'email' && isset($validated['channels']['email']['smtp']) && is_array($validated['channels']['email']['smtp'])) {
                if (empty($validated['channels']['email']['smtp']['password'])) {
                    unset($validated['channels']['email']['smtp']['password']);
                }
            }
            // Strip UI-only flags
            unset(
                $validated['channels'][$ch]['access_token_set'],
                $validated['channels'][$ch]['credentials_set'],
                $validated['channels'][$ch]['connected'],
                $validated['channels'][$ch]['ready'],
                $validated['channels'][$ch]['mailer']
            );
        }

        $merged = array_replace_recursive($prev, $validated);
        $merged['store_id'] = $storeId;
        $currentSettings['notifications'] = $merged;
        $store->settings = $currentSettings;
        $store->save();

        return response()->json([
            'success' => true,
            'message' => 'Store-isolated notification settings saved',
            'data' => array_merge(['store_id' => $storeId], $merged),
        ]);
    }

    public function sendTestNotification(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $validated = $request->validate([
            'event' => ['required', 'string'],
            'recipient_phone' => ['nullable', 'string'],
            'recipient_email' => ['nullable', 'email'],
            'channel' => ['required', 'in:whatsapp,sms,email,both,all'],
            'order_id' => ['nullable', 'string'],
        ]);

        $order = null;
        if (!empty($validated['order_id'])) {
            // Strict store isolation on test order lookup
            $order = Order::query()
                ->where('store_id', $storeId)
                ->where('id', $validated['order_id'])
                ->first();
        }

        if (!$order) {
            $order = new Order([
                'id' => 'ord-test-' . bin2hex(random_bytes(3)),
                'store_id' => $storeId,
                'order_number' => 'TEST-ORDER',
                'customer_name' => 'Test Customer',
                'customer_phone' => $validated['recipient_phone'] ?? null,
                'customer_email' => $validated['recipient_email'] ?? null,
                'total_amount' => 0,
                'payment_method' => '',
                'payment_status' => 'Pending',
                'delivery_location' => '',
                'tracking_number' => '',
                'status' => 'pending',
            ]);
        }

        // Refuse if somehow store_id drifted
        if ((string) $order->store_id !== (string) $storeId) {
            return response()->json([
                'success' => false,
                'message' => 'Order does not belong to this store',
            ], 403);
        }

        $channel = $validated['channel'];
        $overrides = [
            'whatsapp_enabled' => in_array($channel, ['whatsapp', 'both', 'all'], true),
            'sms_enabled' => in_array($channel, ['sms', 'both', 'all'], true),
            'email_enabled' => in_array($channel, ['email', 'all'], true),
            'force_phone' => $validated['recipient_phone'] ?? null,
            'force_email' => $validated['recipient_email'] ?? null,
        ];

        $res = $this->notificationService->sendOrderNotification(
            $validated['event'],
            $order,
            $overrides
        );

        return response()->json($res, ($res['success'] ?? false) ? 200 : 422);
    }

    /**
     * Merchant manage page: real Email / WhatsApp / SMS delivery log for this store.
     */
    public function listDeliveries(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $validated = $request->validate([
            'channel' => ['nullable', 'in:whatsapp,sms,email,all'],
            'status' => ['nullable', 'in:sent,failed,skipped,all'],
            'event' => ['nullable', 'string', 'max:64'],
            'unread_only' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $limit = (int) ($validated['limit'] ?? 100);
        $query = NotificationDelivery::query()
            ->forStore($storeId)
            ->orderByDesc('created_at');

        if (!empty($validated['channel']) && $validated['channel'] !== 'all') {
            $query->where('channel', $validated['channel']);
        }
        if (!empty($validated['status']) && $validated['status'] !== 'all') {
            $query->where('status', $validated['status']);
        }
        if (!empty($validated['event'])) {
            $query->where('event', $validated['event']);
        }
        if ($request->boolean('unread_only')) {
            $query->where('merchant_read', false);
        }

        $rows = $query->limit($limit)->get();

        $unread = NotificationDelivery::query()
            ->forStore($storeId)
            ->where('merchant_read', false)
            ->count();

        $summary = [
            'total' => NotificationDelivery::query()->forStore($storeId)->count(),
            'unread' => $unread,
            'sent' => NotificationDelivery::query()->forStore($storeId)->where('status', 'sent')->count(),
            'failed' => NotificationDelivery::query()->forStore($storeId)->where('status', 'failed')->count(),
            'skipped' => NotificationDelivery::query()->forStore($storeId)->where('status', 'skipped')->count(),
            'by_channel' => [
                'email' => NotificationDelivery::query()->forStore($storeId)->where('channel', 'email')->where('status', 'sent')->count(),
                'whatsapp' => NotificationDelivery::query()->forStore($storeId)->where('channel', 'whatsapp')->where('status', 'sent')->count(),
                'sms' => NotificationDelivery::query()->forStore($storeId)->where('channel', 'sms')->where('status', 'sent')->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'store_id' => $storeId,
                'summary' => $summary,
                'items' => $rows,
            ],
        ]);
    }

    public function markDeliveriesRead(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $validated = $request->validate([
            'ids' => ['nullable', 'array'],
            'ids.*' => ['string', 'max:40'],
            'all' => ['nullable', 'boolean'],
        ]);

        $query = NotificationDelivery::query()->forStore($storeId)->where('merchant_read', false);

        if (!empty($validated['all'])) {
            $updated = $query->update(['merchant_read' => true]);
        } elseif (!empty($validated['ids'])) {
            $updated = $query->whereIn('id', $validated['ids'])->update(['merchant_read' => true]);
        } else {
            return response()->json(['success' => false, 'message' => 'Provide ids[] or all=true'], 422);
        }

        return response()->json([
            'success' => true,
            'updated' => $updated,
        ]);
    }
}

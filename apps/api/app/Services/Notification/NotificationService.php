<?php

namespace App\Services\Notification;

use App\Models\NotificationDelivery;
use App\Models\Order;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Services\Notification\Channels\EmailChannel;
use App\Services\Notification\Channels\SmsGatewayChannel;
use App\Services\Notification\Channels\WhatsAppCloudChannel;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Real transactional Email + WhatsApp Cloud + KSA SMS (Unifonic/Taqnyat).
 * Never reports delivered/sent without a real provider response.
 */
class NotificationService
{
    public function __construct(
        protected ?WhatsAppCloudChannel $whatsapp = null,
        protected ?SmsGatewayChannel $sms = null,
        protected ?EmailChannel $email = null,
    ) {
        $this->whatsapp ??= new WhatsAppCloudChannel();
        $this->sms ??= new SmsGatewayChannel();
        $this->email ??= new EmailChannel();
    }

    public static function normalizeSaudiPhoneNumber(?string $phone): ?string
    {
        if (!$phone) {
            return null;
        }

        $cleaned = preg_replace('/[^\d+]/', '', $phone);
        $cleaned = preg_replace('/^\++/', '', $cleaned);

        if (preg_match('/^05(\d{8})$/', $cleaned, $matches)) {
            return '+9665' . $matches[1];
        }
        if (preg_match('/^5(\d{8})$/', $cleaned, $matches)) {
            return '+9665' . $matches[1];
        }
        if (preg_match('/^9665(\d{8})$/', $cleaned, $matches)) {
            return '+9665' . $matches[1];
        }
        if (preg_match('/^966(\d{9})$/', $cleaned)) {
            return '+' . $cleaned;
        }

        return '+' . ltrim($cleaned, '+');
    }

    public static function isValidSaudiMobile(?string $normalizedPhone): bool
    {
        if (!$normalizedPhone) {
            return false;
        }

        return (bool) preg_match('/^\+9665\d{8}$/', $normalizedPhone);
    }

    public static function getDefaultTemplates(): array
    {
        return [
            'order_placed' => [
                'event' => 'order_placed',
                'name_en' => 'Order Placed & Confirmed',
                'name_ar' => 'تم استلام وتأكيد الطلب',
                'sms_template_ar' => 'مرحباً {{customer_name}}، تم استلام طلبك رقم {{order_number}} لدى {{store_name}} بمبلغ {{order_total}} ر.س.',
                'sms_template_en' => 'Hello {{customer_name}}, order #{{order_number}} at {{store_name}} received for {{order_total}} SAR.',
                'whatsapp_template_ar' => "🎉 *مرحباً {{customer_name}}*\n\nتم تأكيد طلبك من *{{store_name}}*!\n\n📋 *الطلب:* #{{order_number}}\n💰 *الإجمالي:* {{order_total}} {{currency}}\n💳 *الدفع:* {{payment_method}} ({{payment_status}})\n📍 *التوصيل:* {{delivery_city}}\n🔗 تتبع الطلب: {{order_track_url}}",
                'whatsapp_template_en' => "🎉 *Hello {{customer_name}}*\n\nOrder confirmed at *{{store_name}}*!\n\n📋 *Order:* #{{order_number}}\n💰 *Total:* {{order_total}} {{currency}}\n💳 *Payment:* {{payment_method}} ({{payment_status}})\n📍 *Delivery:* {{delivery_city}}\n🔗 Track your order: {{order_track_url}}",
                'email_subject_ar' => 'تأكيد الطلب #{{order_number}} — {{store_name}}',
                'email_subject_en' => 'Order confirmed #{{order_number}} — {{store_name}}',
                'email_body_ar' => '<p>مرحباً {{customer_name}}،</p><p>تم استلام طلبك <strong>#{{order_number}}</strong> بمبلغ <strong>{{order_total}} {{currency}}</strong>.</p><p>الدفع: {{payment_method}} — {{payment_status}}</p><p>التوصيل: {{delivery_city}}</p><p><a href="{{order_track_url}}">تتبع الطلب</a></p><p>{{store_name}}</p>',
                'email_body_en' => '<p>Hello {{customer_name}},</p><p>We received order <strong>#{{order_number}}</strong> for <strong>{{order_total}} {{currency}}</strong>.</p><p>Payment: {{payment_method}} — {{payment_status}}</p><p>Delivery: {{delivery_city}}</p><p><a href="{{order_track_url}}">Track your order</a></p><p>{{store_name}}</p>',
            ],
            'order_processing' => [
                'event' => 'order_processing',
                'name_en' => 'Order Processing / Preparing',
                'name_ar' => 'جاري تجهيز الطلب',
                'sms_template_ar' => 'طلبك #{{order_number}} قيد التجهيز لدى {{store_name}}.',
                'sms_template_en' => 'Order #{{order_number}} is being prepared at {{store_name}}.',
                'whatsapp_template_ar' => "⏳ طلبك *#{{order_number}}* قيد التجهيز الآن في *{{store_name}}*.",
                'whatsapp_template_en' => "⏳ Your order *#{{order_number}}* is now being prepared at *{{store_name}}*.",
                'email_subject_ar' => 'جاري تجهيز طلبك #{{order_number}}',
                'email_subject_en' => 'Preparing your order #{{order_number}}',
                'email_body_ar' => '<p>مرحباً {{customer_name}}، طلبك <strong>#{{order_number}}</strong> قيد التجهيز.</p>',
                'email_body_en' => '<p>Hello {{customer_name}}, order <strong>#{{order_number}}</strong> is being prepared.</p>',
            ],
            'payment_received' => [
                'event' => 'payment_received',
                'name_en' => 'Payment Received',
                'name_ar' => 'تم استلام الدفع',
                'sms_template_ar' => 'تم تأكيد دفع طلب #{{order_number}} بمبلغ {{order_total}} ر.س عبر {{payment_method}}.',
                'sms_template_en' => 'Payment confirmed for #{{order_number}} — {{order_total}} SAR via {{payment_method}}.',
                'whatsapp_template_ar' => "✅ تم استلام الدفع لطلب *#{{order_number}}*\nالمبلغ: {{order_total}} {{currency}}\nالطريقة: {{payment_method}}",
                'whatsapp_template_en' => "✅ Payment received for *#{{order_number}}*\nAmount: {{order_total}} {{currency}}\nMethod: {{payment_method}}",
                'email_subject_ar' => 'تأكيد الدفع — طلب #{{order_number}}',
                'email_subject_en' => 'Payment confirmed — order #{{order_number}}',
                'email_body_ar' => '<p>تم تأكيد دفع طلب <strong>#{{order_number}}</strong> بمبلغ {{order_total}} {{currency}} عبر {{payment_method}}.</p>',
                'email_body_en' => '<p>Payment confirmed for order <strong>#{{order_number}}</strong>: {{order_total}} {{currency}} via {{payment_method}}.</p>',
            ],
            'payment_pending' => [
                'event' => 'payment_pending',
                'name_en' => 'Payment Pending / Reminder',
                'name_ar' => 'الدفع معلّق — تذكير',
                'sms_template_ar' => 'تذكير: طلب #{{order_number}} بانتظار إتمام الدفع ({{order_total}} ر.س).',
                'sms_template_en' => 'Reminder: order #{{order_number}} awaits payment ({{order_total}} SAR).',
                'whatsapp_template_ar' => "💳 تذكير دفع لطلب *#{{order_number}}*\nالمبلغ: {{order_total}} {{currency}}\nالحالة: {{payment_status}}",
                'whatsapp_template_en' => "💳 Payment reminder for *#{{order_number}}*\nAmount: {{order_total}} {{currency}}\nStatus: {{payment_status}}",
                'email_subject_ar' => 'تذكير الدفع — طلب #{{order_number}}',
                'email_subject_en' => 'Payment reminder — order #{{order_number}}',
                'email_body_ar' => '<p>طلبك <strong>#{{order_number}}</strong> بانتظار الدفع ({{order_total}} {{currency}}).</p>',
                'email_body_en' => '<p>Order <strong>#{{order_number}}</strong> is awaiting payment ({{order_total}} {{currency}}).</p>',
            ],
            'order_shipped' => [
                'event' => 'order_shipped',
                'name_en' => 'Order Shipped / Tracking',
                'name_ar' => 'تم شحن الطلب مع رقم التتبع',
                'sms_template_ar' => 'تم شحن #{{order_number}} مع {{courier_name}}. التتبع: {{tracking_number}} {{tracking_url}}',
                'sms_template_en' => 'Order #{{order_number}} shipped via {{courier_name}}. Track: {{tracking_number}} {{tracking_url}}',
                'whatsapp_template_ar' => "🚚 *طلبك في الطريق*\nالطلب: #{{order_number}}\nالناقل: {{courier_name}}\n📦 التتبع: `{{tracking_number}}`\n🔗 {{tracking_url}}",
                'whatsapp_template_en' => "🚚 *Your order is on the way*\nOrder: #{{order_number}}\nCourier: {{courier_name}}\n📦 Tracking: `{{tracking_number}}`\n🔗 {{tracking_url}}",
                'email_subject_ar' => 'شحن الطلب #{{order_number}} — {{tracking_number}}',
                'email_subject_en' => 'Order #{{order_number}} shipped — {{tracking_number}}',
                'email_body_ar' => '<p>تم شحن طلبك <strong>#{{order_number}}</strong> مع {{courier_name}}.</p><p>رقم التتبع: <strong>{{tracking_number}}</strong></p><p><a href="{{tracking_url}}">تتبع الشحنة</a></p>',
                'email_body_en' => '<p>Order <strong>#{{order_number}}</strong> shipped with {{courier_name}}.</p><p>Tracking: <strong>{{tracking_number}}</strong></p><p><a href="{{tracking_url}}">Track shipment</a></p>',
            ],
            'order_delivered' => [
                'event' => 'order_delivered',
                'name_en' => 'Order Delivered',
                'name_ar' => 'تم توصيل الطلب',
                'sms_template_ar' => 'تم تسليم طلبك #{{order_number}} بنجاح. شكراً لاختيارك {{store_name}}.',
                'sms_template_en' => 'Order #{{order_number}} delivered. Thank you for choosing {{store_name}}.',
                'whatsapp_template_ar' => "✅ تم تسليم طلب *#{{order_number}}* بنجاح. شكراً لتسوقك من *{{store_name}}*.",
                'whatsapp_template_en' => "✅ Order *#{{order_number}}* delivered. Thank you for shopping at *{{store_name}}*.",
                'email_subject_ar' => 'تم التوصيل — طلب #{{order_number}}',
                'email_subject_en' => 'Delivered — order #{{order_number}}',
                'email_body_ar' => '<p>تم تسليم طلبك <strong>#{{order_number}}</strong> بنجاح.</p>',
                'email_body_en' => '<p>Your order <strong>#{{order_number}}</strong> was delivered successfully.</p>',
            ],
            'order_cancelled' => [
                'event' => 'order_cancelled',
                'name_en' => 'Order Cancelled',
                'name_ar' => 'تم إلغاء الطلب',
                'sms_template_ar' => 'تم إلغاء الطلب #{{order_number}} لدى {{store_name}}.',
                'sms_template_en' => 'Order #{{order_number}} at {{store_name}} has been cancelled.',
                'whatsapp_template_ar' => "ℹ️ تم إلغاء الطلب *#{{order_number}}*. المبلغ {{order_total}} {{currency}}.",
                'whatsapp_template_en' => "ℹ️ Order *#{{order_number}}* cancelled. Amount {{order_total}} {{currency}}.",
                'email_subject_ar' => 'إلغاء الطلب #{{order_number}}',
                'email_subject_en' => 'Order cancelled #{{order_number}}',
                'email_body_ar' => '<p>تم إلغاء الطلب <strong>#{{order_number}}</strong>.</p>',
                'email_body_en' => '<p>Order <strong>#{{order_number}}</strong> has been cancelled.</p>',
            ],
            'order_preparing' => [
                'event' => 'order_preparing',
                'name_en' => 'Order Preparing & Packaging',
                'name_ar' => 'قيد التجهيز والتغليف',
                'sms_template_ar' => 'طلبك #{{order_number}} قيد التجهيز والتغليف لدى {{store_name}} وسيتم شحنه قريباً.',
                'sms_template_en' => 'Your order #{{order_number}} is currently being packaged at {{store_name}} and will ship shortly.',
                'whatsapp_template_ar' => "📦 طلبك *#{{order_number}}* قيد التجهيز والتغليف بعناية في *{{store_name}}*.",
                'whatsapp_template_en' => "📦 Your order *#{{order_number}}* is being packaged with care at *{{store_name}}*.",
                'email_subject_ar' => 'تجهيز وتغليف طلبك #{{order_number}}',
                'email_subject_en' => 'Packaging your order #{{order_number}}',
                'email_body_ar' => '<p>مرحباً {{customer_name}}، طلبك <strong>#{{order_number}}</strong> قيد التجهيز والتغليف بعناية.</p>',
                'email_body_en' => '<p>Hello {{customer_name}}, your order <strong>#{{order_number}}</strong> is being packaged with care.</p>',
            ],
            'order_refunded' => [
                'event' => 'order_refunded',
                'name_en' => 'Order Refunded / Returned',
                'name_ar' => 'تم استرداد مبلغ الطلب',
                'sms_template_ar' => 'تم استرداد مبلغ طلبك #{{order_number}} ({{order_total}} ر.س) بنجاح من {{store_name}}.',
                'sms_template_en' => 'A refund for order #{{order_number}} ({{order_total}} SAR) has been processed at {{store_name}}.',
                'whatsapp_template_ar' => "💰 تم استرداد مبلغ طلبك *#{{order_number}}* بمبلغ {{order_total}} {{currency}} بنجاح إلى حسابك.",
                'whatsapp_template_en' => "💰 Refund processed for order *#{{order_number}}* ({{order_total}} {{currency}}) to your account.",
                'email_subject_ar' => 'استرداد المبلغ — طلب #{{order_number}}',
                'email_subject_en' => 'Refund processed — order #{{order_number}}',
                'email_body_ar' => '<p>تم استرداد مبلغ <strong>{{order_total}} {{currency}}</strong> لطلبك <strong>#{{order_number}}</strong>.</p>',
                'email_body_en' => '<p>A refund of <strong>{{order_total}} {{currency}}</strong> has been processed for order <strong>#{{order_number}}</strong>.</p>',
            ],
            'abandoned_cart' => [
                'event' => 'abandoned_cart',
                'name_en' => 'Abandoned Cart Reminder',
                'name_ar' => 'تذكير السلة المتروكة',
                'sms_template_ar' => 'مرحباً {{customer_name}}، سلتك بقيمة {{order_total}} ر.س بانتظارك في {{store_name}}. أكمل الشراء: {{store_url}}',
                'sms_template_en' => 'Hi {{customer_name}}, your cart ({{order_total}} SAR) is waiting at {{store_name}}. Complete checkout: {{store_url}}',
                'whatsapp_template_ar' => "مرحباً {{customer_name}} 👋\n\nلاحظنا أنك تركت منتجات بقيمة *{{order_total}} {{currency}}* في سلتك لدى *{{store_name}}*.\n\nأكمل طلبك من هنا:\n{{store_url}}",
                'whatsapp_template_en' => "Hi {{customer_name}} 👋\n\nYou left items worth *{{order_total}} {{currency}}* in your cart at *{{store_name}}*.\n\nComplete your order here:\n{{store_url}}",
                'email_subject_ar' => 'سلتك بانتظارك في {{store_name}}',
                'email_subject_en' => 'Your cart is waiting at {{store_name}}',
                'email_body_ar' => '<p>مرحباً {{customer_name}}،</p><p>لاحظنا أنك تركت منتجات بقيمة <strong>{{order_total}} {{currency}}</strong> في سلتك لدى <strong>{{store_name}}</strong>.</p><p><a href="{{store_url}}">إتمام الشراء</a></p>',
                'email_body_en' => '<p>Hello {{customer_name}},</p><p>You left items worth <strong>{{order_total}} {{currency}}</strong> in your cart at <strong>{{store_name}}</strong>.</p><p><a href="{{store_url}}">Complete checkout</a></p>',
            ],
        ];
    }

    public static function interpolateTemplate(string $template, Order $order, ?Store $store = null): string
    {
        $storeName = $store
            ? (string) ($store->name_ar ?: $store->name ?: $store->name_en ?: 'Store')
            : 'Store';

        $trackingNumber = (string) ($order->tracking_number ?: $order->awb_number ?: '');
        $courierName = (string) ($order->courier_code ?: '');
        $trackingUrl = $trackingNumber !== ''
            ? ('https://track.unityteck.sa/?c=' . urlencode(strtolower($courierName !== '' ? $courierName : 'courier')) . '&awb=' . urlencode($trackingNumber))
            : '';

        $frontendBase = rtrim((string) env('FRONTEND_URL', ''), '/');
        $storeUrl = '';
        if ($store) {
            $domain = trim((string) ($store->custom_domain ?: $store->domain ?: ''));
            if ($domain !== '') {
                $storeUrl = preg_match('#^https?://#i', $domain) ? $domain : ('https://' . $domain);
            } elseif ($frontendBase !== '') {
                $slug = trim((string) ($store->slug ?: ''));
                $storeUrl = $slug !== '' ? ($frontendBase . '/' . rawurlencode($slug)) : $frontendBase;
            }
        } elseif ($frontendBase !== '') {
            $storeUrl = $frontendBase;
        }
        $orderNumber = (string) ($order->order_number ?: $order->id);
        $orderTrackUrl = $storeUrl !== ''
            ? (rtrim($storeUrl, '/') . '/track-order?order=' . rawurlencode($orderNumber))
            : '';

        $totalVal = (float) ($order->total_amount ?? $order->total ?? 0);

        $replacements = [
            '{{customer_name}}' => (string) ($order->customer_name ?: ''),
            '{{order_number}}' => $orderNumber,
            '{{order_total}}' => number_format($totalVal, 2),
            '{{currency}}' => (string) ($order->currency ?: 'SAR'),
            '{{payment_method}}' => (string) ($order->payment_method ?: ''),
            '{{payment_status}}' => (string) ($order->payment_status ?: ''),
            '{{delivery_city}}' => (string) ($order->delivery_location ?: ''),
            '{{store_name}}' => $storeName,
            '{{store_url}}' => $storeUrl,
            '{{order_track_url}}' => $orderTrackUrl,
            '{{courier_name}}' => $courierName,
            '{{tracking_number}}' => $trackingNumber,
            '{{tracking_url}}' => $trackingUrl,
            '{{date}}' => $order->created_at ? $order->created_at->format('Y-m-d') : date('Y-m-d'),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }

    /**
     * Load THIS store only — WhatsApp / SMS / Email / templates / merchant alerts.
     * Never borrows another store’s credentials. Platform .env is NOT used as silent WA/SMS fallback.
     */
    public function resolveStoreConfig(string $storeId): array
    {
        $store = Store::query()->where('id', $storeId)->first();
        $fromStore = is_array($store?->settings) ? ($store->settings['notifications'] ?? []) : [];

        // WhatsApp Cloud credentials: ONLY this store’s StoreSetting row
        $waRow = StoreSetting::query()->where('store_id', $storeId)->first();
        $waSettings = is_array($waRow?->settings) ? ($waRow->settings['whatsapp'] ?? []) : [];

        $storeName = (string) ($store?->name_ar ?: $store?->name ?: $store?->name_en ?: 'Store');

        $defaults = [
            'store_id' => $storeId,
            'channels' => [
                'whatsapp' => [
                    'enabled' => true,
                    'provider' => 'whatsapp_cloud_api',
                    // Auto-notify customer on order lifecycle when THIS store connects WhatsApp
                    'auto_notify_customer' => true,
                    'auto_notify_merchant' => true,
                    // Strict isolation: empty until THIS store connects WhatsApp
                    'access_token' => '',
                    'phone_number_id' => '',
                    'template_lang' => 'ar',
                    'connected' => false,
                ],
                'sms' => [
                    'enabled' => true,
                    'provider' => 'unifonic',
                    'sender_id' => '',
                    'app_sid' => '',
                    'api_key' => '',
                    'base_url' => 'https://el.cloud.unifonic.com',
                    'auto_notify_customer' => true,
                    'auto_notify_merchant' => false,
                    'connected' => false,
                ],
                'email' => [
                    'enabled' => true,
                    'provider' => 'smtp',
                    // Auto email when THIS store SMTP (or platform mail opt-in) is connected
                    'auto_notify_customer' => true,
                    'auto_notify_merchant' => true,
                    'from_address' => '',
                    'from_name' => $storeName,
                    'allow_platform_mail' => false,
                    'smtp' => [
                        'host' => '',
                        'port' => 465,
                        'encryption' => 'ssl',
                        'username' => '',
                        'password' => '',
                        'from_address' => '',
                        'from_name' => $storeName,
                    ],
                    'connected' => false,
                ],
            ],
            'templates' => self::getDefaultTemplates(),
            'merchant_alert_phones' => [],
            'merchant_alert_emails' => [],
            'locale' => 'ar',
        ];

        $merged = array_replace_recursive($defaults, is_array($fromStore) ? $fromStore : []);
        $merged['store_id'] = $storeId;

        // Bind WhatsApp ONLY from this store’s WhatsApp module settings
        $waToken = trim((string) ($waSettings['access_token'] ?? ''));
        $waPhoneId = trim((string) ($waSettings['phone_number_id'] ?? ''));
        if ($waToken !== '') {
            $merged['channels']['whatsapp']['access_token'] = $waToken;
        }
        if ($waPhoneId !== '') {
            $merged['channels']['whatsapp']['phone_number_id'] = $waPhoneId;
        }
        $merged['channels']['whatsapp']['connected'] = $this->isWhatsAppConnected($merged['channels']['whatsapp']);

        // SMS connected only if THIS store saved gateway secrets
        $sms = $merged['channels']['sms'] ?? [];
        $merged['channels']['sms']['connected'] = $this->isSmsConnected($sms);

        // Email connected only if THIS store SMTP is complete (or explicit platform_mail opt-in)
        $email = $merged['channels']['email'] ?? [];
        if (empty($email['from_name'])) {
            $merged['channels']['email']['from_name'] = $storeName;
        }
        $merged['channels']['email']['connected'] = $this->isEmailConnected($email);

        // Templates: store custom overlay on defaults (still store-scoped blob)
        $merged['templates'] = array_replace_recursive(
            self::getDefaultTemplates(),
            is_array($merged['templates'] ?? null) ? $merged['templates'] : []
        );

        // Merchant lists: only this store’s arrays
        $merged['merchant_alert_phones'] = array_values(array_filter(
            array_map('strval', is_array($merged['merchant_alert_phones'] ?? null) ? $merged['merchant_alert_phones'] : [])
        ));
        $merged['merchant_alert_emails'] = array_values(array_filter(
            array_map('strval', is_array($merged['merchant_alert_emails'] ?? null) ? $merged['merchant_alert_emails'] : [])
        ));

        return $merged;
    }

    public function isWhatsAppConnected(array $wa): bool
    {
        $token = trim((string) ($wa['access_token'] ?? ''));
        $phoneId = trim((string) ($wa['phone_number_id'] ?? ''));

        return $token !== ''
            && $phoneId !== ''
            && !str_contains($token, '...')
            && !str_contains($phoneId, '1234567890')
            && !str_contains($phoneId, '109283746501928');
    }

    public function isSmsConnected(array $sms): bool
    {
        $sender = trim((string) ($sms['sender_id'] ?? ''));
        $sid = trim((string) ($sms['app_sid'] ?? ''));
        $key = trim((string) ($sms['api_key'] ?? ''));
        $provider = strtolower((string) ($sms['provider'] ?? 'unifonic'));

        if ($sender === '') {
            return false;
        }
        if (str_contains($provider, 'taqnyat')) {
            return $key !== '';
        }

        return $sid !== '' || $key !== '';
    }

    public function isEmailConnected(array $email): bool
    {
        $smtp = is_array($email['smtp'] ?? null) ? $email['smtp'] : [];
        $host = trim((string) ($smtp['host'] ?? ''));
        $user = trim((string) ($smtp['username'] ?? ''));
        $pass = (string) ($smtp['password'] ?? '');
        if ($host !== '' && $host !== '127.0.0.1' && $user !== '' && $pass !== '') {
            return true;
        }

        // Opt-in only: shared Hostinger SMTP as transport, still branded as this store
        if (!empty($email['allow_platform_mail'])) {
            $mailer = (string) config('mail.default', 'log');
            if (in_array($mailer, ['log', 'array', ''], true)) {
                return false;
            }
            if ($mailer === 'smtp') {
                $pHost = (string) config('mail.mailers.smtp.host');
                $pUser = (string) config('mail.mailers.smtp.username');

                return $pHost !== '' && $pHost !== '127.0.0.1' && $pUser !== '' && $pUser !== 'null';
            }

            return true;
        }

        return false;
    }

    /**
     * Dispatch transactional alerts for an order lifecycle event.
     *
     * @param  array{whatsapp_enabled?:bool,sms_enabled?:bool,email_enabled?:bool,locale?:string,force_phone?:string,force_email?:string}  $overrides
     */
    public function sendOrderNotification(string $event, Order $order, array $overrides = []): array
    {
        $storeId = (string) $order->store_id;
        if ($storeId === '') {
            return ['success' => false, 'message' => 'Order missing store_id — refused (tenant isolation)'];
        }

        $store = Store::query()->where('id', $storeId)->first();
        $config = $this->resolveStoreConfig($storeId);

        // Hard isolation guard
        if (($config['store_id'] ?? '') !== $storeId) {
            return ['success' => false, 'message' => 'Store config mismatch — refused'];
        }

        $templates = $config['templates'][$event] ?? null;
        if (!$templates) {
            return ['success' => false, 'message' => "Unknown event type: {$event}"];
        }

        $locale = $overrides['locale'] ?? ($config['locale'] ?? 'ar');
        $isAr = str_starts_with(strtolower((string) $locale), 'ar');

        $phone = self::normalizeSaudiPhoneNumber($overrides['force_phone'] ?? $order->customer_phone);
        $emailTo = $overrides['force_email'] ?? ($order->customer_email ?: null);

        $results = [
            'store_id' => $storeId,
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'recipient_phone' => $phone,
            'recipient_email' => $emailTo,
            'is_saudi_number' => self::isValidSaudiMobile($phone),
            'event' => $event,
            'isolation' => 'store_scoped',
            'channels' => [],
            'merchant_channels' => [],
            'connection' => [
                'whatsapp' => (bool) ($config['channels']['whatsapp']['connected'] ?? false),
                'sms' => (bool) ($config['channels']['sms']['connected'] ?? false),
                'email' => (bool) ($config['channels']['email']['connected'] ?? false),
            ],
            'dispatched_at' => now()->toIso8601String(),
        ];

        $waCfg = $config['channels']['whatsapp'] ?? [];
        $smsCfg = $config['channels']['sms'] ?? [];
        $emailCfg = $config['channels']['email'] ?? [];

        $waEnabled = ($overrides['whatsapp_enabled'] ?? null) !== null
            ? (bool) $overrides['whatsapp_enabled']
            : (($waCfg['enabled'] ?? true) && ($waCfg['auto_notify_customer'] ?? true));

        $smsEnabled = ($overrides['sms_enabled'] ?? null) !== null
            ? (bool) $overrides['sms_enabled']
            : (($smsCfg['enabled'] ?? true) && ($smsCfg['auto_notify_customer'] ?? true));

        $emailEnabled = ($overrides['email_enabled'] ?? null) !== null
            ? (bool) $overrides['email_enabled']
            : (($emailCfg['enabled'] ?? true) && ($emailCfg['auto_notify_customer'] ?? true));

        // WhatsApp — only if THIS store connected
        if ($waEnabled) {
            $waBodyKey = $isAr ? 'whatsapp_template_ar' : 'whatsapp_template_en';
            $waBody = self::interpolateTemplate((string) ($templates[$waBodyKey] ?? ''), $order, $store);
            if (!($waCfg['connected'] ?? false)) {
                $results['channels']['whatsapp'] = [
                    'status' => 'skipped',
                    'provider' => 'whatsapp_cloud_api',
                    'message_id' => null,
                    'error' => 'This store has not connected WhatsApp. Other stores’ WhatsApp is never used.',
                    'http_status' => null,
                    'preview' => $waBody,
                ];
            } elseif ($phone && self::isValidSaudiMobile($phone)) {
                $results['channels']['whatsapp'] = $this->whatsapp->send(
                    $phone,
                    $waBody,
                    $waCfg,
                    $waCfg['meta_template_' . $event] ?? null
                );
            } else {
                $results['channels']['whatsapp'] = [
                    'status' => 'skipped',
                    'provider' => 'whatsapp_cloud_api',
                    'message_id' => null,
                    'error' => 'Customer phone missing or not a valid +9665XXXXXXXX mobile',
                    'http_status' => null,
                    'preview' => $waBody,
                ];
            }
        }

        // SMS — only if THIS store connected
        if ($smsEnabled) {
            $smsKey = $isAr ? 'sms_template_ar' : 'sms_template_en';
            $smsBody = self::interpolateTemplate((string) ($templates[$smsKey] ?? ''), $order, $store);
            if (!($smsCfg['connected'] ?? false)) {
                $results['channels']['sms'] = [
                    'status' => 'skipped',
                    'provider' => $smsCfg['provider'] ?? 'sms',
                    'message_id' => null,
                    'error' => 'This store has not connected SMS gateway. Other stores’ SMS credentials are never used.',
                    'http_status' => null,
                    'preview' => $smsBody,
                ];
            } elseif ($phone && self::isValidSaudiMobile($phone)) {
                $results['channels']['sms'] = $this->sms->send($phone, $smsBody, $smsCfg);
            } else {
                $results['channels']['sms'] = [
                    'status' => 'skipped',
                    'provider' => $smsCfg['provider'] ?? 'sms',
                    'message_id' => null,
                    'error' => 'Customer phone missing or not a valid +9665XXXXXXXX mobile',
                    'http_status' => null,
                    'preview' => $smsBody,
                ];
            }
        }

        // Email — only if THIS store connected
        if ($emailEnabled) {
            $subjKey = $isAr ? 'email_subject_ar' : 'email_subject_en';
            $bodyKey = $isAr ? 'email_body_ar' : 'email_body_en';
            $subject = self::interpolateTemplate((string) ($templates[$subjKey] ?? ('Order ' . $event)), $order, $store);
            $html = self::interpolateTemplate((string) ($templates[$bodyKey] ?? '<p>{{order_number}}</p>'), $order, $store);
            if (!($emailCfg['connected'] ?? false)) {
                $results['channels']['email'] = [
                    'status' => 'skipped',
                    'provider' => 'email_disconnected',
                    'message_id' => null,
                    'error' => 'This store has not connected email. Other stores’ SMTP is never used.',
                    'http_status' => null,
                    'preview' => strip_tags($html),
                ];
            } elseif ($emailTo) {
                $results['channels']['email'] = $this->email->send($emailTo, $subject, $html, [
                    'store_id' => $storeId,
                    'address' => $emailCfg['from_address'] ?: ($emailCfg['smtp']['from_address'] ?? null),
                    'name' => $emailCfg['from_name'] ?: ($emailCfg['smtp']['from_name'] ?? null),
                    'smtp' => $emailCfg['smtp'] ?? [],
                    'allow_platform_mail' => (bool) ($emailCfg['allow_platform_mail'] ?? false),
                ]);
            } else {
                $results['channels']['email'] = [
                    'status' => 'skipped',
                    'provider' => 'email',
                    'message_id' => null,
                    'error' => 'Customer email missing on order',
                    'http_status' => null,
                    'preview' => strip_tags($html),
                ];
            }
        }

        // Merchant alerts for THIS store only (full order lifecycle)
        $merchantEvents = [
            'order_placed',
            'order_processing',
            'order_preparing',
            'payment_received',
            'payment_pending',
            'order_shipped',
            'order_delivered',
            'order_cancelled',
            'order_refunded',
        ];
        if (in_array($event, $merchantEvents, true)) {
            $this->notifyMerchants($event, $order, $store, $config, $results, $isAr, $templates);
        }

        $this->persistDeliveryLog($results);

        $anySent = false;
        foreach (['channels', 'merchant_channels'] as $bucket) {
            foreach ($results[$bucket] as $ch) {
                if (($ch['status'] ?? '') === 'sent') {
                    $anySent = true;
                }
            }
        }

        Log::info('Order notification dispatch', [
            'store_id' => $order->store_id,
            'event' => $event,
            'order' => $order->order_number,
            'channels' => collect($results['channels'])->map(fn ($c) => $c['status'] ?? null)->all(),
        ]);

        return [
            'success' => true,
            'any_sent' => $anySent,
            'data' => $results,
        ];
    }

    /**
     * Persist every channel attempt so merchants can manage real Email / WhatsApp / SMS deliveries.
     */
    protected function persistDeliveryLog(array $results): void
    {
        $storeId = (string) ($results['store_id'] ?? '');
        if ($storeId === '') {
            return;
        }

        $base = [
            'store_id' => $storeId,
            'order_id' => $results['order_id'] ?? null,
            'order_number' => $results['order_number'] ?? null,
            'event' => (string) ($results['event'] ?? 'unknown'),
        ];

        foreach ($results['channels'] ?? [] as $channel => $payload) {
            if (!is_array($payload)) {
                continue;
            }
            $this->writeDeliveryRow($base, (string) $channel, 'customer', $payload, [
                'recipient' => $channel === 'email'
                    ? ($results['recipient_email'] ?? null)
                    : ($results['recipient_phone'] ?? null),
            ]);
        }

        foreach ($results['merchant_channels'] ?? [] as $key => $payload) {
            if (!is_array($payload)) {
                continue;
            }
            $channel = 'whatsapp';
            if (str_starts_with((string) $key, 'sms_')) {
                $channel = 'sms';
            } elseif (str_starts_with((string) $key, 'email_')) {
                $channel = 'email';
            }
            $recipient = preg_replace('/^(whatsapp_|sms_|email_)/', '', (string) $key);
            $this->writeDeliveryRow($base, $channel, 'merchant', $payload, [
                'recipient' => $recipient,
            ]);
        }
    }

    protected function writeDeliveryRow(array $base, string $channel, string $audience, array $payload, array $extra = []): void
    {
        try {
            NotificationDelivery::query()->create([
                'id' => 'nd_' . Str::lower(Str::random(16)),
                'store_id' => $base['store_id'],
                'order_id' => $base['order_id'],
                'order_number' => $base['order_number'],
                'event' => $base['event'],
                'channel' => $channel,
                'audience' => $audience,
                'recipient' => $extra['recipient'] ?? null,
                'status' => (string) ($payload['status'] ?? 'skipped'),
                'provider' => $payload['provider'] ?? null,
                'provider_message_id' => $payload['message_id'] ?? null,
                'preview' => isset($payload['preview']) ? mb_substr((string) $payload['preview'], 0, 2000) : null,
                'error' => $payload['error'] ?? null,
                'merchant_read' => false,
                'meta' => [
                    'http_status' => $payload['http_status'] ?? null,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::warning('notification_delivery_log_failed', [
                'store_id' => $base['store_id'] ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function notifyMerchants(
        string $event,
        Order $order,
        ?Store $store,
        array $config,
        array &$results,
        bool $isAr,
        array $templates
    ): void {
        $waCfg = $config['channels']['whatsapp'] ?? [];
        $smsCfg = $config['channels']['sms'] ?? [];
        $emailCfg = $config['channels']['email'] ?? [];

        $summaryKey = $isAr ? 'whatsapp_template_ar' : 'whatsapp_template_en';
        $summary = '[MERCHANT] ' . self::interpolateTemplate((string) ($templates[$summaryKey] ?? $event), $order, $store);

        $storeId = (string) ($config['store_id'] ?? $order->store_id);

        if (($waCfg['auto_notify_merchant'] ?? false) && ($waCfg['enabled'] ?? false) && ($waCfg['connected'] ?? false)) {
            foreach ($config['merchant_alert_phones'] ?? [] as $mPhone) {
                $norm = self::normalizeSaudiPhoneNumber((string) $mPhone);
                if ($norm && self::isValidSaudiMobile($norm)) {
                    $results['merchant_channels']['whatsapp_' . $norm] = $this->whatsapp->send($norm, $summary, $waCfg);
                }
            }
        }

        if (($smsCfg['auto_notify_merchant'] ?? false) && ($smsCfg['enabled'] ?? false) && ($smsCfg['connected'] ?? false)) {
            $smsBody = self::interpolateTemplate(
                (string) ($templates[$isAr ? 'sms_template_ar' : 'sms_template_en'] ?? ''),
                $order,
                $store
            );
            foreach ($config['merchant_alert_phones'] ?? [] as $mPhone) {
                $norm = self::normalizeSaudiPhoneNumber((string) $mPhone);
                if ($norm && self::isValidSaudiMobile($norm)) {
                    $results['merchant_channels']['sms_' . $norm] = $this->sms->send($norm, '[M] ' . $smsBody, $smsCfg);
                }
            }
        }

        if (($emailCfg['auto_notify_merchant'] ?? false) && ($emailCfg['enabled'] ?? false) && ($emailCfg['connected'] ?? false)) {
            $subj = '[Store] ' . self::interpolateTemplate(
                (string) ($templates[$isAr ? 'email_subject_ar' : 'email_subject_en'] ?? $event),
                $order,
                $store
            );
            $html = self::interpolateTemplate(
                (string) ($templates[$isAr ? 'email_body_ar' : 'email_body_en'] ?? ''),
                $order,
                $store
            );
            foreach ($config['merchant_alert_emails'] ?? [] as $mEmail) {
                if (filter_var($mEmail, FILTER_VALIDATE_EMAIL)) {
                    $results['merchant_channels']['email_' . $mEmail] = $this->email->send($mEmail, $subj, $html, [
                        'store_id' => $storeId,
                        'address' => $emailCfg['from_address'] ?: ($emailCfg['smtp']['from_address'] ?? null),
                        'name' => $emailCfg['from_name'] ?: ($emailCfg['smtp']['from_name'] ?? null),
                        'smtp' => $emailCfg['smtp'] ?? [],
                        'allow_platform_mail' => (bool) ($emailCfg['allow_platform_mail'] ?? false),
                    ]);
                }
            }
        }
    }
}

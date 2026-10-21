<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductVariationController;
use App\Http\Controllers\Api\SeoController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\GoogleIntegrationController;
use App\Http\Controllers\Api\ShippingMethodController;
use App\Http\Controllers\Api\CourierController;
use App\Http\Controllers\Api\PaymentGatewayController;
use App\Http\Controllers\Api\WebhooksController;
use App\Http\Controllers\Api\AnalyticsReportController;
use App\Http\Controllers\Api\StoreThemeController;
use App\Http\Controllers\Api\StoreSettingsController;
use App\Http\Controllers\Api\DomainController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\NotificationSettingsController;
use App\Http\Controllers\Api\WhatsAppController;
use App\Http\Controllers\Api\AffiliateController;
use App\Http\Controllers\Api\LoyaltyController;
use App\Http\Controllers\Api\MarketingCampaignsController;
use App\Http\Controllers\Api\CartInterceptController;
use App\Http\Controllers\Api\GiftingController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'show']);

// Phase 2.1–2.2 — Holst auth (Sanctum). Separate throttles per action.
Route::middleware('throttle:8,1')->group(function () {
    Route::post('/auth/master/login', [AuthController::class, 'masterLogin']);
    Route::post('/auth/store/login', [AuthController::class, 'storeLogin']);
});

Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/auth/otp/request', [AuthController::class, 'requestOtp']);
    Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/auth/roles', [AuthController::class, 'roles']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/plans', [PlanController::class, 'index']);
});

// Phase 2.3–2.7 — auth + store scope + role/plan/subscription enforce
Route::middleware(['auth:sanctum', 'store.id'])->group(function () {
    Route::get('/plans/current', [PlanController::class, 'current']);
    Route::get('/subscriptions/current', [SubscriptionController::class, 'current']);
    Route::middleware('role.can:stores.write')->patch(
        '/stores/{storeId}/subscription',
        [SubscriptionController::class, 'update']
    );

    Route::middleware('role.can:stores.read')->group(function () {
        Route::get('/stores', [StoreController::class, 'index']);
        Route::get('/stores/{id}', [StoreController::class, 'show']);
    });
    Route::middleware('role.can:stores.write')->group(function () {
        Route::post('/stores', [StoreController::class, 'store']);
        Route::patch('/stores/{id}', [StoreController::class, 'update']);
        Route::delete('/stores/{id}', [StoreController::class, 'destroy']);
    });

    Route::middleware('role.can:products.read')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{id}', [ProductController::class, 'show']);
        Route::get('/products/{productId}/variations', [ProductVariationController::class, 'index']);
    });
    Route::middleware([
        'role.can:products.write',
        'plan.feature:catalog',
        'subscription.writable',
    ])->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::patch('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::post('/products/{id}/toggle-publish', [ProductController::class, 'togglePublish']);
        Route::post('/products/{productId}/variations', [ProductVariationController::class, 'store']);
        Route::patch('/products/{productId}/variations/{id}', [ProductVariationController::class, 'update']);
        Route::delete('/products/{productId}/variations/{id}', [ProductVariationController::class, 'destroy']);
    });


    Route::middleware([
        'role.can:products.write',
        'plan.feature:catalog',
        'subscription.writable',
    ])->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::patch('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    });

    Route::middleware('role.can:orders.read')->get('/orders', [OrderController::class, 'index']);
    Route::middleware('role.can:orders.read')->get('/orders-cod-summary', [OrderController::class, 'codSummary']);
    Route::middleware('role.can:orders.read')->get('/orders-returns', [OrderController::class, 'returnsIndex']);
    Route::middleware('role.can:orders.read')->get('/orders/{id}', [OrderController::class, 'show']);
    Route::middleware([
        'role.can:orders.write',
        'plan.feature:orders',
        'subscription.writable',
    ])->group(function () {
        Route::post('/orders', [OrderController::class, 'store']);
        Route::patch('/orders/{id}', [OrderController::class, 'update']);
        Route::post('/orders/{id}/return', [OrderController::class, 'processReturn']);
        Route::post('/orders/{id}/cod-status', [OrderController::class, 'updateCodStatus']);
        Route::delete('/orders/{id}', [OrderController::class, 'destroy']);
    });

    Route::middleware('role.can:customers.read')->group(function () {
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::get('/customers/{id}', [CustomerController::class, 'show']);
    });
    Route::middleware(['role.can:customers.write', 'subscription.writable'])->group(function () {
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::patch('/customers/{id}', [CustomerController::class, 'update']);
        Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
    });

    Route::middleware(['role.can:coupons.read', 'plan.feature:coupons'])->get('/coupons', [CouponController::class, 'index']);
    Route::middleware([
        'role.can:coupons.write',
        'plan.feature:coupons',
        'subscription.writable',
    ])->patch('/coupons/{id}', [CouponController::class, 'update']);

    Route::middleware(['role.can:shipping.read', 'plan.feature:shipping'])->get('/shipping', [ShippingController::class, 'index']);
    Route::middleware([
        'role.can:shipping.write',
        'plan.feature:shipping',
        'subscription.writable',
    ])->patch('/shipping/{id}', [ShippingController::class, 'update']);

    Route::middleware(['role.can:seo.read', 'plan.feature:seo'])->get('/seo', [SeoController::class, 'index']);
    Route::middleware([
        'role.can:seo.write',
        'plan.feature:seo',
        'subscription.writable',
    ])->patch('/seo', [SeoController::class, 'update']);

    // Media Library Routes
    Route::get('/media', [MediaController::class, 'index']);
    Route::post('/media', [MediaController::class, 'store']);
    Route::get('/media/{id}', [MediaController::class, 'show']);
    Route::patch('/media/{id}', [MediaController::class, 'update']);
    Route::post('/media/{id}/replace', [MediaController::class, 'replace']);
    Route::delete('/media/{id}', [MediaController::class, 'destroy']);
    Route::get('/media/{id}/usages', [MediaController::class, 'usages']);

    // Google Cloud & Site Kit Integration Routes (Store-isolated)
    Route::get('/google/auth-url', [GoogleIntegrationController::class, 'getAuthUrl']);
    Route::post('/google/callback', [GoogleIntegrationController::class, 'handleCallback']);
    Route::get('/google/status', [GoogleIntegrationController::class, 'getStatus']);
    Route::get('/google/properties', [GoogleIntegrationController::class, 'getProperties']);
    Route::post('/google/properties', [GoogleIntegrationController::class, 'saveProperties']);
    Route::post('/google/sync', [GoogleIntegrationController::class, 'sync']);
    Route::post('/google/disconnect', [GoogleIntegrationController::class, 'disconnect']);
    Route::get('/google/analytics', [GoogleIntegrationController::class, 'getAnalytics']);
    Route::get('/google/search-console', [GoogleIntegrationController::class, 'getSearchConsole']);
    Route::get('/google/pagespeed', [GoogleIntegrationController::class, 'getPageSpeed']);

    // Real Configurable Shipping Methods
    Route::get('/shipping-methods', [ShippingMethodController::class, 'index']);
    Route::post('/shipping-methods', [ShippingMethodController::class, 'store']);
    Route::patch('/shipping-methods/{id}', [ShippingMethodController::class, 'update']);
    Route::delete('/shipping-methods/{id}', [ShippingMethodController::class, 'destroy']);

    // Real Shipping Zones & Dynamic Rates Calculation
    Route::post('/shipping', [ShippingController::class, 'store']);
    Route::delete('/shipping/{id}', [ShippingController::class, 'destroy']);
    Route::post('/shipping/calculate', [ShippingController::class, 'calculate']);

    // Real Courier Integration Framework
    Route::get('/couriers', [CourierController::class, 'index']);
    Route::post('/couriers', [CourierController::class, 'store']);
    Route::post('/couriers/{id}/test', [CourierController::class, 'test']);
    Route::post('/couriers/{id}/sync', [CourierController::class, 'sync']);
    Route::get('/couriers/shipments', [CourierController::class, 'shipments']);
    Route::get('/shipments', [CourierController::class, 'shipments']);
    Route::patch('/couriers/shipments/{id}/status', [CourierController::class, 'updateShipmentStatus']);
    Route::post('/couriers/create-shipment', [CourierController::class, 'createShipment']);
    Route::get('/couriers/track/{trackingNumber}', [CourierController::class, 'track']);

    // Real Online Payment Gateways & Server-side Verification
    Route::get('/payment-gateways', [PaymentGatewayController::class, 'index']);
    Route::post('/payment-gateways', [PaymentGatewayController::class, 'store']);
    Route::post('/payment-gateways/{id}/test', [PaymentGatewayController::class, 'test']);
    Route::post('/payments/verify', [PaymentGatewayController::class, 'verify']);
    Route::post('/payments/refund/{id}', [PaymentGatewayController::class, 'refund']);
    Route::get('/payments/transactions', [PaymentGatewayController::class, 'transactions']);

    // Real Database-Calculated Payment & Shipping Analytics
    Route::get('/analytics/overview', [AnalyticsReportController::class, 'overview']);
    Route::get('/analytics/sales-revenue', [AnalyticsReportController::class, 'salesRevenue']);
    Route::get('/analytics/campaigns', [AnalyticsReportController::class, 'campaignAnalytics']);
    Route::get('/analytics/ai-insights', [AnalyticsReportController::class, 'aiInsights']);
    Route::post('/analytics/ai-insights/ask', [AnalyticsReportController::class, 'askAi']);
    Route::get('/analytics/behavior', [AnalyticsReportController::class, 'behaviorAnalytics']);
    Route::get('/analytics/customers', [AnalyticsReportController::class, 'customerAnalytics']);
    Route::get('/analytics/products', [AnalyticsReportController::class, 'productAnalytics']);
    Route::get('/analytics/channels', [AnalyticsReportController::class, 'channelAnalytics']);
    Route::get('/analytics/search-queries', [AnalyticsReportController::class, 'searchQueries']);
    Route::get('/analytics/payments', [AnalyticsReportController::class, 'paymentReports']);
    Route::get('/analytics/shipping', [AnalyticsReportController::class, 'shippingReports']);


    // Theme & Page Builder Persistence (Phase 2.2)
    Route::get('/themes-catalog', [StoreThemeController::class, 'catalog']);
    Route::get('/theme-settings', [StoreThemeController::class, 'show']);
    Route::put('/theme-settings', [StoreThemeController::class, 'update']);
    Route::patch('/theme-settings', [StoreThemeController::class, 'update']);
    Route::get('/builder-layout', [StoreThemeController::class, 'getBuilderLayout']);
    Route::put('/builder-layout', [StoreThemeController::class, 'saveBuilderLayout']);
    Route::post('/builder-layout', [StoreThemeController::class, 'saveBuilderLayout']);

    // Direct storeId parameter routes
    Route::get('/stores/{storeId}/theme-settings', [StoreThemeController::class, 'show']);
    Route::put('/stores/{storeId}/theme-settings', [StoreThemeController::class, 'update']);
    Route::patch('/stores/{storeId}/theme-settings', [StoreThemeController::class, 'update']);
    Route::get('/stores/{storeId}/builder-layout', [StoreThemeController::class, 'getBuilderLayout']);
    Route::put('/stores/{storeId}/builder-layout', [StoreThemeController::class, 'saveBuilderLayout']);
    Route::post('/stores/{storeId}/builder-layout', [StoreThemeController::class, 'saveBuilderLayout']);

    // Store Settings
    Route::get('/store-settings', [StoreSettingsController::class, 'show']);
    Route::put('/store-settings', [StoreSettingsController::class, 'update']);
    Route::get('/stores/{storeId}/store-settings', [StoreSettingsController::class, 'show']);
    Route::put('/stores/{storeId}/store-settings', [StoreSettingsController::class, 'update']);

    // Blog Articles & Settings Management
    Route::get('/blog/articles', [BlogController::class, 'index']);
    Route::post('/blog/articles', [BlogController::class, 'store']);
    Route::put('/blog/articles/{id}', [BlogController::class, 'update']);
    Route::delete('/blog/articles/{id}', [BlogController::class, 'destroy']);
    Route::post('/blog/articles/bulk', [BlogController::class, 'bulkAction']);
    Route::get('/blog/settings', [BlogController::class, 'getSettings']);
    Route::put('/blog/settings', [BlogController::class, 'updateSettings']);
    Route::get('/blog/commerce-tools/{articleId}', [BlogController::class, 'getCommerceTools']);
    Route::put('/blog/commerce-tools/{articleId}', [BlogController::class, 'saveCommerceTools']);

    // Multi-Domain & Custom Domains Management (Phase 6.1)
    Route::get('/domains', [DomainController::class, 'index']);
    Route::post('/domains', [DomainController::class, 'store']);
    Route::post('/domains/{id}/verify', [DomainController::class, 'verify']);
    Route::post('/domains/{id}/ssl', [DomainController::class, 'ssl']);
    Route::delete('/domains/{id}', [DomainController::class, 'destroy']);

    // Saudi WhatsApp & SMS Transactional Notifications (Phase 6.4)
    Route::get('/notifications/settings', [NotificationSettingsController::class, 'getSettings']);
    Route::put('/notifications/settings', [NotificationSettingsController::class, 'updateSettings']);
});

// Store-scoped WhatsApp Store Management & Messaging Center (Strict X-Store-Id isolation)
Route::middleware('store.id')->group(function () {
    Route::get('/whatsapp/overview', [WhatsAppController::class, 'overview']);
    Route::get('/whatsapp/messages', [WhatsAppController::class, 'messages']);
    Route::post('/whatsapp/messages', [WhatsAppController::class, 'sendMessage']);
    Route::get('/whatsapp/templates', [WhatsAppController::class, 'templates']);
    Route::get('/whatsapp/contacts', [WhatsAppController::class, 'contacts']);
    Route::get('/whatsapp/segments', [WhatsAppController::class, 'segments']);
    Route::get('/whatsapp/settings', [WhatsAppController::class, 'settings']);
    Route::put('/whatsapp/settings', [WhatsAppController::class, 'updateSettings']);
    Route::post('/whatsapp/test-connection', [WhatsAppController::class, 'testConnection']);
    Route::get('/whatsapp/logs', [WhatsAppController::class, 'logs']);
    Route::post('/whatsapp/templates', [WhatsAppController::class, 'createTemplate']);
    Route::get('/whatsapp/automations', [WhatsAppController::class, 'automations']);
    Route::put('/whatsapp/automations', [WhatsAppController::class, 'updateAutomations']);
    Route::get('/whatsapp/campaigns', [WhatsAppController::class, 'campaigns']);
    Route::post('/whatsapp/campaigns', [WhatsAppController::class, 'createCampaign']);
    Route::delete('/whatsapp/campaigns/{id}', [WhatsAppController::class, 'deleteCampaign']);

    // Affiliate Marketing
    Route::get('/affiliate/overview', [AffiliateController::class, 'overview']);
    Route::get('/affiliate/opportunities', [AffiliateController::class, 'getOpportunities']);
    Route::post('/affiliate/opportunities', [AffiliateController::class, 'saveOpportunity']);
    Route::patch('/affiliate/opportunities/{id}', [AffiliateController::class, 'updateOpportunity']);
    Route::delete('/affiliate/opportunities/{id}', [AffiliateController::class, 'deleteOpportunity']);
    Route::get('/affiliate/partners', [AffiliateController::class, 'getPartners']);
    Route::post('/affiliate/partners', [AffiliateController::class, 'savePartner']);
    Route::get('/affiliate/orders', [AffiliateController::class, 'getOrders']);
    Route::get('/affiliate/payments', [AffiliateController::class, 'getPayments']);
    Route::post('/affiliate/payments', [AffiliateController::class, 'savePayment']);
    Route::put('/affiliate/settings', [AffiliateController::class, 'updateSettings']);

    // Marketing Channels Performance
    Route::get('/marketing/channels/overview', [MarketingCampaignsController::class, 'overview']);

    // Loyalty Program
    Route::get('/loyalty/overview', [LoyaltyController::class, 'overview']);
    Route::post('/loyalty/rewards', [LoyaltyController::class, 'saveReward']);
    Route::delete('/loyalty/rewards/{id}', [LoyaltyController::class, 'deleteReward']);
    Route::patch('/loyalty/earn-rules/{id}', [LoyaltyController::class, 'updateEarnRule']);
    Route::put('/loyalty/settings', [LoyaltyController::class, 'updateSettings']);

    // Gifting System
    Route::get('/gifting/settings', [GiftingController::class, 'getSettings']);
    Route::put('/gifting/settings', [GiftingController::class, 'updateSettings']);
});

// Store-scoped category taxonomy catalog (read-only with X-Store-Id isolation)
Route::middleware('store.id')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);
});

// Public Dynamic Domain & Subdomain Resolution for Storefront (Phase 6.1)
Route::get('/storefront/resolve-domain', [DomainController::class, 'resolveDomain']);
Route::get('/resolve-domain', [DomainController::class, 'resolveDomain']);

// Public Theme & Page Builder Layout for Storefront
Route::get('/storefront/theme', [StoreThemeController::class, 'storefrontTheme']);
Route::get('/storefront/builder-layout', [StoreThemeController::class, 'storefrontTheme']);

// Public Inbound Webhooks for official Payment Gateways and Couriers
Route::post('/webhooks/payments/{provider}', [WebhooksController::class, 'paymentWebhook']);
Route::post('/webhooks/couriers/{provider}', [WebhooksController::class, 'courierWebhook']);

// Public Meta WhatsApp Cloud API Inbound Webhooks (Verification & Delivery Events)
Route::get('/whatsapp/webhook', [WhatsAppController::class, 'verifyWebhook']);
Route::post('/whatsapp/webhook', [WhatsAppController::class, 'handleWebhook']);

// Public Dynamic Shipping Calculation for Storefront Checkout
Route::post('/storefront/shipping/calculate', [ShippingController::class, 'calculate']);
Route::post('/storefront/orders', [OrderController::class, 'storefrontStore']);

// Public Storefront Saudi Payments (Mada, Apple Pay, Tabby, Tamara, Card, COD)
Route::get('/storefront/payments/methods', [PaymentGatewayController::class, 'storefrontMethods']);
Route::post('/storefront/payments/initiate', [PaymentGatewayController::class, 'storefrontInitiate']);
Route::post('/storefront/payments/verify', [PaymentGatewayController::class, 'storefrontVerify']);

// Master Admin: Multi-Store Google Integration Ledger
Route::middleware(['auth:sanctum', 'role.can:stores.read'])->group(function () {
    Route::get('/master/google/integrations', [GoogleIntegrationController::class, 'masterStoreIntegrations']);
});

// Master Admin: Multi-Store WhatsApp Quotas & Anti-Ban Controls
Route::get('/master/whatsapp/quotas', [WhatsAppController::class, 'allStoresQuotas']);
Route::put('/master/whatsapp/quotas/{storeId}', [WhatsAppController::class, 'updateStoreQuota']);

// Store-Level Real Blog Content & Commerce Management (Hostinger MySQL)
Route::get('/stores/{storeId}/blog/articles', [BlogController::class, 'index']);
Route::post('/stores/{storeId}/blog/articles', [BlogController::class, 'store']);
Route::put('/stores/{storeId}/blog/articles/{id}', [BlogController::class, 'update']);
Route::delete('/stores/{storeId}/blog/articles/{id}', [BlogController::class, 'destroy']);
Route::post('/stores/{storeId}/blog/articles/bulk', [BlogController::class, 'bulkAction']);
Route::get('/stores/{storeId}/blog/settings', [BlogController::class, 'getSettings']);
Route::put('/stores/{storeId}/blog/settings', [BlogController::class, 'updateSettings']);
Route::get('/stores/{storeId}/blog/commerce-tools/{articleId}', [BlogController::class, 'getCommerceTools']);
Route::put('/stores/{storeId}/blog/commerce-tools/{articleId}', [BlogController::class, 'saveCommerceTools']);

// Store-Level Real Affiliate Marketing Management (Hostinger MySQL)
Route::get('/stores/{storeId}/affiliate/overview', [AffiliateController::class, 'overview']);
Route::get('/stores/{storeId}/affiliate/opportunities', [AffiliateController::class, 'getOpportunities']);
Route::post('/stores/{storeId}/affiliate/opportunities', [AffiliateController::class, 'saveOpportunity']);
Route::patch('/stores/{storeId}/affiliate/opportunities/{id}', [AffiliateController::class, 'updateOpportunity']);
Route::delete('/stores/{storeId}/affiliate/opportunities/{id}', [AffiliateController::class, 'deleteOpportunity']);
Route::get('/stores/{storeId}/affiliate/partners', [AffiliateController::class, 'getPartners']);
Route::post('/stores/{storeId}/affiliate/partners', [AffiliateController::class, 'savePartner']);
Route::get('/stores/{storeId}/affiliate/orders', [AffiliateController::class, 'getOrders']);
Route::get('/stores/{storeId}/affiliate/payments', [AffiliateController::class, 'getPayments']);
Route::post('/stores/{storeId}/affiliate/payments', [AffiliateController::class, 'savePayment']);
Route::put('/stores/{storeId}/affiliate/settings', [AffiliateController::class, 'updateSettings']);

// Store-Level Real Marketing Campaigns & Channels Management (Hostinger MySQL)
Route::get('/stores/{storeId}/marketing/channels/overview', [MarketingCampaignsController::class, 'overview']);

// Store-Level Real Loyalty Program Management (Hostinger MySQL)
Route::get('/stores/{storeId}/loyalty/overview', [LoyaltyController::class, 'overview']);
Route::post('/stores/{storeId}/loyalty/rewards', [LoyaltyController::class, 'saveReward']);
Route::delete('/stores/{storeId}/loyalty/rewards/{id}', [LoyaltyController::class, 'deleteReward']);
Route::patch('/stores/{storeId}/loyalty/earn-rules/{id}', [LoyaltyController::class, 'updateEarnRule']);
Route::put('/stores/{storeId}/loyalty/settings', [LoyaltyController::class, 'updateSettings']);

// Store-Level Real Smart Cart Intercept (Flowers Store 1st-Click Popup & Tracking - Hostinger MySQL)
Route::get('/stores/{storeId}/cart-intercept/settings', [CartInterceptController::class, 'getSettings']);
Route::put('/stores/{storeId}/cart-intercept/settings', [CartInterceptController::class, 'updateSettings']);
Route::get('/stores/{storeId}/cart-intercept/tracking', [CartInterceptController::class, 'getTracking']);
Route::post('/storefront/cart-intercept/{storeId}/track', [CartInterceptController::class, 'trackAction']);
Route::get('/storefront/cart-intercept/{storeId}/settings', [CartInterceptController::class, 'getSettings']);
Route::get('/storefront/cart-intercept/{storeId}/customer/{customerId}', [CartInterceptController::class, 'getCustomerProfileRewards']);

// Store-Level Real Gifting System Management (Hostinger MySQL)
Route::get('/stores/{storeId}/gifting/settings', [GiftingController::class, 'getSettings']);
Route::put('/stores/{storeId}/gifting/settings', [GiftingController::class, 'updateSettings']);

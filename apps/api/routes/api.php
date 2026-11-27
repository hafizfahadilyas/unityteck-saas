<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CustomerActivityController;
use App\Http\Controllers\Api\DeliveryDriverController;
use App\Http\Controllers\Api\OrderInstallmentController;
use App\Http\Controllers\Api\StoreBankAccountController;
use App\Http\Controllers\Api\StorefrontCustomerController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\MediaFolderController;
use App\Http\Controllers\Api\AiMediaController;
use App\Http\Controllers\Api\StoreAiStudioController;
use App\Http\Controllers\Api\MasterGeminiController;
use App\Http\Controllers\Api\StoreAiSuiteController;
use App\Http\Controllers\Api\MasterOpenAiController;
use App\Http\Controllers\Api\MasterAiDeveloperController;
use App\Http\Controllers\Api\StoreAiDevRequestController;
use App\Http\Controllers\Api\StoreAiAgentController;
use App\Http\Controllers\Api\StoreGrowthAdvisorController;
use App\Http\Controllers\Api\CategoryFieldController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\DesignTemplatesController;
use App\Http\Controllers\Api\SocialController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductGroupController;
use App\Http\Controllers\Api\ProductVariationController;
use App\Http\Controllers\Api\SeoController;
use App\Http\Controllers\Api\EnterpriseSeoController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\OnboardingInviteController;
use App\Http\Controllers\Api\PlatformSettingsController;
use App\Http\Controllers\Api\GoogleIntegrationController;
use App\Http\Controllers\Api\CanvaConnectController;
use App\Http\Controllers\Api\ShippingMethodController;
use App\Http\Controllers\Api\CourierController;
use App\Http\Controllers\Api\PaymentGatewayController;
use App\Http\Controllers\Api\BankTransferProofController;
use App\Http\Controllers\Api\IntegrationHealthController;
use App\Http\Controllers\Api\WebhooksController;
use App\Http\Controllers\Api\AnalyticsReportController;
use App\Http\Controllers\Api\StoreThemeController;
use App\Http\Controllers\Api\SouqMarketplaceController;
use App\Http\Controllers\Api\ThemePageController;
use App\Http\Controllers\Api\StoreSettingsController;
use App\Http\Controllers\Api\StoreReviewsController;
use App\Http\Controllers\Api\DomainController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\NotificationSettingsController;
use App\Http\Controllers\Api\WhatsAppController;
use App\Http\Controllers\Api\AffiliateController;
use App\Http\Controllers\Api\LoyaltyController;
use App\Http\Controllers\Api\CashbackController;
use App\Http\Controllers\Api\SpecialOfferController;
use App\Http\Controllers\Api\MarketingCampaignsController;
use App\Http\Controllers\Api\UtmTrackingController;
use App\Http\Controllers\Api\CartInterceptController;
use App\Http\Controllers\Api\GiftingController;
use App\Http\Controllers\Api\StorefrontAnalyticsController;
use App\Http\Controllers\Api\StorefrontSeoBootstrapController;
use App\Http\Controllers\Api\StoreAppointmentController;
use App\Http\Controllers\Api\MasterCentralControlController;
use App\Http\Controllers\Api\MasterMerchantManagementController;
use App\Http\Controllers\Api\MasterStorePlanController;
use App\Http\Controllers\Api\MasterAiSubscriptionController;
use App\Http\Controllers\Api\MasterAiFeatureRegistryController;
use App\Http\Controllers\Api\MasterCreditManagementController;
use App\Http\Controllers\Api\MasterPaymentManagementController;
use App\Http\Controllers\Api\MasterPageVisibilityController;
use App\Http\Controllers\Api\MasterUiComponentController;
use App\Http\Controllers\Api\MasterAuditLogController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'show']);

Route::middleware('throttle:40,1')->group(function () {
    Route::get('/onboarding/invites/{token}', [OnboardingInviteController::class, 'showPublic']);
    Route::post('/onboarding/invites/{token}/redeem', [OnboardingInviteController::class, 'redeem']);
});

Route::get('/stores', [StoreController::class, 'index']);
Route::get('/stores/{id}', [StoreController::class, 'show']);
Route::get('/stores/{storeId}/reviews', [StoreReviewsController::class, 'index']);
Route::post('/stores/{storeId}/reviews', [StoreReviewsController::class, 'store']);

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
    Route::post('/auth/clerk/exchange', [AuthController::class, 'exchangeClerkSession']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/auth/roles', [AuthController::class, 'roles']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/plans', [PlanController::class, 'index']);
    Route::get('/platform/settings', [PlatformSettingsController::class, 'show']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/master/onboarding/invites', [OnboardingInviteController::class, 'index']);
    Route::post('/master/onboarding/invites', [OnboardingInviteController::class, 'store']);
    Route::patch('/platform/settings', [PlatformSettingsController::class, 'update']);
});

// Phase 2.3–2.7 — auth + store scope + role/plan/subscription enforce
Route::middleware(['auth:sanctum', 'store.id'])->group(function () {
    Route::get('/plans/current', [PlanController::class, 'current']);
    Route::get('/design-templates/entitlements', [DesignTemplatesController::class, 'entitlements']);
    Route::get('/design-templates/daily', [DesignTemplatesController::class, 'daily']);
    Route::middleware('plan.feature:social')->group(function () {
    Route::get('/social/accounts', [SocialController::class, 'accounts']);
    Route::put('/social/accounts', [SocialController::class, 'upsertAccount']);
    Route::post('/social/accounts/{platform}/test', [SocialController::class, 'testAccount']);
    Route::post('/social/accounts/{platform}/disconnect', [SocialController::class, 'disconnect']);
    Route::get('/social/posts', [SocialController::class, 'posts']);
    Route::post('/social/posts', [SocialController::class, 'schedule']);
    Route::post('/social/posts/{id}/cancel', [SocialController::class, 'cancel']);
    });
    Route::get('/subscriptions/current', [SubscriptionController::class, 'current']);
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::middleware('role.can:stores.write')->patch(
        '/stores/{storeId}/subscription',
        [SubscriptionController::class, 'update']
    );

    Route::middleware('role.can:stores.write')->group(function () {
        Route::post('/stores', [StoreController::class, 'store']);
        Route::patch('/stores/{id}', [StoreController::class, 'update']);
        Route::delete('/stores/{id}', [StoreController::class, 'destroy']);
    });

    Route::middleware('role.can:products.read')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{id}', [ProductController::class, 'show']);
        Route::get('/products/{productId}/variations', [ProductVariationController::class, 'index']);
        Route::get('/products/{parentId}/group-members', [ProductGroupController::class, 'index']);
    });
    Route::middleware([
        'role.can:products.write',
        'plan.feature:catalog',
        'subscription.writable',
    ])->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::post('/products/ai-suggest', [ProductController::class, 'suggestCopy'])->middleware('throttle:30,1');
        Route::patch('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::post('/products/{id}/restore', [ProductController::class, 'restore']);
        Route::delete('/products/{id}/force', [ProductController::class, 'forceDestroy']);
        Route::post('/products/{id}/toggle-publish', [ProductController::class, 'togglePublish']);
        Route::put('/products/{parentId}/group-members', [ProductGroupController::class, 'sync']);
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

        Route::post('/category-field-definitions', [CategoryFieldController::class, 'store']);
        Route::patch('/category-field-definitions/{id}', [CategoryFieldController::class, 'update']);
        Route::delete('/category-field-definitions/{id}', [CategoryFieldController::class, 'destroy']);
    });

    Route::middleware('role.can:orders.read')->get('/orders', [OrderController::class, 'index']);
    Route::middleware('role.can:orders.read')->get('/orders-cod-summary', [OrderController::class, 'codSummary']);
    Route::middleware('role.can:orders.read')->get('/orders-returns', [OrderController::class, 'returnsIndex']);
    Route::middleware('role.can:orders.read')->get('/orders/{id}', [OrderController::class, 'show']);
    Route::middleware('role.can:orders.read')->get('/appointments', [StoreAppointmentController::class, 'index']);
    Route::middleware('role.can:orders.write')->patch('/appointments/{appointmentId}', [StoreAppointmentController::class, 'update']);
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
        Route::get('/customers/{id}/activities', [CustomerActivityController::class, 'forCustomer']);
        Route::get('/customer-activities', [CustomerActivityController::class, 'index']);
    });
    Route::middleware(['role.can:customers.write', 'subscription.writable'])->group(function () {
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::patch('/customers/{id}', [CustomerController::class, 'update']);
        Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
        Route::post('/customer-activities', [CustomerActivityController::class, 'store']);
    });

    Route::middleware('role.can:customers.read')->group(function () {
        Route::get('/customers/{customerId}/wallet', [WalletController::class, 'show']);
        Route::get('/customers/{customerId}/wallet/transactions', [WalletController::class, 'transactions']);
    });
    Route::middleware(['role.can:customers.write', 'subscription.writable'])->group(function () {
        Route::post('/customers/{customerId}/wallet/adjust', [WalletController::class, 'adjust']);
    });

    Route::middleware(['role.can:coupons.read', 'plan.feature:coupons'])->get('/coupons', [CouponController::class, 'index']);
    Route::middleware([
        'role.can:coupons.write',
        'plan.feature:coupons',
        'subscription.writable',
    ])->group(function () {
        Route::post('/coupons', [CouponController::class, 'store']);
        Route::patch('/coupons/{id}', [CouponController::class, 'update']);
        Route::delete('/coupons/{id}', [CouponController::class, 'destroy']);
    });

    Route::middleware(['role.can:shipping.read', 'plan.feature:shipping'])->get('/shipping', [ShippingController::class, 'index']);
    Route::middleware([
        'role.can:shipping.write',
        'plan.feature:shipping',
        'subscription.writable',
    ])->patch('/shipping/{id}', [ShippingController::class, 'update']);

    // Own-delivery drivers (store_id scoped)
    Route::middleware(['role.can:shipping.read', 'plan.feature:shipping'])->get('/delivery-drivers', [DeliveryDriverController::class, 'index']);
    Route::middleware([
        'role.can:shipping.write',
        'plan.feature:shipping',
        'subscription.writable',
    ])->group(function () {
        Route::post('/delivery-drivers', [DeliveryDriverController::class, 'store']);
        Route::patch('/delivery-drivers/{id}', [DeliveryDriverController::class, 'update']);
        Route::delete('/delivery-drivers/{id}', [DeliveryDriverController::class, 'destroy']);
    });

    // Store bank accounts for bank-transfer / installment reference (settings permissions)
    Route::middleware('role.can:settings.read')->get('/bank-accounts', [StoreBankAccountController::class, 'index']);
    Route::middleware(['role.can:settings.write', 'subscription.writable'])->group(function () {
        Route::post('/bank-accounts', [StoreBankAccountController::class, 'store']);
        Route::patch('/bank-accounts/{id}', [StoreBankAccountController::class, 'update']);
        Route::delete('/bank-accounts/{id}', [StoreBankAccountController::class, 'destroy']);
    });

    // Order installments — read with orders.read; record payment only with orders.write
    Route::middleware('role.can:orders.read')->get('/orders/{id}/installments', [OrderInstallmentController::class, 'index']);
    Route::middleware([
        'role.can:orders.write',
        'plan.feature:orders',
        'subscription.writable',
    ])->group(function () {
        Route::post('/orders/{id}/installments', [OrderInstallmentController::class, 'store']);
        Route::post('/orders/{id}/installments/record-payment', [OrderInstallmentController::class, 'recordPayment']);
    });

    Route::middleware(['role.can:seo.read', 'plan.feature:seo'])->get('/seo', [SeoController::class, 'index']);
    Route::middleware([
        'role.can:seo.write',
        'plan.feature:seo',
        'subscription.writable',
    ])->patch('/seo', [SeoController::class, 'update']);

    // Enterprise Multi-Tenant SEO, AEO, GEO & Technical SEO Suite
    Route::middleware(['role.can:seo.read'])->group(function () {
        Route::get('/seo/dashboard', [EnterpriseSeoController::class, 'merchantDashboard']);
        Route::get('/seo/issues', [EnterpriseSeoController::class, 'listIssues']);
        Route::get('/seo/implementations', [EnterpriseSeoController::class, 'listImplementations']);
        Route::get('/seo/speed', [EnterpriseSeoController::class, 'getSpeedReport'])->middleware('throttle:20,1');
        Route::get('/seo/backlinks', [EnterpriseSeoController::class, 'listBacklinks']);
        Route::get('/seo/keywords', [EnterpriseSeoController::class, 'listKeywords']);
        Route::get('/seo/search-console', [EnterpriseSeoController::class, 'getSearchConsolePerformance']);
        Route::get('/seo/indexnow/key', [EnterpriseSeoController::class, 'getIndexNowKey']);
        Route::get('/seo/settings', [EnterpriseSeoController::class, 'getSettings']);
    });

    Route::middleware(['role.can:seo.write', 'subscription.writable'])->group(function () {
        Route::post('/seo/audit', [EnterpriseSeoController::class, 'triggerAudit'])->middleware('throttle:15,1');
        Route::post('/seo/issues/{id}/resolve', [EnterpriseSeoController::class, 'resolveIssue'])->middleware('throttle:30,1');
        Route::post('/seo/issues/{id}/ignore', [EnterpriseSeoController::class, 'ignoreIssue']);
        Route::post('/seo/products/{productId}/generate', [EnterpriseSeoController::class, 'generateProductSeo'])->middleware('throttle:20,1');
        Route::post('/seo/products/bulk-generate', [EnterpriseSeoController::class, 'bulkGenerateProductSeo'])->middleware('throttle:10,1');
        Route::post('/seo/metadata', [EnterpriseSeoController::class, 'saveMetadata'])->middleware('throttle:30,1');
        Route::post('/seo/implementations/{id}/rollback', [EnterpriseSeoController::class, 'rollbackImplementation'])->middleware('throttle:20,1');
        Route::post('/seo/aeo/generate', [EnterpriseSeoController::class, 'generateAeo'])->middleware('throttle:20,1');
        Route::post('/seo/geo/generate', [EnterpriseSeoController::class, 'generateGeo'])->middleware('throttle:20,1');
        Route::post('/seo/keywords', [EnterpriseSeoController::class, 'storeKeyword']);
        Route::post('/seo/indexnow/submit', [EnterpriseSeoController::class, 'submitIndexNow'])->middleware('throttle:30,1');
        Route::patch('/seo/settings', [EnterpriseSeoController::class, 'updateSettings']);
    });

    // Media Library Routes
    Route::get('/media', [MediaController::class, 'index']);
    Route::post('/media', [MediaController::class, 'store']);
    Route::get('/media/{id}', [MediaController::class, 'show']);
    Route::patch('/media/{id}', [MediaController::class, 'update']);
    Route::post('/media/{id}/replace', [MediaController::class, 'replace']);
    Route::delete('/media/{id}', [MediaController::class, 'destroy']);
    Route::get('/media/{id}/usages', [MediaController::class, 'usages']);

    // AI image/video generator — per-store quota + brand identity (GEMINI_API_KEY on API only)
    Route::get('/ai-media/quota', [AiMediaController::class, 'quota']);
    Route::get('/ai-media/brand-profile', [AiMediaController::class, 'brandProfile']);
    Route::put('/ai-media/brand-profile', [AiMediaController::class, 'updateBrandProfile'])->middleware('throttle:40,1');
    Route::post('/ai-media/enhance-prompt', [AiMediaController::class, 'enhancePrompt'])->middleware('throttle:30,1');
    Route::post('/ai-media/generate', [AiMediaController::class, 'generate'])->middleware('throttle:20,1');

    // Merchant AI Image Studio (Google Gemini, store isolated)
    Route::get('/ai-studio/quota', [StoreAiStudioController::class, 'quota']);
    Route::post('/ai-studio/generate', [StoreAiStudioController::class, 'generate'])->middleware('throttle:20,1');
    Route::get('/ai-studio/history', [StoreAiStudioController::class, 'history']);
    Route::post('/ai-studio/save-to-media', [StoreAiStudioController::class, 'saveToMedia'])->middleware('throttle:30,1');

    // Store AI Tools suite (Images + Text + Automation + engine modules) — payment gated; Master unlocks
    Route::get('/ai-suite/status', [StoreAiSuiteController::class, 'status']);
    Route::get('/ai-suite/modules', [StoreAiSuiteController::class, 'modules']);
    Route::post('/ai-suite/text', [StoreAiSuiteController::class, 'completeText'])->middleware('throttle:30,1');
    Route::post('/ai-suite/automation/ask', [StoreAiSuiteController::class, 'askAutomation'])->middleware('throttle:20,1');
    Route::post('/ai-suite/run', [StoreAiSuiteController::class, 'run'])->middleware('throttle:30,1');
    Route::post('/ai-suite/payment/submit', [StoreAiSuiteController::class, 'submitPayment'])->middleware('throttle:10,1');
    Route::post('/ai-suite/payment/online', [StoreAiSuiteController::class, 'onlinePayment'])->middleware('throttle:10,1');
    Route::get('/ai-suite/payments', [StoreAiSuiteController::class, 'payments']);

    // Phase 3 — merchant opens diagnostics support request only (no source edit / no deploy)
    Route::get('/ai-suite/dev-requests', [StoreAiDevRequestController::class, 'index']);
    Route::post('/ai-suite/dev-requests', [StoreAiDevRequestController::class, 'store'])->middleware('throttle:20,1');

    // AI Store Setup & Health Audit Agent (Google Gemini Free Tier)
    Route::get('/ai-agent/audit', [StoreAiAgentController::class, 'audit']);
    Route::post('/ai-agent/fix', [StoreAiAgentController::class, 'fix'])->middleware('throttle:30,1');
    Route::post('/ai-agent/skip', [StoreAiAgentController::class, 'skip']);
    Route::post('/ai-agent/unskip', [StoreAiAgentController::class, 'unskip']);

    // SOUQ Autonomous AI Store Growth Advisor & Optimization Agent
    Route::get('/growth-advisor/overview', [StoreGrowthAdvisorController::class, 'overview']);
    Route::post('/growth-advisor/analyze', [StoreGrowthAdvisorController::class, 'analyze'])->middleware('throttle:15,1');
    Route::get('/growth-advisor/recommendations', [StoreGrowthAdvisorController::class, 'recommendations']);
    Route::get('/growth-advisor/recommendations/{id}/plan', [StoreGrowthAdvisorController::class, 'plan']);
    Route::post('/growth-advisor/recommendations/{id}/execute', [StoreGrowthAdvisorController::class, 'execute'])->middleware('throttle:20,1');
    Route::post('/growth-advisor/recommendations/{id}/skip', [StoreGrowthAdvisorController::class, 'skip']);
    Route::post('/growth-advisor/actions/{id}/rollback', [StoreGrowthAdvisorController::class, 'rollback'])->middleware('throttle:10,1');
    Route::put('/growth-advisor/settings', [StoreGrowthAdvisorController::class, 'updateSettings']);
    Route::get('/growth-advisor/history', [StoreGrowthAdvisorController::class, 'history']);

    Route::get('/media-folders', [MediaFolderController::class, 'index']);
    Route::post('/media-folders', [MediaFolderController::class, 'store']);
    Route::patch('/media-folders/{id}', [MediaFolderController::class, 'update']);
    Route::delete('/media-folders/{id}', [MediaFolderController::class, 'destroy']);

    // Google Cloud & Site Kit Integration Routes (Store-isolated)
    Route::get('/google/auth-url', [GoogleIntegrationController::class, 'getAuthUrl']);
    Route::post('/google/callback', [GoogleIntegrationController::class, 'handleCallback']);
    Route::get('/google/status', [GoogleIntegrationController::class, 'getStatus']);
    Route::get('/google/properties', [GoogleIntegrationController::class, 'getProperties']);
    Route::post('/google/properties', [GoogleIntegrationController::class, 'saveProperties']);
    Route::post('/google/sync', [GoogleIntegrationController::class, 'sync']);
    Route::post('/google/disconnect', [GoogleIntegrationController::class, 'disconnect']);
    Route::get('/google/analytics', [GoogleIntegrationController::class, 'getAnalytics'])->middleware('plan.feature:analytics');
    Route::get('/google/search-console', [GoogleIntegrationController::class, 'getSearchConsole']);
    Route::get('/google/pagespeed', [GoogleIntegrationController::class, 'getPageSpeed']);
    Route::post('/google/indexing', [GoogleIntegrationController::class, 'requestIndexing']);

    // Google Ads — store-isolated campaigns / budgets / ROAS (real API only)
    Route::get('/google/ads/overview', [\App\Http\Controllers\Api\GoogleAdsController::class, 'overview']);
    Route::get('/google/ads/campaigns', [\App\Http\Controllers\Api\GoogleAdsController::class, 'campaigns']);
    Route::get('/google/ads/ad-groups', [\App\Http\Controllers\Api\GoogleAdsController::class, 'adGroups']);
    Route::get('/google/ads/report', [\App\Http\Controllers\Api\GoogleAdsController::class, 'report']);
    Route::post('/google/ads/sync', [\App\Http\Controllers\Api\GoogleAdsController::class, 'sync']);
    Route::post('/google/ads/campaigns', [\App\Http\Controllers\Api\GoogleAdsController::class, 'storeCampaign']);
    Route::patch('/google/ads/campaigns/{campaignId}', [\App\Http\Controllers\Api\GoogleAdsController::class, 'updateCampaign']);
    Route::get('/google/ads/recommendations', [\App\Http\Controllers\Api\GoogleAdsController::class, 'recommendations']);
    Route::post('/google/ads/conversions/upload', [\App\Http\Controllers\Api\GoogleAdsController::class, 'uploadConversions']);
    Route::get('/google/ads/geo-presets', [\App\Http\Controllers\Api\GoogleAdsController::class, 'geoPresets']);

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
    Route::get('/payments/bank-transfer-proofs', [BankTransferProofController::class, 'index']);
    Route::post('/payments/bank-transfer-proofs/{id}/approve', [BankTransferProofController::class, 'approve']);
    Route::post('/payments/bank-transfer-proofs/{id}/reject', [BankTransferProofController::class, 'reject']);

    // Home dashboard (visits / weekday chart) — all plans
    Route::get('/analytics/dashboard-home', [AnalyticsReportController::class, 'dashboardHome']);

    // Real Database-Calculated Payment & Shipping Analytics
    Route::middleware('plan.feature:analytics')->group(function () {
    Route::get('/analytics/overview', [AnalyticsReportController::class, 'overview']);
    Route::get('/analytics/sales-revenue', [AnalyticsReportController::class, 'salesRevenue']);
    Route::get('/analytics/campaigns', [AnalyticsReportController::class, 'campaignAnalytics']);
    });
    Route::middleware('plan.feature:ai')->group(function () {
    Route::get('/analytics/ai-insights', [AnalyticsReportController::class, 'aiInsights']);
    Route::post('/analytics/ai-insights/ask', [AnalyticsReportController::class, 'askAi']);
    });
    Route::middleware('plan.feature:analytics')->group(function () {
    Route::get('/analytics/behavior', [AnalyticsReportController::class, 'behaviorAnalytics']);
    Route::get('/analytics/customers', [AnalyticsReportController::class, 'customerAnalytics']);
    Route::get('/analytics/products', [AnalyticsReportController::class, 'productAnalytics']);
    Route::get('/analytics/channels', [AnalyticsReportController::class, 'channelAnalytics']);
    Route::get('/analytics/search-queries', [AnalyticsReportController::class, 'searchQueries']);
    Route::get('/analytics/payments', [AnalyticsReportController::class, 'paymentReports']);
    Route::get('/analytics/shipping', [AnalyticsReportController::class, 'shippingReports']);
    Route::get('/analytics/marketing', [AnalyticsReportController::class, 'marketingAnalytics']);
    Route::get('/utm-links', [UtmTrackingController::class, 'index']);
    Route::post('/utm-links', [UtmTrackingController::class, 'store']);
    Route::delete('/utm-links/{id}', [UtmTrackingController::class, 'destroy']);
    });


    // Theme & Page Builder Persistence (Phase 2.2)
    Route::get('/themes-catalog', [StoreThemeController::class, 'catalog']);
    Route::post('/themes/{themeId}/purchase', [SouqMarketplaceController::class, 'purchaseTheme']);
    Route::get('/marketplace/addons', [SouqMarketplaceController::class, 'storeAddOns']);
    Route::get('/theme-settings', [StoreThemeController::class, 'show']);
    Route::put('/theme-settings', [StoreThemeController::class, 'update']);
    Route::patch('/theme-settings', [StoreThemeController::class, 'update']);
    Route::get('/builder-layout', [StoreThemeController::class, 'getBuilderLayout']);
    Route::put('/builder-layout', [StoreThemeController::class, 'saveBuilderLayout']);
    Route::post('/builder-layout', [StoreThemeController::class, 'saveBuilderLayout']);

    // Direct storeId parameter routes
    Route::get('/stores/{storeId}/global-styles', [StoreThemeController::class, 'showGlobalStyles']);
    Route::put('/stores/{storeId}/global-styles', [StoreThemeController::class, 'updateGlobalStyles']);
    Route::get('/stores/{storeId}/theme-settings', [StoreThemeController::class, 'show']);
    Route::put('/stores/{storeId}/theme-settings', [StoreThemeController::class, 'update']);
    Route::put('/stores/{storeId}/reviews', [StoreReviewsController::class, 'update']);
    Route::patch('/stores/{storeId}/theme-settings', [StoreThemeController::class, 'update']);
    Route::get('/stores/{storeId}/builder-layout', [StoreThemeController::class, 'getBuilderLayout']);
    Route::put('/stores/{storeId}/builder-layout', [StoreThemeController::class, 'saveBuilderLayout']);
    Route::post('/stores/{storeId}/builder-layout', [StoreThemeController::class, 'saveBuilderLayout']);

    Route::get('/stores/{storeId}/pages', [ThemePageController::class, 'index']);
    Route::post('/stores/{storeId}/media', [MediaController::class, 'storeForStore']);
    Route::post('/stores/{storeId}/pages', [ThemePageController::class, 'store']);
    Route::get('/stores/{storeId}/pages/{pageKey}', [ThemePageController::class, 'show']);
    Route::put('/stores/{storeId}/pages/{pageId}', [ThemePageController::class, 'update']);
    Route::delete('/stores/{storeId}/pages/{pageId}', [ThemePageController::class, 'destroy']);
    Route::post('/stores/{storeId}/pages/{pageId}/publish', [ThemePageController::class, 'publish']);
    Route::get('/stores/{storeId}/pages/{pageId}/revisions', [ThemePageController::class, 'revisions']);
    Route::post('/stores/{storeId}/pages/{pageId}/revisions', [ThemePageController::class, 'storeRevision']);
    Route::post('/stores/{storeId}/revisions/{revisionId}/restore', [ThemePageController::class, 'restore']);
    Route::post('/stores/{storeId}/ai/seo', [ThemePageController::class, 'suggestSeo']);
    Route::post('/stores/{storeId}/ai/heading', [ThemePageController::class, 'suggestHeading']);
    Route::post('/stores/{storeId}/ai/alt', [ThemePageController::class, 'suggestAlt']);
    Route::post('/stores/{storeId}/ai/translate', [ThemePageController::class, 'suggestTranslate']);
    Route::post('/stores/{storeId}/ai/apply', [ThemePageController::class, 'applySuggestion']);

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
    Route::post('/domains', [DomainController::class, 'store'])->middleware('plan.feature:custom_domain');
    Route::post('/domains/{id}/verify', [DomainController::class, 'verify']);
    Route::post('/domains/{id}/ssl', [DomainController::class, 'ssl']);
    Route::delete('/domains/{id}', [DomainController::class, 'destroy']);

    // Saudi WhatsApp & SMS Transactional Notifications (Phase 6.4)
    Route::get('/notifications/settings', [NotificationSettingsController::class, 'getSettings']);
    Route::put('/notifications/settings', [NotificationSettingsController::class, 'updateSettings']);
    Route::post('/notifications/test', [NotificationSettingsController::class, 'sendTestNotification']);
    Route::get('/notifications/deliveries', [NotificationSettingsController::class, 'listDeliveries']);
    Route::post('/notifications/deliveries/mark-read', [NotificationSettingsController::class, 'markDeliveriesRead']);

    // WhatsApp Store Management (auth + plan)
    Route::middleware('plan.feature:whatsapp')->group(function () {
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
        Route::get('/whatsapp/auto-reply', [WhatsAppController::class, 'getAutoReplySettings']);
        Route::put('/whatsapp/auto-reply', [WhatsAppController::class, 'updateAutoReplySettings']);
        Route::post('/whatsapp/auto-reply/test', [WhatsAppController::class, 'testAutoReply'])->middleware('throttle:30,1');
    });

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
    Route::post('/loyalty/spin', [LoyaltyController::class, 'dailySpin']);
    Route::post('/loyalty/bonuses/saved-card', [LoyaltyController::class, 'awardSavedCardBonus']);
    Route::post('/loyalty/bonuses/location-push', [LoyaltyController::class, 'awardLocationPushBonus']);
    Route::get('/loyalty/customers/{customerId}/summary', [LoyaltyController::class, 'customerSummary']);

    // Cashback Campaigns (store wallet only)
    Route::get('/cashback/campaigns', [CashbackController::class, 'index']);
    Route::post('/cashback/campaigns', [CashbackController::class, 'store']);
    Route::patch('/cashback/campaigns/{id}', [CashbackController::class, 'update']);
    Route::delete('/cashback/campaigns/{id}', [CashbackController::class, 'destroy']);

    // Special / Promotional Offers (customer banner bg + image)
    Route::get('/special-offers', [SpecialOfferController::class, 'index']);
    Route::post('/special-offers', [SpecialOfferController::class, 'store']);
    Route::patch('/special-offers/{id}', [SpecialOfferController::class, 'update']);
    Route::delete('/special-offers/{id}', [SpecialOfferController::class, 'destroy']);

    // Gifting System
    Route::get('/gifting/settings', [GiftingController::class, 'getSettings']);
    Route::put('/gifting/settings', [GiftingController::class, 'updateSettings']);

    // tenantApi path-style (same controllers; storeId in URL)
    Route::get('/stores/{storeId}/blog/articles', [BlogController::class, 'index']);
    Route::post('/stores/{storeId}/blog/articles', [BlogController::class, 'store']);
    Route::put('/stores/{storeId}/blog/articles/{id}', [BlogController::class, 'update']);
    Route::delete('/stores/{storeId}/blog/articles/{id}', [BlogController::class, 'destroy']);
    Route::post('/stores/{storeId}/blog/articles/bulk', [BlogController::class, 'bulkAction']);
    Route::get('/stores/{storeId}/blog/settings', [BlogController::class, 'getSettings']);
    Route::put('/stores/{storeId}/blog/settings', [BlogController::class, 'updateSettings']);
    Route::get('/stores/{storeId}/blog/commerce-tools/{articleId}', [BlogController::class, 'getCommerceTools']);
    Route::put('/stores/{storeId}/blog/commerce-tools/{articleId}', [BlogController::class, 'saveCommerceTools']);

    Route::get('/stores/{storeId}/affiliate/overview', [AffiliateController::class, 'overview']);
    Route::get('/stores/{storeId}/affiliate/opportunities', [AffiliateController::class, 'getOpportunities']);
    Route::get('/stores/{storeId}/affiliate/partners', [AffiliateController::class, 'getPartners']);
    Route::get('/stores/{storeId}/affiliate/orders', [AffiliateController::class, 'getOrders']);
    Route::get('/stores/{storeId}/affiliate/payments', [AffiliateController::class, 'getPayments']);
    Route::post('/stores/{storeId}/affiliate/opportunities', [AffiliateController::class, 'saveOpportunity']);
    Route::patch('/stores/{storeId}/affiliate/opportunities/{id}', [AffiliateController::class, 'updateOpportunity']);
    Route::delete('/stores/{storeId}/affiliate/opportunities/{id}', [AffiliateController::class, 'deleteOpportunity']);
    Route::post('/stores/{storeId}/affiliate/partners', [AffiliateController::class, 'savePartner']);
    Route::post('/stores/{storeId}/affiliate/payments', [AffiliateController::class, 'savePayment']);
    Route::put('/stores/{storeId}/affiliate/settings', [AffiliateController::class, 'updateSettings']);

    Route::get('/stores/{storeId}/marketing/channels/overview', [MarketingCampaignsController::class, 'overview']);

    Route::post('/stores/{storeId}/loyalty/rewards', [LoyaltyController::class, 'saveReward']);
    Route::delete('/stores/{storeId}/loyalty/rewards/{id}', [LoyaltyController::class, 'deleteReward']);
    Route::patch('/stores/{storeId}/loyalty/earn-rules/{id}', [LoyaltyController::class, 'updateEarnRule']);
    Route::put('/stores/{storeId}/loyalty/settings', [LoyaltyController::class, 'updateSettings']);
    Route::post('/stores/{storeId}/loyalty/spin', [LoyaltyController::class, 'dailySpin']);
    Route::post('/stores/{storeId}/loyalty/bonuses/saved-card', [LoyaltyController::class, 'awardSavedCardBonus']);
    Route::post('/stores/{storeId}/loyalty/bonuses/location-push', [LoyaltyController::class, 'awardLocationPushBonus']);
    Route::get('/stores/{storeId}/loyalty/customers/{customerId}/summary', [LoyaltyController::class, 'customerSummary']);

    Route::get('/stores/{storeId}/cashback/campaigns', [CashbackController::class, 'index']);
    Route::post('/stores/{storeId}/cashback/campaigns', [CashbackController::class, 'store']);
    Route::patch('/stores/{storeId}/cashback/campaigns/{id}', [CashbackController::class, 'update']);
    Route::delete('/stores/{storeId}/cashback/campaigns/{id}', [CashbackController::class, 'destroy']);

    Route::get('/stores/{storeId}/special-offers', [SpecialOfferController::class, 'index']);
    Route::post('/stores/{storeId}/special-offers', [SpecialOfferController::class, 'store']);
    Route::patch('/stores/{storeId}/special-offers/{id}', [SpecialOfferController::class, 'update']);
    Route::delete('/stores/{storeId}/special-offers/{id}', [SpecialOfferController::class, 'destroy']);

    Route::get('/stores/{storeId}/gifting/settings', [GiftingController::class, 'getSettings']);
    Route::put('/stores/{storeId}/gifting/settings', [GiftingController::class, 'updateSettings']);

    Route::get('/stores/{storeId}/loyalty/overview', [LoyaltyController::class, 'overview']);

    Route::get('/stores/{storeId}/cart-intercept/settings', [CartInterceptController::class, 'getSettings']);
    Route::put('/stores/{storeId}/cart-intercept/settings', [CartInterceptController::class, 'updateSettings']);
    Route::get('/stores/{storeId}/cart-intercept/tracking', [CartInterceptController::class, 'getTracking']);

    Route::get('/design-templates/daily', [DesignTemplatesController::class, 'daily']);
    Route::get('/studio-designs', [\App\Http\Controllers\Api\StoreStudioDesignController::class, 'index']);
    Route::post('/studio-designs', [\App\Http\Controllers\Api\StoreStudioDesignController::class, 'store']);
    Route::get('/studio-designs/{id}', [\App\Http\Controllers\Api\StoreStudioDesignController::class, 'show']);
    Route::put('/studio-designs/{id}', [\App\Http\Controllers\Api\StoreStudioDesignController::class, 'update']);
    Route::delete('/studio-designs/{id}', [\App\Http\Controllers\Api\StoreStudioDesignController::class, 'destroy']);
});

// Store-scoped category taxonomy catalog (read-only with X-Store-Id isolation)
Route::middleware('store.id')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);
    Route::get('/category-field-definitions', [CategoryFieldController::class, 'index']);
});

// Public Dynamic Domain & Subdomain Resolution for Storefront (Phase 6.1)
Route::get('/storefront/resolve-domain', [DomainController::class, 'resolveDomain']);

// CT-6 / CT-7 — public Souq marketplace (pricing parity with dashboard)
Route::get('/storefront/marketplace/plans', [SouqMarketplaceController::class, 'publicPlans']);
Route::get('/storefront/marketplace/themes', [SouqMarketplaceController::class, 'publicThemes']);
Route::get('/storefront/marketplace/addons', [SouqMarketplaceController::class, 'publicAddOns']);
Route::get('/storefront/marketplace/bundle', [SouqMarketplaceController::class, 'publicBundle']);
Route::get('/resolve-domain', [DomainController::class, 'resolveDomain']);

// Public Theme & Page Builder Layout for Storefront
Route::get('/storefront/theme', [StoreThemeController::class, 'storefrontTheme']);
Route::get('/storefront/sitemap', [StoreThemeController::class, 'storefrontSitemap']);
    Route::get('/storefront/robots', [StoreThemeController::class, 'storefrontRobots']);
    Route::get('/storefront/llms', [StoreThemeController::class, 'storefrontLlms']);
Route::get('/storefront/seo-bootstrap', [StorefrontSeoBootstrapController::class, 'show']);
Route::post('/storefront/events', [StorefrontAnalyticsController::class, 'storeEvent']);
Route::get('/storefront/builder-layout', [StoreThemeController::class, 'storefrontTheme']);

// Public per-store product catalog (no auth). Isolated by store_id / slug.
Route::get('/storefront/catalog', [ProductController::class, 'storefrontCatalog']);
Route::get('/storefront/products/{productKey}', [ProductController::class, 'storefrontProduct']);
Route::get('/storefront/categories', [ProductController::class, 'storefrontCategories']);
Route::post('/storefront/newsletter', [StoreSettingsController::class, 'subscribeNewsletter']);
Route::post('/storefront/contact', [StoreSettingsController::class, 'submitContact']);
Route::post('/storefront/customers', [StorefrontCustomerController::class, 'upsert']);
Route::get('/storefront/{storeId}/loyalty/balance', [LoyaltyController::class, 'storefrontBalance']);
Route::post('/storefront/customer-activities', [CustomerActivityController::class, 'storefrontStore']);

// Public Inbound Webhooks for official Payment Gateways and Couriers
Route::post('/webhooks/payments/{provider}', [WebhooksController::class, 'paymentWebhook']);
Route::post('/webhooks/couriers/{provider}', [WebhooksController::class, 'courierWebhook']);

// Public Meta WhatsApp Cloud API Inbound Webhooks (Verification & Delivery Events)
Route::get('/whatsapp/webhook', [WhatsAppController::class, 'verifyWebhook']);
Route::post('/whatsapp/webhook', [WhatsAppController::class, 'handleWebhook']);

// Public Dynamic Shipping Calculation for Storefront Checkout
Route::post('/storefront/shipping/calculate', [ShippingController::class, 'calculate']);
Route::post('/storefront/orders', [OrderController::class, 'storefrontStore']);
Route::post('/storefront/orders/track', [OrderController::class, 'storefrontTrack']);
Route::post('/storefront/orders/mine', [OrderController::class, 'storefrontMine']);

// Al-Saeedi / automotive appointments (store_id isolated)
Route::middleware('store.id')->group(function () {
    Route::get('/storefront/appointments/services', [StoreAppointmentController::class, 'storefrontServices']);
    Route::get('/storefront/appointments/slots', [StoreAppointmentController::class, 'storefrontSlots']);
    Route::post('/storefront/appointments', [StoreAppointmentController::class, 'storefrontStore'])->middleware('throttle:20,1');
});
Route::post('/storefront/notifications/mine', [NotificationSettingsController::class, 'storefrontCustomerDeliveries']);
Route::post('/storefront/coupons/validate', [CouponController::class, 'storefrontValidate']);

// Public Storefront Saudi Payments (Mada, Apple Pay, Tabby, Tamara, Card, COD)
Route::get('/storefront/payments/methods', [PaymentGatewayController::class, 'storefrontMethods']);
Route::get('/storefront/payments/bank-account', [PaymentGatewayController::class, 'storefrontBankAccount']);
Route::post('/storefront/payments/initiate', [PaymentGatewayController::class, 'storefrontInitiate']);
Route::post('/storefront/payments/verify', [PaymentGatewayController::class, 'storefrontVerify']);
Route::post('/storefront/payments/bank-transfer-proofs', [BankTransferProofController::class, 'storefrontUpload'])->middleware('throttle:20,1');

// Master Admin: Multi-Store Google Integration Ledger
Route::middleware(['auth:sanctum', 'role.can:stores.read'])->group(function () {
    Route::get('/master/google/integrations', [GoogleIntegrationController::class, 'masterStoreIntegrations']);
});

// Master Admin: Integration Health Center (payments + shipping)
Route::middleware(['auth:sanctum', 'role.can:stores.read'])->group(function () {
    Route::get('/master/integrations/health', [IntegrationHealthController::class, 'index']);
    Route::get('/master/integrations/health/logs', [IntegrationHealthController::class, 'logs']);
    Route::get('/master/integrations/health/{storeId}', [IntegrationHealthController::class, 'show']);
});
Route::middleware(['auth:sanctum', 'role.can:stores.write'])->group(function () {
    Route::post('/master/integrations/health/test', [IntegrationHealthController::class, 'test'])->middleware('throttle:30,1');
    Route::post('/master/integrations/health/audit', [IntegrationHealthController::class, 'audit'])->middleware('throttle:10,1');
});

// Master Admin: Official Canva Connect (testing — separate from Design Studio)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/master/canva-connect/status', [CanvaConnectController::class, 'status']);
    Route::get('/master/canva-connect/auth-url', [CanvaConnectController::class, 'authUrl']);
    Route::post('/master/canva-connect/callback', [CanvaConnectController::class, 'callback']);
    Route::post('/master/canva-connect/disconnect', [CanvaConnectController::class, 'disconnect']);
    Route::get('/master/canva-connect/designs', [CanvaConnectController::class, 'listDesigns']);
    Route::post('/master/canva-connect/designs', [CanvaConnectController::class, 'createDesign']);
    Route::post('/master/canva-connect/designs/{designId}/export', [CanvaConnectController::class, 'exportDesign']);
});

// Master Admin: Multi-Store WhatsApp Quotas & Anti-Ban Controls
Route::middleware(['auth:sanctum', 'role.can:stores.read'])->group(function () {
    Route::get('/master/whatsapp/quotas', [WhatsAppController::class, 'allStoresQuotas']);
});
Route::middleware(['auth:sanctum', 'role.can:stores.write'])->group(function () {
    Route::put('/master/whatsapp/quotas/{storeId}', [WhatsAppController::class, 'updateStoreQuota']);
});

// Master Admin: Phase 3 AI Developer diagnostics (read-only; auto-deploy always forbidden)
Route::middleware(['auth:sanctum', 'role.can:stores.read'])->group(function () {
    Route::get('/master/ai-developer/requests', [MasterAiDeveloperController::class, 'index']);
    Route::get('/master/ai-developer/requests/{id}', [MasterAiDeveloperController::class, 'show']);
});
Route::middleware(['auth:sanctum', 'role.can:stores.write'])->group(function () {
    Route::post('/master/ai-developer/diagnose', [MasterAiDeveloperController::class, 'diagnose'])->middleware('throttle:20,1');
    Route::post('/master/ai-developer/requests/{id}/close', [MasterAiDeveloperController::class, 'close'])->middleware('throttle:30,1');
    Route::post('/master/ai-developer/deploy', [MasterAiDeveloperController::class, 'deployDenied']);
});

// Master Admin: OpenAI AI Management (isolated from Gemini /ai-media)
Route::middleware(['auth:sanctum', 'role.can:stores.read'])->group(function () {
    Route::get('/master/openai/overview', [MasterOpenAiController::class, 'overview']);
    Route::get('/master/openai/stores', [MasterOpenAiController::class, 'stores']);
    Route::get('/master/openai/stores/{storeId}', [MasterOpenAiController::class, 'showStore']);
    Route::get('/master/openai/stores/{storeId}/image', [MasterOpenAiController::class, 'imageShow']);
    Route::get('/master/openai/stores/{storeId}/automation', [MasterOpenAiController::class, 'automationShow']);
});
Route::middleware(['auth:sanctum', 'role.can:stores.write'])->group(function () {
    Route::put('/master/openai/global', [MasterOpenAiController::class, 'updateGlobal'])->middleware('throttle:30,1');
    Route::put('/master/openai/pricing', [MasterOpenAiController::class, 'updatePricing'])->middleware('throttle:20,1');
    Route::put('/master/openai/stores/{storeId}', [MasterOpenAiController::class, 'updateStore'])->middleware('throttle:40,1');
    Route::post('/master/openai/stores/{storeId}/reset', [MasterOpenAiController::class, 'resetStore'])->middleware('throttle:20,1');
    Route::post('/master/openai/stores/{storeId}/unlock-payment', [MasterOpenAiController::class, 'unlockPayment'])->middleware('throttle:20,1');
    Route::post('/master/openai/unlock-suite', [MasterOpenAiController::class, 'unlockSuite'])->middleware('throttle:10,1');
    Route::post('/master/openai/stores/{storeId}/complete', [MasterOpenAiController::class, 'complete'])->middleware('throttle:20,1');
    Route::put('/master/openai/stores/{storeId}/image', [MasterOpenAiController::class, 'imageUpdate'])->middleware('throttle:40,1');
    Route::post('/master/openai/stores/{storeId}/image/unlock-payment', [MasterOpenAiController::class, 'imageUnlock'])->middleware('throttle:20,1');
    Route::post('/master/openai/stores/{storeId}/image/generate', [MasterOpenAiController::class, 'imageGenerate'])->middleware('throttle:15,1');
    Route::put('/master/openai/stores/{storeId}/automation', [MasterOpenAiController::class, 'automationUpdate'])->middleware('throttle:40,1');
    Route::post('/master/openai/stores/{storeId}/automation/unlock-payment', [MasterOpenAiController::class, 'automationUnlock'])->middleware('throttle:20,1');
    Route::post('/master/openai/stores/{storeId}/automation/ask', [MasterOpenAiController::class, 'automationAsk'])->middleware('throttle:20,1');
});

// Master Admin: Google Gemini AI Settings & Multi-Provider AI Suite
Route::middleware(['auth:sanctum', 'role.can:stores.read'])->group(function () {
    Route::get('/master/gemini/settings', [MasterGeminiController::class, 'settings']);
    Route::get('/master/gemini/models', [MasterGeminiController::class, 'models']);
    Route::get('/master/gemini/merchant-limits', [MasterGeminiController::class, 'merchantLimits']);
    Route::get('/master/gemini/pricing', [MasterGeminiController::class, 'pricing']);
    Route::get('/master/gemini/analytics', [MasterGeminiController::class, 'analytics']);
    Route::get('/master/gemini/logs', [MasterGeminiController::class, 'logs']);
    Route::get('/master/gemini/history', [MasterGeminiController::class, 'history']);
});
Route::middleware(['auth:sanctum', 'role.can:stores.write'])->group(function () {
    Route::post('/master/gemini/settings', [MasterGeminiController::class, 'updateSettings'])->middleware('throttle:30,1');
    Route::post('/master/gemini/test-connection', [MasterGeminiController::class, 'testConnection'])->middleware('throttle:20,1');
    Route::post('/master/gemini/api-key', [MasterGeminiController::class, 'updateApiKey'])->middleware('throttle:10,1');
    Route::post('/master/gemini/models/refresh', [MasterGeminiController::class, 'refreshModels'])->middleware('throttle:15,1');
    Route::put('/master/gemini/models/{id}', [MasterGeminiController::class, 'updateModel'])->middleware('throttle:30,1');
    Route::post('/master/gemini/merchant-limits', [MasterGeminiController::class, 'updateMerchantLimits'])->middleware('throttle:30,1');
    Route::post('/master/gemini/merchant-credits/adjust', [MasterGeminiController::class, 'adjustMerchantCredits'])->middleware('throttle:20,1');
});

// Master Admin: Enterprise Multi-Store SEO, AEO, GEO & Search Visibility Management
Route::middleware(['auth:sanctum', 'role.can:stores.read'])->group(function () {
    Route::get('/master/seo/overview', [EnterpriseSeoController::class, 'masterOverview']);
    Route::get('/master/seo/stores', [EnterpriseSeoController::class, 'masterStores']);
});
Route::middleware(['auth:sanctum', 'role.can:stores.write'])->group(function () {
    Route::post('/master/seo/stores/{storeId}/audit', [EnterpriseSeoController::class, 'masterAuditStore'])->middleware('throttle:15,1');
});

// Storefront cart intercept (public read/track only)
Route::post('/storefront/cart-intercept/{storeId}/track', [CartInterceptController::class, 'trackAction']);
Route::get('/storefront/cart-intercept/{storeId}/settings', [CartInterceptController::class, 'getSettings']);
Route::get('/storefront/cart-intercept/{storeId}/customer/{customerId}', [CartInterceptController::class, 'getCustomerProfileRewards']);
Route::get('/storefront/cashback/active', [CashbackController::class, 'storefrontActive']);
Route::get('/storefront/special-offers/active', [SpecialOfferController::class, 'storefrontActive']);

// ============================================================================
// SOUQ MASTER ADMIN CENTRAL CONTROL CENTER - AUTHORITATIVE API SUITE
// ============================================================================

// Real-time / Dynamic Configuration Sync Endpoint for Merchant Dashboards
Route::get('/config/sync', [MasterCentralControlController::class, 'syncConfig']);

Route::middleware(['auth:sanctum', 'role.can:stores.read'])->group(function () {
    // 1. Central Overview & Global Settings
    Route::get('/master/control-center/overview', [MasterCentralControlController::class, 'overview']);
    Route::get('/master/control-center/global-settings', [MasterCentralControlController::class, 'getGlobalSettings']);

    // 2. Merchant Management
    Route::get('/master/merchants', [MasterMerchantManagementController::class, 'index']);
    Route::get('/master/merchants/{id}', [MasterMerchantManagementController::class, 'showProfile']);

    // 3. Store Plans
    Route::get('/master/store-plans', [MasterStorePlanController::class, 'index']);

    // 4. AI Subscriptions (6 packages)
    Route::get('/master/ai-plans', [MasterAiSubscriptionController::class, 'index']);

    // 5. AI Features Registry
    Route::get('/master/ai-features', [MasterAiFeatureRegistryController::class, 'index']);

    // 6. Credit Wallets & Transactions
    Route::get('/master/credits/wallets', [MasterCreditManagementController::class, 'index']);
    Route::get('/master/credits/transactions', [MasterCreditManagementController::class, 'transactions']);

    // 7. Payment Approvals
    Route::get('/master/payments', [MasterPaymentManagementController::class, 'index']);

    // 8. Page Visibility Registry
    Route::get('/master/pages', [MasterPageVisibilityController::class, 'index']);

    // 9. UI Components Registry
    Route::get('/master/components', [MasterUiComponentController::class, 'index']);

    // 10. Central Audit Logs
    Route::get('/master/audit-logs', [MasterAuditLogController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'role.can:stores.write'])->group(function () {
    // Global Settings Modification
    Route::patch('/master/control-center/global-settings', [MasterCentralControlController::class, 'updateGlobalSetting']);

    // Merchant Profile & Bulk Operations
    Route::patch('/master/merchants/{id}', [MasterMerchantManagementController::class, 'updateMerchant']);
    Route::post('/master/merchants/bulk-action', [MasterMerchantManagementController::class, 'bulkAction']);

    // Store Plan Modifications & Assignment
    Route::patch('/master/store-plans/{id}', [MasterStorePlanController::class, 'update']);
    Route::post('/master/store-plans/assign', [MasterStorePlanController::class, 'assignStorePlan']);

    // AI Plans Modifications & Assignment
    Route::patch('/master/ai-plans/{id}', [MasterAiSubscriptionController::class, 'updatePlan']);
    Route::post('/master/ai-plans/assign', [MasterAiSubscriptionController::class, 'assignSubscription']);
    Route::post('/master/ai-plans/{id}/toggle-status', [MasterAiSubscriptionController::class, 'toggleSubscriptionStatus']);

    // AI Feature Registry Overrides & Toggles
    Route::patch('/master/ai-features/{id}', [MasterAiFeatureRegistryController::class, 'updateGlobalFeature']);
    Route::post('/master/ai-features/override', [MasterAiFeatureRegistryController::class, 'setMerchantOverride']);
    Route::post('/master/ai-features/bulk-toggle', [MasterAiFeatureRegistryController::class, 'bulkToggleFeature']);
    Route::post('/master/ai-features/stores/{storeId}/reset', [MasterAiFeatureRegistryController::class, 'resetStoreOverrides']);

    // Credit Management Actions
    Route::post('/master/credits/adjust', [MasterCreditManagementController::class, 'adjustCredits']);
    Route::post('/master/credits/bulk-grant', [MasterCreditManagementController::class, 'bulkCreditGrant']);

    // Payment Approval Actions
    Route::post('/master/payments/{id}/approve', [MasterPaymentManagementController::class, 'approve']);
    Route::post('/master/payments/{id}/reject', [MasterPaymentManagementController::class, 'reject']);

    // Page Visibility Actions
    Route::patch('/master/pages/{id}/toggle-global', [MasterPageVisibilityController::class, 'toggleGlobal']);
    Route::post('/master/pages/override', [MasterPageVisibilityController::class, 'setStoreOverride']);
    Route::post('/master/pages/stores/{storeId}/reset', [MasterPageVisibilityController::class, 'resetStoreOverrides']);

    // UI Component Actions
    Route::patch('/master/components/{id}/toggle-global', [MasterUiComponentController::class, 'toggleGlobal']);
    Route::post('/master/components/override', [MasterUiComponentController::class, 'setStoreOverride']);
    Route::post('/master/components/stores/{storeId}/reset', [MasterUiComponentController::class, 'resetStoreOverrides']);
});


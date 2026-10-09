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

    Route::middleware('role.can:products.read')->group(function () {
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/categories/{id}', [CategoryController::class, 'show']);
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
    Route::middleware('role.can:orders.read')->get('/orders/{id}', [OrderController::class, 'show']);
    Route::middleware([
        'role.can:orders.write',
        'plan.feature:orders',
        'subscription.writable',
    ])->group(function () {
        Route::post('/orders', [OrderController::class, 'store']);
        Route::patch('/orders/{id}', [OrderController::class, 'update']);
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
    Route::get('/analytics/payments', [AnalyticsReportController::class, 'paymentReports']);
    Route::get('/analytics/shipping', [AnalyticsReportController::class, 'shippingReports']);
});

// Public Inbound Webhooks for official Payment Gateways and Couriers
Route::post('/webhooks/payments/{provider}', [WebhooksController::class, 'paymentWebhook']);
Route::post('/webhooks/couriers/{provider}', [WebhooksController::class, 'courierWebhook']);

// Public Dynamic Shipping Calculation for Storefront Checkout
Route::post('/storefront/shipping/calculate', [ShippingController::class, 'calculate']);
Route::post('/storefront/orders', [OrderController::class, 'storefrontStore']);

// Master Admin: Multi-Store Google Integration Ledger
Route::middleware(['auth:sanctum', 'role.can:stores.read'])->group(function () {
    Route::get('/master/google/integrations', [GoogleIntegrationController::class, 'masterStoreIntegrations']);
});



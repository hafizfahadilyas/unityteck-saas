<?php

namespace App\Services\Integration;

use App\Models\CourierConnection;
use App\Models\IntegrationHealthCheck;
use App\Models\PaymentGateway;
use App\Models\Shipment;
use App\Models\Store;
use App\Services\Courier\CourierManager;
use App\Services\Payment\PaymentManager;
use Illuminate\Support\Str;

class IntegrationHealthService
{
    public const VERSION = '1.0.0-phase1';

    /** @var list<string> */
    public const PAYMENT_PROVIDERS = [
        'moyasar', 'tamara', 'tabby', 'cod', 'bank_transfer',
        'stripe', 'paypal', 'hyperpay', 'tap',
    ];

    /** @var list<string> */
    public const SHIPPING_PROVIDERS = [
        'spl', 'smsa', 'aramex', 'dhl', 'fedex', 'ups',
        'redbox', 'aymakan', 'jt',
    ];

    /** @var list<string> */
    public const STUB_PAYMENTS = ['stripe', 'paypal', 'hyperpay', 'tap'];

    /** @var list<string> */
    public const UI_ONLY_SHIPPING = ['redbox', 'aymakan', 'jt'];

    public function __construct(
        private readonly IntegrationLogService $logs = new IntegrationLogService(),
    ) {}

    public function capabilities(string $category, string $provider): array
    {
        $provider = strtolower($provider);
        if ($category === 'payment') {
            if (in_array($provider, self::STUB_PAYMENTS, true)) {
                return [
                    'connection_test' => false,
                    'authentication' => false,
                    'payment_session' => false,
                    'verify' => false,
                    'refund' => false,
                    'webhook' => false,
                    'integration_mode' => 'stub',
                ];
            }
            if ($provider === 'cod' || $provider === 'bank_transfer') {
                return [
                    'connection_test' => true,
                    'authentication' => false,
                    'payment_session' => true,
                    'verify' => $provider === 'bank_transfer' ? 'manual_proof' : 'manual_remittance',
                    'refund' => 'manual',
                    'webhook' => false,
                    'integration_mode' => 'manual',
                ];
            }

            return [
                'connection_test' => true,
                'authentication' => true,
                'payment_session' => $provider !== 'tabby' || true,
                'verify' => true,
                'refund' => $provider === 'moyasar' || $provider === 'tamara',
                'webhook' => true,
                'integration_mode' => 'live_http',
            ];
        }

        if (in_array($provider, self::UI_ONLY_SHIPPING, true)) {
            return [
                'connection_test' => false,
                'rates' => 'local_method_only',
                'create_shipment' => false,
                'tracking' => false,
                'label' => false,
                'cancel' => false,
                'pickup' => false,
                'integration_mode' => 'ui_only',
            ];
        }

        return [
            'connection_test' => true,
            'rates' => 'local_zones_methods',
            'create_shipment' => true,
            'tracking' => true,
            'label' => 'if_provider_returns',
            'cancel' => false,
            'pickup' => false,
            'integration_mode' => 'live_http',
        ];
    }

    public function aggregate(?string $storeId = null): array
    {
        $stores = $storeId
            ? Store::query()->where('id', $storeId)->get()
            : Store::query()->orderBy('id')->get();

        $rows = [];
        foreach ($stores as $store) {
            $sid = (string) $store->id;
            foreach (self::PAYMENT_PROVIDERS as $provider) {
                $rows[] = $this->buildPaymentRow($sid, $provider, $store->name ?? $sid);
            }
            foreach (self::SHIPPING_PROVIDERS as $provider) {
                $rows[] = $this->buildShippingRow($sid, $provider, $store->name ?? $sid);
            }
        }

        return [
            'data' => $rows,
            'meta' => [
                'total' => count($rows),
                'integration_version' => self::VERSION,
                'generated_at' => now()->toIso8601String(),
            ],
        ];
    }

    public function buildPaymentRow(string $storeId, string $provider, string $storeName = ''): array
    {
        $gateway = PaymentGateway::query()->forStore($storeId)->where('provider', $provider)->first();
        $check = IntegrationHealthCheck::query()
            ->forStore($storeId)
            ->where('category', 'payment')
            ->where('provider', $provider)
            ->first();

        $caps = $this->capabilities('payment', $provider);
        $computed = $this->computePaymentStatuses($gateway, $check, $caps);

        return array_merge($computed, [
            'store_id' => $storeId,
            'store_name' => $storeName,
            'category' => 'payment',
            'provider' => $provider,
            'provider_name' => $this->providerLabel('payment', $provider),
            'is_enabled' => (bool) ($gateway?->is_enabled),
            'is_sandbox' => (bool) ($gateway?->is_sandbox ?? true),
            'has_credentials' => $this->paymentHasCredentials($gateway, $provider),
            'gateway_status' => $gateway?->status,
            'last_tested_at' => $gateway?->last_tested_at?->toIso8601String(),
            'supported_features' => $check?->supported_features ?? $caps,
            'integration_version' => $check?->integration_version ?? self::VERSION,
            'last_successful_test' => $check?->last_successful_test_at?->toIso8601String(),
            'last_failed_test' => $check?->last_failed_test_at?->toIso8601String(),
            'api_response_time_ms' => $check?->api_response_time_ms,
            'last_error_message' => $check?->last_error_message,
            'webhook_url' => url("/api/webhooks/payments/{$provider}?store_id={$storeId}"),
        ]);
    }

    public function buildShippingRow(string $storeId, string $provider, string $storeName = ''): array
    {
        $connection = CourierConnection::query()->forStore($storeId)->where('provider', $provider)->first();
        $check = IntegrationHealthCheck::query()
            ->forStore($storeId)
            ->where('category', 'shipping')
            ->where('provider', $provider)
            ->first();

        $caps = $this->capabilities('shipping', $provider);
        $computed = $this->computeShippingStatuses($connection, $check, $caps);

        return array_merge($computed, [
            'store_id' => $storeId,
            'store_name' => $storeName,
            'category' => 'shipping',
            'provider' => $provider,
            'provider_name' => $this->providerLabel('shipping', $provider),
            'is_enabled' => (bool) ($connection?->is_connected ?? false),
            'is_sandbox' => (bool) ($connection?->is_sandbox ?? true),
            'has_credentials' => !empty($connection?->api_key),
            'connection_db_status' => $connection?->status,
            'last_tested_at' => $connection?->last_tested_at?->toIso8601String(),
            'supported_features' => $check?->supported_features ?? $caps,
            'integration_version' => $check?->integration_version ?? self::VERSION,
            'last_successful_test' => $check?->last_successful_test_at?->toIso8601String(),
            'last_failed_test' => $check?->last_failed_test_at?->toIso8601String(),
            'api_response_time_ms' => $check?->api_response_time_ms,
            'last_error_message' => $check?->last_error_message,
            'webhook_url' => url("/api/webhooks/couriers/{$provider}?store_id={$storeId}"),
        ]);
    }

    /**
     * Run a non-destructive integration test. Never books live AWB or charges cards in Phase 1.
     */
    public function runTest(string $storeId, string $category, string $provider, string $testType, array $opts = []): array
    {
        $started = microtime(true);
        $requestAt = now();
        $provider = strtolower($provider);
        $category = strtolower($category);
        $testType = strtolower($testType);
        $allowLive = !empty($opts['allow_live']);

        if ($allowLive) {
            // Phase 1: still refuse destructive live booking/charges even with flag
            if (in_array($testType, ['shipment_create', 'payment_charge', 'refund'], true)) {
                return $this->finishTest($storeId, $category, $provider, $testType, $started, $requestAt, [
                    'success' => false,
                    'message' => 'Live destructive tests are disabled in Phase 1. Use non-destructive probes only.',
                    'overall_status' => 'requires_attention',
                    'destructive' => true,
                ]);
            }
        }

        if ($category === 'payment') {
            return $this->runPaymentTest($storeId, $provider, $testType, $started, $requestAt);
        }

        return $this->runShippingTest($storeId, $provider, $testType, $started, $requestAt);
    }

    public function runFullAudit(string $storeId): array
    {
        $results = [];
        foreach (self::PAYMENT_PROVIDERS as $provider) {
            $results[] = $this->runTest($storeId, 'payment', $provider, 'connection');
        }
        foreach (self::SHIPPING_PROVIDERS as $provider) {
            $results[] = $this->runTest($storeId, 'shipping', $provider, 'connection');
        }

        return [
            'store_id' => $storeId,
            'results' => $results,
            'summary' => [
                'total' => count($results),
                'passed' => count(array_filter($results, static fn ($r) => !empty($r['success']))),
                'failed' => count(array_filter($results, static fn ($r) => empty($r['success']))),
            ],
            'integration_version' => self::VERSION,
        ];
    }

    public function recordFromExistingTest(
        string $storeId,
        string $category,
        string $provider,
        array $result,
        ?int $durationMs = null
    ): IntegrationHealthCheck {
        $success = !empty($result['success']);
        $healthStatus = (string) ($result['health_status'] ?? ($success ? 'connected' : 'requires_attention'));
        $message = (string) ($result['message'] ?? '');
        $env = null;

        if ($category === 'payment') {
            $gw = PaymentGateway::query()->forStore($storeId)->where('provider', $provider)->first();
            $env = $gw?->is_sandbox ? 'sandbox' : 'production';
        } else {
            $cc = CourierConnection::query()->forStore($storeId)->where('provider', $provider)->first();
            $env = $cc?->is_sandbox ? 'sandbox' : 'production';
        }

        $this->logs->write([
            'store_id' => $storeId,
            'category' => $category,
            'provider' => $provider,
            'test_type' => 'connection',
            'environment' => $env,
            'duration_ms' => $durationMs,
            'success' => $success,
            'error_message' => $success ? null : $message,
            'meta' => ['health_status' => $healthStatus],
        ]);

        return $this->upsertCheck($storeId, $category, $provider, [
            'success' => $success,
            'message' => $message,
            'health_status' => $healthStatus,
            'duration_ms' => $durationMs,
            'environment' => $env,
            'test_type' => 'connection',
        ]);
    }

    private function runPaymentTest(
        string $storeId,
        string $provider,
        string $testType,
        float $started,
        $requestAt
    ): array {
        $caps = $this->capabilities('payment', $provider);
        $gateway = PaymentGateway::query()->forStore($storeId)->where('provider', $provider)->first();

        if (in_array($provider, self::STUB_PAYMENTS, true)) {
            return $this->finishTest($storeId, 'payment', $provider, $testType, $started, $requestAt, [
                'success' => false,
                'message' => "Provider {$provider} has incomplete backend (stub). Never mark Connected/Paid.",
                'overall_status' => 'incomplete_backend',
                'health_status' => empty($gateway?->secret_key ?? $gateway?->api_key)
                    ? 'credentials_missing'
                    : 'incomplete_backend',
                'integration_mode' => 'stub',
            ]);
        }

        if (!$gateway) {
            return $this->finishTest($storeId, 'payment', $provider, $testType, $started, $requestAt, [
                'success' => false,
                'message' => 'Payment gateway not configured for this store.',
                'overall_status' => 'not_configured',
                'health_status' => 'not_configured',
            ]);
        }

        if ($testType === 'webhook') {
            $hasSecret = !empty($gateway->webhook_secret);
            return $this->finishTest($storeId, 'payment', $provider, $testType, $started, $requestAt, [
                'success' => $hasSecret || in_array($provider, ['cod', 'bank_transfer'], true),
                'message' => $hasSecret
                    ? 'Webhook secret is configured. Endpoint: '.url("/api/webhooks/payments/{$provider}?store_id={$storeId}")
                    : (in_array($provider, ['cod', 'bank_transfer'], true)
                        ? 'Manual method — no provider webhook required.'
                        : 'Webhook secret missing. Signature verification will be skipped until configured.'),
                'overall_status' => $hasSecret || in_array($provider, ['cod', 'bank_transfer'], true)
                    ? 'connected'
                    : 'requires_attention',
                'webhook_status' => $hasSecret ? 'configured' : (in_array($provider, ['cod', 'bank_transfer'], true) ? 'not_applicable' : 'credentials_missing'),
                'environment' => $gateway->is_sandbox ? 'sandbox' : 'production',
            ]);
        }

        if ($testType === 'payment_session') {
            if (in_array($provider, ['cod', 'bank_transfer'], true)) {
                return $this->finishTest($storeId, 'payment', $provider, $testType, $started, $requestAt, [
                    'success' => true,
                    'message' => 'Manual payment method session is available (no card charge).',
                    'overall_status' => 'connected',
                    'environment' => $gateway->is_sandbox ? 'sandbox' : 'production',
                ]);
            }
            // Non-destructive: only testConnection proves auth; session create needs a real order
            return $this->finishTest($storeId, 'payment', $provider, $testType, $started, $requestAt, [
                'success' => false,
                'message' => 'Payment session test requires an existing order context. Use Test Authentication / Connection (non-destructive) instead. Live charges are disabled.',
                'overall_status' => 'requires_attention',
                'not_tested' => true,
                'environment' => $gateway->is_sandbox ? 'sandbox' : 'production',
            ]);
        }

        // connection | authentication → real testConnection
        try {
            $service = PaymentManager::resolve($provider);
            $result = $service->testConnection($gateway);
            $gateway->last_tested_at = now();
            $gateway->status = !empty($result['success']) ? 'connected' : 'error';
            $gateway->save();

            return $this->finishTest($storeId, 'payment', $provider, $testType, $started, $requestAt, [
                'success' => !empty($result['success']),
                'message' => (string) ($result['message'] ?? ''),
                'health_status' => (string) ($result['health_status'] ?? (!empty($result['success']) ? 'connected' : 'authentication_failed')),
                'overall_status' => !empty($result['success'])
                    ? ($gateway->is_sandbox ? 'sandbox_verified' : 'connected')
                    : ((string) ($result['health_status'] ?? 'authentication_failed')),
                'environment' => $gateway->is_sandbox ? 'sandbox' : 'production',
                'sandbox_verified' => !empty($result['success']) && $gateway->is_sandbox,
                'meta' => ['details' => $result['details'] ?? null],
            ]);
        } catch (\Throwable $e) {
            return $this->finishTest($storeId, 'payment', $provider, $testType, $started, $requestAt, [
                'success' => false,
                'message' => $e->getMessage(),
                'overall_status' => 'connection_failed',
                'environment' => $gateway->is_sandbox ? 'sandbox' : 'production',
            ]);
        }
    }

    private function runShippingTest(
        string $storeId,
        string $provider,
        string $testType,
        float $started,
        $requestAt
    ): array {
        $caps = $this->capabilities('shipping', $provider);

        if (in_array($provider, self::UI_ONLY_SHIPPING, true)) {
            return $this->finishTest($storeId, 'shipping', $provider, $testType, $started, $requestAt, [
                'success' => false,
                'message' => "Carrier {$provider} is UI/method branding only — no CourierManager API.",
                'overall_status' => 'incomplete_backend',
                'health_status' => 'incomplete_backend',
                'integration_mode' => 'ui_only',
            ]);
        }

        $connection = CourierConnection::query()->forStore($storeId)->where('provider', $provider)->first();
        if (!$connection) {
            return $this->finishTest($storeId, 'shipping', $provider, $testType, $started, $requestAt, [
                'success' => false,
                'message' => 'Courier connection not configured for this store.',
                'overall_status' => 'not_configured',
                'health_status' => 'not_configured',
            ]);
        }

        if ($testType === 'rates') {
            return $this->finishTest($storeId, 'shipping', $provider, $testType, $started, $requestAt, [
                'success' => true,
                'message' => 'Checkout rates use local shipping zones/methods (not live carrier quotes). Carrier ping is separate.',
                'overall_status' => 'partially_working',
                'environment' => $connection->is_sandbox ? 'sandbox' : 'production',
                'meta' => ['rate_source' => 'local_zones_methods'],
            ]);
        }

        if ($testType === 'shipment_create') {
            return $this->finishTest($storeId, 'shipping', $provider, $testType, $started, $requestAt, [
                'success' => false,
                'message' => 'Live shipment creation disabled in Phase 1 health tests (would book real AWB). Use merchant create-shipment with explicit intent.',
                'overall_status' => 'not_tested',
                'not_tested' => true,
                'destructive' => true,
                'environment' => $connection->is_sandbox ? 'sandbox' : 'production',
            ]);
        }

        if ($testType === 'tracking') {
            $shipment = Shipment::query()
                ->forStore($storeId)
                ->where('provider', $provider)
                ->whereNotNull('tracking_number')
                ->where('tracking_number', '!=', '')
                ->latest()
                ->first();

            if (!$shipment) {
                return $this->finishTest($storeId, 'shipping', $provider, $testType, $started, $requestAt, [
                    'success' => false,
                    'message' => 'No existing AWB for this store/provider — tracking NOT TESTED.',
                    'overall_status' => 'not_tested',
                    'not_tested' => true,
                    'environment' => $connection->is_sandbox ? 'sandbox' : 'production',
                ]);
            }

            try {
                $service = CourierManager::resolve($provider);
                $track = $service->trackShipment($connection, (string) $shipment->tracking_number);
                return $this->finishTest($storeId, 'shipping', $provider, $testType, $started, $requestAt, [
                    'success' => !empty($track['success']),
                    'message' => (string) ($track['message'] ?? ($track['success'] ? 'Tracking OK' : 'Tracking failed')),
                    'overall_status' => !empty($track['success']) ? 'connected' : 'requires_attention',
                    'shipment_id' => $shipment->id,
                    'environment' => $connection->is_sandbox ? 'sandbox' : 'production',
                    'meta' => ['tracking_number' => $shipment->tracking_number],
                ]);
            } catch (\Throwable $e) {
                return $this->finishTest($storeId, 'shipping', $provider, $testType, $started, $requestAt, [
                    'success' => false,
                    'message' => $e->getMessage(),
                    'overall_status' => 'connection_failed',
                    'environment' => $connection->is_sandbox ? 'sandbox' : 'production',
                ]);
            }
        }

        if ($testType === 'label') {
            $shipment = Shipment::query()
                ->forStore($storeId)
                ->where('provider', $provider)
                ->whereNotNull('label_url')
                ->where('label_url', '!=', '')
                ->latest()
                ->first();

            return $this->finishTest($storeId, 'shipping', $provider, $testType, $started, $requestAt, [
                'success' => (bool) $shipment,
                'message' => $shipment
                    ? 'Label URL present on existing shipment (not regenerated).'
                    : 'No label URL on file for this store/provider — NOT TESTED.',
                'overall_status' => $shipment ? 'connected' : 'not_tested',
                'not_tested' => !$shipment,
                'shipment_id' => $shipment?->id,
                'environment' => $connection->is_sandbox ? 'sandbox' : 'production',
            ]);
        }

        if ($testType === 'webhook') {
            return $this->finishTest($storeId, 'shipping', $provider, $testType, $started, $requestAt, [
                'success' => true,
                'message' => 'Courier webhook endpoint: '.url("/api/webhooks/couriers/{$provider}?store_id={$storeId}"),
                'overall_status' => 'connected',
                'webhook_status' => 'endpoint_ready',
                'environment' => $connection->is_sandbox ? 'sandbox' : 'production',
            ]);
        }

        // connection | authentication
        try {
            $service = CourierManager::resolve($provider);
            $result = $service->testConnection($connection);
            $connection->last_tested_at = now();
            if (!empty($result['success'])) {
                $connection->is_connected = true;
                $connection->status = 'connected';
            } else {
                $connection->status = 'error';
            }
            $connection->save();

            return $this->finishTest($storeId, 'shipping', $provider, $testType, $started, $requestAt, [
                'success' => !empty($result['success']),
                'message' => (string) ($result['message'] ?? ''),
                'health_status' => (string) ($result['health_status'] ?? (!empty($result['success']) ? 'connected' : 'authentication_failed')),
                'overall_status' => !empty($result['success'])
                    ? ($connection->is_sandbox ? 'sandbox_verified' : 'connected')
                    : ((string) ($result['health_status'] ?? 'authentication_failed')),
                'environment' => $connection->is_sandbox ? 'sandbox' : 'production',
                'sandbox_verified' => !empty($result['success']) && $connection->is_sandbox,
            ]);
        } catch (\Throwable $e) {
            return $this->finishTest($storeId, 'shipping', $provider, $testType, $started, $requestAt, [
                'success' => false,
                'message' => $e->getMessage(),
                'overall_status' => 'connection_failed',
                'environment' => $connection->is_sandbox ? 'sandbox' : 'production',
            ]);
        }
    }

    private function finishTest(
        string $storeId,
        string $category,
        string $provider,
        string $testType,
        float $started,
        $requestAt,
        array $result
    ): array {
        $durationMs = (int) round((microtime(true) - $started) * 1000);
        $success = !empty($result['success']);

        $this->logs->write([
            'store_id' => $storeId,
            'category' => $category,
            'provider' => $provider,
            'test_type' => $testType,
            'environment' => $result['environment'] ?? null,
            'request_at' => $requestAt,
            'response_at' => now(),
            'duration_ms' => $durationMs,
            'success' => $success,
            'error_message' => $success ? null : ($result['message'] ?? null),
            'transaction_id' => $result['transaction_id'] ?? null,
            'shipment_id' => $result['shipment_id'] ?? null,
            'meta' => $result['meta'] ?? null,
        ]);

        $check = $this->upsertCheck($storeId, $category, $provider, array_merge($result, [
            'duration_ms' => $durationMs,
            'test_type' => $testType,
        ]));

        return [
            'success' => $success,
            'store_id' => $storeId,
            'category' => $category,
            'provider' => $provider,
            'test_type' => $testType,
            'message' => $result['message'] ?? null,
            'overall_status' => $check->overall_status,
            'connection_status' => $check->connection_status,
            'auth_status' => $check->auth_status,
            'api_health_status' => $check->api_health_status,
            'sandbox_status' => $check->sandbox_status,
            'production_verification_status' => $check->production_verification_status,
            'webhook_status' => $check->webhook_status,
            'api_response_time_ms' => $durationMs,
            'last_error_message' => $check->last_error_message,
            'not_tested' => !empty($result['not_tested']),
            'integration_version' => self::VERSION,
        ];
    }

    private function upsertCheck(string $storeId, string $category, string $provider, array $result): IntegrationHealthCheck
    {
        $check = IntegrationHealthCheck::query()
            ->forStore($storeId)
            ->where('category', $category)
            ->where('provider', $provider)
            ->first();

        if (!$check) {
            $check = new IntegrationHealthCheck();
            $check->id = 'ihc_'.Str::lower(Str::random(16));
            $check->store_id = $storeId;
            $check->category = $category;
            $check->provider = $provider;
            $check->production_verification_status = 'not_tested';
        }

        $success = !empty($result['success']);
        $overall = (string) ($result['overall_status'] ?? ($success ? 'connected' : 'requires_attention'));
        $testType = (string) ($result['test_type'] ?? 'connection');
        $caps = $this->capabilities($category, $provider);

        $check->integration_version = self::VERSION;
        $check->supported_features = $caps;
        $check->environment = $result['environment'] ?? $check->environment;
        $check->api_response_time_ms = $result['duration_ms'] ?? $check->api_response_time_ms;
        $check->overall_status = $overall;

        if ($success) {
            $check->last_successful_test_at = now();
            $check->last_error_message = null;
        } else {
            $check->last_failed_test_at = now();
            $check->last_error_message = $this->logs->sanitizeMessage($result['message'] ?? null);
        }

        if (in_array($testType, ['connection', 'authentication'], true)) {
            $check->connection_status = $success ? ($overall === 'sandbox_verified' ? 'connected' : $overall) : $overall;
            $check->auth_status = $success ? 'connected' : $overall;
            $check->api_health_status = $success ? 'connected' : $overall;
            if (!empty($result['sandbox_verified'])) {
                $check->sandbox_status = 'sandbox_verified';
            } elseif ($success && ($result['environment'] ?? '') === 'production') {
                // Connected ≠ Production Verified
                $check->sandbox_status = 'not_applicable';
            }
        }

        if ($testType === 'webhook' && isset($result['webhook_status'])) {
            $check->webhook_status = (string) $result['webhook_status'];
        }

        // Never auto-set production_verified from a connection test
        if ($check->production_verification_status === null || $check->production_verification_status === '') {
            $check->production_verification_status = 'not_tested';
        }

        $check->save();

        return $check;
    }

    private function computePaymentStatuses(?PaymentGateway $gateway, ?IntegrationHealthCheck $check, array $caps): array
    {
        if (($caps['integration_mode'] ?? '') === 'stub') {
            $hasCreds = $this->paymentHasCredentials($gateway, $gateway?->provider ?? '');
            $status = !$gateway ? 'not_configured' : ($hasCreds ? 'incomplete_backend' : 'credentials_missing');

            return [
                'connection_status' => $status,
                'auth_status' => $status,
                'api_health_status' => $status,
                'sandbox_status' => 'not_configured',
                'production_verification_status' => 'not_tested',
                'webhook_status' => 'not_configured',
                'overall_status' => $status,
            ];
        }

        if (!$gateway) {
            return [
                'connection_status' => 'not_configured',
                'auth_status' => 'not_configured',
                'api_health_status' => 'not_configured',
                'sandbox_status' => 'not_configured',
                'production_verification_status' => 'not_tested',
                'webhook_status' => 'not_configured',
                'overall_status' => 'not_configured',
            ];
        }

        return [
            'connection_status' => $check?->connection_status
                ?? ($gateway->status === 'connected' ? 'connected' : ($gateway->status === 'error' ? 'requires_attention' : 'not_configured')),
            'auth_status' => $check?->auth_status ?? 'not_configured',
            'api_health_status' => $check?->api_health_status ?? 'not_configured',
            'sandbox_status' => $check?->sandbox_status
                ?? ($gateway->is_sandbox ? 'not_configured' : 'not_applicable'),
            'production_verification_status' => $check?->production_verification_status ?? 'not_tested',
            'webhook_status' => $check?->webhook_status
                ?? (!empty($gateway->webhook_secret) ? 'configured' : 'not_configured'),
            'overall_status' => $check?->overall_status
                ?? ($gateway->status === 'connected' ? 'connected' : 'not_configured'),
        ];
    }

    private function computeShippingStatuses(?CourierConnection $connection, ?IntegrationHealthCheck $check, array $caps): array
    {
        if (($caps['integration_mode'] ?? '') === 'ui_only') {
            return [
                'connection_status' => 'incomplete_backend',
                'auth_status' => 'incomplete_backend',
                'api_health_status' => 'incomplete_backend',
                'sandbox_status' => 'not_configured',
                'production_verification_status' => 'not_tested',
                'webhook_status' => 'not_configured',
                'overall_status' => 'incomplete_backend',
            ];
        }

        if (!$connection) {
            return [
                'connection_status' => 'not_configured',
                'auth_status' => 'not_configured',
                'api_health_status' => 'not_configured',
                'sandbox_status' => 'not_configured',
                'production_verification_status' => 'not_tested',
                'webhook_status' => 'not_configured',
                'overall_status' => 'not_configured',
            ];
        }

        return [
            'connection_status' => $check?->connection_status
                ?? ($connection->status === 'connected' ? 'connected' : ($connection->status === 'error' ? 'requires_attention' : 'not_configured')),
            'auth_status' => $check?->auth_status ?? 'not_configured',
            'api_health_status' => $check?->api_health_status ?? 'not_configured',
            'sandbox_status' => $check?->sandbox_status
                ?? ($connection->is_sandbox ? 'not_configured' : 'not_applicable'),
            'production_verification_status' => $check?->production_verification_status ?? 'not_tested',
            'webhook_status' => $check?->webhook_status ?? 'endpoint_ready',
            'overall_status' => $check?->overall_status
                ?? ($connection->status === 'connected' ? 'connected' : 'not_configured'),
        ];
    }

    private function paymentHasCredentials(?PaymentGateway $gateway, string $provider): bool
    {
        if (!$gateway) {
            return false;
        }
        if (in_array($provider, ['cod', 'bank_transfer'], true)) {
            return true;
        }

        return !empty($gateway->secret_key) || !empty($gateway->api_key) || !empty($gateway->public_key);
    }

    private function providerLabel(string $category, string $provider): string
    {
        $map = [
            'moyasar' => 'Moyasar',
            'tamara' => 'Tamara',
            'tabby' => 'Tabby',
            'cod' => 'Cash on Delivery',
            'bank_transfer' => 'Bank Transfer',
            'stripe' => 'Stripe',
            'paypal' => 'PayPal',
            'hyperpay' => 'HyperPay',
            'tap' => 'Tap',
            'spl' => 'Saudi Post (SPL)',
            'smsa' => 'SMSA',
            'aramex' => 'Aramex',
            'dhl' => 'DHL Express',
            'fedex' => 'FedEx',
            'ups' => 'UPS',
            'redbox' => 'RedBox',
            'aymakan' => 'AyMakan',
            'jt' => 'J&T Express',
        ];

        return $map[$provider] ?? ucfirst($provider);
    }
}

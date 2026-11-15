<?php

namespace App\Services;

use App\Models\CanvaOauthConnection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Official Canva Connect (REST) OAuth + designs/export.
 * Master Admin testing only — separate from in-app Design Studio.
 */
class CanvaConnectService
{
    public const OWNER_MASTER = 'master';

    public const SCOPES = [
        'design:content:read',
        'design:content:write',
        'design:meta:read',
    ];

    private const TOKEN_URL = 'https://api.canva.com/rest/v1/oauth/token';

    private const AUTH_URL = 'https://www.canva.com/api/oauth/authorize';

    private const API_BASE = 'https://api.canva.com/rest/v1';

    public function getClientId(): string
    {
        return trim((string) (config('services.canva.client_id') ?: ''));
    }

    public function getClientSecret(): string
    {
        return trim((string) (config('services.canva.client_secret') ?: ''));
    }

    public function getRedirectUri(?string $override = null): string
    {
        if (is_string($override) && trim($override) !== '') {
            return trim($override);
        }

        return trim((string) (config('services.canva.redirect_uri') ?: ''));
    }

    public function isConfigured(): bool
    {
        return $this->getClientId() !== '' && $this->getClientSecret() !== '';
    }

    public function tableReady(): bool
    {
        return Schema::hasTable('canva_oauth_connections');
    }

    /**
     * @return array{auth_url: string, state: string, redirect_uri: string, scopes: list<string>}
     */
    public function beginAuthorization(?string $redirectUri = null): array
    {
        $clientId = $this->getClientId();
        $redirect = $this->getRedirectUri($redirectUri);
        if ($clientId === '' || $this->getClientSecret() === '') {
            throw new \RuntimeException('CANVA_NOT_CONFIGURED');
        }
        if ($redirect === '') {
            throw new \RuntimeException('CANVA_REDIRECT_MISSING');
        }

        $verifier = Str::random(96);
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
        $state = Str::random(48);

        Cache::put($this->pkceCacheKey($state), [
            'verifier' => $verifier,
            'redirect_uri' => $redirect,
            'created_at' => time(),
        ], now()->addMinutes(15));

        $query = http_build_query([
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
            'scope' => implode(' ', self::SCOPES),
            'response_type' => 'code',
            'client_id' => $clientId,
            'state' => $state,
            'redirect_uri' => $redirect,
        ], '', '&', PHP_QUERY_RFC3986);

        return [
            'auth_url' => self::AUTH_URL.'?'.$query,
            'state' => $state,
            'redirect_uri' => $redirect,
            'scopes' => self::SCOPES,
        ];
    }

    /**
     * @return array{success: bool, message?: string, error?: string}
     */
    public function exchangeAuthorizationCode(string $code, string $state, ?string $redirectUri = null): array
    {
        $cached = Cache::pull($this->pkceCacheKey($state));
        if (! is_array($cached) || empty($cached['verifier'])) {
            return ['success' => false, 'error' => 'invalid_state', 'message' => 'OAuth state expired or invalid. Start Connect again.'];
        }

        $redirect = $redirectUri ?: ($cached['redirect_uri'] ?? $this->getRedirectUri());
        $basic = base64_encode($this->getClientId().':'.$this->getClientSecret());

        $response = Http::asForm()
            ->withHeaders(['Authorization' => 'Basic '.$basic])
            ->post(self::TOKEN_URL, [
                'grant_type' => 'authorization_code',
                'code_verifier' => $cached['verifier'],
                'code' => $code,
                'redirect_uri' => $redirect,
            ]);

        if (! $response->successful()) {
            return [
                'success' => false,
                'error' => 'token_exchange_failed',
                'message' => $response->json('message') ?: 'Canva token exchange failed.',
            ];
        }

        $json = $response->json();
        $access = is_array($json) ? ($json['access_token'] ?? null) : null;
        if (! is_string($access) || $access === '') {
            return ['success' => false, 'error' => 'missing_access_token', 'message' => 'Canva did not return an access token.'];
        }

        $this->persistTokens(
            self::OWNER_MASTER,
            $access,
            is_string($json['refresh_token'] ?? null) ? $json['refresh_token'] : null,
            (int) ($json['expires_in'] ?? 14400),
            is_string($json['scope'] ?? null) ? $json['scope'] : implode(' ', self::SCOPES),
        );

        return ['success' => true];
    }

    public function connectionStatus(string $ownerKey = self::OWNER_MASTER): array
    {
        $configured = $this->isConfigured();
        if (! $this->tableReady()) {
            return [
                'configured' => $configured,
                'connected' => false,
                'table_ready' => false,
                'display_name' => null,
                'scopes' => self::SCOPES,
                'message' => 'canva_oauth_connections table missing — run migration.',
            ];
        }

        $row = CanvaOauthConnection::query()->where('owner_key', $ownerKey)->first();
        $connected = (bool) ($row?->is_connected) && is_string($row?->access_token) && $row->access_token !== '';

        return [
            'configured' => $configured,
            'connected' => $connected,
            'table_ready' => true,
            'display_name' => $row?->display_name,
            'token_expires_at' => $row?->token_expires_at?->toIso8601String(),
            'scopes' => self::SCOPES,
            'granted_scopes' => $row?->granted_scopes,
            'last_error' => $row?->last_error,
            'client_id_set' => $this->getClientId() !== '',
            'redirect_uri' => $this->getRedirectUri() ?: null,
        ];
    }

    public function disconnect(string $ownerKey = self::OWNER_MASTER): void
    {
        if (! $this->tableReady()) {
            return;
        }
        $row = CanvaOauthConnection::query()->where('owner_key', $ownerKey)->first();
        if (! $row) {
            return;
        }
        $row->fill([
            'is_connected' => false,
            'access_token' => null,
            'refresh_token' => null,
            'token_expires_at' => null,
            'granted_scopes' => null,
            'display_name' => null,
            'last_error' => null,
        ])->save();
    }

    /**
     * @param  array{title?: string, width?: int, height?: int, preset?: string}  $opts
     * @return array{success: bool, design?: array<string, mixed>, message?: string, error?: string}
     */
    public function createDesign(array $opts = [], string $ownerKey = self::OWNER_MASTER): array
    {
        $token = $this->validAccessToken($ownerKey);
        if ($token === null) {
            return ['success' => false, 'error' => 'not_connected', 'message' => 'Canva is not connected.'];
        }

        $title = trim((string) ($opts['title'] ?? 'Souq Master Test'));
        if ($title === '') {
            $title = 'Souq Master Test';
        }

        $preset = trim((string) ($opts['preset'] ?? ''));
        $width = (int) ($opts['width'] ?? 1080);
        $height = (int) ($opts['height'] ?? 1080);

        if ($preset !== '') {
            $body = [
                'design_type' => [
                    'type' => 'preset',
                    'name' => $preset,
                ],
                'title' => $title,
            ];
        } else {
            $width = max(40, min(8000, $width));
            $height = max(40, min(8000, $height));
            if ($width * $height > 25000000) {
                $height = (int) floor(25000000 / $width);
            }
            $body = [
                'design_type' => [
                    'type' => 'custom',
                    'width' => $width,
                    'height' => $height,
                ],
                'title' => $title,
            ];
        }

        $response = Http::withToken($token)
            ->acceptJson()
            ->post(self::API_BASE.'/designs', $body);

        if (! $response->successful()) {
            $this->rememberError($ownerKey, $response->json('message') ?: 'Create design failed');

            return [
                'success' => false,
                'error' => $response->json('code') ?: 'create_failed',
                'message' => $response->json('message') ?: 'Create design failed.',
            ];
        }

        $design = $response->json('design');

        return [
            'success' => true,
            'design' => is_array($design) ? $design : $response->json(),
        ];
    }

    /**
     * @return array{success: bool, items?: list<array<string, mixed>>, message?: string, error?: string}
     */
    public function listDesigns(string $ownerKey = self::OWNER_MASTER, int $limit = 20): array
    {
        $token = $this->validAccessToken($ownerKey);
        if ($token === null) {
            return ['success' => false, 'error' => 'not_connected', 'message' => 'Canva is not connected.'];
        }

        $response = Http::withToken($token)
            ->acceptJson()
            ->get(self::API_BASE.'/designs', ['limit' => max(1, min(100, $limit))]);

        if (! $response->successful()) {
            return [
                'success' => false,
                'error' => $response->json('code') ?: 'list_failed',
                'message' => $response->json('message') ?: 'List designs failed.',
            ];
        }

        $items = $response->json('items');
        if (! is_array($items)) {
            $items = $response->json('designs');
        }

        return [
            'success' => true,
            'items' => is_array($items) ? array_values($items) : [],
            'continuation' => $response->json('continuation'),
        ];
    }

    /**
     * @return array{success: bool, job?: array<string, mixed>, urls?: list<string>, message?: string, error?: string}
     */
    public function exportDesignPng(string $designId, string $ownerKey = self::OWNER_MASTER): array
    {
        $token = $this->validAccessToken($ownerKey);
        if ($token === null) {
            return ['success' => false, 'error' => 'not_connected', 'message' => 'Canva is not connected.'];
        }

        $start = Http::withToken($token)
            ->acceptJson()
            ->post(self::API_BASE.'/exports', [
                'design_id' => $designId,
                'format' => [
                    'type' => 'png',
                ],
            ]);

        if (! $start->successful()) {
            return [
                'success' => false,
                'error' => $start->json('code') ?: 'export_start_failed',
                'message' => $start->json('message') ?: 'Export start failed.',
            ];
        }

        $job = $start->json('job');
        $exportId = is_array($job) ? ($job['id'] ?? null) : null;
        if (! is_string($exportId) || $exportId === '') {
            return ['success' => false, 'error' => 'missing_export_id', 'message' => 'Export job id missing.'];
        }

        for ($i = 0; $i < 20; $i++) {
            usleep(500000);
            $poll = Http::withToken($token)
                ->acceptJson()
                ->get(self::API_BASE.'/exports/'.$exportId);

            if (! $poll->successful()) {
                continue;
            }
            $pollJob = $poll->json('job');
            if (! is_array($pollJob)) {
                continue;
            }
            $status = (string) ($pollJob['status'] ?? '');
            if ($status === 'success') {
                $urls = $pollJob['urls'] ?? [];

                return [
                    'success' => true,
                    'job' => $pollJob,
                    'urls' => is_array($urls) ? array_values(array_filter($urls, 'is_string')) : [],
                ];
            }
            if ($status === 'failed') {
                return [
                    'success' => false,
                    'error' => 'export_failed',
                    'message' => (string) ($pollJob['error']['message'] ?? 'Export failed.'),
                    'job' => $pollJob,
                ];
            }
        }

        return ['success' => false, 'error' => 'export_timeout', 'message' => 'Export still running — try again shortly.'];
    }

    private function pkceCacheKey(string $state): string
    {
        return 'canva_oauth_pkce:'.$state;
    }

    private function persistTokens(
        string $ownerKey,
        string $accessToken,
        ?string $refreshToken,
        int $expiresIn,
        string $scopes,
    ): void {
        if (! $this->tableReady()) {
            throw new \RuntimeException('CANVA_TABLE_MISSING');
        }

        $row = CanvaOauthConnection::query()->firstOrNew(['owner_key' => $ownerKey]);
        if (! $row->exists) {
            $row->id = 'canva_'.Str::lower(Str::random(16));
            $row->owner_key = $ownerKey;
        }

        $row->fill([
            'is_connected' => true,
            'display_name' => 'Canva Connect',
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken ?: $row->refresh_token,
            'token_expires_at' => now()->addSeconds(max(60, $expiresIn - 60)),
            'granted_scopes' => $scopes,
            'last_error' => null,
        ])->save();
    }

    private function validAccessToken(string $ownerKey): ?string
    {
        if (! $this->tableReady()) {
            return null;
        }
        $row = CanvaOauthConnection::query()->where('owner_key', $ownerKey)->first();
        if (! $row || ! $row->is_connected || ! is_string($row->access_token) || $row->access_token === '') {
            return null;
        }

        if ($row->token_expires_at && $row->token_expires_at->isPast()) {
            if (is_string($row->refresh_token) && $row->refresh_token !== '') {
                $refreshed = $this->refreshAccessToken($row);
                if ($refreshed) {
                    return $row->fresh()?->access_token;
                }
            }

            $row->fill(['is_connected' => false, 'last_error' => 'token_expired'])->save();

            return null;
        }

        return $row->access_token;
    }

    private function refreshAccessToken(CanvaOauthConnection $row): bool
    {
        $basic = base64_encode($this->getClientId().':'.$this->getClientSecret());
        $response = Http::asForm()
            ->withHeaders(['Authorization' => 'Basic '.$basic])
            ->post(self::TOKEN_URL, [
                'grant_type' => 'refresh_token',
                'refresh_token' => $row->refresh_token,
            ]);

        if (! $response->successful()) {
            $row->fill([
                'is_connected' => false,
                'last_error' => $response->json('message') ?: 'refresh_failed',
            ])->save();

            return false;
        }

        $json = $response->json();
        $access = is_array($json) ? ($json['access_token'] ?? null) : null;
        if (! is_string($access) || $access === '') {
            return false;
        }

        $row->fill([
            'is_connected' => true,
            'access_token' => $access,
            'refresh_token' => is_string($json['refresh_token'] ?? null) ? $json['refresh_token'] : $row->refresh_token,
            'token_expires_at' => now()->addSeconds(max(60, (int) ($json['expires_in'] ?? 14400) - 60)),
            'granted_scopes' => is_string($json['scope'] ?? null) ? $json['scope'] : $row->granted_scopes,
            'last_error' => null,
        ])->save();

        return true;
    }

    private function rememberError(string $ownerKey, string $message): void
    {
        if (! $this->tableReady()) {
            return;
        }
        CanvaOauthConnection::query()
            ->where('owner_key', $ownerKey)
            ->update(['last_error' => Str::limit($message, 480)]);
    }
}

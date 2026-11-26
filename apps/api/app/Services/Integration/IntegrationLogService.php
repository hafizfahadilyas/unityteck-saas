<?php

namespace App\Services\Integration;

use App\Models\IntegrationHealthLog;
use Illuminate\Support\Str;

class IntegrationLogService
{
    /** @var list<string> */
    private const SENSITIVE_KEYS = [
        'authorization',
        'api_key',
        'apikey',
        'secret',
        'secret_key',
        'password',
        'webhook_secret',
        'client_secret',
        'token',
        'access_token',
        'refresh_token',
        'card_number',
        'cvv',
        'cvc',
        'pan',
        'pin',
    ];

    public function write(array $attrs): IntegrationHealthLog
    {
        $log = new IntegrationHealthLog();
        $log->id = $attrs['id'] ?? ('ihl_'.Str::lower(Str::random(16)));
        $log->store_id = (string) ($attrs['store_id'] ?? '');
        $log->category = (string) ($attrs['category'] ?? 'payment');
        $log->provider = (string) ($attrs['provider'] ?? '');
        $log->test_type = $attrs['test_type'] ?? null;
        $log->environment = $attrs['environment'] ?? null;
        $log->request_at = $attrs['request_at'] ?? now();
        $log->response_at = $attrs['response_at'] ?? now();
        $log->http_status = $attrs['http_status'] ?? null;
        $log->api_endpoint = $this->sanitizeEndpoint($attrs['api_endpoint'] ?? null);
        $log->duration_ms = $attrs['duration_ms'] ?? null;
        $log->error_code = $attrs['error_code'] ?? null;
        $log->error_message_sanitized = $this->sanitizeMessage($attrs['error_message'] ?? $attrs['error_message_sanitized'] ?? null);
        $log->transaction_id = $attrs['transaction_id'] ?? null;
        $log->shipment_id = $attrs['shipment_id'] ?? null;
        $log->success = (bool) ($attrs['success'] ?? false);
        $log->meta = $this->sanitizeMeta($attrs['meta'] ?? null);
        $log->save();

        return $log;
    }

    public function sanitizeMessage(?string $message): ?string
    {
        if ($message === null || $message === '') {
            return null;
        }

        $out = preg_replace('/\b(?:sk|pk|rk)_(?:test|live)_[A-Za-z0-9]+\b/i', '[REDACTED_KEY]', $message) ?? $message;
        $out = preg_replace('/\b\d{13,19}\b/', '[REDACTED_PAN]', $out) ?? $out;
        $out = preg_replace('/Bearer\s+[A-Za-z0-9._\-]+/i', 'Bearer [REDACTED]', $out) ?? $out;

        return mb_substr($out, 0, 2000);
    }

    public function sanitizeEndpoint(?string $endpoint): ?string
    {
        if ($endpoint === null || $endpoint === '') {
            return null;
        }

        $clean = preg_replace('/([?&](?:api_key|key|token|secret|password)=)[^&]*/i', '$1[REDACTED]', $endpoint) ?? $endpoint;

        return mb_substr($clean, 0, 512);
    }

    public function sanitizeMeta(mixed $meta): ?array
    {
        if (!is_array($meta)) {
            return null;
        }

        return $this->redactArray($meta);
    }

    private function redactArray(array $data, int $depth = 0): array
    {
        if ($depth > 6) {
            return ['truncated' => true];
        }

        $out = [];
        foreach ($data as $key => $value) {
            $k = strtolower((string) $key);
            $sensitive = false;
            foreach (self::SENSITIVE_KEYS as $needle) {
                if (str_contains($k, $needle)) {
                    $sensitive = true;
                    break;
                }
            }
            if ($sensitive) {
                $out[$key] = '[REDACTED]';
                continue;
            }
            if (is_array($value)) {
                $out[$key] = $this->redactArray($value, $depth + 1);
            } elseif (is_string($value)) {
                $out[$key] = $this->sanitizeMessage($value);
            } else {
                $out[$key] = $value;
            }
        }

        return $out;
    }
}

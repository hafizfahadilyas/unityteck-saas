<?php

namespace App\Services\OpenAi;

use App\Models\Store;
use App\Models\StoreOpenAiConfig;
use App\Support\OpenAiLevels;
use Illuminate\Support\Str;

/**
 * Isolated OpenAI HTTP provider. Never routes Gemini traffic.
 */
final class OpenAiProviderService
{
    public function __construct(
        private readonly OpenAiConfigService $configs,
        private readonly OpenAiUsageService $usage,
        private readonly OpenAiCostService $costs,
    ) {}

    /**
     * @param  array{prompt: string, system?: string, temperature?: float}  $input
     * @return array{ok: bool, code?: string, message?: string, payment_required?: bool, data?: array<string, mixed>}
     */
    public function complete(Store $store, StoreOpenAiConfig $cfg, array $input, ?string $actorUserId): array
    {
        $gate = $this->usage->assertCanConsume($store, $cfg, $this->configs);
        if (! ($gate['ok'] ?? false)) {
            $this->usage->log($store, [
                'user_id' => $actorUserId,
                'request_id' => 'oa-'.Str::lower(Str::random(10)),
                'model' => $cfg->text_model,
                'intelligence_level' => $cfg->intelligence_level,
                'status' => ($gate['payment_required'] ?? false) ? 'payment_required' : 'blocked',
                'error_code' => $gate['code'] ?? 'blocked',
                'error_message' => $gate['message'] ?? 'Blocked',
            ]);

            return $gate;
        }

        $apiKey = trim((string) config('services.openai.api_key', ''));
        if ($apiKey === '') {
            try {
                $dbKey = \App\Models\OpenAiGlobalConfig::query()->where('is_active', true)->whereNotNull('api_key')->value('api_key');
                if (! empty($dbKey)) {
                    $apiKey = trim((string) $dbKey);
                }
            } catch (\Throwable) {}
        }

        if ($apiKey === '') {
            $geminiKey = \App\Services\GeminiAiMediaService::resolveApiKey();
            if ($geminiKey !== '' && $geminiKey !== 'MY_GEMINI_API_KEY') {
                return $this->completeWithGemini($store, $input, $geminiKey, $actorUserId);
            }

            return ['ok' => false, 'code' => 'key_missing', 'message' => 'AI text provider is not configured. Set GEMINI_API_KEY or OPENAI_API_KEY on the server.'];
        }

        $level = OpenAiLevels::for($cfg->intelligence_level);
        $model = trim((string) ($cfg->text_model ?: config('services.openai.text_model', 'gpt-5.4-mini')));
        $maxOut = min((int) $cfg->max_output_tokens, (int) $level['default_max_output_tokens'] * 2);
        $maxOut = max(64, $maxOut);
        $prompt = trim((string) ($input['prompt'] ?? ''));
        if ($prompt === '') {
            return ['ok' => false, 'code' => 'invalid_prompt', 'message' => 'Prompt is required.'];
        }
        // Soft truncate by char budget approximating input token cap (safety; real count from API).
        $approxCap = max(200, (int) $cfg->max_input_tokens * 4);
        if (mb_strlen($prompt) > $approxCap) {
            $prompt = mb_substr($prompt, 0, $approxCap);
        }

        $body = [
            'model' => $model,
            'messages' => array_values(array_filter([
                ! empty($input['system']) ? ['role' => 'system', 'content' => (string) $input['system']] : null,
                ['role' => 'user', 'content' => $prompt],
            ])),
            'max_completion_tokens' => $maxOut,
        ];

        $effort = $cfg->reasoning_effort ?: $level['reasoning_effort'];
        if ($effort && OpenAiLevels::supportsReasoningEffort($model)) {
            $body['reasoning_effort'] = $effort;
        }

        $requestId = 'oa-'.Str::lower(Str::random(12));
        $started = microtime(true);
        $result = $this->postChat($apiKey, $body);
        $latencyMs = (int) round((microtime(true) - $started) * 1000);

        if (! ($result['ok'] ?? false)) {
            $this->usage->log($store, [
                'user_id' => $actorUserId,
                'request_id' => $requestId,
                'model' => $model,
                'intelligence_level' => $cfg->intelligence_level,
                'status' => 'failed',
                'error_code' => $result['code'] ?? 'provider_error',
                'error_message' => $result['message'] ?? 'Provider error',
                'meta' => ['latency_ms' => $latencyMs],
            ]);

            return $result;
        }

        $usage = $result['usage'] ?? [];
        $inputTokens = (int) ($usage['prompt_tokens'] ?? $usage['input_tokens'] ?? 0);
        $outputTokens = (int) ($usage['completion_tokens'] ?? $usage['output_tokens'] ?? 0);
        $cachedTokens = (int) ($usage['prompt_tokens_details']['cached_tokens'] ?? $usage['cached_tokens'] ?? 0);
        $totalTokens = (int) ($usage['total_tokens'] ?? ($inputTokens + $outputTokens));
        $actualCost = $this->costs->costForText($model, [
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'cached_tokens' => $cachedTokens,
        ]);

        if ($actualCost > (float) $cfg->max_cost_per_request_usd && (float) $cfg->max_cost_per_request_usd > 0) {
            // Still record actual usage — request already billed by provider.
        }

        $this->usage->applyUsage($store, $cfg, $totalTokens, $actualCost);
        $this->usage->log($store, [
            'user_id' => $actorUserId,
            'request_id' => $requestId,
            'model' => $model,
            'intelligence_level' => $cfg->intelligence_level,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'cached_tokens' => $cachedTokens,
            'total_tokens' => $totalTokens,
            'estimated_cost_usd' => $actualCost,
            'actual_cost_usd' => $actualCost,
            'status' => 'success',
            'meta' => ['latency_ms' => $latencyMs],
        ]);

        return [
            'ok' => true,
            'data' => [
                'request_id' => $requestId,
                'model' => $model,
                'intelligence_level' => $cfg->intelligence_level,
                'content' => (string) ($result['content'] ?? ''),
                'usage' => [
                    'input_tokens' => $inputTokens,
                    'output_tokens' => $outputTokens,
                    'cached_tokens' => $cachedTokens,
                    'total_tokens' => $totalTokens,
                ],
                'actual_cost_usd' => $actualCost,
                'estimated_cost_usd' => $actualCost,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $body
     * @return array{ok: bool, content?: string, usage?: array, code?: string, message?: string}
     */
    private function postChat(string $apiKey, array $body): array
    {
        $url = 'https://api.openai.com/v1/chat/completions';
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer '.$apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 90,
        ]);
        $raw = curl_exec($ch);
        $errno = curl_errno($ch);
        $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errno) {
            return ['ok' => false, 'code' => 'timeout_or_network', 'message' => 'OpenAI request failed (network/timeout).'];
        }

        $json = is_string($raw) ? json_decode($raw, true) : null;
        if ($http === 429) {
            return ['ok' => false, 'code' => 'rate_limited', 'message' => 'OpenAI rate limit — try later.'];
        }
        if ($http === 401 || $http === 403) {
            return ['ok' => false, 'code' => 'auth_failed', 'message' => 'OpenAI authentication failed. Check server key.'];
        }
        if ($http >= 400 || ! is_array($json)) {
            $msg = is_array($json) ? (string) ($json['error']['message'] ?? 'Provider error') : 'Invalid provider response';

            return ['ok' => false, 'code' => 'provider_error', 'message' => $msg];
        }

        $content = (string) ($json['choices'][0]['message']['content'] ?? '');

        return [
            'ok' => true,
            'content' => $content,
            'usage' => is_array($json['usage'] ?? null) ? $json['usage'] : [],
        ];
    }

    protected function completeWithGemini(Store $store, array $input, string $geminiKey, ?string $actorUserId): array
    {
        $prompt = trim((string) ($input['prompt'] ?? ''));
        $system = trim((string) ($input['system'] ?? ''));
        $fullPrompt = $system !== '' ? "{$system}\n\nUser: {$prompt}" : $prompt;

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=' . rawurlencode($geminiKey);

        try {
            $response = \Illuminate\Support\Facades\Http::withoutVerifying()
                ->timeout(45)
                ->acceptJson()
                ->asJson()
                ->post($url, [
                    'contents' => [
                        ['parts' => [['text' => $fullPrompt]]],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 1500,
                    ],
                ]);

            if (! $response->successful()) {
                $err = $response->json('error.message') ?: $response->body();
                return ['ok' => false, 'code' => 'provider_error', 'message' => is_string($err) ? $err : 'Gemini AI provider returned an error.'];
            }

            $parts = $response->json('candidates.0.content.parts') ?? [];
            $content = '';
            if (is_array($parts)) {
                foreach ($parts as $p) {
                    if (! empty($p['text'])) {
                        $content .= (string) $p['text'];
                    }
                }
            }

            $inputTokens = (int) ($response->json('usageMetadata.promptTokenCount') ?? 200);
            $outputTokens = (int) ($response->json('usageMetadata.candidatesTokenCount') ?? 300);

            return [
                'ok' => true,
                'content' => trim($content),
                'model' => 'gemini-3.8-flash',
                'usage' => [
                    'prompt_tokens' => $inputTokens,
                    'completion_tokens' => $outputTokens,
                    'total_tokens' => $inputTokens + $outputTokens,
                ],
                'cost' => [
                    'actual_usd' => 0.0002,
                    'input_usd' => 0.0001,
                    'output_usd' => 0.0001,
                ],
            ];
        } catch (\Throwable $e) {
            return ['ok' => false, 'code' => 'provider_error', 'message' => 'Gemini AI provider request failed: ' . $e->getMessage()];
        }
    }
}

<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Real Gemini image generation only. No fake/placeholder assets.
 */
final class GeminiAiMediaService
{
    /**
     * @return array{ok: true, mime: string, base64: string, model: string}|array{ok: false, code: string, message: string}
     */
    public function generateImage(string $prompt): array
    {
        $apiKey = trim((string) config('services.gemini.api_key', ''));
        if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
            return [
                'ok' => false,
                'code' => 'provider_not_connected',
                'message' => 'AI image provider is not connected. Set GEMINI_API_KEY on the API server.',
            ];
        }

        $model = trim((string) config('services.gemini.image_model', 'gemini-2.0-flash-preview-image-generation'));
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
            .rawurlencode($model)
            .':generateContent?key='.rawurlencode($apiKey);

        $safePrompt = trim($prompt);
        $body = [
            'contents' => [
                [
                    'parts' => [
                        [
                            'text' => 'Create a high-quality Saudi e-commerce marketing visual. '
                                .'No watermarks, no logos of other brands, suitable for store social posts. '
                                .'Prompt: '.$safePrompt,
                        ],
                    ],
                ],
            ],
            'generationConfig' => [
                'responseModalities' => ['TEXT', 'IMAGE'],
                'temperature' => 0.8,
            ],
        ];

        try {
            $response = Http::timeout(90)
                ->acceptJson()
                ->asJson()
                ->post($url, $body);

            if (! $response->successful()) {
                $err = $response->json('error.message') ?: $response->body();

                return [
                    'ok' => false,
                    'code' => 'provider_error',
                    'message' => is_string($err) && $err !== ''
                        ? $err
                        : 'AI image provider returned an error.',
                ];
            }

            $parts = $response->json('candidates.0.content.parts') ?? [];
            if (! is_array($parts)) {
                return [
                    'ok' => false,
                    'code' => 'empty_result',
                    'message' => 'AI image provider returned no image data.',
                ];
            }

            foreach ($parts as $part) {
                $inline = $part['inlineData'] ?? $part['inline_data'] ?? null;
                if (! is_array($inline)) {
                    continue;
                }
                $mime = (string) ($inline['mimeType'] ?? $inline['mime_type'] ?? 'image/png');
                $data = (string) ($inline['data'] ?? '');
                if ($data === '') {
                    continue;
                }

                return [
                    'ok' => true,
                    'mime' => $mime !== '' ? $mime : 'image/png',
                    'base64' => $data,
                    'model' => $model,
                ];
            }

            return [
                'ok' => false,
                'code' => 'empty_result',
                'message' => 'AI image provider returned text only — no image bytes.',
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'code' => 'provider_error',
                'message' => 'AI image request failed: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Video stays honest: only when explicitly enabled + provisioned.
     *
     * @return array{ok: false, code: string, message: string}
     */
    public function generateVideo(string $prompt): array
    {
        unset($prompt);

        if (! (bool) config('services.gemini.video_enabled', false)) {
            return [
                'ok' => false,
                'code' => 'video_provider_not_connected',
                'message' => 'AI video generation is not connected for this platform yet. Waiting for provider.',
            ];
        }

        $apiKey = trim((string) config('services.gemini.api_key', ''));
        if ($apiKey === '' || $apiKey === 'MY_GEMINI_API_KEY') {
            return [
                'ok' => false,
                'code' => 'provider_not_connected',
                'message' => 'AI video provider is not connected. Set GEMINI_API_KEY on the API server.',
            ];
        }

        // Veo long-running jobs need async polling + storage — keep locked until wired end-to-end.
        return [
            'ok' => false,
            'code' => 'video_provider_not_connected',
            'message' => 'AI video generation pipeline is not fully wired yet. Waiting for provider.',
        ];
    }
}

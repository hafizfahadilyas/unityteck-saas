<?php

namespace App\Services\Notification\Channels;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Meta WhatsApp Cloud API — real Graph send (no simulated delivery).
 */
class WhatsAppCloudChannel
{
    /**
     * @return array{status:string,provider:string,message_id:?string,error:?string,http_status:?int,preview:string}
     */
    public function send(string $toE164, string $body, array $creds, ?string $templateName = null): array
    {
        $preview = $body;
        $token = trim((string) ($creds['access_token'] ?? ''));
        $phoneNumberId = trim((string) ($creds['phone_number_id'] ?? ''));

        $isReal = $token !== ''
            && $phoneNumberId !== ''
            && !str_contains($token, '...')
            && !str_contains($phoneNumberId, '1234567890')
            && !str_contains($phoneNumberId, '109283746501928');

        if (!$isReal) {
            return [
                'status' => 'skipped',
                'provider' => 'whatsapp_cloud_api',
                'message_id' => null,
                'error' => 'WhatsApp Cloud API credentials missing. Set store WhatsApp settings or META_WHATSAPP_TOKEN / META_WHATSAPP_PHONE_NUMBER_ID.',
                'http_status' => null,
                'preview' => $preview,
            ];
        }

        $cleanPhone = preg_replace('/[^\d]/', '', $toE164) ?: '';
        $cleanPhone = preg_replace('/^00/', '', $cleanPhone);

        if ($cleanPhone === '') {
            return [
                'status' => 'failed',
                'provider' => 'whatsapp_cloud_api',
                'message_id' => null,
                'error' => 'Invalid recipient phone',
                'http_status' => null,
                'preview' => $preview,
            ];
        }

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $cleanPhone,
        ];

        // Optional Meta-approved template (required outside 24h customer-care window)
        if ($templateName) {
            $payload['type'] = 'template';
            $payload['template'] = [
                'name' => $templateName,
                'language' => ['code' => $creds['template_lang'] ?? 'ar'],
            ];
        } else {
            $payload['type'] = 'text';
            $payload['text'] = [
                'preview_url' => true,
                'body' => $body,
            ];
        }

        try {
            $url = 'https://graph.facebook.com/v19.0/' . $phoneNumberId . '/messages';
            $response = Http::withToken($token)->timeout(20)->post($url, $payload);
            $json = $response->json() ?? [];

            if ($response->successful()) {
                return [
                    'status' => 'sent',
                    'provider' => 'whatsapp_cloud_api',
                    'message_id' => $json['messages'][0]['id'] ?? null,
                    'error' => null,
                    'http_status' => $response->status(),
                    'preview' => $preview,
                ];
            }

            $err = $json['error']['message'] ?? ('HTTP ' . $response->status());
            Log::warning('WhatsApp Cloud send failed', ['error' => $err, 'to' => $cleanPhone]);

            return [
                'status' => 'failed',
                'provider' => 'whatsapp_cloud_api',
                'message_id' => null,
                'error' => $err,
                'http_status' => $response->status(),
                'preview' => $preview,
            ];
        } catch (\Throwable $e) {
            Log::warning('WhatsApp Cloud exception: ' . $e->getMessage());

            return [
                'status' => 'failed',
                'provider' => 'whatsapp_cloud_api',
                'message_id' => null,
                'error' => $e->getMessage(),
                'http_status' => null,
                'preview' => $preview,
            ];
        }
    }
}

<?php

namespace App\Services\Notification\Channels;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * KSA SMS gateways: Unifonic Cloud + Taqnyat — real HTTP only (no fake sent status).
 */
class SmsGatewayChannel
{
    /**
     * @return array{status:string,provider:string,message_id:?string,error:?string,http_status:?int,preview:string}
     */
    public function send(string $toE164, string $body, array $creds): array
    {
        $provider = strtolower((string) ($creds['provider'] ?? 'unifonic'));
        $preview = $body;

        if (str_contains($provider, 'taqnyat')) {
            return $this->sendTaqnyat($toE164, $body, $creds, $preview);
        }

        return $this->sendUnifonic($toE164, $body, $creds, $preview);
    }

    private function sendUnifonic(string $toE164, string $body, array $creds, string $preview): array
    {
        $appSid = trim((string) ($creds['app_sid'] ?? $creds['api_key'] ?? ''));
        $senderId = trim((string) ($creds['sender_id'] ?? ''));

        if ($appSid === '' || $senderId === '') {
            return [
                'status' => 'skipped',
                'provider' => 'unifonic',
                'message_id' => null,
                'error' => 'Unifonic credentials missing. Set UNIFONIC_APP_SID + UNIFONIC_SENDER_ID (or store SMS settings).',
                'http_status' => null,
                'preview' => $preview,
            ];
        }

        $recipient = preg_replace('/[^\d]/', '', $toE164) ?: '';
        $base = rtrim((string) ($creds['base_url'] ?? 'https://el.cloud.unifonic.com'), '/');

        try {
            $response = Http::asForm()
                ->timeout(20)
                ->post($base . '/rest/SMS/messages', [
                    'AppSid' => $appSid,
                    'Recipient' => $recipient,
                    'Body' => $body,
                    'SenderID' => $senderId,
                ]);

            $json = $response->json() ?? [];
            $success = $response->successful()
                && (
                    ($json['success'] ?? null) === 'true'
                    || ($json['success'] ?? null) === true
                    || isset($json['data']['MessageID'])
                    || isset($json['MessageID'])
                    || ($json['errorCode'] ?? 'ER-00') === 'ER-00'
                );

            if ($success) {
                $mid = (string) ($json['data']['MessageID'] ?? $json['MessageID'] ?? $json['data'][0]['MessageID'] ?? '');

                return [
                    'status' => 'sent',
                    'provider' => 'unifonic',
                    'message_id' => $mid !== '' ? $mid : null,
                    'error' => null,
                    'http_status' => $response->status(),
                    'preview' => $preview,
                ];
            }

            $err = $json['message'] ?? $json['errorCode'] ?? ('HTTP ' . $response->status());
            Log::warning('Unifonic SMS failed', ['error' => $err, 'to' => $recipient]);

            return [
                'status' => 'failed',
                'provider' => 'unifonic',
                'message_id' => null,
                'error' => is_string($err) ? $err : json_encode($err),
                'http_status' => $response->status(),
                'preview' => $preview,
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'failed',
                'provider' => 'unifonic',
                'message_id' => null,
                'error' => $e->getMessage(),
                'http_status' => null,
                'preview' => $preview,
            ];
        }
    }

    private function sendTaqnyat(string $toE164, string $body, array $creds, string $preview): array
    {
        $apiKey = trim((string) ($creds['api_key'] ?? $creds['bearer_token'] ?? ''));
        $sender = trim((string) ($creds['sender_id'] ?? ''));

        if ($apiKey === '' || $sender === '') {
            return [
                'status' => 'skipped',
                'provider' => 'taqnyat',
                'message_id' => null,
                'error' => 'Taqnyat credentials missing. Set TAQNYAT_API_KEY + TAQNYAT_SENDER_ID.',
                'http_status' => null,
                'preview' => $preview,
            ];
        }

        $recipient = (int) preg_replace('/[^\d]/', '', $toE164);

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(20)
                ->post('https://api.taqnyat.sa/v1/messages', [
                    'recipients' => [$recipient],
                    'body' => $body,
                    'sender' => $sender,
                ]);

            $json = $response->json() ?? [];
            if ($response->successful() && (($json['statusCode'] ?? 200) < 300 || isset($json['messageId']) || isset($json['data']))) {
                return [
                    'status' => 'sent',
                    'provider' => 'taqnyat',
                    'message_id' => isset($json['messageId']) ? (string) $json['messageId'] : (isset($json['data']['messageId']) ? (string) $json['data']['messageId'] : null),
                    'error' => null,
                    'http_status' => $response->status(),
                    'preview' => $preview,
                ];
            }

            $err = $json['message'] ?? $json['error'] ?? ('HTTP ' . $response->status());

            return [
                'status' => 'failed',
                'provider' => 'taqnyat',
                'message_id' => null,
                'error' => is_string($err) ? $err : json_encode($err),
                'http_status' => $response->status(),
                'preview' => $preview,
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'failed',
                'provider' => 'taqnyat',
                'message_id' => null,
                'error' => $e->getMessage(),
                'http_status' => null,
                'preview' => $preview,
            ];
        }
    }
}

<?php

namespace App\Services\Notification\Channels;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Per-store transactional email.
 * Prefers THIS store's SMTP; never borrows another store's mailbox.
 * Shared platform SMTP only when store explicitly has no own SMTP but opts into platform_mail.
 */
class EmailChannel
{
    /**
     * @param  array{address?:?string,name?:?string,smtp?:array,allow_platform_mail?:bool,store_id?:string}  $from
     * @return array{status:string,provider:string,message_id:?string,error:?string,http_status:?int,preview:string}
     */
    public function send(string $toEmail, string $subject, string $htmlBody, array $from = []): array
    {
        $preview = strip_tags($htmlBody);
        $storeId = (string) ($from['store_id'] ?? '');

        if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            return [
                'status' => 'failed',
                'provider' => 'email',
                'message_id' => null,
                'error' => 'Invalid recipient email',
                'http_status' => null,
                'preview' => $preview,
            ];
        }

        $smtp = is_array($from['smtp'] ?? null) ? $from['smtp'] : [];
        $storeSmtpReady = $this->isStoreSmtpReady($smtp);

        $mailerName = 'smtp';
        $providerLabel = 'email_smtp';

        if ($storeSmtpReady) {
            $mailerName = 'store_smtp_' . preg_replace('/[^a-zA-Z0-9_]/', '_', $storeId !== '' ? $storeId : 'tmp');
            Config::set("mail.mailers.{$mailerName}", [
                'transport' => 'smtp',
                'host' => $smtp['host'],
                'port' => (int) ($smtp['port'] ?? 465),
                'encryption' => $smtp['encryption'] ?? 'ssl',
                'username' => $smtp['username'],
                'password' => $smtp['password'],
                'timeout' => 20,
            ]);
            $providerLabel = 'email_store_smtp';
        } elseif (!empty($from['allow_platform_mail'])) {
            $mailerName = (string) config('mail.default', 'log');
            if (in_array($mailerName, ['log', 'array', ''], true)) {
                return $this->skipped($preview, 'email_none', 'This store has no SMTP and platform MAIL_MAILER is not production-ready.');
            }
            if ($mailerName === 'smtp') {
                $host = (string) config('mail.mailers.smtp.host');
                $user = (string) config('mail.mailers.smtp.username');
                if ($host === '' || $host === '127.0.0.1' || $user === '' || $user === 'null') {
                    return $this->skipped($preview, 'email_smtp', 'This store email is not connected (no store SMTP / platform SMTP incomplete).');
                }
            }
            $providerLabel = 'email_platform_' . $mailerName;
        } else {
            return $this->skipped(
                $preview,
                'email_disconnected',
                'This store has not connected email SMTP. Other stores’ email credentials are never used.'
            );
        }

        $fromAddress = $from['address']
            ?? ($smtp['from_address'] ?? null)
            ?? config('mail.from.address');
        $fromName = $from['name']
            ?? ($smtp['from_name'] ?? null)
            ?? config('mail.from.name', 'Store');

        if (!$fromAddress || !filter_var($fromAddress, FILTER_VALIDATE_EMAIL)) {
            return $this->skipped($preview, $providerLabel, 'Store From email address missing or invalid.');
        }

        try {
            Mail::mailer($mailerName)->html($htmlBody, function ($message) use ($toEmail, $subject, $fromAddress, $fromName) {
                $message->to($toEmail)
                    ->subject($subject)
                    ->from($fromAddress, $fromName);
            });

            return [
                'status' => 'sent',
                'provider' => $providerLabel,
                'message_id' => null,
                'error' => null,
                'http_status' => 250,
                'preview' => $preview,
            ];
        } catch (\Throwable $e) {
            Log::warning('Order email send failed', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'failed',
                'provider' => $providerLabel,
                'message_id' => null,
                'error' => $e->getMessage(),
                'http_status' => null,
                'preview' => $preview,
            ];
        }
    }

    private function isStoreSmtpReady(array $smtp): bool
    {
        $host = trim((string) ($smtp['host'] ?? ''));
        $user = trim((string) ($smtp['username'] ?? ''));
        $pass = (string) ($smtp['password'] ?? '');

        return $host !== ''
            && $host !== '127.0.0.1'
            && $user !== ''
            && $pass !== '';
    }

    private function skipped(string $preview, string $provider, string $error): array
    {
        return [
            'status' => 'skipped',
            'provider' => $provider,
            'message_id' => null,
            'error' => $error,
            'http_status' => null,
            'preview' => $preview,
        ];
    }
}

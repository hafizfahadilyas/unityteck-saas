<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Lifetime guard: bare "google" must NOT become Google Ads without paid signals.
 * Mirrors public/api/commerce.php souq_normalize_source rules (logic duplicated for unit isolation).
 */
final class TrafficSourceNormalizeTest extends TestCase
{
    private function normalize(?string $raw, ?array $ctx = null): string
    {
        $s = strtolower(trim((string) $raw));
        $medium = strtolower(trim((string) ($ctx['medium'] ?? '')));
        $details = strtolower(trim((string) ($ctx['details'] ?? $ctx['source_details'] ?? '')));
        $blob = $s.' '.$medium.' '.$details;
        $paidGoogle = str_contains($blob, 'gclid')
            || str_contains($blob, 'adwords')
            || $s === 'gads'
            || str_contains($s, 'google ads')
            || str_contains($s, 'googleads')
            || in_array($medium, ['cpc', 'ppc', 'paid', 'paidsearch', 'paidsocial'], true);

        if ($s === '' || $s === 'direct') {
            return 'Direct';
        }
        if (str_contains($s, 'whatsapp') || $s === 'wa') {
            return 'WhatsApp';
        }
        if (str_contains($s, 'instagram') || $s === 'ig') {
            return 'Instagram';
        }
        if (str_contains($s, 'tiktok') || $s === 'tt') {
            return 'TikTok';
        }
        if (str_contains($s, 'snap')) {
            return 'Snapchat';
        }
        if (str_contains($s, 'facebook') || $s === 'fb' || str_contains($s, 'meta')) {
            return 'Facebook';
        }
        if ($paidGoogle || $s === 'google ads') {
            return 'Google Ads';
        }
        if (str_contains($s, 'google') || str_contains($s, 'organic') || $s === 'search') {
            return 'Organic Search';
        }
        if (str_contains($s, 'referral') || str_contains($s, 'telegram') || str_contains($s, 'email') || str_contains($s, 'influencer') || str_contains($s, 'qr')) {
            return 'Referral';
        }

        return 'Referral';
    }

    public function test_direct_empty(): void
    {
        $this->assertSame('Direct', $this->normalize(''));
        $this->assertSame('Direct', $this->normalize('Direct'));
    }

    public function test_google_organic_not_ads(): void
    {
        $this->assertSame('Organic Search', $this->normalize('google'));
        $this->assertSame('Organic Search', $this->normalize('Google', ['medium' => 'organic']));
    }

    public function test_google_ads_with_paid_signal(): void
    {
        $this->assertSame('Google Ads', $this->normalize('google', ['medium' => 'cpc']));
        $this->assertSame('Google Ads', $this->normalize('google', ['details' => 'gclid=abc']));
        $this->assertSame('Google Ads', $this->normalize('Google Ads'));
    }

    public function test_social_channels(): void
    {
        $this->assertSame('WhatsApp', $this->normalize('whatsapp'));
        $this->assertSame('Instagram', $this->normalize('ig'));
        $this->assertSame('Facebook', $this->normalize('fb'));
    }
}

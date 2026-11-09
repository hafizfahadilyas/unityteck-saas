<?php

namespace App\Support;

/**
 * Merges merchant prompt with per-store brand identity for Gemini.
 * Never invents another store's colors or style.
 */
final class BrandConsistentPromptBuilder
{
    /** @var list<string> */
    public const PERSONAS = [
        'minimalist',
        'luxury',
        'vibrant',
        'eco',
        'modern',
        'traditional_saudi',
        'playful',
        'cinematic',
    ];

    /** @var list<string> */
    public const CAMPAIGN_PRESETS = [
        'none',
        'founding_day',
        'ramadan',
        'eid',
        'national_day',
        'black_friday',
        'white_friday',
        'back_to_school',
        'mothers_day',
        'seasonal_sale',
    ];

    /** Output template → aspect ratio */
    public const OUTPUT_TEMPLATES = [
        'product_square' => '1:1',
        'instagram_post' => '4:5',
        'instagram_story' => '9:16',
        'snapchat_story' => '9:16',
        'store_banner' => '16:9',
        'web_landscape' => '4:3',
        'catalog_portrait' => '3:4',
    ];

    public const LOGO_POSITIONS = [
        'top_start',
        'top_end',
        'bottom_start',
        'bottom_end',
    ];

    /**
     * @param  array{
     *   palette_hex?: list<string>|null,
     *   persona?: string|null,
     *   brand_lock?: bool,
     *   campaign_preset?: string|null,
     *   product_injection?: bool,
     *   match_perspective?: bool,
     *   accent_color?: string|null,
     * }  $brand
     */
    public static function build(string $userPrompt, array $brand = []): string
    {
        $prompt = trim($userPrompt);
        if ($prompt === '') {
            return $prompt;
        }

        $lock = (bool) ($brand['brand_lock'] ?? true);
        if (! $lock) {
            return $prompt;
        }

        $parts = [$prompt];

        $persona = self::resolvePersona($brand['persona'] ?? null);
        $parts[] = self::personaHint($persona);

        $colors = self::normalizePalette($brand['palette_hex'] ?? null);
        $accent = self::normalizeHex($brand['accent_color'] ?? null);
        if ($accent !== null && ! in_array($accent, $colors, true)) {
            array_unshift($colors, $accent);
        }
        if ($colors !== []) {
            $parts[] = 'dominant brand colors strictly: '.implode(' and ', array_slice($colors, 0, 5));
            $parts[] = 'apply these hex colors to backgrounds, decorative elements, and lighting color grade — do not invent off-brand hues';
        }

        $campaign = self::resolveCampaign($brand['campaign_preset'] ?? null);
        $campaignHint = self::campaignHint($campaign);
        if ($campaignHint !== '') {
            $parts[] = $campaignHint;
        }

        if (! empty($brand['product_injection'])) {
            $parts[] = 'keep the uploaded product photorealistic and unchanged in shape/logo/label; remove or replace only the background';
            if (! empty($brand['match_perspective'])) {
                $parts[] = 'match lighting, shadows, camera angle, and scale of the original product photo for a realistic composite';
            }
        }

        $parts[] = 'high quality commercial 4K look, Saudi e-commerce ready';

        return implode(', ', array_filter($parts, static fn ($p) => is_string($p) && trim($p) !== ''));
    }

    public static function resolvePersona(?string $persona): string
    {
        $p = strtolower(trim((string) $persona));

        return in_array($p, self::PERSONAS, true) ? $p : 'modern';
    }

    public static function resolveCampaign(?string $campaign): string
    {
        $c = strtolower(trim((string) $campaign));

        return in_array($c, self::CAMPAIGN_PRESETS, true) ? $c : 'none';
    }

    public static function resolveOutputTemplate(?string $template): ?string
    {
        $t = strtolower(trim((string) $template));
        if ($t === '' || ! isset(self::OUTPUT_TEMPLATES[$t])) {
            return null;
        }

        return $t;
    }

    public static function aspectForTemplate(?string $template): ?string
    {
        $t = self::resolveOutputTemplate($template);

        return $t ? self::OUTPUT_TEMPLATES[$t] : null;
    }

    public static function resolveLogoPosition(?string $position): string
    {
        $p = strtolower(trim((string) $position));

        return in_array($p, self::LOGO_POSITIONS, true) ? $p : 'bottom_end';
    }

    /**
     * @param  mixed  $raw
     * @return list<string>
     */
    public static function normalizePalette(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $item) {
            $hex = self::normalizeHex(is_string($item) ? $item : null);
            if ($hex !== null && ! in_array($hex, $out, true)) {
                $out[] = $hex;
            }
            if (count($out) >= 8) {
                break;
            }
        }

        return $out;
    }

    public static function normalizeHex(?string $hex): ?string
    {
        $h = strtoupper(trim((string) $hex));
        if ($h === '') {
            return null;
        }
        if (! str_starts_with($h, '#')) {
            $h = '#'.$h;
        }
        if (! preg_match('/^#[0-9A-F]{6}$/', $h) && ! preg_match('/^#[0-9A-F]{3}$/', $h)) {
            return null;
        }
        if (strlen($h) === 4) {
            $h = '#'.$h[1].$h[1].$h[2].$h[2].$h[3].$h[3];
        }

        return $h;
    }

    /**
     * @param  mixed  $raw
     * @return list<string>
     */
    public static function normalizeStyleRefs(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $url) {
            if (! is_string($url)) {
                continue;
            }
            $u = trim($url);
            if ($u === '' || (! str_starts_with($u, 'http') && ! str_starts_with($u, '/') && ! str_starts_with($u, 'data:'))) {
                continue;
            }
            if (! in_array($u, $out, true)) {
                $out[] = $u;
            }
            if (count($out) >= 15) {
                break;
            }
        }

        return $out;
    }

    private static function personaHint(string $persona): string
    {
        return match ($persona) {
            'minimalist' => 'minimalist and modern style, clean negative space',
            'luxury' => 'luxury cinematic lighting, premium refined aesthetic',
            'vibrant' => 'vibrant energetic color blocking, bold commercial energy',
            'eco' => 'eco-friendly natural materials, soft organic textures',
            'traditional_saudi' => 'Saudi heritage elegance, warm hospitality mood',
            'playful' => 'playful friendly lifestyle composition',
            'cinematic' => 'cinematic shallow depth of field, dramatic premium light',
            default => 'modern clean commercial brand style',
        };
    }

    private static function campaignHint(string $campaign): string
    {
        return match ($campaign) {
            'founding_day' => 'Saudi Founding Day campaign mood while preserving store brand colors',
            'ramadan' => 'Ramadan campaign atmosphere (crescent/lantern mood) while preserving store brand colors',
            'eid' => 'Eid celebration campaign mood while preserving store brand colors',
            'national_day' => 'Saudi National Day campaign mood while preserving store brand colors',
            'black_friday' => 'Black Friday promotional urgency while preserving store brand colors',
            'white_friday' => 'White Friday KSA sale campaign while preserving store brand colors',
            'back_to_school' => 'back-to-school campaign mood while preserving store brand colors',
            'mothers_day' => 'Mother\'s Day gift campaign mood while preserving store brand colors',
            'seasonal_sale' => 'seasonal sale promotional layout while preserving store brand colors',
            default => '',
        };
    }
}

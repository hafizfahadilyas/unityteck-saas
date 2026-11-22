<?php

namespace App\Support;

/**
 * Theme settings must not carry the store login email.
 * Master SuperAdmin owns that address outside this screen.
 * Custom CSS/font blobs stay store-scoped.
 */
class ThemeSettingsGuard
{
    private const LOGIN_KEYS = ['ownerEmail', 'owner_email', 'loginEmail', 'login_email'];

    /**
     * @param  array<mixed>  $settings
     * @param  string|null  $storeId
     * @return array<mixed>
     */
    public static function withoutLoginEmail(array $settings, ?string $storeId = null): array
    {
        $out = [];
        foreach ($settings as $key => $value) {
            if (is_string($key) && in_array($key, self::LOGIN_KEYS, true)) {
                continue;
            }
            if ($key === 'customCode' && is_array($value)) {
                $out[$key] = self::sanitizeCustomCode($value, $storeId);
                continue;
            }
            $out[$key] = is_array($value) ? self::withoutLoginEmail($value, $storeId) : $value;
        }

        return $out;
    }

    /**
     * @param  array<mixed>  $code
     * @return array<string, mixed>
     */
    private static function sanitizeCustomCode(array $code, ?string $storeId): array
    {
        $css = is_string($code['customCss'] ?? null) ? (string) $code['customCss'] : '';
        if ($storeId && $css !== '') {
            $css = self::scopeCss($css, $storeId);
        } else {
            $css = self::stripDangerousCss($css);
        }

        $fontFamily = is_string($code['customFontFamily'] ?? null)
            ? preg_replace('/[^a-zA-Z0-9\s\-_+]/', '', (string) $code['customFontFamily'])
            : '';
        $fontUrl = is_string($code['customFontUrl'] ?? null) ? trim((string) $code['customFontUrl']) : '';
        if ($fontUrl !== '' && ! preg_match('#^https?://#i', $fontUrl) && ! preg_match('#^/#', $fontUrl)) {
            // Treat non-URL as font family name if family empty
            if ($fontFamily === '') {
                $fontFamily = preg_replace('/[^a-zA-Z0-9\s\-_+]/', '', $fontUrl) ?? '';
            }
            $fontUrl = '';
        }

        return [
            'customCss' => $css,
            'enableCustomCss' => ($code['enableCustomCss'] ?? true) !== false,
            'customHeadJs' => '',
            'customFooterJs' => '',
            'enableHeadJs' => false,
            'enableFooterJs' => false,
            'customFontFamily' => is_string($fontFamily) ? trim($fontFamily) : '',
            'customFontUrl' => $fontUrl,
        ];
    }

    private static function stripDangerousCss(string $css): string
    {
        $css = preg_replace('/<\/style/i', '', $css) ?? $css;
        $css = preg_replace('/@import[^;]*;?/i', '', $css) ?? $css;
        $css = preg_replace('/expression\s*\(/i', '', $css) ?? $css;
        $css = preg_replace('/javascript\s*:/i', '', $css) ?? $css;

        return $css;
    }

    private static function scopeCss(string $css, string $storeId): string
    {
        $css = self::stripDangerousCss($css);
        $scoped = preg_replace_callback('/([^{}]+)\{([^{}]*)\}/', function (array $match) use ($storeId): string {
            $selector = trim($match[1]);
            if ($selector === '' || str_starts_with($selector, '@')) {
                return $selector.'{'.$match[2].'}';
            }
            $probe = str_replace('data-store-id', 'data-tenant', $selector);
            if (preg_match('/store-[a-z0-9-]+/i', $probe, $found) === 1 && $found[0] !== $storeId) {
                return '';
            }
            $prefix = '[data-store-id="'.$storeId.'"]';
            if (! str_contains($selector, $prefix)) {
                $selector = $prefix.' '.$selector;
            }

            return $selector.'{'.$match[2].'}';
        }, $css);

        return is_string($scoped) ? $scoped : '';
    }
}

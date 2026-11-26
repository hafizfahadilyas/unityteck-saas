<?php

namespace App\Support;

/**
 * Reject cross-host / leaky robots bodies so each store only advertises its own origin.
 */
final class RobotsTxtGuard
{
    /**
     * @return string Safe robots body for this host origin (always includes Sitemap for origin).
     */
    public static function sanitize(?string $custom, string $origin): string
    {
        $origin = rtrim(trim($origin), '/');
        $host = strtolower((string) parse_url($origin, PHP_URL_HOST));
        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }

        $custom = trim((string) $custom);
        if ($custom !== '' && ! self::isPoison($custom, $host)) {
            $body = $custom;
            if (! str_contains(strtolower($body), 'sitemap:')) {
                $body = rtrim($body)."\nSitemap: {$origin}/sitemap.xml\n";
            }

            return self::normalizeLineEndings($body);
        }

        return "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /master\nDisallow: /cart\nDisallow: /checkout\nSitemap: {$origin}/sitemap.xml\n";
    }

    public static function isPoison(string $body, string $ownHost): bool
    {
        $lower = strtolower($body);
        if (str_contains($lower, 'allow: /src') || str_contains($lower, 'allow: /src/')) {
            return true;
        }
        foreach (['bashayer-logistics', 'saudi-stores.com', 'store-coffee.saudi', 'store-bleco.saudi', 'store-flowers.saudi'] as $bad) {
            if (str_contains($lower, $bad)) {
                return true;
            }
        }
        if (preg_match_all('/sitemap:\s*(\S+)/i', $body, $m)) {
            foreach ($m[1] as $url) {
                $h = strtolower((string) parse_url(trim($url), PHP_URL_HOST));
                if ($h === '') {
                    continue;
                }
                if (str_starts_with($h, 'www.')) {
                    $h = substr($h, 4);
                }
                if ($ownHost !== '' && $h !== $ownHost) {
                    return true;
                }
            }
        }

        return false;
    }

    private static function normalizeLineEndings(string $body): string
    {
        $body = str_replace(["\r\n", "\r"], "\n", $body);

        return rtrim($body)."\n";
    }
}

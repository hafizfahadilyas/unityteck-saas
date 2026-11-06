<?php

namespace App\Support;

/**
 * Store-scoped layout gate for theme pages.
 * Strips scripts and foreign products. Free plan cannot store custom HTML or CSS.
 */
class ThemeLayoutGuard
{
    /**
     * @param  array<string, mixed>  $layout
     * @return array{layout: array<string, mixed>, warnings: list<string>, denied: bool, message: ?string}
     */
    public static function prepare(array $layout, string $storeId, bool $publishing, string $plan = 'pro', bool $cssAllowed = true): array
    {
        $warnings = [];
        $denied = false;
        $message = null;

        $json = json_encode($layout);
        if (! $cssAllowed && is_string($json) && str_contains($json, 'customCss')) {
            return [
                'layout' => $layout,
                'warnings' => [],
                'denied' => true,
                'message' => 'Custom CSS is turned off for this store.',
            ];
        }
        if (is_string($json) && self::hasCustomCode($layout) && ! self::planAllowsCode($plan)) {
            return [
                'layout' => $layout,
                'warnings' => [],
                'denied' => true,
                'message' => 'Custom HTML and CSS require a paid plan.',
            ];
        }

        $clean = self::walk($layout, $storeId, $publishing, $warnings);
        $h1 = self::countH1($clean);
        if ($publishing && $h1 !== 1) {
            $warnings[] = $h1 === 0 ? 'missing-h1' : 'multiple-h1';
            foreach (self::h1WidgetIds($clean) as $widgetId) {
                $warnings[] = 'h1:'.$widgetId;
            }
        }
        if ($publishing) {
            foreach (self::missingAltWidgetIds($clean) as $widgetId) {
                $warnings[] = 'missing-alt:'.$widgetId;
            }
        }

        return [
            'layout' => $clean,
            'warnings' => $warnings,
            'denied' => $denied,
            'message' => $message,
        ];
    }

    public static function planAllowsCode(string $plan): bool
    {
        return in_array(strtolower($plan), ['paid', 'pro', 'custom'], true);
    }

    /**
     * @param  array<string, mixed>  $layout
     */
    private static function hasCustomCode(array $layout): bool
    {
        $json = json_encode($layout) ?: '';

        return str_contains($json, 'customHtml') || str_contains($json, 'customCss');
    }

    /**
     * @param  array<mixed>  $node
     * @param  list<string>  $warnings
     * @return array<mixed>
     */
    private static function walk(array $node, string $storeId, bool $publishing, array &$warnings): array
    {
        if (isset($node['type']) && is_string($node['type'])) {
            $node = ThemeWidgetSanitizer::apply($node, $storeId, $publishing);
        }

        if (self::isHeadingWidget($node)) {
            $settings = is_array($node['settings'] ?? null) ? $node['settings'] : [];
            $tag = self::resolvedTag($node);
            $settings['tag'] = $tag;
            $settings['htmlTag'] = $tag;
            $settings['level'] = $tag;
            $node['settings'] = $settings;
            $node['tag'] = $tag;
        }

        $out = [];
        foreach ($node as $key => $value) {
            if ($key === 'ownerEmail' || $key === 'owner_email') {
                continue;
            }
            if ($key === 'type' && $value === 'banners') {
                continue;
            }
            if (is_string($value)) {
                if ($key === 'customHtml') {
                    $out[$key] = ThemeWidgetSanitizer::html($value);
                    continue;
                }
                if ($key === 'customCss' || $key === 'custom_css') {
                    $out[$key] = self::scopeCss($value, $storeId);
                    continue;
                }
                $out[$key] = self::stripScript($value);
                if ($key === 'image' && $value === '') {
                    $warnings[] = 'missing-image';
                }
                if (($key === 'alt' || $key === 'altEn' || $key === 'altAr') && trim($value) === '') {
                    $warnings[] = 'missing-alt';
                }
                continue;
            }
            if (is_array($value)) {
                if ($key === 'products' || $key === 'categories' || $key === 'reviews') {
                    $out[$key] = array_values(array_filter($value, function ($row) use ($storeId) {
                        if (! is_array($row)) {
                            return false;
                        }
                        $rowStore = $row['store_id'] ?? $row['storeId'] ?? null;

                        return ! is_string($rowStore) || $rowStore === '' || $rowStore === $storeId;
                    }));
                    continue;
                }
                if ($key === 'blocks' && self::isList($value)) {
                    $kept = [];
                    foreach ($value as $block) {
                        if (! is_array($block) || ($block['type'] ?? '') === 'banners') {
                            continue;
                        }
                        if ($publishing && (($block['visible'] ?? true) === false || self::isExpired($block) || ThemeWidgetSanitizer::isEmptyVideo($block))) {
                            continue;
                        }
                        $kept[] = self::walk($block, $storeId, $publishing, $warnings);
                    }
                    $out[$key] = $kept;
                    continue;
                }
                $out[$key] = self::walk($value, $storeId, $publishing, $warnings);
            } else {
                $out[$key] = $value;
            }
        }

        return $out;
    }

    /**
     * @param  array<mixed>  $node
     */
    /**
     * One count per heading widget. A bare `{tag: h1}` still counts once.
     *
     * @param  array<mixed>  $node
     */
    private static function countH1(array $node): int
    {
        if (self::isList($node)) {
            $count = 0;
            foreach ($node as $item) {
                if (is_array($item)) {
                    $count += self::countH1($item);
                }
            }

            return $count;
        }

        if (($node['visible'] ?? true) === false) {
            return 0;
        }

        $count = self::resolvedTag($node) === 'h1' && (self::isHeadingWidget($node) || array_key_exists('tag', $node))
            ? 1
            : 0;

        foreach ($node as $key => $value) {
            if (! is_array($value)) {
                continue;
            }
            if (self::isHeadingWidget($node) && $key === 'settings') {
                continue;
            }
            $count += self::countH1($value);
        }

        return $count;
    }

    /**
     * @param  array<mixed>  $node
     */
    private static function isHeadingWidget(array $node): bool
    {
        $type = $node['type'] ?? null;

        return $type === 'heading' || $type === 'w_heading';
    }

    /**
     * @param  array<mixed>  $node
     */
    private static function resolvedTag(array $node): string
    {
        $settings = is_array($node['settings'] ?? null) ? $node['settings'] : [];
        $raw = strtolower((string) ($settings['tag'] ?? $settings['htmlTag'] ?? $settings['level'] ?? $node['tag'] ?? ''));

        return in_array($raw, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], true) ? $raw : 'h2';
    }

    /**
     * @param  array<mixed>  $node
     * @return list<string>
     */
    private static function h1WidgetIds(array $node): array
    {
        $ids = [];
        if (self::isList($node)) {
            foreach ($node as $item) {
                if (is_array($item)) {
                    $ids = array_merge($ids, self::h1WidgetIds($item));
                }
            }

            return $ids;
        }
        if (self::resolvedTag($node) === 'h1' && is_string($node['id'] ?? null) && $node['id'] !== '') {
            $ids[] = $node['id'];
        }
        foreach ($node as $value) {
            if (is_array($value)) {
                $ids = array_merge($ids, self::h1WidgetIds($value));
            }
        }

        return $ids;
    }

    /**
     * @param  array<mixed>  $node
     * @return list<string>
     */
    private static function missingAltWidgetIds(array $node): array
    {
        $ids = [];
        if (self::isList($node)) {
            foreach ($node as $item) {
                if (is_array($item)) {
                    $ids = array_merge($ids, self::missingAltWidgetIds($item));
                }
            }

            return $ids;
        }
        $type = (string) ($node['type'] ?? '');
        $settings = is_array($node['settings'] ?? null) ? $node['settings'] : [];
        $alt = trim((string) ($settings['alt'] ?? $settings['altEn'] ?? $settings['altAr'] ?? ''));
        if (in_array($type, ['image', 'w_image', 'banner', 'offer_banner'], true) && $alt === '' && is_string($node['id'] ?? null) && $node['id'] !== '') {
            $ids[] = $node['id'];
        }
        foreach ($node as $value) {
            if (is_array($value)) {
                $ids = array_merge($ids, self::missingAltWidgetIds($value));
            }
        }

        return $ids;
    }

    /**
     * @param  array<string, mixed>  $block
     */
    private static function isExpired(array $block): bool
    {
        $ends = $block['endsAt'] ?? ($block['settings']['endsAt'] ?? null);
        if (! is_string($ends) || $ends === '') {
            return false;
        }
        $time = strtotime($ends);

        return $time !== false && $time < time();
    }

    private static function stripScript(string $value): string
    {
        $value = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $value) ?? $value;
        $value = preg_replace('/\s+on\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $value) ?? $value;
        $value = preg_replace('/javascript\s*:/i', '', $value) ?? $value;

        return $value;
    }

    private static function scopeCss(string $css, string $storeId): string
    {
        $css = preg_replace('/<\/style/i', '', $css) ?? $css;
        $css = preg_replace('/@import[^;]*;?/i', '', $css) ?? $css;
        $css = preg_replace('/expression\s*\(/i', '', $css) ?? $css;
        $css = preg_replace('/javascript\s*:/i', '', $css) ?? $css;
        $scoped = preg_replace_callback('/([^{}]+)\{([^{}]*)\}/', function (array $match) use ($storeId): string {
            $selector = trim($match[1]);
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

    /**
     * @param  array<mixed>  $value
     */
    private static function isList(array $value): bool
    {
        if ($value === []) {
            return true;
        }

        return array_keys($value) === range(0, count($value) - 1);
    }
}

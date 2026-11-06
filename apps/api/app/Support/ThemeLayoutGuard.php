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
    public static function prepare(array $layout, string $storeId, bool $publishing, string $plan = 'pro'): array
    {
        $warnings = [];
        $denied = false;
        $message = null;

        $json = json_encode($layout);
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
        if ($h1 !== 1) {
            $warnings[] = $h1 === 0 ? 'missing-h1' : 'multiple-h1';
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
        $out = [];
        foreach ($node as $key => $value) {
            if ($key === 'ownerEmail' || $key === 'owner_email') {
                continue;
            }
            if ($key === 'type' && $value === 'banners') {
                continue;
            }
            if (is_string($value)) {
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
                if ($key === 'products') {
                    $out[$key] = array_values(array_filter($value, function ($product) use ($storeId) {
                        if (! is_array($product)) {
                            return false;
                        }
                        $productStore = $product['store_id'] ?? $product['storeId'] ?? null;

                        return ! is_string($productStore) || $productStore === '' || $productStore === $storeId;
                    }));
                    continue;
                }
                if ($publishing && $key === 'blocks' && self::isList($value)) {
                    $kept = [];
                    foreach ($value as $block) {
                        if (! is_array($block)) {
                            continue;
                        }
                        if (($block['visible'] ?? true) === false) {
                            continue;
                        }
                        if (self::isExpired($block)) {
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
    private static function countH1(array $node): int
    {
        $count = 0;
        foreach ($node as $key => $value) {
            if ($key === 'tag' && $value === 'h1') {
                $count++;
            } elseif (is_array($value)) {
                $count += self::countH1($value);
            }
        }

        return $count;
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
        return preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $value) ?? $value;
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

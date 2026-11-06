<?php

namespace App\Support;

/**
 * Suggestions come only from the saved page for this store.
 * Nothing here writes products, categories, or the page row.
 */
final class ThemePageSuggest
{
    /**
     * @param  array<string, mixed>  $layout
     * @return array{en: string, ar: string}
     */
    public static function pageText(array $layout): array
    {
        $en = [];
        $ar = [];
        self::collect($layout, $en, $ar);

        return [
            'en' => self::clean(implode(' ', $en)),
            'ar' => self::clean(implode(' ', $ar)),
        ];
    }

    /**
     * @param  array<string, mixed>  $layout
     * @return array<string, mixed>
     */
    public static function seo(array $layout): array
    {
        $text = self::pageText($layout);

        return [
            'saved' => false,
            'faq' => [],
            'products' => [],
            'context' => $text,
            'suggestions' => [
                'seo_title_en' => self::clip($text['en'], 70),
                'seo_title_ar' => self::clip($text['ar'], 70),
                'seo_description_en' => self::clip($text['en'], 160),
                'seo_description_ar' => self::clip($text['ar'], 160),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $layout
     * @return array<string, mixed>
     */
    public static function heading(array $layout, string $widgetId, string $locale): array
    {
        $settings = self::settings($layout, $widgetId);
        $key = $locale === 'ar' ? 'textAr' : 'textEn';
        $raw = (string) ($settings[$key] ?? $settings[$locale === 'ar' ? 'titleAr' : 'titleEn'] ?? '');

        return [
            'saved' => false,
            'widget_id' => $widgetId,
            'locale' => $locale === 'ar' ? 'ar' : 'en',
            'suggestion' => self::clean($raw),
        ];
    }

    /**
     * Alt text is the file name plus the nearest saved heading. No product facts are added.
     *
     * @param  array<string, mixed>  $layout
     * @return array<string, mixed>
     */
    public static function alt(array $layout, string $fileName, string $widgetId = ''): array
    {
        $stem = self::clean(str_replace(['-', '_'], ' ', (string) pathinfo($fileName, PATHINFO_FILENAME)));
        $settings = $widgetId !== '' ? self::settings($layout, $widgetId) : [];
        $near = self::nearestHeading($layout, $widgetId);
        $en = self::clean(trim($stem.' '.(string) ($near['en'] ?: ($settings['textEn'] ?? ''))));
        $arHeading = (string) ($near['ar'] ?: ($settings['textAr'] ?? ''));
        $ar = $arHeading !== '' ? self::clean(trim($stem.' '.$arHeading)) : $stem;

        return [
            'saved' => false,
            'alt_en' => $en,
            'alt_ar' => $ar,
            'products' => [],
        ];
    }

    /**
     * The opposite field is the merchant's saved sibling. An empty sibling stays empty.
     *
     * @param  array<string, mixed>  $layout
     * @return array<string, mixed>
     */
    public static function translate(array $layout, string $widgetId, string $from, bool $confirm): array
    {
        $settings = self::settings($layout, $widgetId);
        $sourceKey = $from === 'ar' ? 'textAr' : 'textEn';
        $targetKey = $from === 'ar' ? 'textEn' : 'textAr';
        $source = (string) ($settings[$sourceKey] ?? '');
        if (! $confirm) {
            return [
                'saved' => false,
                'confirmed' => false,
                'source' => $source,
                'target' => null,
                'target_key' => $targetKey,
            ];
        }
        $sibling = trim((string) ($settings[$targetKey] ?? ''));

        return [
            'saved' => false,
            'confirmed' => true,
            'source' => $source,
            'target' => $sibling,
            'target_key' => $targetKey,
        ];
    }

    /**
     * @param  array<string, mixed>  $seo
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    public static function chosenSeo(array $seo, array $fields): array
    {
        $next = $seo;
        foreach (ThemePageSeo::KEYS as $key) {
            if (array_key_exists($key, $fields) && is_string($fields[$key])) {
                $next[$key] = $fields[$key];
            }
        }

        return $next;
    }

    /**
     * @param  array<string, mixed>  $layout
     * @param  array<string, mixed>  $fields
     * @return array<string, mixed>
     */
    public static function chosenHeading(array $layout, string $widgetId, array $fields): array
    {
        $allowed = [];
        foreach (['textEn', 'textAr', 'altEn', 'altAr'] as $key) {
            if (array_key_exists($key, $fields) && is_string($fields[$key])) {
                $allowed[$key] = $fields[$key];
            }
        }
        if ($allowed === [] || $widgetId === '') {
            return $layout;
        }

        return self::patch($layout, $widgetId, $allowed);
    }

    /**
     * @param  array<mixed>  $node
     * @param  list<string>  $en
     * @param  list<string>  $ar
     */
    private static function collect(array $node, array &$en, array &$ar): void
    {
        if (self::isList($node)) {
            foreach ($node as $item) {
                if (is_array($item)) {
                    self::collect($item, $en, $ar);
                }
            }

            return;
        }
        $settings = is_array($node['settings'] ?? null) ? $node['settings'] : [];
        foreach (['textEn', 'titleEn', 'htmlEn', 'labelEn'] as $key) {
            if (is_string($settings[$key] ?? null) && trim($settings[$key]) !== '') {
                $en[] = trim(strip_tags($settings[$key]));
            }
        }
        foreach (['textAr', 'titleAr', 'htmlAr', 'labelAr'] as $key) {
            if (is_string($settings[$key] ?? null) && trim($settings[$key]) !== '') {
                $ar[] = trim(strip_tags($settings[$key]));
            }
        }
        foreach ($node as $key => $value) {
            if ($key === 'settings' || ! is_array($value)) {
                continue;
            }
            self::collect($value, $en, $ar);
        }
    }

    /**
     * @param  array<string, mixed>  $layout
     * @return array<string, mixed>
     */
    private static function settings(array $layout, string $widgetId): array
    {
        $found = self::find($layout, $widgetId);

        return is_array($found['settings'] ?? null) ? $found['settings'] : [];
    }

    /**
     * @param  array<mixed>  $node
     * @return array<string, mixed>
     */
    private static function find(array $node, string $widgetId): array
    {
        if (self::isList($node)) {
            foreach ($node as $item) {
                if (is_array($item)) {
                    $found = self::find($item, $widgetId);
                    if ($found !== []) {
                        return $found;
                    }
                }
            }

            return [];
        }
        if (($node['id'] ?? null) === $widgetId) {
            return $node;
        }
        foreach ($node as $value) {
            if (is_array($value)) {
                $found = self::find($value, $widgetId);
                if ($found !== []) {
                    return $found;
                }
            }
        }

        return [];
    }

    /**
     * @param  array<string, mixed>  $layout
     * @return array{en: string, ar: string}
     */
    private static function nearestHeading(array $layout, string $widgetId): array
    {
        $headings = [];
        self::headings($layout, $headings);
        if ($headings === []) {
            return ['en' => '', 'ar' => ''];
        }
        $pick = $headings[0];
        foreach ($headings as $heading) {
            if ($heading['id'] === $widgetId) {
                $pick = $heading;
                break;
            }
        }

        return ['en' => $pick['en'], 'ar' => $pick['ar']];
    }

    /**
     * @param  array<mixed>  $node
     * @param  list<array{id: string, en: string, ar: string}>  $headings
     */
    private static function headings(array $node, array &$headings): void
    {
        if (self::isList($node)) {
            foreach ($node as $item) {
                if (is_array($item)) {
                    self::headings($item, $headings);
                }
            }

            return;
        }
        $type = $node['type'] ?? '';
        if ($type === 'heading' || $type === 'w_heading') {
            $settings = is_array($node['settings'] ?? null) ? $node['settings'] : [];
            $headings[] = [
                'id' => (string) ($node['id'] ?? ''),
                'en' => self::clean((string) ($settings['textEn'] ?? $settings['titleEn'] ?? '')),
                'ar' => self::clean((string) ($settings['textAr'] ?? $settings['titleAr'] ?? '')),
            ];
        }
        foreach ($node as $key => $value) {
            if ($key === 'settings' || ! is_array($value)) {
                continue;
            }
            self::headings($value, $headings);
        }
    }

    /**
     * @param  array<mixed>  $node
     * @param  array<string, string>  $fields
     * @return array<mixed>
     */
    private static function patch(array $node, string $widgetId, array $fields): array
    {
        if (self::isList($node)) {
            return array_map(function ($item) use ($widgetId, $fields) {
                return is_array($item) ? self::patch($item, $widgetId, $fields) : $item;
            }, $node);
        }
        if (($node['id'] ?? null) === $widgetId) {
            $settings = is_array($node['settings'] ?? null) ? $node['settings'] : [];
            $node['settings'] = array_merge($settings, $fields);

            return $node;
        }
        foreach ($node as $key => $value) {
            if (is_array($value)) {
                $node[$key] = self::patch($value, $widgetId, $fields);
            }
        }

        return $node;
    }

    private static function clean(string $value): string
    {
        $value = trim(strip_tags($value));
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return trim($value);
    }

    private static function clip(string $value, int $limit): string
    {
        if ($value === '') {
            return '';
        }
        if (mb_strlen($value) <= $limit) {
            return $value;
        }

        return rtrim(mb_substr($value, 0, $limit));
    }

    /** @param  array<mixed>  $value */
    private static function isList(array $value): bool
    {
        if ($value === []) {
            return true;
        }

        return array_keys($value) === range(0, count($value) - 1);
    }
}

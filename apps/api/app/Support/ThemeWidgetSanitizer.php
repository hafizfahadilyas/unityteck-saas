<?php

namespace App\Support;

/**
 * Store-scoped widget cleanup for theme page layouts.
 * Rich text is allowlisted. Commerce rows from another store are dropped by the caller.
 */
class ThemeWidgetSanitizer
{
    /**
     * @param  array<string, mixed>  $node
     * @return array<string, mixed>
     */
    public static function apply(array $node, string $storeId, bool $publishing): array
    {
        $type = (string) ($node['type'] ?? '');
        $settings = is_array($node['settings'] ?? null) ? $node['settings'] : [];

        if (self::isRichText($type)) {
            foreach (['html', 'htmlEn', 'htmlAr', 'contentEn', 'contentAr', 'textEn', 'textAr'] as $key) {
                if (isset($settings[$key]) && is_string($settings[$key])) {
                    $settings[$key] = self::html($settings[$key]);
                }
            }
        }

        if (self::isImage($type)) {
            $src = (string) ($settings['src'] ?? $settings['image'] ?? $settings['imageUrl'] ?? '');
            $settings['src'] = $src;
            $settings['image'] = $src;
            $settings['mobileSrc'] = (string) ($settings['mobileSrc'] ?? $settings['mobileImage'] ?? '');
            $settings['altEn'] = (string) ($settings['altEn'] ?? '');
            $settings['altAr'] = (string) ($settings['altAr'] ?? '');
            $settings['link'] = self::safeLink((string) ($settings['link'] ?? ''), $storeId);
            $settings['radius'] = (int) ($settings['radius'] ?? 0);
        }

        if (self::isButton($type)) {
            $link = self::safeLink((string) ($settings['buttonUrl'] ?? $settings['href'] ?? $settings['link'] ?? ''), $storeId);
            $settings['buttonUrl'] = $link;
            $settings['link'] = $link;
            $settings['rel'] = self::relFor($link);
            $settings['labelEn'] = (string) ($settings['labelEn'] ?? $settings['buttonTextEn'] ?? '');
            $settings['labelAr'] = (string) ($settings['labelAr'] ?? $settings['buttonTextAr'] ?? '');
        }

        if (self::isSlider($type)) {
            $raw = $settings['slides'] ?? ($settings['heroBanners']['banners'] ?? []);
            $banners = [];
            if (is_array($raw)) {
                foreach ($raw as $slide) {
                    if (! is_array($slide)) {
                        continue;
                    }
                    $banners[] = [
                        'id' => (string) ($slide['id'] ?? ''),
                        'image' => (string) ($slide['image'] ?? ''),
                        'mobileImage' => (string) ($slide['mobileImage'] ?? ''),
                        'titleEn' => (string) ($slide['titleEn'] ?? $slide['headingEn'] ?? ''),
                        'titleAr' => (string) ($slide['titleAr'] ?? $slide['headingAr'] ?? ''),
                        'descriptionEn' => (string) ($slide['descriptionEn'] ?? $slide['textEn'] ?? ''),
                        'descriptionAr' => (string) ($slide['descriptionAr'] ?? $slide['textAr'] ?? ''),
                        'buyNowEn' => (string) ($slide['buyNowEn'] ?? $slide['buttonEn'] ?? ''),
                        'buyNowAr' => (string) ($slide['buyNowAr'] ?? $slide['buttonAr'] ?? ''),
                        'learnMoreUrl' => self::safeLink((string) ($slide['learnMoreUrl'] ?? $slide['link'] ?? ''), $storeId),
                        'overlay' => (string) ($slide['overlay'] ?? ''),
                        'enabled' => ($slide['enabled'] ?? true) !== false,
                    ];
                }
            }
            $settings['slides'] = $banners;
            $settings['heroBanners'] = [
                'enabled' => $banners !== [],
                'autoplay' => (bool) ($settings['autoplay'] ?? ($settings['heroBanners']['autoplay'] ?? false)),
                'banners' => $banners,
            ];
        }

        if (self::isProducts($type)) {
            $source = (string) ($settings['source'] ?? 'latest');
            if (! in_array($source, ['featured', 'category', 'latest', 'on_sale', 'manual'], true)) {
                $source = 'latest';
            }
            $settings['source'] = $source;
            $settings['limit'] = max(1, min(48, (int) ($settings['limit'] ?? 8)));
            $columns = is_array($settings['columns'] ?? null) ? $settings['columns'] : [];
            $settings['columns'] = [
                'desktop' => (int) ($columns['desktop'] ?? 4),
                'tablet' => (int) ($columns['tablet'] ?? 2),
                'mobile' => (int) ($columns['mobile'] ?? 1),
            ];
        }

        if ($type === 'faq') {
            $items = is_array($settings['items'] ?? null) ? $settings['items'] : [];
            $visible = [];
            foreach ($items as $item) {
                if (! is_array($item) || ($item['visible'] ?? true) === false) {
                    continue;
                }
                $visible[] = [
                    'qEn' => (string) ($item['qEn'] ?? ''),
                    'qAr' => (string) ($item['qAr'] ?? ''),
                    'aEn' => (string) ($item['aEn'] ?? ''),
                    'aAr' => (string) ($item['aAr'] ?? ''),
                    'visible' => true,
                ];
            }
            if ($publishing) {
                $settings['items'] = $visible;
                $settings['jsonLd'] = $visible === [] ? null : [
                    '@type' => 'FAQPage',
                    'mainEntity' => array_map(fn (array $item) => [
                        '@type' => 'Question',
                        'name' => $item['qEn'],
                        'acceptedAnswer' => ['@type' => 'Answer', 'text' => $item['aEn']],
                    ], $visible),
                ];
            }
        }

        $node['settings'] = $settings;

        return $node;
    }

    public static function html(string $value): string
    {
        $value = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $value) ?? $value;
        $value = preg_replace('/\s+on\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $value) ?? $value;
        $value = preg_replace('/javascript\s*:/i', '', $value) ?? $value;

        return strip_tags($value, '<p><br><strong><b><em><i><u><ul><ol><li><a><h2><h3><h4><blockquote>');
    }

    public static function safeLink(string $url, string $storeId): string
    {
        if (preg_match('/(?:store_id=|\/stores\/)([^&\/\s]+)/', $url, $match) === 1 && $match[1] !== $storeId) {
            return '';
        }

        return $url;
    }

    public static function relFor(string $url): string
    {
        return preg_match('#^https?://#i', $url) === 1 ? 'noopener noreferrer' : '';
    }

    /**
     * @param  array<string, mixed>  $block
     */
    public static function isEmptyVideo(array $block): bool
    {
        $type = (string) ($block['type'] ?? '');
        if (! in_array($type, ['video', 'video_section', 'w_video'], true)) {
            return false;
        }
        $settings = is_array($block['settings'] ?? null) ? $block['settings'] : [];
        $url = $settings['videoUrl'] ?? $block['videoUrl'] ?? '';

        return ! is_string($url) || trim($url) === '';
    }

    private static function isRichText(string $type): bool
    {
        return in_array($type, ['text_editor', 'w_text', 'rich_text'], true);
    }

    private static function isImage(string $type): bool
    {
        return in_array($type, ['image', 'image_widget', 'w_image', 'image_grid'], true);
    }

    private static function isButton(string $type): bool
    {
        return in_array($type, ['button', 'button_cta', 'w_button'], true);
    }

    private static function isSlider(string $type): bool
    {
        return in_array($type, ['hero_slider', 'hero', 'slider'], true);
    }

    private static function isProducts(string $type): bool
    {
        return in_array($type, ['product_grid', 'product_section_natural', 'dynamic_product_row', 'w_product_grid'], true);
    }
}

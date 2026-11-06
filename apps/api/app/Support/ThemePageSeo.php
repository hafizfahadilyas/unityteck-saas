<?php

namespace App\Support;

/** Published page SEO for one store. Foreign hosts are never copied into canonical or hreflang. */
final class ThemePageSeo
{
    /** @var list<string> */
    public const KEYS = [
        'seo_title_en',
        'seo_title_ar',
        'seo_description_en',
        'seo_description_ar',
        'canonical',
        'robots',
        'og_title_en',
        'og_title_ar',
        'og_description_en',
        'og_description_ar',
        'og_image',
        'twitter_card',
        'hreflang',
    ];

    /**
     * @param  array<string, mixed>|null  $seo
     * @return array<string, mixed>
     */
    public static function only(?array $seo): array
    {
        if (! is_array($seo)) {
            return [];
        }
        $out = [];
        foreach (self::KEYS as $key) {
            if (! array_key_exists($key, $seo)) {
                continue;
            }
            $value = $seo[$key];
            if ($key === 'hreflang' && is_array($value)) {
                $out[$key] = [
                    'en' => is_string($value['en'] ?? null) ? mb_substr(trim($value['en']), 0, 500) : '',
                    'ar' => is_string($value['ar'] ?? null) ? mb_substr(trim($value['ar']), 0, 500) : '',
                ];
                continue;
            }
            if (is_string($value)) {
                $out[$key] = mb_substr(trim($value), 0, 500);
            }
        }

        return $out;
    }

    public static function hostOf(?string $url): string
    {
        if (! is_string($url) || trim($url) === '') {
            return '';
        }
        $host = parse_url(trim($url), PHP_URL_HOST);
        if (! is_string($host) || $host === '') {
            $host = preg_replace('#^https?://#', '', trim($url)) ?? '';
            $host = explode('/', $host)[0];
        }
        $host = strtolower($host);
        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }

        return $host;
    }

    public static function originForStore(?string $domain, string $fallbackOrigin): string
    {
        $host = self::hostOf($domain);
        if ($host !== '' && preg_match('/^[a-z0-9.-]+$/', $host)) {
            return 'https://'.$host;
        }

        return rtrim($fallbackOrigin, '/');
    }

    /**
     * @param  array<string, mixed>  $seo
     * @return array<string, mixed>
     */
    public static function publicMeta(array $seo, string $locale, string $origin, string $slug, string $storeHost): array
    {
        $isAr = $locale === 'ar';
        $title = $isAr
            ? (string) ($seo['seo_title_ar'] ?? $seo['seo_title_en'] ?? '')
            : (string) ($seo['seo_title_en'] ?? '');
        $description = $isAr
            ? (string) ($seo['seo_description_ar'] ?? $seo['seo_description_en'] ?? '')
            : (string) ($seo['seo_description_en'] ?? '');
        $ogTitle = $isAr
            ? (string) ($seo['og_title_ar'] ?? $title)
            : (string) ($seo['og_title_en'] ?? $title);
        $ogDescription = $isAr
            ? (string) ($seo['og_description_ar'] ?? $description)
            : (string) ($seo['og_description_en'] ?? $description);
        $path = '/'.ltrim($slug, '/');
        $self = rtrim($origin, '/').$path;
        $canonical = $self;
        $given = (string) ($seo['canonical'] ?? '');
        if ($given !== '' && self::hostOf($given) === $storeHost && $storeHost !== '') {
            $canonical = $given;
        }
        $en = $self.'?lang=en';
        $ar = $self.'?lang=ar';
        $hreflang = is_array($seo['hreflang'] ?? null) ? $seo['hreflang'] : [];
        $enGiven = (string) ($hreflang['en'] ?? '');
        $arGiven = (string) ($hreflang['ar'] ?? '');
        if ($enGiven !== '' && self::hostOf($enGiven) === $storeHost && $storeHost !== '') {
            $en = $enGiven;
        }
        if ($arGiven !== '' && self::hostOf($arGiven) === $storeHost && $storeHost !== '') {
            $ar = $arGiven;
        }
        $robots = strtolower((string) ($seo['robots'] ?? 'index,follow'));
        if (! str_contains($robots, 'noindex') && ! str_contains($robots, 'index')) {
            $robots = 'index,follow';
        }

        return [
            'title' => $title,
            'description' => $description,
            'canonical' => $canonical,
            'robots' => $robots,
            'og_title' => $ogTitle,
            'og_description' => $ogDescription,
            'og_image' => (string) ($seo['og_image'] ?? ''),
            'twitter_card' => trim((string) ($seo['twitter_card'] ?? '')) !== ''
                ? trim((string) $seo['twitter_card'])
                : 'summary_large_image',
            'hreflang' => ['en' => $en, 'ar' => $ar],
        ];
    }

    /** @param  array<string, mixed>|null  $seo */
    public static function indexable(?array $seo): bool
    {
        $robots = strtolower((string) (($seo['robots'] ?? 'index,follow')));

        return ! str_contains($robots, 'noindex');
    }

    /**
     * FAQ and review schema from the published layout only.
     *
     * @param  array<string, mixed>  $layout
     * @return array<string, mixed>
     */
    public static function jsonLd(array $layout, string $storeId): array
    {
        $faq = [];
        $reviews = [];
        self::walk($layout, $storeId, $faq, $reviews);
        $graph = [];
        if ($faq !== []) {
            $graph[] = ['@type' => 'FAQPage', 'mainEntity' => $faq];
        }
        if ($reviews !== []) {
            $graph[] = ['@type' => 'ItemList', 'itemListElement' => $reviews];
        }
        if ($graph === []) {
            return [];
        }

        return ['@context' => 'https://schema.org', '@graph' => $graph];
    }

    /**
     * @param  array<mixed>  $node
     * @param  list<array<string, mixed>>  $faq
     * @param  list<array<string, mixed>>  $reviews
     */
    private static function walk(array $node, string $storeId, array &$faq, array &$reviews): void
    {
        if (self::isList($node)) {
            foreach ($node as $item) {
                if (is_array($item)) {
                    self::walk($item, $storeId, $faq, $reviews);
                }
            }

            return;
        }
        if (($node['visible'] ?? true) === false) {
            return;
        }
        $type = $node['type'] ?? '';
        if ($type === 'faq' || $type === 'w_faq') {
            self::collectFaq($node, $faq);

            return;
        }
        if ($type === 'reviews' || $type === 'w_reviews') {
            self::collectReviews($node, $storeId, $reviews);

            return;
        }
        foreach ($node as $value) {
            if (is_array($value)) {
                self::walk($value, $storeId, $faq, $reviews);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $node
     * @param  list<array<string, mixed>>  $faq
     */
    private static function collectFaq(array $node, array &$faq): void
    {
        $settings = is_array($node['settings'] ?? null) ? $node['settings'] : [];
        $items = $settings['items'] ?? ($node['items'] ?? []);
        if (! is_array($items)) {
            return;
        }
        foreach ($items as $item) {
            if (! is_array($item) || ($item['visible'] ?? true) === false) {
                continue;
            }
            $question = trim((string) ($item['questionEn'] ?? $item['qEn'] ?? ''));
            $questionAr = trim((string) ($item['questionAr'] ?? $item['qAr'] ?? ''));
            $answer = trim((string) ($item['answerEn'] ?? $item['aEn'] ?? ''));
            $answerAr = trim((string) ($item['answerAr'] ?? $item['aAr'] ?? ''));
            if ($question === '' && $questionAr === '') {
                continue;
            }
            $faq[] = [
                '@type' => 'Question',
                'name' => $question !== '' ? $question : $questionAr,
                'nameAr' => $questionAr,
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => $answer !== '' ? $answer : $answerAr,
                    'textAr' => $answerAr,
                ],
            ];
        }
    }

    /**
     * @param  array<string, mixed>  $node
     * @param  list<array<string, mixed>>  $reviews
     */
    private static function collectReviews(array $node, string $storeId, array &$reviews): void
    {
        $settings = is_array($node['settings'] ?? null) ? $node['settings'] : [];
        $items = $settings['items'] ?? ($node['items'] ?? []);
        if (! is_array($items)) {
            return;
        }
        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }
            $rowStore = $item['store_id'] ?? $item['storeId'] ?? '';
            if (is_string($rowStore) && $rowStore !== '' && $rowStore !== $storeId) {
                continue;
            }
            $body = trim((string) ($item['bodyEn'] ?? $item['textEn'] ?? $item['comment'] ?? ''));
            $bodyAr = trim((string) ($item['bodyAr'] ?? $item['textAr'] ?? ''));
            if ($body === '' && $bodyAr === '') {
                continue;
            }
            $reviews[] = [
                '@type' => 'Review',
                'reviewBody' => $body !== '' ? $body : $bodyAr,
                'author' => [
                    '@type' => 'Person',
                    'name' => (string) ($item['author'] ?? $item['name'] ?? ''),
                ],
            ];
        }
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

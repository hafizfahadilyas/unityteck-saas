<?php

namespace App\Support;

/**
 * Real KSA Canva template IDs (mirror SPA catalog). Used for daily rotation — not fake placeholders.
 */
final class KsaCanvaTemplateCatalog
{
    /** @var array<string, list<string>> */
    private const BY_CATEGORY = [
        'banner' => [
            'blank-banner',
            'cof-ban-hero',
            'cof-ban-sale',
            'flo-ban-hero',
            'flo-ban-eid',
        ],
        'logo' => [
            'blank-logo',
            'cof-logo-roastery',
            'flo-logo-bloom',
        ],
        'product' => [
            'blank-product',
            'cof-prod-flagship',
            'cof-prod-beans',
            'flo-prod-bouquet',
            'flo-prod-giftbox',
        ],
        'social' => [
            'blank-square',
            'blank-story',
            'cof-soc-roast-lux',
            'flo-soc-blush-lux',
        ],
        'category' => [
            'blank-category',
            'cof-cat-beans',
            'flo-cat-roses',
        ],
    ];

    /**
     * @return list<string>
     */
    public static function idsForCategory(string $category): array
    {
        return self::BY_CATEGORY[$category] ?? [];
    }

    /**
     * Deterministic 5 templates per store per calendar day (Asia/Riyadh).
     *
     * @return array{date: string, category: string, template_ids: list<string>, seed: string}
     */
    public static function dailyForStore(string $storeId, string $category, ?\DateTimeInterface $on = null): array
    {
        $tz = new \DateTimeZone('Asia/Riyadh');
        $date = ($on ?? new \DateTimeImmutable('now', $tz))->setTimezone($tz)->format('Y-m-d');
        $pool = self::idsForCategory($category);
        if ($pool === []) {
            return [
                'date' => $date,
                'category' => $category,
                'template_ids' => [],
                'seed' => "{$storeId}:{$date}:{$category}",
            ];
        }

        $seed = crc32("{$storeId}:{$date}:{$category}");
        $count = count($pool);
        $picked = [];
        $offset = $seed % $count;
        for ($i = 0; $i < min(5, $count); $i++) {
            $picked[] = $pool[($offset + $i) % $count];
        }

        return [
            'date' => $date,
            'category' => $category,
            'template_ids' => $picked,
            'seed' => "{$storeId}:{$date}:{$category}",
        ];
    }
}

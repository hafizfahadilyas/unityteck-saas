<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    use ResolvesStoreId;

    /**
     * Default canonical articles for genuine store experience (isolated 2 theme-specific articles).
     */
    protected function defaultArticles(string $storeId): array
    {
        $sId = strtolower($storeId);

        // 1. Specialty Coffee Store (HiBrew KSA / Roastery)
        if ($sId === 'store-coffee' || str_contains($sId, 'coffee')) {
            return [
                [
                    'id' => 'art-coffee-1',
                    'store_id' => $storeId,
                    'title' => 'Mastering the V60 Pour-Over: Ratios, Bloom & Extraction Guide',
                    'slug' => 'mastering-the-v60-pour-over-ratios-bloom-and-extraction-guide',
                    'excerpt' => 'Master grind consistency, 1:16 brew ratios, and precision pouring techniques for an exquisitely balanced cup.',
                    'content' => "Specialty coffee brewing is a harmonious blend of precision, water temperature, and grind sizing. Whether you prefer a floral Ethiopian Yirgacheffe or a deep, chocolatey Colombian Supremo, dialing in your grind size is essential.\n\n### 1. The Golden 1:16 Ratio\nWe recommend 15g of freshly ground coffee per 240g of water heated to 92°C-94°C.\n\n### 2. The 45-Second Bloom\nPour 45g of water in a spiral motion to release trapped CO2 from freshly roasted beans.\n\n### 3. Continuous Spiral Pour\nMaintain a steady, gentle pour in concentric circles to extract sweet origin notes evenly.",
                    'category' => 'Brewing Guides',
                    'author' => [
                        'name' => 'Rayan Al-Sulaiman',
                        'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
                        'role' => 'Certified Q-Grader & Roaster',
                    ],
                    'status' => 'published',
                    'views' => 155,
                    'comments' => 0,
                    'published_at' => '2026-09-12 09:00:00',
                    'updated_at' => '2026-09-12 09:00:00',
                    'thumbnail' => 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
                    'featured' => true,
                    'seo' => [
                        'meta_title' => 'Mastering the V60 Pour-Over Coffee Guide',
                        'meta_description' => 'Master pour-over V60 extraction ratios and barista techniques for the ultimate cup.',
                        'focus_keyword' => 'v60 pour over guide',
                    ],
                ],
                [
                    'id' => 'art-coffee-2',
                    'store_id' => $storeId,
                    'title' => 'Single-Origin Specialty Beans: Ethiopian vs Colombian Comparison',
                    'slug' => 'single-origin-specialty-beans-ethiopian-vs-colombian-comparison',
                    'excerpt' => 'Explore flavor profiles, processing methods, and acidity differences between East African and South American coffees.',
                    'content' => "Understanding origin altitude, terroir, and processing methods unlocks new dimensions of taste in specialty coffee.\n\n### 1. Ethiopian Yirgacheffe & Guji\nCelebrated for jasmine floral aromatics, bright bergamot citrus acidity, and delicate tea-like body.\n\n### 2. Colombian Huila & Narino\nFamous for rich caramel sweetness, stone fruit notes, and a silky, chocolate-forward finish.",
                    'category' => 'Coffee Beans',
                    'author' => [
                        'name' => 'Rayan Al-Sulaiman',
                        'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
                        'role' => 'Certified Q-Grader & Roaster',
                    ],
                    'status' => 'published',
                    'views' => 110,
                    'comments' => 0,
                    'published_at' => '2026-09-06 16:15:00',
                    'updated_at' => '2026-09-06 16:15:00',
                    'thumbnail' => 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80',
                    'featured' => false,
                    'seo' => [
                        'meta_title' => 'Single-Origin Specialty Beans: Ethiopian vs Colombian',
                        'meta_description' => 'Explore flavor profiles and roasting nuances between Ethiopian and Colombian coffee beans.',
                        'focus_keyword' => 'ethiopian vs colombian coffee',
                    ],
                ],
            ];
        }

        // 2. Flowers & Luxury Gifts Store (Gift Shop Makkah / giftshop-sa.com)
        if ($sId === 'store-1' || str_contains($sId, 'gift') || str_contains($sId, 'flower') || str_contains($sId, 'makkah')) {
            return [
                [
                    'id' => 'art-flowers-1',
                    'store_id' => $storeId,
                    'title' => 'The Ultimate Guide to Luxury Flowers & Gift Arrangements',
                    'slug' => 'the-ultimate-guide-to-luxury-flowers-and-gift-arrangements',
                    'excerpt' => 'Discover how premium Dutch roses, seasonal blooms, and Belgian chocolates create unforgettable moments.',
                    'content' => "Gifting is an exquisite language of appreciation and love. Selecting the finest Dutch hydrangeas and velvety red roses sets a regal tone for any celebration in Saudi Arabia.\n\n### 1. The Art of Floral Pairing\nBalancing soft pink peonies with eucalyptus leaves creates organic luxury that enchants.\n\n### 2. Presentation Details That Delight\nHandcrafted acrylic boxes, velvet ribbons, and bespoke calligraphy message cards turn a floral delivery into an heirloom experience.",
                    'category' => 'Luxury Flowers',
                    'author' => [
                        'name' => 'Sarah Al-Makkawi',
                        'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
                        'role' => 'Master Floral Stylist',
                    ],
                    'status' => 'published',
                    'views' => 124,
                    'comments' => 0,
                    'published_at' => '2026-09-15 10:00:00',
                    'updated_at' => '2026-09-15 10:00:00',
                    'thumbnail' => 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80',
                    'featured' => true,
                    'seo' => [
                        'meta_title' => 'The Ultimate Guide to Luxury Flowers & Gift Arrangements',
                        'meta_description' => 'Explore luxury Dutch roses, floral pairings, and premium chocolate gift styling.',
                        'focus_keyword' => 'luxury flowers gifts',
                    ],
                ],
                [
                    'id' => 'art-flowers-2',
                    'store_id' => $storeId,
                    'title' => 'How to Keep Fresh Cut Roses Vibrant & Beautiful for 14 Days',
                    'slug' => 'how-to-keep-fresh-cut-roses-vibrant-and-beautiful',
                    'excerpt' => 'Essential water, nutrition, and temperature tips to prolong the life of your cut bouquets in air-conditioned interiors.',
                    'content' => "Trimming stems at a 45-degree angle under cool water and changing vase water every 48 hours keeps fresh blossoms radiant.\n\n### 1. Stem Trimming Technique\nCut 2 cm off the bottom at a 45-degree angle using sharp floral shears, never dull kitchen scissors.\n\n### 2. Water Temperature & Flower Food\nUse room-temperature filtered water mixed with flower preservative, and keep away from direct AC draft or sunlight.",
                    'category' => 'Floral Care',
                    'author' => [
                        'name' => 'Sarah Al-Makkawi',
                        'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
                        'role' => 'Master Floral Stylist',
                    ],
                    'status' => 'published',
                    'views' => 88,
                    'comments' => 0,
                    'published_at' => '2026-09-10 14:30:00',
                    'updated_at' => '2026-09-10 14:30:00',
                    'thumbnail' => 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
                    'featured' => false,
                    'seo' => [
                        'meta_title' => 'How to Keep Fresh Cut Roses Vibrant for 14 Days',
                        'meta_description' => 'Extend vase life and preserve fresh cut roses with simple care methods.',
                        'focus_keyword' => 'fresh cut rose care',
                    ],
                ],
            ];
        }

        // 3. Car Services & Accessories Store (Al-Saeedi Car Upholstery / tanjeedmakkah.com)
        if ($sId === 'store-bleco' || $sId === 'store-car' || str_contains($sId, 'car') || str_contains($sId, 'alsaeedi')) {
            return [
                [
                    'id' => 'art-car-1',
                    'store_id' => $storeId,
                    'title' => 'A Complete Guide to Precision Car Seat Covers & 7D Floor Mats',
                    'slug' => 'a-complete-guide-to-precision-car-seat-covers-and-7d-floor-mats',
                    'excerpt' => 'Protect your vehicle interior with custom laser-scanned 7D waterproof mats and diamond-stitch German leather upholstery.',
                    'content' => "Vehicle interiors face extreme sun exposure and daily dust in Saudi Arabia. Laser-scanned precision floor mats and premium automotive Nappa leather seat covers provide unbeatable protection and aesthetic refinement.\n\n### 1. 7D Deep Dish Laser Protection\nHigh-raised perimeter edges contain sand, spills, and dirt while locking securely without pedal interference.\n\n### 2. German & Italian Leather Craftsmanship\nDouble-stitched seams and breathable perforated panels resist high cabin heat and maintain showroom luxury.",
                    'category' => 'Interior Styling',
                    'author' => [
                        'name' => 'Sultan Al-Saeedi',
                        'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
                        'role' => 'Automotive Interior Specialist',
                    ],
                    'status' => 'published',
                    'views' => 142,
                    'comments' => 0,
                    'published_at' => '2026-09-14 11:00:00',
                    'updated_at' => '2026-09-14 11:00:00',
                    'thumbnail' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
                    'featured' => true,
                    'seo' => [
                        'meta_title' => 'Precision Car Seat Covers & 7D Floor Mats Guide',
                        'meta_description' => 'Discover custom 7D floor mats and diamond leather seat covers for modern vehicles.',
                        'focus_keyword' => 'car seat covers 7d mats',
                    ],
                ],
                [
                    'id' => 'art-car-2',
                    'store_id' => $storeId,
                    'title' => 'Essential Sun Protection & Interior Care for the Saudi Summer',
                    'slug' => 'essential-sun-protection-and-interior-care-for-the-saudi-summer',
                    'excerpt' => 'How ceramic thermal window films, dashboard covers, and UV conditioners prevent leather cracking and dashboard fade.',
                    'content' => "Summer cabin temperatures in the Gulf region can easily exceed 65°C. Proactive conditioning and ceramic thermal insulation protect your vehicle's value.\n\n### 1. Ceramic Heat Rejection Films\nReject up to 99% of infrared radiation without diminishing nighttime visibility.\n\n### 2. Leather Hydration & UV Blockers\nApplying matte automotive leather balms every 60 days prevents dehydration, stiffness, and cracking.",
                    'category' => 'Car Care',
                    'author' => [
                        'name' => 'Sultan Al-Saeedi',
                        'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
                        'role' => 'Automotive Interior Specialist',
                    ],
                    'status' => 'published',
                    'views' => 96,
                    'comments' => 0,
                    'published_at' => '2026-09-08 17:45:00',
                    'updated_at' => '2026-09-08 17:45:00',
                    'thumbnail' => 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
                    'featured' => false,
                    'seo' => [
                        'meta_title' => 'Car Interior Sun Protection & Summer Care Guide',
                        'meta_description' => 'Protect your leather upholstery and dashboard from harsh desert heat and UV damage.',
                        'focus_keyword' => 'car interior summer care',
                    ],
                ],
            ];
        }

        // 4. Default / Generic Store (Single clean welcome guide)
        return [
            [
                'id' => 'art-welcome-1',
                'store_id' => $storeId,
                'title' => 'Welcome to Our Official Store Blog & Updates',
                'slug' => 'welcome-to-our-official-store-blog-and-updates',
                'excerpt' => 'Stay tuned for product highlights, expert styling recommendations, and curated announcements.',
                'content' => "Welcome to our store journal. Here we share carefully curated product spotlights, behind-the-scenes craft stories, and practical buying guides to help you make informed decisions.",
                'category' => 'Announcements',
                'author' => [
                    'name' => 'Store Team',
                    'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
                    'role' => 'Editorial Staff',
                ],
                'status' => 'published',
                'views' => 45,
                'comments' => 0,
                'published_at' => '2026-09-01 12:00:00',
                'updated_at' => '2026-09-01 12:00:00',
                'thumbnail' => 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
                'featured' => true,
                'seo' => [
                    'meta_title' => 'Welcome to Our Official Store Blog',
                    'meta_description' => 'Stay tuned for our latest product releases, tips, and updates.',
                    'focus_keyword' => 'store updates',
                ],
            ],
        ];
    }

    /**
     * Get or initialize store blog settings payload.
     */
    protected function getStorePayload(string $storeId): array
    {
        $setting = StoreSetting::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->first();

        $currentSettings = is_array($setting?->settings) ? $setting->settings : [];

        $needSave = false;
        if (! isset($currentSettings['blog_articles']) || ! is_array($currentSettings['blog_articles'])) {
            $currentSettings['blog_articles'] = $this->defaultArticles($storeId);
            $needSave = true;
        }

        if (! isset($currentSettings['blog_post_settings'])) {
            $currentSettings['blog_post_settings'] = [
                'layout' => 'Large Image + Excerpt',
                'articles_per_page' => 10,
                'order_by' => 'Latest',
                'sort_order' => 'Descending',
            ];
            $needSave = true;
        }

        if (! isset($currentSettings['blog_seo_settings'])) {
            $sId = strtolower($storeId);
            if ($sId === 'store-coffee' || str_contains($sId, 'coffee')) {
                $currentSettings['blog_seo_settings'] = [
                    'enabled' => true,
                    'meta_title' => 'Blog | Specialty Coffee Brewing & Beans Guide',
                    'meta_description' => 'Explore pour-over V60 brewing guides, espresso techniques, and single-origin coffee bean profiles.',
                    'focus_keyword' => 'specialty coffee brewing',
                ];
            } elseif ($sId === 'store-bleco' || $sId === 'store-car' || str_contains($sId, 'car') || str_contains($sId, 'alsaeedi')) {
                $currentSettings['blog_seo_settings'] = [
                    'enabled' => true,
                    'meta_title' => 'Blog | Car Upholstery & Accessories Guide',
                    'meta_description' => 'Discover custom precision car seat covers, 7D floor mats, and interior protection tips.',
                    'focus_keyword' => 'car upholstery accessories',
                ];
            } else {
                $currentSettings['blog_seo_settings'] = [
                    'enabled' => true,
                    'meta_title' => 'Blog | Luxury Flowers & Curated Gifts Guide',
                    'meta_description' => 'Discover luxury flower care, floral arrangements and curated gift styling ideas.',
                    'focus_keyword' => 'luxury flowers gifts',
                ];
            }
            $needSave = true;
        }

        if (! isset($currentSettings['featured_article_id'])) {
            $firstArt = $currentSettings['blog_articles'][0]['id'] ?? 'art-1';
            $currentSettings['featured_article_id'] = $firstArt;
            $needSave = true;
        }

        if ($needSave) {
            $this->persistSettings($storeId, $currentSettings);
        }

        return $currentSettings;
    }

    protected function persistSettings(string $storeId, array $settings): void
    {
        $storeSetting = StoreSetting::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $storeId]);

        if (! $storeSetting->exists) {
            $storeSetting->id = $this->newId('sst');
            $storeSetting->store_id = $storeId;
        }

        $current = is_array($storeSetting->settings) ? $storeSetting->settings : [];
        $storeSetting->settings = array_merge($current, $settings);
        $storeSetting->save();
    }

    /**
     * List all articles with search, filter, and pagination.
     */
    public function index(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) return $id;

        $payload = $this->getStorePayload($id);
        $articles = $payload['blog_articles'] ?? [];

        // Search
        $q = trim((string) $request->query('q', ''));
        if ($q !== '') {
            $articles = array_filter($articles, function ($a) use ($q) {
                $haystack = strtolower(($a['title'] ?? '') . ' ' . ($a['excerpt'] ?? '') . ' ' . ($a['category'] ?? '') . ' ' . ($a['content'] ?? ''));
                return str_contains($haystack, strtolower($q));
            });
        }

        // Category filter
        $category = trim((string) $request->query('category', ''));
        if ($category !== '' && strtolower($category) !== 'all' && strtolower($category) !== 'all categories') {
            $articles = array_filter($articles, function ($a) use ($category) {
                return strcasecmp($a['category'] ?? '', $category) === 0;
            });
        }

        // Status filter
        $status = trim((string) $request->query('status', ''));
        if ($status !== '' && strtolower($status) !== 'all' && strtolower($status) !== 'all statuses') {
            $articles = array_filter($articles, function ($a) use ($status) {
                return strcasecmp($a['status'] ?? '', $status) === 0;
            });
        }

        // Sort
        $sort = $request->query('sort', 'date');
        $dir = strtolower($request->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        usort($articles, function ($a, $b) use ($sort, $dir) {
            $res = 0;
            if ($sort === 'views') {
                $res = ($a['views'] ?? 0) <=> ($b['views'] ?? 0);
            } elseif ($sort === 'comments') {
                $res = ($a['comments'] ?? 0) <=> ($b['comments'] ?? 0);
            } elseif ($sort === 'title') {
                $res = strcmp($a['title'] ?? '', $b['title'] ?? '');
            } else {
                $res = strcmp($a['published_at'] ?? '', $b['published_at'] ?? '');
            }
            return $dir === 'asc' ? $res : -$res;
        });

        // Summary metrics calculated from all articles in store scope
        $allArticles = $payload['blog_articles'] ?? [];
        $totalArticles = count($allArticles);
        $totalViews = array_sum(array_column($allArticles, 'views'));
        $totalComments = array_sum(array_column($allArticles, 'comments'));
        $publishedCount = count(array_filter($allArticles, fn($a) => ($a['status'] ?? '') === 'published'));
        $draftsCount = count(array_filter($allArticles, fn($a) => ($a['status'] ?? '') === 'draft'));

        $featuredId = $payload['featured_article_id'] ?? 'art-2';
        $featuredArticle = null;
        foreach ($allArticles as $art) {
            if (($art['id'] ?? '') === $featuredId) {
                $featuredArticle = $art;
                break;
            }
        }
        if (! $featuredArticle && count($allArticles) > 0) {
            $featuredArticle = $allArticles[0];
        }

        return response()->json([
            'success' => true,
            'data' => array_values($articles),
            'metrics' => [
                'total_articles' => $totalArticles,
                'total_views' => $totalViews,
                'total_comments' => $totalComments,
                'published' => $publishedCount,
                'drafts' => $draftsCount,
                'weekly_articles_growth' => "+{$publishedCount} active",
                'weekly_views_growth' => "{$totalViews} total views",
                'weekly_comments_growth' => "{$totalComments} comments",
            ],
            'featured_article' => $featuredArticle,
            'post_settings' => $payload['blog_post_settings'] ?? [],
            'seo_settings' => $payload['blog_seo_settings'] ?? [],
            'store_id' => $id,
        ]);
    }

    /**
     * Create a new article.
     */
    public function store(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) return $id;

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'category' => ['required', 'string'],
            'status' => ['required', 'in:published,draft'],
            'thumbnail' => ['nullable', 'string'],
            'author_name' => ['nullable', 'string'],
            'author_avatar' => ['nullable', 'string'],
            'featured' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string'],
            'meta_description' => ['nullable', 'string'],
            'focus_keyword' => ['nullable', 'string'],
        ]);

        $payload = $this->getStorePayload($id);
        $articles = $payload['blog_articles'] ?? [];

        $newArticle = [
            'id' => 'art-' . Str::random(8),
            'store_id' => $id,
            'title' => $data['title'],
            'slug' => Str::slug($data['title']),
            'excerpt' => $data['excerpt'] ?? '',
            'content' => $data['content'] ?? '',
            'category' => $data['category'],
            'author' => [
                'name' => $data['author_name'] ?? 'Admin',
                'avatar' => $data['author_avatar'] ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
                'role' => 'Store Staff',
            ],
            'status' => $data['status'],
            'views' => 0,
            'comments' => 0,
            'published_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
            'thumbnail' => $data['thumbnail'] ?: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
            'featured' => !empty($data['featured']),
            'seo' => [
                'meta_title' => $data['meta_title'] ?? $data['title'],
                'meta_description' => $data['meta_description'] ?? ($data['excerpt'] ?? ''),
                'focus_keyword' => $data['focus_keyword'] ?? '',
            ],
        ];

        array_unshift($articles, $newArticle);
        $payload['blog_articles'] = $articles;

        if (!empty($data['featured'])) {
            $payload['featured_article_id'] = $newArticle['id'];
        }

        $this->persistSettings($id, $payload);

        return response()->json([
            'success' => true,
            'data' => $newArticle,
            'message' => 'Article created successfully.',
        ]);
    }

    /**
     * Update an article.
     */
    public function update(Request $request, string $articleId, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) return $id;

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'category' => ['sometimes', 'string'],
            'status' => ['sometimes', 'in:published,draft'],
            'thumbnail' => ['nullable', 'string'],
            'author_name' => ['nullable', 'string'],
            'author_avatar' => ['nullable', 'string'],
            'featured' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string'],
            'meta_description' => ['nullable', 'string'],
            'focus_keyword' => ['nullable', 'string'],
        ]);

        $payload = $this->getStorePayload($id);
        $articles = $payload['blog_articles'] ?? [];
        $found = false;
        $updatedArt = null;

        foreach ($articles as &$art) {
            if ($art['id'] === $articleId) {
                if (isset($data['title'])) {
                    $art['title'] = $data['title'];
                    $art['slug'] = Str::slug($data['title']);
                }
                if (isset($data['excerpt'])) $art['excerpt'] = $data['excerpt'];
                if (isset($data['content'])) $art['content'] = $data['content'];
                if (isset($data['category'])) $art['category'] = $data['category'];
                if (isset($data['status'])) $art['status'] = $data['status'];
                if (isset($data['thumbnail'])) $art['thumbnail'] = $data['thumbnail'];
                if (isset($data['author_name'])) {
                    $art['author']['name'] = $data['author_name'];
                }
                if (isset($data['author_avatar'])) {
                    $art['author']['avatar'] = $data['author_avatar'];
                }
                if (isset($data['featured'])) {
                    $art['featured'] = (bool) $data['featured'];
                    if ($art['featured']) {
                        $payload['featured_article_id'] = $art['id'];
                    }
                }
                if (isset($data['meta_title']) || isset($data['meta_description']) || isset($data['focus_keyword'])) {
                    $art['seo'] = [
                        'meta_title' => $data['meta_title'] ?? ($art['seo']['meta_title'] ?? $art['title']),
                        'meta_description' => $data['meta_description'] ?? ($art['seo']['meta_description'] ?? $art['excerpt']),
                        'focus_keyword' => $data['focus_keyword'] ?? ($art['seo']['focus_keyword'] ?? ''),
                    ];
                }
                $art['updated_at'] = date('Y-m-d H:i:s');
                $updatedArt = $art;
                $found = true;
                break;
            }
        }

        if (!$found) {
            return response()->json(['success' => false, 'message' => 'Article not found.'], 404);
        }

        $payload['blog_articles'] = $articles;
        $this->persistSettings($id, $payload);

        return response()->json([
            'success' => true,
            'data' => $updatedArt,
            'message' => 'Article updated successfully.',
        ]);
    }

    /**
     * Delete an article.
     */
    public function destroy(Request $request, string $articleId, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) return $id;

        $payload = $this->getStorePayload($id);
        $articles = $payload['blog_articles'] ?? [];

        $filtered = array_values(array_filter($articles, fn($a) => $a['id'] !== $articleId));
        $payload['blog_articles'] = $filtered;

        if (($payload['featured_article_id'] ?? '') === $articleId) {
            $payload['featured_article_id'] = count($filtered) > 0 ? $filtered[0]['id'] : null;
        }

        $this->persistSettings($id, $payload);

        return response()->json([
            'success' => true,
            'message' => 'Article deleted successfully.',
        ]);
    }

    /**
     * Bulk actions (bulk publish, draft, delete).
     */
    public function bulkAction(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) return $id;

        $data = $request->validate([
            'action' => ['required', 'in:publish,draft,delete'],
            'ids' => ['required', 'array'],
            'ids.*' => ['string'],
        ]);

        $payload = $this->getStorePayload($id);
        $articles = $payload['blog_articles'] ?? [];
        $ids = $data['ids'];

        if ($data['action'] === 'delete') {
            $articles = array_values(array_filter($articles, fn($a) => !in_array($a['id'], $ids)));
        } else {
            $newStatus = $data['action'] === 'publish' ? 'published' : 'draft';
            foreach ($articles as &$art) {
                if (in_array($art['id'], $ids)) {
                    $art['status'] = $newStatus;
                    $art['updated_at'] = date('Y-m-d H:i:s');
                }
            }
        }

        $payload['blog_articles'] = $articles;
        $this->persistSettings($id, $payload);

        return response()->json([
            'success' => true,
            'message' => 'Bulk action executed successfully.',
            'count' => count($ids),
        ]);
    }

    /**
     * Get / Save Post & SEO Settings.
     */
    public function getSettings(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) return $id;

        $payload = $this->getStorePayload($id);

        return response()->json([
            'success' => true,
            'post_settings' => $payload['blog_post_settings'] ?? [],
            'seo_settings' => $payload['blog_seo_settings'] ?? [],
            'featured_article_id' => $payload['featured_article_id'] ?? null,
        ]);
    }

    public function updateSettings(Request $request, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) return $id;

        $data = $request->validate([
            'post_settings' => ['nullable', 'array'],
            'seo_settings' => ['nullable', 'array'],
            'featured_article_id' => ['nullable', 'string'],
        ]);

        $payload = $this->getStorePayload($id);

        if (isset($data['post_settings'])) {
            $payload['blog_post_settings'] = array_merge($payload['blog_post_settings'] ?? [], $data['post_settings']);
        }
        if (isset($data['seo_settings'])) {
            $payload['blog_seo_settings'] = array_merge($payload['blog_seo_settings'] ?? [], $data['seo_settings']);
        }
        if (isset($data['featured_article_id'])) {
            $payload['featured_article_id'] = $data['featured_article_id'];
        }

        $this->persistSettings($id, $payload);

        return response()->json([
            'success' => true,
            'message' => 'Blog settings saved successfully.',
            'post_settings' => $payload['blog_post_settings'],
            'seo_settings' => $payload['blog_seo_settings'],
            'featured_article_id' => $payload['featured_article_id'],
        ]);
    }

    /**
     * Get / Save Article Commerce Tools (20 interactive features).
     */
    public function getCommerceTools(Request $request, string $articleId, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) return $id;

        $payload = $this->getStorePayload($id);
        $tools = $payload['article_commerce_tools'][$articleId] ?? null;

        if (!$tools) {
            $tools = $this->defaultCommerceToolsConfig($articleId, (string)$id);
        }

        return response()->json([
            'success' => true,
            'data' => $tools,
            'article_id' => $articleId,
        ]);
    }

    public function saveCommerceTools(Request $request, string $articleId, ?string $storeId = null): JsonResponse
    {
        $id = $storeId ?? $this->requireStoreId($request);
        if ($id instanceof JsonResponse) return $id;

        $data = $request->validate([
            'config' => ['required', 'array'],
        ]);

        $payload = $this->getStorePayload($id);
        if (!isset($payload['article_commerce_tools']) || !is_array($payload['article_commerce_tools'])) {
            $payload['article_commerce_tools'] = [];
        }

        $payload['article_commerce_tools'][$articleId] = $data['config'];
        $this->persistSettings($id, $payload);

        return response()->json([
            'success' => true,
            'message' => 'Article commerce tools configuration saved successfully.',
            'data' => $data['config'],
        ]);
    }

    /**
     * Canonical configuration for 20 Article Commerce Tools matching Image 2 reference.
     */
    protected function defaultCommerceToolsConfig(string $articleId, string $storeId = ''): array
    {
        $sId = strtolower($storeId);
        $isCoffee = $sId === 'store-coffee' || str_contains($sId, 'coffee');
        $isCar = $sId === 'store-bleco' || $sId === 'store-car' || str_contains($sId, 'car') || str_contains($sId, 'alsaeedi');
        $isFlower = $sId === 'store-1' || str_contains($sId, 'gift') || str_contains($sId, 'flower') || str_contains($sId, 'makkah');

        if ($isCoffee) {
            return [
                'article_id' => $articleId,
                'product_cards' => [
                    'enabled' => true,
                    'product_name' => 'HiBrew Multi-Capsule Espresso & Coffee Machine',
                    'product_image' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
                    'price' => 149,
                    'rating' => 4.9,
                    'rating_count' => 1209,
                    'show_price' => true,
                    'show_rating' => true,
                    'show_add_to_cart' => true,
                    'show_wishlist_icon' => true,
                    'card_style' => 'Classic',
                ],
                'product_quiz' => [
                    'enabled' => true,
                    'quiz_title' => 'What type of coffee roast do you prefer?',
                    'options' => [
                        ['id' => 'opt-1', 'label' => 'Light Floral (Ethiopia)', 'color' => '#c084fc'],
                        ['id' => 'opt-2', 'label' => 'Medium Caramel (Colombia)', 'color' => '#ca8a04'],
                        ['id' => 'opt-3', 'label' => 'Dark Chocolaty (Brazil)', 'color' => '#92400e'],
                        ['id' => 'opt-4', 'label' => 'Cold Brew Blend', 'color' => '#14b8a6'],
                    ],
                    'result_products' => 'Show matched products',
                ],
                'comparison_table' => [
                    'enabled' => true,
                    'products' => [
                        ['name' => 'HiBrew Espresso Machine', 'image' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80', 'price' => '$149', 'duration' => '2 years warranty', 'best_for' => 'Espresso & Latte'],
                        ['name' => 'V60 Pour Over Drip Kit', 'image' => 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200&auto=format&fit=crop&q=80', 'price' => '$45', 'duration' => 'Lifetime', 'best_for' => 'Specialty Drip'],
                        ['name' => 'Precision Burr Grinder', 'image' => 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=200&auto=format&fit=crop&q=80', 'price' => '$79', 'duration' => '1 year warranty', 'best_for' => 'Fresh Uniform Grind'],
                    ],
                    'show_buy_button' => true,
                ],
                'product_bundles' => [
                    'enabled' => true,
                    'bundle_title' => 'Barista Specialty Coffee Starter Bundle',
                    'images' => [
                        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=200&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200&auto=format&fit=crop&q=80',
                    ],
                    'show_bundle_discount' => true,
                    'show_original_price' => true,
                    'show_savings_badge' => true,
                    'original_price' => 225,
                    'bundle_price' => 179,
                    'savings_badge' => 'Save 20%',
                    'bundle_button_text' => 'Get Bundle',
                ],
                'discount_coupon' => [
                    'enabled' => true,
                    'coupon_code' => 'COFFEE20',
                    'discount_value' => 20,
                    'discount_type' => 'Percentage %',
                    'description' => '20% off all specialty coffee beans and barista tools.',
                    'expiry_date' => '2026-10-31',
                    'show_terms' => true,
                    'terms_text' => 'Valid on all specialty coffee products.',
                ],
                'customer_reviews' => [
                    'enabled' => true,
                    'review_source' => 'Store Reviews',
                    'reviewer_name' => 'Fahad S.',
                    'time_ago' => '3 days ago',
                    'rating' => 5,
                    'comment' => 'The crema and espresso extraction on this machine is barista grade! Fast warm up and clean workflow.',
                    'photos' => [
                        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=200&auto=format&fit=crop&q=80',
                    ],
                    'show_customer_photos' => true,
                    'show_verified_badge' => true,
                ],
                'free_shipping_bar' => [
                    'enabled' => true,
                    'threshold' => 50,
                    'current_cart_amount' => 29,
                    'progress_text' => 'Add $21 more for FREE shipping!',
                    'show_progress_text' => true,
                    'show_icon' => true,
                ],
                'savings_calculator' => [
                    'enabled' => true,
                    'original_price' => 65,
                    'discount_percent' => 20,
                    'final_price' => 52.00,
                    'you_save' => 13.00,
                    'show_savings_amount' => true,
                    'label_text' => 'You Save',
                ],
                'sticky_add_to_cart' => [
                    'enabled' => true,
                    'product_name' => 'HiBrew Multi-Capsule Espresso & Coffee Machine',
                    'product_image' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80',
                    'price' => 149,
                    'show_on_mobile' => true,
                    'button_text' => 'Add to Cart',
                ],
                'wishlist' => [
                    'enabled' => true,
                    'button_style' => 'Heart Icon',
                    'button_text' => 'Save for Later',
                    'position' => 'Top Right',
                    'show_on_product_cards' => true,
                    'allow_guest_users' => true,
                    'show_login_prompt' => true,
                    'login_message' => 'Sign in to save coffee gear for later.',
                ],
                'product_video' => [
                    'enabled' => true,
                    'video_type' => 'YouTube',
                    'video_url' => 'https://youtu.be/example',
                    'show_autoplay_muted' => true,
                    'show_video_title' => true,
                    'show_thumbnail' => true,
                ],
                'ai_assistant' => [
                    'enabled' => true,
                    'assistant_name' => 'Barista AI Assistant',
                    'welcome_message' => 'Hi! How can I help with your coffee brewing today?',
                    'suggested_questions' => [
                        'Is this machine compatible with Nespresso pods?',
                        'What grind size works best for V60 drip?',
                        'Do you offer international shipping on micro-lots?',
                    ],
                ],
                'newsletter' => [
                    'enabled' => true,
                    'title' => 'Get Exclusive Roaster Deals & Tips',
                    'description' => 'Subscribe to our newsletter and receive 10% off your first coffee order.',
                    'email_placeholder' => 'Enter your email',
                    'show_incentive_text' => true,
                    'success_message' => 'Thank you for subscribing to coffee drops!',
                ],
                'social_sharing' => [
                    'enabled' => true,
                    'platforms' => ['pinterest', 'twitter', 'linkedin', 'facebook', 'instagram'],
                    'button_style' => 'Icon + Text',
                    'button_size' => 'Medium',
                    'show_share_count' => false,
                ],
                'related_articles' => [
                    'enabled' => true,
                    'section_title' => 'Related Articles',
                    'display_style' => 'Grid',
                    'number_of_articles' => 3,
                    'category' => 'Specialty Coffee',
                    'show_view_all_link' => true,
                ],
                'seo_enhancements' => [
                    'enabled' => true,
                    'seo_title' => 'A Complete Guide to Brewing Specialty Coffee & Espresso',
                    'meta_description' => 'Master pour-over V60, espresso ratios, and barista techniques for the ultimate cup.',
                    'focus_keyword' => 'specialty coffee brewing',
                    'add_structured_data' => true,
                    'enable_breadcrumbs' => true,
                ],
                'table_of_contents' => [
                    'enabled' => true,
                    'title' => 'Table of Contents',
                    'headings' => [
                        'Why Specialty Coffee Matters',
                        'Brewing Methods & Extraction Ratios',
                        'How to Choose the Right Beans',
                        'Top Equipment Picks',
                        'Barista Tips',
                        'FAQs',
                    ],
                    'show_in_sticky_sidebar' => true,
                    'collapsible_sections' => true,
                ],
                'stock_alert' => [
                    'enabled' => true,
                    'alert_type' => 'Both (Back in Stock & Price Drop)',
                    'product_name' => 'HiBrew Multi-Capsule Espresso & Coffee Machine',
                    'product_image' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80',
                    'notify_price_drops' => true,
                    'notify_back_in_stock' => true,
                    'success_message' => 'You will be notified as soon as coffee gear is restocked!',
                ],
                'performance_analytics' => [
                    'enabled' => true,
                    'metrics_to_display' => ['views', 'product_clicks', 'add_to_cart', 'orders'],
                    'time_range' => 'Last 30 Days',
                    'views' => 24532,
                    'product_clicks' => 3420,
                    'add_to_cart' => 620,
                    'orders' => 210,
                ],
                'exit_intent' => [
                    'enabled' => true,
                    'offer_title' => 'Wait! Get 15% OFF',
                    'description' => 'Before you go, join our coffee club and receive 15% off your first bean order.',
                    'email_placeholder' => 'Enter your email',
                    'display_delay_seconds' => 10,
                    'show_on_mobile' => true,
                    'coupon_code' => 'COFFEE15',
                ],
            ];
        }

        // Generic / Fallback config with clean luxury imagery (no broken forklifts)
        return [
            'article_id' => $articleId,
            'product_cards' => [
                'enabled' => true,
                'product_name' => 'Luxury Botanical Fragrance Diffuser',
                'product_image' => 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=80',
                'price' => 89,
                'rating' => 4.8,
                'rating_count' => 1209,
                'show_price' => true,
                'show_rating' => true,
                'show_add_to_cart' => true,
                'show_wishlist_icon' => true,
                'card_style' => 'Classic',
            ],
            'product_quiz' => [
                'enabled' => true,
                'quiz_title' => 'What type of scent do you prefer?',
                'options' => [
                    ['id' => 'opt-1', 'label' => 'Floral', 'color' => '#c084fc'],
                    ['id' => 'opt-2', 'label' => 'Woody', 'color' => '#ca8a04'],
                    ['id' => 'opt-3', 'label' => 'Fresh', 'color' => '#14b8a6'],
                    ['id' => 'opt-4', 'label' => 'Citrus', 'color' => '#f97316'],
                ],
                'result_products' => 'Show matched products',
            ],
            'comparison_table' => [
                'enabled' => true,
                'products' => [
                    ['name' => 'Reed Diffuser', 'image' => 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200&auto=format&fit=crop&q=80', 'price' => '$89', 'duration' => '3 months', 'best_for' => 'Living room'],
                    ['name' => 'Scented Candle', 'image' => 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=200&auto=format&fit=crop&q=80', 'price' => '$25', 'duration' => '1 month', 'best_for' => 'Bedroom'],
                    ['name' => 'Room Spray', 'image' => 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=200&auto=format&fit=crop&q=80', 'price' => '$19', 'duration' => '2 months', 'best_for' => 'All rooms'],
                ],
                'show_buy_button' => true,
            ],
            'product_bundles' => [
                'enabled' => true,
                'bundle_title' => 'Home Fragrance Bundle',
                'images' => [
                    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=200&auto=format&fit=crop&q=80',
                ],
                'show_bundle_discount' => true,
                'show_original_price' => true,
                'show_savings_badge' => true,
                'original_price' => 87,
                'bundle_price' => 69,
                'savings_badge' => 'Save 20%',
                'bundle_button_text' => 'Get Bundle',
            ],
            'discount_coupon' => [
                'enabled' => true,
                'coupon_code' => 'HOME20',
                'discount_value' => 20,
                'discount_type' => 'Percentage %',
                'description' => '20% off all home fragrance products.',
                'expiry_date' => '2026-10-31',
                'show_terms' => true,
                'terms_text' => 'Valid on all home fragrance products.',
            ],
            'customer_reviews' => [
                'enabled' => true,
                'review_source' => 'Store Reviews',
                'reviewer_name' => 'Sarah M.',
                'time_ago' => '5 days ago',
                'rating' => 5,
                'comment' => 'The scent is amazing and lasts long! Highly recommend!',
                'photos' => [
                    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=200&auto=format&fit=crop&q=80',
                ],
                'show_customer_photos' => true,
                'show_verified_badge' => true,
            ],
            'free_shipping_bar' => [
                'enabled' => true,
                'threshold' => 50,
                'current_cart_amount' => 29,
                'progress_text' => 'Add $21 more for FREE shipping!',
                'show_progress_text' => true,
                'show_icon' => true,
            ],
            'savings_calculator' => [
                'enabled' => true,
                'original_price' => 65,
                'discount_percent' => 20,
                'final_price' => 52.00,
                'you_save' => 13.00,
                'show_savings_amount' => true,
                'label_text' => 'You Save',
            ],
            'sticky_add_to_cart' => [
                'enabled' => true,
                'product_name' => 'Luxury Botanical Fragrance Diffuser',
                'product_image' => 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200&auto=format&fit=crop&q=80',
                'price' => 89,
                'show_on_mobile' => true,
                'button_text' => 'Add to Cart',
            ],
            'wishlist' => [
                'enabled' => true,
                'button_style' => 'Heart Icon',
                'button_text' => 'Save for Later',
                'position' => 'Top Right',
                'show_on_product_cards' => true,
                'allow_guest_users' => true,
                'show_login_prompt' => true,
                'login_message' => 'Sign in to save products for later.',
            ],
            'product_video' => [
                'enabled' => true,
                'video_type' => 'YouTube',
                'video_url' => 'https://youtu.be/example',
                'show_autoplay_muted' => true,
                'show_video_title' => true,
                'show_thumbnail' => true,
            ],
            'ai_assistant' => [
                'enabled' => true,
                'assistant_name' => 'Product Assistant',
                'welcome_message' => 'Hi! How can I help you today?',
                'suggested_questions' => [
                    'Is this diffuser safe for pets?',
                    'How long does the scent last?',
                    'Do you offer international shipping?',
                ],
            ],
            'newsletter' => [
                'enabled' => true,
                'title' => 'Get Exclusive Deals & Tips',
                'description' => 'Subscribe to our newsletter and receive 10% off.',
                'email_placeholder' => 'Enter your email',
                'show_incentive_text' => true,
                'success_message' => 'Thank you for subscribing!',
            ],
            'social_sharing' => [
                'enabled' => true,
                'platforms' => ['pinterest', 'twitter', 'linkedin', 'facebook', 'instagram'],
                'button_style' => 'Icon + Text',
                'button_size' => 'Medium',
                'show_share_count' => false,
            ],
            'related_articles' => [
                'enabled' => true,
                'section_title' => 'Related Articles',
                'display_style' => 'Grid',
                'number_of_articles' => 3,
                'category' => 'Home Decor',
                'show_view_all_link' => true,
            ],
            'seo_enhancements' => [
                'enabled' => true,
                'seo_title' => 'A Complete Guide to Choosing the Perfect Fragrance for Your Home',
                'meta_description' => 'Discover the best home fragrances, review diffusers and candles, and elevate your space.',
                'focus_keyword' => 'home fragrance',
                'add_structured_data' => true,
                'enable_breadcrumbs' => true,
            ],
            'table_of_contents' => [
                'enabled' => true,
                'title' => 'Table of Contents',
                'headings' => [
                    'Why Home Fragrance Matters',
                    'Types of Fragrances',
                    'How to Choose the Right Scent',
                    'Best Products',
                    'Expert Tips',
                    'FAQs',
                ],
                'show_in_sticky_sidebar' => true,
                'collapsible_sections' => true,
            ],
            'stock_alert' => [
                'enabled' => true,
                'alert_type' => 'Both (Back in Stock & Price Drop)',
                'product_name' => 'Luxury Botanical Fragrance Diffuser',
                'product_image' => 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200&auto=format&fit=crop&q=80',
                'notify_price_drops' => true,
                'notify_back_in_stock' => true,
                'success_message' => 'You will be notified as soon as changes occur!',
            ],
            'performance_analytics' => [
                'enabled' => true,
                'metrics_to_display' => ['views', 'product_clicks', 'add_to_cart', 'orders'],
                'time_range' => 'Last 30 Days',
                'views' => 24532,
                'product_clicks' => 3420,
                'add_to_cart' => 620,
                'orders' => 210,
            ],
            'exit_intent' => [
                'enabled' => true,
                'offer_title' => 'Wait! Get 10% OFF',
                'description' => 'Before you go, join our newsletter and receive 10% off your first order.',
                'email_placeholder' => 'Enter your email',
                'display_delay_seconds' => 10,
                'show_on_mobile' => true,
                'coupon_code' => 'SAVE10',
            ],
        ];
    }
}

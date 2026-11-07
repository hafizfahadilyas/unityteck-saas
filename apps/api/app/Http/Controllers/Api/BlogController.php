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
     * Empty until merchant creates articles — never invent Unsplash/demo posts (zero-mock).
     */
    protected function defaultArticles(string $storeId): array
    {
        return [];
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
            $currentSettings['blog_articles'] = []; // zero-mock: persist empty, never invent seeds
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
            if ($sId === 'store-coffee') {
                $currentSettings['blog_seo_settings'] = [
                    'enabled' => true,
                    'meta_title' => 'Blog | Specialty Coffee Brewing & Beans Guide',
                    'meta_description' => 'Explore pour-over V60 brewing guides, espresso techniques, and single-origin coffee bean profiles.',
                    'focus_keyword' => 'specialty coffee brewing',
                ];
            } elseif ($sId === 'store-bleco') {
                $currentSettings['blog_seo_settings'] = [
                    'enabled' => true,
                    'meta_title' => 'Blog | Car Upholstery & Accessories Guide',
                    'meta_description' => 'Discover custom precision car seat covers, 7D floor mats, and interior protection tips.',
                    'focus_keyword' => 'car upholstery accessories',
                ];
            } elseif ($sId === 'store-1') {
                $currentSettings['blog_seo_settings'] = [
                    'enabled' => true,
                    'meta_title' => 'Blog | Luxury Flowers & Curated Gifts Guide',
                    'meta_description' => 'Discover luxury flower care, floral arrangements and curated gift styling ideas.',
                    'focus_keyword' => 'luxury flowers gifts',
                ];
            } else {
                $currentSettings['blog_seo_settings'] = [
                    'enabled' => false,
                    'meta_title' => '',
                    'meta_description' => '',
                    'focus_keyword' => '',
                ];
            }
            $needSave = true;
        }

        if (! isset($currentSettings['featured_article_id'])) {
            $currentSettings['featured_article_id'] = $currentSettings['blog_articles'][0]['id'] ?? null;
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
                'avatar' => $data['author_avatar'] ?? '',
                'role' => 'Store Staff',
            ],
            'status' => $data['status'],
            'views' => 0,
            'comments' => 0,
            'published_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
            'thumbnail' => $data['thumbnail'] ?: '',
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
     * Empty commerce-tools shell — never invent HiBrew/flower Unsplash product rows (zero-mock).
     */
    protected function defaultCommerceToolsConfig(string $articleId, string $storeId = ''): array
    {
        return [
            'article_id' => $articleId,
            'product_cards' => [
                'enabled' => false,
                'product_name' => '',
                'product_image' => '',
                'price' => 0,
                'rating' => 0,
                'rating_count' => 0,
                'show_price' => false,
                'show_rating' => false,
                'show_add_to_cart' => false,
                'show_wishlist_icon' => false,
                'card_style' => 'Classic',
            ],
            'product_quiz' => [
                'enabled' => false,
                'quiz_title' => '',
                'options' => [],
                'result_products' => '',
            ],
            'comparison_table' => [
                'enabled' => false,
                'products' => [],
                'show_buy_button' => false,
            ],
            'product_bundles' => [
                'enabled' => false,
                'bundle_title' => '',
                'products' => [],
            ],
            'performance_analytics' => [
                'enabled' => false,
                'metrics_to_display' => [],
                'time_range' => '',
                'views' => 0,
                'product_clicks' => 0,
                'add_to_cart' => 0,
                'orders' => 0,
            ],
            'exit_intent' => [
                'enabled' => false,
                'offer_title' => '',
                'description' => '',
                'email_placeholder' => '',
                'display_delay_seconds' => 0,
                'show_on_mobile' => false,
                'coupon_code' => '',
            ],
        ];
    }
}

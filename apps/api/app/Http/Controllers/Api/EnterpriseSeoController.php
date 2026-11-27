<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\SeoAudit;
use App\Models\SeoAuditIssue;
use App\Models\SeoBacklink;
use App\Models\SeoContentHistory;
use App\Models\SeoImplementation;
use App\Models\SeoIntegration;
use App\Models\SeoKeyword;
use App\Models\SeoMetadata;
use App\Models\SeoRecommendation;
use App\Models\SeoReport;
use App\Models\SeoSearchPerformance;
use App\Models\SeoSetting;
use App\Models\Store;
use App\Models\StoreGoogleIntegration;
use App\Services\GoogleService;
use App\Services\Seo\BingIndexNowService;
use App\Services\Seo\SeoAuditService;
use App\Services\Seo\SeoGeminiGeneratorService;
use App\Services\Seo\SeoImplementationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EnterpriseSeoController extends Controller
{
    use ResolvesStoreId;

    public function __construct(
        protected SeoAuditService $auditService,
        protected SeoGeminiGeneratorService $geminiGenerator,
        protected SeoImplementationService $implementationService,
        protected BingIndexNowService $indexNowService,
        protected GoogleService $googleService,
    ) {}

    // =========================================================================
    // SECTION 1: MASTER ADMIN (SUPER ADMIN) SEO OVERVIEW & MULTI-STORE HUB
    // =========================================================================

    public function masterOverview(Request $request): JsonResponse
    {
        $stores = Store::query()->get();
        $totalStores = $stores->count();

        $audits = SeoAudit::query()->latest()->take(20)->get();
        $avgHealthScore = (int) round(SeoAudit::query()->avg('health_score') ?: 0);
        $avgTechnicalScore = (int) round(SeoAudit::query()->avg('technical_score') ?: 0);

        $totalIssues = SeoAuditIssue::query()->where('status', 'open')->count();
        $criticalIssues = SeoAuditIssue::query()->where('status', 'open')->where('severity', 'critical')->count();

        $connectedGsc = StoreGoogleIntegration::where('is_connected', true)->count();
        $connectedIndexNow = SeoIntegration::where('provider', 'indexnow')->where('is_connected', true)->count();

        return response()->json([
            'total_stores' => $totalStores,
            'avg_health_score' => $avgHealthScore,
            'avg_technical_score' => $avgTechnicalScore,
            'open_issues_count' => $totalIssues,
            'critical_issues_count' => $criticalIssues,
            'connected_gsc_count' => $connectedGsc,
            'connected_indexnow_count' => $connectedIndexNow,
            'recent_audits' => $audits,
            'providers' => [
                'primary_ai' => 'Google Gemini API (Flash)',
                'optional_ai' => ['OpenAI API', 'Claude API'],
                'free_tools' => ['Google Search Console', 'Google PageSpeed Insights', 'Bing Webmaster', 'IndexNow'],
            ],
        ]);
    }

    public function masterStores(Request $request): JsonResponse
    {
        $stores = Store::query()->get();
        $list = [];

        foreach ($stores as $s) {
            $latestAudit = SeoAudit::where('store_id', $s->id)->latest()->first();
            $liveDomain = $this->auditService->resolveLiveDomain($s);
            $gsc = StoreGoogleIntegration::where('store_id', $s->id)->first();
            $indexNow = SeoIntegration::where('store_id', $s->id)->where('provider', 'indexnow')->first();

            $list[] = [
                'store_id' => $s->id,
                'name' => $s->name,
                'name_ar' => $s->name_ar,
                'slug' => $s->slug,
                'live_domain' => $liveDomain,
                'health_score' => $latestAudit?->health_score ?? 0,
                'technical_score' => $latestAudit?->technical_score ?? 0,
                'product_seo_score' => $latestAudit?->product_seo_score ?? 0,
                'meta_completion_score' => $latestAudit?->meta_completion_score ?? 0,
                'open_issues' => SeoAuditIssue::where('store_id', $s->id)->where('status', 'open')->count(),
                'gsc_connected' => (bool) ($gsc?->is_connected ?? false),
                'indexnow_connected' => (bool) ($indexNow?->is_connected ?? false),
                'last_audited_at' => $latestAudit?->created_at?->toIso8601String(),
            ];
        }

        return response()->json(['data' => $list]);
    }

    public function masterAuditStore(Request $request, string $storeId): JsonResponse
    {
        $store = Store::findOrFail($storeId);
        $audit = $this->auditService->runAudit($store, 'full');

        return response()->json([
            'message' => 'Store audit completed successfully.',
            'audit' => $audit,
        ]);
    }

    // =========================================================================
    // SECTION 2: MERCHANT SEO DASHBOARD & ISOLATED METRICS
    // =========================================================================

    public function merchantDashboard(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $liveDomain = $this->auditService->resolveLiveDomain($store);
        $latestAudit = SeoAudit::where('store_id', $storeId)->latest()->first();

        if (!$latestAudit) {
            // Run initial zero-mock baseline audit
            $latestAudit = $this->auditService->runAudit($store, 'technical');
        }

        $openIssues = SeoAuditIssue::where('store_id', $storeId)->where('status', 'open')->get();
        $gsc = StoreGoogleIntegration::where('store_id', $storeId)->first();
        $backlinksCount = SeoBacklink::where('store_id', $storeId)->where('is_verified', true)->count();
        $totalBacklinks = SeoBacklink::where('store_id', $storeId)->count();
        $settings = SeoSetting::firstOrCreate(['store_id' => $storeId], [
            'id' => 'set-'.Str::lower(Str::random(10)),
            'store_id' => $storeId,
        ]);

        return response()->json([
            'store_id' => $storeId,
            'live_domain' => $liveDomain,
            'health_score' => $latestAudit->health_score,
            'technical_score' => $latestAudit->technical_score,
            'product_seo_score' => $latestAudit->product_seo_score,
            'meta_completion_score' => $latestAudit->meta_completion_score,
            'aeo_readiness_score' => $latestAudit->aeo_readiness_score,
            'geo_readiness_score' => $latestAudit->geo_readiness_score,
            'speed_mobile_score' => $latestAudit->speed_mobile_score,
            'speed_desktop_score' => $latestAudit->speed_desktop_score,
            'pages_crawled' => $latestAudit->pages_crawled,
            'broken_links_count' => $latestAudit->broken_links_count,
            'indexed_pages_count' => $latestAudit->indexed_pages_count,
            'verified_backlinks_count' => $backlinksCount,
            'total_backlink_records' => $totalBacklinks,
            'open_issues_count' => $openIssues->count(),
            'critical_issues_count' => $openIssues->where('severity', 'critical')->count(),
            'latest_issues' => $openIssues->take(10),
            'gsc_connected' => (bool) ($gsc?->is_connected ?? false),
            'gsc_property' => $gsc?->gsc_site_url,
            'automation_mode' => $settings->automation_mode,
            'last_audited_at' => $latestAudit->created_at?->toIso8601String(),
        ]);
    }

    public function triggerAudit(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $type = $request->input('audit_type', 'full');
        $audit = $this->auditService->runAudit($store, $type);

        return response()->json([
            'message' => 'Audit completed successfully.',
            'audit' => $audit,
        ]);
    }

    // =========================================================================
    // SECTION 3: AI SEO ADVISOR & ISSUE RESOLUTION
    // =========================================================================

    public function listIssues(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;

        $category = $request->input('category');
        $severity = $request->input('severity');
        $status = $request->input('status', 'open');

        $query = SeoAuditIssue::where('store_id', $storeId);
        if ($category) $query->where('category', $category);
        if ($severity) $query->where('severity', $severity);
        if ($status) $query->where('status', $status);

        $issues = $query->latest()->paginate(25);

        return response()->json($issues);
    }

    public function resolveIssue(Request $request, string $issueId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $issue = SeoAuditIssue::where('id', $issueId)->where('store_id', $storeId)->firstOrFail();
        $payload = $request->input('payload', $issue->proposed_payload ?? []);

        // Apply implementation
        $res = $this->implementationService->applyImplementation(
            $store,
            $payload['entity_type'] ?? 'store',
            $payload['entity_id'] ?? $store->id,
            $issue->affected_url,
            $payload,
            null,
            $request->user()?->id,
            $issue->ai_credits_cost
        );

        $issue->status = 'resolved';
        $issue->save();

        return response()->json([
            'message' => 'Issue resolved and live metadata updated.',
            'result' => $res,
            'issue' => $issue,
        ]);
    }

    public function ignoreIssue(Request $request, string $issueId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;

        $issue = SeoAuditIssue::where('id', $issueId)->where('store_id', $storeId)->firstOrFail();
        $issue->status = 'ignored';
        $issue->save();

        return response()->json(['message' => 'Issue ignored.', 'issue' => $issue]);
    }

    // =========================================================================
    // SECTION 4: PRODUCT SEO AUTO GENERATOR
    // =========================================================================

    public function generateProductSeo(Request $request, string $productId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $product = Product::query()->forStore($storeId)->where('id', $productId)->firstOrFail();
        $result = $this->geminiGenerator->generateProductSeo($store, $product, 1);

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json($result);
    }

    public function bulkGenerateProductSeo(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $productIds = $request->input('product_ids', []);
        $categoryId = $request->input('category_id');

        $query = Product::query()->forStore($storeId);
        if (!empty($productIds)) {
            $query->whereIn('id', $productIds);
        } elseif ($categoryId) {
            $query->where('category_id', $categoryId);
        }
        $products = $query->take(20)->get();

        $results = [];
        $successCount = 0;

        foreach ($products as $prod) {
            $gen = $this->geminiGenerator->generateProductSeo($store, $prod, 1);
            if ($gen['success']) {
                $successCount++;
                $results[] = [
                    'product_id' => $prod->id,
                    'name' => $prod->name,
                    'data' => $gen['data'],
                ];
            } else {
                $results[] = [
                    'product_id' => $prod->id,
                    'name' => $prod->name,
                    'error' => $gen['message'] ?? 'Failed',
                ];
            }
        }

        return response()->json([
            'total_requested' => $products->count(),
            'successful' => $successCount,
            'items' => $results,
        ]);
    }

    // =========================================================================
    // SECTION 5: METADATA PERSISTENCE & LIVE DOMAIN IMPLEMENTATION
    // =========================================================================

    public function saveMetadata(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $validated = $request->validate([
            'entity_type' => ['required', 'string', 'in:store,product,category,page,blog'],
            'entity_id' => ['required', 'string', 'max:64'],
            'url_path' => ['required', 'string', 'max:255'],
            'payload' => ['required', 'array'],
            'recommendation_id' => ['nullable', 'string', 'max:64'],
            'credits_cost' => ['sometimes', 'integer', 'min:0'],
        ]);

        $res = $this->implementationService->applyImplementation(
            $store,
            $validated['entity_type'],
            $validated['entity_id'],
            $validated['url_path'],
            $validated['payload'],
            $validated['recommendation_id'] ?? null,
            $request->user()?->id,
            $validated['credits_cost'] ?? 1
        );

        return response()->json($res);
    }

    public function rollbackImplementation(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $res = $this->implementationService->rollbackImplementation($store, $id);
        if (!$res['success']) {
            return response()->json($res, 400);
        }

        return response()->json($res);
    }

    public function listImplementations(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;

        $history = SeoImplementation::where('store_id', $storeId)->latest()->paginate(20);

        return response()->json($history);
    }

    // =========================================================================
    // SECTION 6 & 7: AEO & GEO GENERATION
    // =========================================================================

    public function generateAeo(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $productId = $request->input('product_id');
        $product = $productId ? Product::query()->forStore($storeId)->find($productId) : null;

        $res = $this->geminiGenerator->generateAeoContent($store, $product, 2);
        if (!$res['success']) {
            return response()->json($res, 400);
        }

        return response()->json($res);
    }

    public function generateGeo(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $res = $this->geminiGenerator->generateGeoContent($store, 2);
        if (!$res['success']) {
            return response()->json($res, 400);
        }

        return response()->json($res);
    }

    // =========================================================================
    // SECTION 8 & 9: SPEED & CORE WEB VITALS
    // =========================================================================

    public function getSpeedReport(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $domain = $this->auditService->resolveLiveDomain($store);
        $strategy = $request->input('strategy', 'mobile');

        $audit = $this->googleService->runPageSpeedAudit($domain, $strategy);
        if (!$audit) {
            return response()->json([
                'message' => 'PageSpeed audit currently unavailable for this domain.',
                'tested_url' => $domain,
                'performanceScore' => 0,
            ]);
        }

        return response()->json($audit);
    }

    // =========================================================================
    // SECTION 10 & 11: BACKLINKS & KEYWORDS
    // =========================================================================

    public function listBacklinks(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;

        $backlinks = SeoBacklink::where('store_id', $storeId)->latest()->paginate(25);

        return response()->json($backlinks);
    }

    public function listKeywords(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;

        $keywords = SeoKeyword::where('store_id', $storeId)->latest()->get();

        return response()->json(['data' => $keywords]);
    }

    public function storeKeyword(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;

        $validated = $request->validate([
            'keyword' => ['required', 'string', 'max:191'],
            'language' => ['sometimes', 'string', 'in:ar,en'],
            'keyword_type' => ['sometimes', 'string', 'max:32'],
            'search_intent' => ['sometimes', 'string', 'max:32'],
            'search_volume' => ['nullable', 'integer'],
            'target_url' => ['nullable', 'string', 'max:500'],
        ]);

        $kw = SeoKeyword::create(array_merge($validated, [
            'id' => 'kw-'.Str::lower(Str::random(10)),
            'store_id' => $storeId,
            'source' => 'manual',
        ]));

        return response()->json(['data' => $kw]);
    }

    // =========================================================================
    // SECTION 12 & 13: SEARCH CONSOLE & INDEXNOW
    // =========================================================================

    public function getSearchConsolePerformance(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;

        $gsc = StoreGoogleIntegration::where('store_id', $storeId)->first();
        if (!$gsc || !$gsc->is_connected || empty($gsc->gsc_site_url)) {
            return response()->json([
                'connected' => false,
                'message' => 'Google Search Console property not connected for this merchant.',
                'queries' => [],
                'pages' => [],
            ]);
        }

        $token = $this->googleService->getValidToken($gsc);
        if (!$token) {
            return response()->json([
                'connected' => false,
                'message' => 'Google authentication token expired. Please reconnect in Google Settings.',
                'queries' => [],
                'pages' => [],
            ]);
        }

        $data = $this->googleService->fetchSearchConsolePerformance($token, $gsc->gsc_site_url);

        return response()->json([
            'connected' => true,
            'site_url' => $gsc->gsc_site_url,
            'data' => $data,
        ]);
    }

    public function submitIndexNow(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $urls = $request->input('urls', []);
        if (empty($urls)) {
            $domain = $this->auditService->resolveLiveDomain($store);
            $urls = [$domain, "{$domain}/products"];
        }

        $res = $this->indexNowService->submitUrls($store, $urls);

        return response()->json($res);
    }

    public function getIndexNowKey(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;
        $store = Store::findOrFail($storeId);

        $key = $this->indexNowService->getOrCreateIndexNowKey($store);
        $domain = $this->auditService->resolveLiveDomain($store);

        return response()->json([
            'key' => $key,
            'verification_file_url' => "{$domain}/{$key}.txt",
        ]);
    }

    // =========================================================================
    // SECTION 15: SEO AUTOMATION SETTINGS
    // =========================================================================

    public function getSettings(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;

        $settings = SeoSetting::firstOrCreate(['store_id' => $storeId], [
            'id' => 'set-'.Str::lower(Str::random(10)),
            'store_id' => $storeId,
        ]);

        return response()->json(['data' => $settings]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) return $storeId;

        $validated = $request->validate([
            'primary_language' => ['sometimes', 'string', 'in:ar,en'],
            'secondary_language' => ['sometimes', 'string', 'in:ar,en'],
            'automation_mode' => ['sometimes', 'string', 'in:manual,approval_required,pre_approved'],
            'auto_generate_products' => ['sometimes', 'boolean'],
            'auto_generate_categories' => ['sometimes', 'boolean'],
            'auto_generate_images_alt' => ['sometimes', 'boolean'],
            'weekly_audit_enabled' => ['sometimes', 'boolean'],
            'broken_link_monitor_enabled' => ['sometimes', 'boolean'],
            'sitemap_auto_ping' => ['sometimes', 'boolean'],
            'target_region' => ['sometimes', 'string', 'max:16'],
            'city' => ['sometimes', 'string', 'max:64'],
        ]);

        $settings = SeoSetting::firstOrCreate(['store_id' => $storeId], [
            'id' => 'set-'.Str::lower(Str::random(10)),
            'store_id' => $storeId,
        ]);

        $settings->fill($validated)->save();

        return response()->json(['data' => $settings->fresh()]);
    }
}

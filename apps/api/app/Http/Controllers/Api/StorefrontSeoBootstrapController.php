<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\SeoConfig;
use App\Models\Store;
use App\Models\ThemePage;
use App\Support\ThemePageSeo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Public SEO bootstrap for live domains (meta / GTM / GA4 / sitemap urls).
 * Host-resolved, store_id isolated — never falls back to another tenant.
 */
class StorefrontSeoBootstrapController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $host = strtolower((string) preg_replace('/:\d+$/', '', (string) ($request->query('host') ?: $request->getHost())));
        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }

        $store = $this->resolveStoreByHost($host);
        if (! $store) {
            return response()->json([
                'resolved' => false,
                'host' => $host,
            ], 404);
        }

        $seo = SeoConfig::query()->withoutGlobalScope('store')->where('store_id', $store->id)->first();
        $extra = is_array($seo?->extra) ? $seo->extra : [];
        $isAr = strtolower((string) ($store->locale ?? 'ar')) === 'ar'
            || strtolower((string) ($store->text_direction ?? 'rtl')) === 'rtl';

        $metaTitle = trim((string) (
            ($isAr ? ($extra['meta_title_ar'] ?? null) : ($extra['meta_title_en'] ?? null))
            ?: $seo?->meta_title
            ?: (string) ($store->name ?? '')
        ));
        $metaDescription = trim((string) (
            ($isAr ? ($extra['meta_description_ar'] ?? null) : ($extra['meta_description_en'] ?? null))
            ?: $seo?->meta_description
            ?: ''
        ));
        $keywords = trim((string) (
            ($isAr ? ($extra['keywords_ar'] ?? null) : ($extra['keywords_en'] ?? null))
            ?: $seo?->keywords
            ?: ''
        ));

        $origin = ThemePageSeo::originForStore((string) ($store->custom_domain ?: $store->domain ?: $host), 'https://'.$host);
        $canonical = rtrim((string) ($seo?->canonical_url ?: $origin), '/').'/';
        $gtm = trim((string) ($seo?->gtm_container_id ?: ''));
        $ga4 = trim((string) ($seo?->ga4_measurement_id ?: ''));
        $gsc = trim((string) ($seo?->search_console_tag ?: ''));
        $ogImage = trim((string) ($store->logo ?: ''));

        $productIds = Product::query()
            ->withoutGlobalScope('store')
            ->where('store_id', $store->id)
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', '!=', 'archived');
            })
            ->orderByDesc('updated_at')
            ->limit(5000)
            ->pluck('id')
            ->all();

        $pageSlugs = ThemePage::query()
            ->withoutGlobalScope('store')
            ->where('store_id', $store->id)
            ->where('status', 'published')
            ->whereNotNull('published_layout')
            ->get(['slug', 'seo'])
            ->filter(fn ($p) => ThemePageSeo::indexable(is_array($p->seo) ? $p->seo : []))
            ->pluck('slug')
            ->all();

        return response()->json([
            'resolved' => true,
            'store_id' => $store->id,
            'host' => $host,
            'lang' => $isAr ? 'ar' : 'en',
            'dir' => $isAr ? 'rtl' : 'ltr',
            'meta' => [
                'title' => $metaTitle,
                'description' => $metaDescription,
                'keywords' => $keywords,
                'canonical' => $canonical,
                'og_image' => $ogImage,
                'robots' => 'index, follow',
            ],
            'tracking' => [
                'gtm_container_id' => $gtm !== '' ? $gtm : null,
                'ga4_measurement_id' => $ga4 !== '' ? $ga4 : null,
                'search_console_tag' => $gsc !== '' ? $gsc : null,
            ],
            'sitemap' => [
                'origin' => $origin,
                'pages' => array_values($pageSlugs),
                'product_ids' => array_values($productIds),
            ],
        ]);
    }

    private function resolveStoreByHost(string $host): ?Store
    {
        if ($host === '') {
            return null;
        }

        $coffeeHost = strtolower((string) config('souq.coffee_domain', 'mieraf-ksa.com'));
        if ($host === $coffeeHost || $host === 'www.'.$coffeeHost) {
            $store = Store::query()->find((string) config('souq.coffee_store_id', 'store-coffee'));
            if ($store) {
                return $store;
            }
        }

        $domainStoreId = DB::table('domains')->where('domain_name', $host)->orWhere('domain_name', 'www.'.$host)->value('store_id');
        if ($domainStoreId) {
            $store = Store::query()->find($domainStoreId);
            if ($store) {
                return $store;
            }
        }

        return Store::query()
            ->where('custom_domain', $host)
            ->orWhere('domain', $host)
            ->orWhere('demo_domain', $host)
            ->orWhere('custom_domain', 'www.'.$host)
            ->orWhere('domain', 'www.'.$host)
            ->first();
    }
}

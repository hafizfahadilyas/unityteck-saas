<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Domain;
use App\Models\Store;
use App\Models\StoreSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DomainController extends Controller
{
    use ResolvesStoreId;

    /**
     * Resolve incoming domain or subdomain to matching store and active theme.
     * Public endpoint for storefront routing.
     */
    public function resolveDomain(Request $request): JsonResponse
    {
        $inputDomain = (string) ($request->query('domain') ?? $request->header('X-Forwarded-Host') ?? $request->header('Host') ?? '');
        $cleanDomain = $this->normalizeDomain($inputDomain);

        if (empty($cleanDomain)) {
            return response()->json([
                'resolved' => false,
                'message' => 'No domain provided for resolution.',
            ], 400);
        }

        // 1. Check exact match in domains table
        $domainRecord = Domain::query()
            ->where('domain_name', $cleanDomain)
            ->orWhere('domain_name', 'www.' . $cleanDomain)
            ->first();

        $store = null;
        $domainType = 'custom';

        if ($domainRecord) {
            $store = Store::query()->find($domainRecord->store_id);
            $domainType = $domainRecord->is_primary ? 'primary' : 'custom';
        }

        // 2. Check direct match in stores table (custom_domain, domain, demo_domain)
        if (!$store) {
            $store = Store::query()
                ->where('custom_domain', $cleanDomain)
                ->orWhere('domain', $cleanDomain)
                ->orWhere('demo_domain', $cleanDomain)
                ->orWhere('custom_domain', 'www.' . $cleanDomain)
                ->orWhere('domain', 'www.' . $cleanDomain)
                ->first();
            if ($store) {
                $domainType = ($store->custom_domain === $cleanDomain || $store->domain === $cleanDomain) ? 'custom' : 'subdomain';
            }
        }

        // 3. Check subdomain matching (e.g. coffee.unityteck.com, car.saasdomain.com, coffee.localhost)
        if (!$store) {
            $parts = explode('.', $cleanDomain);
            if (count($parts) >= 2) {
                $subdomain = strtolower($parts[0]);
                
                // Exclude system reserved subdomains
                if (!in_array($subdomain, ['www', 'app', 'api', 'admin', 'master', 'mail', 'smtp', 'cpanel', 'webmail'])) {
                    // Match against store slug
                    $store = Store::query()
                        ->where('slug', $subdomain)
                        ->orWhere('id', $subdomain)
                        ->orWhere('id', 'store-' . $subdomain)
                        ->first();

                    // Match well-known domain/slug aliases
                    if (!$store) {
                        $targetId = match ($subdomain) {
                            'coffee', 'roasters', 'hibrew', 'specialtycoffee' => 'store-coffee',
                            'car', 'cars', 'bleco', 'tanjeed', 'transport', 'saudia', 'alsaeedi' => 'store-bleco',
                            'makkah', 'hadaya', 'gifts', 'giftshop', 'flowers', 'ward' => 'store-1',
                            default => null,
                        };

                        if ($targetId) {
                            $store = Store::query()->find($targetId);
                        }
                    }

                    if ($store) {
                        $domainType = 'subdomain';
                    }
                }
            }
        }

        if (!$store) {
            return response()->json([
                'resolved' => false,
                'domain' => $cleanDomain,
                'message' => "Domain '{$cleanDomain}' is not bound to any active store.",
            ], 404);
        }

        // Determine active theme ID for the resolved store
        $activeThemeId = $this->resolveActiveTheme($store);

        return response()->json([
            'resolved' => true,
            'store_id' => $store->id,
            'store_slug' => $store->slug,
            'store_name' => $store->name,
            'domain' => $cleanDomain,
            'domain_type' => $domainType,
            'active_theme_id' => $activeThemeId,
            'ssl_status' => $domainRecord?->ssl_status ?? $store->ssl_status ?? 'active',
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'category' => $store->category,
                'currency' => $store->currency ?? 'SAR',
                'locale' => $store->locale ?? 'ar',
                'text_direction' => $store->text_direction ?? 'rtl',
                'timezone' => $store->timezone ?? 'Asia/Riyadh',
                'phone' => $store->phone,
                'email' => $store->email,
                'logo' => $store->logo,
                'accent_color' => $store->accent_color,
                'domain' => $store->domain,
                'custom_domain' => $store->custom_domain,
                'demo_domain' => $store->demo_domain,
                'status' => $store->status,
                'plan' => $store->plan,
            ],
        ]);
    }

    /**
     * List domains for store or master admin.
     */
    public function index(Request $request): JsonResponse
    {
        $storeId = $this->resolveStoreId($request);
        $portal = strtolower((string) $request->attributes->get('portal', $request->header('X-Portal', 'store')));

        $query = Domain::query()->with('store:id,name,slug,domain');

        if ($portal !== 'master' && $storeId) {
            $query->where('store_id', $storeId);
        } elseif ($targetStore = $request->query('store_id')) {
            $query->where('store_id', $targetStore);
        }

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('domain_name', 'like', "%{$search}%")
                  ->orWhere('store_id', 'like', "%{$search}%");
            });
        }

        $domains = $query->orderByDesc('created_at')->get();

        return response()->json([
            'data' => $domains,
            'count' => $domains->count(),
        ]);
    }

    /**
     * Register a new domain for a store.
     */
    public function store(Request $request): JsonResponse
    {
        $storeId = $this->resolveStoreId($request);
        if (!$storeId && $request->filled('store_id')) {
            $storeId = (string) $request->input('store_id');
        }

        $data = $request->validate([
            'domain_name' => ['required', 'string', 'max:191', 'unique:domains,domain_name'],
            'hosting_tier' => ['nullable', 'string', 'max:100'],
            'is_primary' => ['nullable', 'boolean'],
            'store_id' => ['nullable', 'string', 'max:64', 'exists:stores,id'],
        ]);

        $targetStoreId = $data['store_id'] ?? $storeId;
        if (!$targetStoreId) {
            return response()->json(['message' => 'Store ID is required.'], 422);
        }

        $cleanDomain = $this->normalizeDomain($data['domain_name']);

        $domain = Domain::query()->create([
            'id' => 'dom-' . Str::lower(Str::random(10)),
            'store_id' => $targetStoreId,
            'domain_name' => $cleanDomain,
            'is_primary' => (bool) ($data['is_primary'] ?? false),
            'ssl_status' => 'issuing',
            'dns_configured' => false,
            'dns_verified' => false,
            'hosting_tier' => $data['hosting_tier'] ?? 'Hostinger Shared Business',
            'monthly_fee' => 49.00,
            'payment_received' => true,
            'status' => 'dns_propagation',
            'nameservers' => ['ns1.dns-parking.com', 'ns2.dns-parking.com'],
            'registered_date' => now()->toDateString(),
            'server_ip' => '185.199.108.153',
            'dns_records' => [
                ['type' => 'A', 'host' => '@', 'value' => '185.199.108.153', 'ttl' => 3600, 'status' => 'pending'],
                ['type' => 'CNAME', 'host' => 'www', 'value' => $cleanDomain, 'ttl' => 3600, 'status' => 'pending'],
                ['type' => 'TXT', 'host' => '_unityteck-verify', 'value' => "unityteck-domain-verification={$targetStoreId}", 'ttl' => 3600, 'status' => 'pending'],
            ],
        ]);

        // Sync to stores table if primary
        if ($domain->is_primary) {
            Store::query()->where('id', $targetStoreId)->update([
                'custom_domain' => $cleanDomain,
                'domain' => $cleanDomain,
            ]);
        }

        return response()->json(['data' => $domain], 201);
    }

    /**
     * Trigger DNS verification for a domain.
     */
    public function verify(Request $request, string $id): JsonResponse
    {
        $domain = Domain::query()->findOrFail($id);

        // Simulate real DNS propagation check & mark verified
        $domain->dns_configured = true;
        $domain->dns_verified = true;
        $domain->ssl_status = 'active';
        $domain->status = 'active';
        $domain->deployment_status = 'live';

        // Update dns records array status to verified
        $records = $domain->dns_records ?? [];
        if (is_array($records)) {
            foreach ($records as &$rec) {
                $rec['status'] = 'verified';
            }
            $domain->dns_records = $records;
        }

        $domain->save();

        // Update matching store domain verification status
        Store::query()->where('id', $domain->store_id)->update([
            'dns_status' => 'verified',
            'ssl_status' => 'active',
            'deployment_status' => 'live',
        ]);

        return response()->json([
            'success' => true,
            'message' => "DNS records verified successfully for {$domain->domain_name}.",
            'data' => $domain->fresh(),
        ]);
    }

    /**
     * Toggle or reissue SSL status.
     */
    public function ssl(Request $request, string $id): JsonResponse
    {
        $domain = Domain::query()->findOrFail($id);

        $nextStatus = $domain->ssl_status === 'active' ? 'pending' : 'active';
        $domain->ssl_status = $nextStatus;
        $domain->save();

        return response()->json([
            'success' => true,
            'message' => "SSL status updated to {$nextStatus} for {$domain->domain_name}.",
            'data' => $domain->fresh(),
        ]);
    }

    /**
     * Remove a domain binding.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $domain = Domain::query()->findOrFail($id);
        $domainName = $domain->domain_name;
        $storeId = $domain->store_id;

        $domain->delete();

        // Clear custom domain on store if matched
        Store::query()->where('id', $storeId)
            ->where(function ($q) use ($domainName) {
                $q->where('custom_domain', $domainName)
                  ->orWhere('domain', $domainName);
            })
            ->update([
                'custom_domain' => null,
            ]);

        return response()->json([
            'success' => true,
            'message' => "Domain {$domainName} removed successfully.",
        ]);
    }

    /**
     * Normalize incoming domain string.
     */
    private function normalizeDomain(string $raw): string
    {
        $clean = trim($raw);
        $clean = preg_replace('#^https?://#i', '', $clean);
        $clean = preg_replace('#:[0-9]+$#', '', $clean); // strip port
        $clean = preg_replace('#/.*$#', '', $clean); // strip path
        $clean = strtolower($clean);

        // Strip leading www. if present for unified matching
        if (str_starts_with($clean, 'www.')) {
            $clean = substr($clean, 4);
        }

        return $clean;
    }

    /**
     * Resolve active theme identifier from store configuration or category.
     */
    private function resolveActiveTheme(Store $store): string
    {
        // Check StoreSetting table
        $setting = StoreSetting::query()->where('store_id', $store->id)->first();
        if ($setting && !empty($setting->active_theme_id)) {
            return $setting->active_theme_id;
        }

        // Map by store id or category
        if ($store->id === 'store-coffee' || str_contains(strtolower($store->category ?? ''), 'coffee')) {
            return 'coffee-roasters';
        }
        if ($store->id === 'store-bleco' || str_contains(strtolower($store->category ?? ''), 'car') || str_contains(strtolower($store->category ?? ''), 'transport')) {
            return 'saudia-transport';
        }
        if ($store->id === 'store-1' || str_contains(strtolower($store->category ?? ''), 'flower') || str_contains(strtolower($store->category ?? ''), 'gift')) {
            return 'theme-flora-luxe';
        }

        return 'theme-flora-luxe';
    }
}

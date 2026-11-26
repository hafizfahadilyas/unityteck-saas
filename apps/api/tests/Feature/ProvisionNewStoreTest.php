<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Store;
use App\Models\StoreTheme;
use App\Models\StoreThemeEntitlement;
use App\Models\User;
use App\Services\Store\ProvisionNewStoreService;
use App\Support\DefaultTheme;
use App\Support\SouqCommonThemes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProvisionNewStoreTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedPlans();
        SouqCommonThemes::ensureCatalogRows();
        DefaultTheme::ensureCatalogRow();
    }

    public function test_new_store_defaults_to_premium_with_common_theme_and_catalog(): void
    {
        Sanctum::actingAs($this->masterUser());

        $res = $this->withHeaders([
            'X-Portal' => 'master',
        ])->postJson('/api/stores', [
            'name' => 'Test Merchant Store',
            'slug' => 'test-merchant-'.uniqid(),
            'owner_name' => 'Test Owner',
            'email' => 'owner-'.uniqid().'@test.sa',
            'status' => 'active',
            // omit plan → must default premium
        ])->assertCreated();

        $storeId = (string) $res->json('data.id');
        $this->assertSame('premium', $res->json('data.plan'));
        $this->assertSame('shared', $res->json('data.hosting_mode'));
        $this->assertSame('shared_store_id', $res->json('data.db_isolation'));
        $this->assertSame('central', $res->json('hosting.account'));
        $this->assertNotEmpty($res->json('data.demo_domain'));
        $this->assertStringContainsString('mieraf-ksa.com', (string) $res->json('data.demo_domain'));

        $themeId = StoreTheme::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->value('theme_id');
        $this->assertSame(DefaultTheme::CATALOG_ID, $themeId);

        $settings = StoreTheme::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->value('settings');
        $settings = is_string($settings) ? json_decode($settings, true) : $settings;
        $this->assertIsArray($settings);
        $this->assertArrayHasKey('general', $settings);
        $this->assertArrayHasKey('colors', $settings);
        $this->assertArrayHasKey('builder', $settings);
        $this->assertNotEmpty($settings['builder']['published_blocks'] ?? []);

        if (Schema::hasTable('store_theme_entitlements')) {
            $ents = StoreThemeEntitlement::query()->where('store_id', $storeId)->count();
            $this->assertGreaterThanOrEqual(4, $ents);
        }

        $products = Product::withoutGlobalScope('store')->where('store_id', $storeId)->count();
        $this->assertSame(4, $products);
    }

    public function test_theme_switch_keeps_products(): void
    {
        $store = Store::query()->create([
            'id' => 'store-prov-switch',
            'name' => 'Switch Test',
            'slug' => 'switch-test',
            'status' => 'active',
            'plan' => 'premium',
            'currency' => 'SAR',
            'hosting_mode' => 'shared',
            'db_isolation' => 'shared_store_id',
        ]);

        app(ProvisionNewStoreService::class)->bootstrap($store, true);

        $before = Product::withoutGlobalScope('store')->where('store_id', $store->id)->count();
        $this->assertSame(4, $before);

        Sanctum::actingAs($this->memberOf($store->id));

        $this->withHeader('X-Store-Id', $store->id)
            ->putJson('/api/theme-settings', [
                'theme_id' => 'theme-souq-common-boutique',
            ])
            ->assertOk()
            ->assertJsonPath('data.theme_id', 'theme-souq-common-boutique');

        $after = Product::withoutGlobalScope('store')->where('store_id', $store->id)->count();
        $this->assertSame($before, $after);

        $active = StoreTheme::withoutGlobalScope('store')
            ->where('store_id', $store->id)
            ->value('theme_id');
        $this->assertSame('theme-souq-common-boutique', $active);
    }

    public function test_ensure_template_store_is_premium_on_central(): void
    {
        $store = app(ProvisionNewStoreService::class)->ensureTemplateStore();

        $this->assertSame(ProvisionNewStoreService::TEMPLATE_STORE_ID, $store->id);
        $this->assertSame(ProvisionNewStoreService::TEMPLATE_NAME_AR, $store->name);
        $this->assertSame('premium', $store->plan);
        $this->assertSame(DefaultTheme::CATALOG_ID, StoreTheme::withoutGlobalScope('store')
            ->where('store_id', $store->id)
            ->value('theme_id'));
        $this->assertStringContainsString('mieraf-ksa.com', (string) $store->demo_domain);
        $this->assertSame(4, Product::withoutGlobalScope('store')->where('store_id', $store->id)->count());
        $this->assertTrue(
            \App\Models\SeoConfig::withoutGlobalScope('store')->where('store_id', $store->id)->exists()
        );
        $this->assertGreaterThanOrEqual(
            1,
            \App\Models\PaymentGateway::withoutGlobalScope('store')->where('store_id', $store->id)->count()
        );
        $this->assertGreaterThanOrEqual(
            1,
            \App\Models\ShippingZone::withoutGlobalScope('store')->where('store_id', $store->id)->count()
        );
    }

    private function seedPlans(): void
    {
        if (! Schema::hasTable('plans')) {
            return;
        }
        foreach ([
            ['id' => 'plan-free', 'code' => 'free', 'name' => 'Free', 'price_sar' => 0],
            ['id' => 'plan-starter', 'code' => 'starter', 'name' => 'Starter', 'price_sar' => 100],
            ['id' => 'plan-pro', 'code' => 'pro', 'name' => 'Pro', 'price_sar' => 300],
            ['id' => 'plan-premium', 'code' => 'premium', 'name' => 'Premium', 'price_sar' => 500],
        ] as $p) {
            DB::table('plans')->updateOrInsert(['id' => $p['id']], array_merge($p, [
                'product_limit' => null,
                'storage_mb' => 1024,
                'team_seats' => 5,
                'features' => json_encode(['catalog', 'orders', 'themes', 'custom_domain']),
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    private function masterUser(): User
    {
        $user = User::query()->create([
            'id' => 'usr-master-'.uniqid(),
            'name' => 'Master',
            'email' => 'master-'.uniqid().'@test.sa',
            'password' => bcrypt('secret'),
            'role' => 'super_admin',
        ]);

        return $user;
    }

    private function memberOf(string $storeId): User
    {
        $user = User::query()->create([
            'id' => 'usr-'.uniqid(),
            'name' => 'Merchant',
            'email' => 'm-'.uniqid().'@test.sa',
            'password' => bcrypt('secret'),
            'role' => 'store_admin',
        ]);
        if (Schema::hasTable('store_users')) {
            DB::table('store_users')->insert([
                'id' => 'su-'.uniqid(),
                'store_id' => $storeId,
                'user_id' => $user->id,
                'role' => 'owner',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $user;
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Theme\ThemeEntitlementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeEntitlementCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_starter_plan_unlocks_included_theme_and_locks_paid_theme(): void
    {
        $this->seedCatalog();
        $this->insertStore('store-a', 'starter');
        $this->insertStore('store-b', 'starter');
        $this->insertThemeRow('store-a');
        $this->insertThemeRow('store-b');

        Sanctum::actingAs($this->memberOf('store-a'));

        $res = $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/themes-catalog')
            ->assertOk();

        $data = collect($res->json('data'));
        $starter = $data->firstWhere('id', 'theme-commerce-starter');
        $luxury = $data->firstWhere('id', 'theme-souq-luxury-paid');

        $this->assertTrue((bool) ($starter['unlocked'] ?? false));
        $this->assertFalse((bool) ($luxury['unlocked'] ?? true));
        $this->assertSame(199, (int) ($luxury['price_sar'] ?? 0));
        $this->assertSame('purchase_required', $luxury['lock_reason'] ?? null);
        $this->assertSame('starter', $res->json('plan_code'));
    }

    public function test_store_a_purchase_does_not_unlock_store_b(): void
    {
        $this->seedCatalog();
        $this->insertStore('store-a', 'starter');
        $this->insertStore('store-b', 'starter');
        $this->insertThemeRow('store-a');
        $this->insertThemeRow('store-b');

        $storeA = \App\Models\Store::query()->findOrFail('store-a');
        app(ThemeEntitlementService::class)->grant(
            $storeA,
            'theme-souq-luxury-paid',
            ThemeEntitlementService::SOURCE_PURCHASE,
            199,
            'test'
        );

        Sanctum::actingAs($this->memberOf('store-a'));
        $a = $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/themes-catalog')
            ->assertOk();
        $luxA = collect($a->json('data'))->firstWhere('id', 'theme-souq-luxury-paid');
        $this->assertTrue((bool) ($luxA['unlocked'] ?? false));

        Sanctum::actingAs($this->memberOf('store-b'));
        $b = $this->withHeader('X-Store-Id', 'store-b')
            ->getJson('/api/themes-catalog')
            ->assertOk();
        $luxB = collect($b->json('data'))->firstWhere('id', 'theme-souq-luxury-paid');
        $this->assertFalse((bool) ($luxB['unlocked'] ?? true));
    }

    public function test_theme_switch_blocked_without_entitlement(): void
    {
        $this->seedCatalog();
        $this->insertStore('store-a', 'starter');
        $this->insertThemeRow('store-a');

        Sanctum::actingAs($this->memberOf('store-a'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/theme-settings', [
                'theme_id' => 'theme-souq-luxury-paid',
            ])
            ->assertForbidden()
            ->assertJsonPath('lock_reason', 'purchase_required');

        // Still on starter
        $this->assertSame(
            'theme-commerce-starter',
            DB::table('store_themes')->where('store_id', 'store-a')->value('theme_id')
        );
    }

    public function test_theme_switch_allowed_after_grant(): void
    {
        $this->seedCatalog();
        $this->insertStore('store-a', 'starter');
        $this->insertThemeRow('store-a');

        $store = \App\Models\Store::query()->findOrFail('store-a');
        app(ThemeEntitlementService::class)->grant(
            $store,
            'theme-souq-luxury-paid',
            ThemeEntitlementService::SOURCE_MASTER_GRANT
        );

        Sanctum::actingAs($this->memberOf('store-a'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/theme-settings', [
                'theme_id' => 'theme-souq-luxury-paid',
            ])
            ->assertOk()
            ->assertJsonPath('data.theme_id', 'theme-souq-luxury-paid');
    }

    public function test_plans_catalog_includes_starter_100_sar(): void
    {
        Sanctum::actingAs($this->memberOf('store-a', createStore: true));

        $res = $this->getJson('/api/plans')->assertOk();
        $starter = collect($res->json('data'))->firstWhere('code', 'starter');
        $this->assertNotNull($starter);
        $this->assertSame(100, (int) ($starter['price_sar'] ?? 0));
    }

    private function seedCatalog(): void
    {
        DB::table('themes_catalog')->insert([
            [
                'id' => 'theme-commerce-starter',
                'name' => 'Commerce Starter',
                'name_ar' => 'بداية التجارة',
                'tier' => 'basic',
                'price_sar' => 0,
                'included_in_tiers' => json_encode(['starter', 'pro', 'premium', 'custom', 'free', 'paid']),
                'is_default' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'theme-souq-luxury-paid',
                'name' => 'Souq Luxury Paid',
                'name_ar' => 'سوق فاخر مدفوع',
                'tier' => 'full',
                'price_sar' => 199,
                'included_in_tiers' => json_encode([]),
                'is_default' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        if (! DB::table('plans')->where('code', 'starter')->exists()) {
            DB::table('plans')->insert([
                'id' => 'plan-starter',
                'code' => 'starter',
                'name' => 'Starter',
                'price_sar' => 100,
                'product_limit' => 250,
                'storage_mb' => 2048,
                'team_seats' => 2,
                'features' => json_encode(['catalog', 'orders', 'themes_basic']),
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function insertStore(string $id, string $plan): void
    {
        DB::table('stores')->insert([
            'id' => $id,
            'name' => $id,
            'slug' => $id,
            'status' => 'active',
            'plan' => $plan,
            'currency' => 'SAR',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertThemeRow(string $storeId): void
    {
        DB::table('store_themes')->insert([
            'id' => 'sth-'.$storeId,
            'store_id' => $storeId,
            'theme_id' => 'theme-commerce-starter',
            'settings' => json_encode(['mode' => 'basic']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function memberOf(string $storeId, bool $createStore = false): User
    {
        if ($createStore && ! DB::table('stores')->where('id', $storeId)->exists()) {
            $this->insertStore($storeId, 'free');
        }

        $userId = 'user-'.$storeId.'-'.bin2hex(random_bytes(2));
        DB::table('users')->insert([
            'id' => $userId,
            'name' => $storeId,
            'email' => $userId.'@example.com',
            'password' => bcrypt('secret-pass'),
            'role' => 'store_staff',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('store_users')->insert([
            'id' => 'su-'.$userId,
            'store_id' => $storeId,
            'user_id' => $userId,
            'role' => 'store_staff',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return User::query()->findOrFail($userId);
    }
}

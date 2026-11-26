<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\SouqCommonThemes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SouqMarketplaceCt457Test extends TestCase
{
    use RefreshDatabase;

    public function test_public_plans_include_starter_pro_premium_sar(): void
    {
        $res = $this->getJson('/api/storefront/marketplace/plans')->assertOk();
        $codes = collect($res->json('data'))->pluck('code');
        $this->assertTrue($codes->contains('starter'));
        $this->assertTrue($codes->contains('pro'));
        $this->assertTrue($codes->contains('premium'));
        $starter = collect($res->json('data'))->firstWhere('code', 'starter');
        $this->assertSame(100, (int) $starter['price_sar']);
        $pro = collect($res->json('data'))->firstWhere('code', 'pro');
        $this->assertSame(300, (int) $pro['price_sar']);
        $premium = collect($res->json('data'))->firstWhere('code', 'premium');
        $this->assertSame(500, (int) $premium['price_sar']);
    }

    public function test_public_themes_seed_common_pack_with_prices(): void
    {
        SouqCommonThemes::ensureCatalogRows();

        $res = $this->getJson('/api/storefront/marketplace/themes')->assertOk();
        $ids = collect($res->json('data'))->pluck('id');
        $this->assertTrue($ids->contains('theme-souq-common-retail'));
        $this->assertTrue($ids->contains('theme-souq-common-boutique'));
        $boutique = collect($res->json('data'))->firstWhere('id', 'theme-souq-common-boutique');
        $this->assertSame(149, (int) $boutique['price_sar']);
        $this->assertFalse((bool) ($boutique['unlocked'] ?? true));
    }

    public function test_public_addons_price_first(): void
    {
        $res = $this->getJson('/api/storefront/marketplace/addons')->assertOk();
        $data = collect($res->json('data'));
        $this->assertTrue($data->contains(fn ($r) => ($r['id'] ?? '') === 'addon-ai-agent' && (int) $r['price_sar'] === 99));
        $this->assertTrue($data->every(fn ($r) => ($r['unlocked'] ?? true) === false));
    }

    public function test_purchase_theme_pending_then_master_grant_unlocks(): void
    {
        SouqCommonThemes::ensureCatalogRows();
        $this->insertStore('store-a', 'starter');

        Sanctum::actingAs($this->memberOf('store-a'));

        $pending = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/themes/theme-souq-common-boutique/purchase')
            ->assertOk();
        $this->assertTrue((bool) $pending->json('pending_payment'));

        // Still locked
        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/theme-settings', ['theme_id' => 'theme-souq-common-boutique'])
            ->assertForbidden();

        Sanctum::actingAs($this->masterUser());
        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/themes/theme-souq-common-boutique/purchase', [
                'source' => 'master_grant',
            ])
            ->assertCreated();

        Sanctum::actingAs($this->memberOf('store-a'));
        // Need store theme row first
        DB::table('store_themes')->insert([
            'id' => 'sth-store-a',
            'store_id' => 'store-a',
            'theme_id' => 'theme-souq-common-retail',
            'settings' => json_encode(['mode' => 'basic']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/theme-settings', ['theme_id' => 'theme-souq-common-boutique'])
            ->assertOk()
            ->assertJsonPath('data.theme_id', 'theme-souq-common-boutique');
    }

    public function test_store_addons_show_pricing_for_starter(): void
    {
        $this->insertStore('store-a', 'starter');
        Sanctum::actingAs($this->memberOf('store-a'));

        $res = $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/marketplace/addons')
            ->assertOk();

        $calling = collect($res->json('data'))->firstWhere('id', 'addon-ai-calling');
        $this->assertNotNull($calling);
        $this->assertSame(199, (int) $calling['price_sar']);
        $this->assertFalse((bool) $calling['unlocked']);
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

    private function memberOf(string $storeId): User
    {
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

    private function masterUser(): User
    {
        $userId = 'user-master-'.bin2hex(random_bytes(2));
        DB::table('users')->insert([
            'id' => $userId,
            'name' => 'Master',
            'email' => $userId.'@unityteck.com',
            'password' => bcrypt('secret-pass'),
            'role' => 'super_admin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return User::query()->findOrFail($userId);
    }
}

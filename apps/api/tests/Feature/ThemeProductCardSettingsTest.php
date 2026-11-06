<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeProductCardSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_card_switches_stay_draft_and_store_scoped(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');
        DB::table('themes_catalog')->insert([
            'id' => 'theme-commerce-starter',
            'name' => 'Starter',
            'is_default' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertTheme('store-a', [
            'featuredProducts' => [
                'showPrice' => true,
                'showTitle' => true,
                'showImage' => true,
                'showBadge' => true,
                'showRating' => true,
                'showStock' => true,
                'showAddToCart' => true,
            ],
        ]);
        $this->insertTheme('store-b', [
            'featuredProducts' => [
                'showPrice' => true,
                'showTitle' => true,
            ],
        ]);

        Sanctum::actingAs($this->memberOf('store-a'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-b/theme-settings', [
                'settings' => ['featuredProducts' => ['showPrice' => false]],
            ])
            ->assertForbidden();

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', [
                'store_id' => 'store-b',
                'settings' => ['featuredProducts' => ['showPrice' => false]],
            ])
            ->assertOk()
            ->assertJsonPath('store_id', 'store-a')
            ->assertJsonPath('data.settings.featuredProducts.showPrice', false)
            ->assertJsonPath('data.settings.featuredProducts.showTitle', true);

        $public = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $public->assertJsonPath('theme.settings.featuredProducts.showPrice', true);
        $public->assertJsonMissingPath('theme.products');
        $this->assertStringNotContainsString('false', (string) data_get($public->json(), 'theme.settings.featuredProducts.showPrice'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', [
                'settings' => ['featuredProducts' => ['showStock' => false]],
            ])
            ->assertOk()
            ->assertJsonPath('data.settings.featuredProducts.showPrice', false)
            ->assertJsonPath('data.settings.featuredProducts.showStock', false)
            ->assertJsonPath('data.settings.featuredProducts.showAddToCart', true);

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', ['publish' => true])
            ->assertOk();

        $live = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $live->assertJsonPath('theme.settings.featuredProducts.showPrice', false);
        $live->assertJsonPath('theme.settings.featuredProducts.showStock', false);
        $live->assertJsonPath('theme.settings.featuredProducts.showTitle', true);
        $live->assertJsonMissingPath('theme.settings.draft');
        $live->assertJsonMissingPath('theme.products');

        $other = $this->getJson('/api/storefront/theme?store_id=store-b')->assertOk();
        $other->assertJsonPath('theme.settings.featuredProducts.showPrice', true);
        $other->assertJsonPath('theme.settings.featuredProducts.showTitle', true);
    }

    private function insertStore(string $id, string $slug): void
    {
        DB::table('stores')->insert([
            'id' => $id,
            'name' => $id,
            'slug' => $slug,
            'status' => 'active',
            'plan' => 'free',
            'currency' => 'SAR',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertTheme(string $storeId, array $settings): void
    {
        DB::table('store_themes')->insert([
            'id' => 'sth-'.$storeId,
            'store_id' => $storeId,
            'theme_id' => 'theme-commerce-starter',
            'settings' => json_encode($settings),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function memberOf(string $storeId): User
    {
        $userId = 'user-'.$storeId;
        DB::table('users')->insert([
            'id' => $userId,
            'name' => $storeId,
            'email' => $storeId.'@example.com',
            'password' => bcrypt('secret-pass'),
            'role' => 'store_staff',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('store_users')->insert([
            'id' => 'su-'.$storeId,
            'store_id' => $storeId,
            'user_id' => $userId,
            'role' => 'store_staff',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return User::query()->findOrFail($userId);
    }
}

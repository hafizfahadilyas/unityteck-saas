<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeCatalogControlsTest extends TestCase
{
    use RefreshDatabase;

    public function test_shop_checkout_and_seo_defaults_stay_store_scoped(): void
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
            'shop' => [
                'columnsDesktop' => 4,
                'columnsTablet' => 3,
                'columnsMobile' => 2,
                'perPage' => 24,
                'defaultSort' => 'featured',
                'showFilters' => true,
            ],
            'checkoutFields' => [
                'allowGuest' => true,
                'showCoupon' => true,
                'showOrderNote' => false,
                'showShipping' => true,
            ],
        ]);
        $this->insertTheme('store-b', [
            'shop' => [
                'columnsDesktop' => 4,
                'columnsMobile' => 2,
                'showFilters' => true,
            ],
        ]);
        DB::table('products')->insert([
            'id' => 'prod-a',
            'store_id' => 'store-a',
            'name' => 'Hibrew kept name',
            'name_ar' => 'اسم المنتج',
            'slug' => 'hibrew-kept',
            'description' => 'Kept product description',
            'price' => 100,
            'sku' => 'HB-KEPT',
            'stock' => 3,
            'seo_title' => 'Product SEO title',
            'seo_description' => 'Product SEO description',
            'status' => 'published',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($this->memberOf('store-a'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-b/theme-settings', [
                'settings' => ['shop' => ['columnsMobile' => 1]],
            ])
            ->assertForbidden();

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', [
                'store_id' => 'store-b',
                'settings' => [
                    'shop' => ['columnsMobile' => 1],
                    'checkoutFields' => ['showCoupon' => false, 'showOrderNote' => true],
                    'seoDefaults' => [
                        'titleEn' => 'Shop title EN',
                        'titleAr' => 'عنوان المتجر',
                        'descriptionEn' => 'Shop description EN',
                        'descriptionAr' => 'وصف المتجر',
                        'ogImage' => 'https://cdn.example/stores/store-a/og.jpg?v=1',
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('store_id', 'store-a')
            ->assertJsonPath('data.settings.shop.columnsMobile', 1)
            ->assertJsonPath('data.settings.shop.columnsDesktop', 4)
            ->assertJsonPath('data.settings.checkoutFields.showCoupon', false)
            ->assertJsonPath('data.settings.checkoutFields.showShipping', true)
            ->assertJsonPath('data.settings.seoDefaults.titleEn', 'Shop title EN')
            ->assertJsonPath('data.settings.seoDefaults.titleAr', 'عنوان المتجر');

        $public = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $public->assertJsonPath('theme.settings.shop.columnsMobile', 2);
        $public->assertJsonPath('theme.settings.shop.columnsDesktop', 4);
        $public->assertJsonPath('theme.settings.checkoutFields.showCoupon', true);
        $public->assertJsonMissingPath('theme.settings.draft');
        $public->assertJsonMissingPath('theme.settings.seoDefaults');

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', ['publish' => true])
            ->assertOk();

        $live = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $live->assertJsonPath('theme.settings.shop.columnsMobile', 1);
        $live->assertJsonPath('theme.settings.shop.columnsDesktop', 4);
        $live->assertJsonPath('theme.settings.checkoutFields.showCoupon', false);
        $live->assertJsonPath('theme.settings.checkoutFields.showOrderNote', true);
        $live->assertJsonPath('theme.settings.checkoutFields.showShipping', true);
        $live->assertJsonPath('theme.settings.seoDefaults.titleAr', 'عنوان المتجر');
        $live->assertJsonPath('theme.settings.seoDefaults.descriptionEn', 'Shop description EN');
        $live->assertJsonMissingPath('theme.settings.draft');

        $product = DB::table('products')->where('id', 'prod-a')->first();
        $this->assertSame('Hibrew kept name', $product->name);
        $this->assertSame('Kept product description', $product->description);
        $this->assertSame('Product SEO title', $product->seo_title);
        $this->assertSame('Product SEO description', $product->seo_description);

        $other = $this->getJson('/api/storefront/theme?store_id=store-b')->assertOk();
        $other->assertJsonPath('theme.settings.shop.columnsDesktop', 4);
        $other->assertJsonPath('theme.settings.shop.columnsMobile', 2);
        $other->assertJsonMissingPath('theme.settings.seoDefaults');
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

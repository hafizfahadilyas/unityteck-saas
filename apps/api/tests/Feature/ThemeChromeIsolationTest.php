<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * CT-07 — Coffee chrome (announcement + footer + builder) must not leak into store B.
 */
class ThemeChromeIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_announcement_footer_and_builder_stay_store_scoped(): void
    {
        $this->insertStore('store-coffee', 'store-coffee');
        $this->insertStore('store-bleco', 'store-bleco');
        DB::table('themes_catalog')->insert([
            'id' => 'theme-coffee-artisan',
            'name' => 'Coffee Artisan',
            'category' => 'Coffee',
            'preview_color' => '#173B35',
            'is_default' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('themes_catalog')->insert([
            'id' => 'theme-bleco',
            'name' => 'Bleco',
            'category' => 'Transport',
            'preview_color' => '#111111',
            'is_default' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->insertTheme('store-coffee', 'theme-coffee-artisan', [
            'announcementBar' => [
                'enabled' => true,
                'messages' => [['id' => 'a1', 'textEn' => 'COFFEE-ANN-MARKER', 'textAr' => 'إعلان-قهوة', 'active' => true]],
            ],
            'footer' => [
                'enabled' => true,
                'aboutEn' => 'COFFEE-FOOT-MARKER',
                'aboutAr' => 'تذييل-قهوة',
            ],
        ]);
        $this->insertTheme('store-bleco', 'theme-bleco', [
            'announcementBar' => [
                'enabled' => true,
                'messages' => [['id' => 'b1', 'textEn' => 'BLECO-ANN-MARKER', 'textAr' => 'إعلان-بليكو', 'active' => true]],
            ],
            'footer' => [
                'enabled' => true,
                'aboutEn' => 'BLECO-FOOT-MARKER',
                'aboutAr' => 'تذييل-بليكو',
            ],
        ]);

        Sanctum::actingAs($this->memberOf('store-coffee'));
        $this->withHeader('X-Store-Id', 'store-coffee')
            ->putJson('/api/stores/store-coffee/builder-layout', [
                'theme_id' => 'theme-coffee-artisan',
                'blocks' => [[
                    'id' => 'hero_banners',
                    'type' => 'hero_banners',
                    'titleEn' => 'COFFEE-HERO-MARKER',
                    'titleAr' => 'بطل-قهوة',
                    'visible' => true,
                ]],
                'is_published' => false,
            ])
            ->assertOk()
            ->assertJsonPath('store_id', 'store-coffee');

        // Foreign URL / wrong store header blocked
        $this->withHeader('X-Store-Id', 'store-coffee')
            ->putJson('/api/stores/store-bleco/theme-settings', [
                'settings' => [
                    'announcementBar' => [
                        'messages' => [['id' => 'x', 'textEn' => 'LEAK', 'active' => true]],
                    ],
                ],
            ])
            ->assertForbidden();

        // Body store_id ignored — stays coffee
        $this->withHeader('X-Store-Id', 'store-coffee')
            ->putJson('/api/stores/store-coffee/theme-settings', [
                'store_id' => 'store-bleco',
                'theme_id' => 'theme-coffee-artisan',
                'settings' => [
                    'announcementBar' => [
                        'enabled' => true,
                        'messages' => [['id' => 'a2', 'textEn' => 'COFFEE-ANN-UPDATED', 'textAr' => 'إعلان-محدث', 'active' => true]],
                    ],
                    'footer' => [
                        'enabled' => true,
                        'aboutEn' => 'COFFEE-FOOT-UPDATED',
                        'aboutAr' => 'تذييل-محدث',
                    ],
                ],
                'publish' => true,
            ])
            ->assertOk()
            ->assertJsonPath('store_id', 'store-coffee');

        $coffeePublic = $this->getJson('/api/storefront/theme?store_id=store-coffee')->assertOk();
        $coffeeJson = $coffeePublic->getContent();
        $this->assertStringContainsString('COFFEE-ANN-UPDATED', $coffeeJson);
        $this->assertStringContainsString('COFFEE-FOOT-UPDATED', $coffeeJson);
        $this->assertStringNotContainsString('BLECO-ANN-MARKER', $coffeeJson);
        $this->assertStringNotContainsString('BLECO-FOOT-MARKER', $coffeeJson);

        $blecoPublic = $this->getJson('/api/storefront/theme?store_id=store-bleco')->assertOk();
        $blecoJson = $blecoPublic->getContent();
        $this->assertStringContainsString('BLECO-ANN-MARKER', $blecoJson);
        $this->assertStringContainsString('BLECO-FOOT-MARKER', $blecoJson);
        $this->assertStringNotContainsString('COFFEE-ANN-UPDATED', $blecoJson);
        $this->assertStringNotContainsString('COFFEE-FOOT-UPDATED', $blecoJson);
        $this->assertStringNotContainsString('COFFEE-HERO-MARKER', $blecoJson);

        Sanctum::actingAs($this->memberOf('store-bleco'));
        $blecoBuilder = $this->withHeader('X-Store-Id', 'store-bleco')
            ->getJson('/api/stores/store-bleco/builder-layout')
            ->assertOk();
        $titles = collect($blecoBuilder->json('data.blocks'))->pluck('titleEn')->all();
        $this->assertNotContains('COFFEE-HERO-MARKER', $titles);
        $this->assertSame('store-bleco', $blecoBuilder->json('store_id'));
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

    private function insertTheme(string $storeId, string $themeId, array $settings): void
    {
        DB::table('store_themes')->insert([
            'id' => 'sth-'.$storeId,
            'store_id' => $storeId,
            'theme_id' => $themeId,
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

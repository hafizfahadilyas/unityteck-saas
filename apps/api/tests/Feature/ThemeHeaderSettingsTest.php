<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeHeaderSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_header_logo_and_separate_navs_save_per_store(): void
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
            'customHeader' => [
                'logo' => ['titleEn' => 'LIVELOGO', 'titleAr' => 'حي'],
                'navigation' => [
                    'desktopLinks' => [[
                        'id' => 'd1',
                        'labelEn' => 'LIVE DESK',
                        'labelAr' => 'مكتب',
                        'url' => 'home',
                        'active' => true,
                    ]],
                    'mobileLinks' => [[
                        'id' => 'm1',
                        'labelEn' => 'LIVE MOB',
                        'labelAr' => 'جوال',
                        'url' => 'home',
                        'active' => true,
                    ]],
                ],
            ],
        ]);
        $this->insertTheme('store-b', [
            'customHeader' => [
                'logo' => ['titleEn' => 'OTHERLOGO'],
                'navigation' => [
                    'desktopLinks' => [[
                        'id' => 'b1',
                        'labelEn' => 'OTHER DESK',
                        'labelAr' => 'اخر',
                        'active' => true,
                    ]],
                ],
            ],
        ]);

        Sanctum::actingAs($this->memberOf('store-a'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-b/theme-settings', [
                'settings' => ['customHeader' => ['logo' => ['titleEn' => 'SHOPLOGO']]],
            ])
            ->assertForbidden();

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', [
                'store_id' => 'store-b',
                'settings' => [
                    'customHeader' => [
                        'logo' => ['titleEn' => 'SHOPLOGO', 'titleAr' => 'شعار', 'applyTitle' => true],
                        'navigation' => [
                            'desktopLinks' => [[
                                'id' => 'd2',
                                'labelEn' => 'DeskLink',
                                'labelAr' => 'سطح',
                                'url' => 'products',
                                'active' => true,
                            ]],
                            'mobileLinks' => [[
                                'id' => 'm2',
                                'labelEn' => 'MobLink',
                                'labelAr' => 'قائمة',
                                'url' => 'home',
                                'active' => true,
                            ]],
                        ],
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('store_id', 'store-a')
            ->assertJsonPath('data.settings.customHeader.logo.titleEn', 'SHOPLOGO')
            ->assertJsonPath('data.settings.customHeader.navigation.desktopLinks.0.labelEn', 'DeskLink')
            ->assertJsonPath('data.settings.customHeader.navigation.mobileLinks.0.labelEn', 'MobLink');

        $public = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $public->assertJsonPath('theme.settings.customHeader.logo.titleEn', 'LIVELOGO');
        $public->assertJsonPath('theme.settings.customHeader.navigation.desktopLinks.0.labelEn', 'LIVE DESK');
        $this->assertStringNotContainsString('DeskLink', $public->getContent());
        $this->assertStringNotContainsString('MobLink', $public->getContent());
        $this->assertStringNotContainsString('SHOPLOGO', $public->getContent());

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', [
                'settings' => [
                    'customHeader' => [
                        'navigation' => [
                            'mobileLinks' => [[
                                'id' => 'm3',
                                'labelEn' => 'MobOnly',
                                'labelAr' => 'جوال فقط',
                                'url' => 'cart',
                                'active' => true,
                            ]],
                        ],
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.settings.customHeader.navigation.desktopLinks.0.labelEn', 'DeskLink')
            ->assertJsonPath('data.settings.customHeader.navigation.mobileLinks.0.labelEn', 'MobOnly')
            ->assertJsonPath('data.settings.customHeader.logo.titleEn', 'SHOPLOGO');

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', ['publish' => true])
            ->assertOk();

        $live = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $live->assertJsonPath('theme.settings.customHeader.logo.titleEn', 'SHOPLOGO');
        $live->assertJsonPath('theme.settings.customHeader.navigation.desktopLinks.0.labelEn', 'DeskLink');
        $live->assertJsonPath('theme.settings.customHeader.navigation.mobileLinks.0.labelEn', 'MobOnly');
        $live->assertJsonMissingPath('theme.settings.draft');

        $other = $this->getJson('/api/storefront/theme?store_id=store-b')->assertOk();
        $other->assertJsonPath('theme.settings.customHeader.logo.titleEn', 'OTHERLOGO');
        $other->assertJsonPath('theme.settings.customHeader.navigation.desktopLinks.0.labelEn', 'OTHER DESK');
        $this->assertStringNotContainsString('DeskLink', $other->getContent());
        $this->assertStringNotContainsString('SHOPLOGO', $other->getContent());
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

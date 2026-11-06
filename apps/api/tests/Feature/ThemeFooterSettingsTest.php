<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeFooterSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_footer_shows_on_global_pages_only_and_stays_store_scoped(): void
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
            'footer' => [
                'copyrightEn' => 'LIVE FOOT',
                'copyrightAr' => 'حي',
                'addressEn' => 'Riyadh',
                'addressAr' => 'الرياض',
                'newsletterTitleEn' => 'News',
                'paymentsEn' => 'Mada',
            ],
        ]);
        $this->insertTheme('store-b', [
            'footer' => [
                'copyrightEn' => 'OTHER FOOT',
                'copyrightAr' => 'اخر',
            ],
        ]);
        $this->insertPage('store-a', 'home', 'global');
        $this->insertPage('store-a', 'bare', 'hidden');
        $this->insertPage('store-b', 'home', 'global');

        Sanctum::actingAs($this->memberOf('store-a'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-b/theme-settings', [
                'settings' => ['footer' => ['copyrightEn' => 'DRAFT FOOT']],
            ])
            ->assertForbidden();

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', [
                'store_id' => 'store-b',
                'settings' => [
                    'footer' => [
                        'copyrightEn' => 'DRAFT FOOT',
                        'copyrightAr' => 'مسودة',
                        'contactEmail' => 'a@store-a.test',
                        'contactPhone' => '966500000001',
                        'newsletterTitleEn' => 'Draft news',
                        'newsletterTitleAr' => 'نشرة',
                        'paymentsEn' => 'Mada Visa',
                        'paymentsAr' => 'مدى',
                        'showPaymentIcons' => true,
                        'columns' => [[
                            'id' => 'col-1',
                            'titleEn' => 'Help',
                            'titleAr' => 'مساعدة',
                            'links' => [[
                                'id' => 'lnk-1',
                                'labelEn' => 'Contact',
                                'labelAr' => 'تواصل',
                                'url' => 'contact',
                            ]],
                        ]],
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('store_id', 'store-a')
            ->assertJsonPath('data.settings.footer.copyrightEn', 'DRAFT FOOT')
            ->assertJsonPath('data.settings.footer.addressEn', 'Riyadh');

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', [
                'settings' => ['footer' => ['addressAr' => 'جدة']],
            ])
            ->assertOk()
            ->assertJsonPath('data.settings.footer.addressEn', 'Riyadh')
            ->assertJsonPath('data.settings.footer.addressAr', 'جدة')
            ->assertJsonPath('data.settings.footer.copyrightEn', 'DRAFT FOOT');

        $draftPage = $this->getJson('/api/storefront/theme?store_id=store-a&slug=home')->assertOk();
        $draftPage->assertJsonPath('page.footer_mode', 'global');
        $draftPage->assertJsonPath('footer.copyrightEn', 'LIVE FOOT');
        $this->assertStringNotContainsString('DRAFT FOOT', $draftPage->getContent());

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', ['publish' => true])
            ->assertOk();

        $home = $this->getJson('/api/storefront/theme?store_id=store-a&slug=home')->assertOk();
        $home->assertJsonPath('footer.copyrightEn', 'DRAFT FOOT');
        $home->assertJsonPath('footer.copyrightAr', 'مسودة');
        $home->assertJsonPath('footer.contactEmail', 'a@store-a.test');
        $home->assertJsonPath('footer.newsletterTitleEn', 'Draft news');
        $home->assertJsonPath('footer.paymentsAr', 'مدى');
        $home->assertJsonPath('footer.columns.0.links.0.labelEn', 'Contact');
        $home->assertJsonPath('footer.addressEn', 'Riyadh');
        $home->assertJsonPath('footer.addressAr', 'جدة');

        $hidden = $this->getJson('/api/storefront/theme?store_id=store-a&slug=bare')->assertOk();
        $hidden->assertJsonPath('page.footer_mode', 'hidden');
        $hidden->assertJsonPath('footer', null);
        $this->assertStringNotContainsString('DRAFT FOOT', $hidden->getContent());

        $other = $this->getJson('/api/storefront/theme?store_id=store-b&slug=home')->assertOk();
        $other->assertJsonPath('footer.copyrightEn', 'OTHER FOOT');
        $this->assertStringNotContainsString('DRAFT FOOT', $other->getContent());
        $this->assertStringNotContainsString('a@store-a.test', $other->getContent());
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

    private function insertPage(string $storeId, string $slug, string $footerMode): void
    {
        DB::table('theme_pages')->insert([
            'id' => 'page-'.$storeId.'-'.$slug,
            'store_id' => $storeId,
            'slug' => $slug,
            'type' => 'custom',
            'title_en' => $slug,
            'published_layout' => json_encode(['sections' => []]),
            'header_mode' => 'global',
            'footer_mode' => $footerMode,
            'status' => 'published',
            'published_at' => now(),
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

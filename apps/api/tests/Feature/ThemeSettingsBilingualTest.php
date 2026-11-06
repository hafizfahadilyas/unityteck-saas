<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeSettingsBilingualTest extends TestCase
{
    use RefreshDatabase;

    public function test_arabic_field_save_keeps_english_sibling(): void
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
        $this->insertTheme('store-a', ['hero' => ['titleEn' => 'HELLO', 'titleAr' => 'اهلا']]);
        $this->insertTheme('store-b', ['hero' => ['titleEn' => 'OTHER', 'titleAr' => 'اخر']]);

        $user = $this->memberOf('store-a');
        Sanctum::actingAs($user);

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', [
                'settings' => ['hero' => ['titleAr' => 'جديد']],
            ])
            ->assertOk()
            ->assertJsonPath('data.settings.hero.titleEn', 'HELLO')
            ->assertJsonPath('data.settings.hero.titleAr', 'جديد');

        $reloaded = $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/stores/store-a/theme-settings')
            ->assertOk();
        $reloaded->assertJsonPath('data.settings.hero.titleEn', 'HELLO');
        $reloaded->assertJsonPath('data.settings.hero.titleAr', 'جديد');

        $public = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $public->assertJsonPath('theme.settings.hero.titleEn', 'HELLO');
        $public->assertJsonPath('theme.settings.hero.titleAr', 'اهلا');
        $this->assertStringNotContainsString('جديد', $public->getContent());

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', ['publish' => true])
            ->assertOk();

        $live = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $live->assertJsonPath('theme.settings.hero.titleEn', 'HELLO');
        $live->assertJsonPath('theme.settings.hero.titleAr', 'جديد');

        $other = $this->getJson('/api/storefront/theme?store_id=store-b')->assertOk();
        $other->assertJsonPath('theme.settings.hero.titleEn', 'OTHER');
        $other->assertJsonPath('theme.settings.hero.titleAr', 'اخر');
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

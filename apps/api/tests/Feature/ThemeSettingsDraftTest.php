<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeSettingsDraftTest extends TestCase
{
    use RefreshDatabase;

    public function test_customizer_save_stays_draft_until_publish(): void
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
        $this->insertTheme('store-a', ['announcement' => 'LIVE SENTENCE']);
        $this->insertTheme('store-b', ['announcement' => 'OTHER SENTENCE']);

        $user = $this->memberOf('store-a');
        Sanctum::actingAs($user);

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-b/theme-settings', [
                'settings' => ['announcement' => 'DRAFT SENTENCE'],
            ])
            ->assertForbidden();

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', [
                'store_id' => 'store-b',
                'settings' => ['announcement' => 'DRAFT SENTENCE'],
            ])
            ->assertOk()
            ->assertJsonPath('data.settings.announcement', 'DRAFT SENTENCE')
            ->assertJsonPath('store_id', 'store-a');

        $public = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $this->assertStringNotContainsString('DRAFT SENTENCE', $public->getContent());
        $public->assertJsonPath('theme.settings.announcement', 'LIVE SENTENCE');
        $public->assertJsonMissingPath('theme.settings.draft');

        $auth = $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/stores/store-a/theme-settings')
            ->assertOk();
        $auth->assertJsonPath('data.settings.announcement', 'DRAFT SENTENCE');

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', ['publish' => true])
            ->assertOk();

        $live = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $live->assertJsonPath('theme.settings.announcement', 'DRAFT SENTENCE');
        $this->assertStringNotContainsString('LIVE SENTENCE', $live->getContent());
        $live->assertJsonMissingPath('theme.settings.draft');

        $other = $this->getJson('/api/storefront/theme?store_id=store-b')->assertOk();
        $other->assertJsonPath('theme.settings.announcement', 'OTHER SENTENCE');
        $this->assertStringNotContainsString('DRAFT SENTENCE', $other->getContent());
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

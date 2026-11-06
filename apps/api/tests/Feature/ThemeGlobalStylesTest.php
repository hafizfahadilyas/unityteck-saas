<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeGlobalStylesTest extends TestCase
{
    use RefreshDatabase;

    public function test_tokens_stay_draft_and_do_not_paint_the_page_background(): void
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
        $this->insertTheme('store-a', ['colors' => ['headerBgColor' => '#FFFFFF']]);
        $this->insertTheme('store-b', ['colors' => ['button' => '#010101']]);

        $user = $this->memberOf('store-a');
        Sanctum::actingAs($user);

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-b/global-styles', [
                'styles' => ['colors' => ['button' => '#222222']],
            ])
            ->assertForbidden();

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/global-styles', [
                'store_id' => 'store-b',
                'styles' => [
                    'fontFamily' => 'Cairo',
                    'radius' => 12,
                    'containerWidth' => 1200,
                    'colors' => ['button' => '#222222', 'background' => '#111111'],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('store_id', 'store-a')
            ->assertJsonPath('data.colors.button', '#222222')
            ->assertJsonPath('paintPageBackground', false);

        $public = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $public->assertJsonPath('theme.paintPageBackground', false);
        $this->assertStringNotContainsString('#222222', $public->getContent());
        $this->assertStringNotContainsString('#111111', $public->getContent());

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', [
                'settings' => ['globalStyles' => ['colors' => ['background' => '#111111']]],
            ])
            ->assertOk();

        $stored = json_decode((string) DB::table('store_themes')->where('store_id', 'store-a')->value('settings'), true);
        $this->assertIsArray($stored);
        $this->assertArrayNotHasKey('globalStyles', $stored['draft'] ?? []);
        $this->assertArrayNotHasKey('globalStyles', $stored);

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/global-styles', ['publish' => true])
            ->assertOk();

        $live = $this->getJson('/api/storefront/theme?store_id=store-a')->assertOk();
        $live->assertJsonPath('theme.tokens.colors.button', '#222222');
        $live->assertJsonPath('theme.tokens.fontFamily', 'Cairo');
        $live->assertJsonPath('theme.tokens.radius', 12);
        $live->assertJsonPath('theme.tokens.containerWidth', 1200);
        $live->assertJsonPath('theme.paintPageBackground', false);
        $live->assertJsonMissingPath('theme.tokens.draft');

        $other = $this->getJson('/api/storefront/theme?store_id=store-b')->assertOk();
        $other->assertJsonPath('theme.tokens', []);
        $this->assertStringNotContainsString('#222222', $other->getContent());
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

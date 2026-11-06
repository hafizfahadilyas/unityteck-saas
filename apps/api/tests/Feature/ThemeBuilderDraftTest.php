<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeBuilderDraftTest extends TestCase
{
    use RefreshDatabase;

    public function test_saved_draft_is_returned_for_that_store_only(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');
        DB::table('themes_catalog')->insert([
            'id' => 'theme-commerce-starter',
            'name' => 'Commerce Starter',
            'category' => 'General',
            'preview_color' => '#1d8b94',
            'is_default' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($this->memberOf('store-a'));
        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/builder-layout', [
                'theme_id' => 'theme-commerce-starter',
                'blocks' => [[
                    'id' => 'hero',
                    'type' => 'heading',
                    'titleEn' => 'Draft from A',
                    'titleAr' => 'مسودة أ',
                    'visible' => true,
                ]],
                'is_published' => false,
            ])
            ->assertOk();

        $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/stores/store-a/builder-layout')
            ->assertOk()
            ->assertJsonPath('data.blocks.0.titleEn', 'Draft from A')
            ->assertJsonPath('store_id', 'store-a');

        $this->getJson('/api/storefront/theme?store_id=store-a')
            ->assertOk()
            ->assertJsonPath('theme.blocks', []);

        Sanctum::actingAs($this->memberOf('store-b'));
        $other = $this->withHeader('X-Store-Id', 'store-b')
            ->getJson('/api/stores/store-b/builder-layout')
            ->assertOk();

        $titles = collect($other->json('data.blocks'))->pluck('titleEn')->all();
        $this->assertNotContains('Draft from A', $titles);
        $this->assertSame('store-b', $other->json('store_id'));
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

<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeCustomPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_custom_page_starts_empty_and_slug_is_unique_per_store(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');

        Sanctum::actingAs($this->memberOf('store-a'));

        $created = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'offers',
                'type' => 'custom',
                'store_id' => 'store-b',
                'title_en' => 'Offers',
                'draft_layout' => ['sections' => [['id' => 'stolen']]],
                'header_mode' => 'custom',
                'footer_mode' => 'custom',
            ])
            ->assertCreated()
            ->assertJsonPath('store_id', 'store-a')
            ->assertJsonPath('data.header_mode', 'global')
            ->assertJsonPath('data.footer_mode', 'global')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.draft_layout.sections', []);

        $this->assertSame('store-a', $created->json('data.store_id'));
        $this->assertNull($created->json('data.published_layout'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'offers',
                'type' => 'custom',
            ])
            ->assertStatus(422);

        Sanctum::actingAs($this->memberOf('store-b'));
        $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages', [
                'slug' => 'offers',
                'type' => 'custom',
                'title_en' => 'Store B offers',
            ])
            ->assertCreated()
            ->assertJsonPath('store_id', 'store-b')
            ->assertJsonPath('data.title_en', 'Store B offers')
            ->assertJsonPath('data.draft_layout.sections', []);

        $this->withHeader('X-Store-Id', 'store-b')
            ->getJson('/api/stores/store-a/pages')
            ->assertForbidden();

        $own = $this->withHeader('X-Store-Id', 'store-b')
            ->getJson('/api/stores/store-b/pages')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $own);
        $this->assertSame('Store B offers', $own[0]['title_en']);
        $this->assertSame(1, DB::table('theme_pages')->where('store_id', 'store-a')->where('slug', 'offers')->count());
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

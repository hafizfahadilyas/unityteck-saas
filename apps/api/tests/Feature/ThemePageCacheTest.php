<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\ThemeCache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemePageCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_publish_refreshes_only_that_store_cache(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');
        $userA = $this->memberOf('store-a');
        $userB = $this->memberOf('store-b');

        Sanctum::actingAs($userA);
        $pageA = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'about',
                'type' => 'about',
                'draft_layout' => ['sections' => [['id' => 'one']]],
            ])
            ->assertCreated()
            ->json('data.id');

        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$pageA.'/publish')
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        Sanctum::actingAs($userB);
        $pageB = $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages', [
                'slug' => 'about',
                'type' => 'about',
                'draft_layout' => ['sections' => [['id' => 'bee']]],
            ])
            ->assertCreated()
            ->json('data.id');

        $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages/'.$pageB.'/publish')
            ->assertOk();

        $this->getJson('/api/storefront/theme?store_id=store-a&slug=about')
            ->assertOk()
            ->assertJsonPath('page.published_layout.sections.0.id', 'one');
        $this->getJson('/api/storefront/theme?store_id=store-b&slug=about')
            ->assertOk()
            ->assertJsonPath('page.published_layout.sections.0.id', 'bee');

        $this->assertTrue(Cache::has(ThemeCache::pageKey('store-a', 'about')));
        $this->assertTrue(Cache::has(ThemeCache::pageKey('store-b', 'about')));
        Cache::put(ThemeCache::themeKey('store-a'), ['stale' => true], 60);
        Cache::put(ThemeCache::themeKey('store-b'), ['keep' => true], 60);

        Sanctum::actingAs($userA);
        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$pageA, [
                'draft_layout' => ['sections' => [['id' => 'two']]],
            ])
            ->assertOk();
        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$pageA.'/publish')
            ->assertOk();

        $this->assertFalse(Cache::has(ThemeCache::pageKey('store-a', 'about')));
        $this->assertFalse(Cache::has(ThemeCache::themeKey('store-a')));
        $this->assertTrue(Cache::has(ThemeCache::pageKey('store-b', 'about')));
        $this->assertTrue(Cache::has(ThemeCache::themeKey('store-b')));
        $this->assertGreaterThanOrEqual(2, DB::table('theme_revisions')->where('store_id', 'store-a')->count());
        $this->assertSame(1, DB::table('theme_revisions')->where('store_id', 'store-b')->count());

        $this->getJson('/api/storefront/theme?store_id=store-a&slug=about')
            ->assertOk()
            ->assertJsonPath('page.published_layout.sections.0.id', 'two');
        $this->getJson('/api/storefront/theme?store_id=store-b&slug=about')
            ->assertOk()
            ->assertJsonPath('page.published_layout.sections.0.id', 'bee');
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

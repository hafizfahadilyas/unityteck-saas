<?php

namespace Tests\Feature;

use App\Models\ThemePage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemePageIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_b_token_cannot_read_or_write_store_a_pages(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');
        $user = $this->memberOf('store-b');

        DB::table('theme_pages')->insert([
            'id' => 'page-a',
            'store_id' => 'store-a',
            'slug' => 'about',
            'type' => 'about',
            'title_en' => 'A about',
            'header_mode' => 'global',
            'footer_mode' => 'global',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/stores/store-a/pages')
            ->assertStatus(403);

        $this->withHeader('X-Store-Id', 'store-b')
            ->getJson('/api/stores/store-a/pages')
            ->assertStatus(403);

        $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'faq',
                'type' => 'faq',
                'store_id' => 'store-a',
            ])
            ->assertStatus(403);

        $this->withHeader('X-Store-Id', 'store-b')
            ->putJson('/api/stores/store-a/pages/page-a', [
                'title_en' => 'stolen',
                'store_id' => 'store-b',
            ])
            ->assertStatus(403);

        $this->assertSame('A about', DB::table('theme_pages')->where('id', 'page-a')->value('title_en'));
    }

    public function test_body_store_id_is_ignored_and_list_stays_on_member_store(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');
        $user = $this->memberOf('store-b');

        DB::table('theme_pages')->insert([
            'id' => 'page-a',
            'store_id' => 'store-a',
            'slug' => 'about',
            'type' => 'about',
            'title_en' => 'A about',
            'header_mode' => 'global',
            'footer_mode' => 'global',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $created = $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages', [
                'slug' => 'contact',
                'type' => 'contact',
                'title_en' => 'B contact',
                'store_id' => 'store-a',
            ])
            ->assertCreated()
            ->json('data');

        $this->assertSame('store-b', $created['store_id']);
        $this->assertSame(0, ThemePage::withoutGlobalScope('store')->where('store_id', 'store-a')->where('slug', 'contact')->count());

        $this->withHeader('X-Store-Id', 'store-b')
            ->putJson('/api/stores/store-b/pages/page-a', [
                'title_en' => 'nope',
            ])
            ->assertStatus(404);

        $list = $this->withHeader('X-Store-Id', 'store-b')
            ->getJson('/api/stores/store-b/pages')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $list);
        $this->assertSame('contact', $list[0]['slug']);
        $this->assertSame('A about', DB::table('theme_pages')->where('id', 'page-a')->value('title_en'));
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
};

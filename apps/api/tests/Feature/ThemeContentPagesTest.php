<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeContentPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_empty_store_has_no_pages_and_does_not_receive_another_store(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');
        $userA = $this->memberOf('store-a');
        $userB = $this->memberOf('store-b');

        Sanctum::actingAs($userA);
        $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/stores/store-a/pages')
            ->assertOk()
            ->assertJsonPath('data', []);

        Sanctum::actingAs($userB);
        $created = $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages', [
                'slug' => 'privacy-policy',
                'type' => 'custom',
                'title_en' => 'Store B privacy',
                'title_ar' => 'خصوصية ب',
                'draft_layout' => ['contentEn' => 'B only', 'contentAr' => 'ب فقط'],
                'published_layout' => ['contentEn' => 'B only', 'contentAr' => 'ب فقط'],
                'status' => 'published',
            ])
            ->assertCreated()
            ->json('data');

        Sanctum::actingAs($userA);
        $list = $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/stores/store-a/pages')
            ->assertOk()
            ->json('data');
        $this->assertSame([], $list);

        $this->withHeader('X-Store-Id', 'store-a')
            ->deleteJson('/api/stores/store-a/pages/'.$created['id'])
            ->assertStatus(404);

        Sanctum::actingAs($userB);
        $this->withHeader('X-Store-Id', 'store-b')
            ->getJson('/api/stores/store-b/pages/privacy-policy')
            ->assertOk()
            ->assertJsonPath('data.title_en', 'Store B privacy');
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

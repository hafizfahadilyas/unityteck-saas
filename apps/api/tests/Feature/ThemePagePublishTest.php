<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemePagePublishTest extends TestCase
{
    use RefreshDatabase;

    public function test_draft_is_auth_only_and_public_returns_published_layout_only(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');

        $this->getJson('/api/stores/store-a/pages/about')->assertUnauthorized();
        $this->getJson('/api/storefront/theme?store_id=missing-store&slug=about')->assertNotFound();

        $user = $this->memberOf('store-a');
        Sanctum::actingAs($user);

        $created = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'about',
                'type' => 'about',
                'title_en' => 'About',
                'draft_layout' => ['sections' => [['id' => 'live']]],
            ])
            ->assertCreated()
            ->json('data');

        $this->getJson('/api/storefront/theme?store_id=store-a&slug=about')->assertNotFound();

        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$created['id'].'/publish')
            ->assertOk();

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$created['id'], [
                'draft_layout' => ['sections' => [['id' => 'draft-only']]],
            ])
            ->assertOk();

        $public = $this->getJson('/api/storefront/theme?store_id=store-a&slug=about')->assertOk();
        $public->assertJsonPath('page.published_layout.sections.0.id', 'live');
        $this->assertArrayNotHasKey('draft_layout', $public->json('page'));

        $draft = $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/stores/store-a/pages/about')
            ->assertOk();
        $draft->assertJsonPath('data.draft_layout.sections.0.id', 'draft-only');

        $this->getJson('/api/storefront/theme?store_id=missing-store&slug=about')->assertNotFound();
        $this->getJson('/api/storefront/theme?store_id=store-b&slug=about')->assertNotFound();
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

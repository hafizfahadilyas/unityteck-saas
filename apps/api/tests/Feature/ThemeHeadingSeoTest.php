<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeHeadingSeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_publish_warns_when_h1_count_is_not_one_and_stays_on_this_store(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');
        Sanctum::actingAs($this->memberOf('store-a'));

        $missing = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'offers',
                'type' => 'custom',
                'title_en' => 'Offers',
                'draft_layout' => ['blocks' => []],
            ])
            ->assertCreated()
            ->json('data');

        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$missing['id'].'/publish')
            ->assertOk()
            ->assertJsonPath('warnings', ['missing-h1']);

        $double = $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$missing['id'], [
                'draft_layout' => [
                    'blocks' => [
                        ['id' => 'a', 'type' => 'heading', 'visible' => true, 'settings' => ['htmlTag' => 'h1', 'textEn' => 'One', 'textAr' => 'واحد']],
                        ['id' => 'b', 'type' => 'heading', 'visible' => true, 'settings' => ['level' => 'h1', 'textEn' => 'Two', 'textAr' => 'اثنان']],
                    ],
                ],
            ])
            ->assertOk()
            ->json('data');

        $this->assertSame('h1', $double['draft_layout']['blocks'][0]['settings']['tag']);

        $published = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$missing['id'].'/publish')
            ->assertOk();

        $published->assertJsonPath('warnings.0', 'multiple-h1');
        $published->assertJsonPath('data.published_layout.blocks.0.settings.tag', 'h1');
        $published->assertJsonPath('data.published_layout.blocks.1.settings.tag', 'h1');

        Sanctum::actingAs($this->memberOf('store-b'));
        $this->withHeader('X-Store-Id', 'store-b')
            ->getJson('/api/stores/store-a/pages/offers')
            ->assertForbidden();

        $other = $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages', [
                'slug' => 'offers',
                'type' => 'custom',
                'title_en' => 'Store B',
            ])
            ->assertCreated()
            ->json('data');

        $this->withHeader('X-Store-Id', 'store-b')
            ->putJson('/api/stores/store-b/pages/'.$other['id'], [
                'draft_layout' => [
                    'blocks' => [
                        ['id' => 'only', 'type' => 'heading', 'settings' => ['tag' => 'h1', 'textEn' => 'OTHER', 'textAr' => 'آخر']],
                    ],
                ],
            ])
            ->assertOk();

        $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages/'.$other['id'].'/publish')
            ->assertOk()
            ->assertJsonPath('warnings', [])
            ->assertJsonPath('data.published_layout.blocks.0.settings.textEn', 'OTHER');

        $this->assertSame(1, DB::table('theme_pages')->where('store_id', 'store-a')->where('slug', 'offers')->count());
    }

    private function insertStore(string $id, string $slug): void
    {
        DB::table('stores')->insert([
            'id' => $id,
            'name' => $id,
            'slug' => $slug,
            'status' => 'active',
            'plan' => 'pro',
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

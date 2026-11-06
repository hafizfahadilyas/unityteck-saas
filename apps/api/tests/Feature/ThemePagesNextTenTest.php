<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemePagesNextTenTest extends TestCase
{
    use RefreshDatabase;

    public function test_pb43_free_plan_and_master_flag_block_custom_html(): void
    {
        $this->insertStore('store-free', 'store-free', 'free');
        $freeId = $this->pageId('store-free', 'html-free');
        $this->withHeader('X-Store-Id', 'store-free')
            ->putJson('/api/stores/store-free/pages/'.$freeId, [
                'draft_layout' => ['blocks' => [['id' => 'h', 'type' => 'html', 'settings' => ['customHtml' => '<p>no</p>']]]],
            ])
            ->assertForbidden();

        $this->insertStore('store-pro', 'store-pro', 'pro');
        $proId = $this->pageId('store-pro', 'html-pro');
        $saved = $this->withHeader('X-Store-Id', 'store-pro')
            ->putJson('/api/stores/store-pro/pages/'.$proId, [
                'draft_layout' => ['blocks' => [['id' => 'h', 'type' => 'html', 'settings' => ['customHtml' => '<p>ok</p><script>alert(1)</script>']]]],
            ])
            ->assertOk()
            ->json('data.draft_layout.blocks.0.settings.customHtml');
        $this->assertStringContainsString('<p>ok</p>', $saved);
        $this->assertStringNotContainsString('script', $saved);

        DB::table('store_settings')->insert([
            'id' => 'set-pro',
            'store_id' => 'store-pro',
            'settings' => json_encode(['allow_custom_html' => false]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->withHeader('X-Store-Id', 'store-pro')
            ->putJson('/api/stores/store-pro/pages/'.$proId, [
                'draft_layout' => ['blocks' => [['id' => 'h', 'type' => 'html', 'settings' => ['customHtml' => '<p>off</p>']]]],
            ])
            ->assertForbidden();

        $this->insertStore('store-b', 'store-b', 'pro');
        $otherId = $this->pageId('store-b', 'html-b');
        $this->withHeader('X-Store-Id', 'store-b')
            ->putJson('/api/stores/store-b/pages/'.$otherId, [
                'draft_layout' => ['blocks' => [['id' => 'h', 'type' => 'html', 'settings' => ['customHtml' => '<p>b</p>']]]],
            ])
            ->assertOk()
            ->assertJsonPath('data.draft_layout.blocks.0.settings.customHtml', '<p>b</p>');
    }

    public function test_pb44_retired_banner_block_is_dropped(): void
    {
        $this->insertStore('store-a', 'store-a', 'pro');
        $pageId = $this->pageId('store-a', 'home-order');
        $types = collect($this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$pageId, [
                'draft_layout' => ['blocks' => [
                    ['id' => 'hero', 'type' => 'hero'],
                    ['id' => 'old', 'type' => 'banners'],
                    ['id' => 'news', 'type' => 'newsletter'],
                ]],
            ])
            ->assertOk()
            ->json('data.draft_layout.blocks'))->pluck('type')->all();
        $this->assertSame(['hero', 'newsletter'], $types);
    }

    public function test_pb49_draft_custom_page_is_not_public_until_publish(): void
    {
        $this->insertStore('store-a', 'store-a', 'pro');
        $this->insertStore('store-b', 'store-b', 'pro');
        $pageId = $this->pageId('store-a', 'offers');
        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$pageId, [
                'draft_layout' => ['blocks' => [['id' => 't', 'type' => 'rich_text', 'settings' => ['htmlEn' => '<p>Store A offer</p>', 'htmlAr' => '<p>عرض المتجر</p>']]]],
            ])
            ->assertOk();

        $this->getJson('/api/storefront/theme?store_id=store-a&slug=offers')->assertNotFound();

        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$pageId.'/publish')
            ->assertOk();

        $public = $this->getJson('/api/storefront/theme?store_id=store-a&slug=offers')
            ->assertOk()
            ->json();
        $this->assertSame('store-a', $public['store_id']);
        $this->assertArrayNotHasKey('draft_layout', $public['page']);
        $this->assertSame('<p>Store A offer</p>', $public['page']['published_layout']['blocks'][0]['settings']['htmlEn']);

        $this->getJson('/api/storefront/theme?store_id=store-b&slug=offers')->assertNotFound();
        $this->withHeader('X-Store-Id', 'store-b')
            ->getJson('/api/stores/store-a/pages/offers')
            ->assertForbidden();
    }

    public function test_pb50_unknown_url_uses_only_this_store_404_layout(): void
    {
        $this->insertStore('store-a', 'store-a', 'pro');
        $this->insertStore('store-b', 'store-b', 'pro');
        Sanctum::actingAs($this->memberOf('store-a'));
        $created = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', ['slug' => '404', 'type' => '404', 'title_en' => 'Missing page', 'title_ar' => 'صفحة غير موجودة'])
            ->assertCreated()
            ->json('data');
        $layout = [
            'blocks' => [[
                'id' => 'm',
                'type' => 'heading',
                'settings' => ['textEn' => 'Store A missing', 'textAr' => 'missing-ar'],
            ]],
        ];
        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$created['id'], [
                'draft_layout' => $layout,
            ])
            ->assertOk();
        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$created['id'].'/publish')
            ->assertOk();

        $page = $this->getJson('/api/storefront/theme?store_id=store-a&slug=404')->assertOk()->json('page');
        $this->assertSame('Store A missing', $page['published_layout']['blocks'][0]['settings']['textEn']);
        $this->assertArrayNotHasKey('draft_layout', $page);
        $this->getJson('/api/storefront/theme?store_id=store-b&slug=404')->assertNotFound();
    }

    private function pageId(string $storeId, string $slug): string
    {
        Sanctum::actingAs($this->memberOf($storeId));
        $created = $this->withHeader('X-Store-Id', $storeId)
            ->postJson('/api/stores/'.$storeId.'/pages', ['slug' => $slug, 'type' => 'custom', 'title_en' => $slug])
            ->assertCreated()
            ->json('data');

        return $created['id'];
    }

    private function insertStore(string $id, string $slug, string $plan): void
    {
        if (DB::table('stores')->where('id', $id)->exists()) {
            return;
        }
        DB::table('stores')->insert([
            'id' => $id,
            'name' => $id,
            'slug' => $slug,
            'status' => 'active',
            'plan' => $plan,
            'currency' => 'SAR',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function memberOf(string $storeId): User
    {
        $userId = 'user-'.$storeId;
        if (! DB::table('users')->where('id', $userId)->exists()) {
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
        }

        return User::query()->findOrFail($userId);
    }
}

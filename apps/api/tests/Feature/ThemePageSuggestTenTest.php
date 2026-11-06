<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemePageSuggestTenTest extends TestCase
{
    use RefreshDatabase;

    public function test_restore_ai_and_media_versions_stay_on_this_store(): void
    {
        $this->insertStore('store-a', 'pro', false);
        $this->insertStore('store-b', 'pro', false);
        $this->insertStore('store-free', 'free', false);
        $this->insertStore('store-grant', 'free', true);

        DB::table('categories')->insert([
            'id' => 'cat-a',
            'store_id' => 'store-a',
            'name' => 'Beans',
            'slug' => 'beans',
            'meta_title' => 'Category SEO',
            'meta_description' => 'Category description',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('products')->insert([
            'id' => 'prod-a',
            'store_id' => 'store-a',
            'category_id' => 'cat-a',
            'name' => 'Alpha beans',
            'price' => 25,
            'sku' => 'SKU-A',
            'seo_title' => 'Product SEO title',
            'seo_description' => 'Product SEO description',
            'status' => 'published',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('products')->insert([
            'id' => 'prod-b',
            'store_id' => 'store-b',
            'name' => 'Beta beans',
            'price' => 30,
            'sku' => 'SKU-B',
            'seo_title' => 'Beta SEO',
            'status' => 'published',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($this->memberOf('store-a'));
        $page = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'offers',
                'type' => 'custom',
                'title_en' => 'Offers',
            ])
            ->assertCreated()
            ->json('data');

        $empty = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/ai/seo', ['page_id' => $page['id']])
            ->assertOk()
            ->json('data');
        $this->assertSame('', $empty['suggestions']['seo_title_en']);
        $this->assertSame([], $empty['faq']);
        $this->assertSame([], $empty['products']);
        $this->assertFalse($empty['saved']);
        $this->assertNull(DB::table('theme_pages')->where('id', $page['id'])->value('seo'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$page['id'], [
                'draft_layout' => [
                    'blocks' => [[
                        'id' => 'h1',
                        'type' => 'heading',
                        'settings' => ['textEn' => 'Fresh   cup', 'textAr' => 'كوب طازج'],
                    ]],
                ],
                'seo' => [
                    'seo_title_en' => 'Keep English',
                    'seo_title_ar' => 'أبق العربي',
                ],
            ])
            ->assertOk();

        $seo = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/ai/seo', ['page_id' => $page['id']])
            ->assertOk()
            ->json('data');
        $this->assertSame('Fresh cup', $seo['suggestions']['seo_title_en']);
        $this->assertSame('كوب طازج', $seo['suggestions']['seo_title_ar']);
        $this->assertStringNotContainsString('Beta beans', json_encode($seo['context']));
        $this->assertSame([], $seo['products']);
        $this->assertSame('Keep English', DB::table('theme_pages')->where('id', $page['id'])->value('seo') ? json_decode((string) DB::table('theme_pages')->where('id', $page['id'])->value('seo'), true)['seo_title_en'] : null);

        $heading = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/ai/heading', [
                'page_id' => $page['id'],
                'widget_id' => 'h1',
                'locale' => 'en',
            ])
            ->assertOk()
            ->json('data');
        $this->assertSame('Fresh cup', $heading['suggestion']);
        $this->assertArrayNotHasKey('textAr', $heading);
        $this->assertFalse($heading['saved']);
        $stored = json_decode((string) DB::table('theme_pages')->where('id', $page['id'])->value('draft_layout'), true);
        $this->assertSame('Fresh   cup', $stored['blocks'][0]['settings']['textEn']);

        $alt = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/ai/alt', [
                'page_id' => $page['id'],
                'widget_id' => 'h1',
                'file_name' => 'cup-photo.jpg',
            ])
            ->assertOk()
            ->json('data');
        $this->assertSame('cup photo Fresh cup', $alt['alt_en']);
        $this->assertSame('cup photo كوب طازج', $alt['alt_ar']);
        $this->assertSame([], $alt['products']);

        DB::table('media')->insert([
            'id' => 'med-b',
            'store_id' => 'store-b',
            'file_name' => 'beta.jpg',
            'url' => '/storage/stores/store-b/media/beta.jpg?v=1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/ai/alt', [
                'page_id' => $page['id'],
                'media_id' => 'med-b',
                'file_name' => 'beta.jpg',
            ])
            ->assertForbidden();

        $held = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/ai/translate', [
                'page_id' => $page['id'],
                'widget_id' => 'h1',
                'from' => 'en',
                'confirm' => false,
            ])
            ->assertOk()
            ->json('data');
        $this->assertSame('Fresh   cup', $held['source']);
        $this->assertNull($held['target']);
        $this->assertSame('Fresh   cup', $stored['blocks'][0]['settings']['textEn']);

        $moved = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/ai/translate', [
                'page_id' => $page['id'],
                'widget_id' => 'h1',
                'from' => 'en',
                'confirm' => true,
            ])
            ->assertOk()
            ->json('data');
        $this->assertSame('Fresh   cup', $moved['source']);
        $this->assertSame('كوب طازج', $moved['target']);
        $after = json_decode((string) DB::table('theme_pages')->where('id', $page['id'])->value('draft_layout'), true);
        $this->assertSame('Fresh   cup', $after['blocks'][0]['settings']['textEn']);

        $applied = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/ai/apply', [
                'page_id' => $page['id'],
                'fields' => ['seo_title_en' => 'Chosen title'],
            ])
            ->assertOk()
            ->json('data');
        $this->assertSame('Chosen title', $applied['seo']['seo_title_en']);
        $this->assertSame('أبق العربي', $applied['seo']['seo_title_ar']);

        DB::table('theme_revisions')->insert([
            'id' => 'rev-1',
            'store_id' => 'store-a',
            'page_id' => $page['id'],
            'snapshot' => json_encode([
                'draft_layout' => ['blocks' => [['id' => 'old', 'type' => 'heading', 'settings' => ['textEn' => 'Restored']]]],
                'products' => [['id' => 'prod-a', 'seo_title' => 'Hacked title']],
                'categories' => [['id' => 'cat-a', 'meta_title' => 'Hacked category']],
            ]),
            'created_at' => now(),
        ]);
        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/revisions/rev-1/restore')
            ->assertOk()
            ->assertJsonPath('data.draft_layout.blocks.0.settings.textEn', 'Restored');
        $this->assertSame('Product SEO title', DB::table('products')->where('id', 'prod-a')->value('seo_title'));
        $this->assertSame('Alpha beans', DB::table('products')->where('id', 'prod-a')->value('name'));
        $this->assertSame(2, DB::table('products')->count());
        $this->assertSame('Category SEO', DB::table('categories')->where('id', 'cat-a')->value('meta_title'));

        DB::table('media')->insert([
            'id' => 'med-a',
            'store_id' => 'store-a',
            'file_name' => 'cup.jpg',
            'url' => '/storage/stores/store-a/media/cup.jpg?v=111',
            'created_at' => '2026-01-01 00:00:00',
            'updated_at' => '2026-01-01 00:00:00',
        ]);
        $first = $this->withHeader('X-Store-Id', 'store-a')->getJson('/api/media')->assertOk()->json('data');
        $row = collect($first)->firstWhere('id', 'med-a');
        $this->assertIsArray($row);
        $this->assertStringNotContainsString('v=111', (string) $row['url']);
        $this->assertStringContainsString('?v=', (string) $row['url']);
        DB::table('media')->where('id', 'med-a')->update(['updated_at' => '2026-06-02 00:00:00']);
        $second = $this->withHeader('X-Store-Id', 'store-a')->getJson('/api/media')->json('data');
        $next = collect($second)->firstWhere('id', 'med-a');
        $this->assertNotSame($row['url'], $next['url']);
        $this->assertStringNotContainsString((string) $row['url'], (string) $next['url']);

        Sanctum::actingAs($this->memberOf('store-free'));
        $this->withHeader('X-Store-Id', 'store-free')
            ->postJson('/api/stores/store-free/ai/seo', ['page_id' => $page['id']])
            ->assertForbidden();

        Sanctum::actingAs($this->memberOf('store-grant'));
        $grantPage = $this->withHeader('X-Store-Id', 'store-grant')
            ->postJson('/api/stores/store-grant/pages', [
                'slug' => 'offers',
                'type' => 'custom',
                'title_en' => 'Grant',
            ])
            ->assertCreated()
            ->json('data');
        $this->withHeader('X-Store-Id', 'store-grant')
            ->postJson('/api/stores/store-grant/ai/seo', ['page_id' => $grantPage['id']])
            ->assertOk();

        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/ai/seo', ['page_id' => $grantPage['id']])
            ->assertForbidden();
    }

    private function insertStore(string $id, string $plan, bool $grant): void
    {
        DB::table('stores')->insert([
            'id' => $id,
            'name' => $id,
            'slug' => $id,
            'status' => 'active',
            'plan' => $plan,
            'master_granted_pro' => $grant,
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

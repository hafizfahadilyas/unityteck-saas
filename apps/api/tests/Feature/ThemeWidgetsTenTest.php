<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeWidgetsTenTest extends TestCase
{
    use RefreshDatabase;

    public function test_pb33_rich_text_script_is_stored_harmless(): void
    {
        $pageId = $this->pageWithLayout('store-a', 'copy', [
            'blocks' => [[
                'id' => 't',
                'type' => 'rich_text',
                'settings' => [
                    'htmlEn' => '<p>ok</p><script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(1)">x</a>',
                    'htmlAr' => '<p>عربي</p>',
                ],
            ]],
        ]);

        $saved = $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$pageId, [
                'draft_layout' => [
                    'blocks' => [[
                        'id' => 't',
                        'type' => 'rich_text',
                        'settings' => [
                            'htmlEn' => '<p>ok</p><script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(1)">x</a>',
                            'htmlAr' => '<p>عربي</p>',
                        ],
                    ]],
                ],
            ])
            ->assertOk()
            ->json('data.draft_layout.blocks.0.settings');

        $this->assertStringNotContainsString('script', $saved['htmlEn']);
        $this->assertStringNotContainsString('onclick', $saved['htmlEn']);
        $this->assertStringNotContainsString('javascript:', $saved['htmlEn']);
        $this->assertStringContainsString('<p>ok</p>', $saved['htmlEn']);
        $this->assertSame('<p>عربي</p>', $saved['htmlAr']);
    }

    public function test_pb34_empty_image_is_not_replaced(): void
    {
        $this->pageWithLayout('store-a', 'photo', [
            'blocks' => [[
                'id' => 'img',
                'type' => 'image',
                'settings' => ['src' => '', 'altEn' => 'Machine', 'altAr' => 'ماكينة', 'mobileSrc' => '', 'link' => '/offers', 'radius' => 8],
            ]],
        ]);
        $saved = $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/stores/store-a/pages/photo')
            ->assertOk()
            ->json('data.draft_layout.blocks.0.settings');
        $this->assertSame('', $saved['src']);
        $this->assertSame('Machine', $saved['altEn']);
        $this->assertSame('ماكينة', $saved['altAr']);
    }

    public function test_pb35_button_link_stays_inside_the_store(): void
    {
        $this->pageWithLayout('store-a', 'cta', [
            'blocks' => [
                ['id' => 'in', 'type' => 'button', 'settings' => ['labelEn' => 'Open', 'labelAr' => 'افتح', 'buttonUrl' => '/offers']],
                ['id' => 'out', 'type' => 'button', 'settings' => ['labelEn' => 'Web', 'labelAr' => 'موقع', 'buttonUrl' => 'https://example.com/go']],
                ['id' => 'bad', 'type' => 'button', 'settings' => ['labelEn' => 'No', 'labelAr' => 'لا', 'buttonUrl' => '/stores/store-b/offers']],
            ],
        ]);
        $blocks = $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/stores/store-a/pages/cta')
            ->assertOk()
            ->json('data.draft_layout.blocks');
        $this->assertSame('/offers', $blocks[0]['settings']['link']);
        $this->assertSame('', $blocks[0]['settings']['rel']);
        $this->assertSame('noopener noreferrer', $blocks[1]['settings']['rel']);
        $this->assertSame('', $blocks[2]['settings']['link']);
    }

    public function test_pb36_slider_uses_hero_banners_and_empty_stays_empty(): void
    {
        $pageId = $this->pageWithLayout('store-a', 'home-hero', [
            'blocks' => [[
                'id' => 'hero',
                'type' => 'hero_slider',
                'settings' => [
                    'autoplay' => true,
                    'slides' => [[
                        'id' => 's1',
                        'image' => 'https://cdn.example/a.jpg',
                        'mobileImage' => 'https://cdn.example/m.jpg',
                        'titleEn' => 'Slide',
                        'titleAr' => 'شريحة',
                        'textEn' => 'Body',
                        'textAr' => 'نص',
                        'buttonEn' => 'Buy',
                        'buttonAr' => 'اشتر',
                        'link' => '/offers',
                        'overlay' => '20',
                    ]],
                ],
            ]],
        ]);
        $settings = $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/stores/store-a/pages/'.$pageId)
            ->assertOk()
            ->json('data.draft_layout.blocks.0.settings');
        $this->assertTrue($settings['heroBanners']['autoplay']);
        $this->assertSame('Slide', $settings['heroBanners']['banners'][0]['titleEn']);
        $this->assertSame('شريحة', $settings['heroBanners']['banners'][0]['titleAr']);
        $this->assertCount(1, $settings['heroBanners']['banners']);

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$pageId, [
                'draft_layout' => ['blocks' => [[
                    'id' => 'hero',
                    'type' => 'hero_slider',
                    'settings' => ['slides' => []],
                ]]],
            ])
            ->assertOk()
            ->assertJsonPath('data.draft_layout.blocks.0.settings.heroBanners.banners', []);
    }

    public function test_pb37_expired_banner_is_absent_after_publish(): void
    {
        $pageId = $this->pageWithLayout('store-a', 'offer', [
            'blocks' => [
                ['id' => 'old', 'type' => 'offer_banner', 'visible' => true, 'settings' => ['headingEn' => 'Old', 'headingAr' => 'قديم', 'endsAt' => '2000-01-01T00:00:00Z']],
                ['id' => 'live', 'type' => 'offer_banner', 'visible' => true, 'settings' => ['headingEn' => 'Live', 'headingAr' => 'حالي', 'endsAt' => '2099-01-01T00:00:00Z']],
            ],
        ]);
        $ids = collect($this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$pageId.'/publish')
            ->assertOk()
            ->json('data.published_layout.blocks'))->pluck('id')->all();
        $this->assertSame(['live'], $ids);
        $this->assertSame('2099-01-01T00:00:00Z', $this->withHeader('X-Store-Id', 'store-a')
            ->getJson('/api/storefront/theme?store_id=store-a&slug=offer')
            ->assertOk()
            ->json('page.published_layout.blocks.0.settings.endsAt'));
    }

    public function test_pb38_catalog_prices_stay_on_this_store(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');
        DB::table('products')->insert([
            $this->product('prod-a', 'store-a', 'Kept', 100, true, null),
            $this->product('prod-b', 'store-b', 'Other', 999, true, 1000),
            $this->product('prod-sale', 'store-a', 'Sale', 80, false, 120),
        ]);

        $featured = $this->getJson('/api/storefront/catalog?store_id=store-a&source=featured&limit=8')->assertOk()->json('data');
        $this->assertCount(1, $featured);
        $this->assertSame('prod-a', $featured[0]['id']);
        $this->assertEquals(100, $featured[0]['price']);

        $manual = $this->getJson('/api/storefront/catalog?store_id=store-a&source=manual&ids=prod-a,prod-b')->assertOk()->json('data');
        $this->assertCount(1, $manual);
        $this->assertSame('store-a', $manual[0]['store_id']);

        $sale = $this->getJson('/api/storefront/catalog?store_id=store-a&source=on_sale')->assertOk()->json('data');
        $this->assertSame('prod-sale', $sale[0]['id']);
        $this->assertEquals(80, $sale[0]['price']);
    }

    public function test_pb39_categories_match_this_store_only(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');
        $this->insertStore('store-c', 'store-c');
        DB::table('categories')->insert([
            $this->category('cat-a1', 'store-a', 'Beans', 'حبوب', 'beans'),
            $this->category('cat-a2', 'store-a', 'Mills', 'مطاحن', 'mills'),
            $this->category('cat-b', 'store-b', 'Other', 'آخر', 'other'),
        ]);
        $rows = $this->getJson('/api/storefront/categories?store_id=store-a')->assertOk();
        $rows->assertJsonPath('meta.total', 2);
        $rows->assertJsonPath('store_id', 'store-a');
        $names = collect($rows->json('data'))->pluck('name')->all();
        $this->assertNotContains('Other', $names);
        $this->getJson('/api/storefront/categories?store_id=store-c')->assertOk()->assertJsonPath('meta.total', 0)->assertJsonPath('data', []);
    }

    public function test_pb40_hidden_faq_is_removed_from_published_schema(): void
    {
        $pageId = $this->pageWithLayout('store-a', 'faq', [
            'blocks' => [[
                'id' => 'faq',
                'type' => 'faq',
                'settings' => ['items' => [
                    ['qEn' => 'Shown', 'qAr' => 'ظاهر', 'aEn' => 'Yes', 'aAr' => 'نعم', 'visible' => true],
                    ['qEn' => 'Hidden', 'qAr' => 'مخفي', 'aEn' => 'No', 'aAr' => 'لا', 'visible' => false],
                ]],
            ]],
        ]);
        $published = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$pageId.'/publish')
            ->assertOk()
            ->json('data.published_layout.blocks.0.settings');
        $this->assertCount(1, $published['items']);
        $this->assertSame('Shown', $published['jsonLd']['mainEntity'][0]['name']);
        $this->assertSame('Yes', $published['jsonLd']['mainEntity'][0]['acceptedAnswer']['text']);

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$pageId, [
                'draft_layout' => ['blocks' => [[
                    'id' => 'faq',
                    'type' => 'faq',
                    'settings' => ['items' => []],
                ]]],
            ])->assertOk();
        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$pageId.'/publish')
            ->assertOk()
            ->assertJsonPath('data.published_layout.blocks.0.settings.jsonLd', null)
            ->assertJsonPath('data.published_layout.blocks.0.settings.items', []);
    }

    public function test_pb41_reviews_match_stored_rows_for_this_store(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');
        DB::table('store_settings')->insert([
            ['id' => 'set-a', 'store_id' => 'store-a', 'settings' => json_encode(['customer_reviews' => [
                ['id' => 'r1', 'author' => 'Ada', 'rating' => 4, 'comment' => 'Good', 'commentAr' => 'جيد', 'active' => true],
            ]]), 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'set-b', 'store_id' => 'store-b', 'settings' => json_encode(['customer_reviews' => [
                ['id' => 'r2', 'author' => 'Bee', 'rating' => 1, 'comment' => 'Other', 'commentAr' => 'آخر', 'active' => true],
            ]]), 'created_at' => now(), 'updated_at' => now()],
        ]);
        $rows = $this->getJson('/api/stores/store-a/reviews')->assertOk();
        $rows->assertJsonPath('store_id', 'store-a');
        $rows->assertJsonPath('data.0.rating', 4);
        $this->assertSame('Good', $rows->json('data.0.comment'));
        $this->insertStore('store-c', 'store-c');
        $this->getJson('/api/stores/store-c/reviews')->assertOk()->assertJsonPath('data', []);
    }

    public function test_pb42_empty_video_is_hidden_and_newsletter_stays_on_this_store(): void
    {
        $this->insertStore('store-b', 'store-b');
        $pageId = $this->pageWithLayout('store-a', 'extras', [
            'blocks' => [
                ['id' => 'clip', 'type' => 'video', 'visible' => true, 'settings' => ['videoUrl' => '']],
                ['id' => 'keep', 'type' => 'spacer', 'visible' => true, 'settings' => ['height' => 12]],
            ],
        ]);
        $ids = collect($this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$pageId.'/publish')
            ->assertOk()
            ->json('data.published_layout.blocks'))->pluck('id')->all();
        $this->assertSame(['keep'], $ids);

        $this->postJson('/api/storefront/newsletter', ['store_id' => 'store-a', 'email' => 'a@shop.test'])->assertOk()->assertJsonPath('store_id', 'store-a');
        $stored = json_decode((string) DB::table('store_settings')->where('store_id', 'store-a')->value('settings'), true);
        $this->assertSame('a@shop.test', $stored['newsletter_subscribers'][0]['email']);
        $this->assertNull(DB::table('store_settings')->where('store_id', 'store-b')->value('settings'));
    }

    private function pageWithLayout(string $storeId, string $slug, array $layout): string
    {
        if (! DB::table('stores')->where('id', $storeId)->exists()) {
            $this->insertStore($storeId, $storeId);
        }
        Sanctum::actingAs($this->memberOf($storeId));
        $created = $this->withHeader('X-Store-Id', $storeId)
            ->postJson('/api/stores/'.$storeId.'/pages', ['slug' => $slug, 'type' => 'custom', 'title_en' => $slug])
            ->assertCreated()
            ->json('data');
        $this->withHeader('X-Store-Id', $storeId)
            ->putJson('/api/stores/'.$storeId.'/pages/'.$created['id'], ['draft_layout' => $layout])
            ->assertOk();

        return $created['id'];
    }

    private function product(string $id, string $storeId, string $name, float $price, bool $featured, ?float $original): array
    {
        return [
            'id' => $id,
            'store_id' => $storeId,
            'name' => $name,
            'name_ar' => $name,
            'slug' => $id,
            'price' => $price,
            'original_price' => $original,
            'sku' => $id,
            'stock' => 2,
            'status' => 'published',
            'is_active' => 1,
            'is_featured' => $featured ? 1 : 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    private function category(string $id, string $storeId, string $name, string $nameAr, string $slug): array
    {
        return [
            'id' => $id,
            'store_id' => $storeId,
            'name' => $name,
            'name_ar' => $nameAr,
            'slug' => $slug,
            'sort_order' => 1,
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];
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

<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemePageSeoTenTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_seo_sitemap_warnings_and_jsonld_stay_on_this_store(): void
    {
        $this->insertStore('store-a', 'store-a', 'alpha.test');
        $this->insertStore('store-b', 'store-b', 'beta.test');
        Sanctum::actingAs($this->memberOf('store-a'));

        $page = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'offers',
                'type' => 'custom',
                'title_en' => 'Offers',
                'title_ar' => 'عروض',
            ])
            ->assertCreated()
            ->json('data');

        $saved = $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$page['id'], [
                'seo' => [
                    'seo_title_en' => 'Alpha offers',
                    'seo_title_ar' => 'عروض ألفا',
                    'seo_description_en' => 'Alpha description',
                    'seo_description_ar' => 'وصف ألفا',
                    'canonical' => 'https://beta.test/offers',
                    'robots' => 'index,follow',
                    'og_title_en' => 'OG Alpha',
                    'og_title_ar' => 'أوج ألفا',
                    'og_description_en' => 'OG description',
                    'og_description_ar' => 'وصف المشاركة',
                    'og_image' => 'https://alpha.test/og.jpg',
                    'twitter_card' => 'summary_large_image',
                    'hreflang' => [
                        'en' => 'https://beta.test/en/offers',
                        'ar' => 'https://alpha.test/offers?lang=ar',
                    ],
                    'clicks' => 99,
                ],
            ])
            ->assertOk()
            ->json('data');

        $this->assertSame('Alpha offers', $saved['seo']['seo_title_en']);
        $this->assertArrayNotHasKey('clicks', $saved['seo']);

        $this->getJson('/api/storefront/theme?store_id=store-a&slug=offers')->assertNotFound();

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$page['id'], [
                'draft_layout' => [
                    'blocks' => [
                        ['id' => 'only', 'type' => 'heading', 'visible' => true, 'settings' => ['tag' => 'h1', 'textEn' => 'One', 'textAr' => 'واحد']],
                        ['id' => 'bare', 'type' => 'image', 'visible' => true, 'settings' => ['image' => 'https://alpha.test/a.jpg', 'altEn' => '', 'altAr' => '']],
                        ['id' => 'captioned', 'type' => 'image', 'visible' => true, 'settings' => ['image' => 'https://alpha.test/b.jpg', 'altEn' => 'Cup', 'altAr' => 'كوب']],
                    ],
                ],
            ])
            ->assertOk();

        $published = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$page['id'].'/publish')
            ->assertOk();
        $published->assertJsonPath('data.status', 'published');
        $warnings = $published->json('warnings');
        $this->assertContains('missing-alt:bare', $warnings);
        $this->assertNotContains('missing-alt:captioned', $warnings);
        $this->assertNotContains('multiple-h1', $warnings);

        $public = $this->getJson('/api/storefront/theme?store_id=store-a&slug=offers')->assertOk();
        $public->assertJsonPath('page.meta.en.title', 'Alpha offers');
        $public->assertJsonPath('page.meta.ar.title', 'عروض ألفا');
        $public->assertJsonPath('page.meta.en.description', 'Alpha description');
        $public->assertJsonPath('page.meta.ar.description', 'وصف ألفا');
        $public->assertJsonPath('page.meta.en.canonical', 'https://alpha.test/offers');
        $public->assertJsonPath('page.meta.ar.hreflang.ar', 'https://alpha.test/offers?lang=ar');
        $this->assertStringContainsString('alpha.test', (string) $public->json('page.meta.en.hreflang.en'));
        $this->assertStringNotContainsString('beta.test', (string) $public->json('page.meta.en.canonical'));
        $this->assertStringNotContainsString('beta.test', (string) $public->json('page.meta.en.hreflang.en'));
        $this->assertSame([], $public->json('page.json_ld'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$page['id'], [
                'draft_layout' => [
                    'blocks' => [
                        ['id' => 'only', 'type' => 'heading', 'visible' => true, 'settings' => ['tag' => 'h1', 'textEn' => 'One', 'textAr' => 'واحد']],
                        ['id' => 'faq1', 'type' => 'faq', 'visible' => true, 'settings' => ['items' => [
                            ['questionEn' => 'Draft question', 'answerEn' => 'Draft answer', 'questionAr' => 'سؤال', 'answerAr' => 'جواب'],
                        ]]],
                    ],
                ],
            ])
            ->assertOk();

        $this->getJson('/api/storefront/theme?store_id=store-a&slug=offers')
            ->assertOk()
            ->assertJsonPath('page.json_ld', []);

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$page['id'], [
                'draft_layout' => [
                    'blocks' => [
                        ['id' => 'a', 'type' => 'heading', 'visible' => true, 'settings' => ['tag' => 'h1', 'textEn' => 'One', 'textAr' => 'واحد']],
                        ['id' => 'b', 'type' => 'heading', 'visible' => true, 'settings' => ['tag' => 'h1', 'textEn' => 'Two', 'textAr' => 'اثنان']],
                        ['id' => 'faq1', 'type' => 'faq', 'visible' => true, 'settings' => ['items' => [
                            ['questionEn' => 'Ship time', 'answerEn' => 'Two days', 'questionAr' => 'مدة الشحن', 'answerAr' => 'يومان'],
                        ]]],
                        ['id' => 'rev1', 'type' => 'reviews', 'visible' => true, 'settings' => ['items' => [
                            ['store_id' => 'store-a', 'author' => 'Noura', 'bodyEn' => 'Fresh cup'],
                            ['store_id' => 'store-b', 'author' => 'Other', 'bodyEn' => 'Foreign review'],
                        ]]],
                    ],
                ],
            ])
            ->assertOk();

        $again = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$page['id'].'/publish')
            ->assertOk();
        $again->assertJsonPath('warnings.0', 'multiple-h1');
        $this->assertContains('h1:a', $again->json('warnings'));
        $this->assertContains('h1:b', $again->json('warnings'));
        $again->assertJsonPath('data.status', 'published');

        $live = $this->getJson('/api/storefront/theme?store_id=store-a&slug=offers')->assertOk();
        $this->assertSame('Ship time', $live->json('page.json_ld.@graph.0.mainEntity.0.name'));
        $this->assertSame('Fresh cup', $live->json('page.json_ld.@graph.1.itemListElement.0.reviewBody'));
        $encoded = json_encode($live->json('page.json_ld'));
        $this->assertStringNotContainsString('Foreign review', (string) $encoded);

        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'draft-only',
                'type' => 'custom',
                'title_en' => 'Draft',
            ])
            ->assertCreated();

        $hidden = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'private-note',
                'type' => 'custom',
                'title_en' => 'Private',
            ])
            ->assertCreated()
            ->json('data');
        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$hidden['id'], [
                'seo' => ['robots' => 'noindex,nofollow', 'seo_title_en' => 'Private'],
                'draft_layout' => [
                    'blocks' => [
                        ['id' => 'h', 'type' => 'heading', 'settings' => ['tag' => 'h1', 'textEn' => 'Private', 'textAr' => 'خاص']],
                    ],
                ],
            ])
            ->assertOk();
        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$hidden['id'].'/publish')
            ->assertOk();

        Sanctum::actingAs($this->memberOf('store-b'));
        $other = $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages', [
                'slug' => 'secret',
                'type' => 'custom',
                'title_en' => 'Secret',
            ])
            ->assertCreated()
            ->json('data');
        $this->withHeader('X-Store-Id', 'store-b')
            ->putJson('/api/stores/store-b/pages/'.$other['id'], [
                'seo' => ['seo_title_en' => 'Beta secret', 'seo_title_ar' => 'سر'],
                'draft_layout' => [
                    'blocks' => [
                        ['id' => 'h', 'type' => 'heading', 'settings' => ['tag' => 'h1', 'textEn' => 'OTHER', 'textAr' => 'آخر']],
                    ],
                ],
            ])
            ->assertOk();
        $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages/'.$other['id'].'/publish')
            ->assertOk();

        $map = $this->get('/api/storefront/sitemap?store_id=store-a')->assertOk();
        $map->assertHeader('Content-Type', 'application/xml; charset=utf-8');
        $body = $map->getContent();
        $this->assertStringContainsString('https://alpha.test/offers', (string) $body);
        $this->assertStringNotContainsString('draft-only', (string) $body);
        $this->assertStringNotContainsString('private-note', (string) $body);
        $this->assertStringNotContainsString('secret', (string) $body);
        $this->assertStringNotContainsString('beta.test', (string) $body);

        $robots = $this->get('/api/storefront/robots?store_id=store-a')->assertOk();
        $this->assertStringContainsString('Sitemap: https://alpha.test/sitemap.xml', (string) $robots->getContent());
        $this->assertStringNotContainsString('beta.test', (string) $robots->getContent());

        $this->getJson('/api/storefront/sitemap?store_id=missing-store')->assertNotFound();
        $this->getJson('/api/storefront/theme?store_id=store-b&slug=offers')->assertNotFound();
    }

    private function insertStore(string $id, string $slug, string $domain): void
    {
        DB::table('stores')->insert([
            'id' => $id,
            'name' => $id,
            'slug' => $slug,
            'domain' => $domain,
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

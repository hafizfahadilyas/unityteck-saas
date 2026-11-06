<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemePagePolicyTenTest extends TestCase
{
    use RefreshDatabase;

    public function test_page_policy_visitor_css_and_isolation(): void
    {
        DB::table('themes_catalog')->insert([
            'id' => 'theme-commerce-starter',
            'name' => 'Starter',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->insertStore('store-a', 'pro', false);
        $this->insertStore('store-b', 'pro', false);
        $this->insertStore('store-free', 'free', false);

        $this->postJson('/api/stores/store-a/pages/missing/publish')->assertUnauthorized();

        $stamp = now()->subHour();
        DB::table('media')->insert([
            'id' => 'med-a',
            'store_id' => 'store-a',
            'url' => '/storage/stores/store-a/media/cup.jpg?v=1',
            'path' => 'stores/store-a/media/cup.jpg',
            'created_at' => $stamp,
            'updated_at' => $stamp,
        ]);
        DB::table('media')->insert([
            'id' => 'med-b',
            'store_id' => 'store-b',
            'url' => '/storage/stores/store-b/media/other.jpg?v=9',
            'path' => 'stores/store-b/media/other.jpg',
            'created_at' => $stamp,
            'updated_at' => $stamp,
        ]);
        DB::table('media')->where('id', 'med-a')->update(['updated_at' => now()]);
        $version = strtotime((string) DB::table('media')->where('id', 'med-a')->value('updated_at'));

        Sanctum::actingAs($this->memberOf('store-a'));
        $page = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'offers',
                'type' => 'custom',
                'title_en' => 'Alpha page',
            ])
            ->assertCreated()
            ->json('data');

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$page['id'], [
                'updated_by' => 'hacker',
                'seo' => ['seo_title_en' => 'Alpha SEO'],
                'draft_layout' => [
                    'customCss' => '.price{color:red}#store-b{color:blue}',
                    'blocks' => [
                        ['id' => 'h1', 'type' => 'heading', 'visible' => true, 'settings' => ['htmlTag' => 'h1', 'textEn' => 'Alpha heading']],
                        ['id' => 'open', 'type' => 'text', 'visible' => true, 'settings' => ['textEn' => 'Open offer']],
                        ['id' => 'ended', 'type' => 'text', 'visible' => true, 'settings' => ['textEn' => 'Ended offer', 'display' => ['endsAt' => '2000-01-01']]],
                        ['id' => 'members', 'type' => 'text', 'visible' => true, 'settings' => ['textEn' => 'Members offer', 'display' => ['audience' => 'logged_in']]],
                        ['id' => 'phone', 'type' => 'text', 'visible' => true, 'settings' => ['textEn' => 'Phone offer', 'display' => ['devices' => ['mobile']]]],
                        ['id' => 'xss', 'type' => 'text', 'visible' => true, 'settings' => ['textEn' => '<img src=x onerror=alert(1)>Hello<script>alert(1)</script>']],
                        ['id' => 'pic', 'type' => 'image', 'visible' => true, 'settings' => [
                            'image' => '/storage/stores/store-a/media/cup.jpg?v=1',
                            'backgroundImage' => '/storage/stores/store-b/media/other.jpg',
                            'altEn' => 'cup',
                        ]],
                    ],
                ],
            ])
            ->assertOk();

        $this->assertSame('user-store-a', DB::table('theme_pages')->where('id', $page['id'])->value('updated_by'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$page['id'].'/publish')
            ->assertOk();

        $rawLayout = DB::table('theme_pages')->where('id', $page['id'])->value('published_layout');
        $published = is_string($rawLayout) ? json_decode($rawLayout, true) : $rawLayout;
        $this->assertIsArray($published);
        $publishedJson = json_encode($published);
        $this->assertStringNotContainsString('onerror', (string) $publishedJson);
        $this->assertStringNotContainsString('<script', (string) $publishedJson);
        $this->assertStringNotContainsString('store-b', (string) $publishedJson);
        $this->assertStringContainsString('[data-store-id="store-a"]', (string) ($published['customCss'] ?? ''));
        $this->assertSame('/storage/stores/store-a/media/cup.jpg?v='.$version, $published['blocks'][6]['settings']['image']);
        $this->assertSame('user-store-a', DB::table('theme_revisions')->where('page_id', $page['id'])->value('created_by'));
        $this->assertSame(0, DB::table('theme_revisions')->where('store_id', 'store-b')->count());

        $guest = $this->getJson('/api/storefront/theme?store_id=store-a&slug=offers&visitor=guest&device=desktop')
            ->assertOk()
            ->json('page.published_layout');
        $guestJson = json_encode($guest);
        $this->assertStringContainsString('Open offer', (string) $guestJson);
        $this->assertStringNotContainsString('Ended offer', (string) $guestJson);
        $this->assertStringNotContainsString('Members offer', (string) $guestJson);
        $this->assertStringNotContainsString('Phone offer', (string) $guestJson);

        $member = $this->getJson('/api/storefront/theme?store_id=store-a&slug=offers&visitor=user&device=mobile')
            ->assertOk()
            ->json('page.published_layout');
        $memberJson = json_encode($member);
        $this->assertStringContainsString('Members offer', (string) $memberJson);
        $this->assertStringContainsString('Phone offer', (string) $memberJson);
        $this->assertStringNotContainsString('Ended offer', (string) $memberJson);

        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/theme-settings', [
                'publish' => true,
                'settings' => [
                    'ownerEmail' => 'hacker@evil.test',
                    'contact' => ['owner_email' => 'hacker@evil.test'],
                    'announcement' => ['textEn' => 'Alpha roast'],
                ],
            ])
            ->assertOk();
        $this->assertSame('store-a@example.com', DB::table('users')->where('id', 'user-store-a')->value('email'));
        $themeJson = json_encode(DB::table('store_themes')->where('store_id', 'store-a')->value('settings'));
        $this->assertStringNotContainsString('hacker@evil.test', (string) $themeJson);
        $this->assertStringContainsString('Alpha roast', (string) $themeJson);

        $this->postJson('/api/stores/store-a/reviews', [
            'author' => 'Alpha',
            'comment' => 'Alpha cup review',
        ])->assertCreated();

        $seo = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/ai/seo', ['page_id' => $page['id']])
            ->assertOk()
            ->json();
        $this->assertStringNotContainsString('Beta', json_encode($seo));

        $this->setStoreSetting('store-a', ['allow_custom_css' => false]);
        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$page['id'], [
                'draft_layout' => ['customCss' => '.price{color:red}', 'blocks' => []],
            ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Custom CSS is turned off for this store.');

        $this->setStoreSetting('store-a', ['theme_builder' => false]);
        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$page['id'], [
                'draft_layout' => ['blocks' => []],
            ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Theme builder is not available for this store.');

        Sanctum::actingAs($this->memberOf('store-b'));
        $other = $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages', [
                'slug' => 'offers',
                'type' => 'custom',
                'title_en' => 'Beta page',
            ])
            ->assertCreated()
            ->json('data');
        $this->withHeader('X-Store-Id', 'store-b')
            ->putJson('/api/stores/store-b/pages/'.$other['id'], [
                'seo' => ['seo_title_en' => 'Beta SEO'],
                'draft_layout' => [
                    'blocks' => [[
                        'id' => 'h1',
                        'type' => 'heading',
                        'visible' => true,
                        'settings' => ['htmlTag' => 'h1', 'textEn' => 'Beta heading'],
                    ]],
                ],
            ])
            ->assertOk();
        $this->withHeader('X-Store-Id', 'store-b')
            ->putJson('/api/stores/store-b/theme-settings', [
                'publish' => true,
                'settings' => ['announcement' => ['textEn' => 'Beta roast']],
            ])
            ->assertOk();
        $this->postJson('/api/stores/store-b/reviews', [
            'author' => 'Beta',
            'comment' => 'Beta cup review',
        ])->assertCreated();

        $this->assertSame('Alpha page', DB::table('theme_pages')->where('store_id', 'store-a')->value('title_en'));
        $this->assertSame('Beta page', DB::table('theme_pages')->where('store_id', 'store-b')->value('title_en'));
        $this->assertSame('Alpha SEO', json_decode((string) DB::table('theme_pages')->where('id', $page['id'])->value('seo'), true)['seo_title_en']);
        $this->assertSame('Beta SEO', json_decode((string) DB::table('theme_pages')->where('id', $other['id'])->value('seo'), true)['seo_title_en']);
        $this->assertStringContainsString('store-a', (string) DB::table('media')->where('id', 'med-a')->value('url'));
        $this->assertStringContainsString('store-b', (string) DB::table('media')->where('id', 'med-b')->value('url'));
        $this->assertStringNotContainsString('Beta roast', (string) DB::table('store_themes')->where('store_id', 'store-a')->value('settings'));
        $reviewsA = json_encode(DB::table('store_settings')->where('store_id', 'store-a')->value('settings'));
        $this->assertStringContainsString('Alpha cup review', (string) $reviewsA);
        $this->assertStringNotContainsString('Beta cup review', (string) $reviewsA);

        Sanctum::actingAs($this->memberOf('store-free'));
        $free = $this->withHeader('X-Store-Id', 'store-free')
            ->postJson('/api/stores/store-free/pages', [
                'slug' => 'offers',
                'type' => 'custom',
                'title_en' => 'Free page',
            ])
            ->assertCreated()
            ->json('data');
        $this->withHeader('X-Store-Id', 'store-free')
            ->putJson('/api/stores/store-free/pages/'.$free['id'], [
                'draft_layout' => [
                    'blocks' => [[
                        'id' => 'members',
                        'type' => 'text',
                        'visible' => true,
                        'settings' => ['textEn' => 'Members offer', 'display' => ['audience' => 'logged_in']],
                    ]],
                ],
            ])
            ->assertOk();
        $this->withHeader('X-Store-Id', 'store-free')
            ->postJson('/api/stores/store-free/pages/'.$free['id'].'/publish')
            ->assertOk();
        $freeGuest = json_encode($this->getJson('/api/storefront/theme?store_id=store-free&slug=offers&visitor=guest&device=desktop')->json('page.published_layout'));
        $this->assertStringContainsString('Members offer', (string) $freeGuest);
    }

    /**
     * @param  array<string, mixed>  $patch
     */
    private function setStoreSetting(string $storeId, array $patch): void
    {
        $row = DB::table('store_settings')->where('store_id', $storeId)->first();
        $settings = $row ? json_decode((string) $row->settings, true) : [];
        if (! is_array($settings)) {
            $settings = [];
        }
        $settings = array_merge($settings, $patch);
        if ($row) {
            DB::table('store_settings')->where('store_id', $storeId)->update([
                'settings' => json_encode($settings),
                'updated_at' => now(),
            ]);

            return;
        }
        DB::table('store_settings')->insert([
            'id' => 'sst-'.$storeId,
            'store_id' => $storeId,
            'settings' => json_encode($settings),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
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

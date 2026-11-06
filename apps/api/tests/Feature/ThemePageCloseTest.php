<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemePageCloseTest extends TestCase
{
    use RefreshDatabase;

    public function test_empty_store_order_and_security_stay_isolated(): void
    {
        $this->insertStore('store-empty', 'free');
        $this->insertStore('store-shop', 'pro');
        $this->insertStore('store-free', 'free');
        $this->insertStore('store-a', 'pro');
        $this->insertStore('store-b', 'pro');

        $catalog = $this->getJson('/api/storefront/catalog?store_id=store-empty')->assertOk();
        $this->assertSame([], $catalog->json('data'));
        $this->assertSame(0, $catalog->json('meta.total'));
        $this->assertSame([], $catalog->json('categories'));
        $encodedCatalog = json_encode($catalog->json());
        $this->assertStringNotContainsString('Flora', (string) $encodedCatalog);
        $this->assertStringNotContainsString('1240', (string) $encodedCatalog);

        $reviews = $this->getJson('/api/stores/store-empty/reviews')->assertOk();
        $this->assertSame([], $reviews->json('data'));

        $theme = $this->getJson('/api/storefront/theme?store_id=store-empty')->assertOk();
        $this->assertSame([], $theme->json('theme.blocks'));
        $this->assertStringNotContainsString('Flora', (string) json_encode($theme->json('theme')));

        $this->getJson('/api/storefront/theme?store_id=missing-store')->assertNotFound();
        $this->getJson('/api/storefront/sitemap?store_id=missing-store')->assertNotFound();

        $this->postJson('/api/storefront/customers', [
            'store_id' => 'store-shop',
            'name' => 'Noura',
            'email' => 'noura@store-shop.test',
            'phone' => '0550001122',
            'city' => 'Makkah',
        ])->assertOk();
        $this->assertSame('store-shop', DB::table('customers')->where('email', 'noura@store-shop.test')->value('store_id'));

        $order = $this->postJson('/api/storefront/orders', [
            'store_id' => 'store-shop',
            'customer_name' => 'Noura',
            'customer_phone' => '0550001122',
            'customer_email' => 'noura@store-shop.test',
            'total_amount' => 40,
            'currency' => 'SAR',
            'delivery_location' => 'Makkah',
            'items' => [[
                'name' => 'Cup',
                'quantity' => 1,
                'price' => 40,
            ]],
        ])->assertCreated();
        $orderId = (string) $order->json('data.id');
        $this->assertNotSame('', $orderId);
        $this->assertSame('store-shop', DB::table('orders')->where('id', $orderId)->value('store_id'));
        $this->assertSame(0, DB::table('orders')->where('store_id', 'store-empty')->count());

        Sanctum::actingAs($this->memberOf('store-shop'));
        $page = $this->withHeader('X-Store-Id', 'store-shop')
            ->postJson('/api/stores/store-shop/pages', [
                'slug' => 'thanks',
                'type' => 'thankyou',
                'title_en' => 'Thank you',
                'title_ar' => 'شكراً',
            ])
            ->assertCreated()
            ->json('data');
        $this->withHeader('X-Store-Id', 'store-shop')
            ->putJson('/api/stores/store-shop/pages/'.$page['id'], [
                'draft_layout' => [
                    'blocks' => [[
                        'id' => 'h1',
                        'type' => 'heading',
                        'visible' => true,
                        'settings' => ['htmlTag' => 'h1', 'textEn' => 'Thank you', 'textAr' => 'شكراً'],
                    ]],
                ],
            ])
            ->assertOk();
        $this->withHeader('X-Store-Id', 'store-shop')
            ->postJson('/api/stores/store-shop/pages/'.$page['id'].'/publish')
            ->assertOk();

        $this->assertEquals(40, (float) DB::table('orders')->where('id', $orderId)->value('total_amount'));
        $this->assertSame('Noura', DB::table('orders')->where('id', $orderId)->value('customer_name'));
        $this->assertSame(1, DB::table('orders')->where('store_id', 'store-shop')->count());

        Sanctum::actingAs($this->memberOf('store-a'));
        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-b/pages/missing', [
                'draft_layout' => ['blocks' => []],
            ])
            ->assertForbidden();

        $own = $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages', [
                'slug' => 'note',
                'type' => 'custom',
                'title_en' => 'Alpha note',
            ])
            ->assertCreated()
            ->json('data');
        $this->withHeader('X-Store-Id', 'store-a')
            ->putJson('/api/stores/store-a/pages/'.$own['id'], [
                'draft_layout' => [
                    'blocks' => [[
                        'id' => 'xss',
                        'type' => 'text',
                        'visible' => true,
                        'settings' => ['textEn' => '<img src=x onerror=alert(1)>Hello<script>alert(1)</script>'],
                    ]],
                ],
            ])
            ->assertOk();
        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/stores/store-a/pages/'.$own['id'].'/publish')
            ->assertOk();
        $published = DB::table('theme_pages')->where('id', $own['id'])->value('published_layout');
        $publishedJson = is_string($published) ? $published : json_encode($published);
        $this->assertStringNotContainsString('<script', (string) $publishedJson);
        $this->assertStringNotContainsString('onerror', (string) $publishedJson);

        Sanctum::actingAs($this->memberOf('store-b'));
        $other = $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages', [
                'slug' => 'note',
                'type' => 'custom',
                'title_en' => 'Beta note',
            ])
            ->assertCreated()
            ->json('data');
        $this->withHeader('X-Store-Id', 'store-b')
            ->putJson('/api/stores/store-b/pages/'.$other['id'], [
                'draft_layout' => [
                    'blocks' => [[
                        'id' => 'h',
                        'type' => 'heading',
                        'visible' => true,
                        'settings' => ['htmlTag' => 'h1', 'textEn' => 'Beta only'],
                    ]],
                ],
            ])
            ->assertOk();
        $this->withHeader('X-Store-Id', 'store-b')
            ->postJson('/api/stores/store-b/pages/'.$other['id'].'/publish')
            ->assertOk();

        $alpha = json_encode($this->getJson('/api/storefront/theme?store_id=store-a&slug=note')->json());
        $this->assertStringNotContainsString('Beta only', (string) $alpha);

        Sanctum::actingAs($this->memberOf('store-free'));
        $free = $this->withHeader('X-Store-Id', 'store-free')
            ->postJson('/api/stores/store-free/pages', [
                'slug' => 'free',
                'type' => 'custom',
                'title_en' => 'Free',
            ])
            ->assertCreated()
            ->json('data');
        $this->withHeader('X-Store-Id', 'store-free')
            ->putJson('/api/stores/store-free/pages/'.$free['id'], [
                'draft_layout' => ['customHtml' => '<p>x</p>', 'blocks' => []],
            ])
            ->assertForbidden();
        $this->withHeader('X-Store-Id', 'store-free')
            ->putJson('/api/stores/store-free/pages/'.$free['id'], [
                'draft_layout' => ['customCss' => '.x{color:red}', 'blocks' => []],
            ])
            ->assertForbidden();
        $this->withHeader('X-Store-Id', 'store-free')
            ->postJson('/api/stores/store-free/ai/seo', ['page_id' => $free['id']])
            ->assertForbidden();
    }

    private function insertStore(string $id, string $plan): void
    {
        DB::table('stores')->insert([
            'id' => $id,
            'name' => $id,
            'slug' => $id,
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

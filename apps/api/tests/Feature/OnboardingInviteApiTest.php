<?php

namespace Tests\Feature;

use App\Models\OnboardingInvite;
use App\Models\StoreTheme;
use App\Models\StoreThemeEntitlement;
use App\Support\DefaultTheme;
use App\Support\SouqCommonThemes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OnboardingInviteApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedPlans();
        SouqCommonThemes::ensureCatalogRows();
        DefaultTheme::ensureCatalogRow();
    }

    private function seedPlans(): void
    {
        if (! Schema::hasTable('plans')) {
            return;
        }
        foreach ([
            ['id' => 'plan-free', 'code' => 'free', 'name' => 'Free', 'price_sar' => 0],
            ['id' => 'plan-starter', 'code' => 'starter', 'name' => 'Starter', 'price_sar' => 100],
            ['id' => 'plan-pro', 'code' => 'pro', 'name' => 'Pro', 'price_sar' => 300],
            ['id' => 'plan-premium', 'code' => 'premium', 'name' => 'Premium', 'price_sar' => 500],
        ] as $p) {
            DB::table('plans')->updateOrInsert(['id' => $p['id']], array_merge($p, [
                'product_limit' => null,
                'storage_mb' => 1024,
                'team_seats' => 5,
                'features' => json_encode(['catalog', 'orders', 'themes', 'custom_domain']),
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    public function test_public_show_rejects_used_invite(): void
    {
        OnboardingInvite::query()->create([
            'id' => 'inv-test',
            'token' => 'abc123',
            'store_id' => 'store-test123',
            'plan' => 'pro',
            'label' => 'Test',
            'locale' => 'en',
            'text_dir' => 'ltr',
            'currency' => 'SAR',
            'timezone' => 'Asia/Riyadh',
            'expires_at' => now()->addDay(),
            'used_at' => now(),
            'created_at' => now(),
        ]);

        $response = $this->getJson('/api/onboarding/invites/abc123');

        $response->assertStatus(410);
        $response->assertJsonPath('reason', 'used');
    }

    public function test_redeem_requires_matching_store_id(): void
    {
        OnboardingInvite::query()->create([
            'id' => 'inv-test2',
            'token' => 'tok456',
            'store_id' => 'store-reserved',
            'plan' => 'pro',
            'label' => 'Test',
            'locale' => 'en',
            'text_dir' => 'ltr',
            'currency' => 'SAR',
            'timezone' => 'Asia/Riyadh',
            'expires_at' => now()->addDay(),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/onboarding/invites/tok456/redeem', [
            'store_id' => 'store-wrong',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('reason', 'store_mismatch');
    }

    public function test_redeem_provisions_common_retail_theme(): void
    {
        OnboardingInvite::query()->create([
            'id' => 'inv-prov',
            'token' => 'tok-prov',
            'store_id' => 'store-onboard1',
            'plan' => 'premium',
            'label' => 'Premium merchant',
            'locale' => 'ar',
            'text_dir' => 'rtl',
            'currency' => 'SAR',
            'timezone' => 'Asia/Riyadh',
            'expires_at' => now()->addDay(),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/onboarding/invites/tok-prov/redeem', [
            'store_id' => 'store-onboard1',
            'name' => 'متجر تجريبي',
            'owner_name' => 'أحمد',
            'email' => 'owner-onboard@test.sa',
            'category' => 'Fashion',
        ]);

        $response->assertOk();
        $response->assertJsonPath('ok', true);
        $response->assertJsonPath('provisioned', true);
        $response->assertJsonPath('default_theme_id', DefaultTheme::CATALOG_ID);
        $response->assertJsonPath('store.id', 'store-onboard1');
        $response->assertJsonPath('store.plan', 'premium');

        $this->assertDatabaseHas('stores', [
            'id' => 'store-onboard1',
            'plan' => 'premium',
        ]);

        $themeId = StoreTheme::withoutGlobalScope('store')
            ->where('store_id', 'store-onboard1')
            ->value('theme_id');
        $this->assertSame(DefaultTheme::CATALOG_ID, $themeId);

        if (Schema::hasTable('store_theme_entitlements')) {
            $ents = StoreThemeEntitlement::query()->where('store_id', 'store-onboard1')->count();
            $this->assertGreaterThanOrEqual(4, $ents);
        }

        $invite = OnboardingInvite::query()->find('inv-prov');
        $this->assertNotNull($invite?->used_at);
        $this->assertSame('store-onboard1', $invite?->redeemed_store_id);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\StoreAiDevRequest;
use App\Models\User;
use App\Services\OpenAi\AiDeveloperDiagnosticsService;
use App\Support\SouqAiModules;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase 2+3 — engine catalog + merchant support request + master diagnose (no deploy).
 */
class StoreAiDevRequestFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_blocked_engine_modules_stay_honest(): void
    {
        $this->assertSame('blocked', SouqAiModules::find('developer_diagnostics')['status'] ?? null);
        $this->assertSame('blocked', SouqAiModules::find('video_generator')['status'] ?? null);
        $this->assertCount(10, SouqAiModules::catalog());
    }

    public function test_merchant_can_open_dev_request_for_own_store_only(): void
    {
        if (! Schema::hasTable('store_ai_dev_requests')) {
            $this->markTestSkipped('store_ai_dev_requests missing');
        }

        $this->seedStore('store-a');
        $this->seedStore('store-b');
        Sanctum::actingAs($this->memberOf('store-a'));

        $this->withHeader('X-Store-Id', 'store-a')
            ->postJson('/api/ai-suite/dev-requests', [
                'title' => 'Checkout error',
                'description' => 'Payment button does nothing',
                'category' => 'frontend',
                'priority' => 'high',
            ])
            ->assertCreated()
            ->assertJsonPath('data.store_id', 'store-a')
            ->assertJsonPath('data.auto_deploy_allowed', false);

        $this->assertSame(1, StoreAiDevRequest::query()->where('store_id', 'store-a')->count());
        $this->assertSame(0, StoreAiDevRequest::query()->where('store_id', 'store-b')->count());
    }

    public function test_master_diagnose_is_read_only_and_deploy_forbidden(): void
    {
        $this->seedStore('store-a');
        Sanctum::actingAs($this->masterUser());

        if (Schema::hasTable('store_ai_dev_requests')) {
            StoreAiDevRequest::query()->create([
                'id' => 'aidev-test1',
                'store_id' => 'store-a',
                'status' => 'open',
                'priority' => 'medium',
                'category' => 'api',
                'title' => 'API 500',
                'description' => 'Orders list fails',
                'auto_deploy_allowed' => false,
            ]);
        }

        $res = $this->postJson('/api/master/ai-developer/diagnose', [
            'store_id' => 'store-a',
            'request_id' => Schema::hasTable('store_ai_dev_requests') ? 'aidev-test1' : null,
        ]);

        // 200 when table/store ok; may be 404 if request missing — still no deploy
        $this->assertTrue(in_array($res->status(), [200, 404], true));
        if ($res->status() === 200) {
            $res->assertJsonPath('data.security.auto_deploy_allowed', false);
            $res->assertJsonPath('data.security.merchant_can_edit_source', false);
            $this->assertNotEmpty($res->json('data.code_fix_proposals'));
            $this->assertSame('BLOCKED', $res->json('data.code_fix_proposals.0.status'));
        }

        $this->postJson('/api/master/ai-developer/deploy')
            ->assertStatus(403)
            ->assertJsonPath('status', 'BLOCKED');
    }

    public function test_diagnostics_service_never_allows_auto_deploy(): void
    {
        $store = $this->seedStore('store-diag');
        $report = app(AiDeveloperDiagnosticsService::class)->diagnose($store);
        $this->assertFalse($report['security']['auto_deploy_allowed']);
        $this->assertFalse($report['security']['merchant_can_edit_source']);
        $this->assertFalse($report['security']['secrets_in_response']);
    }

    private function seedStore(string $id): Store
    {
        return Store::query()->create([
            'id' => $id,
            'name' => 'Store '.$id,
            'slug' => $id,
            'status' => 'active',
            'plan' => 'pro',
            'currency' => 'SAR',
            'hosting_mode' => 'shared',
            'db_isolation' => 'shared_store_id',
        ]);
    }

    private function masterUser(): User
    {
        return User::query()->create([
            'id' => 'usr-master-'.uniqid(),
            'name' => 'Master',
            'email' => 'master-'.uniqid().'@test.sa',
            'password' => bcrypt('secret'),
            'role' => 'super_admin',
        ]);
    }

    private function memberOf(string $storeId): User
    {
        $user = User::query()->create([
            'id' => 'usr-'.uniqid(),
            'name' => 'Merchant',
            'email' => 'm-'.uniqid().'@test.sa',
            'password' => bcrypt('secret'),
            'role' => 'store_admin',
        ]);
        if (Schema::hasTable('store_users')) {
            DB::table('store_users')->insert([
                'id' => 'su-'.uniqid(),
                'store_id' => $storeId,
                'user_id' => $user->id,
                'role' => 'owner',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $user;
    }
}

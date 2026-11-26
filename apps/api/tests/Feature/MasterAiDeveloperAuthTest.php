<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Phase 3 — AI developer routes stay Master-gated; auto-deploy always forbidden.
 */
class MasterAiDeveloperAuthTest extends TestCase
{
    public function test_unauthenticated_ai_developer_index_returns_401(): void
    {
        $this->getJson('/api/master/ai-developer/requests')->assertStatus(401);
    }

    public function test_unauthenticated_diagnose_returns_401(): void
    {
        $this->postJson('/api/master/ai-developer/diagnose', [
            'store_id' => 'store-1',
        ])->assertStatus(401);
    }

    public function test_unauthenticated_deploy_returns_401(): void
    {
        $this->postJson('/api/master/ai-developer/deploy')->assertStatus(401);
    }

    public function test_store_dev_requests_require_auth(): void
    {
        $this->getJson('/api/ai-suite/dev-requests')->assertStatus(401);
        $this->postJson('/api/ai-suite/dev-requests', [
            'title' => 'Checkout broken',
            'description' => 'Orders fail on pay',
        ])->assertStatus(401);
    }
}

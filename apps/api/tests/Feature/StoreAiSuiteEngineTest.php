<?php

namespace Tests\Feature;

use App\Support\SouqAiModules;
use Tests\TestCase;

/**
 * Phase 2 — central AI engine routes stay auth-gated; blocked modules stay honest.
 */
class StoreAiSuiteEngineTest extends TestCase
{
    public function test_ai_suite_status_requires_auth(): void
    {
        $this->getJson('/api/ai-suite/status')->assertStatus(401);
    }

    public function test_ai_suite_modules_requires_auth(): void
    {
        $this->getJson('/api/ai-suite/modules')->assertStatus(401);
    }

    public function test_ai_suite_run_requires_auth(): void
    {
        $this->postJson('/api/ai-suite/run', [
            'module' => 'store_advisor',
            'prompt' => 'Help with my store',
        ])->assertStatus(401);
    }

    public function test_catalog_has_ten_modules_with_honest_blocked(): void
    {
        $catalog = SouqAiModules::catalog();
        $this->assertCount(11, $catalog);

        $ids = SouqAiModules::ids();
        $this->assertContains('store_advisor', $ids);
        $this->assertContains('developer_diagnostics', $ids);
        $this->assertContains('voice_partner', $ids);
        $this->assertContains('video_generator', $ids);
        $this->assertContains('analytics_assistant', $ids);
        $this->assertContains('product_description', $ids);

        $dev = SouqAiModules::find('developer_diagnostics');
        $this->assertSame('available', $dev['status'] ?? null);
        $this->assertSame('text', $dev['gate'] ?? null);

        $voice = SouqAiModules::find('voice_partner');
        $this->assertSame('available', $voice['status'] ?? null);
        $this->assertSame('text', $voice['gate'] ?? null);

        $video = SouqAiModules::find('video_generator');
        $this->assertSame('blocked', $video['status'] ?? null);

        $advisor = SouqAiModules::find('store_advisor');
        $this->assertSame('available', $advisor['status'] ?? null);
        $this->assertSame('text', $advisor['gate'] ?? null);

        $analytics = SouqAiModules::find('analytics_assistant');
        $this->assertSame('automation', $analytics['gate'] ?? null);
    }

    public function test_ai_suite_run_blocked_module_without_auth_still_401(): void
    {
        $this->postJson('/api/ai-suite/run', [
            'module' => 'video_generator',
            'prompt' => 'make a promo video',
        ])->assertStatus(401);
    }
}

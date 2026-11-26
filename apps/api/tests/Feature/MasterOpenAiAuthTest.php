<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * OpenAI Master routes stay auth-gated and never leak secrets unauthenticated.
 */
class MasterOpenAiAuthTest extends TestCase
{
    public function test_unauthenticated_openai_overview_returns_401(): void
    {
        $this->getJson('/api/master/openai/overview')->assertStatus(401);
    }

    public function test_unauthenticated_openai_stores_returns_401(): void
    {
        $this->getJson('/api/master/openai/stores')->assertStatus(401);
    }

    public function test_unauthenticated_openai_complete_returns_401(): void
    {
        $this->postJson('/api/master/openai/stores/store-1/complete', [
            'prompt' => 'hello',
        ])->assertStatus(401);
    }

    public function test_unauthenticated_openai_unlock_suite_returns_401(): void
    {
        $this->postJson('/api/master/openai/unlock-suite', [
            'scope' => 'all',
            'method' => 'comp',
            'days' => 30,
        ])->assertStatus(401);
    }

    public function test_gemini_ai_media_routes_still_registered(): void
    {
        // Gemini path must remain reachable as a route (auth still required).
        $this->getJson('/api/ai-media/quota')->assertStatus(401);
    }
}

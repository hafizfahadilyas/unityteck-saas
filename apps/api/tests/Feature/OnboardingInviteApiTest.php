<?php

namespace Tests\Feature;

use App\Models\OnboardingInvite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingInviteApiTest extends TestCase
{
    use RefreshDatabase;

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
}

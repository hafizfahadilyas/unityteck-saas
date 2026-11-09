<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiRouteAuthTest extends TestCase
{
    public function test_unauthenticated_blog_write_returns_401(): void
    {
        $response = $this->postJson('/api/stores/store-coffee/blog/articles', [
            'title' => 'Audit probe',
            'category' => 'news',
            'status' => 'draft',
        ], [
            'X-Store-Id' => 'store-coffee',
        ]);

        $response->assertStatus(401);
    }

    public function test_unauthenticated_whatsapp_send_returns_401(): void
    {
        $response = $this->postJson('/api/whatsapp/messages', [
            'to' => '+966500000000',
            'body' => 'probe',
        ], [
            'X-Store-Id' => 'store-coffee',
        ]);

        $response->assertStatus(401);
    }

    public function test_unauthenticated_master_whatsapp_quotas_returns_401(): void
    {
        $response = $this->getJson('/api/master/whatsapp/quotas');

        $response->assertStatus(401);
    }
}

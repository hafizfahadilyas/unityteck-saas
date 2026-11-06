<?php

namespace Tests\Unit;

use App\Support\ThemeLayoutGuard;
use PHPUnit\Framework\TestCase;

class ThemeLayoutGuardTest extends TestCase
{
    public function test_script_owner_email_and_foreign_products_are_removed(): void
    {
        $result = ThemeLayoutGuard::prepare([
            'ownerEmail' => 'a@store.test',
            'blocks' => [[
                'html' => '<p>ok</p><script>alert(1)</script>',
                'products' => [
                    ['id' => 'mine', 'store_id' => 'store-a'],
                    ['id' => 'theirs', 'store_id' => 'store-b'],
                ],
            ]],
        ], 'store-a', false, 'pro');

        $this->assertFalse($result['denied']);
        $this->assertArrayNotHasKey('ownerEmail', $result['layout']);
        $this->assertSame('<p>ok</p>', $result['layout']['blocks'][0]['html']);
        $this->assertCount(1, $result['layout']['blocks'][0]['products']);
        $this->assertSame('mine', $result['layout']['blocks'][0]['products'][0]['id']);
    }

    public function test_free_plan_cannot_save_custom_html(): void
    {
        $result = ThemeLayoutGuard::prepare([
            'blocks' => [['customHtml' => '<p>x</p>']],
        ], 'store-a', false, 'free');

        $this->assertTrue($result['denied']);
    }

    public function test_publish_drops_hidden_and_expired_blocks(): void
    {
        $result = ThemeLayoutGuard::prepare([
            'blocks' => [
                ['id' => 'live', 'visible' => true],
                ['id' => 'hidden', 'visible' => false],
                ['id' => 'old', 'visible' => true, 'endsAt' => '2000-01-01T00:00:00Z'],
            ],
        ], 'store-a', true, 'pro');

        $ids = array_column($result['layout']['blocks'], 'id');
        $this->assertSame(['live'], $ids);
    }

    public function test_two_h1_tags_warn(): void
    {
        $result = ThemeLayoutGuard::prepare([
            'blocks' => [
                ['tag' => 'h1'],
                ['tag' => 'h1'],
            ],
        ], 'store-a', true, 'pro');

        $this->assertContains('multiple-h1', $result['warnings']);
    }

    public function test_heading_widget_tag_is_normalized_once(): void
    {
        $result = ThemeLayoutGuard::prepare([
            'blocks' => [[
                'id' => 'h',
                'type' => 'heading',
                'visible' => true,
                'settings' => ['htmlTag' => 'h1', 'textEn' => 'Hello', 'textAr' => 'مرحبا'],
            ]],
        ], 'store-a', true, 'pro');

        $this->assertSame('h1', $result['layout']['blocks'][0]['settings']['tag']);
        $this->assertNotContains('missing-h1', $result['warnings']);
        $this->assertNotContains('multiple-h1', $result['warnings']);
    }
}

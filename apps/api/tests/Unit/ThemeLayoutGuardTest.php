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

    public function test_publish_lists_h1_widget_ids_and_missing_alt_without_blocking(): void
    {
        $result = ThemeLayoutGuard::prepare([
            'blocks' => [
                ['id' => 'a', 'type' => 'heading', 'settings' => ['tag' => 'h1', 'textEn' => 'One']],
                ['id' => 'b', 'type' => 'heading', 'settings' => ['tag' => 'h1', 'textEn' => 'Two']],
                ['id' => 'bare', 'type' => 'image', 'settings' => ['altEn' => '']],
                ['id' => 'captioned', 'type' => 'image', 'settings' => ['altEn' => 'Cup']],
            ],
        ], 'store-a', true, 'pro');

        $this->assertContains('multiple-h1', $result['warnings']);
        $this->assertContains('h1:a', $result['warnings']);
        $this->assertContains('h1:b', $result['warnings']);
        $this->assertContains('missing-alt:bare', $result['warnings']);
        $this->assertNotContains('missing-alt:captioned', $result['warnings']);
        $this->assertFalse($result['denied']);
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

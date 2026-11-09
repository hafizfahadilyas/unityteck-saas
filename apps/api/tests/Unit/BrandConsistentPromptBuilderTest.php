<?php

namespace Tests\Unit;

use App\Support\BrandConsistentPromptBuilder;
use PHPUnit\Framework\TestCase;

class BrandConsistentPromptBuilderTest extends TestCase
{
    public function test_brand_lock_off_returns_raw_prompt(): void
    {
        $raw = 'A women\'s handbag on a table';
        $out = BrandConsistentPromptBuilder::build($raw, [
            'brand_lock' => false,
            'palette_hex' => ['#1A2B3C'],
            'persona' => 'luxury',
        ]);
        $this->assertSame($raw, $out);
    }

    public function test_brand_lock_merges_colors_and_persona(): void
    {
        $out = BrandConsistentPromptBuilder::build('A women\'s handbag on a table', [
            'brand_lock' => true,
            'palette_hex' => ['#1A2B3C', '#E0E0E0'],
            'persona' => 'luxury',
            'campaign_preset' => 'none',
        ]);
        $this->assertStringContainsString('handbag', $out);
        $this->assertStringContainsString('#1A2B3C', $out);
        $this->assertStringContainsString('#E0E0E0', $out);
        $this->assertStringContainsString('luxury', $out);
    }

    public function test_campaign_and_product_injection_hints(): void
    {
        $out = BrandConsistentPromptBuilder::build('perfume bottle', [
            'brand_lock' => true,
            'persona' => 'minimalist',
            'campaign_preset' => 'ramadan',
            'product_injection' => true,
            'match_perspective' => true,
            'palette_hex' => ['#0F766E'],
        ]);
        $this->assertStringContainsString('Ramadan', $out);
        $this->assertStringContainsString('camera angle', $out);
        $this->assertStringContainsString('#0F766E', $out);
    }

    public function test_output_template_aspect_map(): void
    {
        $this->assertSame('16:9', BrandConsistentPromptBuilder::aspectForTemplate('store_banner'));
        $this->assertSame('9:16', BrandConsistentPromptBuilder::aspectForTemplate('snapchat_story'));
        $this->assertNull(BrandConsistentPromptBuilder::aspectForTemplate('unknown'));
    }

    public function test_palette_normalization(): void
    {
        $this->assertSame(
            ['#AABBCC', '#112233'],
            BrandConsistentPromptBuilder::normalizePalette(['#abc', 'notahex', '#AABBCC', '#112233']),
        );
    }
}

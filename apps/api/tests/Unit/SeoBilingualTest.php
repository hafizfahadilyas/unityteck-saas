<?php

namespace Tests\Unit;

use App\Support\SeoBilingual;
use PHPUnit\Framework\TestCase;

class SeoBilingualTest extends TestCase
{
    public function test_bilingual_fields_move_into_extra_and_keep_legacy_title(): void
    {
        $out = SeoBilingual::absorb([
            'meta_title' => 'Legacy',
            'meta_title_en' => 'Hello',
            'meta_title_ar' => 'مرحبا',
            'meta_description_en' => 'Desc',
            'extra' => ['total_search_clicks' => 0],
        ]);

        $this->assertSame('Legacy', $out['meta_title']);
        $this->assertArrayNotHasKey('meta_title_en', $out);
        $this->assertSame('Hello', $out['extra']['meta_title_en']);
        $this->assertSame('مرحبا', $out['extra']['meta_title_ar']);
        $this->assertSame(0, $out['extra']['total_search_clicks']);
    }
}

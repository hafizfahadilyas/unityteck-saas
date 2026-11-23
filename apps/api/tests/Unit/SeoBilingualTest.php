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

    public function test_llms_txt_moves_into_extra(): void
    {
        $out = SeoBilingual::absorb([
            'llms_txt' => "# Shop\n",
            'extra' => ['avg_ctr' => 1.2],
        ]);

        $this->assertArrayNotHasKey('llms_txt', $out);
        $this->assertSame("# Shop\n", $out['extra']['llms_txt']);
        $this->assertSame(1.2, $out['extra']['avg_ctr']);
    }
}

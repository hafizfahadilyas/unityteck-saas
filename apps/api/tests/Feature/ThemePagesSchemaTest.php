<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ThemePagesSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_theme_pages_are_isolated_by_store_and_slug(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');

        DB::table('theme_pages')->insert([
            'id' => 'page-a-home',
            'store_id' => 'store-a',
            'slug' => 'home',
            'type' => 'home',
            'title_en' => 'Store A home',
            'header_mode' => 'global',
            'footer_mode' => 'global',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('theme_pages')->insert([
            'id' => 'page-b-home',
            'store_id' => 'store-b',
            'slug' => 'home',
            'type' => 'home',
            'title_en' => 'Store B home',
            'header_mode' => 'global',
            'footer_mode' => 'global',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $storeA = DB::table('theme_pages')->where('store_id', 'store-a')->pluck('title_en')->all();
        $this->assertSame(['Store A home'], $storeA);
        $this->assertNotContains('Store B home', $storeA);

        $this->expectException(QueryException::class);
        DB::table('theme_pages')->insert([
            'id' => 'page-a-home-dup',
            'store_id' => 'store-a',
            'slug' => 'home',
            'type' => 'home',
            'header_mode' => 'global',
            'footer_mode' => 'global',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_global_styles_and_revisions_do_not_cross_stores(): void
    {
        $this->insertStore('store-a', 'store-a');
        $this->insertStore('store-b', 'store-b');

        $pageId = 'page-a-about';
        DB::table('theme_pages')->insert([
            'id' => $pageId,
            'store_id' => 'store-a',
            'slug' => 'about',
            'type' => 'about',
            'header_mode' => 'global',
            'footer_mode' => 'global',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('theme_global_styles')->insert([
            'id' => 'styles-a',
            'store_id' => 'store-a',
            'styles' => json_encode(['color' => '#111111']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('theme_global_styles')->insert([
            'id' => 'styles-b',
            'store_id' => 'store-b',
            'styles' => json_encode(['color' => '#222222']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('theme_revisions')->insert([
            'id' => 'rev-a',
            'store_id' => 'store-a',
            'page_id' => $pageId,
            'snapshot' => json_encode(['slug' => 'about']),
            'created_at' => now(),
        ]);

        $colors = DB::table('theme_global_styles')->where('store_id', 'store-a')->pluck('styles')->all();
        $this->assertCount(1, $colors);
        $this->assertStringContainsString('#111111', (string) $colors[0]);
        $this->assertStringNotContainsString('#222222', (string) $colors[0]);

        $revisions = DB::table('theme_revisions')->where('store_id', 'store-b')->count();
        $this->assertSame(0, $revisions);
    }

    private function insertStore(string $id, string $slug): void
    {
        DB::table('stores')->insert([
            'id' => $id,
            'name' => $id,
            'slug' => $slug,
            'status' => 'active',
            'plan' => 'free',
            'currency' => 'SAR',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
};

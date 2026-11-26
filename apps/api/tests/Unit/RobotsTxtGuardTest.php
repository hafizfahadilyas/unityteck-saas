<?php

namespace Tests\Unit;

use App\Support\RobotsTxtGuard;
use PHPUnit\Framework\TestCase;

class RobotsTxtGuardTest extends TestCase
{
    public function test_rejects_foreign_sitemap_hosts(): void
    {
        $poison = "User-agent: *\nAllow: /\nSitemap: https://bashayer-logistics.com/sitemap.xml\n";
        $this->assertTrue(RobotsTxtGuard::isPoison($poison, 'giftshop-sa.com'));
        $safe = RobotsTxtGuard::sanitize($poison, 'https://giftshop-sa.com');
        $this->assertStringContainsString('Sitemap: https://giftshop-sa.com/sitemap.xml', $safe);
        $this->assertStringNotContainsString('bashayer', $safe);
    }

    public function test_rejects_allow_src_leak(): void
    {
        $poison = "User-agent: *\nAllow: /src/\nSitemap: https://giftshop-sa.com/sitemap.xml\n";
        $this->assertTrue(RobotsTxtGuard::isPoison($poison, 'giftshop-sa.com'));
    }

    public function test_keeps_own_host_custom_robots(): void
    {
        $ok = "User-agent: *\nAllow: /\nDisallow: /private\nSitemap: https://giftshop-sa.com/sitemap.xml\n";
        $this->assertFalse(RobotsTxtGuard::isPoison($ok, 'giftshop-sa.com'));
        $out = RobotsTxtGuard::sanitize($ok, 'https://giftshop-sa.com');
        $this->assertStringContainsString('Disallow: /private', $out);
    }
}

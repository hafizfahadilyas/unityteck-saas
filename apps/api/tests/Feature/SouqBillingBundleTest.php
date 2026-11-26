<?php

namespace Tests\Feature;

use App\Support\SouqBilling;
use Tests\TestCase;

class SouqBillingBundleTest extends TestCase
{
    public function test_period_discounts_15_and_25_percent(): void
    {
        $one = SouqBilling::priceForPeriod(100, 1);
        $this->assertSame(100, $one['total_sar']);
        $this->assertSame(0, $one['discount_pct']);

        $six = SouqBilling::priceForPeriod(100, 6);
        $this->assertSame(15, $six['discount_pct']);
        $this->assertSame(510, $six['total_sar']); // 600 * 0.85

        $year = SouqBilling::priceForPeriod(100, 12);
        $this->assertSame(25, $year['discount_pct']);
        $this->assertSame(900, $year['total_sar']); // 1200 * 0.75
    }

    public function test_public_bundle_endpoint(): void
    {
        $res = $this->getJson('/api/storefront/marketplace/bundle')->assertOk();
        $data = $res->json('data');
        $this->assertIsArray($data['plans'] ?? null);
        $this->assertIsArray($data['addons'] ?? null);
        $this->assertIsArray($data['hosting'] ?? null);
        $this->assertSame(30, (int) ($data['inactivity']['warning_1_days'] ?? 0));
        $this->assertSame(60, (int) ($data['inactivity']['warning_2_days'] ?? 0));
        $this->assertSame(90, (int) ($data['inactivity']['terminate_days'] ?? 0));
        $starter = collect($data['plans'])->firstWhere('code', 'starter');
        $this->assertSame(100, (int) ($starter['price_sar'] ?? 0));
        $this->assertNotEmpty($starter['billing_periods'] ?? []);
    }
}

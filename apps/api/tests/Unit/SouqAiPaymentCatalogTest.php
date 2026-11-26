<?php

namespace Tests\Unit;

use App\Models\Store;
use App\Support\SouqAddOns;
use App\Support\SouqAiModules;
use App\Support\StoreAiSuiteAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SouqAiPaymentCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_suite_levels_and_addons_are_price_first(): void
    {
        $packages = StoreAiSuiteAccess::paymentPackages();
        $this->assertCount(3, $packages);
        $this->assertSame(99, $packages[0]['price_sar']);
        $this->assertSame(249, $packages[1]['price_sar']);
        $this->assertSame(499, $packages[2]['price_sar']);

        $store = Store::query()->create([
            'id' => 'store-ai-pay',
            'name' => 'AI Pay',
            'slug' => 'ai-pay',
            'status' => 'active',
            'plan' => 'starter',
            'currency' => 'SAR',
        ]);

        $addons = array_values(array_filter(
            SouqAddOns::forStore($store),
            static fn (array $row) => in_array((string) ($row['category'] ?? ''), ['ai', 'credits'], true)
                || str_starts_with((string) ($row['id'] ?? ''), 'addon-ai')
        ));

        $this->assertNotEmpty($addons);
        $ids = array_column($addons, 'id');
        $this->assertContains('addon-ai-calling', $ids);
        $this->assertContains('addon-ai-images', $ids);

        foreach ($addons as $row) {
            if (($row['id'] ?? '') === 'addon-ai-calling') {
                $this->assertFalse((bool) ($row['unlocked'] ?? true));
                $this->assertSame(199, (int) $row['price_sar']);
            }
        }

        $this->assertCount(10, SouqAiModules::catalog());
    }
}

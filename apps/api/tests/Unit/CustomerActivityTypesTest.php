<?php

namespace Tests\Unit;

use App\Models\CustomerActivity;
use PHPUnit\Framework\TestCase;

class CustomerActivityTypesTest extends TestCase
{
    public function test_funnel_activity_types_include_shipping_and_payment(): void
    {
        foreach ([
            'product_viewed',
            'add_to_cart',
            'checkout_started',
            'shipping_info_added',
            'payment_info_added',
            'order_created',
        ] as $type) {
            $this->assertContains($type, CustomerActivity::TYPES);
        }
    }
}

<?php

namespace Tests\Unit;

use App\Support\Subscriptions;
use PHPUnit\Framework\TestCase;

class SubscriptionsStatusesTest extends TestCase
{
    public function test_official_statuses_include_phase1_lifecycle(): void
    {
        foreach (['trial', 'active', 'grace', 'expired', 'suspended'] as $status) {
            $this->assertContains($status, Subscriptions::STATUSES);
        }
        $this->assertSame(7, Subscriptions::GRACE_DAYS);
    }
}

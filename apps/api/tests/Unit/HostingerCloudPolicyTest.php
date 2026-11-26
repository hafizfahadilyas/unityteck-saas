<?php

namespace Tests\Unit;

use App\Support\HostingerCloud;
use Tests\TestCase;

class HostingerCloudPolicyTest extends TestCase
{
    public function test_flowers_stays_on_flowers_account(): void
    {
        $this->assertTrue(HostingerCloud::isFlowersStore('store-1'));
        $this->assertSame('flowers', HostingerCloud::accountFor('store-1'));

        $fields = HostingerCloud::applyHostingDefaults([
            'hosting_mode' => 'shared',
            'db_isolation' => 'shared_store_id',
        ], 'store-1');

        $this->assertSame('dedicated', $fields['hosting_mode']);
        $this->assertSame('dedicated_mysql', $fields['db_isolation']);
        $this->assertTrue(HostingerCloud::domainPolicy('store-1')['flowers_stays_separate']);
    }

    public function test_new_and_central_stores_use_shared_central(): void
    {
        foreach (['store-coffee', 'store-bleco', 'store-souq-default', 'store-abc123'] as $id) {
            $this->assertFalse(HostingerCloud::isFlowersStore($id));
            $this->assertSame('central', HostingerCloud::accountFor($id));

            $fields = HostingerCloud::applyHostingDefaults([
                'hosting_mode' => 'dedicated',
                'db_isolation' => 'dedicated_mysql',
            ], $id);

            $this->assertSame('shared', $fields['hosting_mode']);
            $this->assertSame('shared_store_id', $fields['db_isolation']);
        }

        $policy = HostingerCloud::domainPolicy('store-new-1');
        $this->assertSame('central', $policy['account']);
        $this->assertTrue($policy['new_stores_on_central']);
        $this->assertSame('mieraf-ksa.com', $policy['central_host']);
    }
}

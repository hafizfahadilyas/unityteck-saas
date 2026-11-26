<?php

namespace Tests\Feature;

use App\Support\SouqAiModules;
use App\Support\StoreAiSuiteAccess;
use Tests\TestCase;

class StoreAiTrialAndPaymentTest extends TestCase
{
    public function test_free_trial_limit_is_five(): void
    {
        $this->assertSame(5, StoreAiSuiteAccess::FREE_TRIAL_LIMIT);
    }

    public function test_bank_transfer_details_configured_for_souq(): void
    {
        $bank = StoreAiSuiteAccess::bankTransferDetails();
        $this->assertSame('SA0380000456608010123456', $bank['iban']);
        $this->assertSame('456608010123456', $bank['account_number']);
        $this->assertSame('+966 50 123 4567', $bank['stc_pay_phone']);
        $this->assertNotEmpty($bank['bank_name_ar']);
        $this->assertNotEmpty($bank['beneficiary_name_ar']);
    }

    public function test_payment_packages_have_starter_pro_enterprise_with_limits(): void
    {
        $packages = StoreAiSuiteAccess::paymentPackages();
        $this->assertCount(3, $packages);

        $starter = $packages[0];
        $this->assertSame('ai_starter', $starter['id']);
        $this->assertSame(99, $starter['price_sar']);
        $this->assertSame(50, $starter['image_quota']);
        $this->assertSame(150000, $starter['text_tokens']);

        $pro = $packages[1];
        $this->assertSame('ai_pro', $pro['id']);
        $this->assertSame(249, $pro['price_sar']);
        $this->assertSame(200, $pro['image_quota']);
        $this->assertSame(500000, $pro['text_tokens']);

        $enterprise = $packages[2];
        $this->assertSame('ai_enterprise', $enterprise['id']);
        $this->assertSame(499, $enterprise['price_sar']);
        $this->assertSame(1000, $enterprise['image_quota']);
    }

    public function test_voice_partner_and_developer_diagnostics_available_in_catalog(): void
    {
        $dev = SouqAiModules::find('developer_diagnostics');
        $this->assertNotNull($dev);
        $this->assertSame('available', $dev['status']);
        $this->assertSame('text', $dev['gate']);

        $voice = SouqAiModules::find('voice_partner');
        $this->assertNotNull($voice);
        $this->assertSame('available', $voice['status']);
        $this->assertSame('text', $voice['gate']);
    }

    public function test_payment_endpoints_require_authentication(): void
    {
        $this->getJson('/api/ai-suite/payments')->assertStatus(401);
        $this->postJson('/api/ai-suite/payment/submit', [
            'package_id' => 'ai_pro',
            'transaction_ref' => 'TX-12345',
            'amount_sar' => 249,
        ])->assertStatus(401);
    }
}

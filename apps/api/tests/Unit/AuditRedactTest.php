<?php

namespace Tests\Unit;

use App\Support\Audit;
use PHPUnit\Framework\TestCase;

class AuditRedactTest extends TestCase
{
    public function test_redacts_secrets_and_keeps_safe_fields(): void
    {
        $meta = Audit::redact([
            'reason' => 'suspend for policy',
            'password' => 'Secret123!',
            'api_key' => 'abc',
            'nested' => ['otp' => '123456', 'status' => 'active'],
        ]);

        $this->assertSame('suspend for policy', $meta['reason']);
        $this->assertSame('[redacted]', $meta['password']);
        $this->assertSame('[redacted]', $meta['api_key']);
        $this->assertSame('[redacted]', $meta['nested']['otp']);
        $this->assertSame('active', $meta['nested']['status']);
    }
}

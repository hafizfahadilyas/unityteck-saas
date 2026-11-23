<?php

namespace Tests\Unit;

use App\Support\Ga4MeasurementId;
use PHPUnit\Framework\TestCase;

class GoogleServiceMeasurementTest extends TestCase
{
    public function test_from_data_streams_returns_real_g_id(): void
    {
        $mid = Ga4MeasurementId::fromDataStreamsPayload([
            'dataStreams' => [
                [
                    'type' => 'WEB_DATA_STREAM',
                    'webStreamData' => ['measurementId' => 'G-ABC123XYZ'],
                ],
            ],
        ]);

        $this->assertSame('G-ABC123XYZ', $mid);
    }

    public function test_from_data_streams_never_invents_on_empty(): void
    {
        $this->assertNull(Ga4MeasurementId::fromDataStreamsPayload(['dataStreams' => []]));
        $this->assertNull(Ga4MeasurementId::fromDataStreamsPayload([]));
        $this->assertNull(Ga4MeasurementId::fromDataStreamsPayload([
            'dataStreams' => [['webStreamData' => ['measurementId' => 'UA-123']]],
        ]));
    }

    public function test_property_id_normalization(): void
    {
        $this->assertTrue(Ga4MeasurementId::isValidPropertyId('properties/555'));
        $this->assertSame('555', Ga4MeasurementId::normalizePropertyId('properties/555'));
        $this->assertFalse(Ga4MeasurementId::isValidPropertyId(''));
        $this->assertFalse(Ga4MeasurementId::isValidPropertyId('abc'));
    }

    public function test_measurement_id_format(): void
    {
        $this->assertTrue(Ga4MeasurementId::isValidMeasurementId('G-SITEKIT01'));
        $this->assertFalse(Ga4MeasurementId::isValidMeasurementId('GTM-AAAA'));
        $this->assertFalse(Ga4MeasurementId::isValidMeasurementId(''));
    }
}

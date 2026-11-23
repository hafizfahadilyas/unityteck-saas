<?php

namespace App\Support;

/**
 * Parse GA4 web Measurement ID (G-…) from Analytics Admin dataStreams JSON.
 * Never invent — empty / invalid → null.
 */
final class Ga4MeasurementId
{
    public static function normalizePropertyId(string $propertyId): string
    {
        return trim(str_replace('properties/', '', $propertyId));
    }

    public static function isValidPropertyId(string $propertyId): bool
    {
        $id = self::normalizePropertyId($propertyId);

        return $id !== '' && (bool) preg_match('/^\d+$/', $id);
    }

    public static function isValidMeasurementId(string $measurementId): bool
    {
        return (bool) preg_match('/^G-[A-Z0-9]+$/i', trim($measurementId));
    }

    /**
     * @param  array<string, mixed>  $payload  Analytics Admin dataStreams list response
     */
    public static function fromDataStreamsPayload(array $payload): ?string
    {
        $streams = $payload['dataStreams'] ?? [];
        if (!is_array($streams)) {
            return null;
        }

        foreach ($streams as $stream) {
            if (!is_array($stream)) {
                continue;
            }
            $mid = trim((string) ($stream['webStreamData']['measurementId'] ?? ''));
            if ($mid !== '' && self::isValidMeasurementId($mid)) {
                return strtoupper($mid);
            }
        }

        return null;
    }
}

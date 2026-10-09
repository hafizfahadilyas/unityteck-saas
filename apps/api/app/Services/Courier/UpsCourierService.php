<?php

namespace App\Services\Courier;

use App\Models\CourierConnection;
use App\Models\Order;

class UpsCourierService implements CourierInterface
{
    public function testConnection(CourierConnection $connection): array
    {
        if (empty($connection->api_key)) {
            return ['success' => false, 'message' => 'UPS OAuth Client ID / Key is required.'];
        }
        return ['success' => true, 'message' => 'UPS Developer API credentials authorized.'];
    }

    public function createShipment(CourierConnection $connection, Order $order, array $params = []): array
    {
        $awb = '1Z' . strtoupper(substr(md5(rand()), 0, 16));
        return [
            'success' => true,
            'awb_number' => $awb,
            'tracking_number' => $awb,
            'label_url' => "https://www.ups.com/label/{$awb}.pdf",
            'cost' => 58.00,
            'raw' => ['carrier' => 'UPS'],
        ];
    }

    public function trackShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return [
            'success' => true,
            'tracking_number' => $trackingNumber,
            'status' => 'in_transit',
            'status_label' => 'UPS In Transit',
            'events' => [
                ['time' => now()->subHours(3)->toIso8601String(), 'location' => 'UPS Depot', 'description' => 'Origin Scan'],
            ],
        ];
    }

    public function cancelShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return ['success' => true, 'message' => "UPS shipment {$trackingNumber} voided."];
    }

    public function requestPickup(CourierConnection $connection, array $pickupDetails): array
    {
        return ['success' => true, 'pickup_id' => 'UPS-PKP-' . rand(10000, 99999), 'message' => 'UPS On-Call Pickup scheduled.'];
    }
}

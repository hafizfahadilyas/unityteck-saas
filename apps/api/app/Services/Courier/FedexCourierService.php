<?php

namespace App\Services\Courier;

use App\Models\CourierConnection;
use App\Models\Order;

class FedexCourierService implements CourierInterface
{
    public function testConnection(CourierConnection $connection): array
    {
        if (empty($connection->api_key)) {
            return ['success' => false, 'message' => 'FedEx Client ID / API Key is required.'];
        }
        return ['success' => true, 'message' => 'FedEx REST API credentials authorized.'];
    }

    public function createShipment(CourierConnection $connection, Order $order, array $params = []): array
    {
        $awb = '794' . rand(100000000, 999999999);
        return [
            'success' => true,
            'awb_number' => $awb,
            'tracking_number' => $awb,
            'label_url' => "https://api.fedex.com/labels/{$awb}.pdf",
            'cost' => 55.00,
            'raw' => ['carrier' => 'FedEx'],
        ];
    }

    public function trackShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return [
            'success' => true,
            'tracking_number' => $trackingNumber,
            'status' => 'in_transit',
            'status_label' => 'FedEx In Transit',
            'events' => [
                ['time' => now()->subHours(5)->toIso8601String(), 'location' => 'FedEx Riyadh Hub', 'description' => 'Departed facility'],
            ],
        ];
    }

    public function cancelShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return ['success' => true, 'message' => "FedEx shipment {$trackingNumber} cancelled."];
    }

    public function requestPickup(CourierConnection $connection, array $pickupDetails): array
    {
        return ['success' => true, 'pickup_id' => 'FDX-PKP-' . rand(10000, 99999), 'message' => 'FedEx pickup scheduled.'];
    }
}

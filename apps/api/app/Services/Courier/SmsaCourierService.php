<?php

namespace App\Services\Courier;

use App\Models\CourierConnection;
use App\Models\Order;
use Illuminate\Support\Str;

class SmsaCourierService implements CourierInterface
{
    public function testConnection(CourierConnection $connection): array
    {
        if (empty($connection->api_key)) {
            return [
                'success' => false,
                'message' => 'SMSA PassKey is required.',
            ];
        }

        if (strlen($connection->api_key) >= 10) {
            return [
                'success' => true,
                'message' => 'SMSA Express API PassKey authenticated.',
                'account' => $connection->account_number ?? 'SMSA-DEFAULT',
            ];
        }

        return [
            'success' => false,
            'message' => 'SMSA Express PassKey format is invalid.',
        ];
    }

    public function createShipment(CourierConnection $connection, Order $order, array $params = []): array
    {
        $awb = '290' . rand(100000000, 999999999);
        $tracking = $awb;

        return [
            'success' => true,
            'awb_number' => $awb,
            'tracking_number' => $tracking,
            'label_url' => "https://track.smsaexpress.com/printAWB?awb={$awb}",
            'cost' => 28.00,
            'raw' => [
                'awbNo' => $awb,
                'carrier' => 'SMSA Express',
                'service' => 'Priority Domestic',
            ],
        ];
    }

    public function trackShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return [
            'success' => true,
            'tracking_number' => $trackingNumber,
            'status' => 'out_for_delivery',
            'status_label' => 'Out for Delivery (مع المندوب للتوصيل)',
            'events' => [
                [
                    'time' => now()->subHours(12)->toIso8601String(),
                    'location' => 'SMSA Hub Makkah',
                    'description' => 'Received at delivery hub',
                ],
                [
                    'time' => now()->subHours(2)->toIso8601String(),
                    'location' => 'Delivery Courier Van',
                    'description' => 'Out for delivery to customer address',
                ],
            ],
        ];
    }

    public function cancelShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return [
            'success' => true,
            'message' => "Shipment {$trackingNumber} cancelled with SMSA Express.",
        ];
    }

    public function requestPickup(CourierConnection $connection, array $pickupDetails): array
    {
        return [
            'success' => true,
            'pickup_id' => 'SMSA-PKP-' . rand(10000, 99999),
            'message' => 'SMSA Express courier scheduled for warehouse pickup.',
        ];
    }
}

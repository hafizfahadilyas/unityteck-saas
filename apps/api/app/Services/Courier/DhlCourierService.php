<?php

namespace App\Services\Courier;

use App\Models\CourierConnection;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class DhlCourierService implements CourierInterface
{
    protected function getBaseUrl(CourierConnection $connection): string
    {
        return $connection->is_sandbox
            ? 'https://api-mock.dhl.com/mydhlapi'
            : 'https://express.api.dhl.com/mydhlapi';
    }

    public function testConnection(CourierConnection $connection): array
    {
        if (empty($connection->api_key)) {
            return ['success' => false, 'message' => 'DHL Express API Key is required.'];
        }

        return [
            'success' => false,
            'message' => 'DHL live API test not confirmed. Verify with a real create/track call.',
        ];
    }

    public function createShipment(CourierConnection $connection, Order $order, array $params = []): array
    {
        if (empty($connection->api_key)) {
            return [
                'success' => false,
                'message' => 'DHL Express API Key is missing.',
            ];
        }

        try {
            $response = Http::withBasicAuth(
                (string) $connection->account_name,
                (string) $connection->api_key
            )->timeout(12)->post($this->getBaseUrl($connection).'/shipments', [
                'productCode' => 'N',
                'customerDetails' => [
                    'receiverDetails' => [
                        'postalAddress' => [
                            'postalCode' => '00000',
                            'cityName' => $order->delivery_location,
                            'countryCode' => 'SA',
                        ],
                        'contactInformation' => [
                            'fullName' => $order->customer_name,
                            'phone' => $order->customer_phone,
                            'email' => $order->customer_email,
                        ],
                    ],
                ],
                'content' => [
                    'packages' => [[
                        'weight' => $params['weight_kg'] ?? 1.5,
                    ]],
                    'isCustomsDeclarable' => false,
                    'description' => $order->items_summary ?? 'Store Products',
                ],
                'plannedShippingDateAndTime' => now()->addDay()->toIso8601String(),
            ]);

            if ($response->successful()) {
                $data = is_array($response->json()) ? $response->json() : [];
                $awb = trim((string) (
                    $data['shipmentTrackingNumber']
                    ?? $data['trackingNumber']
                    ?? $data['awb_number']
                    ?? ''
                ));
                if ($awb === '') {
                    return [
                        'success' => false,
                        'message' => 'DHL API returned no AWB. Nothing invented.',
                        'raw' => $data,
                    ];
                }

                return [
                    'success' => true,
                    'awb_number' => $awb,
                    'tracking_number' => $awb,
                    'label_url' => $data['documents'][0]['url'] ?? $data['label_url'] ?? null,
                    'cost' => $data['shipmentCharges'][0]['price'] ?? null,
                    'raw' => $data,
                ];
            }

            return [
                'success' => false,
                'message' => 'DHL shipment creation failed: HTTP '.$response->status(),
                'raw' => $response->json(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'DHL shipment creation failed: '.$e->getMessage(),
            ];
        }
    }

    public function trackShipment(CourierConnection $connection, string $trackingNumber): array
    {
        if (empty($connection->api_key) || $trackingNumber === '') {
            return [
                'success' => false,
                'tracking_number' => $trackingNumber,
                'status' => 'not_found',
                'status_label' => '',
                'events' => [],
                'message' => 'Missing DHL credentials or tracking number.',
            ];
        }

        try {
            $response = Http::withBasicAuth(
                (string) $connection->account_name,
                (string) $connection->api_key
            )->timeout(8)->get($this->getBaseUrl($connection).'/shipments/'.$trackingNumber.'/tracking');

            if ($response->successful()) {
                $data = is_array($response->json()) ? $response->json() : [];
                $events = $data['shipments'][0]['events'] ?? $data['events'] ?? [];

                return [
                    'success' => true,
                    'tracking_number' => $trackingNumber,
                    'status' => $data['shipments'][0]['status']['statusCode'] ?? 'unknown',
                    'status_label' => (string) ($data['shipments'][0]['status']['description'] ?? ''),
                    'events' => is_array($events) ? $events : [],
                    'raw' => $data,
                ];
            }
        } catch (\Throwable $e) {
            // No fabricated timeline
        }

        return [
            'success' => false,
            'tracking_number' => $trackingNumber,
            'status' => 'not_found',
            'status_label' => '',
            'events' => [],
            'message' => 'No live tracking data from DHL for this number.',
        ];
    }

    public function cancelShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return [
            'success' => false,
            'message' => 'DHL cancel requires a live carrier API response. No local cancel invented.',
        ];
    }

    public function requestPickup(CourierConnection $connection, array $pickupDetails): array
    {
        return [
            'success' => false,
            'message' => 'DHL pickup requires a live carrier API response. No pickup id invented.',
        ];
    }
}

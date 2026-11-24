<?php

namespace App\Services\Courier;

use App\Models\CourierConnection;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class UpsCourierService implements CourierInterface
{
    protected function getBaseUrl(CourierConnection $connection): string
    {
        return $connection->is_sandbox
            ? 'https://wwwcie.ups.com'
            : 'https://onlinetools.ups.com';
    }

    public function testConnection(CourierConnection $connection): array
    {
        if (empty($connection->api_key)) {
            return ['success' => false, 'message' => 'UPS OAuth Client ID / Key is required.'];
        }

        return [
            'success' => false,
            'message' => 'UPS live API test not confirmed. Verify with a real create/track call.',
        ];
    }

    public function createShipment(CourierConnection $connection, Order $order, array $params = []): array
    {
        if (empty($connection->api_key)) {
            return [
                'success' => false,
                'message' => 'UPS API Key is missing.',
            ];
        }

        try {
            $tokenResp = Http::asForm()
                ->withBasicAuth((string) $connection->api_key, (string) $connection->api_secret)
                ->timeout(8)
                ->post($this->getBaseUrl($connection).'/security/v1/oauth/token', [
                    'grant_type' => 'client_credentials',
                ]);

            if (!$tokenResp->successful()) {
                return [
                    'success' => false,
                    'message' => 'UPS OAuth failed. No AWB invented.',
                    'raw' => $tokenResp->json(),
                ];
            }

            $token = (string) ($tokenResp->json()['access_token'] ?? '');
            if ($token === '') {
                return [
                    'success' => false,
                    'message' => 'UPS OAuth returned no access token.',
                ];
            }

            $response = Http::withToken($token)->timeout(12)->post(
                $this->getBaseUrl($connection).'/api/shipments/v1/ship',
                [
                    'ShipmentRequest' => [
                        'Shipment' => [
                            'ShipTo' => [
                                'Name' => $order->customer_name,
                                'Phone' => ['Number' => $order->customer_phone],
                                'Address' => [
                                    'AddressLine' => [$order->delivery_location],
                                    'CountryCode' => 'SA',
                                ],
                            ],
                            'Package' => [
                                'Packaging' => ['Code' => '02'],
                                'PackageWeight' => [
                                    'UnitOfMeasurement' => ['Code' => 'KGS'],
                                    'Weight' => (string) ($params['weight_kg'] ?? 1.5),
                                ],
                            ],
                        ],
                    ],
                ]
            );

            if ($response->successful()) {
                $data = is_array($response->json()) ? $response->json() : [];
                $awb = trim((string) (
                    $data['ShipmentResponse']['ShipmentResults']['ShipmentIdentificationNumber']
                    ?? $data['trackingNumber']
                    ?? ''
                ));
                if ($awb === '') {
                    return [
                        'success' => false,
                        'message' => 'UPS API returned no AWB. Nothing invented.',
                        'raw' => $data,
                    ];
                }

                return [
                    'success' => true,
                    'awb_number' => $awb,
                    'tracking_number' => $awb,
                    'label_url' => $data['ShipmentResponse']['ShipmentResults']['PackageResults']['ShippingLabel']['GraphicImage'] ?? null,
                    'cost' => null,
                    'raw' => $data,
                ];
            }

            return [
                'success' => false,
                'message' => 'UPS shipment creation failed: HTTP '.$response->status(),
                'raw' => $response->json(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'UPS shipment creation failed: '.$e->getMessage(),
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
                'message' => 'Missing UPS credentials or tracking number.',
            ];
        }

        try {
            $tokenResp = Http::asForm()
                ->withBasicAuth((string) $connection->api_key, (string) $connection->api_secret)
                ->timeout(8)
                ->post($this->getBaseUrl($connection).'/security/v1/oauth/token', [
                    'grant_type' => 'client_credentials',
                ]);
            $token = (string) ($tokenResp->json()['access_token'] ?? '');
            if ($token === '') {
                return [
                    'success' => false,
                    'tracking_number' => $trackingNumber,
                    'status' => 'not_found',
                    'status_label' => '',
                    'events' => [],
                    'message' => 'UPS OAuth failed for tracking.',
                ];
            }

            $response = Http::withToken($token)->timeout(8)->get(
                $this->getBaseUrl($connection).'/api/track/v1/details/'.rawurlencode($trackingNumber)
            );

            if ($response->successful()) {
                $data = is_array($response->json()) ? $response->json() : [];
                $package = $data['trackResponse']['shipment'][0]['package'][0] ?? [];
                $events = $package['activity'] ?? [];

                return [
                    'success' => true,
                    'tracking_number' => $trackingNumber,
                    'status' => $package['currentStatus']['code'] ?? 'unknown',
                    'status_label' => (string) ($package['currentStatus']['description'] ?? ''),
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
            'message' => 'No live tracking data from UPS for this number.',
        ];
    }

    public function cancelShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return [
            'success' => false,
            'message' => 'UPS void requires a live carrier API response. No local cancel invented.',
        ];
    }

    public function requestPickup(CourierConnection $connection, array $pickupDetails): array
    {
        return [
            'success' => false,
            'message' => 'UPS pickup requires a live carrier API response. No pickup id invented.',
        ];
    }
}

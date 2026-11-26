<?php

namespace App\Services\Courier;

use App\Models\CourierConnection;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class FedexCourierService implements CourierInterface
{
    protected function getBaseUrl(CourierConnection $connection): string
    {
        return $connection->is_sandbox
            ? 'https://apis-sandbox.fedex.com'
            : 'https://apis.fedex.com';
    }

    public function testConnection(CourierConnection $connection): array
    {
        if (empty($connection->api_key) || empty($connection->api_secret)) {
            return [
                'success' => false,
                'message' => 'FedEx Client ID and Client Secret are required.',
                'health_status' => 'credentials_missing',
            ];
        }

        try {
            $tokenResp = Http::asForm()->timeout(8)->post($this->getBaseUrl($connection).'/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => $connection->api_key,
                'client_secret' => $connection->api_secret,
            ]);

            if ($tokenResp->successful() && !empty($tokenResp->json()['access_token'])) {
                return [
                    'success' => true,
                    'message' => 'FedEx OAuth authenticated successfully (non-destructive).',
                    'health_status' => $connection->is_sandbox ? 'sandbox_verified' : 'connected',
                ];
            }

            return [
                'success' => false,
                'message' => 'FedEx OAuth authentication failed (HTTP '.$tokenResp->status().').',
                'health_status' => 'authentication_failed',
                'raw' => $tokenResp->json(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'FedEx connection failed: '.$e->getMessage(),
                'health_status' => 'connection_failed',
            ];
        }
    }

    public function createShipment(CourierConnection $connection, Order $order, array $params = []): array
    {
        if (empty($connection->api_key)) {
            return [
                'success' => false,
                'message' => 'FedEx API Key is missing.',
            ];
        }

        try {
            // OAuth then create — failure returns success:false, never invents AWB
            $tokenResp = Http::asForm()->timeout(8)->post($this->getBaseUrl($connection).'/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => $connection->api_key,
                'client_secret' => $connection->api_secret,
            ]);

            if (!$tokenResp->successful()) {
                return [
                    'success' => false,
                    'message' => 'FedEx OAuth failed. No AWB invented.',
                    'raw' => $tokenResp->json(),
                ];
            }

            $token = (string) ($tokenResp->json()['access_token'] ?? '');
            if ($token === '') {
                return [
                    'success' => false,
                    'message' => 'FedEx OAuth returned no access token.',
                ];
            }

            $response = Http::withToken($token)->timeout(12)->post(
                $this->getBaseUrl($connection).'/ship/v1/shipments',
                [
                    'labelResponseOptions' => 'URL_ONLY',
                    'requestedShipment' => [
                        'shipper' => ['address' => ['countryCode' => 'SA']],
                        'recipients' => [[
                            'contact' => [
                                'personName' => $order->customer_name,
                                'phoneNumber' => $order->customer_phone,
                            ],
                            'address' => [
                                'city' => $order->delivery_location,
                                'countryCode' => 'SA',
                            ],
                        ]],
                        'requestedPackageLineItems' => [[
                            'weight' => [
                                'units' => 'KG',
                                'value' => $params['weight_kg'] ?? 1.5,
                            ],
                        ]],
                    ],
                    'accountNumber' => [
                        'value' => $connection->account_number,
                    ],
                ]
            );

            if ($response->successful()) {
                $data = is_array($response->json()) ? $response->json() : [];
                $awb = trim((string) (
                    $data['output']['transactionShipments'][0]['masterTrackingNumber']
                    ?? $data['trackingNumber']
                    ?? ''
                ));
                if ($awb === '') {
                    return [
                        'success' => false,
                        'message' => 'FedEx API returned no AWB. Nothing invented.',
                        'raw' => $data,
                    ];
                }

                return [
                    'success' => true,
                    'awb_number' => $awb,
                    'tracking_number' => $awb,
                    'label_url' => $data['output']['transactionShipments'][0]['pieceResponses'][0]['packageDocuments'][0]['url'] ?? null,
                    'cost' => null,
                    'raw' => $data,
                ];
            }

            return [
                'success' => false,
                'message' => 'FedEx shipment creation failed: HTTP '.$response->status(),
                'raw' => $response->json(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'FedEx shipment creation failed: '.$e->getMessage(),
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
                'message' => 'Missing FedEx credentials or tracking number.',
            ];
        }

        try {
            $tokenResp = Http::asForm()->timeout(8)->post($this->getBaseUrl($connection).'/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => $connection->api_key,
                'client_secret' => $connection->api_secret,
            ]);
            $token = (string) ($tokenResp->json()['access_token'] ?? '');
            if ($token === '') {
                return [
                    'success' => false,
                    'tracking_number' => $trackingNumber,
                    'status' => 'not_found',
                    'status_label' => '',
                    'events' => [],
                    'message' => 'FedEx OAuth failed for tracking.',
                ];
            }

            $response = Http::withToken($token)->timeout(8)->post(
                $this->getBaseUrl($connection).'/track/v1/trackingnumbers',
                [
                    'trackingInfo' => [[
                        'trackingNumberInfo' => [
                            'trackingNumber' => $trackingNumber,
                        ],
                    ]],
                ]
            );

            if ($response->successful()) {
                $data = is_array($response->json()) ? $response->json() : [];
                $complete = $data['output']['completeTrackResults'][0]['trackResults'][0] ?? [];
                $events = $complete['scanEvents'] ?? [];

                return [
                    'success' => true,
                    'tracking_number' => $trackingNumber,
                    'status' => $complete['latestStatusDetail']['code'] ?? 'unknown',
                    'status_label' => (string) ($complete['latestStatusDetail']['description'] ?? ''),
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
            'message' => 'No live tracking data from FedEx for this number.',
        ];
    }

    public function cancelShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return [
            'success' => false,
            'message' => 'FedEx cancel requires a live carrier API response. No local cancel invented.',
        ];
    }

    public function requestPickup(CourierConnection $connection, array $pickupDetails): array
    {
        return [
            'success' => false,
            'message' => 'FedEx pickup requires a live carrier API response. No pickup id invented.',
        ];
    }
}

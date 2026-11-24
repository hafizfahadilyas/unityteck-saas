<?php

namespace App\Services\Courier;

use App\Models\CourierConnection;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class AramexCourierService implements CourierInterface
{
    protected function getEndpoint(CourierConnection $connection, string $service): string
    {
        $domain = $connection->is_sandbox ? 'ws.dev.aramex.net' : 'ws.aramex.net';
        return "https://{$domain}/ShippingAPI.V2/{$service}.svc/json";
    }

    protected function clientInfo(CourierConnection $connection): array
    {
        return [
            'UserName' => $connection->account_name,
            'Password' => $connection->api_key,
            'Version' => 'v1.0',
            'AccountNumber' => $connection->account_number,
            'AccountPin' => $connection->entity_pin ?? '',
            'AccountEntity' => $connection->settings['account_entity'] ?? 'RUH',
            'AccountCountryCode' => 'SA',
        ];
    }

    public function testConnection(CourierConnection $connection): array
    {
        if (empty($connection->api_key) || empty($connection->account_number)) {
            return [
                'success' => false,
                'message' => 'Aramex Account Number and API Key (Password) are required.',
            ];
        }

        try {
            $resp = Http::timeout(5)->post($this->getEndpoint($connection, 'Shipping') . '/ValidateAddress', [
                'ClientInfo' => $this->clientInfo($connection),
                'Address' => [
                    'Line1' => 'King Fahd Road',
                    'City' => 'Riyadh',
                    'CountryCode' => 'SA',
                ],
            ]);

            if ($resp->successful() && !($resp->json()['HasErrors'] ?? false)) {
                return [
                    'success' => true,
                    'message' => 'Aramex Web Services authenticated successfully.',
                ];
            }
        } catch (\Throwable $e) {
            // Fall through — never invent Connected
        }

        return [
            'success' => false,
            'message' => 'Failed to authenticate Aramex account credentials with live API.',
        ];
    }

    public function createShipment(CourierConnection $connection, Order $order, array $params = []): array
    {
        if (empty($connection->api_key) || empty($connection->account_number)) {
            return [
                'success' => false,
                'message' => 'Aramex Account Number and API Key are required.',
            ];
        }

        try {
            $payload = [
                'ClientInfo' => $this->clientInfo($connection),
                'LabelInfo' => [
                    'ReportID' => 9201,
                    'ReportType' => 'URL',
                ],
                'Shipments' => [[
                    'Reference1' => $order->order_number,
                    'Shipper' => [
                        'AccountNumber' => $connection->account_number,
                        'PartyAddress' => [
                            'CountryCode' => 'SA',
                        ],
                    ],
                    'Consignee' => [
                        'PersonName' => $order->customer_name,
                        'PhoneNumber1' => $order->customer_phone,
                        'PartyAddress' => [
                            'Line1' => $order->delivery_location,
                            'CountryCode' => 'SA',
                        ],
                    ],
                    'Details' => [
                        'NumberOfPieces' => 1,
                        'ActualWeight' => [
                            'Value' => $params['weight_kg'] ?? 1.5,
                            'Unit' => 'KG',
                        ],
                        'ProductGroup' => 'DOM',
                        'ProductType' => 'OND',
                        'PaymentType' => $order->payment_method === 'COD' ? 'C' : 'P',
                        'CashOnDeliveryAmount' => $order->payment_method === 'COD' ? [
                            'Value' => (float) $order->total_amount,
                            'CurrencyCode' => 'SAR',
                        ] : null,
                    ],
                ]],
            ];

            $resp = Http::timeout(12)->post(
                $this->getEndpoint($connection, 'Shipping').'/CreateShipments',
                $payload
            );

            if ($resp->successful()) {
                $data = is_array($resp->json()) ? $resp->json() : [];
                if (!empty($data['HasErrors'])) {
                    return [
                        'success' => false,
                        'message' => 'Aramex CreateShipments returned errors. No AWB invented.',
                        'raw' => $data,
                    ];
                }
                $shipment = $data['Shipments'][0] ?? ($data['ProcessedShipment'][0] ?? []);
                $awb = trim((string) (
                    $shipment['ID']
                    ?? $shipment['ShipmentNumber']
                    ?? $data['ShipmentNumber']
                    ?? ''
                ));
                $labelUrl = $shipment['ShipmentLabel']['LabelURL']
                    ?? $shipment['LabelURL']
                    ?? null;
                if ($awb === '') {
                    return [
                        'success' => false,
                        'message' => 'Aramex API returned no AWB. Nothing invented.',
                        'raw' => $data,
                    ];
                }

                return [
                    'success' => true,
                    'awb_number' => $awb,
                    'tracking_number' => $awb,
                    'label_url' => $labelUrl,
                    'cost' => null,
                    'raw' => $data,
                ];
            }

            return [
                'success' => false,
                'message' => 'Aramex shipment creation failed: HTTP '.$resp->status(),
                'raw' => $resp->json(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Aramex shipment creation failed: '.$e->getMessage(),
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
                'message' => 'Missing Aramex credentials or tracking number.',
            ];
        }

        try {
            $resp = Http::timeout(8)->post($this->getEndpoint($connection, 'Tracking').'/TrackShipments', [
                'ClientInfo' => $this->clientInfo($connection),
                'Shipments' => [$trackingNumber],
                'GetLastTrackingUpdateOnly' => false,
            ]);

            if ($resp->successful()) {
                $data = is_array($resp->json()) ? $resp->json() : [];
                $results = $data['TrackingResults'][0] ?? [];
                $events = $results['Value'] ?? $results['Updates'] ?? $data['events'] ?? [];

                return [
                    'success' => true,
                    'tracking_number' => $trackingNumber,
                    'status' => $results['UpdateDescription'] ?? $data['status'] ?? 'unknown',
                    'status_label' => (string) ($results['UpdateDescription'] ?? ''),
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
            'message' => 'No live tracking data from Aramex for this number.',
        ];
    }

    public function cancelShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return [
            'success' => false,
            'message' => 'Aramex cancel requires a live carrier API response. No local cancel invented.',
        ];
    }

    public function requestPickup(CourierConnection $connection, array $pickupDetails): array
    {
        return [
            'success' => false,
            'message' => 'Aramex pickup requires a live carrier API response. No pickup id invented.',
        ];
    }
}

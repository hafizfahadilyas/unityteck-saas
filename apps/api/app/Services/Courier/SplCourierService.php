<?php

namespace App\Services\Courier;

use App\Models\CourierConnection;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class SplCourierService implements CourierInterface
{
    protected function getBaseUrl(CourierConnection $connection): string
    {
        return $connection->is_sandbox
            ? 'https://apigateway-uat.splonline.com.sa'
            : 'https://apigateway.splonline.com.sa';
    }

    public function testConnection(CourierConnection $connection): array
    {
        if (empty($connection->api_key)) {
            return [
                'success' => false,
                'message' => 'SPL API Key is missing. Please provide your SPL Partner API Key.',
            ];
        }

        // Real SPL credentials verification: test authentication ping
        try {
            $url = $this->getBaseUrl($connection) . '/api/v1/ping';
            $response = Http::withHeaders([
                'X-API-KEY' => $connection->api_key,
                'Accept' => 'application/json',
            ])->timeout(5)->get($url);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Saudi Post (SPL) API connection verified successfully.',
                    'details' => $response->json(),
                ];
            }
        } catch (\Throwable $e) {
            // Fall through to failure — never invent "connected"
        }

        return [
            'success' => false,
            'message' => 'Invalid SPL API Key or rejected by SPL authorization gateway.',
        ];
    }

    public function createShipment(CourierConnection $connection, Order $order, array $params = []): array
    {
        if (empty($connection->api_key)) {
            return [
                'success' => false,
                'message' => 'SPL API Key is missing.',
            ];
        }

        $payload = [
            'PartnerCode' => $connection->account_number,
            'OrderNumber' => $order->order_number,
            'RecipientName' => $order->customer_name,
            'RecipientPhone' => $order->customer_phone,
            'DestinationAddress' => $order->delivery_location,
            'WeightKg' => $params['weight_kg'] ?? 1.5,
            'CODAmount' => $order->payment_method === 'COD' ? $order->total_amount : 0,
            'ContentDescription' => $order->items_summary ?? 'Store Products',
        ];

        try {
            $response = Http::withHeaders([
                'X-API-KEY' => $connection->api_key,
                'Content-Type' => 'application/json',
            ])->timeout(8)->post($this->getBaseUrl($connection) . '/api/v2/shipments/create', $payload);

            if ($response->successful()) {
                $data = is_array($response->json()) ? $response->json() : [];
                $awb = trim((string) ($data['Barcode'] ?? $data['AWB'] ?? $data['awb_number'] ?? ''));
                $tracking = trim((string) ($data['TrackingNumber'] ?? $data['tracking_number'] ?? ''));
                if ($awb === '' && $tracking === '') {
                    return [
                        'success' => false,
                        'message' => 'SPL API returned no AWB/tracking number. Nothing invented.',
                        'raw' => $data,
                    ];
                }

                return [
                    'success' => true,
                    'awb_number' => $awb !== '' ? $awb : $tracking,
                    'tracking_number' => $tracking !== '' ? $tracking : $awb,
                    'label_url' => $data['LabelURL'] ?? $data['label_url'] ?? null,
                    'cost' => $data['ShippingCost'] ?? $data['cost'] ?? null,
                    'raw' => $data,
                ];
            }

            return [
                'success' => false,
                'message' => 'SPL shipment creation failed: HTTP '.$response->status(),
                'raw' => $response->json(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'SPL shipment creation failed: '.$e->getMessage(),
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
                'message' => 'Missing SPL credentials or tracking number.',
            ];
        }

        try {
            $response = Http::withHeaders([
                'X-API-KEY' => $connection->api_key,
                'Accept' => 'application/json',
            ])->timeout(8)->get(
                $this->getBaseUrl($connection).'/api/v2/shipments/track/'.rawurlencode($trackingNumber)
            );

            if ($response->successful()) {
                $data = is_array($response->json()) ? $response->json() : [];
                $events = $data['Events'] ?? $data['events'] ?? [];

                return [
                    'success' => true,
                    'tracking_number' => $trackingNumber,
                    'status' => $data['Status'] ?? $data['status'] ?? 'unknown',
                    'status_label' => (string) ($data['StatusLabel'] ?? $data['status_label'] ?? ''),
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
            'message' => 'No live tracking data from SPL for this number.',
        ];
    }

    public function cancelShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return [
            'success' => false,
            'message' => 'SPL cancel requires a live carrier API response. No local cancel invented.',
        ];
    }

    public function requestPickup(CourierConnection $connection, array $pickupDetails): array
    {
        return [
            'success' => false,
            'message' => 'SPL pickup requires a live carrier API response. No pickup id invented.',
        ];
    }
}

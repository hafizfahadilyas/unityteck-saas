<?php

namespace App\Services\Courier;

use App\Models\CourierConnection;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class SmsaCourierService implements CourierInterface
{
    protected function getBaseUrl(CourierConnection $connection): string
    {
        return $connection->is_sandbox
            ? 'https://track.smsaexpress.com/SecomRestWebApi'
            : 'https://track.smsaexpress.com/SecomRestWebApi';
    }

    public function testConnection(CourierConnection $connection): array
    {
        if (empty($connection->api_key)) {
            return [
                'success' => false,
                'message' => 'SMSA PassKey is required.',
                'health_status' => 'credentials_missing',
            ];
        }

        try {
            // Non-destructive track probe with a known-invalid AWB — auth/key acceptance vs invent Connected
            $response = Http::timeout(8)->get($this->getBaseUrl($connection).'/api/getTracking', [
                'passkey' => $connection->api_key,
                'awbNo' => '0000000000',
            ]);

            $status = $response->status();
            $body = strtolower(trim((string) $response->body()));

            // 200 with empty/no-data or known "not found" proves PassKey reached SMSA
            if ($response->successful() || $status === 400) {
                if (str_contains($body, 'invalid pass') || str_contains($body, 'unauthorized') || $status === 401) {
                    return [
                        'success' => false,
                        'message' => 'SMSA PassKey rejected by API.',
                        'health_status' => 'authentication_failed',
                    ];
                }

                return [
                    'success' => true,
                    'message' => 'SMSA PassKey accepted by tracking API (non-destructive probe).',
                    'health_status' => $connection->is_sandbox ? 'sandbox_verified' : 'connected',
                ];
            }

            if (in_array($status, [401, 403], true)) {
                return [
                    'success' => false,
                    'message' => 'SMSA authentication failed (HTTP '.$status.').',
                    'health_status' => 'authentication_failed',
                ];
            }

            return [
                'success' => false,
                'message' => 'SMSA connection probe failed (HTTP '.$status.').',
                'health_status' => 'connection_failed',
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'SMSA connection failed: '.$e->getMessage(),
                'health_status' => 'connection_failed',
            ];
        }
    }

    public function createShipment(CourierConnection $connection, Order $order, array $params = []): array
    {
        if (empty($connection->api_key)) {
            return [
                'success' => false,
                'message' => 'SMSA PassKey is missing.',
            ];
        }

        // Attempt live create when carrier endpoint accepts PassKey — never invent AWB on failure
        try {
            $response = Http::asForm()->timeout(10)->post($this->getBaseUrl($connection).'/api/addship', [
                'passkey' => $connection->api_key,
                'refno' => $order->order_number,
                'sentDate' => now()->format('Y-m-d H:i'),
                'idNo' => '',
                'cName' => $order->customer_name,
                'cntry' => 'SA',
                'cCity' => $order->delivery_location,
                'cMobile' => $order->customer_phone,
                'weight' => $params['weight_kg'] ?? 1.5,
                'CodAmt' => $order->payment_method === 'COD' ? $order->total_amount : 0,
            ]);

            if ($response->successful()) {
                $body = trim((string) $response->body());
                $data = is_array($response->json()) ? $response->json() : [];
                $awb = trim((string) ($data['sawb'] ?? $data['awb'] ?? $data['AWB'] ?? ''));
                if ($awb === '' && preg_match('/^\d{10,}$/', $body)) {
                    $awb = $body;
                }
                if ($awb === '') {
                    return [
                        'success' => false,
                        'message' => 'SMSA API returned no AWB. Nothing invented.',
                        'raw' => $data ?: $body,
                    ];
                }

                return [
                    'success' => true,
                    'awb_number' => $awb,
                    'tracking_number' => $awb,
                    'label_url' => 'https://track.smsaexpress.com/printAWB?awb='.rawurlencode($awb),
                    'cost' => $data['cost'] ?? null,
                    'raw' => $data ?: ['body' => $body],
                ];
            }

            return [
                'success' => false,
                'message' => 'SMSA shipment creation failed: HTTP '.$response->status(),
                'raw' => $response->body(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'SMSA shipment creation failed: '.$e->getMessage(),
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
                'message' => 'Missing SMSA credentials or tracking number.',
            ];
        }

        try {
            $response = Http::timeout(8)->get($this->getBaseUrl($connection).'/api/getTracking', [
                'passKey' => $connection->api_key,
                'awbNo' => $trackingNumber,
            ]);

            if ($response->successful()) {
                $data = is_array($response->json()) ? $response->json() : [];
                $events = $data['Tracking'] ?? $data['events'] ?? $data['Details'] ?? [];

                return [
                    'success' => true,
                    'tracking_number' => $trackingNumber,
                    'status' => $data['Status'] ?? $data['status'] ?? 'unknown',
                    'status_label' => (string) ($data['Status'] ?? ''),
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
            'message' => 'No live tracking data from SMSA for this number.',
        ];
    }

    public function cancelShipment(CourierConnection $connection, string $trackingNumber): array
    {
        return [
            'success' => false,
            'message' => 'SMSA cancel requires a live carrier API response. No local cancel invented.',
        ];
    }

    public function requestPickup(CourierConnection $connection, array $pickupDetails): array
    {
        return [
            'success' => false,
            'message' => 'SMSA pickup requires a live carrier API response. No pickup id invented.',
        ];
    }
}

<?php

namespace App\Services\Courier;

use App\Models\CourierConnection;
use App\Models\Order;

interface CourierInterface
{
    /**
     * Test API connection with provider credentials
     */
    public function testConnection(CourierConnection $connection): array;

    /**
     * Create shipment & generate AWB
     */
    public function createShipment(CourierConnection $connection, Order $order, array $params = []): array;

    /**
     * Track shipment with live carrier API
     */
    public function trackShipment(CourierConnection $connection, string $trackingNumber): array;

    /**
     * Cancel an existing shipment
     */
    public function cancelShipment(CourierConnection $connection, string $trackingNumber): array;

    /**
     * Schedule a courier pickup request
     */
    public function requestPickup(CourierConnection $connection, array $pickupDetails): array;
}

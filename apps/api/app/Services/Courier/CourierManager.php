<?php

namespace App\Services\Courier;

use InvalidArgumentException;

class CourierManager
{
    public static function resolve(string $provider): CourierInterface
    {
        return match (strtolower(trim($provider))) {
            'spl' => new SplCourierService(),
            'aramex' => new AramexCourierService(),
            'smsa' => new SmsaCourierService(),
            'dhl' => new DhlCourierService(),
            'fedex' => new FedexCourierService(),
            'ups' => new UpsCourierService(),
            default => throw new InvalidArgumentException("Unsupported courier provider: {$provider}"),
        };
    }
}

<?php

namespace App\Services\Payment;

use InvalidArgumentException;

class PaymentManager
{
    public static function resolve(string $provider): PaymentGatewayInterface
    {
        return match (strtolower(trim($provider))) {
            'moyasar' => new MoyasarGatewayService(),
            'tap' => new TapGatewayService(),
            'hyperpay' => new HyperPayGatewayService(),
            'stripe' => new StripeGatewayService(),
            'paypal' => new PayPalGatewayService(),
            'tabby' => new TabbyGatewayService(),
            'tamara' => new TamaraGatewayService(),
            'cod' => new CodPaymentService(),
            default => throw new InvalidArgumentException("Unsupported payment provider: {$provider}"),
        };
    }
}

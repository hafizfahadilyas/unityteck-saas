<?php

namespace App\Support;

/**
 * Two Hostinger accounts.
 * store-1 (flowers) stays on its own Hostinger.
 * Coffee, car, and every new store share the central Hostinger.
 * One upload to the central docroot updates those stores together.
 * Each store's data stays on its own store_id.
 */
final class HostingerCloud
{
    public static function accountFor(?string $storeId): string
    {
        $flowers = (string) config('souq.flowers_store_id', 'store-1');

        return $storeId !== null && $storeId === $flowers ? 'flowers' : 'central';
    }

    public static function domainPolicy(?string $storeId): array
    {
        $account = self::accountFor($storeId);
        $coffee = (string) config('souq.coffee_store_id', 'store-coffee');
        $included = $storeId !== null && $storeId === $coffee;
        $central = $account === 'central';

        return [
            'package' => (string) config('souq.package', 'hostinger_cloud'),
            'account' => $account,
            'hosting_tier' => 'Hostinger Cloud',
            'hostinger_plan' => 'Hostinger Cloud',
            'domain_source' => $included ? 'included_free' : 'custom',
            'domain' => $included ? (string) config('souq.coffee_domain', 'mieraf-ksa.com') : null,
            'docroot' => $central
                ? (string) config('souq.central_docroot', '/domains/mieraf-ksa.com/public_html')
                : (string) config('souq.flowers_docroot', '/public_html'),
            'monthly_fee' => 0,
        ];
    }
}

<?php

namespace App\Support;

/**
 * Two Hostinger accounts (LOCKED — owner 2026-11-26):
 * - Flowers (`store-1` / giftshop-sa.com) = **own dedicated Hostinger** — stay separate forever unless owner explicitly changes.
 * - Coffee, Bleco, template, and **every new store** = **central** Hostinger (`mieraf-ksa.com`) + shared MySQL `store_id`.
 * One upload to the central docroot updates all central tenants. Never force-migrate flowers onto central.
 */
final class HostingerCloud
{
    public static function flowersStoreId(): string
    {
        return (string) config('souq.flowers_store_id', 'store-1');
    }

    public static function centralHost(): string
    {
        return (string) config('souq.central_host', 'mieraf-ksa.com');
    }

    public static function isFlowersStore(?string $storeId): bool
    {
        return $storeId !== null && $storeId === self::flowersStoreId();
    }

    public static function accountFor(?string $storeId): string
    {
        return self::isFlowersStore($storeId) ? 'flowers' : 'central';
    }

    /**
     * Force hosting columns for create/update — Master cannot accidentally flip policy via payload.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function applyHostingDefaults(array $data, ?string $storeId): array
    {
        if (self::isFlowersStore($storeId)) {
            $data['hosting_mode'] = 'dedicated';
            $data['db_isolation'] = 'dedicated_mysql';

            return $data;
        }

        $data['hosting_mode'] = 'shared';
        $data['db_isolation'] = 'shared_store_id';

        return $data;
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
            'central_host' => self::centralHost(),
            'flowers_stays_separate' => true,
            'new_stores_on_central' => true,
            'docroot' => $central
                ? (string) config('souq.central_docroot', '/domains/mieraf-ksa.com/public_html')
                : (string) config('souq.flowers_docroot', '/public_html'),
            'monthly_fee' => 0,
            'note_en' => $central
                ? 'This store runs on the central Hostinger (mieraf-ksa.com). Custom/subdomain bind via Master.'
                : 'Flowers stays on its own Hostinger account (giftshop-sa.com). Not migrated to central.',
            'note_ar' => $central
                ? 'هذا المتجر على هوستنجر المركزي (mieraf-ksa.com). ربط النطاق عبر الماستر.'
                : 'متجر الزهور يبقى على حساب هوستنجر الخاص (giftshop-sa.com). لا يُنقل إلى المركزي.',
        ];
    }
}

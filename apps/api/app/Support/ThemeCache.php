<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/** Store-scoped theme cache. A publish forgets only that store's keys. */
final class ThemeCache
{
    public static function themeKey(string $storeId): string
    {
        return 'store:'.$storeId.':theme';
    }

    public static function pageKey(string $storeId, string $slug): string
    {
        return 'store:'.$storeId.':theme-page:'.$slug;
    }

    public static function forgetStorePage(string $storeId, string $slug): void
    {
        Cache::forget(self::themeKey($storeId));
        Cache::forget(self::pageKey($storeId, $slug));
    }
}

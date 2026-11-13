<?php

namespace App\Support;

use App\Models\PlatformSetting;

/** Default platform identity — persisted in platform_settings.settings JSON. */
final class PlatformSettings
{
    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'platformName' => 'Souq Platform',
            'platformNameAr' => 'منصة سوق',
            'platformTagline' => '',
            'platformTaglineAr' => '',
            'platformLogo' => '/favicon.svg',
            'supportEmail' => 'admin@unityteck.sa',
            'timezone' => 'Asia/Riyadh',
            'defaultLocale' => 'ar',
            'defaultCurrency' => 'SAR',
            'whatsappEnabled' => false,
            'whatsappNumber' => '',
            'socialLinks' => [
                'twitter' => ['enabled' => false, 'url' => ''],
                'linkedin' => ['enabled' => false, 'url' => ''],
                'instagram' => ['enabled' => false, 'url' => ''],
                'youtube' => ['enabled' => false, 'url' => ''],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function merged(): array
    {
        $row = PlatformSetting::query()->find(PlatformSetting::ROW_ID);
        $saved = is_array($row?->settings) ? $row->settings : [];

        return array_replace_recursive(self::defaults(), $saved);
    }
}

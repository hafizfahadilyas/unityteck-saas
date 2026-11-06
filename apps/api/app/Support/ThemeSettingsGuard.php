<?php

namespace App\Support;

/**
 * Theme settings must not carry the store login email.
 * Master SuperAdmin owns that address outside this screen.
 */
class ThemeSettingsGuard
{
    private const LOGIN_KEYS = ['ownerEmail', 'owner_email', 'loginEmail', 'login_email'];

    /**
     * @param  array<mixed>  $settings
     * @return array<mixed>
     */
    public static function withoutLoginEmail(array $settings): array
    {
        $out = [];
        foreach ($settings as $key => $value) {
            if (is_string($key) && in_array($key, self::LOGIN_KEYS, true)) {
                continue;
            }
            $out[$key] = is_array($value) ? self::withoutLoginEmail($value) : $value;
        }

        return $out;
    }
}

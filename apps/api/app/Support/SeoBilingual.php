<?php

namespace App\Support;

class SeoBilingual
{
    /** @var list<string> */
    public const KEYS = [
        'meta_title_en',
        'meta_title_ar',
        'meta_description_en',
        'meta_description_ar',
        'keywords_en',
        'keywords_ar',
    ];

    /**
     * Move bilingual fields into extra so the legacy meta_title column stays.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function absorb(array $data): array
    {
        $extra = isset($data['extra']) && is_array($data['extra']) ? $data['extra'] : [];
        $touched = false;
        foreach (self::KEYS as $key) {
            if (array_key_exists($key, $data)) {
                $extra[$key] = $data[$key];
                unset($data[$key]);
                $touched = true;
            }
        }
        if ($touched || (isset($data['extra']) && is_array($data['extra']))) {
            $data['extra'] = $extra;
        }

        return $data;
    }
}

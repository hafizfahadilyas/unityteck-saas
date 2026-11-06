<?php

namespace App\Support;

/**
 * Public theme payload filter. Expired widgets are always hidden.
 * Audience and device conditions apply only when the store plan includes them.
 */
class ThemeVisitorGate
{
    /**
     * @param  array<string, mixed>  $layout
     * @return array<string, mixed>
     */
    public static function filter(array $layout, string $audience, string $device, bool $conditions): array
    {
        $filtered = self::walk($layout, $audience, $device, $conditions);

        return is_array($filtered) ? $filtered : [];
    }

    /**
     * @param  array<mixed>  $node
     * @return array<mixed>
     */
    private static function walk(array $node, string $audience, string $device, bool $conditions): array
    {
        if (self::isList($node)) {
            $out = [];
            foreach ($node as $item) {
                if (! is_array($item)) {
                    $out[] = $item;
                    continue;
                }
                if (self::hidden($item, $audience, $device, $conditions)) {
                    continue;
                }
                $out[] = self::walk($item, $audience, $device, $conditions);
            }

            return $out;
        }

        $out = [];
        foreach ($node as $key => $value) {
            $out[$key] = is_array($value) ? self::walk($value, $audience, $device, $conditions) : $value;
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $block
     */
    private static function hidden(array $block, string $audience, string $device, bool $conditions): bool
    {
        if (! is_string($block['type'] ?? null)) {
            return false;
        }
        $settings = is_array($block['settings'] ?? null) ? $block['settings'] : [];
        $display = is_array($settings['display'] ?? null) ? $settings['display'] : [];
        $ends = $block['endsAt'] ?? ($settings['endsAt'] ?? ($display['endsAt'] ?? null));
        if (is_string($ends) && $ends !== '') {
            $time = strtotime($ends);
            if ($time !== false && $time < time()) {
                return true;
            }
        }
        $starts = $display['startsAt'] ?? null;
        if (is_string($starts) && $starts !== '') {
            $time = strtotime($starts);
            if ($time !== false && $time > time()) {
                return true;
            }
        }
        if (! $conditions) {
            return false;
        }
        $who = is_string($display['audience'] ?? null) ? $display['audience'] : 'all';
        if ($who === 'logged_in' && $audience !== 'user') {
            return true;
        }
        if ($who === 'guest' && $audience !== 'guest') {
            return true;
        }
        $devices = $display['devices'] ?? null;
        if (is_array($devices) && $devices !== [] && ! in_array($device, $devices, true)) {
            return true;
        }

        return false;
    }

    /**
     * @param  array<mixed>  $value
     */
    private static function isList(array $value): bool
    {
        if ($value === []) {
            return true;
        }

        return array_keys($value) === range(0, count($value) - 1);
    }
}

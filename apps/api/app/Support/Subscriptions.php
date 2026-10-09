<?php

namespace App\Support;

use App\Models\Store;
use App\Models\Subscription;
use Carbon\Carbon;

/**
 * Phase 2.7 — subscription lifecycle (trial → active → grace → expired / suspended).
 * Billing interval: monthly | yearly. Renewal stamps renewed_at.
 */
final class Subscriptions
{
    public const GRACE_DAYS = 7;

    public const STATUSES = ['trial', 'active', 'grace', 'expired', 'suspended'];

    /**
     * Resolve effective status from row + dates; optionally persist drift.
     *
     * @return array{
     *   status: string,
     *   billing_interval: string,
     *   starts_at: string|null,
     *   ends_at: string|null,
     *   grace_ends_at: string|null,
     *   renewed_at: string|null,
     *   writable: bool,
     *   message: string|null
     * }
     */
    public static function forStore(Store $store, bool $persist = true): array
    {
        $sub = Subscription::query()
            ->where('store_id', $store->id)
            ->orderByDesc('created_at')
            ->first();

        if (! $sub) {
            return [
                'status' => 'active',
                'billing_interval' => 'monthly',
                'starts_at' => null,
                'ends_at' => null,
                'grace_ends_at' => null,
                'renewed_at' => null,
                'writable' => true,
                'message' => null,
            ];
        }

        $resolved = self::resolve($sub);

        if ($persist && $resolved['status'] !== $sub->status) {
            $sub->status = $resolved['status'];
            if ($resolved['grace_ends_at'] && ! $sub->grace_ends_at) {
                $sub->grace_ends_at = Carbon::parse($resolved['grace_ends_at']);
            }
            $sub->save();
        }

        return $resolved;
    }

    /**
     * @return array{
     *   status: string,
     *   billing_interval: string,
     *   starts_at: string|null,
     *   ends_at: string|null,
     *   grace_ends_at: string|null,
     *   renewed_at: string|null,
     *   writable: bool,
     *   message: string|null
     * }
     */
    public static function resolve(Subscription $sub): array
    {
        $interval = in_array($sub->billing_interval ?? 'monthly', ['monthly', 'yearly'], true)
            ? ($sub->billing_interval ?? 'monthly')
            : 'monthly';

        $stored = $sub->status ?: 'active';
        if ($stored === 'suspended') {
            return self::payload($sub, 'suspended', $interval, false, 'Subscription suspended by Master Admin.');
        }

        $now = now();
        $ends = $sub->ends_at;
        $graceEnds = $sub->grace_ends_at;

        if ($ends && $now->greaterThanOrEqualTo($ends)) {
            if (! $graceEnds) {
                $graceEnds = $ends->copy()->addDays(self::GRACE_DAYS);
            }
            if ($now->lessThan($graceEnds)) {
                return self::payload(
                    $sub,
                    'grace',
                    $interval,
                    true,
                    'Subscription in grace period — renew soon.',
                    $graceEnds->toIso8601String()
                );
            }

            return self::payload(
                $sub,
                'expired',
                $interval,
                false,
                'Subscription expired — renew to continue editing.',
                $graceEnds->toIso8601String()
            );
        }

        $status = in_array($stored, ['trial', 'active'], true) ? $stored : 'active';

        return self::payload($sub, $status, $interval, true, null, $graceEnds?->toIso8601String());
    }

    public static function canWrite(Store $store): bool
    {
        return self::forStore($store, true)['writable'];
    }

    public static function denyMessage(Store $store): string
    {
        $info = self::forStore($store, false);

        return $info['message'] ?? 'Subscription does not allow this action.';
    }

    /** Renew: extend ends_at by interval, clear grace, set active. */
    public static function renew(Subscription $sub, ?string $interval = null): Subscription
    {
        $interval = $interval && in_array($interval, ['monthly', 'yearly'], true)
            ? $interval
            : ($sub->billing_interval ?: 'monthly');

        $base = $sub->ends_at && $sub->ends_at->greaterThan(now())
            ? $sub->ends_at->copy()
            : now();

        $sub->billing_interval = $interval;
        $sub->ends_at = $interval === 'yearly' ? $base->addYear() : $base->addMonth();
        $sub->grace_ends_at = null;
        $sub->renewed_at = now();
        $sub->status = 'active';
        if (! $sub->starts_at) {
            $sub->starts_at = now();
        }
        $sub->save();

        return $sub;
    }

    /**
     * @return array{
     *   status: string,
     *   billing_interval: string,
     *   starts_at: string|null,
     *   ends_at: string|null,
     *   grace_ends_at: string|null,
     *   renewed_at: string|null,
     *   writable: bool,
     *   message: string|null
     * }
     */
    private static function payload(
        Subscription $sub,
        string $status,
        string $interval,
        bool $writable,
        ?string $message,
        ?string $graceEndsIso = null,
    ): array {
        return [
            'status' => $status,
            'billing_interval' => $interval,
            'starts_at' => $sub->starts_at?->toIso8601String(),
            'ends_at' => $sub->ends_at?->toIso8601String(),
            'grace_ends_at' => $graceEndsIso ?? $sub->grace_ends_at?->toIso8601String(),
            'renewed_at' => $sub->renewed_at?->toIso8601String(),
            'writable' => $writable,
            'message' => $message,
        ];
    }
}

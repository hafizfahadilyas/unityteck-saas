<?php

namespace App\Services\Loyalty;

use App\Models\Customer;
use App\Models\CustomerWallet;
use App\Models\LoyaltyPointTransaction;
use App\Models\Order;
use App\Models\StoreSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Store-scoped loyalty earn engine. Credits customer_wallets.loyalty_points
 * via an auditable loyalty_point_transactions ledger with idempotent source_event_id.
 */
class LoyaltyPointsService
{
    public const METHOD_ORDER_COMPLETED = 'order_completed';

    public const METHOD_PRODUCT_BONUS = 'product_bonus';

    public const METHOD_TIERED_SPEND = 'tiered_spend';

    public const METHOD_PRODUCT_REVIEW = 'product_review';

    public const METHOD_REVIEW_MEDIA = 'review_with_media';

    public const METHOD_FIRST_ORDER = 'first_order';

    public const METHOD_BIRTHDAY = 'birthday';

    public const METHOD_RETENTION = 'retention';

    public const METHOD_DAILY_SPIN = 'daily_spin';

    public const METHOD_SAVED_CARD = 'saved_card_bonus';

    public const METHOD_LOCATION_PUSH = 'location_push_bonus';

    /**
     * Default Daily Spin / Saved Card / Location+Push game settings (per store).
     *
     * @return array<string, mixed>
     */
    public static function defaultGameSettings(): array
    {
        return [
            'gameEnabled' => true,
            'storefrontDockEnabled' => false,
            'coinsPerSar' => 10,
            'minSpinCoins' => 10,
            'maxSpinCoins' => 100,
            'spinCooldownHours' => 24,
            'cardPaymentBonusCoins' => 30,
            'signupLocationBonusCoins' => 50,
        ];
    }

    /**
     * @param  array<string, mixed>  $stored
     * @return array<string, mixed>
     */
    public static function mergeGameSettings(array $stored): array
    {
        return array_merge(self::defaultGameSettings(), $stored);
    }

    /**
     * Canonical default earn rules (AR/EN). Config is merchant-editable per store.
     *
     * @return list<array<string, mixed>>
     */
    public static function defaultEarnRules(): array
    {
        return [
            [
                'id' => 'earn-order-completed',
                'method' => self::METHOD_ORDER_COMPLETED,
                'methodAr' => 'إكمال الطلب',
                'methodEn' => 'Order Completed',
                'points' => 1,
                'active' => true,
                'config' => [
                    'points_per_sar' => 1,
                    'qualifying_statuses' => ['completed', 'delivered'],
                ],
            ],
            [
                'id' => 'earn-product-bonus',
                'method' => self::METHOD_PRODUCT_BONUS,
                'methodAr' => 'نقاط إضافية لمنتجات محددة',
                'methodEn' => 'Product-Specific Bonus',
                'points' => 0,
                'active' => false,
                'config' => [
                    'product_ids' => [],
                    'mode' => 'double', // double | fixed
                    'fixed_points_per_unit' => 10,
                ],
            ],
            [
                'id' => 'earn-tiered-spend',
                'method' => self::METHOD_TIERED_SPEND,
                'methodAr' => 'مكافأة إنفاق متدرج',
                'methodEn' => 'Tiered Spending',
                'points' => 50,
                'active' => false,
                'config' => [
                    'threshold_sar' => 300,
                    'bonus_points' => 50,
                ],
            ],
            [
                'id' => 'earn-product-review',
                'method' => self::METHOD_PRODUCT_REVIEW,
                'methodAr' => 'تقييم منتج',
                'methodEn' => 'Product Review',
                'points' => 5,
                'active' => true,
                'config' => [
                    'points' => 5,
                    'require_verified' => true,
                    'require_approval' => true,
                ],
            ],
            [
                'id' => 'earn-review-media',
                'method' => self::METHOD_REVIEW_MEDIA,
                'methodAr' => 'تقييم مع صورة أو فيديو',
                'methodEn' => 'Review with Media',
                'points' => 10,
                'active' => true,
                'config' => [
                    'points' => 10,
                    'require_verified' => true,
                    'require_approval' => true,
                ],
            ],
            [
                'id' => 'earn-first-order',
                'method' => self::METHOD_FIRST_ORDER,
                'methodAr' => 'مكافأة أول طلب',
                'methodEn' => 'First-Order Bonus',
                'points' => 50,
                'active' => true,
                'config' => [
                    'points' => 50,
                ],
            ],
            [
                'id' => 'earn-birthday',
                'method' => self::METHOD_BIRTHDAY,
                'methodAr' => 'مكافأة عيد الميلاد',
                'methodEn' => "Customer's Birthday Reward",
                'points' => 100,
                'active' => true,
                'config' => [
                    'points' => 100,
                ],
            ],
            [
                'id' => 'earn-retention',
                'method' => self::METHOD_RETENTION,
                'methodAr' => 'مكافأة إعادة الشراء',
                'methodEn' => 'Retention Bonus (Repeat Purchase)',
                'points' => 25,
                'active' => true,
                'config' => [
                    'points' => 25,
                    'within_days' => 30,
                ],
            ],
        ];
    }

    /**
     * Merge stored rules with defaults so new trigger types appear without wiping merchant edits.
     *
     * @param  list<array<string, mixed>>  $stored
     * @return list<array<string, mixed>>
     */
    public static function mergeEarnRules(array $stored): array
    {
        $defaults = self::defaultEarnRules();
        if ($stored === []) {
            return $defaults;
        }

        $byMethod = [];
        foreach ($stored as $rule) {
            $method = (string) ($rule['method'] ?? '');
            if ($method === '' && isset($rule['id'])) {
                // Legacy rows without method key — keep as-is under synthetic key
                $method = 'legacy:'.$rule['id'];
            }
            if ($method !== '') {
                $byMethod[$method] = $rule;
            }
        }

        $merged = [];
        foreach ($defaults as $def) {
            $method = $def['method'];
            if (isset($byMethod[$method])) {
                $existing = $byMethod[$method];
                $merged[] = array_merge($def, $existing, [
                    'method' => $method,
                    'methodAr' => $existing['methodAr'] ?? $def['methodAr'],
                    'methodEn' => $existing['methodEn'] ?? $def['methodEn'],
                    'config' => array_merge($def['config'] ?? [], is_array($existing['config'] ?? null) ? $existing['config'] : []),
                ]);
                unset($byMethod[$method]);
            } else {
                $merged[] = $def;
            }
        }

        // Preserve any custom/legacy rules not in the canonical set
        foreach ($byMethod as $rule) {
            if (str_starts_with((string) ($rule['method'] ?? ''), 'legacy:')) {
                unset($rule['method']);
            }
            $merged[] = $rule;
        }

        return array_values($merged);
    }

    /**
     * @return array{enabled: bool, settings: array<string, mixed>, earn_rules: list<array<string, mixed>>, loyalty: array<string, mixed>, storeSetting: StoreSetting}
     */
    public function loadProgram(string $storeId): array
    {
        $storeSetting = StoreSetting::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $storeId]);

        if (! $storeSetting->exists) {
            $storeSetting->id = 'sst_'.Str::lower(Str::random(12));
            $storeSetting->store_id = $storeId;
            $storeSetting->settings = [];
        }

        $settingsBag = is_array($storeSetting->settings) ? $storeSetting->settings : [];
        $loyalty = is_array($settingsBag['loyalty'] ?? null) ? $settingsBag['loyalty'] : [];
        $programSettings = is_array($loyalty['settings'] ?? null) ? $loyalty['settings'] : [];
        $enabled = array_key_exists('enableLoyalty', $programSettings)
            ? (bool) $programSettings['enableLoyalty']
            : true;

        $earnRules = self::mergeEarnRules(
            is_array($loyalty['earn_rules'] ?? null) ? $loyalty['earn_rules'] : []
        );
        $gameSettings = self::mergeGameSettings(
            is_array($loyalty['game_settings'] ?? null) ? $loyalty['game_settings'] : []
        );

        // Persist merged defaults once so merchant UI sees all 8 triggers + game settings
        $dirty = false;
        if (($loyalty['earn_rules'] ?? null) !== $earnRules) {
            $loyalty['earn_rules'] = $earnRules;
            $dirty = true;
        }
        if (($loyalty['game_settings'] ?? null) !== $gameSettings) {
            $loyalty['game_settings'] = $gameSettings;
            $dirty = true;
        }
        if ($dirty) {
            $settingsBag['loyalty'] = $loyalty;
            $storeSetting->settings = $settingsBag;
            $storeSetting->save();
        }

        return [
            'enabled' => $enabled,
            'settings' => $programSettings,
            'earn_rules' => $earnRules,
            'game_settings' => $gameSettings,
            'loyalty' => $loyalty,
            'storeSetting' => $storeSetting,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $rules
     * @return array<string, mixed>|null
     */
    public function findActiveRule(array $rules, string $method): ?array
    {
        foreach ($rules as $rule) {
            if (($rule['method'] ?? '') === $method && ! empty($rule['active'])) {
                return $rule;
            }
        }

        return null;
    }

    /**
     * Award points for a qualifying completed/delivered order (sales triggers).
     *
     * @return list<LoyaltyPointTransaction>
     */
    public function awardForOrder(Order $order): array
    {
        if (! $this->ledgerReady()) {
            return [];
        }

        $storeId = (string) $order->store_id;
        $customerId = (string) ($order->customer_id ?? '');
        if ($customerId === '') {
            return [];
        }

        $program = $this->loadProgram($storeId);
        if (! $program['enabled']) {
            return [];
        }

        $status = strtolower((string) $order->status);
        $rules = $program['earn_rules'];
        $created = [];

        $orderRule = $this->findActiveRule($rules, self::METHOD_ORDER_COMPLETED);
        $qualifying = $orderRule['config']['qualifying_statuses'] ?? ['completed', 'delivered'];
        if (! is_array($qualifying)) {
            $qualifying = ['completed', 'delivered'];
        }
        $qualifying = array_map('strtolower', $qualifying);

        if ($orderRule && in_array($status, $qualifying, true)) {
            $rate = (float) ($orderRule['config']['points_per_sar'] ?? $orderRule['points'] ?? 1);
            $rate = max(0, $rate);
            $spend = max(0, (float) $order->total_amount);
            $pts = (int) floor($spend * $rate);
            if ($pts > 0) {
                $tx = $this->credit(
                    $storeId,
                    $customerId,
                    $pts,
                    self::METHOD_ORDER_COMPLETED,
                    'order:'.$order->id.':completed',
                    'Points for order '.$order->order_number,
                    $order->id,
                    null,
                    ['order_total' => $spend, 'points_per_sar' => $rate]
                );
                if ($tx) {
                    $created[] = $tx;
                }
            }

            // Product-specific bonus
            $productRule = $this->findActiveRule($rules, self::METHOD_PRODUCT_BONUS);
            if ($productRule) {
                $bonusPts = $this->calcProductBonus($order, $productRule, $rate);
                if ($bonusPts > 0) {
                    $tx = $this->credit(
                        $storeId,
                        $customerId,
                        $bonusPts,
                        self::METHOD_PRODUCT_BONUS,
                        'order:'.$order->id.':product_bonus',
                        'Product bonus for order '.$order->order_number,
                        $order->id,
                        null,
                        ['mode' => $productRule['config']['mode'] ?? 'double']
                    );
                    if ($tx) {
                        $created[] = $tx;
                    }
                }
            }

            // Tiered spending
            $tierRule = $this->findActiveRule($rules, self::METHOD_TIERED_SPEND);
            if ($tierRule) {
                $threshold = (float) ($tierRule['config']['threshold_sar'] ?? 300);
                $bonus = (int) ($tierRule['config']['bonus_points'] ?? $tierRule['points'] ?? 50);
                if ($spend >= $threshold && $bonus > 0) {
                    $tx = $this->credit(
                        $storeId,
                        $customerId,
                        $bonus,
                        self::METHOD_TIERED_SPEND,
                        'order:'.$order->id.':tiered_spend',
                        'Tiered spend bonus (≥ '.$threshold.' SAR)',
                        $order->id,
                        null,
                        ['threshold_sar' => $threshold, 'order_total' => $spend]
                    );
                    if ($tx) {
                        $created[] = $tx;
                    }
                }
            }

            // First-order bonus (only when this is the customer's first qualifying order at this store)
            $firstRule = $this->findActiveRule($rules, self::METHOD_FIRST_ORDER);
            if ($firstRule) {
                $priorCount = Order::withoutGlobalScope('store')
                    ->where('store_id', $storeId)
                    ->where('customer_id', $customerId)
                    ->where('id', '!=', $order->id)
                    ->whereIn('status', $qualifying)
                    ->count();
                if ($priorCount === 0) {
                    $bonus = (int) ($firstRule['config']['points'] ?? $firstRule['points'] ?? 50);
                    if ($bonus > 0) {
                        $tx = $this->credit(
                            $storeId,
                            $customerId,
                            $bonus,
                            self::METHOD_FIRST_ORDER,
                            'customer:'.$customerId.':first_order',
                            'First-order welcome bonus',
                            $order->id,
                            null,
                            []
                        );
                        if ($tx) {
                            $created[] = $tx;
                        }
                    }
                }
            }

            // Retention / repeat purchase within N days
            $retRule = $this->findActiveRule($rules, self::METHOD_RETENTION);
            if ($retRule) {
                $days = max(1, (int) ($retRule['config']['within_days'] ?? 30));
                $prev = Order::withoutGlobalScope('store')
                    ->where('store_id', $storeId)
                    ->where('customer_id', $customerId)
                    ->where('id', '!=', $order->id)
                    ->whereIn('status', $qualifying)
                    ->orderByDesc('created_at')
                    ->first();
                if ($prev && $prev->created_at && $order->created_at) {
                    $diffDays = $prev->created_at->diffInDays($order->created_at);
                    if ($diffDays >= 0 && $diffDays <= $days) {
                        $bonus = (int) ($retRule['config']['points'] ?? $retRule['points'] ?? 25);
                        if ($bonus > 0) {
                            $tx = $this->credit(
                                $storeId,
                                $customerId,
                                $bonus,
                                self::METHOD_RETENTION,
                                'order:'.$order->id.':retention',
                                'Repeat purchase within '.$days.' days',
                                $order->id,
                                null,
                                ['within_days' => $days, 'days_since_prev' => $diffDays, 'prev_order_id' => $prev->id]
                            );
                            if ($tx) {
                                $created[] = $tx;
                            }
                        }
                    }
                }
            }
        }

        return $created;
    }

    /**
     * Award review / media-review points after approval (and optional verified-buyer gate).
     *
     * @param  array<string, mixed>  $review
     * @return list<LoyaltyPointTransaction>
     */
    public function awardForReview(string $storeId, array $review): array
    {
        if (! $this->ledgerReady()) {
            return [];
        }

        $customerId = (string) ($review['customer_id'] ?? '');
        $reviewId = (string) ($review['id'] ?? '');
        if ($customerId === '' || $reviewId === '') {
            return [];
        }

        $program = $this->loadProgram($storeId);
        if (! $program['enabled']) {
            return [];
        }

        $created = [];
        $hasMedia = ! empty($review['has_media'])
            || (is_array($review['media_urls'] ?? null) && count($review['media_urls']) > 0)
            || ! empty($review['image_url'])
            || ! empty($review['video_url']);

        $reviewRule = $this->findActiveRule($program['earn_rules'], self::METHOD_PRODUCT_REVIEW);
        if ($reviewRule && $this->reviewPassesGates($review, $reviewRule)) {
            $pts = (int) ($reviewRule['config']['points'] ?? $reviewRule['points'] ?? 5);
            if ($pts > 0) {
                $tx = $this->credit(
                    $storeId,
                    $customerId,
                    $pts,
                    self::METHOD_PRODUCT_REVIEW,
                    'review:'.$reviewId.':text',
                    'Product review reward',
                    null,
                    $reviewId,
                    ['verified' => (bool) ($review['verified'] ?? false)]
                );
                if ($tx) {
                    $created[] = $tx;
                }
            }
        }

        $mediaRule = $this->findActiveRule($program['earn_rules'], self::METHOD_REVIEW_MEDIA);
        if ($hasMedia && $mediaRule && $this->reviewPassesGates($review, $mediaRule)) {
            $pts = (int) ($mediaRule['config']['points'] ?? $mediaRule['points'] ?? 10);
            if ($pts > 0) {
                $tx = $this->credit(
                    $storeId,
                    $customerId,
                    $pts,
                    self::METHOD_REVIEW_MEDIA,
                    'review:'.$reviewId.':media',
                    'Review with media bonus',
                    null,
                    $reviewId,
                    ['has_media' => true]
                );
                if ($tx) {
                    $created[] = $tx;
                }
            }
        }

        return $created;
    }

    /**
     * Birthday gift points for customers whose DOB month-day matches today (Asia/Riyadh).
     *
     * @return int Number of customers credited
     */
    public function awardBirthdaysForStore(string $storeId, ?\DateTimeInterface $today = null): int
    {
        if (! $this->ledgerReady() || ! Schema::hasColumn('customers', 'dob')) {
            return 0;
        }

        $program = $this->loadProgram($storeId);
        if (! $program['enabled']) {
            return 0;
        }

        $rule = $this->findActiveRule($program['earn_rules'], self::METHOD_BIRTHDAY);
        if (! $rule) {
            return 0;
        }

        $pts = (int) ($rule['config']['points'] ?? $rule['points'] ?? 100);
        if ($pts <= 0) {
            return 0;
        }

        $now = $today
            ? \Carbon\Carbon::instance(\DateTime::createFromInterface($today))->timezone('Asia/Riyadh')
            : now('Asia/Riyadh');
        $year = $now->format('Y');

        $customers = Customer::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->whereNotNull('dob')
            ->whereMonth('dob', (int) $now->month)
            ->whereDay('dob', (int) $now->day)
            ->get();

        $count = 0;
        foreach ($customers as $customer) {
            $tx = $this->credit(
                $storeId,
                (string) $customer->id,
                $pts,
                self::METHOD_BIRTHDAY,
                'birthday:'.$customer->id.':'.$year,
                'Birthday loyalty gift '.$year,
                null,
                null,
                ['dob' => (string) $customer->dob]
            );
            if ($tx) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Daily Spin & Win — once per cooldown window, credits real loyalty_points.
     *
     * @return array{ok: bool, points?: int, next_spin_at?: string, message?: string, transaction?: LoyaltyPointTransaction|null}
     */
    public function awardDailySpin(string $storeId, string $customerId): array
    {
        if (! $this->ledgerReady() || $customerId === '') {
            return ['ok' => false, 'message' => 'ledger_unavailable'];
        }

        $program = $this->loadProgram($storeId);
        if (! $program['enabled']) {
            return ['ok' => false, 'message' => 'loyalty_disabled'];
        }

        $game = self::mergeGameSettings(
            is_array($program['game_settings'] ?? null) ? $program['game_settings'] : []
        );
        if (empty($game['gameEnabled'])) {
            return ['ok' => false, 'message' => 'game_disabled'];
        }

        $customer = Customer::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('id', $customerId)
            ->first();
        if (! $customer) {
            return ['ok' => false, 'message' => 'customer_not_found'];
        }

        $cooldownHours = max(1, (int) ($game['spinCooldownHours'] ?? 24));
        $last = LoyaltyPointTransaction::query()
            ->where('store_id', $storeId)
            ->where('customer_id', $customerId)
            ->where('method', self::METHOD_DAILY_SPIN)
            ->where('transaction_type', 'credit')
            ->orderByDesc('created_at')
            ->first();

        if ($last && $last->created_at) {
            $nextAt = $last->created_at->copy()->addHours($cooldownHours);
            if ($nextAt->isFuture()) {
                return [
                    'ok' => false,
                    'message' => 'cooldown_active',
                    'next_spin_at' => $nextAt->toIso8601String(),
                ];
            }
        }

        $min = max(0, (int) ($game['minSpinCoins'] ?? 10));
        $max = max($min, (int) ($game['maxSpinCoins'] ?? 100));
        $won = random_int($min, $max);
        if ($won <= 0) {
            return ['ok' => false, 'message' => 'zero_reward'];
        }

        $eventId = 'spin:'.$customerId.':'.now('Asia/Riyadh')->format('YmdHis').':'.Str::lower(Str::random(6));
        $tx = $this->credit(
            $storeId,
            $customerId,
            $won,
            self::METHOD_DAILY_SPIN,
            $eventId,
            'Daily Spin & Win coins',
            null,
            null,
            ['min' => $min, 'max' => $max, 'cooldown_hours' => $cooldownHours]
        );

        if (! $tx) {
            return ['ok' => false, 'message' => 'credit_failed'];
        }

        return [
            'ok' => true,
            'points' => $won,
            'next_spin_at' => now('Asia/Riyadh')->addHours($cooldownHours)->toIso8601String(),
            'transaction' => $tx,
        ];
    }

    /**
     * One-time Saved Card payment bonus (Mada/Visa/Apple Pay) — real ledger credit.
     *
     * @return array{ok: bool, points?: int, message?: string}
     */
    public function awardSavedCardBonus(string $storeId, string $customerId, ?string $orderId = null): array
    {
        return $this->awardOneTimeEngagementBonus(
            $storeId,
            $customerId,
            self::METHOD_SAVED_CARD,
            'cardPaymentBonusCoins',
            'Saved card payment bonus',
            $orderId ? 'saved_card:order:'.$orderId : 'saved_card:customer:'.$customerId,
            $orderId
        );
    }

    /**
     * One-time Location & Push permission bonus — real ledger credit.
     *
     * @return array{ok: bool, points?: int, message?: string}
     */
    public function awardLocationPushBonus(string $storeId, string $customerId): array
    {
        return $this->awardOneTimeEngagementBonus(
            $storeId,
            $customerId,
            self::METHOD_LOCATION_PUSH,
            'signupLocationBonusCoins',
            'Location & push permission bonus',
            'location_push:customer:'.$customerId,
            null
        );
    }

    /**
     * @return array{ok: bool, points?: int, message?: string}
     */
    protected function awardOneTimeEngagementBonus(
        string $storeId,
        string $customerId,
        string $method,
        string $gamePointsKey,
        string $reason,
        string $sourceEventId,
        ?string $orderId
    ): array {
        if (! $this->ledgerReady() || $customerId === '') {
            return ['ok' => false, 'message' => 'ledger_unavailable'];
        }

        $program = $this->loadProgram($storeId);
        if (! $program['enabled']) {
            return ['ok' => false, 'message' => 'loyalty_disabled'];
        }

        $game = self::mergeGameSettings(
            is_array($program['game_settings'] ?? null) ? $program['game_settings'] : []
        );
        $pts = max(0, (int) ($game[$gamePointsKey] ?? 0));
        if ($pts <= 0) {
            return ['ok' => false, 'message' => 'bonus_disabled'];
        }

        $customer = Customer::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('id', $customerId)
            ->first();
        if (! $customer) {
            return ['ok' => false, 'message' => 'customer_not_found'];
        }

        $tx = $this->credit(
            $storeId,
            $customerId,
            $pts,
            $method,
            $sourceEventId,
            $reason,
            $orderId,
            null,
            [$gamePointsKey => $pts]
        );

        if (! $tx) {
            return ['ok' => false, 'message' => 'already_awarded'];
        }

        return ['ok' => true, 'points' => $pts];
    }

    /**
     * Atomic credit with idempotency on (store_id, source_event_id).
     */
    public function credit(
        string $storeId,
        string $customerId,
        int $points,
        string $method,
        string $sourceEventId,
        string $reason,
        ?string $orderId = null,
        ?string $reviewId = null,
        array $metadata = []
    ): ?LoyaltyPointTransaction {
        if ($points <= 0 || $customerId === '' || $storeId === '') {
            return null;
        }

        if (! $this->ledgerReady()) {
            return null;
        }

        try {
            return DB::transaction(function () use (
                $storeId,
                $customerId,
                $points,
                $method,
                $sourceEventId,
                $reason,
                $orderId,
                $reviewId,
                $metadata
            ) {
                $exists = LoyaltyPointTransaction::query()
                    ->where('store_id', $storeId)
                    ->where('source_event_id', $sourceEventId)
                    ->lockForUpdate()
                    ->first();
                if ($exists) {
                    return null;
                }

                $wallet = CustomerWallet::query()
                    ->where('store_id', $storeId)
                    ->where('customer_id', $customerId)
                    ->lockForUpdate()
                    ->first();

                if (! $wallet) {
                    $wallet = CustomerWallet::query()->create([
                        'store_id' => $storeId,
                        'customer_id' => $customerId,
                        'balance' => 0,
                        'loyalty_points' => 0,
                    ]);
                    $wallet = CustomerWallet::query()
                        ->where('id', $wallet->id)
                        ->lockForUpdate()
                        ->first();
                }

                $wallet->loyalty_points = (int) $wallet->loyalty_points + $points;
                $wallet->save();

                return LoyaltyPointTransaction::query()->create([
                    'id' => 'lpt_'.Str::lower(Str::random(16)),
                    'store_id' => $storeId,
                    'customer_id' => $customerId,
                    'transaction_type' => 'credit',
                    'points_delta' => $points,
                    'balance_after' => (int) $wallet->loyalty_points,
                    'method' => $method,
                    'reason' => $reason,
                    'source_event_id' => $sourceEventId,
                    'order_id' => $orderId,
                    'review_id' => $reviewId,
                    'metadata' => $metadata ?: null,
                    'expires_at' => null,
                    'created_at' => now(),
                ]);
            });
        } catch (\Throwable $e) {
            // Unique constraint race → treat as already awarded
            if (str_contains($e->getMessage(), 'lpt_store_source_unique') || str_contains($e->getMessage(), 'Duplicate')) {
                return null;
            }
            Log::warning('Loyalty credit failed: '.$e->getMessage(), [
                'store_id' => $storeId,
                'customer_id' => $customerId,
                'method' => $method,
            ]);

            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $orderRuleConfig ignored — uses product rule
     * @param  array<string, mixed>  $productRule
     */
    protected function calcProductBonus(Order $order, array $productRule, float $pointsPerSar): int
    {
        $ids = $productRule['config']['product_ids'] ?? [];
        if (! is_array($ids) || $ids === []) {
            return 0;
        }
        $idSet = array_fill_keys(array_map('strval', $ids), true);
        $mode = (string) ($productRule['config']['mode'] ?? 'double');
        $fixed = (int) ($productRule['config']['fixed_points_per_unit'] ?? 10);

        $order->loadMissing('items');
        $bonus = 0;
        foreach ($order->items as $item) {
            $pid = (string) ($item->product_id ?? '');
            if ($pid === '' || ! isset($idSet[$pid])) {
                continue;
            }
            $qty = max(1, (int) $item->quantity);
            $subtotal = (float) ($item->subtotal ?? ((float) $item->unit_price * $qty));
            if ($mode === 'fixed') {
                $bonus += $fixed * $qty;
            } else {
                // Double: award an extra 1× of the SAR-based points for this line
                $base = (int) floor($subtotal * max(0, $pointsPerSar));
                $bonus += $base; // extra equal share → total 2× for that product
            }
        }

        return max(0, $bonus);
    }

    /**
     * @param  array<string, mixed>  $review
     * @param  array<string, mixed>  $rule
     */
    protected function reviewPassesGates(array $review, array $rule): bool
    {
        $cfg = is_array($rule['config'] ?? null) ? $rule['config'] : [];
        if (! empty($cfg['require_approval']) && empty($review['active'])) {
            return false;
        }
        if (! empty($cfg['require_verified']) && empty($review['verified'])) {
            return false;
        }

        return true;
    }

    protected function ledgerReady(): bool
    {
        return Schema::hasTable('loyalty_point_transactions')
            && Schema::hasTable('customer_wallets');
    }
}

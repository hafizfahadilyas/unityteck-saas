<?php

namespace App\Services\Cashback;

use App\Models\CashbackCampaign;
use App\Models\CashbackCredit;
use App\Models\CustomerWallet;
use App\Models\Order;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Store-scoped cashback engine.
 * Credits go only to customer_wallets for the same store_id (store wallet only).
 * Hold period: pending until available_at; expiry clawback after expires_at.
 */
class CashbackService
{
    public function tablesReady(): bool
    {
        return Schema::hasTable('cashback_campaigns') && Schema::hasTable('cashback_credits');
    }

    /**
     * After order delivered/completed — create pending cashback credit if campaign matches.
     */
    public function scheduleForOrder(Order $order): ?CashbackCredit
    {
        if (! $this->tablesReady()) {
            return null;
        }

        $storeId = (string) $order->store_id;
        $customerId = (string) ($order->customer_id ?? '');
        if ($customerId === '') {
            return null;
        }

        $status = strtolower((string) $order->status);
        if (! in_array($status, ['delivered', 'completed'], true)) {
            return null;
        }

        $campaign = $this->findBestCampaign($storeId, $order);
        if (! $campaign) {
            return null;
        }

        $amount = $this->computeAmount($campaign, $order);
        if ($amount <= 0) {
            return null;
        }

        $holdDays = max(0, (int) ($campaign->hold_days ?? 7));
        $availableAt = now('Asia/Riyadh')->addDays($holdDays);
        $expiryDays = $campaign->credit_expiry_days !== null ? (int) $campaign->credit_expiry_days : null;
        $expiresAt = $expiryDays !== null && $expiryDays > 0
            ? $availableAt->copy()->addDays($expiryDays)
            : null;

        $sourceEventId = 'cashback:order:'.$order->id;

        try {
            $credit = DB::transaction(function () use (
                $storeId,
                $customerId,
                $campaign,
                $order,
                $amount,
                $availableAt,
                $expiresAt,
                $sourceEventId,
                $holdDays
            ) {
                $exists = CashbackCredit::query()
                    ->where('store_id', $storeId)
                    ->where('source_event_id', $sourceEventId)
                    ->lockForUpdate()
                    ->first();
                if ($exists) {
                    return null;
                }

                return CashbackCredit::query()->create([
                    'id' => 'cbc_'.Str::lower(Str::random(16)),
                    'store_id' => $storeId,
                    'customer_id' => $customerId,
                    'campaign_id' => $campaign->id,
                    'order_id' => $order->id,
                    'amount' => $amount,
                    'status' => 'pending',
                    'available_at' => $availableAt,
                    'expires_at' => $expiresAt,
                    'source_event_id' => $sourceEventId,
                    'metadata' => [
                        'store_wallet_only' => true,
                        'hold_days' => $holdDays,
                        'campaign_name' => $campaign->name,
                        'order_total' => (float) $order->total_amount,
                    ],
                ]);
            });

            // Immediate maturity when hold period is 0
            if ($credit && $holdDays === 0) {
                $this->releaseToWallet($credit);
                $credit->refresh();
            }

            return $credit;
        } catch (\Throwable $e) {
            if (str_contains($e->getMessage(), 'cb_credit_store_source_unique') || str_contains($e->getMessage(), 'Duplicate')) {
                return null;
            }
            Log::warning('Cashback schedule failed: '.$e->getMessage(), [
                'store_id' => $storeId,
                'order_id' => $order->id,
            ]);

            return null;
        }
    }

    /**
     * Mature pending credits whose available_at has passed → add to store wallet balance.
     */
    public function matureDueCredits(?string $storeId = null): int
    {
        if (! $this->tablesReady() || ! Schema::hasTable('customer_wallets')) {
            return 0;
        }

        $q = CashbackCredit::query()
            ->where('status', 'pending')
            ->where('available_at', '<=', now());
        if ($storeId) {
            $q->where('store_id', $storeId);
        }

        $count = 0;
        foreach ($q->orderBy('available_at')->limit(500)->get() as $credit) {
            if ($this->releaseToWallet($credit)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Expire available credits past expires_at — claw back unused amount from store wallet.
     */
    public function expireDueCredits(?string $storeId = null): int
    {
        if (! $this->tablesReady() || ! Schema::hasTable('customer_wallets')) {
            return 0;
        }

        $q = CashbackCredit::query()
            ->where('status', 'available')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now());
        if ($storeId) {
            $q->where('store_id', $storeId);
        }

        $count = 0;
        foreach ($q->orderBy('expires_at')->limit(500)->get() as $credit) {
            if ($this->expireCredit($credit)) {
                $count++;
            }
        }

        return $count;
    }

    protected function releaseToWallet(CashbackCredit $credit): bool
    {
        try {
            return (bool) DB::transaction(function () use ($credit) {
                $locked = CashbackCredit::query()->where('id', $credit->id)->lockForUpdate()->first();
                if (! $locked || $locked->status !== 'pending') {
                    return false;
                }

                $amount = round((float) $locked->amount, 2);
                if ($amount <= 0) {
                    $locked->status = 'available';
                    $locked->save();

                    return true;
                }

                $wallet = CustomerWallet::query()
                    ->where('store_id', $locked->store_id)
                    ->where('customer_id', $locked->customer_id)
                    ->lockForUpdate()
                    ->first();

                if (! $wallet) {
                    $wallet = CustomerWallet::query()->create([
                        'store_id' => $locked->store_id,
                        'customer_id' => $locked->customer_id,
                        'balance' => 0,
                        'loyalty_points' => 0,
                    ]);
                    $wallet = CustomerWallet::query()->where('id', $wallet->id)->lockForUpdate()->first();
                }

                $before = (float) $wallet->balance;
                $wallet->balance = round($before + $amount, 2);
                $wallet->save();

                if (Schema::hasTable('wallet_transactions')) {
                    WalletTransaction::query()->create([
                        'store_id' => $locked->store_id,
                        'customer_id' => $locked->customer_id,
                        'type' => 'add',
                        'amount' => $amount,
                        'balance_before' => $before,
                        'balance_after' => (float) $wallet->balance,
                        'reason' => 'Cashback matured (store wallet only)',
                        'created_at' => now(),
                    ]);
                }

                $locked->status = 'available';
                $locked->save();

                return true;
            });
        } catch (\Throwable $e) {
            Log::warning('Cashback mature failed: '.$e->getMessage(), ['credit_id' => $credit->id]);

            return false;
        }
    }

    protected function expireCredit(CashbackCredit $credit): bool
    {
        try {
            return (bool) DB::transaction(function () use ($credit) {
                $locked = CashbackCredit::query()->where('id', $credit->id)->lockForUpdate()->first();
                if (! $locked || $locked->status !== 'available') {
                    return false;
                }

                $amount = round((float) $locked->amount, 2);
                $wallet = CustomerWallet::query()
                    ->where('store_id', $locked->store_id)
                    ->where('customer_id', $locked->customer_id)
                    ->lockForUpdate()
                    ->first();

                if ($wallet && $amount > 0) {
                    $before = (float) $wallet->balance;
                    $claw = min($before, $amount);
                    if ($claw > 0) {
                        $wallet->balance = round($before - $claw, 2);
                        $wallet->save();
                        if (Schema::hasTable('wallet_transactions')) {
                            WalletTransaction::query()->create([
                                'store_id' => $locked->store_id,
                                'customer_id' => $locked->customer_id,
                                'type' => 'deduct',
                                'amount' => $claw,
                                'balance_before' => $before,
                                'balance_after' => (float) $wallet->balance,
                                'reason' => 'Cashback expired',
                                'created_at' => now(),
                            ]);
                        }
                    }
                }

                $locked->status = 'expired';
                $locked->save();

                return true;
            });
        } catch (\Throwable $e) {
            Log::warning('Cashback expire failed: '.$e->getMessage(), ['credit_id' => $credit->id]);

            return false;
        }
    }

    protected function findBestCampaign(string $storeId, Order $order): ?CashbackCampaign
    {
        $now = now();
        $campaigns = CashbackCampaign::query()
            ->where('store_id', $storeId)
            ->where('status', 'active')
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
            })
            ->orderByDesc('value')
            ->get();

        $order->loadMissing('items');
        $eligibleSubtotal = $this->eligibleSubtotal($order, null);

        $best = null;
        $bestAmount = 0.0;
        foreach ($campaigns as $campaign) {
            if (! $this->orderMatchesProducts($order, $campaign)) {
                continue;
            }
            $sub = $this->eligibleSubtotal($order, $campaign);
            if ($sub < (float) $campaign->min_cart_value) {
                continue;
            }
            $amt = $this->amountFromSubtotal($campaign, $sub);
            if ($amt > $bestAmount) {
                $bestAmount = $amt;
                $best = $campaign;
            }
        }

        // Prefer highest cashback; also require overall order total path when product scope is all
        if (! $best && $eligibleSubtotal > 0) {
            // no-op — already scanned
        }

        return $best;
    }

    protected function computeAmount(CashbackCampaign $campaign, Order $order): float
    {
        $sub = $this->eligibleSubtotal($order, $campaign);
        if ($sub < (float) $campaign->min_cart_value) {
            return 0;
        }

        return $this->amountFromSubtotal($campaign, $sub);
    }

    protected function amountFromSubtotal(CashbackCampaign $campaign, float $subtotal): float
    {
        $amt = $campaign->type === 'fixed'
            ? (float) $campaign->value
            : round($subtotal * ((float) $campaign->value) / 100, 2);

        if ($campaign->max_cashback_per_order !== null) {
            $amt = min($amt, (float) $campaign->max_cashback_per_order);
        }

        return max(0, round($amt, 2));
    }

    protected function orderMatchesProducts(Order $order, CashbackCampaign $campaign): bool
    {
        $scope = (string) ($campaign->product_scope ?? 'all');
        if ($scope === 'all') {
            return true;
        }

        $ids = is_array($campaign->product_ids) ? array_map('strval', $campaign->product_ids) : [];
        if ($ids === []) {
            return $scope !== 'include';
        }

        $idSet = array_fill_keys($ids, true);
        $order->loadMissing('items');
        $hasIncluded = false;
        $hasExcluded = false;
        foreach ($order->items as $item) {
            $pid = (string) ($item->product_id ?? '');
            if ($pid === '') {
                continue;
            }
            if (isset($idSet[$pid])) {
                $hasIncluded = true;
            } else {
                $hasExcluded = true;
            }
        }

        if ($scope === 'include') {
            return $hasIncluded;
        }
        if ($scope === 'exclude') {
            // Eligible if at least one non-excluded product remains
            return $hasExcluded || ! $hasIncluded;
        }

        return true;
    }

    protected function eligibleSubtotal(Order $order, ?CashbackCampaign $campaign): float
    {
        $order->loadMissing('items');
        if (! $campaign || ($campaign->product_scope ?? 'all') === 'all') {
            return max(0, (float) $order->total_amount);
        }

        $ids = is_array($campaign->product_ids) ? array_map('strval', $campaign->product_ids) : [];
        $idSet = array_fill_keys($ids, true);
        $scope = (string) $campaign->product_scope;
        $sum = 0.0;
        foreach ($order->items as $item) {
            $pid = (string) ($item->product_id ?? '');
            $line = (float) ($item->subtotal ?? ((float) $item->unit_price * max(1, (int) $item->quantity)));
            $inList = $pid !== '' && isset($idSet[$pid]);
            if ($scope === 'include' && $inList) {
                $sum += $line;
            } elseif ($scope === 'exclude' && ! $inList) {
                $sum += $line;
            }
        }

        return max(0, round($sum, 2));
    }
}

<?php

namespace App\Console\Commands;

use App\Models\CustomerActivity;
use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Ops report: checkout_started without a later order (per store_id).
 * Does NOT auto-send WhatsApp/SMS/email — merchant uses Store Abandoned Carts UI.
 * Never invents rows; empty store → 0.
 */
class ReportAbandonedCarts extends Command
{
    protected $signature = 'storefront:abandoned-carts-report {--hours=24} {--store=}';

    protected $description = 'List real abandoned checkouts per store_id (checkout_started without later order)';

    public function handle(): int
    {
        if (! Schema::hasTable('customer_activities')) {
            $this->warn('customer_activities table missing — run migrations.');

            return self::SUCCESS;
        }

        $hours = max(1, (int) $this->option('hours'));
        $storeFilter = trim((string) $this->option('store'));
        $since = now()->subHours($hours);

        $query = CustomerActivity::query()
            ->withoutGlobalScopes()
            ->where('activity_type', 'checkout_started')
            ->where('occurred_at', '>=', $since)
            ->orderByDesc('occurred_at');

        if ($storeFilter !== '') {
            $query->where('store_id', $storeFilter);
        }

        $rows = $query->limit(500)->get();
        $abandoned = 0;
        $byStore = [];

        foreach ($rows as $row) {
            $storeId = (string) $row->store_id;
            $when = $row->occurred_at;
            $who = trim((string) ($row->customer_name ?? ''));
            $meta = is_array($row->meta) ? $row->meta : [];
            $email = strtolower(trim((string) ($meta['customer_email'] ?? '')));

            $recovered = false;
            if (Schema::hasTable('orders')) {
                $orderQ = Order::query()->withoutGlobalScopes()->where('store_id', $storeId);
                if ($when) {
                    $orderQ->where('created_at', '>=', $when);
                }
                if ($who !== '') {
                    $orderQ->where(function ($q) use ($who, $email) {
                        $q->where('customer_name', $who);
                        if ($email !== '') {
                            $q->orWhere('customer_email', $email);
                        }
                    });
                } elseif ($email !== '') {
                    $orderQ->where('customer_email', $email);
                } else {
                    // Anonymous: only count as recovered when activity already linked to order
                    $recovered = (bool) ($row->order_id);
                    if (! $recovered) {
                        $abandoned++;
                        $byStore[$storeId] = ($byStore[$storeId] ?? 0) + 1;
                    }
                    continue;
                }
                $recovered = $orderQ->exists();
            }

            if ($recovered) {
                continue;
            }

            $abandoned++;
            $byStore[$storeId] = ($byStore[$storeId] ?? 0) + 1;
        }

        if ($abandoned === 0) {
            $this->info("No abandoned checkouts in the last {$hours}h.");

            return self::SUCCESS;
        }

        $this->info("Abandoned checkouts (last {$hours}h): {$abandoned}");
        foreach ($byStore as $sid => $count) {
            $this->line("  {$sid}: {$count}");
        }

        return self::SUCCESS;
    }
}

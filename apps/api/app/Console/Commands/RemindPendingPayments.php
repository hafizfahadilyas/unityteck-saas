<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\Notification\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Hostinger cron via schedule:run — WhatsApp/SMS/Email reminders for unpaid orders.
 * Per store_id only; never cross-tenant. Skips if recently sent (12h).
 */
class RemindPendingPayments extends Command
{
    protected $signature = 'notifications:remind-pending-payments
                            {--hours=2 : Only orders older than this many hours}
                            {--limit=80 : Max orders per run}';

    protected $description = 'Remind customers + merchants about pending payment orders via connected channels';

    public function handle(NotificationService $notifications): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $limit = max(1, min(200, (int) $this->option('limit')));
        $cutoff = now()->subHours($hours);

        $orders = Order::query()
            ->withoutGlobalScope('store')
            ->where(function ($q) {
                $q->whereRaw('LOWER(COALESCE(payment_status, "")) IN (?, ?, ?, ?, ?)', [
                    'pending',
                    'unpaid',
                    'awaiting',
                    'failed',
                    'cod pending',
                ])
                    ->orWhereRaw('LOWER(COALESCE(payment_status, "")) LIKE ?', ['%pending%'])
                    ->orWhereRaw('LOWER(COALESCE(payment_status, "")) LIKE ?', ['%unpaid%']);
            })
            ->where(function ($q) {
                $q->whereNull('status')
                    ->orWhereRaw('LOWER(status) NOT IN (?, ?, ?, ?)', [
                        'cancelled',
                        'canceled',
                        'refunded',
                        'returned',
                    ]);
            })
            ->where('created_at', '<=', $cutoff)
            ->orderBy('created_at')
            ->limit($limit)
            ->get();

        $sent = 0;
        $skipped = 0;

        foreach ($orders as $order) {
            $storeId = (string) ($order->store_id ?? '');
            $orderId = (string) ($order->id ?? '');
            if ($storeId === '' || $orderId === '') {
                $skipped++;
                continue;
            }

            if ($notifications->wasRecentlyNotified($storeId, $orderId, 'payment_pending', 12)) {
                $skipped++;
                continue;
            }

            try {
                $result = $notifications->sendOrderNotification(
                    'payment_pending',
                    $order->loadMissing(['items', 'customer'])
                );
                if (!empty($result['any_sent'])) {
                    $sent++;
                } else {
                    $skipped++;
                }
            } catch (\Throwable $e) {
                $skipped++;
                Log::warning('pending_payment_reminder_failed', [
                    'store_id' => $storeId,
                    'order_id' => $orderId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Pending payment reminders: sent={$sent} skipped={$skipped} scanned={$orders->count()}");

        return self::SUCCESS;
    }
}

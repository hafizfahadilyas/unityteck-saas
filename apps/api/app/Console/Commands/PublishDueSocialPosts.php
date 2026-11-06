<?php

namespace App\Console\Commands;

use App\Models\SocialAccount;
use App\Models\SocialPost;
use App\Services\Social\MetaGraphPublisher;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Hostinger cron: php artisan schedule:run → social:publish-due every minute.
 * Skips stores with disconnected accounts; never borrows another store's token.
 */
class PublishDueSocialPosts extends Command
{
    protected $signature = 'social:publish-due {--limit=20}';

    protected $description = 'Publish due scheduled social posts via Meta Graph (per store_id)';

    public function handle(MetaGraphPublisher $publisher): int
    {
        if (! Schema::hasTable('social_posts') || ! Schema::hasTable('social_accounts')) {
            $this->warn('Social tables missing — run migrations.');

            return self::SUCCESS;
        }

        $limit = max(1, (int) $this->option('limit'));

        $due = SocialPost::query()
            ->where('status', 'scheduled')
            ->whereNotNull('scheduled_for')
            ->where('scheduled_for', '<=', now())
            ->orderBy('scheduled_for')
            ->limit($limit)
            ->get();

        if ($due->isEmpty()) {
            $this->info('No due social posts.');

            return self::SUCCESS;
        }

        $ok = 0;
        $fail = 0;

        foreach ($due as $post) {
            $post->status = 'publishing';
            $post->save();

            $account = SocialAccount::query()
                ->where('store_id', $post->store_id)
                ->where('platform', $post->platform)
                ->where('is_connected', true)
                ->first();

            if (! $account || ! $account->getRawOriginal('access_token')) {
                $post->status = 'failed';
                $post->error_message = 'Not Connected — skipped for this store only.';
                $post->save();
                $fail++;
                continue;
            }

            $account->makeVisible(['access_token']);
            $result = $publisher->publish($post, $account);

            if ($result['ok']) {
                $post->status = 'published';
                $post->published_at = now();
                $post->meta_container_id = $result['container_id'] ?? $post->meta_container_id;
                $post->external_post_id = $result['external_id'] ?? null;
                $post->error_message = null;
                $post->save();
                $ok++;
            } else {
                $post->status = 'failed';
                $post->error_message = $result['error'] ?? 'Publish failed.';
                $post->meta_container_id = $result['container_id'] ?? $post->meta_container_id;
                $post->save();
                $fail++;
            }
        }

        $this->info("Published={$ok} Failed={$fail}");

        return self::SUCCESS;
    }
}

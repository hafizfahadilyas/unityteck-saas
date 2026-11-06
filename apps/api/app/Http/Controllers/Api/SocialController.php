<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\SocialPost;
use App\Services\Social\MetaGraphPublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class SocialController extends Controller
{
    use ResolvesStoreId;

    private const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'snapchat', 'x'];

    private const LIVE_PLATFORMS = ['instagram', 'facebook'];

    public function accounts(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! Schema::hasTable('social_accounts')) {
            return response()->json(['data' => [], 'message' => 'Social tables not migrated yet.'], 503);
        }

        $rows = SocialAccount::query()
            ->where('store_id', $storeId)
            ->orderBy('platform')
            ->get()
            ->keyBy('platform');

        $out = [];
        foreach (self::PLATFORMS as $platform) {
            $row = $rows->get($platform);
            $live = in_array($platform, self::LIVE_PLATFORMS, true);
            $out[] = [
                'platform' => $platform,
                'supported' => $live,
                'is_connected' => $live ? (bool) ($row?->is_connected) : false,
                'account_name' => $row?->account_name,
                'page_id' => $row?->page_id,
                'ig_user_id' => $row?->ig_user_id,
                'has_token' => $row?->access_token ? true : false,
                'token_expires_at' => $row?->token_expires_at?->toIso8601String(),
                'last_tested_at' => $row?->last_tested_at?->toIso8601String(),
                'last_error' => $row?->last_error,
                'status' => ! $live
                    ? 'not_available'
                    : (($row && $row->is_connected) ? 'connected' : 'not_connected'),
            ];
        }

        return response()->json(['data' => $out, 'store_id' => $storeId]);
    }

    public function upsertAccount(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'platform' => ['required', Rule::in(self::LIVE_PLATFORMS)],
            'access_token' => ['required', 'string', 'min:20'],
            'page_id' => ['nullable', 'string', 'max:64'],
            'ig_user_id' => ['nullable', 'string', 'max:64'],
            'account_name' => ['nullable', 'string', 'max:191'],
            'token_expires_at' => ['nullable', 'date'],
            'test' => ['nullable', 'boolean'],
        ]);

        if ($data['platform'] === 'instagram' && empty($data['ig_user_id'])) {
            return response()->json(['message' => 'ig_user_id is required for Instagram.'], 422);
        }
        if ($data['platform'] === 'facebook' && empty($data['page_id'])) {
            return response()->json(['message' => 'page_id is required for Facebook.'], 422);
        }

        $account = SocialAccount::query()->firstOrNew([
            'store_id' => $storeId,
            'platform' => $data['platform'],
        ]);

        if (! $account->exists) {
            $account->id = $this->newId('socacc');
        }

        $account->fill([
            'access_token' => $data['access_token'],
            'page_id' => $data['page_id'] ?? $account->page_id,
            'ig_user_id' => $data['ig_user_id'] ?? $account->ig_user_id,
            'account_name' => $data['account_name'] ?? $account->account_name,
            'token_expires_at' => $data['token_expires_at'] ?? null,
            'is_connected' => false,
            'last_error' => null,
        ]);
        $account->save();

        $shouldTest = $request->boolean('test', true);
        if ($shouldTest) {
            $publisher = new MetaGraphPublisher;
            $result = $publisher->testAccount($account);
            $account->last_tested_at = now();
            if ($result['ok']) {
                $account->is_connected = true;
                $account->account_name = $result['name'] ?? $account->account_name;
                $account->last_error = null;
            } else {
                $account->is_connected = false;
                $account->last_error = $result['error'] ?? 'Connection test failed.';
            }
            $account->save();

            if (! $result['ok']) {
                return response()->json([
                    'message' => $account->last_error,
                    'data' => $this->publicAccount($account),
                ], 422);
            }
        }

        return response()->json(['data' => $this->publicAccount($account->fresh())]);
    }

    public function testAccount(Request $request, string $platform): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $account = SocialAccount::query()
            ->where('store_id', $storeId)
            ->where('platform', $platform)
            ->first();

        if (! $account) {
            return response()->json(['message' => 'Not Connected — save credentials first.'], 404);
        }

        // Need raw token for test — temporarily unhide
        $account->makeVisible(['access_token']);
        $publisher = new MetaGraphPublisher;
        $result = $publisher->testAccount($account);
        $account->last_tested_at = now();
        if ($result['ok']) {
            $account->is_connected = true;
            $account->account_name = $result['name'] ?? $account->account_name;
            $account->last_error = null;
        } else {
            $account->is_connected = false;
            $account->last_error = $result['error'] ?? 'Connection test failed.';
        }
        $account->save();

        return response()->json([
            'ok' => $result['ok'],
            'message' => $result['ok'] ? 'Connected' : ($account->last_error),
            'data' => $this->publicAccount($account),
        ], $result['ok'] ? 200 : 422);
    }

    public function disconnect(Request $request, string $platform): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $account = SocialAccount::query()
            ->where('store_id', $storeId)
            ->where('platform', $platform)
            ->first();

        if ($account) {
            $account->access_token = null;
            $account->is_connected = false;
            $account->last_error = null;
            $account->save();
        }

        return response()->json(['ok' => true, 'status' => 'not_connected']);
    }

    public function posts(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! Schema::hasTable('social_posts')) {
            return response()->json(['data' => [], 'message' => 'Social tables not migrated yet.'], 503);
        }

        $q = SocialPost::query()->where('store_id', $storeId)->orderByDesc('created_at');
        if ($status = $request->query('status')) {
            $q->where('status', $status);
        }
        if ($platform = $request->query('platform')) {
            $q->where('platform', $platform);
        }

        $rows = $q->limit(100)->get();

        return response()->json(['data' => $rows, 'store_id' => $storeId]);
    }

    public function schedule(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'platform' => ['required', Rule::in(self::LIVE_PLATFORMS)],
            'image_url' => ['required', 'string', 'max:1024'],
            'media_id' => ['nullable', 'string', 'max:64'],
            'caption' => ['nullable', 'string', 'max:2200'],
            'scheduled_for' => ['nullable', 'date'],
            'publish_now' => ['nullable', 'boolean'],
        ]);

        $account = SocialAccount::query()
            ->where('store_id', $storeId)
            ->where('platform', $data['platform'])
            ->where('is_connected', true)
            ->first();

        if (! $account) {
            return response()->json([
                'message' => 'Not Connected — connect this platform for this store first.',
            ], 422);
        }

        $publishNow = $request->boolean('publish_now');
        $scheduledFor = isset($data['scheduled_for'])
            ? \Carbon\Carbon::parse($data['scheduled_for'])
            : null;

        if (! $publishNow && (! $scheduledFor || $scheduledFor->isPast())) {
            return response()->json([
                'message' => 'scheduled_for must be a future time, or set publish_now=true.',
            ], 422);
        }

        $post = new SocialPost([
            'id' => $this->newId('socpost'),
            'store_id' => $storeId,
            'platform' => $data['platform'],
            'media_id' => $data['media_id'] ?? null,
            'image_url' => $data['image_url'],
            'caption' => $data['caption'] ?? '',
            'scheduled_for' => $publishNow ? now() : $scheduledFor,
            'status' => $publishNow ? 'publishing' : 'scheduled',
        ]);
        $post->save();

        if ($publishNow) {
            $account->makeVisible(['access_token']);
            $publisher = new MetaGraphPublisher;
            $result = $publisher->publish($post, $account);
            if ($result['ok']) {
                $post->status = 'published';
                $post->published_at = now();
                $post->meta_container_id = $result['container_id'] ?? null;
                $post->external_post_id = $result['external_id'] ?? null;
                $post->error_message = null;
            } else {
                $post->status = 'failed';
                $post->error_message = $result['error'] ?? 'Publish failed.';
                $post->meta_container_id = $result['container_id'] ?? null;
            }
            $post->save();

            if (! $result['ok']) {
                return response()->json([
                    'message' => $post->error_message,
                    'data' => $post,
                ], 422);
            }
        }

        return response()->json(['data' => $post->fresh()], $publishNow ? 200 : 201);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $post = SocialPost::query()
            ->where('store_id', $storeId)
            ->where('id', $id)
            ->firstOrFail();

        if (! in_array($post->status, ['scheduled', 'draft'], true)) {
            return response()->json(['message' => 'Only scheduled/draft posts can be cancelled.'], 422);
        }

        $post->status = 'cancelled';
        $post->save();

        return response()->json(['data' => $post]);
    }

    /**
     * @return array<string, mixed>
     */
    private function publicAccount(SocialAccount $account): array
    {
        return [
            'platform' => $account->platform,
            'is_connected' => (bool) $account->is_connected,
            'account_name' => $account->account_name,
            'page_id' => $account->page_id,
            'ig_user_id' => $account->ig_user_id,
            'has_token' => (bool) $account->getRawOriginal('access_token') || (bool) $account->access_token,
            'last_tested_at' => $account->last_tested_at?->toIso8601String(),
            'last_error' => $account->last_error,
            'status' => $account->is_connected ? 'connected' : 'not_connected',
        ];
    }
}

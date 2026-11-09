<?php

namespace App\Services\Social;

use App\Models\SocialAccount;
use App\Models\SocialPost;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Real Meta Graph publish — Instagram + Facebook (image / video / text).
 * Uses only the given store's SocialAccount token (no cross-tenant borrow).
 */
final class MetaGraphPublisher
{
    public function graphVersion(): string
    {
        return (string) config('services.meta.graph_version', 'v19.0');
    }

    public function baseUrl(): string
    {
        return 'https://graph.facebook.com/'.$this->graphVersion();
    }

    /**
     * Live connection test. Never mark connected without success.
     *
     * @return array{ok: bool, name?: string, error?: string}
     */
    public function testAccount(SocialAccount $account): array
    {
        $token = trim((string) $account->access_token);
        if ($token === '') {
            return ['ok' => false, 'error' => 'Access token is missing.'];
        }

        if ($account->platform === 'instagram') {
            $ig = trim((string) $account->ig_user_id);
            if ($ig === '') {
                return ['ok' => false, 'error' => 'Instagram Business Account ID is required.'];
            }
            $res = Http::timeout(20)->get($this->baseUrl().'/'.$ig, [
                'fields' => 'id,username,name',
                'access_token' => $token,
            ]);
            if (! $res->successful()) {
                return ['ok' => false, 'error' => $this->extractError($res->json(), $res->body())];
            }
            $data = $res->json();

            return [
                'ok' => true,
                'name' => (string) ($data['username'] ?? $data['name'] ?? $ig),
            ];
        }

        if ($account->platform === 'facebook') {
            $page = trim((string) $account->page_id);
            if ($page === '') {
                return ['ok' => false, 'error' => 'Facebook Page ID is required.'];
            }
            $res = Http::timeout(20)->get($this->baseUrl().'/'.$page, [
                'fields' => 'id,name',
                'access_token' => $token,
            ]);
            if (! $res->successful()) {
                return ['ok' => false, 'error' => $this->extractError($res->json(), $res->body())];
            }
            $data = $res->json();

            return [
                'ok' => true,
                'name' => (string) ($data['name'] ?? $page),
            ];
        }

        return ['ok' => false, 'error' => 'Platform not supported for live publish yet.'];
    }

    /**
     * @return array{ok: bool, external_id?: string, container_id?: string, error?: string}
     */
    public function publish(SocialPost $post, SocialAccount $account): array
    {
        if (! $account->is_connected || ! $account->access_token) {
            return ['ok' => false, 'error' => 'Account not connected for this store.'];
        }

        $mediaType = $this->resolveMediaType($post);
        $mediaUrl = $this->absolutizeUrl(trim((string) ($post->image_url ?? '')));
        $caption = trim((string) ($post->caption ?? ''));

        if ($mediaType === 'text') {
            if ($account->platform !== 'facebook') {
                return ['ok' => false, 'error' => 'Text-only posts are supported on Facebook only.'];
            }
            if ($caption === '') {
                return ['ok' => false, 'error' => 'General text (caption) is required for text posts.'];
            }

            return $this->publishFacebookText($account, $caption);
        }

        if ($mediaUrl === '') {
            return ['ok' => false, 'error' => $mediaType === 'video' ? 'Video URL is required.' : 'Image URL is required.'];
        }

        if ($account->platform === 'instagram') {
            return $mediaType === 'video'
                ? $this->publishInstagramVideo($post, $account, $mediaUrl, $caption)
                : $this->publishInstagramImage($post, $account, $mediaUrl, $caption);
        }

        if ($account->platform === 'facebook') {
            return $mediaType === 'video'
                ? $this->publishFacebookVideo($account, $mediaUrl, $caption)
                : $this->publishFacebookPhoto($account, $mediaUrl, $caption);
        }

        return ['ok' => false, 'error' => 'Unsupported platform: '.$account->platform];
    }

    private function resolveMediaType(SocialPost $post): string
    {
        $raw = strtolower(trim((string) ($post->media_type ?? '')));
        if (in_array($raw, ['image', 'video', 'text'], true)) {
            return $raw;
        }

        $url = trim((string) ($post->image_url ?? ''));
        $caption = trim((string) ($post->caption ?? ''));
        if ($url === '' && $caption !== '') {
            return 'text';
        }
        if ($url !== '' && preg_match('/\.(mp4|mov|webm|m4v)(\?|$)/i', $url)) {
            return 'video';
        }

        return 'image';
    }

    private function absolutizeUrl(string $url): string
    {
        if ($url === '') {
            return '';
        }
        if (str_starts_with($url, '/')) {
            $appUrl = rtrim((string) config('app.url'), '/');

            return $appUrl.$url;
        }

        return $url;
    }

    /**
     * @return array{ok: bool, external_id?: string, container_id?: string, error?: string}
     */
    private function publishInstagramImage(SocialPost $post, SocialAccount $account, string $imageUrl, string $caption): array
    {
        $ig = trim((string) $account->ig_user_id);
        $token = (string) $account->access_token;

        $create = Http::timeout(45)->asForm()->post($this->baseUrl().'/'.$ig.'/media', [
            'image_url' => $imageUrl,
            'caption' => $caption,
            'access_token' => $token,
        ]);

        if (! $create->successful()) {
            return ['ok' => false, 'error' => $this->extractError($create->json(), $create->body())];
        }

        $containerId = (string) ($create->json('id') ?? '');
        if ($containerId === '') {
            return ['ok' => false, 'error' => 'Meta did not return a media container id.'];
        }

        return $this->finishInstagramPublish($ig, $token, $containerId);
    }

    /**
     * @return array{ok: bool, external_id?: string, container_id?: string, error?: string}
     */
    private function publishInstagramVideo(SocialPost $post, SocialAccount $account, string $videoUrl, string $caption): array
    {
        $ig = trim((string) $account->ig_user_id);
        $token = (string) $account->access_token;

        $create = Http::timeout(60)->asForm()->post($this->baseUrl().'/'.$ig.'/media', [
            'media_type' => 'REELS',
            'video_url' => $videoUrl,
            'caption' => $caption,
            'access_token' => $token,
        ]);

        if (! $create->successful()) {
            return ['ok' => false, 'error' => $this->extractError($create->json(), $create->body())];
        }

        $containerId = (string) ($create->json('id') ?? '');
        if ($containerId === '') {
            return ['ok' => false, 'error' => 'Meta did not return a video container id.'];
        }

        $ready = $this->waitForInstagramContainer($token, $containerId, 12);
        if (! $ready['ok']) {
            return [
                'ok' => false,
                'container_id' => $containerId,
                'error' => $ready['error'] ?? 'Instagram video container not ready.',
            ];
        }

        return $this->finishInstagramPublish($ig, $token, $containerId);
    }

    /**
     * @return array{ok: bool, external_id?: string, container_id?: string, error?: string}
     */
    private function finishInstagramPublish(string $igUserId, string $token, string $containerId): array
    {
        usleep(1_500_000);

        $publish = Http::timeout(60)->asForm()->post($this->baseUrl().'/'.$igUserId.'/media_publish', [
            'creation_id' => $containerId,
            'access_token' => $token,
        ]);

        if (! $publish->successful()) {
            Log::warning('Instagram media_publish failed', [
                'container' => $containerId,
                'body' => $publish->body(),
            ]);

            return [
                'ok' => false,
                'container_id' => $containerId,
                'error' => $this->extractError($publish->json(), $publish->body()),
            ];
        }

        return [
            'ok' => true,
            'container_id' => $containerId,
            'external_id' => (string) ($publish->json('id') ?? $containerId),
        ];
    }

    /**
     * Poll container status until FINISHED (videos need longer processing).
     *
     * @return array{ok: bool, error?: string}
     */
    private function waitForInstagramContainer(string $token, string $containerId, int $attempts): array
    {
        for ($i = 0; $i < $attempts; $i++) {
            usleep(2_000_000);
            $status = Http::timeout(20)->get($this->baseUrl().'/'.$containerId, [
                'fields' => 'status_code,status',
                'access_token' => $token,
            ]);
            if (! $status->successful()) {
                continue;
            }
            $code = strtoupper((string) ($status->json('status_code') ?? ''));
            if ($code === 'FINISHED') {
                return ['ok' => true];
            }
            if (in_array($code, ['ERROR', 'EXPIRED'], true)) {
                return ['ok' => false, 'error' => 'Instagram media processing failed: '.$code];
            }
        }

        return ['ok' => false, 'error' => 'Instagram video is still processing. Try again shortly.'];
    }

    /**
     * @return array{ok: bool, external_id?: string, error?: string}
     */
    private function publishFacebookPhoto(SocialAccount $account, string $imageUrl, string $caption): array
    {
        $page = trim((string) $account->page_id);
        $token = (string) $account->access_token;

        $res = Http::timeout(45)->asForm()->post($this->baseUrl().'/'.$page.'/photos', [
            'url' => $imageUrl,
            'caption' => $caption,
            'access_token' => $token,
        ]);

        if (! $res->successful()) {
            return ['ok' => false, 'error' => $this->extractError($res->json(), $res->body())];
        }

        $id = (string) ($res->json('post_id') ?? $res->json('id') ?? '');

        return [
            'ok' => true,
            'external_id' => $id !== '' ? $id : null,
        ];
    }

    /**
     * @return array{ok: bool, external_id?: string, error?: string}
     */
    private function publishFacebookVideo(SocialAccount $account, string $videoUrl, string $caption): array
    {
        $page = trim((string) $account->page_id);
        $token = (string) $account->access_token;

        $res = Http::timeout(90)->asForm()->post($this->baseUrl().'/'.$page.'/videos', [
            'file_url' => $videoUrl,
            'description' => $caption,
            'access_token' => $token,
        ]);

        if (! $res->successful()) {
            return ['ok' => false, 'error' => $this->extractError($res->json(), $res->body())];
        }

        $id = (string) ($res->json('id') ?? '');

        return [
            'ok' => true,
            'external_id' => $id !== '' ? $id : null,
        ];
    }

    /**
     * @return array{ok: bool, external_id?: string, error?: string}
     */
    private function publishFacebookText(SocialAccount $account, string $message): array
    {
        $page = trim((string) $account->page_id);
        $token = (string) $account->access_token;

        $res = Http::timeout(30)->asForm()->post($this->baseUrl().'/'.$page.'/feed', [
            'message' => $message,
            'access_token' => $token,
        ]);

        if (! $res->successful()) {
            return ['ok' => false, 'error' => $this->extractError($res->json(), $res->body())];
        }

        $id = (string) ($res->json('id') ?? '');

        return [
            'ok' => true,
            'external_id' => $id !== '' ? $id : null,
        ];
    }

    /**
     * @param  mixed  $json
     */
    private function extractError($json, string $rawBody): string
    {
        if (is_array($json)) {
            $msg = $json['error']['message'] ?? $json['message'] ?? null;
            if (is_string($msg) && $msg !== '') {
                return mb_substr($msg, 0, 500);
            }
        }
        $trimmed = trim($rawBody);

        return $trimmed !== '' ? mb_substr($trimmed, 0, 500) : 'Meta Graph request failed.';
    }
}

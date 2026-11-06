<?php

namespace App\Services\Social;

use App\Models\SocialAccount;
use App\Models\SocialPost;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Real Meta Graph publish — Instagram Content Publishing + Facebook Page photos.
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

        $imageUrl = trim((string) $post->image_url);
        if ($imageUrl === '') {
            return ['ok' => false, 'error' => 'Image URL is required.'];
        }

        // Relative /storage URLs need absolute public host for Meta to fetch
        if (str_starts_with($imageUrl, '/')) {
            $appUrl = rtrim((string) config('app.url'), '/');
            $imageUrl = $appUrl.$imageUrl;
        }

        if ($account->platform === 'instagram') {
            return $this->publishInstagram($post, $account, $imageUrl);
        }

        if ($account->platform === 'facebook') {
            return $this->publishFacebook($post, $account, $imageUrl);
        }

        return ['ok' => false, 'error' => 'Unsupported platform: '.$account->platform];
    }

    /**
     * @return array{ok: bool, external_id?: string, container_id?: string, error?: string}
     */
    private function publishInstagram(SocialPost $post, SocialAccount $account, string $imageUrl): array
    {
        $ig = trim((string) $account->ig_user_id);
        $token = (string) $account->access_token;

        $create = Http::timeout(45)->asForm()->post($this->baseUrl().'/'.$ig.'/media', [
            'image_url' => $imageUrl,
            'caption' => (string) ($post->caption ?? ''),
            'access_token' => $token,
        ]);

        if (! $create->successful()) {
            return ['ok' => false, 'error' => $this->extractError($create->json(), $create->body())];
        }

        $containerId = (string) ($create->json('id') ?? '');
        if ($containerId === '') {
            return ['ok' => false, 'error' => 'Meta did not return a media container id.'];
        }

        // Brief wait for container ready (Hostinger cron may retry on fail)
        usleep(1_500_000);

        $publish = Http::timeout(45)->asForm()->post($this->baseUrl().'/'.$ig.'/media_publish', [
            'creation_id' => $containerId,
            'access_token' => $token,
        ]);

        if (! $publish->successful()) {
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
     * @return array{ok: bool, external_id?: string, error?: string}
     */
    private function publishFacebook(SocialPost $post, SocialAccount $account, string $imageUrl): array
    {
        $page = trim((string) $account->page_id);
        $token = (string) $account->access_token;

        $res = Http::timeout(45)->asForm()->post($this->baseUrl().'/'.$page.'/photos', [
            'url' => $imageUrl,
            'caption' => (string) ($post->caption ?? ''),
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

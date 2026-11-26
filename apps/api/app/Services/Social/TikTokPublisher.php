<?php

namespace App\Services\Social;

use App\Models\SocialAccount;
use App\Models\SocialPost;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Real TikTok API Publisher & Connector.
 * Supports TikTok Open API (Login Kit / Content Posting) and TikTok Business Marketing API.
 * Tenant-isolated per store_id with live token validation.
 */
final class TikTokPublisher
{
    private const OPEN_API_BASE = 'https://open.tiktokapis.com/v2';
    private const BUSINESS_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

    /**
     * Live connection test for TikTok account.
     * Checks both TikTok Open API and TikTok Business API with the provided token.
     *
     * @return array{ok: bool, name?: string, avatar?: string, error?: string}
     */
    public function testAccount(SocialAccount $account): array
    {
        $token = trim((string) $account->access_token);
        if ($token === '') {
            return ['ok' => false, 'error' => 'TikTok Access Token is required.'];
        }

        // 1. Try TikTok Open API user/info
        try {
            $openRes = Http::timeout(20)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                ])
                ->get(self::OPEN_API_BASE . '/user/info/', [
                    'fields' => 'open_id,union_id,avatar_url,display_name,username',
                ]);

            if ($openRes->successful()) {
                $data = $openRes->json();
                $userData = $data['data']['user'] ?? null;
                if ($userData) {
                    $name = (string) ($userData['display_name'] ?? $userData['username'] ?? $account->account_name ?? 'TikTok Store');
                    $avatar = (string) ($userData['avatar_url'] ?? '');
                    return [
                        'ok' => true,
                        'name' => $name,
                        'avatar' => $avatar,
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::debug('TikTok Open API check error: ' . $e->getMessage());
        }

        // 2. Try TikTok Business Marketing API user/info or advertiser/get
        try {
            $bizRes = Http::timeout(20)
                ->withHeaders([
                    'Access-Token' => $token,
                ])
                ->get(self::BUSINESS_API_BASE . '/user/info/');

            if ($bizRes->successful()) {
                $bizData = $bizRes->json();
                if (($bizData['code'] ?? -1) === 0 && !empty($bizData['data'])) {
                    $u = $bizData['data'];
                    $name = (string) ($u['display_name'] ?? $u['name'] ?? $u['email'] ?? $account->account_name ?? 'TikTok Business Account');
                    return [
                        'ok' => true,
                        'name' => $name,
                    ];
                }
            }

            // Also check advertiser list for Marketing API tokens
            $advRes = Http::timeout(20)
                ->withHeaders([
                    'Access-Token' => $token,
                ])
                ->get(self::BUSINESS_API_BASE . '/oauth2/advertiser/get/', [
                    'app_id' => config('services.tiktok.app_id', ''),
                    'secret' => config('services.tiktok.client_secret', ''),
                ]);

            if ($advRes->successful()) {
                $advData = $advRes->json();
                if (($advData['code'] ?? -1) === 0 && !empty($advData['data']['list'])) {
                    $firstAdv = $advData['data']['list'][0];
                    $name = (string) ($firstAdv['advertiser_name'] ?? 'TikTok Ad Account');
                    return [
                        'ok' => true,
                        'name' => $name,
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::debug('TikTok Business API check error: ' . $e->getMessage());
        }

        // If direct HTTP failed, check token structure and provide actionable error
        if (isset($openRes) && !$openRes->successful()) {
            $errBody = $openRes->json();
            $msg = $errBody['error']['message'] ?? $errBody['message'] ?? null;
            if ($msg) {
                return ['ok' => false, 'error' => 'TikTok API Error: ' . $msg];
            }
        }

        if (isset($bizRes) && !$bizRes->successful()) {
            $bizBody = $bizRes->json();
            $msg = $bizBody['message'] ?? null;
            if ($msg) {
                return ['ok' => false, 'error' => 'TikTok Business API Error: ' . $msg];
            }
        }

        // Live test failed to verify token against TikTok servers
        return [
            'ok' => false,
            'error' => 'Invalid TikTok Access Token or insufficient permissions (user.info.basic / video.publish required).',
        ];
    }

    /**
     * Publish video or photo post to TikTok.
     *
     * @return array{ok: bool, external_id?: string, container_id?: string, error?: string}
     */
    public function publish(SocialPost $post, SocialAccount $account): array
    {
        if (!$account->is_connected || !$account->access_token) {
            return ['ok' => false, 'error' => 'TikTok account is not connected for this store.'];
        }

        $token = trim((string) $account->access_token);
        $videoUrl = trim((string) ($post->image_url ?? ''));
        $title = trim((string) ($post->caption ?? ''));

        if ($videoUrl === '') {
            return ['ok' => false, 'error' => 'Media URL (video or photo) is required for TikTok publish.'];
        }

        // Initialize Creator Direct Share / Publish request
        try {
            $publishRes = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                    'Content-Type' => 'application/json',
                ])
                ->post(self::OPEN_API_BASE . '/post/publish/video/init/', [
                    'post_info' => [
                        'title' => mb_substr($title, 0, 150),
                        'privacy_level' => 'PUBLIC_TO_EVERYONE',
                        'disable_duet' => false,
                        'disable_stitch' => false,
                        'disable_comment' => false,
                    ],
                    'source_info' => [
                        'source' => 'PULL_FROM_URL',
                        'video_url' => $videoUrl,
                    ],
                ]);

            if ($publishRes->successful()) {
                $publishData = $publishRes->json();
                $publishId = (string) ($publishData['data']['publish_id'] ?? '');
                if ($publishId !== '') {
                    return [
                        'ok' => true,
                        'external_id' => $publishId,
                        'container_id' => $publishId,
                    ];
                }
            }

            $errBody = $publishRes->json();
            $errMsg = $errBody['error']['message'] ?? $errBody['message'] ?? 'TikTok video init failed.';
            return ['ok' => false, 'error' => $errMsg];
        } catch (\Throwable $e) {
            Log::error('TikTok publish exception', ['error' => $e->getMessage()]);
            return ['ok' => false, 'error' => 'Network error connecting to TikTok: ' . $e->getMessage()];
        }
    }
}

/**
 * Real Meta/IG social publisher API — strictly isolated per store_id.
 * No fake pre-populated dummy data or dummy followers.
 * Each store maintains its own independent connected accounts and posts.
 */

import { apiFetch } from '../api/client';

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'snapchat' | 'x';

/** Live Meta Graph only — TikTok / Snap / X stay Coming Soon until real APIs ship. */
export const LIVE_SOCIAL_PLATFORMS: readonly SocialPlatform[] = ['instagram', 'facebook'];

export function isLiveSocialPlatform(platform: string): boolean {
  return (LIVE_SOCIAL_PLATFORMS as readonly string[]).includes(platform);
}

export type SocialAccountPublic = {
  platform: SocialPlatform;
  supported: boolean;
  is_connected: boolean;
  account_name?: string | null;
  handle?: string | null;
  avatar_url?: string | null;
  followers_count?: number | string | null;
  is_verified?: boolean;
  page_id?: string | null;
  ig_user_id?: string | null;
  has_token: boolean;
  last_tested_at?: string | null;
  last_error?: string | null;
  status: 'connected' | 'not_connected' | 'not_available';
};

export type SocialMediaType = 'image' | 'video' | 'text';

export type SocialPostRow = {
  id: string;
  store_id: string;
  platform: SocialPlatform;
  media_id?: string | null;
  media_type?: SocialMediaType | null;
  image_url: string | null;
  caption?: string | null;
  scheduled_for?: string | null;
  status: 'published' | 'scheduled' | 'failed' | 'cancelled';
  meta_container_id?: string | null;
  external_post_id?: string | null;
  error_message?: string | null;
  published_at?: string | null;
  created_at?: string;
  likes_count?: number;
  comments_count?: number;
  reach_count?: number;
};

// Isolated storage keys per store (v4: force Coming Soon for non-Meta platforms)
const STORAGE_VER = 'v4';
const getAccountsStorageKey = (storeId: string) => `unityteck_social_accounts_${STORAGE_VER}_${storeId}`;
const getPostsStorageKey = (storeId: string) => `unityteck_social_posts_${STORAGE_VER}_${storeId}`;

function accountShell(
  platform: SocialPlatform,
  live: boolean,
): SocialAccountPublic {
  return {
    platform,
    supported: live,
    is_connected: false,
    account_name: null,
    handle: null,
    avatar_url: null,
    followers_count: null,
    is_verified: false,
    has_token: false,
    last_tested_at: null,
    status: live ? 'not_connected' : 'not_available',
  };
}

/** Sanitize: never keep fake Connected on Coming Soon platforms. */
export function sanitizeSocialAccounts(list: SocialAccountPublic[]): SocialAccountPublic[] {
  const byPlatform = new Map(list.map((a) => [a.platform, a]));
  return (['instagram', 'facebook', 'tiktok', 'x', 'snapchat'] as SocialPlatform[]).map((platform) => {
    const live = isLiveSocialPlatform(platform);
    const row = byPlatform.get(platform);
    if (!live) {
      return accountShell(platform, false);
    }
    if (!row) return accountShell(platform, true);
    return {
      ...row,
      platform,
      supported: true,
      status: row.is_connected ? 'connected' : 'not_connected',
      followers_count:
        typeof row.followers_count === 'string' && String(row.followers_count).includes('K')
          ? 0
          : row.followers_count ?? null,
    };
  });
}

/** Default clean state for any store: Meta live slots + Coming Soon for the rest */
export function getInitialAccountsForStore(): SocialAccountPublic[] {
  return sanitizeSocialAccounts([]);
}

function cleanupLegacyMockKeys(storeId: string) {
  try {
    const legacyKeys = [
      `unityteck_social_accounts_v3_${storeId}`,
      `unityteck_social_accounts_v2_${storeId}`,
      `unityteck_social_accounts_v1_${storeId}`,
      `unityteck_social_posts_v3_${storeId}`,
      `unityteck_social_posts_v2_${storeId}`,
      `unityteck_mock_social_${storeId}`,
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

function loadLocalAccounts(storeId: string): SocialAccountPublic[] {
  cleanupLegacyMockKeys(storeId);
  try {
    const raw = localStorage.getItem(getAccountsStorageKey(storeId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = sanitizeSocialAccounts(parsed);
        saveLocalAccounts(storeId, sanitized);
        return sanitized;
      }
    }
  } catch {
    // ignore
  }
  const init = getInitialAccountsForStore();
  saveLocalAccounts(storeId, init);
  return init;
}

function saveLocalAccounts(storeId: string, accounts: SocialAccountPublic[]): void {
  try {
    localStorage.setItem(getAccountsStorageKey(storeId), JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

function loadLocalPosts(storeId: string): SocialPostRow[] {
  try {
    const raw = localStorage.getItem(getPostsStorageKey(storeId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveLocalPosts(storeId: string, posts: SocialPostRow[]): void {
  try {
    localStorage.setItem(getPostsStorageKey(storeId), JSON.stringify(posts));
  } catch {
    // ignore
  }
}

export async function fetchSocialAccounts(storeId: string): Promise<SocialAccountPublic[]> {
  try {
    const res = await apiFetch<{ data: SocialAccountPublic[] }>('/social/accounts', { storeId });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const sanitized = sanitizeSocialAccounts(res.data);
      saveLocalAccounts(storeId, sanitized);
      return sanitized;
    }
  } catch {
    // isolated local storage fallback
  }
  return loadLocalAccounts(storeId);
}

export async function upsertSocialAccount(
  storeId: string,
  payload: {
    platform: SocialPlatform;
    access_token?: string;
    page_id?: string;
    ig_user_id?: string;
    account_name?: string;
    handle?: string;
    followers_count?: string | number;
    test?: boolean;
  },
): Promise<SocialAccountPublic> {
  if (!isLiveSocialPlatform(payload.platform)) {
    throw new Error(
      `${payload.platform} is Coming Soon — only Instagram and Facebook support live connect right now.`,
    );
  }
  const token = String(payload.access_token || '').trim();
  if (token.length < 20) {
    throw new Error('A valid Meta Graph access token is required to connect.');
  }

  const res = await apiFetch<{ data: SocialAccountPublic; message?: string }>('/social/accounts', {
    method: 'PUT',
    storeId,
    body: { ...payload, access_token: token, test: payload.test !== false },
  });
  if (!res.data) {
    throw new Error('Connection failed — empty API response.');
  }
  const all = loadLocalAccounts(storeId);
  const updated = all.map((a) => (a.platform === payload.platform ? { ...res.data, supported: true } : a));
  saveLocalAccounts(storeId, sanitizeSocialAccounts(updated));
  return { ...res.data, supported: true };
}

export async function testSocialAccount(
  storeId: string,
  platform: string,
): Promise<{ ok: boolean; message?: string; data: SocialAccountPublic }> {
  try {
    const res = await apiFetch<{ ok: boolean; message?: string; data: SocialAccountPublic }>(
      `/social/accounts/${platform}/test`,
      { method: 'POST', storeId },
    );
    if (res && res.data) return res;
  } catch {
    // Zero-mock: never invent Connected on API failure
  }

  const all = loadLocalAccounts(storeId);
  const target = all.find((a) => a.platform === platform);
  if (!target || !target.is_connected) {
    return { ok: false, message: 'Account is not connected', data: {} as SocialAccountPublic };
  }
  return {
    ok: false,
    message: 'Live Graph test unavailable — not marking connected from local cache',
    data: target,
  };
}

export async function disconnectSocialAccount(storeId: string, platform: string): Promise<void> {
  try {
    await apiFetch(`/social/accounts/${platform}/disconnect`, { method: 'POST', storeId });
  } catch {
    // fallback
  }

  const all = loadLocalAccounts(storeId);
  const updated = all.map((a) =>
    a.platform === platform
      ? {
          ...a,
          is_connected: false,
          has_token: false,
          account_name: null,
          handle: null,
          followers_count: null,
          status: 'not_connected' as const,
          last_tested_at: null,
        }
      : a,
  );
  saveLocalAccounts(storeId, updated);
}

export async function fetchSocialPosts(
  storeId: string,
  params?: { status?: string; platform?: string },
): Promise<SocialPostRow[]> {
  try {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.platform) q.set('platform', params.platform);
    const qs = q.toString();
    const res = await apiFetch<{ data: SocialPostRow[] }>(`/social/posts${qs ? `?${qs}` : ''}`, {
      storeId,
    });
    if (res.data && Array.isArray(res.data)) {
      saveLocalPosts(storeId, res.data);
      return res.data;
    }
  } catch {
    // isolated store fallback
  }

  const posts = loadLocalPosts(storeId);
  return posts.filter((p) => {
    if (params?.status && p.status !== params.status) return false;
    if (params?.platform && p.platform !== params.platform) return false;
    return true;
  });
}

export async function scheduleSocialPost(
  storeId: string,
  payload: {
    platform: SocialPlatform;
    media_type?: SocialMediaType;
    media_id?: string;
    image_url?: string | null;
    caption?: string;
    scheduled_for?: string;
    publish_now?: boolean;
  },
): Promise<SocialPostRow> {
  if (!isLiveSocialPlatform(payload.platform)) {
    throw new Error(
      `${payload.platform} publishing is Coming Soon — use Instagram or Facebook.`,
    );
  }

  const mediaType = payload.media_type || 'image';
  if (mediaType === 'text' && payload.platform !== 'facebook') {
    throw new Error('Text-only posts are available on Facebook only.');
  }

  const res = await apiFetch<{ data: SocialPostRow }>('/social/posts', {
    method: 'POST',
    storeId,
    body: {
      platform: payload.platform,
      media_type: mediaType,
      media_id: payload.media_id,
      image_url: mediaType === 'text' ? undefined : payload.image_url,
      caption: payload.caption,
      scheduled_for: payload.publish_now ? undefined : payload.scheduled_for,
      publish_now: payload.publish_now === true,
    },
  });
  if (!res.data) {
    throw new Error('Failed to schedule social post.');
  }
  const posts = loadLocalPosts(storeId);
  saveLocalPosts(storeId, [res.data, ...posts]);
  return res.data;
}

export async function cancelSocialPost(storeId: string, postId: string): Promise<void> {
  try {
    await apiFetch(`/social/posts/${postId}/cancel`, { method: 'POST', storeId });
  } catch {
    // fallback
  }

  const posts = loadLocalPosts(storeId);
  const updated = posts.map((p) => (p.id === postId ? { ...p, status: 'cancelled' as const } : p));
  saveLocalPosts(storeId, updated);
}

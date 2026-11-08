/**
 * Unified Social OAuth Service
 * Handles browser popup authorization for Meta (Instagram & Facebook), TikTok, X, and Snapchat.
 * Strictly isolated per store. No fake mock followers or pre-populated dummy credentials.
 */

import {
  type SocialPlatform,
  type SocialAccountPublic,
  upsertSocialAccount,
  isLiveSocialPlatform,
} from './socialPublisherService';

export interface SocialOAuthOptions {
  platform: SocialPlatform;
  storeId: string;
  storeName: string;
  storeSlug?: string;
  customAppId?: string;
}

export interface SocialOAuthSuccessPayload {
  platform: SocialPlatform;
  storeId: string;
  account_name: string;
  handle: string;
  followers_count?: number | null;
  avatar_url?: string;
  access_token: string;
  page_id?: string;
  ig_user_id?: string;
  permissions_granted: string[];
}

/** Open Meta Graph connect popup (Instagram / Facebook only). */
export function openSocialOAuthPopup(options: SocialOAuthOptions): Promise<SocialAccountPublic> {
  return new Promise((resolve, reject) => {
    if (!isLiveSocialPlatform(options.platform)) {
      reject(
        new Error(
          `${options.platform} is Coming Soon — only Instagram and Facebook can be connected now.`,
        ),
      );
      return;
    }

    const width = 620;
    const height = 750;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const query = new URLSearchParams({
      social_oauth: '1',
      platform: options.platform,
      storeId: options.storeId,
      storeName: options.storeName,
      storeSlug: options.storeSlug || options.storeId,
    });

    if (options.customAppId) {
      query.set('appId', options.customAppId);
    }

    const popupUrl = `${window.location.origin}${window.location.pathname}?${query.toString()}`;
    const windowName = `unityteck_social_oauth_${options.platform}_${Date.now()}`;

    const popup = window.open(
      popupUrl,
      windowName,
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no,scrollbars=yes,resizable=yes`,
    );

    if (!popup) {
      reject(new Error('Popup was blocked by your browser. Please allow popups for this site.'));
      return;
    }

    let isHandled = false;

    // Listen for postMessage from the popup
    const messageHandler = async (event: MessageEvent) => {
      // Security check: Only allow same origin messages
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (!data || data.type !== 'UNITYTECK_SOCIAL_OAUTH_SUCCESS') return;

      const payload = data.payload as SocialOAuthSuccessPayload;
      if (payload.platform !== options.platform || payload.storeId !== options.storeId) return;

      isHandled = true;
      window.removeEventListener('message', messageHandler);
      clearInterval(checkTimer);

      try {
        const account = await upsertSocialAccount(options.storeId, {
          platform: payload.platform,
          account_name: payload.account_name,
          handle: payload.handle,
          followers_count: payload.followers_count ?? 0,
          access_token: payload.access_token,
          page_id: payload.page_id,
          ig_user_id: payload.ig_user_id,
          test: true,
        });
        resolve(account);
      } catch (err) {
        reject(err);
      }
    };

    window.addEventListener('message', messageHandler);

    // Watch for popup closed by user
    const checkTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkTimer);
        window.removeEventListener('message', messageHandler);
        if (!isHandled) {
          reject(new Error('OAuth authorization was closed or cancelled.'));
        }
      }
    }, 600);
  });
}

/**
 * UnityTeck KSA Automation, Quota, Ad Wallet, SEO & Gamified Loyalty Engine
 * Strict 100% Per-Store Isolation (store_id) + Master Admin Global Governance.
 * Zero hardcoded store content — adapts dynamically to activeStore.
 */

export type KsaCity =
  | 'Riyadh'
  | 'Jeddah'
  | 'Makkah'
  | 'Madinah'
  | 'Dammam'
  | 'Khobar'
  | 'Qassim'
  | 'Abha'
  | 'Tabuk'
  | 'Taif';

export const KSA_CITIES: Array<{ id: KsaCity; nameEn: string; nameAr: string }> = [
  { id: 'Riyadh', nameEn: 'Riyadh', nameAr: 'الرياض' },
  { id: 'Jeddah', nameEn: 'Jeddah', nameAr: 'جدة' },
  { id: 'Makkah', nameEn: 'Makkah', nameAr: 'مكة المكرمة' },
  { id: 'Madinah', nameEn: 'Madinah', nameAr: 'المدينة المنورة' },
  { id: 'Dammam', nameEn: 'Dammam', nameAr: 'الدمام' },
  { id: 'Khobar', nameEn: 'Al Khobar', nameAr: 'الخبر' },
  { id: 'Qassim', nameEn: 'Al Qassim', nameAr: 'القصيم' },
  { id: 'Abha', nameEn: 'Abha', nameAr: 'أبها' },
  { id: 'Tabuk', nameEn: 'Tabuk', nameAr: 'تبوك' },
  { id: 'Taif', nameEn: 'Taif', nameAr: 'الطائف' },
];

export type KsaAdPlatform = 'snapchat' | 'tiktok' | 'instagram' | 'google' | 'youtube';

export type StudioSlot = 'morning' | 'evening';

export interface StudioQuotaState {
  storeId: string;
  dailyLimit: number; // 10 total daily edits (5 morning + 5 evening)
  usedToday: number; // total used today across both slots
  slotLimit: number; // 5 edits per slot
  slotUsed: number; // used in current active slot
  currentSlot: StudioSlot; // 'morning' | 'evening'
  lastResetDate: string; // YYYY-MM-DD
  lastSlotReset: string; // 'YYYY-MM-DD_morning' or 'YYYY-MM-DD_evening'
  cooldownUntil: number | null; // timestamp ms when current slot lock expires
  nextSlotUnlockTime: number; // timestamp ms when next slot opens
  isPro: boolean;
  proPendingApproval: boolean;
  proRequestedPlanAmountSar: number;
}

export interface KsaAdCampaign {
  id: string;
  storeId: string;
  nameEn: string;
  nameAr: string;
  platform: KsaAdPlatform;
  mode: 'ai_auto' | 'manual';
  targetCities: KsaCity[];
  dailyBudgetSar: number;
  spentSar: number;
  status: 'active' | 'scheduled' | 'paused';
  scheduleStart: string;
  nextPacingTickAt: number; // timer ms
  utmUrl: string;
  creativeImageUrl: string;
  headlineEn: string;
  headlineAr: string;
  impressions: number;
  clicks: number;
  visitors: number;
  addToCarts: number;
  orders: number;
  revenueSar: number;
  createdAt: string;
}

export interface StoreAdWalletState {
  storeId: string;
  balanceSar: number;
  pendingTopUpSar: number;
  pendingTopUpRequestedAt: string | null;
  dailySpendCapSar: number;
  spentTodaySar: number;
  totalDepositedSar: number;
  totalSpentSar: number;
  lastPacingTimerAt: number | null;
  transactions: Array<{
    id: string;
    type: 'topup_request' | 'topup_approved' | 'ad_deduction' | 'pro_upgrade';
    amountSar: number;
    noteEn: string;
    noteAr: string;
    createdAt: string;
    status: 'completed' | 'pending';
  }>;
}

export interface ScheduledSocialPost {
  id: string;
  storeId: string;
  platform: 'instagram' | 'tiktok' | 'snapchat' | 'telegram' | 'x';
  captionEn: string;
  captionAr: string;
  imageUrl: string;
  productId?: string;
  scheduledFor: string; // ISO or YYYY-MM-DD HH:mm
  status: 'scheduled' | 'published';
  views: number;
  likes: number;
  clicks: number;
  conversions: number;
  utmUrl: string;
  createdAt: string;
}

export interface StoreSocialScheduleState {
  storeId: string;
  dailyPostLimit: number; // default 5 free
  postsUsedToday: number;
  cooldownHours: number; // default 3 hours between posts
  nextAllowedPostAt: number | null;
  connectedAccounts: Record<'instagram' | 'tiktok' | 'snapchat' | 'telegram' | 'x', {
    connected: boolean;
    handle: string;
  }>;
  posts: ScheduledSocialPost[];
}

export interface SeoDeepAuditItem {
  id: string;
  type: 'broken_link' | 'backlink' | 'heading_h1_h2' | 'missing_alt' | 'meta_tag' | 'sitemap_index';
  urlOrTarget: string;
  issueEn: string;
  issueAr: string;
  fixActionEn: string;
  fixActionAr: string;
  status: 'healthy' | 'warning' | 'error' | 'fixed';
}

export interface MasterGlobalTrackingConfig {
  masterGtmId: string;
  masterGa4Id: string;
  masterIndexingAutoEnabled: boolean;
  indexingTimerMinutes: number; // default 5 mins cooldown
  updatedAt: string;
}

export interface StoreOrderPolicyState {
  storeId: string;
  allowCustomerCancel: boolean;
  cancelWindowHours: number; // e.g., 2 hours
  allowedCancelStatuses: Array<'pending' | 'processing'>;
  autoEmailOnOrderSubmit: boolean;
  autoEmailOnOrderDone: boolean;
  autoDashboardBell: boolean;
  shippingCarrierDefault: string;
  estimatedDeliveryHoursKsa: number;
}

export interface CustomerGamifiedProfile {
  customerId: string;
  storeId: string;
  phone: string;
  name: string;
  email: string;
  locationAllowed: boolean;
  city: KsaCity | string;
  coordinates: { lat: number; lng: number } | null;
  notificationsAllowed: boolean;
  loyaltyCardNumber: string;
  loyaltyTier: 'Silver' | 'Gold' | 'Platinum';
  coinsBalance: number;
  totalCoinsEarned: number;
  totalCoinsRedeemed: number;
  lastGameSpinAt: number | null; // 24h cooldown
  savedCards: Array<{
    id: string;
    brand: 'Mada' | 'Visa' | 'MasterCard' | 'ApplePay';
    last4: string;
    holderName: string;
    expiry: string;
    bonusCoinsPerUse: number;
  }>;
  activeCoupons: string[];
  cartStage: 'browsing' | 'added_to_cart' | 'checkout_started' | 'ordered';
  utmSource?: string;
  utmCampaign?: string;
  updatedAt: string;
}

export interface StoreLoyaltyGameSettings {
  storeId: string;
  gameEnabled: boolean;
  storefrontDockEnabled: boolean; // Enable or disable floating customer dock pill on storefront
  coinsPerSar: number; // e.g. 10 coins = 1 SAR (100 coins = 10 SAR)
  minSpinCoins: number;
  maxSpinCoins: number;
  spinCooldownHours: number; // 24h
  cardPaymentBonusCoins: number; // e.g. 25 coins when paying with saved card
  signupLocationBonusCoins: number; // e.g. 50 coins when allowing location & push
}

const todayStr = () => new Date().toISOString().split('T')[0];

const ksaMemoryCache = new Map<string, any>();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key) ksaMemoryCache.delete(e.key);
    else ksaMemoryCache.clear();
  });
}

function readCachedJson<T>(key: string): T | null {
  if (ksaMemoryCache.has(key)) {
    return ksaMemoryCache.get(key) as T;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    ksaMemoryCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedJson(key: string, value: unknown): void {
  ksaMemoryCache.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

function emitStoreSync(storeId: string, scope: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('unityteck-ksa-engine-sync', {
        detail: { storeId, scope, ts: Date.now() },
      }),
    );
  }
}

/* ============================================================================
 * 1. CANVA AI STUDIO QUOTA & PRO UNLOCK (Per Store Isolated)
 * Free Plan: 10 images daily (5 Morning Slot [06:00-18:00] + 5 Evening Slot [18:00-06:00])
 * ========================================================================== */
export function getStudioSlotInfo(now: Date = new Date()): {
  slot: StudioSlot;
  slotKey: string;
  nextUnlockMs: number;
} {
  const hours = now.getHours();
  const dateStr = now.toISOString().split('T')[0];
  if (hours >= 6 && hours < 18) {
    // Morning Slot (06:00 to 18:00) -> Next unlock at 18:00
    const nextSlot = new Date(now);
    nextSlot.setHours(18, 0, 0, 0);
    return {
      slot: 'morning',
      slotKey: `${dateStr}_morning`,
      nextUnlockMs: nextSlot.getTime(),
    };
  } else {
    // Evening Slot (18:00 to 06:00 next day) -> Next unlock at 06:00
    const nextSlot = new Date(now);
    if (hours >= 18) {
      nextSlot.setDate(nextSlot.getDate() + 1);
    }
    nextSlot.setHours(6, 0, 0, 0);
    return {
      slot: 'evening',
      slotKey: `${dateStr}_evening`,
      nextUnlockMs: nextSlot.getTime(),
    };
  }
}

export function getStudioQuota(storeId: string): StudioQuotaState {
  const key = `unityteck_studio_quota_${storeId}`;
  const slotInfo = getStudioSlotInfo();
  const defaults: StudioQuotaState = {
    storeId,
    dailyLimit: 10,
    usedToday: 0,
    slotLimit: 5,
    slotUsed: 0,
    currentSlot: slotInfo.slot,
    lastResetDate: todayStr(),
    lastSlotReset: slotInfo.slotKey,
    cooldownUntil: null,
    nextSlotUnlockTime: slotInfo.nextUnlockMs,
    isPro: false,
    proPendingApproval: false,
    proRequestedPlanAmountSar: 199,
  };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed: StudioQuotaState = { ...defaults, ...JSON.parse(raw), storeId };

    // Reset daily counter if day changed
    if (parsed.lastResetDate !== todayStr()) {
      parsed.usedToday = 0;
      parsed.lastResetDate = todayStr();
    }

    // Reset slot counter if slot shifted (morning -> evening or evening -> morning)
    if (parsed.lastSlotReset !== slotInfo.slotKey) {
      parsed.slotUsed = 0;
      parsed.currentSlot = slotInfo.slot;
      parsed.lastSlotReset = slotInfo.slotKey;
      parsed.cooldownUntil = null;
      parsed.nextSlotUnlockTime = slotInfo.nextUnlockMs;
      localStorage.setItem(key, JSON.stringify(parsed));
    } else {
      parsed.currentSlot = slotInfo.slot;
      parsed.nextSlotUnlockTime = slotInfo.nextUnlockMs;
      // If cooldown reached, unlock
      if (parsed.cooldownUntil && Date.now() >= parsed.cooldownUntil) {
        parsed.cooldownUntil = null;
        parsed.slotUsed = 0;
        localStorage.setItem(key, JSON.stringify(parsed));
      }
    }

    return parsed;
  } catch {
    return defaults;
  }
}

export function saveStudioQuota(storeId: string, state: StudioQuotaState): void {
  const key = `unityteck_studio_quota_${storeId}`;
  localStorage.setItem(key, JSON.stringify({ ...state, storeId }));
  emitStoreSync(storeId, 'studio_quota');
}

export function consumeStudioAiCredit(storeId: string): {
  allowed: boolean;
  state: StudioQuotaState;
} {
  const curr = getStudioQuota(storeId);
  const slotInfo = getStudioSlotInfo();

  // If locked under cooldown (current slot exhausted and not Pro)
  if (curr.cooldownUntil && Date.now() < curr.cooldownUntil && !curr.isPro) {
    return { allowed: false, state: curr };
  }

  // Check if slot limit reached (5 in slot)
  if (curr.slotUsed >= curr.slotLimit && !curr.isPro) {
    const locked: StudioQuotaState = {
      ...curr,
      cooldownUntil: slotInfo.nextUnlockMs,
      nextSlotUnlockTime: slotInfo.nextUnlockMs,
    };
    saveStudioQuota(storeId, locked);
    return { allowed: false, state: locked };
  }

  const nextSlotUsed = curr.slotUsed + 1;
  const nextUsedToday = curr.usedToday + 1;
  const isNowLocked = !curr.isPro && nextSlotUsed >= curr.slotLimit;

  const next: StudioQuotaState = {
    ...curr,
    slotUsed: nextSlotUsed,
    usedToday: nextUsedToday,
    cooldownUntil: isNowLocked ? slotInfo.nextUnlockMs : null,
    nextSlotUnlockTime: slotInfo.nextUnlockMs,
  };
  saveStudioQuota(storeId, next);
  return { allowed: true, state: next };
}

export function requestStudioProUpgrade(storeId: string, amountSar = 199): StudioQuotaState {
  const curr = getStudioQuota(storeId);
  const next: StudioQuotaState = {
    ...curr,
    proPendingApproval: true,
    proRequestedPlanAmountSar: amountSar,
  };
  saveStudioQuota(storeId, next);
  return next;
}

export function masterApproveStudioPro(storeId: string, newDailyLimit = 50): StudioQuotaState {
  const curr = getStudioQuota(storeId);
  const next: StudioQuotaState = {
    ...curr,
    isPro: true,
    proPendingApproval: false,
    dailyLimit: newDailyLimit,
    slotLimit: newDailyLimit,
    cooldownUntil: null,
  };
  saveStudioQuota(storeId, next);
  return next;
}

/* ============================================================================
 * 2. STORE AD WALLET & KSA MULTI-CHANNEL AD CAMPAIGNS (Per Store Isolated)
 * ========================================================================== */
export function getStoreAdWallet(storeId: string): StoreAdWalletState {
  const key = `unityteck_ad_wallet_${storeId}`;
  const defaults: StoreAdWalletState = {
    storeId,
    balanceSar: 0,
    pendingTopUpSar: 0,
    pendingTopUpRequestedAt: null,
    dailySpendCapSar: 100,
    spentTodaySar: 0,
    totalDepositedSar: 0,
    totalSpentSar: 0,
    lastPacingTimerAt: null,
    transactions: [],
  };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw), storeId };
  } catch {
    return defaults;
  }
}

export function saveStoreAdWallet(storeId: string, wallet: StoreAdWalletState): void {
  const key = `unityteck_ad_wallet_${storeId}`;
  localStorage.setItem(key, JSON.stringify({ ...wallet, storeId }));
  emitStoreSync(storeId, 'ad_wallet');
}

export function requestAdWalletTopUp(storeId: string, amountSar: number): StoreAdWalletState {
  const curr = getStoreAdWallet(storeId);
  const tx = {
    id: `tx-${Date.now()}`,
    type: 'topup_request' as const,
    amountSar,
    noteEn: `Ad Wallet Top-Up Request (${amountSar} SAR) — Awaiting Master Admin Approval`,
    noteAr: `طلب شحن محفظة الإعلانات (${amountSar} ر.س) — بانتظار موافقة الإدارة العليا`,
    createdAt: new Date().toISOString(),
    status: 'pending' as const,
  };
  const next: StoreAdWalletState = {
    ...curr,
    pendingTopUpSar: curr.pendingTopUpSar + amountSar,
    pendingTopUpRequestedAt: new Date().toISOString(),
    transactions: [tx, ...curr.transactions],
  };
  saveStoreAdWallet(storeId, next);
  return next;
}

export function masterApproveAdWalletTopUp(
  storeId: string,
  customAmountSar?: number,
  newDailyCapSar?: number,
): StoreAdWalletState {
  const curr = getStoreAdWallet(storeId);
  const creditAmount = customAmountSar ?? (curr.pendingTopUpSar > 0 ? curr.pendingTopUpSar : 1000);
  const tx = {
    id: `tx-${Date.now()}`,
    type: 'topup_approved' as const,
    amountSar: creditAmount,
    noteEn: `Master Admin Approved +${creditAmount} SAR to Store Ad Wallet`,
    noteAr: `اعتمدت الإدارة العليا إضافة +${creditAmount} ر.س لمحفظة إعلانات المتجر`,
    createdAt: new Date().toISOString(),
    status: 'completed' as const,
  };
  const updatedTransactions = curr.transactions.map((t) =>
    t.type === 'topup_request' && t.status === 'pending' ? { ...t, status: 'completed' as const } : t,
  );
  const next: StoreAdWalletState = {
    ...curr,
    balanceSar: curr.balanceSar + creditAmount,
    pendingTopUpSar: 0,
    pendingTopUpRequestedAt: null,
    dailySpendCapSar: newDailyCapSar ?? curr.dailySpendCapSar,
    totalDepositedSar: curr.totalDepositedSar + creditAmount,
    transactions: [tx, ...updatedTransactions],
  };
  saveStoreAdWallet(storeId, next);
  return next;
}

export function getStoreAdCampaigns(storeId: string): KsaAdCampaign[] {
  const key = `unityteck_ksa_ad_campaigns_${storeId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoreAdCampaigns(storeId: string, campaigns: KsaAdCampaign[]): void {
  const key = `unityteck_ksa_ad_campaigns_${storeId}`;
  localStorage.setItem(key, JSON.stringify(campaigns));
  emitStoreSync(storeId, 'ad_campaigns');
}

/* ============================================================================
 * 3. SOCIAL MEDIA AUTO-SCHEDULER (Per Store Isolated + 3h Cooldown Timer)
 * ========================================================================== */
export function getStoreSocialSchedule(storeId: string, storeSlug = 'store'): StoreSocialScheduleState {
  const key = `unityteck_social_schedule_${storeId}`;
  const defaults: StoreSocialScheduleState = {
    storeId,
    dailyPostLimit: 5,
    postsUsedToday: 0,
    cooldownHours: 3,
    nextAllowedPostAt: null,
    connectedAccounts: {
      instagram: { connected: true, handle: `@${storeSlug}.ksa` },
      tiktok: { connected: true, handle: `@${storeSlug}.sa` },
      snapchat: { connected: true, handle: `${storeSlug}_ksa` },
      telegram: { connected: true, handle: `t.me/${storeSlug}` },
      x: { connected: false, handle: `@${storeSlug}` },
    },
    posts: [],
  };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw), storeId };
  } catch {
    return defaults;
  }
}

export function saveStoreSocialSchedule(storeId: string, state: StoreSocialScheduleState): void {
  const key = `unityteck_social_schedule_${storeId}`;
  localStorage.setItem(key, JSON.stringify({ ...state, storeId }));
  emitStoreSync(storeId, 'social_schedule');
}

/* ============================================================================
 * 4. MASTER GTM/GA4 UMBRELLA & PER-STORE SEO DEEP AUDITOR
 * ========================================================================== */
const MASTER_TRACKING_KEY = 'unityteck_master_global_tracking_config';

export function getMasterGlobalTracking(): MasterGlobalTrackingConfig {
  const defaults: MasterGlobalTrackingConfig = {
    masterGtmId: 'GTM-KSA9901',
    masterGa4Id: 'G-UNITYKSA01',
    masterIndexingAutoEnabled: true,
    indexingTimerMinutes: 5,
    updatedAt: new Date().toISOString(),
  };
  try {
    const raw = localStorage.getItem(MASTER_TRACKING_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveMasterGlobalTracking(config: MasterGlobalTrackingConfig): void {
  localStorage.setItem(MASTER_TRACKING_KEY, JSON.stringify({ ...config, updatedAt: new Date().toISOString() }));
  emitStoreSync('master', 'global_tracking');
}

export function getStoreSeoDeepAudit(
  storeId: string,
  storeName: string,
  storeSlug: string,
  productsCount: number,
): SeoDeepAuditItem[] {
  const key = `unityteck_seo_deep_audit_${storeId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  // Zero-mock: no fabricated audit rows — empty until a real crawl/API exists
  void storeName;
  void storeSlug;
  void productsCount;
  return [];
}

export function saveStoreSeoDeepAudit(storeId: string, items: SeoDeepAuditItem[]): void {
  const key = `unityteck_seo_deep_audit_${storeId}`;
  localStorage.setItem(key, JSON.stringify(items));
  emitStoreSync(storeId, 'seo_audit');
}

/* ============================================================================
 * 5. WHATSAPP 24-HOUR PER-CLIENT COOLDOWN TIMER (Anti-Ban Protection)
 * ========================================================================== */
export function getWhatsAppClientCooldownMap(storeId: string): Record<string, number> {
  const key = `unityteck_wa_client_cooldown_${storeId}`;
  return readCachedJson<Record<string, number>>(key) || {};
}

export function checkWhatsAppClientCooldown(
  storeId: string,
  phone: string,
): { allowed: boolean; remainingMs: number; remainingFormatted: string } {
  const clean = phone.replace(/[^\d]/g, '');
  if (!clean) return { allowed: true, remainingMs: 0, remainingFormatted: '' };
  const map = getWhatsAppClientCooldownMap(storeId);
  const expiresAt = map[clean] || 0;
  const now = Date.now();
  if (expiresAt > now) {
    const diff = expiresAt - now;
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return {
      allowed: false,
      remainingMs: diff,
      remainingFormatted: `${hrs}h ${mins}m`,
    };
  }
  return { allowed: true, remainingMs: 0, remainingFormatted: '' };
}

export interface StoreWhatsAppQuotaState {
  storeId: string;
  dailyMessageLimit: number; // Default 10 free/day, Master Admin can increase
  messagesSentToday: number;
  clientCooldownHours: number; // Default 24 hours per client phone
  isProWa: boolean;
  lastResetDate: string;
}

export function getStoreWhatsAppQuota(storeId: string): StoreWhatsAppQuotaState {
  const key = `unityteck_wa_quota_state_${storeId}`;
  const defaults: StoreWhatsAppQuotaState = {
    storeId,
    dailyMessageLimit: 15,
    messagesSentToday: 0,
    clientCooldownHours: 24,
    isProWa: false,
    lastResetDate: todayStr(),
  };
  const cached = readCachedJson<Partial<StoreWhatsAppQuotaState>>(key);
  if (!cached) return defaults;
  const parsed: StoreWhatsAppQuotaState = { ...defaults, ...cached, storeId };
  if (parsed.lastResetDate !== todayStr()) {
    parsed.messagesSentToday = 0;
    parsed.lastResetDate = todayStr();
    writeCachedJson(key, parsed);
  }
  return parsed;
}

export function saveStoreWhatsAppQuota(
  storeId: string,
  state: StoreWhatsAppQuotaState,
): StoreWhatsAppQuotaState {
  const key = `unityteck_wa_quota_state_${storeId}`;
  const next = { ...state, storeId };
  writeCachedJson(key, next);
  emitStoreSync(storeId, 'wa_quota');
  return next;
}

export function resetStoreWhatsAppCooldowns(storeId: string): void {
  const key = `unityteck_wa_client_cooldown_${storeId}`;
  ksaMemoryCache.delete(key);
  localStorage.removeItem(key);
  const q = getStoreWhatsAppQuota(storeId);
  saveStoreWhatsAppQuota(storeId, { ...q, messagesSentToday: 0 });
  emitStoreSync(storeId, 'wa_cooldown');
}

export function recordWhatsAppClientSent(storeId: string, phone: string): void {
  const clean = phone.replace(/[^\d]/g, '');
  if (!clean) return;
  const q = getStoreWhatsAppQuota(storeId);
  const cooldownMs = Math.max(0, q.clientCooldownHours) * 3600 * 1000;
  const key = `unityteck_wa_client_cooldown_${storeId}`;
  const map = { ...getWhatsAppClientCooldownMap(storeId) };
  if (cooldownMs > 0) {
    map[clean] = Date.now() + cooldownMs;
  } else {
    delete map[clean];
  }
  writeCachedJson(key, map);
  saveStoreWhatsAppQuota(storeId, {
    ...q,
    messagesSentToday: q.messagesSentToday + 1,
  });
  emitStoreSync(storeId, 'wa_cooldown');
}

/* ============================================================================
 * 6. ORDER CANCELLATION POLICY & SHIPPING TRACKING CONFIG (Per Store Isolated)
 * ========================================================================== */
export function getStoreOrderPolicy(storeId: string): StoreOrderPolicyState {
  const key = `unityteck_order_policy_${storeId}`;
  const defaults: StoreOrderPolicyState = {
    storeId,
    allowCustomerCancel: true,
    cancelWindowHours: 2,
    allowedCancelStatuses: ['pending', 'processing'],
    autoEmailOnOrderSubmit: true,
    autoEmailOnOrderDone: true,
    autoDashboardBell: true,
    shippingCarrierDefault: 'SMSA Express KSA',
    estimatedDeliveryHoursKsa: 24,
  };
  const cached = readCachedJson<Partial<StoreOrderPolicyState>>(key);
  if (!cached) return defaults;
  return { ...defaults, ...cached, storeId };
}

export function saveStoreOrderPolicy(storeId: string, policy: StoreOrderPolicyState): void {
  const key = `unityteck_order_policy_${storeId}`;
  writeCachedJson(key, { ...policy, storeId });
  emitStoreSync(storeId, 'order_policy');
}

/* ============================================================================
 * 7. GAMIFIED LOYALTY COIN GAME, LOYALTY CARD & CUSTOMER LOCATION PROFILE
 * ========================================================================== */
export function getStoreLoyaltyGameSettings(storeId: string): StoreLoyaltyGameSettings {
  const key = `unityteck_loyalty_game_settings_${storeId}`;
  const defaults: StoreLoyaltyGameSettings = {
    storeId,
    gameEnabled: true,
    storefrontDockEnabled: false, // Default disabled on home page to prevent overlaps with WhatsApp/dock
    coinsPerSar: 10, // 10 Coins = 1 SAR
    minSpinCoins: 10,
    maxSpinCoins: 100,
    spinCooldownHours: 24,
    cardPaymentBonusCoins: 30,
    signupLocationBonusCoins: 50,
  };
  const cached = readCachedJson<Partial<StoreLoyaltyGameSettings>>(key);
  if (!cached) return defaults;
  return {
    ...defaults,
    ...cached,
    storeId,
    storefrontDockEnabled: cached.storefrontDockEnabled === true,
  };
}

export function saveStoreLoyaltyGameSettings(
  storeId: string,
  settings: StoreLoyaltyGameSettings,
): void {
  const key = `unityteck_loyalty_game_settings_${storeId}`;
  writeCachedJson(key, { ...settings, storeId });
  emitStoreSync(storeId, 'loyalty_game_settings');
}

export function getStoreGamifiedProfiles(storeId: string): Record<string, CustomerGamifiedProfile> {
  const key = `unityteck_gamified_profiles_${storeId}`;
  return readCachedJson<Record<string, CustomerGamifiedProfile>>(key) || {};
}

export function getOrCreateCustomerGamifiedProfile(
  storeId: string,
  customerId: string,
  fallback?: { name?: string; phone?: string; email?: string; city?: string },
): CustomerGamifiedProfile {
  const map = getStoreGamifiedProfiles(storeId);
  if (map[customerId]) return map[customerId];

  const cardSuffix = String(Math.abs(customerId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 9000 + 1000);
  const created: CustomerGamifiedProfile = {
    customerId,
    storeId,
    phone: fallback?.phone || '+966 50 000 0000',
    name: fallback?.name || 'Store Visitor',
    email: fallback?.email || '',
    locationAllowed: false,
    city: fallback?.city || 'Riyadh',
    coordinates: null,
    notificationsAllowed: false,
    loyaltyCardNumber: `KSA-${storeId.slice(-3).toUpperCase()}-${cardSuffix}`,
    loyaltyTier: 'Silver',
    coinsBalance: 0,
    totalCoinsEarned: 0,
    totalCoinsRedeemed: 0,
    lastGameSpinAt: null,
    savedCards: [
      {
        id: 'card-mada-default',
        brand: 'Mada',
        last4: '4821',
        holderName: fallback?.name || 'KSA Cardholder',
        expiry: '08/28',
        bonusCoinsPerUse: 30,
      },
    ],
    activeCoupons: [],
    cartStage: 'browsing',
    updatedAt: new Date().toISOString(),
  };
  return created;
}

export function saveCustomerGamifiedProfile(
  storeId: string,
  profile: CustomerGamifiedProfile,
): CustomerGamifiedProfile {
  const key = `unityteck_gamified_profiles_${storeId}`;
  const map = { ...getStoreGamifiedProfiles(storeId) };
  const tier: 'Silver' | 'Gold' | 'Platinum' =
    profile.totalCoinsEarned >= 1000
      ? 'Platinum'
      : profile.totalCoinsEarned >= 300
      ? 'Gold'
      : 'Silver';
  const next: CustomerGamifiedProfile = {
    ...profile,
    storeId,
    loyaltyTier: tier,
    updatedAt: new Date().toISOString(),
  };
  map[profile.customerId] = next;
  writeCachedJson(key, map);
  emitStoreSync(storeId, 'gamified_profile');
  return next;
}

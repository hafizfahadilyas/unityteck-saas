/**
 * Central Advance Features & Coming Soon Governance Service
 * Manages SaaS-wide advance functions (Google Ads, TikTok Ads, Canva Editing, Social Auto-Posting, etc.)
 * Allows Master Admin to toggle them:
 * - 'active': Fully available and operational
 * - 'coming_soon': Displayed with custom 'Coming Soon' / 'قريباً' tag title and preview modal
 * - 'hidden': Completely hidden from merchant views
 */

import { useState, useEffect } from 'react';

export type FeatureDisplayMode = 'active' | 'coming_soon' | 'hidden';

export interface AdvanceFeatureConfig {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: 'marketing' | 'media' | 'social' | 'analytics' | 'tools';
  iconName: string;
  mode: FeatureDisplayMode;
  comingSoonTagEn: string;
  comingSoonTagAr: string;
  badgeVariant?: 'amber' | 'blue' | 'purple' | 'emerald' | 'rose';
  updatedAt?: string;
}

const STORAGE_KEY = 'unityteck_advance_features_registry';
const EVENT_NAME = 'unityteck-advance-features-changed';

export const DEFAULT_ADVANCE_FEATURES: AdvanceFeatureConfig[] = [
  {
    id: 'google_ads',
    nameEn: 'Google Ads & Shopping AI',
    nameAr: 'إعلانات جوجل والتسوق الذكي',
    descriptionEn: 'Automated Google Search, Shopping, and Performance Max ad campaigns directly from your store.',
    descriptionAr: 'حملات إعلانات جوجل الذكية وشبكة البحث والتسوق وإعلانات الأداء الأقصى مباشرة من المتجر.',
    category: 'marketing',
    iconName: 'Globe',
    mode: 'coming_soon',
    comingSoonTagEn: 'Coming Soon',
    comingSoonTagAr: 'قريباً',
    badgeVariant: 'blue',
  },
  {
    id: 'tiktok_ads',
    nameEn: 'TikTok Ads & Pixel Engine',
    nameAr: 'إعلانات تيك توك والبكسل الذكي',
    descriptionEn: 'TikTok dynamic catalog ads, pixel conversion tracking, and viral video promotions.',
    descriptionAr: 'إعلانات كتالوج تيك توك الديناميكية، تتبع تحويلات البكسل، والترويج الفيروسي للفيديوهات.',
    category: 'marketing',
    iconName: 'Sparkles',
    mode: 'coming_soon',
    comingSoonTagEn: 'Coming Soon',
    comingSoonTagAr: 'قريباً',
    badgeVariant: 'purple',
  },
  {
    id: 'canva_editing',
    nameEn: 'Canva AI Graphic Studio & Editor',
    nameAr: 'محرر كانفا واستوديو التصميم الذكي',
    descriptionEn: 'Integrated Canva image editor, AI background remover, and banner designer inside Media and Products.',
    descriptionAr: 'محرر صور كانفا المتكامل، ميزة إزالة الخلفيات بالذكاء الاصطناعي، وتصميم البنرات داخل الوسائط والمنتجات.',
    category: 'media',
    iconName: 'Palette',
    mode: 'coming_soon',
    comingSoonTagEn: 'Coming Soon',
    comingSoonTagAr: 'قريباً',
    badgeVariant: 'emerald',
  },
  {
    id: 'social_auto_posting',
    nameEn: 'Social Media Automatic Posting',
    nameAr: 'النشر التلقائي على منصات التواصل',
    descriptionEn: 'Automated daily AI-scheduled posts to Instagram, TikTok, Snapchat, X, and Telegram channels.',
    descriptionAr: 'جدولة ونشر تلقائي بالذكاء الاصطناعي للمنتجات والعروض على إنستغرام، تيك توك، سناب شات، إكس، وتيليجرام.',
    category: 'social',
    iconName: 'Share2',
    mode: 'coming_soon',
    comingSoonTagEn: 'Coming Soon',
    comingSoonTagAr: 'قريباً',
    badgeVariant: 'amber',
  },
  {
    id: 'snapchat_ads',
    nameEn: 'Snapchat Ads Manager KSA',
    nameAr: 'مدير إعلانات سناب شات السعودية',
    descriptionEn: 'Targeted KSA swipe-up ads, AR shopping lenses, and local geo-fenced promotions.',
    descriptionAr: 'إعلانات سناب شات الموجهة للمدن السعودية، عدسات الواقع المعزز للتسوق، والحملات الجغرافية.',
    category: 'marketing',
    iconName: 'Megaphone',
    mode: 'coming_soon',
    comingSoonTagEn: 'Coming Soon',
    comingSoonTagAr: 'قريباً',
    badgeVariant: 'amber',
  },
];

let cachedRegistry: AdvanceFeatureConfig[] | null = null;

function invalidateCache() {
  cachedRegistry = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      invalidateCache();
    }
  });
}

/**
 * Retrieve current advance features registry with fallbacks to defaults
 */
export function getAdvanceFeatures(): AdvanceFeatureConfig[] {
  if (typeof window === 'undefined') return DEFAULT_ADVANCE_FEATURES;
  if (cachedRegistry) return cachedRegistry;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedRegistry = [...DEFAULT_ADVANCE_FEATURES];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ADVANCE_FEATURES));
      return cachedRegistry;
    }

    const parsed: AdvanceFeatureConfig[] = JSON.parse(raw);
    // Merge missing defaults if any new feature was added
    const ids = new Set(parsed.map((item) => item.id));
    const merged = [...parsed];
    for (const def of DEFAULT_ADVANCE_FEATURES) {
      if (!ids.has(def.id)) {
        merged.push(def);
      }
    }
    cachedRegistry = merged;
    return merged;
  } catch (err) {
    console.error('Failed reading advance features registry:', err);
    return DEFAULT_ADVANCE_FEATURES;
  }
}

/**
 * Save complete advance features registry
 */
export function saveAdvanceFeatures(list: AdvanceFeatureConfig[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    invalidateCache();
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { features: list } }));
  } catch (err) {
    console.error('Failed saving advance features registry:', err);
  }
}

/**
 * Get single advance feature by ID
 */
export function getAdvanceFeature(id: string): AdvanceFeatureConfig | undefined {
  const all = getAdvanceFeatures();
  return all.find((f) => f.id === id);
}

/**
 * Check if a feature is hidden
 */
export function isAdvanceFeatureHidden(id: string): boolean {
  const feat = getAdvanceFeature(id);
  return feat ? feat.mode === 'hidden' : false;
}

/**
 * Check if a feature is marked Coming Soon
 */
export function isAdvanceFeatureComingSoon(id: string): boolean {
  const feat = getAdvanceFeature(id);
  return feat ? feat.mode === 'coming_soon' : false;
}

/**
 * Check if a feature is active
 */
export function isAdvanceFeatureActive(id: string): boolean {
  const feat = getAdvanceFeature(id);
  return feat ? feat.mode === 'active' : true;
}

/**
 * Update partial properties of an advance feature
 */
export function updateAdvanceFeature(id: string, updates: Partial<AdvanceFeatureConfig>) {
  const list = getAdvanceFeatures();
  const next = list.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });
  saveAdvanceFeatures(next);
}

/**
 * Set mode of an advance feature directly
 */
export function setAdvanceFeatureMode(id: string, mode: FeatureDisplayMode) {
  updateAdvanceFeature(id, { mode });
}

/**
 * Add or upsert a new advance feature
 */
export function addAdvanceFeature(feature: AdvanceFeatureConfig) {
  const list = getAdvanceFeatures();
  const exists = list.some((f) => f.id === feature.id);
  let next: AdvanceFeatureConfig[];
  if (exists) {
    next = list.map((f) => (f.id === feature.id ? { ...feature, updatedAt: new Date().toISOString() } : f));
  } else {
    next = [...list, { ...feature, updatedAt: new Date().toISOString() }];
  }
  saveAdvanceFeatures(next);
}

/**
 * Delete a custom advance feature
 */
export function deleteAdvanceFeature(id: string) {
  const list = getAdvanceFeatures();
  const next = list.filter((f) => f.id !== id);
  saveAdvanceFeatures(next);
}

/**
 * Reset all advance features to factory defaults
 */
export function resetAdvanceFeaturesToDefaults(): AdvanceFeatureConfig[] {
  saveAdvanceFeatures(DEFAULT_ADVANCE_FEATURES);
  return DEFAULT_ADVANCE_FEATURES;
}

/**
 * React Hook for reactive subscription to advance features in any component
 */
export function useAdvanceFeatures() {
  const [features, setFeatures] = useState<AdvanceFeatureConfig[]>(() => getAdvanceFeatures());

  useEffect(() => {
    const handleUpdate = () => {
      setFeatures(getAdvanceFeatures());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const getFeature = (id: string) => features.find((f) => f.id === id);
  const isHidden = (id: string) => {
    const f = features.find((item) => item.id === id);
    return f ? f.mode === 'hidden' : false;
  };
  const isComingSoon = (id: string) => {
    const f = features.find((item) => item.id === id);
    return f ? f.mode === 'coming_soon' : false;
  };
  const isActive = (id: string) => {
    const f = features.find((item) => item.id === id);
    return f ? f.mode === 'active' : true;
  };

  return {
    features,
    getFeature,
    isHidden,
    isComingSoon,
    isActive,
    updateFeature: updateAdvanceFeature,
    setFeatureMode: setAdvanceFeatureMode,
    addFeature: addAdvanceFeature,
    deleteFeature: deleteAdvanceFeature,
    resetToDefaults: resetAdvanceFeaturesToDefaults,
  };
}

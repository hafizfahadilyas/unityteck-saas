/**
 * @file thresholdManager.ts
 * Manages merchant-configurable operational thresholds and integration connections.
 */

import { MerchantThresholds } from '../types/notification.types';

const STORAGE_KEY = 'souq_dashboard_merchant_thresholds';

export const DEFAULT_THRESHOLDS: MerchantThresholds = {
  lowStockThreshold: 5,
  abandonedCartWaitMinutes: 30,
  cartAbandonmentRateAlert: 70,
  cancellationRateAlert: 15,
  highTrafficLowSalesConversionThreshold: 1.0,
  googleAdsTargetCpa: 25.0,
  overdueOrdersHours: 24,
  staleDataThresholdMinutes: 60,

  // Integrations defaults
  isWhatsappConnected: true,
  isMetaConnected: true,
  isGoogleAdsConnected: true,
  isTiktokConnected: true,
  isSnapchatConnected: true,
  isXConnected: false,
  isPinterestConnected: false,
  isYoutubeConnected: true,
};

export class ThresholdManager {
  private static instance: ThresholdManager;
  private thresholds: MerchantThresholds;

  private constructor() {
    this.thresholds = this.loadThresholds();
  }

  public static getInstance(): ThresholdManager {
    if (!ThresholdManager.instance) {
      ThresholdManager.instance = new ThresholdManager();
    }
    return ThresholdManager.instance;
  }

  private loadThresholds(): MerchantThresholds {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return { ...DEFAULT_THRESHOLDS, ...JSON.parse(stored) };
        }
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_THRESHOLDS };
  }

  public getThresholds(): MerchantThresholds {
    return { ...this.thresholds };
  }

  public updateThresholds(partial: Partial<MerchantThresholds>): MerchantThresholds {
    this.thresholds = { ...this.thresholds, ...partial };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.thresholds));
        window.dispatchEvent(new CustomEvent('souq:thresholds_updated', { detail: this.thresholds }));
      }
    } catch (e) {
      console.warn('Failed to save merchant thresholds to localStorage', e);
    }
    return { ...this.thresholds };
  }
}

export const thresholdManager = ThresholdManager.getInstance();

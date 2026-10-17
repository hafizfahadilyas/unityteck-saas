/**
 * @file whatsappService.ts
 * WhatsApp integration service with strict marketing consent & phone validation guards.
 */

import { CustomerVerificationData } from '../types/notification.types';
import { thresholdManager } from './thresholdManager';

export interface WhatsAppMessagePayload {
  phoneNumber?: string;
  customerName?: string;
  orderNumber?: string;
  amount?: number;
  discountCode?: string;
  productName?: string;
  checkoutUrl?: string;
  template?: string;
  templateAr?: string;
  customMessage?: string;
}

export class WhatsAppService {
  /**
   * Normalizes Saudi and international phone numbers into E.164 without plus or dashes
   * e.g. "0551234567" -> "966551234567"
   * e.g. "+966 50 123 4567" -> "966501234567"
   */
  public static normalizePhoneNumber(phone?: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('05') && cleaned.length === 10) {
      cleaned = '966' + cleaned.slice(1);
    } else if (cleaned.startsWith('5') && cleaned.length === 9) {
      cleaned = '966' + cleaned;
    }
    return cleaned;
  }

  /**
   * Validates if a phone string is a legitimate Saudi mobile number (9 digits starting with 5)
   */
  public static isValidSaudiPhone(phone?: string): boolean {
    const normalized = this.normalizePhoneNumber(phone);
    // 966 followed by 5 and 8 digits (total 12 digits)
    return /^9665[0-9]{8}$/.test(normalized);
  }

  /**
   * STRICT RULE 1: WhatsApp Button Visibility Guard
   * Must meet ALL 4 conditions:
   * 1. customer.is_identifiable === true
   * 2. customer.phone exists and is validated
   * 3. customer.marketing_opt_in === true
   * 4. WhatsApp Business integration is connected
   */
  public static canSendWhatsApp(customer?: CustomerVerificationData): boolean {
    if (!customer) return false;

    // Check integration status
    const thresholds = thresholdManager.getThresholds();
    if (!thresholds.isWhatsappConnected) return false;

    // Check customer identity
    if (!customer.is_identifiable) return false;

    // Check marketing consent
    if (!customer.marketing_opt_in) return false;

    // Check validated phone number
    if (!customer.phone || !customer.is_phone_validated) return false;

    return this.isValidSaudiPhone(customer.phone);
  }

  /**
   * Interpolates template placeholders
   */
  public static formatMessage(
    template: string,
    params: Record<string, string | number | undefined>,
  ): string {
    let result = template;
    for (const [key, val] of Object.entries(params)) {
      const token = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(token, String(val ?? ''));
    }
    return result;
  }

  /**
   * Builds the official WhatsApp click-to-chat URL
   */
  public static buildWhatsAppUrl(payload: WhatsAppMessagePayload, isAr: boolean = false): string {
    const normalizedPhone = this.normalizePhoneNumber(payload.phoneNumber || '966500000000');
    let messageText = payload.customMessage;

    if (!messageText) {
      const template = isAr
        ? (payload.templateAr || payload.template || 'مرحباً {customerName}، يسعدنا تواصلك معنا بخصوص متجر هدايا مكة.')
        : (payload.template || 'Hello {customerName}, thank you for shopping with us.');

      messageText = this.formatMessage(template, {
        customerName: payload.customerName || (isAr ? 'عميلنا العزيز' : 'Valued Customer'),
        orderNumber: payload.orderNumber || '',
        amount: payload.amount !== undefined ? `${payload.amount} SAR` : '',
        discountCode: payload.discountCode || 'GIFT10',
        productName: payload.productName || '',
        checkoutUrl: payload.checkoutUrl || 'https://giftshop-sa.com/checkout',
      });
    }

    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageText)}`;
  }

  /**
   * Dispatches WhatsApp click-to-chat in a secure new tab
   */
  public static openWhatsApp(payload: WhatsAppMessagePayload, isAr: boolean = false): boolean {
    const url = this.buildWhatsAppUrl(payload, isAr);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }
    return false;
  }
}

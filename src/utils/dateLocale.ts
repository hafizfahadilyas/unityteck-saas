import type { AppLocale } from '../i18n/dict';

const MONTH_NAMES_AR: Record<string, string> = {
  Jan: 'يناير', January: 'يناير',
  Feb: 'فبراير', February: 'فبراير',
  Mar: 'مارس', March: 'مارس',
  Apr: 'أبريل', April: 'أبريل',
  May: 'مايو',
  Jun: 'يونيو', June: 'يونيو',
  Jul: 'يوليو', July: 'يوليو',
  Aug: 'أغسطس', August: 'أغسطس',
  Sep: 'سبتمبر', September: 'سبتمبر',
  Oct: 'أكتوبر', October: 'أكتوبر',
  Nov: 'نوفمبر', November: 'نوفمبر',
  Dec: 'ديسمبر', December: 'ديسمبر',
};

/**
 * Localizes dates and timestamps like "Jan 2023", "Jan 31, 2024 at 02:34 PM" into Arabic when locale is 'ar'.
 */
export function formatDisplayDate(dateStr: string, locale: AppLocale): string {
  if (!dateStr) return '';
  if (locale !== 'ar') return dateStr;

  let result = dateStr;
  for (const [enMonth, localized] of Object.entries(MONTH_NAMES_AR)) {
    const regex = new RegExp(`\\b${enMonth}\\b`, 'g');
    result = result.replace(regex, localized);
  }

  result = result.replace(/\bat\b/g, 'في');
  result = result.replace(/\bAM\b/g, 'ص');
  result = result.replace(/\bPM\b/g, 'م');

  return result;
}

export function formatDisplayTime(timeStr: string, locale: AppLocale): string {
  if (!timeStr) return '';
  if (locale === 'ar') {
    return timeStr.replace(/\bAM\b/g, 'ص').replace(/\bPM\b/g, 'م');
  }
  return timeStr;
}

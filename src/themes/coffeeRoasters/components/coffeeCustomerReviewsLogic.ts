/** Pure Customer Reviews helpers — node-test safe (rows from API, not theme seed). */

import type { CustomerReviewsSettings } from '../../settings/coffeeModularSettings';

export type ReviewsPreviewDevice = 'desktop' | 'tablet' | 'mobile';
export type ReviewsTab = 'all' | 'photos';

export type ReviewLike = {
  id: string;
  rating?: number;
  active?: boolean;
  comment?: string;
  commentAr?: string;
  author?: string;
  photos?: string[] | null;
  images?: string[] | null;
};

export function reviewsShowsOnDevice(
  settings: CustomerReviewsSettings | null | undefined,
  device: ReviewsPreviewDevice,
): boolean {
  if (!settings || settings.enabled === false) return false;
  if (device === 'desktop') return settings.showOnDesktop !== false;
  if (device === 'tablet') return settings.showOnTablet !== false;
  return settings.showOnMobile !== false;
}

/** Public list: only active/approved rows. */
export function approvedReviews<T extends ReviewLike>(rows: T[] | null | undefined): T[] {
  return (rows || []).filter((r) => r.active !== false);
}

export function reviewHasPhotos(row: ReviewLike): boolean {
  const photos = row.photos || row.images || [];
  return Array.isArray(photos) && photos.some((p) => Boolean((p || '').trim()));
}

export function filterReviewsByTab<T extends ReviewLike>(rows: T[], tab: ReviewsTab): T[] {
  if (tab === 'photos') return rows.filter(reviewHasPhotos);
  return rows;
}

export function averageRating(rows: ReviewLike[]): number {
  const list = approvedReviews(rows);
  if (!list.length) return 0;
  const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return Math.round((sum / list.length) * 10) / 10;
}

export function starDistribution(rows: ReviewLike[]): Record<1 | 2 | 3 | 4 | 5, number> {
  const list = approvedReviews(rows);
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of list) {
    const n = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0))) as 1 | 2 | 3 | 4 | 5;
    counts[n] += 1;
  }
  return counts;
}

export function starPercent(count: number, total: number): number {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export function clampCharacterLimit(n: number | null | undefined): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 50) return 500;
  return Math.min(2000, Math.floor(v));
}

export function clampPhotoLimit(n: number | null | undefined): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 5;
  return Math.min(10, Math.floor(v));
}

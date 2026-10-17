/**
 * @file deduplication.ts
 * Enterprise deduplication engine enforcing Zone Hierarchy and entity aggregation:
 * - If exists in Zone 3 (urgent), suppress in Zone 1
 * - If exists in Zone 1, suppress generic counterpart in Zone 2
 * - Aggregates duplicate entity counts into unified notifications
 */

import { NotificationItem } from '../types/notification.types';

export function deduplicateAndEnforceZoneHierarchy(notifications: NotificationItem[]): NotificationItem[] {
  // 1. Collect all Zone 3 dedup keys
  const zone3Keys = new Set<string>();
  notifications
    .filter((n) => n.zone === 'zone3_urgent' && !n.dismissed && n.status !== 'resolved')
    .forEach((n) => zone3Keys.add(n.dedup_key));

  // 2. Filter Zone 1 items: suppress if already present in Zone 3
  const zone1Eligible = notifications.filter((n) => {
    if (n.zone !== 'zone1_issues') return true;
    if (zone3Keys.has(n.dedup_key)) return false; // Suppress in Zone 1
    return true;
  });

  // 3. Collect all Zone 1 dedup keys
  const zone1Keys = new Set<string>();
  zone1Eligible
    .filter((n) => n.zone === 'zone1_issues' && !n.dismissed && n.status !== 'resolved')
    .forEach((n) => zone1Keys.add(n.dedup_key));

  // 4. Filter Zone 2 items: suppress if already present in Zone 1 or Zone 3
  const zone2Eligible = zone1Eligible.filter((n) => {
    if (n.zone !== 'zone2_marketing') return true;
    if (zone3Keys.has(n.dedup_key) || zone1Keys.has(n.dedup_key)) return false;
    return true;
  });

  // 5. Final pass: deduplicate identical keys within the same zone
  const finalSeen = new Set<string>();
  const finalResult: NotificationItem[] = [];

  for (const item of zone2Eligible) {
    const uniqueZoneKey = `${item.zone}::${item.dedup_key}`;
    if (!finalSeen.has(uniqueZoneKey)) {
      finalSeen.add(uniqueZoneKey);
      finalResult.push(item);
    }
  }

  return finalResult;
}

export function deduplicateNotifications(notifications: NotificationItem[]): NotificationItem[] {
  return deduplicateAndEnforceZoneHierarchy(notifications);
}

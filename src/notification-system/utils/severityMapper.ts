import { NotificationSeverity } from '../types/notification.types';

export const SEVERITY_WEIGHT: Record<NotificationSeverity, number> = {
  critical: 4,
  warning: 3,
  opportunity: 2,
  info: 1,
};

export function getSeverityRank(severity: NotificationSeverity): number {
  return SEVERITY_WEIGHT[severity] || 0;
}

export function sortNotificationsBySeverityAndDate(
  a: { severity: NotificationSeverity; timestamp: string },
  b: { severity: NotificationSeverity; timestamp: string },
): number {
  const diffWeight = getSeverityRank(b.severity) - getSeverityRank(a.severity);
  if (diffWeight !== 0) return diffWeight;
  const timeA = new Date(a.timestamp).getTime() || 0;
  const timeB = new Date(b.timestamp).getTime() || 0;
  return timeB - timeA;
}

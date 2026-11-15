export type SaleCountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

/** Live countdown until discount end (dashboard Discount End). Returns null when no valid future end. */
export function saleCountdownParts(endIso: string | null | undefined, nowMs = Date.now()): SaleCountdownParts | null {
  if (!endIso || !String(endIso).trim()) return null;
  const end = Date.parse(String(endIso));
  if (Number.isNaN(end) || end <= nowMs) return null;
  let diff = Math.floor((end - nowMs) / 1000);
  const days = Math.floor(diff / 86400);
  diff %= 86400;
  const hours = Math.floor(diff / 3600);
  diff %= 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  return { days, hours, minutes, seconds };
}

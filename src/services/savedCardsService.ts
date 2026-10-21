/**
 * PCI-safe saved cards: only masked metadata (brand, last4, expiry, holder).
 * Full PAN and CVV are NEVER stored. Isolated per store_id + customer key.
 */
export interface SavedCard {
  id: string;
  brand: 'mada' | 'visa' | 'mastercard' | 'card';
  last4: string;
  expiry: string;
  holder: string;
  addedAt: string;
}

const key = (storeId: string, customer: string) =>
  `unityteck_saved_cards_${storeId}_${customer.toLowerCase()}`;

export function detectBrand(pan: string): SavedCard['brand'] {
  const n = pan.replace(/\s+/g, '');
  if (n.startsWith('5888') || n.startsWith('4406') || n.startsWith('4557') || n.startsWith('4108')) return 'mada';
  if (n.startsWith('4')) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
  return 'card';
}

export function maskCard(c: Pick<SavedCard, 'last4'>): string {
  return `•••• •••• •••• ${c.last4}`;
}

export function loadSavedCards(storeId: string, customer: string): SavedCard[] {
  if (!customer) return [];
  try {
    const raw = localStorage.getItem(key(storeId, customer));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCard(
  storeId: string,
  customer: string,
  input: { pan: string; expiry: string; holder: string },
): SavedCard | null {
  const digits = input.pan.replace(/\D/g, '');
  if (!customer || digits.length < 12 || !input.expiry) return null;
  const card: SavedCard = {
    id: `card-${Date.now()}`,
    brand: detectBrand(digits),
    last4: digits.slice(-4),
    expiry: input.expiry,
    holder: input.holder,
    addedAt: new Date().toISOString(),
  };
  const existing = loadSavedCards(storeId, customer).filter(
    (c) => !(c.last4 === card.last4 && c.expiry === card.expiry),
  );
  try {
    localStorage.setItem(key(storeId, customer), JSON.stringify([card, ...existing]));
    window.dispatchEvent(new Event('unityteck-saved-cards-updated'));
  } catch {
    return null;
  }
  return card;
}

export function removeSavedCard(storeId: string, customer: string, id: string): void {
  try {
    const next = loadSavedCards(storeId, customer).filter((c) => c.id !== id);
    localStorage.setItem(key(storeId, customer), JSON.stringify(next));
    window.dispatchEvent(new Event('unityteck-saved-cards-updated'));
  } catch {
    /* ignore */
  }
}

/**
 * Storefront customer session — CRM profile + order history gate.
 * Guest may browse/cart; checkout & profile require login (store-scoped).
 */

export type SfCustomerSession = {
  storeId: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  loggedInAt: string;
};

const key = (storeId: string) => `unityteck_sf_customer_${storeId}`;

export function readSfCustomer(storeId: string): SfCustomerSession | null {
  try {
    const raw = localStorage.getItem(key(storeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SfCustomerSession;
    if (parsed?.storeId !== storeId || !parsed.customerId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSfCustomer(session: SfCustomerSession): void {
  localStorage.setItem(key(session.storeId), JSON.stringify(session));
}

export function clearSfCustomer(storeId: string): void {
  localStorage.removeItem(key(storeId));
}

import { getApiBase } from '../api/client';
import { writeSfCustomer } from '../themes/flowersPremium/sfCustomerSession';

export type StorefrontCustomerInput = {
  storeId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  source: 'google' | 'email';
};

export type SavedStorefrontCustomer = StorefrontCustomerInput & {
  id: string;
};

const PENDING_KEY = 'unityteck_sf_customer_pending';

type ClerkFactor = { strategy?: string; emailAddressId?: string };

type SignInLike = {
  create: (params: { identifier: string }) => Promise<{ supportedFirstFactors?: ClerkFactor[] | null }>;
  prepareFirstFactor: (params: { strategy: 'email_code'; emailAddressId: string }) => Promise<unknown>;
  attemptFirstFactor: (params: { strategy: 'email_code'; code: string }) => Promise<{ status?: string | null; createdSessionId?: string | null }>;
  authenticateWithRedirect: (params: {
    strategy: 'oauth_google';
    redirectUrl: string;
    redirectUrlComplete: string;
  }) => Promise<void>;
};

type SignUpLike = {
  create: (params: { emailAddress: string }) => Promise<unknown>;
  prepareEmailAddressVerification: (params: { strategy: 'email_code' }) => Promise<unknown>;
  attemptEmailAddressVerification: (params: { code: string }) => Promise<{ status?: string | null; createdSessionId?: string | null }>;
};

export function rememberPendingCustomer(input: StorefrontCustomerInput): void {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(input));
}

export function readPendingCustomer(): StorefrontCustomerInput | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorefrontCustomerInput;
    if (!parsed?.storeId) return null;
    if (parsed.source !== 'google' && !parsed.email) return null;
    return {
      storeId: parsed.storeId,
      name: parsed.name || '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      city: parsed.city || '',
      source: parsed.source === 'google' ? 'google' : 'email',
    };
  } catch {
    return null;
  }
}

export function clearPendingCustomer(): void {
  sessionStorage.removeItem(PENDING_KEY);
}

export async function saveStorefrontCustomer(input: StorefrontCustomerInput): Promise<SavedStorefrontCustomer> {
  const res = await fetch(`${getApiBase()}/storefront/customers`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Store-Id': input.storeId,
    },
    body: JSON.stringify({
      store_id: input.storeId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      city: input.city.trim(),
      source: input.source,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof body?.message === 'string' ? body.message : 'Could not save the customer.';
    throw new Error(message);
  }
  const row = body?.data || {};
  const saved: SavedStorefrontCustomer = {
    id: String(row.id || ''),
    storeId: String(row.store_id || input.storeId),
    name: String(row.name || input.name),
    email: String(row.email || input.email).toLowerCase(),
    phone: String(row.phone || input.phone),
    city: String(row.city || input.city),
    source: input.source,
  };
  applyLocalCustomerSession(saved);
  window.dispatchEvent(new CustomEvent('unityteck-customers-updated', { detail: { storeId: saved.storeId } }));
  window.dispatchEvent(new CustomEvent('unityteck-sf-customer-ready', { detail: saved }));
  return saved;
}

/** Google or email sign-in before checkout. Name, phone, and city stay empty until the order. */
export function establishStorefrontSession(input: StorefrontCustomerInput): SavedStorefrontCustomer {
  const saved: SavedStorefrontCustomer = {
    id: '',
    storeId: input.storeId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    source: input.source,
  };
  applyLocalCustomerSession(saved);
  window.dispatchEvent(new CustomEvent('unityteck-sf-customer-ready', { detail: saved }));
  return saved;
}

export function applyLocalCustomerSession(saved: SavedStorefrontCustomer): void {
  const when = new Date().toISOString();
  writeSfCustomer({
    storeId: saved.storeId,
    customerId: saved.id || `sf-${saved.email}`,
    name: saved.name,
    email: saved.email,
    phone: saved.phone,
    loggedInAt: when,
  });

  if (saved.storeId === 'store-coffee') {
    try {
      const prev = JSON.parse(localStorage.getItem('unityteck_coffee_customer') || '{}');
      localStorage.setItem(
        'unityteck_coffee_customer',
        JSON.stringify({
          ...prev,
          isLoggedIn: true,
          name: saved.name,
          email: saved.email,
          phone: saved.phone,
          city: saved.city,
          points: prev.points || 0,
          orders: Array.isArray(prev.orders) ? prev.orders : [],
        }),
      );
    } catch {
      /* ignore */
    }
  }

  if (saved.storeId === 'store-1') {
    localStorage.setItem(
      'mecca_gifts_customer_user',
      JSON.stringify({
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        city: saved.city,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(saved.name)}&background=102a1c&color=e6ca98&size=128`,
        isLoggedIn: true,
      }),
    );
  }

  if (saved.storeId === 'store-bleco') {
    localStorage.setItem(
      `unityteck_transport_customer_${saved.storeId}`,
      JSON.stringify({
        storeId: saved.storeId,
        id: saved.id,
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        city: saved.city,
        loggedInAt: when,
      }),
    );
  }
}

export function storefrontReturnPath(page: string): { handshake: string; complete: string } {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  url.searchParams.delete('clerk_oauth');
  const complete = `${url.pathname}${url.search}`;
  url.searchParams.set('clerk_oauth', '1');
  return { complete, handshake: `${url.pathname}${url.search}` };
}

export async function startClerkGoogle(signIn: SignInLike, page: string): Promise<void> {
  const paths = storefrontReturnPath(page);
  await signIn.authenticateWithRedirect({
    strategy: 'oauth_google',
    redirectUrl: paths.handshake,
    redirectUrlComplete: paths.complete,
  });
}

export async function sendClerkEmailCode(
  signIn: SignInLike,
  signUp: SignUpLike,
  email: string,
): Promise<'signIn' | 'signUp'> {
  try {
    const created = await signIn.create({ identifier: email.trim().toLowerCase() });
    const factor = created.supportedFirstFactors?.find((item) => item.strategy === 'email_code');
    if (!factor?.emailAddressId) throw new Error('EMAIL_CODE_UNAVAILABLE');
    await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
    return 'signIn';
  } catch {
    await signUp.create({ emailAddress: email.trim().toLowerCase() });
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    return 'signUp';
  }
}

export async function verifyClerkEmailCode(
  mode: 'signIn' | 'signUp',
  code: string,
  signIn: SignInLike,
  signUp: SignUpLike,
  setSignInActive: (params: { session: string }) => Promise<void>,
  setSignUpActive: (params: { session: string }) => Promise<void>,
): Promise<void> {
  if (mode === 'signIn') {
    const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
    if (result.status === 'complete' && result.createdSessionId) {
      await setSignInActive({ session: result.createdSessionId });
      return;
    }
    throw new Error('INCOMPLETE');
  }
  const result = await signUp.attemptEmailAddressVerification({ code });
  if (result.status === 'complete' && result.createdSessionId) {
    await setSignUpActive({ session: result.createdSessionId });
    return;
  }
  throw new Error('INCOMPLETE');
}

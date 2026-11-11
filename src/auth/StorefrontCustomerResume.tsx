import { useEffect, useRef } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { clearPendingCustomer, establishStorefrontSession, readPendingCustomer, saveStorefrontCustomer } from './storefrontCustomer';

/** After Google returns, write the real customer for that store and keep the local session. */
export function StorefrontCustomerResume() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !isSignedIn || !user) return;
    const pending = readPendingCustomer();
    if (!pending || pending.source !== 'google') return;
    const email = user.primaryEmailAddress?.emailAddress || pending.email;
    if (!email) return;
    started.current = true;
    const name = user.fullName || user.firstName || pending.name || '';
    void (async () => {
      try {
        const phoneDigits = (pending.phone || '').replace(/\D/g, '');
        const hasDeliveryContact = phoneDigits.length >= 8 && pending.city.trim().length > 0;
        if (hasDeliveryContact) {
          await saveStorefrontCustomer({
            ...pending,
            name,
            email,
            source: 'google',
          });
        } else {
          establishStorefrontSession({
            storeId: pending.storeId,
            name,
            email,
            phone: '',
            city: '',
            source: 'google',
          });
        }
        clearPendingCustomer();
      } catch (err) {
        sessionStorage.setItem(
          'unityteck_sf_customer_error',
          err instanceof Error ? err.message : 'Could not save the customer.',
        );
      }
      // Stay in SPA — redirectUrl hard-nav can yank /admin login to storefront.
      try {
        await signOut({ redirectUrl: undefined });
      } catch {
        /* local session is already stored */
      }
    })();
  }, [isSignedIn, user, signOut]);

  return null;
}

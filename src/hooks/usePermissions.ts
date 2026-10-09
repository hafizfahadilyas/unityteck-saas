import { useCallback, useEffect, useState } from 'react';
import { canAbility } from '../auth/roles';
import {
  moduleWriteAbility,
  tabReadAbility,
} from '../auth/modules';
import { readAuthSession, type AuthSession } from '../auth/session';

/**
 * Phase 2.4 — soft permission hints from session.abilities.
 * Server still enforces; this only gates UI.
 */
export function usePermissions() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    readAuthSession(),
  );

  useEffect(() => {
    const sync = () => setSession(readAuthSession());
    window.addEventListener('unityteck-auth', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('unityteck-auth', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const role = session?.user?.role;
  const abilities = session?.abilities;
  const portal = session?.portal ?? 'store';

  const can = useCallback(
    (ability: string) => canAbility(abilities, ability, role),
    [abilities, role],
  );

  const canTab = useCallback(
    (tabId: string, forPortal: 'master' | 'store' = portal) => {
      const need = tabReadAbility(forPortal, tabId);
      if (need === null) return true;
      return canAbility(abilities, need, role);
    },
    [abilities, role, portal],
  );

  const canWrite = useCallback(
    (module: string) => {
      const need = moduleWriteAbility(module);
      if (!need) return false;
      return canAbility(abilities, need, role);
    },
    [abilities, role],
  );

  const firstAllowedTab = useCallback(
    (tabIds: string[], forPortal: 'master' | 'store' = portal) => {
      for (const id of tabIds) {
        const need = tabReadAbility(forPortal, id);
        if (need === null || canAbility(abilities, need, role)) return id;
      }
      return tabIds[0] ?? 'dashboard';
    },
    [abilities, role, portal],
  );

  return {
    session,
    role,
    abilities,
    portal,
    can,
    canTab,
    canWrite,
    firstAllowedTab,
  };
}

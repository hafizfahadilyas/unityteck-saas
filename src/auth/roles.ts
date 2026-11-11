/**
 * Phase 2.3 — SPA mirror of App\Support\Roles (hide UI ≠ security; API enforces).
 */

export type RoleSlug =
  | 'super_admin'
  | 'partner'
  | 'admin'
  | 'manager'
  | 'support'
  | 'sales'
  | 'marketing'
  | 'seo'
  | 'content'
  | 'developer'
  | 'viewer';

type RoleMeta = { label: string; portal: 'master' | 'store'; level: number };

const CATALOG: Record<RoleSlug, RoleMeta> = {
  super_admin: { label: 'Super Admin (Owner)', portal: 'master', level: 100 },
  partner: { label: 'Partner / Sub-Admin', portal: 'master', level: 95 },
  admin: { label: 'Admin', portal: 'store', level: 90 },
  manager: { label: 'Manager', portal: 'store', level: 80 },
  developer: { label: 'Developer', portal: 'store', level: 70 },
  seo: { label: 'SEO', portal: 'store', level: 60 },
  marketing: { label: 'Marketing', portal: 'store', level: 55 },
  content: { label: 'Content', portal: 'store', level: 50 },
  sales: { label: 'Sales', portal: 'store', level: 45 },
  support: { label: 'Support', portal: 'store', level: 40 },
  viewer: { label: 'Viewer', portal: 'store', level: 10 },
};

export function normalizeRole(role?: string | null): RoleSlug {
  const r = String(role ?? '')
    .trim()
    .toLowerCase();
  switch (r) {
    case 'master_admin':
    case 'superadmin':
    case 'super_admin':
      return 'super_admin';
    case 'partner':
    case 'sub_admin':
    case 'subadmin':
    case 'partner_admin':
      return 'partner';
    case 'store_manager':
    case 'manager':
      return 'manager';
    case 'store_admin':
    case 'admin':
    case 'store_owner':
    case 'owner':
    case 'storeowner':
      // Merchant primary login = full store admin (UI label stays "Store Owner")
      return 'admin';
    case 'store_staff':
    case 'support':
      return 'support';
    case 'store_viewer':
    case 'viewer':
      return 'viewer';
    case 'sales':
    case 'marketing':
    case 'seo':
    case 'content':
    case 'developer':
      return r;
    case 'dev':
      return 'developer';
    default:
      return 'viewer';
  }
}

export function roleLabel(role?: string | null): string {
  return CATALOG[normalizeRole(role)].label;
}

export function roleLevel(role?: string | null): number {
  return CATALOG[normalizeRole(role)].level;
}

/** Default abilities when API does not return them (mock mode). */
export function abilitiesFor(role?: string | null): string[] {
  const n = normalizeRole(role);
  const allStore = [
    'products.read',
    'products.write',
    'orders.read',
    'orders.write',
    'customers.read',
    'customers.write',
    'coupons.read',
    'coupons.write',
    'shipping.read',
    'shipping.write',
    'seo.read',
    'seo.write',
    'themes.read',
    'themes.write',
    'settings.read',
    'settings.write',
    'team.read',
    'team.write',
    'analytics.read',
  ];
  switch (n) {
    case 'super_admin':
      return ['stores.read', 'stores.write', 'stores.delete', '*', ...allStore];
    case 'partner':
      return [
        'stores.read',
        'stores.write',
        'stores.create',
        'products.read',
        'products.write',
        'orders.read',
        'orders.write',
        'customers.read',
        'customers.write',
        'coupons.read',
        'coupons.write',
        'shipping.read',
        'shipping.write',
        'seo.read',
        'seo.write',
        'themes.read',
        'themes.write',
        'settings.read',
        'settings.write',
        'analytics.read',
      ];
    case 'admin':
    case 'manager':
      return allStore;
    case 'developer':
      return [
        'products.read',
        'orders.read',
        'customers.read',
        'seo.read',
        'seo.write',
        'themes.read',
        'themes.write',
        'settings.read',
        'settings.write',
        'analytics.read',
      ];
    case 'seo':
      return [
        'products.read',
        'orders.read',
        'seo.read',
        'seo.write',
        'analytics.read',
      ];
    case 'marketing':
      return [
        'products.read',
        'orders.read',
        'customers.read',
        'coupons.read',
        'coupons.write',
        'analytics.read',
      ];
    case 'content':
      return [
        'products.read',
        'products.write',
        'themes.read',
        'themes.write',
        'seo.read',
      ];
    case 'sales':
      return [
        'products.read',
        'orders.read',
        'orders.write',
        'customers.read',
        'customers.write',
      ];
    case 'support':
      return [
        'products.read',
        'orders.read',
        'orders.write',
        'customers.read',
        'customers.write',
      ];
    default:
      return [
        'products.read',
        'orders.read',
        'customers.read',
        'coupons.read',
        'shipping.read',
        'seo.read',
        'themes.read',
        'analytics.read',
      ];
  }
}

export function canAbility(
  abilities: string[] | undefined,
  ability: string,
  fallbackRole?: string | null,
): boolean {
  // Role matrix is the floor (fixes truncated/stale session.abilities hiding sidebar tabs).
  const roleList = abilitiesFor(fallbackRole);
  if (roleList.includes('*') || roleList.includes(ability)) return true;
  // Session may only add extra grants — never strip role defaults.
  if (abilities && abilities.length > 0) {
    if (abilities.includes('*') || abilities.includes(ability)) return true;
    // Legacy session_lite grant for store owner (full store modules, not master stores.*)
    if (abilities.includes('store:*')) {
      const ownerList = abilitiesFor('admin');
      if (ownerList.includes(ability) || ability === 'stores.read') return true;
    }
  }
  return false;
}

export function listRoles(portal?: 'master' | 'store'): Array<{
  slug: RoleSlug;
  label: string;
  portal: 'master' | 'store';
  level: number;
}> {
  return (Object.keys(CATALOG) as RoleSlug[])
    .filter((slug) => slug !== 'viewer')
    .filter((slug) => !portal || CATALOG[slug].portal === portal)
    .map((slug) => ({
      slug,
      label: CATALOG[slug].label,
      portal: CATALOG[slug].portal,
      level: CATALOG[slug].level,
    }));
}

/**
 * Strict Security Guard: Only super_admin (Owner) can permanently delete stores / master-level entities.
 * Partner / Sub-admin roles are explicitly blocked from master destructive deletion operations.
 */
export function canDeleteEntities(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === 'super_admin';
}

/**
 * Store-scoped order hard delete: Master Owner + store Admin/Manager.
 * Partner (master sub-admin) and limited store roles stay blocked.
 */
export function canDeleteStoreOrders(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'admin' || r === 'manager';
}

/** Check whether a role is a Master Portal Admin (Super Admin or Partner) */
export function isMasterPortalUser(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'partner';
}


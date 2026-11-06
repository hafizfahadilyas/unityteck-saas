export type CustomerGroupDef = { id: string; name: string; icon: string };

export function customerGroupsStorageKey(storeId: string): string {
  return `unityteck_customer_groups_${storeId}`;
}

export function customerGroupMembershipsKey(storeId: string): string {
  return `unityteck_customer_group_memberships_${storeId}`;
}

export function loadCustomerGroups(storeId: string): CustomerGroupDef[] {
  try {
    const raw = localStorage.getItem(customerGroupsStorageKey(storeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomerGroupDef[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadGroupMemberships(storeId: string): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(customerGroupMembershipsKey(storeId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveGroupMemberships(
  storeId: string,
  memberships: Record<string, string[]>,
): void {
  try {
    localStorage.setItem(customerGroupMembershipsKey(storeId), JSON.stringify(memberships));
  } catch {
    /* quota */
  }
}

export function getCustomerGroupNames(storeId: string, customerId: string): string[] {
  const memberships = loadGroupMemberships(storeId);
  return memberships[customerId] ?? [];
}

export function setCustomerGroupNames(
  storeId: string,
  customerId: string,
  groupNames: string[],
): void {
  const memberships = loadGroupMemberships(storeId);
  const unique = Array.from(new Set(groupNames.map((g) => g.trim()).filter(Boolean)));
  if (unique.length === 0) {
    delete memberships[customerId];
  } else {
    memberships[customerId] = unique;
  }
  saveGroupMemberships(storeId, memberships);
}

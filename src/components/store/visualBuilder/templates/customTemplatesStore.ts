/**
 * Custom Section Templates Storage — Per-Store Isolated
 * Enables store admins to save any customized section as a reusable template.
 */

export interface CustomSectionTemplate {
  id: string;
  storeId: string;
  blockType: string;
  nameEn: string;
  nameAr: string;
  badge: string;
  descEn: string;
  descAr: string;
  createdAt: string;
  templateStyle: string;
  settings: Record<string, any>;
  customCss?: string;
  customHtml?: string;
}

const getStorageKey = (storeId: string) => `selia_custom_section_templates_${storeId}`;

export function getCustomTemplatesForStore(storeId: string, blockType?: string): CustomSectionTemplate[] {
  try {
    const raw = localStorage.getItem(getStorageKey(storeId));
    if (!raw) return [];
    const list: CustomSectionTemplate[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    if (blockType) {
      return list.filter((item) => item.blockType === blockType);
    }
    return list;
  } catch {
    return [];
  }
}

export function saveCustomSectionTemplate(
  storeId: string,
  payload: Omit<CustomSectionTemplate, 'id' | 'createdAt' | 'storeId'>,
): CustomSectionTemplate {
  const current = getCustomTemplatesForStore(storeId);
  const newTemplate: CustomSectionTemplate = {
    ...payload,
    id: `custom_tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    storeId,
    createdAt: new Date().toISOString(),
  };

  const next = [newTemplate, ...current];
  localStorage.setItem(getStorageKey(storeId), JSON.stringify(next));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('unityteck-custom-templates-updated', {
        detail: { storeId, templateId: newTemplate.id },
      }),
    );
  }

  return newTemplate;
}

export function deleteCustomSectionTemplate(storeId: string, templateId: string): boolean {
  try {
    const current = getCustomTemplatesForStore(storeId);
    const filtered = current.filter((item) => item.id !== templateId);
    localStorage.setItem(getStorageKey(storeId), JSON.stringify(filtered));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('unityteck-custom-templates-updated', {
          detail: { storeId, templateId },
        }),
      );
    }
    return true;
  } catch {
    return false;
  }
}

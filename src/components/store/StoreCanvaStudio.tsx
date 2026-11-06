import React from 'react';
import { CanvaImageStudioModal } from './CanvaImageStudioModal';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';

export interface StoreCanvaStudioProps {
  onNavigateTab?: (tab: string) => void;
}

/**
 * Dedicated store tab: full Design Studio (templates, edit, social post)
 * at ?tab=canva — same engine as Media Library modal, page chrome.
 */
export const StoreCanvaStudio: React.FC<StoreCanvaStudioProps> = ({ onNavigateTab }) => {
  const { activeStore, addMediaAsset } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  if (!activeStore) {
    return (
      <div className="p-8 text-sm text-muted">
        {isAr ? 'لا يوجد متجر نشط.' : 'No active store.'}
      </div>
    );
  }

  return (
    <div className="w-full min-h-0">
      <CanvaImageStudioModal
        isOpen
        variant="page"
        onClose={() => undefined}
        initialAsset={null}
        onOpenSocialHub={() => onNavigateTab?.('social')}
        onSaveNewAsset={(dataUrl, title, width, height) => {
          addMediaAsset({
            fileName: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'studio-design'}.webp`,
            originalUrl: dataUrl,
            optimizedUrl: dataUrl,
            webpUrl: dataUrl,
            thumbnailUrl: dataUrl,
            fileType: 'image',
            mimeType: 'image/webp',
            fileSize: Math.round(dataUrl.length * 0.72),
            width,
            height,
            title,
            altText: `${title} - ${activeStore.name}`,
            caption: isAr
              ? `تصميم من استوديو المنصة — ${activeStore.name}`
              : `Created in platform design studio — ${activeStore.name}`,
            folder: 'marketing',
            tags: ['ksa-template', 'studio', activeStore.slug],
            processingStatus: 'ready',
            optimizationStatus: 'optimized',
            source: 'upload',
          });
          toast(
            isAr
              ? 'تم حفظ التصميم في مكتبة وسائط المتجر!'
              : 'Design saved to your store Media Library!',
            'success',
          );
        }}
      />
    </div>
  );
};

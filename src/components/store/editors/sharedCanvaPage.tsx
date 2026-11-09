import React from 'react';
import { CanvaImageStudioModal, type CanvaEditorKind } from '../CanvaImageStudioModal';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';

type Props = {
  editorKind?: CanvaEditorKind;
  onNavigateTab?: (tab: string) => void;
};

export const SharedCanvaEditorPage: React.FC<Props> = ({ editorKind, onNavigateTab }) => {
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
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <CanvaImageStudioModal
        isOpen
        variant="page"
        editorKind={editorKind}
        lockCategory={Boolean(editorKind)}
        onClose={() => onNavigateTab?.('canva')}
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
            isAr ? 'تم حفظ التصدير في مكتبة الوسائط.' : 'Export saved to Media Library.',
            'success',
          );
        }}
      />
    </div>
  );
};

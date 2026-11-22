import React, { useMemo, useState } from 'react';
import {
  CanvaImageStudioModal,
  type CanvaEditorKind,
  type CanvaHomeLaunch,
  type CanvaSavePayload,
} from '../CanvaImageStudioModal';
import { CanvaStudioHome, type CanvaHomeOpenTarget } from '../CanvaStudioHome';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { saveMyCanvaTemplate } from '../../../services/canvaMyTemplates';
import { saveStudioDesign, type StudioEditorType } from '../../../services/storeStudioDesigns';
import { isApiEnabled } from '../../../api/client';

type Props = {
  editorKind?: CanvaEditorKind;
  onNavigateTab?: (tab: string) => void;
};

/** Store Canva — SAME editor as Master. Save = this store_id only (Media + Canva library). */
export const SharedCanvaEditorPage: React.FC<Props> = ({ editorKind, onNavigateTab }) => {
  const { activeStore, addMediaAsset, currentProducts } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const [view, setView] = useState<'home' | 'editor'>('home');
  const [homeLaunch, setHomeLaunch] = useState<CanvaHomeLaunch | null>(null);

  const previewProduct = useMemo(() => {
    const p = currentProducts?.[0];
    if (!p) return null;
    return {
      name: p.name,
      nameAr: p.nameAr,
      price: p.discountedPrice ?? p.price,
      category: p.category,
      categoryAr: p.categoryAr,
    };
  }, [currentProducts]);

  const activeImageUrl = useMemo(() => {
    const p = currentProducts?.[0];
    return String(p?.image || p?.imageUrl || activeStore?.logo || '');
  }, [currentProducts, activeStore?.logo]);

  if (!activeStore) {
    return (
      <div className="p-8 text-sm text-muted">
        {isAr ? 'لا يوجد متجر نشط.' : 'No active store.'}
      </div>
    );
  }

  const saveToThisStoreOnly = async (payload: CanvaSavePayload) => {
    const slug =
      payload.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-').replace(/^-+|-+$/g, '') ||
      'studio-design';
    const thumb = payload.previewDataUrl || payload.dataUrl;
    addMediaAsset({
      fileName: `${slug}.png`,
      originalUrl: payload.dataUrl,
      optimizedUrl: payload.dataUrl,
      webpUrl: payload.dataUrl,
      thumbnailUrl: thumb,
      fileType: 'image',
      mimeType: 'image/png',
      fileSize: Math.round(payload.dataUrl.length * 0.72),
      width: payload.width,
      height: payload.height,
      title: payload.title,
      altText: `${payload.title} - ${activeStore.name}`,
      caption: isAr
        ? `تصميم من استوديو المنصة — ${activeStore.name}`
        : `Created in platform design studio — ${activeStore.name}`,
      folder: 'marketing',
      tags: ['ksa-template', 'studio', activeStore.slug],
      processingStatus: 'ready',
      optimizationStatus: 'optimized',
      source: 'upload',
    });

    try {
      await saveMyCanvaTemplate({
        storeId: activeStore.id,
        category: payload.category,
        nameEn: payload.title || 'My design',
        nameAr: payload.title || 'تصميمي',
        width: payload.width,
        height: payload.height,
        source: payload.source || 'studio',
        layers: payload.layers,
        previewDataUrl: thumb,
      });
    } catch {
      /* Media still saved; template quota may be full */
    }

    if (isApiEnabled()) {
      try {
        const editorType: StudioEditorType =
          editorKind ||
          (payload.category === 'logo'
            ? 'logo'
            : payload.category === 'product'
              ? 'product_card'
              : 'banner');
        await saveStudioDesign(activeStore.id, {
          editor_type: editorType,
          category: payload.category,
          title: payload.title || 'Design',
          width: payload.width,
          height: payload.height,
          design_json: payload.designJson,
          source: 'studio',
        });
      } catch {
        /* local media + template still count */
      }
    }

    toast(
      isAr
        ? 'تم الحفظ في وسائط ومتجر التصميم لهذا المتجر فقط.'
        : 'Saved to Media + Canva library for this store only.',
      'success',
    );
  };

  const openFromHome = (target: CanvaHomeOpenTarget) => {
    const key = `home-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (target.kind === 'premade') {
      setHomeLaunch({ key, premadeId: target.template.id });
    } else if (target.kind === 'mine') {
      setHomeLaunch({ key, myTemplate: target.template });
    } else {
      setHomeLaunch({
        key,
        blank: {
          width: target.width,
          height: target.height,
          blankId: target.blankId,
          label: target.label,
        },
      });
    }
    setView('editor');
  };

  if (view === 'home' && !editorKind) {
    return (
      <CanvaStudioHome
        store={activeStore}
        isAr={isAr}
        activeImageUrl={activeImageUrl || undefined}
        previewProduct={previewProduct}
        onOpenEditor={openFromHome}
      />
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <CanvaImageStudioModal
        key={homeLaunch?.key || `editor-${editorKind || 'full'}`}
        isOpen
        variant="page"
        editorKind={editorKind}
        lockCategory={Boolean(editorKind)}
        homeLaunch={homeLaunch}
        onClose={() => {
          if (editorKind) {
            onNavigateTab?.('canva');
            return;
          }
          setHomeLaunch(null);
          setView('home');
        }}
        initialAsset={null}
        onOpenSocialHub={() => onNavigateTab?.('social')}
        onSaveNewAsset={(dataUrl, title, width, height) => {
          void saveToThisStoreOnly({
            dataUrl,
            title,
            width,
            height,
            category: 'banner',
            layers: [],
            designJson: {},
            source: 'studio',
          });
        }}
        onSaveDesignPayload={(payload) => void saveToThisStoreOnly(payload)}
      />
    </div>
  );
};

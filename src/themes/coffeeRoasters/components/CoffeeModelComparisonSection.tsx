import React, { useMemo, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { bi, type ModelComparisonSettings } from '../../settings/coffeeModularSettings';
import {
  modelComparisonShowsOnDevice,
  selectModel,
  specValueFor,
  visibleModels,
  visibleSpecs,
  type ModelComparisonDevice,
} from './coffeeModelComparisonLogic';

function resolveDevice(): ModelComparisonDevice {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function formatPrice(isAr: boolean, price: number | null | undefined): string {
  if (price == null || Number.isNaN(Number(price))) return '';
  const n = Number(price).toLocaleString(isAr ? 'ar-SA' : 'en-US');
  return isAr ? `${n} ⃁` : `⃁ ${n}`;
}

function ModelComparisonBody({
  settings,
  device,
  isAr,
}: {
  settings: ModelComparisonSettings;
  device?: ModelComparisonDevice;
  isAr: boolean;
}) {
  const lang = isAr ? 'ar' : 'en';
  const activeDevice = device || resolveDevice();
  const models = useMemo(() => visibleModels(settings), [settings]);
  const specs = useMemo(() => visibleSpecs(settings), [settings]);
  const [fullScreen, setFullScreen] = useState(false);
  const [localSelected, setLocalSelected] = useState<string | null>(null);

  if (!settings.enabled) return null;
  if (!modelComparisonShowsOnDevice(settings, activeDevice)) return null;
  if (!models.length) return null;

  const selectedId =
    localSelected ||
    models.find((m) => m.selected)?.id ||
    models[0]?.id ||
    '';

  const padY = settings.sectionPaddingY ?? 48;
  const gap = settings.modelGapPx ?? 16;
  const cardPad = settings.cardPaddingPx ?? 16;
  const showImages = settings.showProductImages !== false;
  const showPrices = settings.showProductPrices !== false;
  const showButtons = settings.showSelectionButtons !== false;
  const showSpecs = settings.showSpecifications !== false;
  const highlight = settings.highlightSelectedModel !== false;
  const showSpecLabels = settings.showSpecificationLabels !== false;

  const body = (
    <div
      className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8"
      style={{
        paddingTop: (settings.spacingTopPx || 0) + (fullScreen ? 24 : padY),
        paddingBottom: (settings.spacingBottomPx || 0) + (fullScreen ? 24 : padY),
      }}
    >
      <div className="max-w-3xl mx-auto mb-6 sm:mb-8 text-center space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {settings.showBadge !== false && (settings.badgeEn || settings.badgeAr) ? (
            <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
              {bi(lang, settings.badgeEn, settings.badgeAr)}
            </span>
          ) : null}
          {settings.showSecondaryLabel !== false && (settings.secondaryLabelEn || settings.secondaryLabelAr) ? (
            <span className="inline-block text-[10px] sm:text-xs font-semibold text-neutral-500">
              {bi(lang, settings.secondaryLabelEn, settings.secondaryLabelAr)}
            </span>
          ) : null}
        </div>
        {(settings.titleEn || settings.titleAr) ? (
          <h2 className={`text-2xl sm:text-3xl font-extrabold text-neutral-900 ${isAr ? 'leading-[1.38]' : 'leading-tight'}`}>
            {bi(lang, settings.titleEn, settings.titleAr)}
          </h2>
        ) : null}
        {settings.showDescription !== false && (settings.descriptionEn || settings.descriptionAr) ? (
          <p className="text-sm sm:text-base text-neutral-500">
            {bi(lang, settings.descriptionEn, settings.descriptionAr)}
          </p>
        ) : null}
        {settings.allowFullScreen && !fullScreen ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-700 mt-1"
            onClick={() => setFullScreen(true)}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            {isAr ? 'عرض بملء الشاشة' : 'Full screen'}
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid min-w-[280px]"
          style={{
            gridTemplateColumns: `repeat(${models.length}, minmax(${activeDevice === 'mobile' ? 140 : 160}px, 1fr))`,
            gap,
          }}
        >
          {models.map((m) => {
            const isSelected = m.id === selectedId;
            return (
              <article
                key={m.id}
                className={`rounded-2xl border bg-white flex flex-col items-center text-center ${
                  highlight && isSelected ? 'border-neutral-900 shadow-md ring-1 ring-neutral-900/10' : 'border-neutral-100'
                }`}
                style={{ padding: cardPad }}
              >
                {highlight && isSelected ? (
                  <span className="text-[9px] font-bold uppercase tracking-wide mb-2 text-neutral-700">
                    {isAr ? 'الخيار المحدد' : 'Selected Choice'}
                  </span>
                ) : null}
                {showImages ? (
                  m.image ? (
                    <img src={m.image} alt="" className="h-24 w-full object-contain mb-3" />
                  ) : (
                    <div className="h-24 w-full rounded-xl bg-neutral-100 mb-3" />
                  )
                ) : null}
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2">
                  {bi(lang, m.nameEn, m.nameAr) || (isAr ? 'موديل' : 'Model')}
                </h3>
                {showPrices && m.price != null ? (
                  <div className="text-[11px] text-neutral-500 mt-1 font-semibold">{formatPrice(isAr, m.price)}</div>
                ) : null}
                {showButtons ? (
                  <button
                    type="button"
                    className={`mt-3 w-full rounded-xl px-2 py-2 text-[10px] sm:text-[11px] font-bold ${
                      isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800'
                    }`}
                    onClick={() => setLocalSelected(m.id)}
                  >
                    {isSelected
                      ? bi(lang, m.buttonEn || 'Selected', m.buttonAr || 'محدد') || (isAr ? 'محدد' : 'Selected')
                      : bi(lang, m.buttonEn, m.buttonAr) || (isAr ? 'اختر الموديل' : 'Select Model')}
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>

        {showSpecs && specs.length > 0 ? (
          <div className="mt-6 space-y-2" style={{ gap: settings.specRowGapPx ?? 8 }}>
            {specs.map((spec) => (
              <div
                key={spec.id}
                className="grid items-stretch rounded-xl border border-neutral-100 bg-[#FAFAFA] overflow-hidden"
                style={{
                  gridTemplateColumns: showSpecLabels
                    ? `minmax(100px, 140px) repeat(${models.length}, minmax(${activeDevice === 'mobile' ? 140 : 160}px, 1fr))`
                    : `repeat(${models.length}, minmax(${activeDevice === 'mobile' ? 140 : 160}px, 1fr))`,
                  gap,
                }}
              >
                {showSpecLabels ? (
                  <div className="px-3 py-3 text-[11px] font-bold text-neutral-700 flex items-center">
                    {bi(lang, spec.nameEn, spec.nameAr)}
                  </div>
                ) : null}
                {models.map((m) => (
                  <div
                    key={`${spec.id}-${m.id}`}
                    className={`px-3 py-3 text-[11px] text-center text-neutral-800 ${
                      highlight && m.id === selectedId ? 'bg-white font-semibold' : ''
                    }`}
                  >
                    {specValueFor(spec, m.id, lang) || '—'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[80] bg-white overflow-auto" data-customize-section="C-CMP" role="dialog" aria-modal>
        <div className="sticky top-0 z-10 flex justify-end p-3 bg-white/90 backdrop-blur border-b border-neutral-100">
          <button type="button" className="p-2 rounded-lg border border-neutral-200" onClick={() => setFullScreen(false)} aria-label={isAr ? 'إغلاق' : 'Close'}>
            <X className="w-5 h-5" />
          </button>
        </div>
        {body}
      </div>
    );
  }

  return (
    <section data-customize-section="C-CMP" className="w-full select-none overflow-hidden">
      {body}
    </section>
  );
};

function CoffeeModelComparisonFromCart({
  settings,
  device,
}: {
  settings: ModelComparisonSettings;
  device?: ModelComparisonDevice;
}) {
  const { language } = useCart();
  return <ModelComparisonBody settings={settings} device={device} isAr={language === 'AR'} />;
}

export const CoffeeModelComparisonSection: React.FC<{
  settings: ModelComparisonSettings | null | undefined;
  device?: ModelComparisonDevice;
  lang?: 'ar' | 'en';
}> = ({ settings, device, lang: langProp }) => {
  if (!settings) return null;
  if (langProp) {
    return <ModelComparisonBody settings={settings} device={device} isAr={langProp === 'ar'} />;
  }
  return <CoffeeModelComparisonFromCart settings={settings} device={device} />;
};

/** Admin/builder: apply local select into draft models when needed. */
export function applyLocalModelSelect(
  settings: ModelComparisonSettings,
  modelId: string,
): ModelComparisonSettings {
  return { ...settings, models: selectModel(settings.models || [], modelId) };
}

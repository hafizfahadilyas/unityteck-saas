import React from 'react';
import { Check } from 'lucide-react';
import {
  defaultOfferConfig,
  type StoreOfferConfig,
} from '../../themes/flowersPremium/offerConfig';
import { OFFER_TEMPLATES, offerTemplateById } from '../../themes/flowersPremium/offerTemplates';

type Props = {
  config: StoreOfferConfig;
  setConfig: React.Dispatch<React.SetStateAction<StoreOfferConfig>>;
  isAr: boolean;
  editing: boolean;
  onToggleEditing: () => void;
  onSave: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  onResetDefault?: () => void;
};

export const OfferDisplaySettingsPanel: React.FC<Props> = ({
  config,
  setConfig,
  isAr,
  editing,
  onToggleEditing,
  onSave,
  onCancelEdit,
  onResetDefault,
}) => {
  const applyTemplate = (templateId: StoreOfferConfig['templateId']) => {
    const tpl = offerTemplateById(templateId);
    setConfig({
      ...config,
      templateId,
      titleEn: tpl.titleEn,
      titleAr: tpl.titleAr,
      bodyEn: tpl.bodyEn,
      bodyAr: tpl.bodyAr,
      code: tpl.code,
      discountPercent: tpl.discountPercent,
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {OFFER_TEMPLATES.map((tpl) => {
          const active = config.templateId === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => applyTemplate(tpl.id)}
              className="text-start rounded-2xl border overflow-hidden cursor-pointer transition-all hover:opacity-95"
              style={{
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                boxShadow: active ? '0 0 0 1px var(--accent)' : undefined,
                background: 'var(--surface)',
              }}
            >
              <div
                className="h-16 p-3 text-white text-[11px] font-bold flex items-end"
                style={{ background: `linear-gradient(135deg, ${tpl.accentFrom}, ${tpl.accentTo})` }}
              >
                {isAr ? tpl.nameAr : tpl.nameEn}
              </div>
              <div className="p-3 space-y-1">
                <div className="text-xs font-bold truncate">{isAr ? tpl.titleAr : tpl.titleEn}</div>
                <div className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                  {tpl.code} · {tpl.discountPercent}%
                </div>
                {active ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold"
                    style={{ color: 'var(--tone-success)' }}
                  >
                    <Check className="w-3 h-3" /> {isAr ? 'مختار' : 'Selected'}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {!editing ? (
        <button
          type="button"
          onClick={onToggleEditing}
          className="mt-3 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          {isAr ? 'تعديل نافذة الكوبون' : 'Edit coupon window'}
        </button>
      ) : (
        <form onSubmit={onSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t mt-3" style={{ borderColor: 'var(--border)' }}>
          <div>
            <label className="text-[11px] font-bold block mb-1">{isAr ? 'العنوان بالإنجليزية' : 'Title (EN)'}</label>
            <input
              value={config.titleEn}
              onChange={(e) => setConfig({ ...config, titleEn: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold block mb-1">{isAr ? 'العنوان بالعربية' : 'Title (AR)'}</label>
            <input
              dir="rtl"
              value={config.titleAr}
              onChange={(e) => setConfig({ ...config, titleAr: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold block mb-1">{isAr ? 'النص بالإنجليزية' : 'Body (EN)'}</label>
            <textarea
              rows={2}
              value={config.bodyEn}
              onChange={(e) => setConfig({ ...config, bodyEn: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border resize-none"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold block mb-1">{isAr ? 'النص بالعربية' : 'Body (AR)'}</label>
            <textarea
              dir="rtl"
              rows={2}
              value={config.bodyAr}
              onChange={(e) => setConfig({ ...config, bodyAr: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border resize-none"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold block mb-1">{isAr ? 'الكود' : 'Code'}</label>
            <input
              value={config.code}
              onChange={(e) => setConfig({ ...config, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-xs rounded-xl border font-mono font-bold"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold block mb-1">{isAr ? 'نسبة الخصم' : 'Discount %'}</label>
            <input
              type="number"
              min={1}
              max={90}
              value={config.discountPercent}
              onChange={(e) =>
                setConfig({ ...config, discountPercent: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full px-3 py-2 text-xs rounded-xl border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div className="sm:col-span-2 flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
              style={{ borderColor: 'var(--border)' }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
              style={{ background: 'var(--portal-cta)' }}
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
            {onResetDefault ? (
              <button
                type="button"
                onClick={onResetDefault}
                className="ms-auto px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ color: 'var(--muted)' }}
              >
                {isAr ? 'إعادة للافتراضي (متوقف)' : 'Reset to default (OFF)'}
              </button>
            ) : null}
          </div>
        </form>
      )}
    </>
  );
};

export { defaultOfferConfig };

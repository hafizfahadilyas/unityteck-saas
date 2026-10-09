import React from 'react';
import { Gift, X, Copy, Check, Sparkles } from 'lucide-react';
import { offerTemplateById, type OfferTemplateId } from './offerTemplates';
import type { StoreOfferConfig } from './offerConfig';

type Props = {
  open: boolean;
  lang: string;
  config: StoreOfferConfig;
  onClose: () => void;
  onApplyCode: (code: string) => void;
};

export const OfferPopup: React.FC<Props> = ({ open, lang, config, onClose, onApplyCode }) => {
  const [copied, setCopied] = React.useState(false);
  if (!open) return null;

  const tpl = offerTemplateById(config.templateId as OfferTemplateId);
  const isAr = lang === 'ar';
  const title = isAr ? config.titleAr : config.titleEn;
  const body = isAr ? config.bodyAr : config.bodyEn;
  const badge = isAr ? tpl.badgeAr : tpl.badgeEn;
  const code = config.code;

  const copy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    onApplyCode(code);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
      style={{ background: 'color-mix(in srgb, var(--portal-950) 72%, transparent)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl border transition-transform duration-200 ease-out"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 end-3 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
          style={{
            background: 'color-mix(in srgb, var(--surface) 85%, var(--portal-950))',
            color: 'var(--text)',
          }}
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>

        <div
          className="p-6 pt-8 text-center space-y-2 text-white"
          style={{
            background: `linear-gradient(145deg, ${tpl.accentFrom}, ${tpl.accentTo})`,
          }}
        >
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 border border-white/20">
            <Sparkles className="w-3 h-3 text-amber-200" />
            {badge}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mt-1">
            <Gift className="w-6 h-6 text-amber-200" />
          </div>
          <h3 className="text-lg font-black tracking-tight">{title}</h3>
          <p className="text-xs leading-relaxed opacity-90">{body}</p>
        </div>

        <div className="p-5 space-y-3">
          <div
            className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-dashed"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent) 45%, var(--border))',
              background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
            }}
          >
            <code className="font-black tracking-widest" style={{ color: 'var(--text)' }}>
              {code}
            </code>
            <button
              type="button"
              onClick={copy}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer text-white transition-opacity hover:opacity-90"
              style={{ background: tpl.accentTo }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? (isAr ? 'تم' : 'Copied') : isAr ? 'نسخ وتطبيق' : 'Copy & apply'}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--portal-cta)' }}
          >
            {isAr ? 'تسوق الآن' : 'Shop now'}
          </button>
        </div>
      </div>
    </div>
  );
};

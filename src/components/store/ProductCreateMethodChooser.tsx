import React from 'react';
import { Package, FileSpreadsheet, Layers, X } from 'lucide-react';
import { GlobalModal } from '../common/GlobalModal';

export type ProductCreateMethod = 'single' | 'bulk' | 'grouped';

type Props = {
  open: boolean;
  isAr: boolean;
  onClose: () => void;
  onSelect: (method: ProductCreateMethod) => void;
};

/**
 * Coffee-only create chooser: Single / Bulk / Grouped.
 * Other stores keep Add Product + Import buttons without this modal.
 */
export const ProductCreateMethodChooser: React.FC<Props> = ({
  open,
  isAr,
  onClose,
  onSelect,
}) => {
  const cards: Array<{
    id: ProductCreateMethod;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'single',
      title: isAr ? 'منتج واحد' : 'Single Product',
      desc: isAr
        ? 'إنشاء منتج مستقل كامل التفاصيل'
        : 'Create one independent product with full details',
      icon: <Package className="w-6 h-6" />,
    },
    {
      id: 'bulk',
      title: isAr ? 'منتجات جماعية' : 'Bulk Products',
      desc: isAr
        ? 'استيراد عدة منتجات عبر ملف'
        : 'Import multiple products from a spreadsheet',
      icon: <FileSpreadsheet className="w-6 h-6" />,
    },
    {
      id: 'grouped',
      title: isAr ? 'منتجات مجمعة' : 'Grouped Products',
      desc: isAr
        ? 'منتج أب يجمع 3–4 منتجات مستقلة للعرض والتبديل'
        : 'One parent group with 3–4 independent child products',
      icon: <Layers className="w-6 h-6" />,
    },
  ];

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      aria-label={isAr ? 'اختر طريقة إنشاء المنتج' : 'Choose how to create products'}
      contentClassName="w-[min(92vw,720px)]"
    >
      <div
        className="rounded-2xl border shadow-xl overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 text-white"
          style={{ background: 'var(--portal-cta)' }}
        >
          <h2 className="text-sm font-bold">
            {isAr ? 'اختر طريقة إنشاء المنتج' : 'Choose how to create products'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              className="text-start rounded-2xl border p-4 transition-all hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 text-white"
                style={{ background: 'var(--portal-cta)' }}
              >
                {card.icon}
              </div>
              <div className="text-sm font-bold mb-1">{card.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {card.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </GlobalModal>
  );
};

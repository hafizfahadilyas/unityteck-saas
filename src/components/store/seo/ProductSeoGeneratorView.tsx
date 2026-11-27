import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Check,
  Eye,
  Sliders,
  Send,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Copy,
  Layers,
  X,
} from 'lucide-react';
import {
  type ProductSeoGeneratedData,
  generateProductSeo,
  bulkGenerateProductSeo,
  saveSeoMetadata,
} from '../../../services/enterpriseSeoApi';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { Product } from '../../../types';

interface ProductSeoGeneratorViewProps {
  storeId: string;
  storeName: string;
  products: Product[];
  onRefresh: () => Promise<void>;
}

export const ProductSeoGeneratorView: React.FC<ProductSeoGeneratorViewProps> = ({
  storeId,
  storeName,
  products,
  onRefresh,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<ProductSeoGeneratedData | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(products[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPayload, setEditedPayload] = useState<Partial<ProductSeoGeneratedData>>({});
  const [publishing, setPublishing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleGenerateSingle = async (prod: Product) => {
    setGeneratingId(prod.id);
    setPreviewProduct(prod);
    try {
      const res = await generateProductSeo(storeId, prod.id);
      if (res.success) {
        setGeneratedResult(res.data);
        setEditedPayload(res.data);
        toast(
          isAr
            ? `تم توليد سيو المنتج بنجاح باستخدام Gemini Flash (استهلك ${res.credits_deducted} رصيد)`
            : `Product SEO generated with Gemini Flash (${res.credits_deducted} credit used)`,
          'success'
        );
      }
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل التوليد. تم استرداد الرصيد تلقائياً.' : 'Generation failed. Credits refunded.'), 'error');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleBulkGenerate = async () => {
    if (products.length === 0) return;
    setBulkGenerating(true);
    try {
      const ids = products.slice(0, 10).map((p) => p.id);
      const res = await bulkGenerateProductSeo(storeId, { product_ids: ids });
      toast(
        isAr
          ? `تم التوليد التلقائي لـ ${res.successful} من ${res.total_requested} منتج بنجاح`
          : `Bulk generated SEO for ${res.successful} products`,
        'success'
      );
      await onRefresh();
    } catch (err: any) {
      toast(err?.message || 'Bulk generation error', 'error');
    } finally {
      setBulkGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!previewProduct || !editedPayload) return;
    setPublishing(true);
    try {
      await saveSeoMetadata(storeId, {
        entity_type: 'product',
        entity_id: previewProduct.id,
        url_path: `/products/${previewProduct.slug || previewProduct.id}`,
        payload: {
          title_ar: editedPayload.seo_title_ar,
          title_en: editedPayload.seo_title_en,
          meta_description_ar: editedPayload.meta_description_ar,
          meta_description_en: editedPayload.meta_description_en,
          focus_keyword: editedPayload.focus_keyword,
          secondary_keywords: editedPayload.secondary_keywords,
          search_intent: editedPayload.search_intent,
          og_title_ar: editedPayload.og_title_ar,
          og_title_en: editedPayload.og_title_en,
          og_description_ar: editedPayload.og_description_ar,
          og_description_en: editedPayload.og_description_en,
          faq_items: editedPayload.faq_suggestions,
        },
      });

      toast(isAr ? 'تم نشر وتثبيت السيو على صفحة المنتج الحية' : 'SEO published live to product page', 'success');
      await onRefresh();
    } catch (err: any) {
      toast(err?.message || 'Publish failed', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.name_ar && p.name_ar.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Info Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{isAr ? 'مولد السيو التلقائي للمنتجات (Google Gemini Flash)' : 'Product SEO Auto-Generator (Google Gemini Flash)'}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {isAr
              ? 'يولد ١٥ بعداً دقيقاً للسيو باللغتين العربية والإنجليزية. يعتمد فقط على بيانات المنتج الحقيقية ويحظر اختراع شهادات أو ضمانات غير موثقة.'
              : 'Auto-generates 15 SEO dimensions based exclusively on verified product attributes, prices, and stock.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleBulkGenerate}
          disabled={bulkGenerating || products.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md disabled:opacity-50 shrink-0"
        >
          <Layers className={`w-3.5 h-3.5 ${bulkGenerating ? 'animate-spin' : ''}`} />
          <span>{bulkGenerating ? (isAr ? 'جاري التوليد الشامل...' : 'Bulk Generating...') : (isAr ? 'توليد شامل للكاتالوج' : 'Bulk Generate (Top 10)')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Products Sidebar Selector */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">{isAr ? 'اختر منتجاً' : 'Select Product'}</span>
            <span className="text-[10px] text-slate-400">{filteredProducts.length} {isAr ? 'منتج' : 'items'}</span>
          </div>

          <input
            type="text"
            placeholder={isAr ? 'بحث في المنتجات...' : 'Filter products...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
          />

          <div className="max-h-[500px] overflow-y-auto space-y-2 pe-1 scrollbar-thin">
            {filteredProducts.map((p) => {
              const isSelected = (previewProduct?.id || selectedProductId) === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProductId(p.id);
                    setPreviewProduct(p);
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 text-white'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold truncate">{isAr ? p.name_ar || p.name : p.name}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{p.price} SAR</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleGenerateSingle(p);
                      }}
                      disabled={generatingId === p.id}
                      className="text-amber-400 hover:underline font-bold flex items-center gap-1"
                    >
                      {generatingId === p.id ? (
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-2.5 h-2.5" />
                      )}
                      <span>{isAr ? 'توليد' : 'Generate'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 15 Dimensions Preview & Editor Drawer */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-slate-400 block">{isAr ? 'المنتج المحدد:' : 'Selected Target:'}</span>
              <h4 className="text-sm font-bold text-white">
                {previewProduct ? (isAr ? previewProduct.name_ar || previewProduct.name : previewProduct.name) : '—'}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => previewProduct && handleGenerateSingle(previewProduct)}
                disabled={!previewProduct || generatingId === previewProduct.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingId === previewProduct?.id ? 'animate-spin' : ''}`} />
                <span>{isAr ? 'إعادة التوليد' : 'Regenerate'}</span>
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={!generatedResult || publishing}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{publishing ? (isAr ? 'جاري النشر...' : 'Publishing...') : (isAr ? 'اعتماد ونشر للسوق' : 'Approve & Publish')}</span>
              </button>
            </div>
          </div>

          {!generatedResult ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl space-y-3">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
              <p className="text-sm font-semibold text-white">
                {isAr ? 'اضغط على "توليد" لإنشاء ١٥ بُعد سيو فوري' : 'Click "Generate" to create 15 instant SEO dimensions'}
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {isAr
                  ? 'سيتم استخدام نموذج Google Gemini Flash لإنشاء عناوين وأوصاف مطابقة لسلوك المتسوق السعودي.'
                  : 'Generates SEO title, meta description, product descriptions, keywords, image alt, and FAQs.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Titles & Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">{isAr ? 'عنوان السيو (عربي)' : 'SEO Title (Arabic)'}</label>
                  <input
                    type="text"
                    value={editedPayload.seo_title_ar || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, seo_title_ar: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">{isAr ? 'عنوان السيو (إنجليزي)' : 'SEO Title (English)'}</label>
                  <input
                    type="text"
                    value={editedPayload.seo_title_en || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, seo_title_en: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium"
                  />
                </div>
              </div>

              {/* Meta Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">{isAr ? 'وصف الميتا (عربي)' : 'Meta Description (Arabic)'}</label>
                  <textarea
                    rows={3}
                    value={editedPayload.meta_description_ar || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, meta_description_ar: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">{isAr ? 'وصف الميتا (إنجليزي)' : 'Meta Description (English)'}</label>
                  <textarea
                    rows={3}
                    value={editedPayload.meta_description_en || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, meta_description_en: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              {/* Keywords & Intent */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">{isAr ? 'الكلمة المفتاحية الأساسية' : 'Focus Keyword'}</label>
                  <input
                    type="text"
                    value={editedPayload.focus_keyword || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, focus_keyword: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">{isAr ? 'نية البحث' : 'Search Intent'}</label>
                  <input
                    type="text"
                    value={editedPayload.search_intent || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, search_intent: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-blue-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">{isAr ? 'نص الصورة البديل ALT' : 'Image ALT Text'}</label>
                  <input
                    type="text"
                    value={editedPayload.image_alt_text_ar || ''}
                    onChange={(e) => setEditedPayload({ ...editedPayload, image_alt_text_ar: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-emerald-300"
                  />
                </div>
              </div>

              {/* Open Graph & Social Sharing */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <span className="font-bold text-slate-300 block">{isAr ? 'مقتطف المشاركة لشبكات التواصل (Open Graph & WhatsApp)' : 'Social Sharing & Open Graph Card'}</span>
                <p className="text-slate-400 text-[11px]">
                  {editedPayload.social_sharing_content_ar || editedPayload.og_description_ar}
                </p>
              </div>

              {/* FAQ Suggestions */}
              {editedPayload.faq_suggestions && editedPayload.faq_suggestions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-white block">{isAr ? 'أسئلة مقترحة لمحركات البحث (AEO FAQs)' : 'Search-Engine FAQs (AEO)'}</span>
                  <div className="space-y-2">
                    {editedPayload.faq_suggestions.map((faq, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px]">
                        <strong className="text-amber-400 block mb-0.5">{faq.q_ar}</strong>
                        <span className="text-slate-300">{faq.a_ar}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

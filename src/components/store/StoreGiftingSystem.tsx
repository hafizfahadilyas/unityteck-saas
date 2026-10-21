import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchGiftingSettingsApi,
  updateGiftingSettingsApi,
  type GiftingSettingsData,
  type GiftingCardItem,
  type GiftingBoxItem,
} from '../../api/tenantApi';
import {
  Gift,
  Plus,
  Package,
  Trash2,
  Edit2,
  Check,
  Eye,
  EyeOff,
  MapPin,
  Clock,
  User,
  Phone,
  Search,
  Database,
  ShieldCheck,
  FileCheck,
  Sliders,
  DollarSign,
  Layers,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShoppingBag,
} from 'lucide-react';

interface StoreGiftingSystemProps {
  onNavigateTab?: (tab: string) => void;
}

export const StoreGiftingSystem: React.FC<StoreGiftingSystemProps> = ({ onNavigateTab }) => {
  const { activeStore, currentProducts } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchCardQuery, setSearchCardQuery] = useState<string>('');
  const [selectedSubTab, setSelectedSubTab] = useState<'boxes' | 'packaging' | 'messages' | 'products'>('boxes');

  // Gifting Data from Backend
  const [giftingData, setGiftingData] = useState<GiftingSettingsData | null>(null);

  // Pillar 2 Interactive Mockup State
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [selectedBoxId, setSelectedBoxId] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('+966 50 123 4567');
  const [recipientAddress, setRecipientAddress] = useState<string>('');

  // Add Card Modal / Inline Form
  const [isAddingCard, setIsAddingCard] = useState<boolean>(false);
  const [newCardTitleEn, setNewCardTitleEn] = useState<string>('');
  const [newCardTitleAr, setNewCardTitleAr] = useState<string>('');
  const [newCardCategory, setNewCardCategory] = useState<string>('Celebration');

  // Fetch settings whenever activeStore changes (Strict Multi-Tenant Isolation)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchGiftingSettingsApi(activeStore.id)
      .then((data) => {
        if (!isMounted) return;
        setGiftingData(data);
        if (data.cards?.length > 0) {
          setSelectedCardId(data.cards[0].id);
        }
        if (data.boxes?.length > 0) {
          setSelectedBoxId(data.boxes[0].id);
        }
        const defaultMsg = isAr ? data.sample_message?.ar : data.sample_message?.en;
        setCustomMessage(defaultMsg || '');
        setRecipientName(isAr ? 'فاطمة أحمد' : 'Fatima Ahmed');
        setRecipientAddress(isAr ? 'مكة المكرمة، حي العزيزية' : 'Makkah, Al Aziziyah District');
      })
      .catch((err) => {
        console.error('Failed to load gifting settings:', err);
        toast(isAr ? 'فشل تحميل إعدادات الهدايا' : 'Failed to load gifting settings', 'error');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeStore.id, isAr]);

  // Handle Save
  const handleSaveSettings = async () => {
    if (!giftingData) return;
    try {
      setSaving(true);
      const updated = await updateGiftingSettingsApi(activeStore.id, {
        enabled: giftingData.enabled,
        allow_anonymous: giftingData.allow_anonymous,
        max_message_length: giftingData.max_message_length,
        cards: giftingData.cards,
        boxes: giftingData.boxes,
        sample_message: giftingData.sample_message,
      });
      setGiftingData((prev) => (prev ? { ...prev, ...updated } : prev));
      toast(
        isAr ? 'تم حفظ إعدادات الهدايا وتحديث خيارات المتجر بنجاح' : 'Gift settings successfully saved and synced with store',
        'success'
      );
    } catch (err) {
      console.error('Failed to save gifting settings:', err);
      toast(isAr ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving gift settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Add Card Handler
  const handleAddCard = () => {
    if (!newCardTitleEn.trim() && !newCardTitleAr.trim()) {
      toast(isAr ? 'يرجى إدخال اسم الكرت' : 'Please enter card title', 'error');
      return;
    }
    const newCard: GiftingCardItem = {
      id: `card-${Date.now()}`,
      titleEn: newCardTitleEn.trim() || newCardTitleAr.trim(),
      titleAr: newCardTitleAr.trim() || newCardTitleEn.trim(),
      category: newCardCategory,
    };
    const updatedCards = [...(giftingData?.cards || []), newCard];
    setGiftingData((prev) => (prev ? { ...prev, cards: updatedCards } : prev));
    setIsAddingCard(false);
    setNewCardTitleEn('');
    setNewCardTitleAr('');
    toast(isAr ? 'تمت إضافة بطاقة إهداء جديدة' : 'New gift card design added', 'success');
  };

  // Delete Card Handler
  const handleDeleteCard = (cardId: string) => {
    const updatedCards = (giftingData?.cards || []).filter((c) => c.id !== cardId);
    setGiftingData((prev) => (prev ? { ...prev, cards: updatedCards } : prev));
    if (selectedCardId === cardId && updatedCards.length > 0) {
      setSelectedCardId(updatedCards[0].id);
    }
    toast(isAr ? 'تم حذف بطاقة الإهداء' : 'Gift card removed', 'success');
  };

  // Filtered cards for search
  const filteredCards = useMemo(() => {
    if (!giftingData?.cards) return [];
    if (!searchCardQuery.trim()) return giftingData.cards;
    const q = searchCardQuery.toLowerCase();
    return giftingData.cards.filter(
      (c) =>
        c.titleEn.toLowerCase().includes(q) ||
        c.titleAr.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [giftingData?.cards, searchCardQuery]);

  // Real store product for Mockup (Customer Experience)
  const previewProduct = useMemo(() => {
    if (currentProducts && currentProducts.length > 0) {
      return currentProducts[0];
    }
    return {
      id: 'prod-def',
      name: isAr ? `${activeStore.name} باقة مميزة` : `${activeStore.name} Signature Product`,
      price: 180,
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60',
    };
  }, [currentProducts, activeStore.name, isAr]);

  // Store niche subtitle
  const storeNicheSubtitle = useMemo(() => {
    const s = (activeStore.slug || '').toLowerCase();
    if (s.includes('coffee')) {
      return isAr ? 'القهوة المختصة • المحامص • الهدايا' : 'Specialty Coffee • Roastery • Hampers';
    }
    if (s.includes('bleco') || s.includes('car')) {
      return isAr ? 'العناية بالسيارات • نانو سيراميك • خدمات VIP' : 'Automotive Detailing • Ceramic Shield • VIP Care';
    }
    return isAr ? 'الزهور • الهدايا الفاخرة • التغليف' : 'Flowers • Gifts • Luxury Packaging';
  }, [activeStore.slug, isAr]);

  // Selected Box Object
  const currentSelectedBox = useMemo(() => {
    return (
      giftingData?.boxes.find((b) => b.id === selectedBoxId) ||
      giftingData?.boxes[0] || {
        nameEn: 'Standard Box',
        nameAr: 'صندوق كلاسيكي',
        price: 10,
      }
    );
  }, [giftingData?.boxes, selectedBoxId]);

  // Real Order Record for Pillar 3
  const activeOrder = useMemo(() => {
    if (giftingData?.real_orders && giftingData.real_orders.length > 0) {
      return giftingData.real_orders[0];
    }
    return null;
  }, [giftingData?.real_orders]);

  if (loading) {
    return (
      <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">
          {isAr ? 'جاري تحميل إعدادات وتخصيصات نظام الإهداء...' : 'Loading store gifting configuration...'}
        </p>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="p-4 sm:p-6 lg:p-6 space-y-6 max-w-[1650px] mx-auto text-slate-800 dark:text-slate-100 transition-colors"
    >
      {/* Header Banner matching Reference Image */}
      <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 border border-pink-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-pink-600 dark:text-pink-400">
            <Gift className="w-4 h-4" />
            <span>{activeStore.name}</span>
            <span>•</span>
            <span className="text-slate-500 dark:text-slate-400">{storeNicheSubtitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>{isAr ? 'نظام الهدايا المتكامل' : 'Complete Gift-Giving System'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {isAr
              ? `إدارة شاملة لخيارات الإهداء، كروت المعايدة، باقات التغليف الفاخر وتتبع التوصيل لمتجر ${activeStore.name}`
              : `Comprehensive gift customization, card templates, luxury packaging, and recipient fulfillment for ${activeStore.name}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-pink-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{isAr ? 'حفظ إعدادات الهدايا' : 'Save Gift Settings'}</span>
          </button>
        </div>
      </div>

      {/* 3 Pillars Overview Layout - Exact 1:1 match with reference image */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ========================================================= */}
        {/* PILLAR 1: Gift Settings & Packaging                      */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
          {/* Pillar 1 Header */}
          <div className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="w-8 h-8 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 flex items-center justify-center text-sm font-black shrink-0">
              1
            </span>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {isAr ? 'إعدادات وخيارات الإهداء' : 'Gift Settings'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'إدارة خيارات الهدايا، الصور، الرسائل وإعدادات المنتجات'
                  : 'Manage gift options, images, messages, and product settings.'}
              </p>
            </div>
          </div>

          {/* Sub-features overview checklist */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>{isAr ? 'تصاميم كروت الإهداء' : 'Gift Card Images'}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
              <span>{isAr ? 'رسائل الإهداء الجاهزة' : 'Gift Messages'}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Package className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isAr ? 'صناديق التغليف' : 'Gift Boxes'}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'تسعير خيارات الهدايا' : 'Pricing & Options'}</span>
            </div>
          </div>

          {/* Gift Cards Management Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                <span>{isAr ? 'إدارة كروت الإهداء' : 'Gift Cards Management'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingCard(!isAddingCard)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/50 dark:hover:bg-pink-900/50 text-pink-600 dark:text-pink-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{isAr ? 'إضافة كرت' : '+ Add Gift Card'}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute top-2.5 ${isAr ? 'right-2.5' : 'left-2.5'} text-slate-400`} />
              <input
                type="text"
                value={searchCardQuery}
                onChange={(e) => setSearchCardQuery(e.target.value)}
                placeholder={isAr ? 'بحث في كروت الإهداء...' : 'Search gift cards...'}
                className={`w-full ${isAr ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-pink-500 text-slate-800 dark:text-slate-100`}
              />
            </div>

            {/* Add Card Form Modal / Expandable */}
            {isAddingCard && (
              <div className="p-3 rounded-2xl border border-pink-200 dark:border-pink-900/50 bg-pink-50/50 dark:bg-pink-950/20 space-y-2.5">
                <div className="text-xs font-bold text-pink-900 dark:text-pink-200">
                  {isAr ? 'إضافة كرت إهداء جديد' : 'Add New Gift Card Design'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    value={newCardTitleEn}
                    onChange={(e) => setNewCardTitleEn(e.target.value)}
                    placeholder={isAr ? 'عنوان الكرت (English)' : 'Title (English)'}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={newCardTitleAr}
                    onChange={(e) => setNewCardTitleAr(e.target.value)}
                    placeholder={isAr ? 'عنوان الكرت (العربية)' : 'Title (Arabic)'}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <select
                    value={newCardCategory}
                    onChange={(e) => setNewCardCategory(e.target.value)}
                    className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Celebration">{isAr ? 'مناسبات عامة' : 'Celebration'}</option>
                    <option value="Special Moments">{isAr ? 'لحظات خاصة' : 'Special Moments'}</option>
                    <option value="VIP">{isAr ? 'VIP فاخر' : 'VIP'}</option>
                    <option value="Romantic">{isAr ? 'مشاعر ومحبة' : 'Romantic'}</option>
                  </select>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingCard(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCard}
                      className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold"
                    >
                      {isAr ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              {filteredCards.map((card, idx) => {
                const isSelected = selectedCardId === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-pink-500 ring-2 ring-pink-500/20 bg-pink-50/40 dark:bg-pink-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300'
                    }`}
                  >
                    <div className="h-16 rounded-xl bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 dark:from-pink-950/60 dark:via-purple-950/50 dark:to-slate-800 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
                      <span className="text-xs font-black text-pink-700 dark:text-pink-300 line-clamp-2">
                        {isAr ? card.titleAr : card.titleEn}
                      </span>
                      <span className="text-[9px] text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                        {card.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[10px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {isAr ? `تصميم ${idx + 1}` : `Card Design ${idx + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(card.id);
                        }}
                        className="opacity-60 hover:opacity-100 text-red-500 hover:text-red-700 p-0.5"
                        title={isAr ? 'حذف الكرت' : 'Delete card'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gift Options Tabs (Gift Box, Packaging, Messages, Products) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? 'خيارات الهدايا والتغليف' : 'Gift Options'}
              </span>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedSubTab('boxes')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                  selectedSubTab === 'boxes'
                    ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {isAr ? 'الصناديق' : 'Gift Box'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSubTab('packaging')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                  selectedSubTab === 'packaging'
                    ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {isAr ? 'التغليف' : 'Packaging'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSubTab('messages')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                  selectedSubTab === 'messages'
                    ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {isAr ? 'الرسائل' : 'Messages'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSubTab('products')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all ${
                  selectedSubTab === 'products'
                    ? 'bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {isAr ? 'المنتجات' : 'Products'}
              </button>
            </div>

            {/* Boxes list */}
            {selectedSubTab === 'boxes' && (
              <div className="grid grid-cols-3 gap-2">
                {(giftingData?.boxes || []).map((box) => {
                  const isSelected = selectedBoxId === box.id;
                  return (
                    <div
                      key={box.id}
                      onClick={() => setSelectedBoxId(box.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 ring-2 ring-pink-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1.5">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                        {isAr ? box.nameAr : box.nameEn}
                      </div>
                      <div className="text-[10px] font-extrabold text-pink-600 dark:text-pink-400 mt-0.5">
                        +{money(box.price)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Packaging tab */}
            {selectedSubTab === 'packaging' && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white">
                  {isAr ? 'خيارات التغليف الفاخر والشريط' : 'Luxury Ribbon & Wrapping'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'يتم تخصيص ألوان الشرائط وبطاقات الإهداء بما يتناسب مع هوية متجركم.'
                    : 'Ribbon shades and tissue wrap automatically harmonize with your store palette.'}
                </p>
              </div>
            )}

            {/* Messages tab */}
            {selectedSubTab === 'messages' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  {isAr ? 'رسالة الإهداء الافتراضية' : 'Default Store Sample Message'}
                </label>
                <textarea
                  rows={2}
                  value={isAr ? giftingData?.sample_message?.ar : giftingData?.sample_message?.en}
                  onChange={(e) => {
                    const text = e.target.value;
                    setGiftingData((prev) =>
                      prev
                        ? {
                            ...prev,
                            sample_message: {
                              ...prev.sample_message,
                              [isAr ? 'ar' : 'en']: text,
                            },
                          }
                        : prev
                    );
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none text-slate-800 dark:text-slate-100"
                />
              </div>
            )}

            {/* Products tab */}
            {selectedSubTab === 'products' && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  {isAr ? 'المنتجات المؤهلة للإهداء' : 'Eligible Gift Catalog'}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr
                    ? `مفعل تلقائياً لجميع منتجات متجر ${activeStore.name} (${currentProducts?.length || 0} منتج).`
                    : `Active across all catalog items for ${activeStore.name} (${currentProducts?.length || 0} products).`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* PILLAR 2: Customer Gift Purchase Experience               */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          {/* Pillar 2 Header */}
          <div className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="w-8 h-8 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-sm font-black shrink-0">
              2
            </span>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {isAr ? 'تجربة إهداء العميل في المتجر' : 'Customer Gift Purchase Experience'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'تجربة سلسة وبسيطة للعميل لإرسال الهدايا'
                  : 'A seamless and simple experience for your customer.'}
              </p>
            </div>
          </div>

          {/* 5 Steps Guide Badge Row */}
          <div className="grid grid-cols-5 gap-1.5 py-1 text-center">
            {[
              { num: '1', label: isAr ? 'اختيار' : 'Product' },
              { num: '2', label: isAr ? 'المستلم' : 'Recipient' },
              { num: '3', label: isAr ? 'الكرت' : 'Card' },
              { num: '4', label: isAr ? 'التغليف' : 'Box' },
              { num: '5', label: isAr ? 'المرسل' : 'Sender' },
            ].map((step) => (
              <div
                key={step.num}
                className="p-1.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40"
              >
                <div className="w-4 h-4 mx-auto rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center">
                  {step.num}
                </div>
                <div className="text-[9px] font-bold text-slate-600 dark:text-slate-300 mt-1 truncate">
                  {step.label}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Mobile/Cart Mockup Card */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3.5 shadow-xs">
            {/* Real Product Row */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
              <img
                src={previewProduct.image}
                alt={previewProduct.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-800"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300">
                    <Gift className="w-2.5 h-2.5" />
                    <span>{isAr ? 'هذا المنتج هدية' : 'This is a gift'}</span>
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">
                  {previewProduct.name}
                </div>
                <div className="text-[11px] font-black text-purple-600 dark:text-purple-400">
                  {money(previewProduct.price)}
                </div>
              </div>
            </div>

            {/* Step 1: Recipient Information */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <span>1.</span>
                <span>{isAr ? 'بيانات المستلم' : 'Recipient Information'}</span>
              </span>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder={isAr ? 'اسم المستلم (مثال: فاطمة أحمد)' : 'Recipient Name'}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder={isAr ? 'رقم هاتف المستلم' : 'Recipient Phone Number'}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder={isAr ? 'عنوان التوصيل' : 'Delivery Address'}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Step 2: Gift Card & Message */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <span>2.</span>
                <span>{isAr ? 'كرت ورسالة الإهداء' : 'Gift Card & Message'}</span>
              </span>

              {/* Miniature Card Selector */}
              <div className="grid grid-cols-3 gap-1.5">
                {(giftingData?.cards || []).slice(0, 3).map((c) => {
                  const isSelected = selectedCardId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCardId(c.id)}
                      className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-100/40 dark:bg-purple-950/40 ring-1 ring-purple-600'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="h-9 rounded-lg bg-gradient-to-r from-pink-200 to-purple-200 dark:from-pink-950 dark:to-purple-950 flex items-center justify-center p-1 text-[9px] font-bold text-purple-800 dark:text-purple-200 truncate">
                        {isAr ? c.titleAr : c.titleEn}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Textarea */}
              <div className="relative">
                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={isAr ? 'اكتب رسالة الإهداء الخاصة بك...' : 'Your message (optional)...'}
                  maxLength={giftingData?.max_message_length || 250}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none text-slate-800 dark:text-slate-100"
                />
                <span className={`text-[9px] text-slate-400 absolute bottom-2 ${isAr ? 'left-2' : 'right-2'}`}>
                  {customMessage.length}/{giftingData?.max_message_length || 250}
                </span>
              </div>
            </div>

            {/* Step 3: Gift Box & Packaging */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <span>3.</span>
                <span>{isAr ? 'صندوق التغليف' : 'Gift Box & Packaging'}</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(giftingData?.boxes || []).slice(0, 3).map((b) => {
                  const isSelected = selectedBoxId === b.id;
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => setSelectedBoxId(b.id)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600 text-white font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-[10px] truncate">{isAr ? b.nameAr : b.nameEn}</div>
                      <div className={`text-[9px] ${isSelected ? 'text-purple-200' : 'text-purple-600 dark:text-purple-400'}`}>
                        +{money(b.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Sender Name Option (Anonymous Surprise) */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
                {isAr ? 'خيار اسم المرسل' : 'Sender Name Option'}
              </span>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="senderOption"
                    checked={!isAnonymous}
                    onChange={() => setIsAnonymous(false)}
                    className="accent-purple-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    {isAr ? 'إظهار اسمي' : 'Show my name'}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="senderOption"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(true)}
                    className="accent-purple-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
                    <EyeOff className="w-3 h-3" />
                    <span>{isAr ? 'إهداء مجهول (مفاجأة)' : 'Keep it hidden (anonymous)'}</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Mockup Add to Cart Button */}
            <button
              type="button"
              onClick={() => {
                toast(
                  isAr
                    ? `تمت محاكاة إضافة هدية ${previewProduct.name} إلى السلة بنجاح!`
                    : `Simulated adding ${previewProduct.name} gift to cart!`,
                  'success'
                );
              }}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة إلى السلة كهدية' : 'Add to Cart as a Gift'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PILLAR 3: Gift Order Management                           */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          {/* Pillar 3 Header */}
          <div className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="w-8 h-8 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center text-sm font-black shrink-0">
              3
            </span>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {isAr ? 'إدارة طلبات الهدايا' : 'Gift Order Management'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'حفظ بيانات المستلم، خيارات الهدايا وتتبع التوصيل'
                  : 'Save recipient details, gift options and manage delivery information.'}
              </p>
            </div>
          </div>

          {/* Feature checklist */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? 'حفظ بيانات المستلم' : 'Save Recipient Data'}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isAr ? 'مواعيد التوصيل' : 'Delivery Schedule'}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-pink-600" />
              <span>{isAr ? 'عرض إداري داخلي' : 'Internal View Only'}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'تتبع مسار الطلب' : 'Order Tracking'}</span>
            </div>
          </div>

          {/* Real Order Details Section */}
          {activeOrder ? (
            <div className="space-y-3.5 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              {/* Order Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    {activeOrder.order_number}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {activeOrder.date}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                  {isAr ? 'جاري التجهيز' : 'Processing'}
                </span>
              </div>

              {/* Product inside order */}
              <div className="flex items-center gap-3 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
                <img
                  src={previewProduct.image}
                  alt={previewProduct.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-800"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {previewProduct.name}
                  </div>
                  <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                    {money(activeOrder.total_amount || previewProduct.price)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {isAr ? 'خيار الهدية:' : 'Gift Option:'} {isAr ? currentSelectedBox.nameAr : currentSelectedBox.nameEn}
                  </div>
                </div>
              </div>

              {/* Message block */}
              <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-200">
                <span className="font-bold block mb-0.5">{isAr ? 'نص رسالة الإهداء:' : 'Gift Message:'}</span>
                <p className="italic">"{customMessage || (isAr ? 'أجمل التهاني وأطيب التمنيات لكم!' : 'Warmest wishes from the heart!')}"</p>
              </div>

              {/* Recipient info */}
              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isAr ? 'بيانات المستلم' : 'Recipient'}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="font-semibold">{activeOrder.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span dir="ltr">{activeOrder.customer_phone || '+966 50 123 4567'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{activeOrder.delivery_location || (isAr ? 'مكة المكرمة، شارع العزيزية' : 'Makkah, Al Aziziyah District')}</span>
                </div>
              </div>

              {/* Sender privacy status */}
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs">
                <EyeOff className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isAr ? 'اسم المرسل مخفي عن المستلم' : 'Hidden from recipient'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isAr
                      ? 'يظهر لإدارة المتجر فقط وسجلات الدفع المعتمدة.'
                      : 'Visible to store staff and in payment records only.'}
                  </div>
                </div>
              </div>

              {/* Delivery info */}
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {isAr ? 'موعد التوصيل المحدد' : 'Scheduled Delivery'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isAr ? 'اليوم، 4:00 م - 8:00 م' : 'Today, 4:00 PM - 8:00 PM'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toast(isAr ? 'جاري فتح خريطة التوصيل' : 'Opening delivery map', 'info')}
                  className="text-[11px] font-bold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{isAr ? 'عرض الخريطة' : 'View Map'}</span>
                </button>
              </div>

              {/* View Order Details button */}
              <button
                type="button"
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab('orders');
                  } else {
                    toast(isAr ? 'الانتقال إلى تفاصيل الطلب...' : 'Navigating to order details...', 'info');
                  }
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض تفاصيل الطلب بالكامل' : 'View Full Order Details'}</span>
              </button>
            </div>
          ) : (
            /* Genuine Empty State if No Orders Exist */
            <div className="p-8 text-center rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <Gift className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr
                  ? `لا توجد طلبات إهداء مسجلة حتى الآن لمتجر ${activeStore.name}`
                  : `No gift orders recorded yet for ${activeStore.name}`}
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {isAr
                  ? 'عندما يقوم عملاؤك بطلب منتج كهدية، ستظهر بيانات المستلم وجدول التوصيل هنا فوراً.'
                  : 'When customers place gift orders, recipient addresses and scheduled deliveries will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4 Bottom Reference Specification Cards                    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {/* Card 1: Database Requirements */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-bold text-xs">
            <Database className="w-4 h-4" />
            <span>{isAr ? 'متطلبات قاعدة البيانات' : 'Database Requirements'}</span>
          </div>
          <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>{isAr ? 'حفظ إعدادات الهدايا في Hostinger MySQL' : 'Store gift settings (cards, boxes, prices).'}</li>
            <li>{isAr ? 'ربط المنتجات بخيارات الإهداء' : 'Store product-gift relationships.'}</li>
            <li>{isAr ? 'حفظ بيانات المستلم وعناوين الشحن' : 'Save recipient data with orders.'}</li>
            <li>{isAr ? 'تتبع حالة وتاريخ تجهيز الهدية' : 'Keep gift order details & timestamps.'}</li>
          </ul>
        </div>

        {/* Card 2: Validation & Business Rules */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
            <Sliders className="w-4 h-4" />
            <span>{isAr ? 'قواعد التحقق والأعمال' : 'Validation & Business Rules'}</span>
          </div>
          <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>{isAr ? 'التحقق من أسعار المنتجات وصحة مناطق الشحن' : 'Validate product prices and delivery zones.'}</li>
            <li>{isAr ? 'التحقق من توفر الصناديق والمخزون' : 'Verify gift options (stock, availability).'}</li>
            <li>{isAr ? 'تأكيد صيغة رقم هاتف المستلم' : 'Ensure correct recipient phone format.'}</li>
            <li>{isAr ? 'حساب الرسوم الإضافية للتغليف بدقة' : 'Apply packaging fees securely on server.'}</li>
          </ul>
        </div>

        {/* Card 3: Privacy & Security */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? 'الخصوصية والأمان' : 'Privacy & Security'}</span>
          </div>
          <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>{isAr ? 'إخفاء اسم المرسل عن المستلم في الهدايا المجهولة' : 'Hide sender name in anonymous gifting mode.'}</li>
            <li>{isAr ? 'حماية بيانات المستلم وفق المعايير السعودية' : 'Protect recipient contact & address data.'}</li>
            <li>{isAr ? 'سجلات تدقيق للوصول لمعلومات الطلبات' : 'Secure audit logging for store staff access.'}</li>
            <li>{isAr ? 'عزل تام لكل متجر عبر store_id' : 'Strict multi-tenant store_id isolation.'}</li>
          </ul>
        </div>

        {/* Card 4: Testing Checklist */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
            <FileCheck className="w-4 h-4" />
            <span>{isAr ? 'قائمة التحقق والاختبار' : 'Testing Checklist'}</span>
          </div>
          <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>{isAr ? 'اختبار إضافة وتعديل كروت الإهداء' : 'Test custom card designs and deletion.'}</li>
            <li>{isAr ? 'التحقق من رسائل الإهداء ثنائية اللغة' : 'Verify bilingual message templates.'}</li>
            <li>{isAr ? 'فحص تجربة العميل وعزل المتاجر' : 'Validate live product preview & tenant isolation.'}</li>
            <li>{isAr ? 'تأكيد حفظ الإعدادات في قاعدة البيانات' : 'Ensure persistence via Hostinger MySQL.'}</li>
          </ul>
        </div>
      </div>

      {/* Footer Quote */}
      <div className="text-center py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
        <span>{isAr ? 'معاً، نجعل كل هدية ذكرى لا تُنسى 💖' : 'Together, we make every gift special 💖'}</span>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Menu,
  LayoutGrid,
  SlidersHorizontal,
  MoreVertical,
  MoreHorizontal,
  Sparkles,
  Flower2,
  ShoppingBag,
  Layers,
  AlignRight,
  AlignLeft,
  Compass,
  Zap,
  Heart,
  Flame,
  ShieldCheck,
  Star,
  MessageCircle,
  Truck,
  Package,
  X,
  Search,
  Check,
} from 'lucide-react';

export interface IconItem {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AVAILABLE_ICONS: IconItem[] = [
  // Mobile Menu Toggles
  { id: 'menu', name: 'Classic Hamburger (3-Lines)', category: 'Header Toggle', icon: Menu },
  { id: 'grid', name: 'Modern App Grid (4-Dots)', category: 'Header Toggle', icon: LayoutGrid },
  { id: 'sliders', name: 'Sliders Horizontal (Filters)', category: 'Header Toggle', icon: SlidersHorizontal },
  { id: 'more-v', name: 'Kebab 3-Dots Vertical', category: 'Header Toggle', icon: MoreVertical },
  { id: 'more-h', name: 'Meatball 3-Dots Horizontal', category: 'Header Toggle', icon: MoreHorizontal },
  { id: 'align-r', name: 'Align Right Editorial', category: 'Header Toggle', icon: AlignRight },
  { id: 'align-l', name: 'Align Left Editorial', category: 'Header Toggle', icon: AlignLeft },

  // Boutique & Brand Icons
  { id: 'flower', name: 'Flower Boutique Bloom', category: 'Brand & Boutique', icon: Flower2 },
  { id: 'sparkles', name: 'VIP Sparkles & Magic', category: 'Brand & Boutique', icon: Sparkles },
  { id: 'shopping-bag', name: 'Luxury Shopping Bag', category: 'Commerce', icon: ShoppingBag },
  { id: 'package', name: 'Luxury Gift Hamper Box', category: 'Commerce', icon: Package },
  { id: 'layers', name: 'Stacked Layers', category: 'Interface', icon: Layers },
  { id: 'compass', name: 'Sacred Compass', category: 'Interface', icon: Compass },
  { id: 'zap', name: 'Express Speed Flash', category: 'Features', icon: Zap },
  { id: 'truck', name: 'Chilled Express Delivery', category: 'Features', icon: Truck },
  { id: 'shield', name: 'Verified Guarantee Shield', category: 'Features', icon: ShieldCheck },
  { id: 'star', name: 'Royal 5-Star Rating', category: 'Features', icon: Star },
  { id: 'heart', name: 'Valentine Romantic Heart', category: 'Features', icon: Heart },
  { id: 'flame', name: 'Hot Seasonal Offer', category: 'Features', icon: Flame },
  { id: 'chat', name: 'Live WhatsApp Concierge', category: 'Features', icon: MessageCircle },
];

interface IconLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIconId: string;
  onSelectIcon: (iconId: string) => void;
  isAr: boolean;
  title?: string;
}

export const IconLibraryModal: React.FC<IconLibraryModalProps> = ({
  isOpen,
  onClose,
  selectedIconId,
  onSelectIcon,
  isAr,
  title,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  if (!isOpen) return null;

  const categories = ['All', 'Header Toggle', 'Brand & Boutique', 'Commerce', 'Features'];

  const filtered = AVAILABLE_ICONS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-black text-sm text-slate-900">
              {title || (isAr ? 'مكتبة الأيقونات المتقدمة (FontAwesome & Lucide)' : 'Icon Library Selector')}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isAr
                ? 'اختر الأيقونة المناسبة لزر القائمة أو الأزرار التفاعلية'
                : 'Select an icon for your mobile navigation toggle or interactive buttons'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAr ? 'بحث عن أيقونة بالاسم...' : 'Search icon by name...'}
              className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const IconComp = item.icon;
            const isSelected = selectedIconId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectIcon(item.id);
                  onClose();
                }}
                className={`p-3 rounded-2xl border text-start flex items-center gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200 font-bold shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs truncate block font-bold">{item.name}</span>
                  <span className="text-[10px] text-slate-400 block">{item.category}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

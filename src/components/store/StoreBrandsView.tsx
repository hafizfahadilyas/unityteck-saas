import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Edit,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  Paperclip,
  Hash,
  Calendar,
  ListFilter,
  ToggleLeft,
  ToggleRight,
  X,
  Tag,
  Boxes,
  Upload,
  Trash2,
  HelpCircle,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { AdminPageShell } from '../common/AdminPageHeader';
import { useToast } from '../common/ToastProvider';
import { PageDocsGuideModal } from '../common/PageDocsGuideModal';
import { bumpStore } from '../../api/cacheTags';

export interface BrandItem {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description: string;
  descriptionAr?: string;
  descriptionEn?: string;
  logo: string;
  productsCount: number;
  showInChannels: boolean;
  status: 'active' | 'inactive';
}

export interface CustomFieldItem {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  type: 'Text' | 'File' | 'Number' | 'Date' | 'Single Select';
  appliedTo: string;
  appliedToAr?: string;
  appliedToEn?: string;
  showToCustomer: boolean;
  status: 'active' | 'inactive';
}

import { useTenant } from '../../context/TenantContext';
import { CAR_BRANDS } from '../../data/blecoStoreData';

/**
 * Resilient Brand Logo Image with automatic fallback to monogram badge
 * Prevents broken image icons and overflowing jagged text
 */
export const BrandLogoImage: React.FC<{
  logo: string;
  name: string;
  className?: string;
}> = ({ logo, name, className = 'w-full h-full object-contain' }) => {
  const [hasError, setHasError] = useState(false);
  const initials = useMemo(() => {
    return (name || '')
      .replace(/[\(\)\[\]]/g, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  }, [name]);

  if (hasError || !logo || logo.includes('unsplash.com')) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 via-orange-500/15 to-amber-600/20 text-amber-800 dark:text-amber-300 font-black text-xs rounded-lg select-none p-1 text-center border border-amber-500/20">
        {initials || <Tag className="w-4 h-4" />}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={name ? `${name} logo` : 'Brand logo'}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};

// ── FLOWER STORE SEED (store-1: Hadaya Mecca Flowers) ─────────────────────────
export const FLOWER_STORE_BRANDS: BrandItem[] = [
  {
    id: 'b1',
    name: 'Hadaya Mecca Signature',
    nameEn: 'Hadaya Mecca Signature',
    nameAr: 'هدايا مكة سيغنتشر',
    description: 'Exclusive flower collections, Dutch royal peonies and premium red roses.',
    descriptionEn: 'Exclusive flower collections, Dutch royal peonies and premium red roses.',
    descriptionAr: 'تشكيلات الزهور الحصرية وباقات البيوني والجوري الهولندي الملكي…',
    logo: 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png',
    productsCount: 12,
    showInChannels: true,
    status: 'active',
  },
  {
    id: 'b2',
    name: 'Patchi & Mecca Blooms',
    nameEn: 'Patchi & Mecca Blooms',
    nameAr: 'باتشي وهدايا مكة',
    description: 'Official luxury Lebanese chocolates crafted with natural Makkah roses.',
    descriptionEn: 'Official luxury Lebanese chocolates crafted with natural Makkah roses.',
    descriptionAr: 'تنسيقات الشوكولاتة اللبنانية الفاخرة المعتمدة مع ورود مكة الطبيعية…',
    logo: 'https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png',
    productsCount: 8,
    showInChannels: true,
    status: 'active',
  },
  {
    id: 'b3',
    name: 'Bostani & Mecca Blooms',
    nameEn: 'Bostani & Mecca Blooms',
    nameAr: 'بستاني وهدايا مكة',
    description: 'Premium Belgian chocolate and luxury truffles paired with fresh floral boxes.',
    descriptionEn: 'Premium Belgian chocolate and luxury truffles paired with fresh floral boxes.',
    descriptionAr: 'أرقى أنواع الشوكولاتة البلجيكية والترافل الفاخر مع بوكسات الورد…',
    logo: 'https://cdn.salla.sa/form-builder/JEDxluyY7LbYdo5So7sLrPqqupntM3LUhIxV3gXD.png',
    productsCount: 6,
    showInChannels: true,
    status: 'active',
  },
  {
    id: 'b4',
    name: 'Hadaya Mecca Bakery & Florist',
    nameEn: 'Hadaya Mecca Bakery & Florist',
    nameAr: 'كيك وزهور هدايا مكة',
    description: 'Artisan Korean lunchbox cakes and red velvet event cakes with hand bouquets.',
    descriptionEn: 'Artisan Korean lunchbox cakes and red velvet event cakes with hand bouquets.',
    descriptionAr: 'كيك كوري خاص وكعكات الريد فيلفت والمناسبات مع باقات اليد…',
    logo: 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png',
    productsCount: 5,
    showInChannels: true,
    status: 'active',
  },
  {
    id: 'b5',
    name: 'Hadaya Mecca Crystal',
    nameEn: 'Hadaya Mecca Crystal',
    nameAr: 'كريستال وفازات هدايا مكة',
    description: 'Bohemian crystal vases and modern fluted ceramic vessels with fresh flowers.',
    descriptionEn: 'Bohemian crystal vases and modern fluted ceramic vessels with fresh flowers.',
    descriptionAr: 'فازات كريستال بوهيمي وأواني السيراميك المضلعة العصرية مع الورد…',
    logo: 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png',
    productsCount: 6,
    showInChannels: true,
    status: 'active',
  },
  {
    id: 'b6',
    name: 'Hadaya Mecca Heritage',
    nameEn: 'Hadaya Mecca Heritage',
    nameAr: 'تراث ومواجيب هدايا مكة',
    description: 'Handcrafted wooden Mawajeeb plaques, Arabic coffee pots and stuffed dates.',
    descriptionEn: 'Handcrafted wooden Mawajeeb plaques, Arabic coffee pots and stuffed dates.',
    descriptionAr: 'لوحات مواجيب خشبية محفورة، دلال القهوة العربية والتمور المحشوة…',
    logo: 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp',
    productsCount: 4,
    showInChannels: true,
    status: 'active',
  },
  {
    id: 'b7',
    name: 'Hadaya Mecca Executive',
    nameEn: 'Hadaya Mecca Executive',
    nameAr: 'أطقم هدايا مكة الملكية',
    description: 'VIP royal gift hampers for men and women with perfumes, jewelry and watches.',
    descriptionEn: 'VIP royal gift hampers for men and women with perfumes, jewelry and watches.',
    descriptionAr: 'أطقم الهدايا الفاخرة للرجال والسيدات مع العطور والمجوهرات والساعات…',
    logo: '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg',
    productsCount: 4,
    showInChannels: true,
    status: 'active',
  },
];

export const FLOWER_CUSTOM_FIELDS: CustomFieldItem[] = [
  {
    id: 'cf-flw-1',
    name: 'Greeting Card Message',
    nameEn: 'Greeting Card Message',
    nameAr: 'رسالة كرت الإهداء',
    type: 'Text',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-flw-2',
    name: 'Preferred Flower Color',
    nameEn: 'Preferred Flower Color',
    nameAr: 'لون الورد المفضل',
    type: 'Single Select',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-flw-3',
    name: 'Delivery Time Slot',
    nameEn: 'Delivery Time Slot',
    nameAr: 'فترة التوصيل',
    type: 'Single Select',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-flw-4',
    name: 'Ribbon Color',
    nameEn: 'Ribbon Color',
    nameAr: 'لون شريط الساتان',
    type: 'Single Select',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-flw-5',
    name: 'Delivery Date',
    nameEn: 'Delivery Date',
    nameAr: 'تاريخ المناسبة',
    type: 'Date',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-flw-6',
    name: 'Custom Attachment Card',
    nameEn: 'Custom Attachment Card',
    nameAr: 'صورة أو بطاقة خاصة',
    type: 'File',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
];

// ── CAR STORE SEED (store-bleco: Al-Saeedi Car Services / Saudia Transport) ──
export const CAR_STORE_BRANDS: BrandItem[] = CAR_BRANDS.map((cb) => ({
  id: `brand-car-${cb.id}`,
  name: cb.nameEn,
  nameEn: cb.nameEn,
  nameAr: cb.nameAr,
  description: `Official ${cb.nameEn} agency — precision laser upholstery & 5D floor mats for all models.`,
  descriptionEn: `Official ${cb.nameEn} agency — precision laser upholstery & 5D floor mats for all models.`,
  descriptionAr: `وكالة وماركة ${cb.nameAr} الرسمية — تفصيل وتلبيس مقاعد ليزري وأرضيات 5D لجميع الموديلات والفئات.`,
  logo: cb.logo,
  productsCount: cb.productCount || 4,
  showInChannels: true,
  status: 'active',
}));

export const CAR_CUSTOM_FIELDS: CustomFieldItem[] = [
  {
    id: 'cf-car-1',
    name: 'Vehicle Make & Brand',
    nameEn: 'Vehicle Make & Brand',
    nameAr: 'ماركة وصانع السيارة',
    type: 'Single Select',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-car-2',
    name: 'Model & Production Year',
    nameEn: 'Model & Production Year',
    nameAr: 'موديل وسنة الصنع',
    type: 'Text',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-car-3',
    name: 'Leather Grade',
    nameEn: 'Leather Grade',
    nameAr: 'نوع وجودة الجلد',
    type: 'Single Select',
    appliedTo: 'Seat Upholstery & Covers',
    appliedToEn: 'Seat Upholstery & Covers',
    appliedToAr: 'تنجيد وتلابيس المقاعد',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-car-4',
    name: 'Laser Stitching Color',
    nameEn: 'Laser Stitching Color',
    nameAr: 'لون خياطة وتطريز الليزر',
    type: 'Single Select',
    appliedTo: 'Seat Upholstery & Covers',
    appliedToEn: 'Seat Upholstery & Covers',
    appliedToAr: 'تنجيد وتلابيس المقاعد',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-car-5',
    name: 'Custom Logo/Name Embroidery',
    nameEn: 'Custom Logo/Name Embroidery',
    nameAr: 'تطريز اسم أو شعار خاص',
    type: 'Text',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-car-6',
    name: 'Current Interior Photo',
    nameEn: 'Current Interior Photo',
    nameAr: 'صورة مقاعد السيارة من الداخل',
    type: 'File',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
];

// ── COFFEE STORE SEED (store-coffee: Specialty Coffee Roasters) ───────────────
export const COFFEE_STORE_BRANDS: BrandItem[] = [
  {
    id: 'b-cof-1',
    name: 'Hario Japan',
    nameEn: 'Hario Japan',
    nameAr: 'هاريو اليابان',
    description: 'V60 heat-resistant drip equipment, filters, and glass servers crafted in Japan.',
    descriptionEn: 'V60 heat-resistant drip equipment, filters, and glass servers crafted in Japan.',
    descriptionAr: 'أدوات تقطير V60 وفلاتر وسيرفرات زجاجية مقاومة للحرارة مصنوعة في اليابان.',
    logo: '/images/coffee-brands/hario.svg',
    productsCount: 5,
    showInChannels: true,
    status: 'active',
  },
  {
    id: 'b-cof-2',
    name: 'Chemex USA',
    nameEn: 'Chemex USA',
    nameAr: 'كيمكس الأمريكية',
    description: 'Iconic hourglass pour-over glass brewers with wood collar and rawhide tie.',
    descriptionEn: 'Iconic hourglass pour-over glass brewers with wood collar and rawhide tie.',
    descriptionAr: 'أدوات تحضير القهوة المقطرة الكلاسيكية بتصميم فني زجاجي أيقوني.',
    logo: '/images/coffee-brands/chemex.svg',
    productsCount: 4,
    showInChannels: true,
    status: 'active',
  },
  {
    id: 'b-cof-3',
    name: 'Fellow Products',
    nameEn: 'Fellow Products',
    nameAr: 'فيلو برودكتس',
    description: 'Precision Stagg EKG smart kettles and Ode Gen 2 burr grinders for specialty coffee.',
    descriptionEn: 'Precision Stagg EKG smart kettles and Ode Gen 2 burr grinders for specialty coffee.',
    descriptionAr: 'غلايات ستاج الذكية ومطاحن القهوة الأود الفاخرة للقهوة المختصة.',
    logo: '/images/coffee-brands/fellow.svg',
    productsCount: 4,
    showInChannels: true,
    status: 'active',
  },
  {
    id: 'b-cof-4',
    name: 'AeroPress',
    nameEn: 'AeroPress',
    nameAr: 'آيروبرس',
    description: 'Rapid air-pressure immersion coffee press for smooth, rich espresso-style brews.',
    descriptionEn: 'Rapid air-pressure immersion coffee press for smooth, rich espresso-style brews.',
    descriptionAr: 'أداة الضغط الهوائي السريعة لاستخلاص القهوة المركزة في السفر والمنزل.',
    logo: '/images/coffee-brands/aeropress.svg',
    productsCount: 3,
    showInChannels: true,
    status: 'active',
  },
  {
    id: 'b-cof-5',
    name: 'Comandante',
    nameEn: 'Comandante',
    nameAr: 'كوماندانتي',
    description: 'Ultra-precise German hand grinders engineered with Nitro Blade conical burrs.',
    descriptionEn: 'Ultra-precise German hand grinders engineered with Nitro Blade conical burrs.',
    descriptionAr: 'مطاحن يدوية دقيقة بحجر طحن نيترو بليد ألماني فائق الحدة.',
    logo: '/images/coffee-brands/comandante.svg',
    productsCount: 3,
    showInChannels: true,
    status: 'active',
  },
  {
    id: 'b-cof-6',
    name: 'La Marzocco',
    nameEn: 'La Marzocco',
    nameAr: 'لامارزوكو الإيطالية',
    description: 'Florentine handcrafted commercial & home espresso machines with dual boilers.',
    descriptionEn: 'Florentine handcrafted commercial & home espresso machines with dual boilers.',
    descriptionAr: 'مكائن الإسبريسو الإيطالية التجارية الفاخرة للمقاهي والمحترفين.',
    logo: '/images/coffee-brands/lamarzocco.svg',
    productsCount: 2,
    showInChannels: true,
    status: 'active',
  },
];

export const COFFEE_CUSTOM_FIELDS: CustomFieldItem[] = [
  {
    id: 'cf-cof-1',
    name: 'Bean Origin',
    nameEn: 'Bean Origin',
    nameAr: 'بلد منشأ البن',
    type: 'Single Select',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-cof-2',
    name: 'Roast Level',
    nameEn: 'Roast Level',
    nameAr: 'درجة التحميص',
    type: 'Single Select',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-cof-3',
    name: 'Grind Size',
    nameEn: 'Grind Size',
    nameAr: 'نوع الطحن',
    type: 'Single Select',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-cof-4',
    name: 'Processing Method',
    nameEn: 'Processing Method',
    nameAr: 'المعالجة',
    type: 'Single Select',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-cof-5',
    name: 'Roast Date',
    nameEn: 'Roast Date',
    nameAr: 'تاريخ التحميص',
    type: 'Date',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
  {
    id: 'cf-cof-6',
    name: 'Altitude MASL',
    nameEn: 'Altitude MASL',
    nameAr: 'الارتفاع بالمتر',
    type: 'Number',
    appliedTo: 'All Products',
    appliedToEn: 'All Products',
    appliedToAr: 'جميع المنتجات',
    showToCustomer: true,
    status: 'active',
  },
];

// Backwards compatibility export
export const INITIAL_BRANDS = FLOWER_STORE_BRANDS;
export const INITIAL_CUSTOM_FIELDS = FLOWER_CUSTOM_FIELDS;

export function getStoreBrands(storeId: string, storeSlug?: string, category?: string): BrandItem[] {
  try {
    const saved = localStorage.getItem(`unityteck_store_brands_${storeId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade stale unsplash links or unlocalized records
        const hasBrokenUnsplash = parsed.some((p: any) => p.logo && (p.logo.includes('unsplash.com') || !p.nameEn));
        if (!hasBrokenUnsplash) return parsed;
      }
    }
  } catch {}

  const sid = (storeId || '').toLowerCase();
  const slug = (storeSlug || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  if (sid === 'store-bleco' || slug.includes('bleco') || slug.includes('car') || cat.includes('car') || cat.includes('auto')) {
    return CAR_STORE_BRANDS;
  }
  if (sid === 'store-coffee' || slug.includes('coffee') || slug.includes('hibrew') || cat.includes('coffee')) {
    return COFFEE_STORE_BRANDS;
  }
  if (sid === 'store-1' || slug.includes('flower') || slug.includes('hadaya') || cat.includes('flower') || cat.includes('gift')) {
    return FLOWER_STORE_BRANDS;
  }
  // Rule 1: Genuine empty state for any other store — never force mock flowers!
  return [];
}

export function getStoreCustomFields(storeId: string, storeSlug?: string, category?: string): CustomFieldItem[] {
  try {
    const saved = localStorage.getItem(`unityteck_store_custom_fields_${storeId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasUnlocalized = parsed.some((p: any) => !p.nameEn || p.name.includes('('));
        if (!hasUnlocalized) return parsed;
      }
    }
  } catch {}

  const sid = (storeId || '').toLowerCase();
  const slug = (storeSlug || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  if (sid === 'store-bleco' || slug.includes('bleco') || slug.includes('car') || cat.includes('car') || cat.includes('auto')) {
    return CAR_CUSTOM_FIELDS;
  }
  if (sid === 'store-coffee' || slug.includes('coffee') || slug.includes('hibrew') || cat.includes('coffee')) {
    return COFFEE_CUSTOM_FIELDS;
  }
  if (sid === 'store-1' || slug.includes('flower') || slug.includes('hadaya') || cat.includes('flower') || cat.includes('gift')) {
    return FLOWER_CUSTOM_FIELDS;
  }
  // Rule 1: Genuine empty state for any other store
  return [];
}

interface StoreBrandsViewProps {
  onBackToProducts: () => void;
}

export const StoreBrandsView: React.FC<StoreBrandsViewProps> = ({ onBackToProducts }) => {
  const { activeStore } = useTenant();
  const { t, locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  // Docs Guide Modal State
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Store-isolated Brands State with lifetime persistence
  const [brands, setBrands] = useState<BrandItem[]>(() =>
    getStoreBrands(activeStore.id, activeStore.slug, activeStore.category)
  );

  // Store-isolated Custom Fields State with lifetime persistence
  const [customFields, setCustomFields] = useState<CustomFieldItem[]>(() =>
    getStoreCustomFields(activeStore.id, activeStore.slug, activeStore.category)
  );

  // Sync state whenever activeStore changes
  React.useEffect(() => {
    setBrands(getStoreBrands(activeStore.id, activeStore.slug, activeStore.category));
    setCustomFields(getStoreCustomFields(activeStore.id, activeStore.slug, activeStore.category));
  }, [activeStore.id, activeStore.slug, activeStore.category]);

  // Filters for Brands
  const [searchBrand, setSearchBrand] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'products'>('newest');

  // Modals
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isEditBrandOpen, setIsEditBrandOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);

  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [isEditFieldOpen, setIsEditFieldOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldItem | null>(null);

  // New Brand Form State
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('');

  // Edit Brand Form State
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandDesc, setEditBrandDesc] = useState('');
  const [editBrandLogo, setEditBrandLogo] = useState('');
  const [editBrandStatus, setEditBrandStatus] = useState<'active' | 'inactive'>('active');
  const [editBrandChannels, setEditBrandChannels] = useState(true);

  // New Custom Field Form State
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFieldItem['type']>('Text');
  const [newFieldAppliedTo, setNewFieldAppliedTo] = useState('All Products');

  // Edit Custom Field Form State
  const [editFieldName, setEditFieldName] = useState('');
  const [editFieldType, setEditFieldType] = useState<CustomFieldItem['type']>('Text');
  const [editFieldAppliedTo, setEditFieldAppliedTo] = useState('All Products');
  const [editFieldShowToCust, setEditFieldShowToCust] = useState(true);
  const [editFieldStatus, setEditFieldStatus] = useState<'active' | 'inactive'>('active');

  // File input refs for logo upload
  const addLogoInputRef = useRef<HTMLInputElement>(null);
  const editLogoInputRef = useRef<HTMLInputElement>(null);

  const saveBrands = (next: BrandItem[]) => {
    setBrands(next);
    try {
      localStorage.setItem(`unityteck_store_brands_${activeStore.id}`, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('unityteck-brands-updated', { detail: { storeId: activeStore.id, brands: next } }));
    } catch {}
    bumpStore(activeStore.id, 'settings');
    bumpStore(activeStore.id, 'theme');
  };

  const saveCustomFields = (next: CustomFieldItem[]) => {
    setCustomFields(next);
    try {
      localStorage.setItem(`unityteck_store_custom_fields_${activeStore.id}`, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('unityteck-custom-fields-updated', { detail: { storeId: activeStore.id, fields: next } }));
    } catch {}
  };

  // Helper for reading uploaded image file into Base64 Data URL
  const handleLogoFileUpload = (file: File, callback: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      toast(isAr ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, SVG)' : 'Please select a valid image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        callback(e.target.result as string);
        toast(isAr ? 'تم رفع شعار العلامة التجارية بنجاح!' : 'Brand logo uploaded successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleBrandChannel = (id: string) => {
    const next = brands.map((b) => (b.id === id ? { ...b, showInChannels: !b.showInChannels } : b));
    saveBrands(next);
    toast(isAr ? 'تم تحديث الظهور في قنوات البيع' : 'Sales channel visibility updated', 'success');
  };

  const handleToggleBrandStatus = (id: string) => {
    const next = brands.map((b) =>
      b.id === id ? { ...b, status: b.status === 'active' ? ('inactive' as const) : ('active' as const) } : b
    );
    saveBrands(next);
    toast(isAr ? 'تم تغيير حالة العلامة التجارية' : 'Brand status updated', 'success');
  };

  const handleToggleFieldCustomer = (id: string) => {
    const next = customFields.map((f) => (f.id === id ? { ...f, showToCustomer: !f.showToCustomer } : f));
    saveCustomFields(next);
    toast(isAr ? 'تم تحديث الظهور للعملاء' : 'Customer visibility updated', 'success');
  };

  const handleToggleFieldStatus = (id: string) => {
    const next = customFields.map((f) =>
      f.id === id ? { ...f, status: f.status === 'active' ? ('inactive' as const) : ('active' as const) } : f
    );
    saveCustomFields(next);
    toast(isAr ? 'تم تغيير حالة الحقل المخصص' : 'Custom field status updated', 'success');
  };

  // Delete Brand
  const handleDeleteBrand = (id: string, name: string) => {
    if (window.confirm(isAr ? `هل أنت متأكد من حذف العلامة التجارية "${name}"؟` : `Are you sure you want to delete brand "${name}"?`)) {
      const next = brands.filter((b) => b.id !== id);
      saveBrands(next);
      toast(isAr ? 'تم حذف العلامة التجارية' : 'Brand deleted successfully', 'success');
    }
  };

  // Delete Custom Field
  const handleDeleteField = (id: string, name: string) => {
    if (window.confirm(isAr ? `هل أنت متأكد من حذف الحقل المخصص "${name}"؟` : `Are you sure you want to delete custom field "${name}"?`)) {
      const next = customFields.filter((f) => f.id !== id);
      saveCustomFields(next);
      toast(isAr ? 'تم حذف الحقل المخصص' : 'Custom field deleted successfully', 'success');
    }
  };

  // Open Edit Brand Modal
  const openEditBrandModal = (brand: BrandItem) => {
    setEditingBrand(brand);
    setEditBrandName(brand.name);
    setEditBrandDesc(brand.description);
    setEditBrandLogo(brand.logo);
    setEditBrandStatus(brand.status);
    setEditBrandChannels(brand.showInChannels);
    setIsEditBrandOpen(true);
  };

  // Open Edit Field Modal
  const openEditFieldModal = (field: CustomFieldItem) => {
    setEditingField(field);
    setEditFieldName(field.name);
    setEditFieldType(field.type);
    setEditFieldAppliedTo(field.appliedTo);
    setEditFieldShowToCust(field.showToCustomer);
    setEditFieldStatus(field.status);
    setIsEditFieldOpen(true);
  };

  // Submit Add Brand
  const handleAddBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    const newBrand: BrandItem = {
      id: `b-${Date.now()}`,
      name: newBrandName.trim(),
      description: newBrandDesc.trim() || 'Brand description…',
      logo: newBrandLogo.trim() || '',
      productsCount: 0,
      showInChannels: true,
      status: 'active',
    };
    saveBrands([newBrand, ...brands]);
    setIsAddBrandOpen(false);
    setNewBrandName('');
    setNewBrandDesc('');
    setNewBrandLogo('');
    toast(isAr ? 'تمت إضافة العلامة التجارية بنجاح' : 'Brand added successfully', 'success');
  };

  // Submit Edit Brand
  const handleEditBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editBrandName.trim()) return;
    const updated = brands.map((b) =>
      b.id === editingBrand.id
        ? {
            ...b,
            name: editBrandName.trim(),
            description: editBrandDesc.trim(),
            logo: editBrandLogo.trim() || b.logo,
            status: editBrandStatus,
            showInChannels: editBrandChannels,
          }
        : b
    );
    saveBrands(updated);
    setIsEditBrandOpen(false);
    setEditingBrand(null);
    toast(isAr ? 'تم تعديل العلامة التجارية بنجاح!' : 'Brand updated successfully!', 'success');
  };

  // Submit Add Field
  const handleAddFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    const newField: CustomFieldItem = {
      id: `cf-${Date.now()}`,
      name: newFieldName.trim(),
      type: newFieldType,
      appliedTo: newFieldAppliedTo,
      showToCustomer: true,
      status: 'active',
    };
    saveCustomFields([newField, ...customFields]);
    setIsAddFieldOpen(false);
    setNewFieldName('');
    toast(isAr ? 'تمت إضافة الحقل المخصص بنجاح' : 'Custom field added successfully', 'success');
  };

  // Submit Edit Field
  const handleEditFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField || !editFieldName.trim()) return;
    const updated = customFields.map((f) =>
      f.id === editingField.id
        ? {
            ...f,
            name: editFieldName.trim(),
            type: editFieldType,
            appliedTo: editFieldAppliedTo,
            showToCustomer: editFieldShowToCust,
            status: editFieldStatus,
          }
        : f
    );
    saveCustomFields(updated);
    setIsEditFieldOpen(false);
    setEditingField(null);
    toast(isAr ? 'تم تعديل الحقل المخصص بنجاح!' : 'Custom field updated successfully!', 'success');
  };

  // Filtered Brands
  const filteredBrands = useMemo(() => {
    let list = brands.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (searchBrand.trim()) {
        const q = searchBrand.toLowerCase();
        const bName = ((isAr ? b.nameAr : b.nameEn) || b.name || '').toLowerCase();
        const bDesc = ((isAr ? b.descriptionAr : b.descriptionEn) || b.description || '').toLowerCase();
        return bName.includes(q) || bDesc.includes(q) || (b.nameEn || '').toLowerCase().includes(q) || (b.nameAr || '').includes(q);
      }
      return true;
    });

    if (sortBy === 'name') {
      list.sort((a, b) => {
        const na = (isAr ? a.nameAr : a.nameEn) || a.name || '';
        const nb = (isAr ? b.nameAr : b.nameEn) || b.name || '';
        return na.localeCompare(nb);
      });
    } else if (sortBy === 'products') {
      list.sort((a, b) => b.productsCount - a.productsCount);
    }
    return list;
  }, [brands, statusFilter, searchBrand, sortBy, isAr]);

  const renderFieldTypeIcon = (type: CustomFieldItem['type']) => {
    switch (type) {
      case 'Text':
        return <FileText className="w-3.5 h-3.5 text-blue-500" />;
      case 'File':
        return <Paperclip className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Number':
        return <Hash className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Date':
        return <Calendar className="w-3.5 h-3.5 text-amber-500" />;
      case 'Single Select':
        return <ListFilter className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  return (
    <AdminPageShell className="pb-16 max-w-[1600px] mx-auto space-y-8">
      {/* ── BREADCRUMBS & TOP ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToProducts}
            className="hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{t('productsTitle')}</span>
          </button>
          <span>/</span>
          <span className="font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'العلامات التجارية والحقول' : 'Brands & Custom Fields'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsGuideOpen(true)}
          className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <HelpCircle className="w-4 h-4 text-blue-500" />
          <span>{isAr ? '📘 دليل الاستخدام المصور' : '📘 Docs & How to Use'}</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 1: BRANDS ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                {isAr ? 'العلامات التجارية' : 'Brands'}
              </h1>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1.5"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                <Tag className="w-3 h-3" />
                <span>{activeStore.name}</span>
                <span className="opacity-75 text-[10px]">({brands.length} {isAr ? 'علامة' : 'brands'})</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              {isAr
                ? `إدارة العلامات التجارية لمتجر "${activeStore.name}". معزولة بالكامل ومخصصة لنشاط وثيم هذا المتجر فقط.`
                : `Manage product brands dedicated to "${activeStore.name}". Fully isolated per tenant and theme.`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddBrandOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90 shrink-0"
            style={{ background: 'var(--portal-cta)' }}
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? '+ إضافة علامة تجارية' : '+ Add Brand'}</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div
          className="p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={searchBrand}
              onChange={(e) => setSearchBrand(e.target.value)}
              placeholder={isAr ? 'ابحث في العلامات التجارية...' : 'Search brands…'}
              className="w-full ps-9 pe-3 py-1.5 text-xs rounded-xl border focus:outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border focus:outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
            >
              <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="active">{isAr ? 'نشط' : 'Active'}</option>
              <option value="inactive">{isAr ? 'غير نشط' : 'Inactive'}</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border focus:outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
            >
              <option value="newest">{isAr ? 'الترتيب: الأحدث' : 'Sort by: Newest'}</option>
              <option value="name">{isAr ? 'الترتيب: بالاسم' : 'Sort by: Name'}</option>
              <option value="products">{isAr ? 'الترتيب: بعدد المنتجات' : 'Sort by: Products'}</option>
            </select>
          </div>
        </div>

        {/* Brands Table */}
        <div
          className="rounded-2xl border shadow-xs overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <th className="py-3 px-3 w-8">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="py-3 px-3 text-start font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'الشعار' : 'Logo'}
                  </th>
                  <th className="py-3 px-3 text-start font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'اسم العلامة التجارية' : 'Brand Name'}
                  </th>
                  <th className="py-3 px-3 text-start font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'الوصف' : 'Description'}
                  </th>
                  <th className="py-3 px-3 text-center font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'المنتجات' : 'Products'}
                  </th>
                  <th className="py-3 px-3 text-center font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'الظهور في قنوات البيع' : 'Show in Sales Channels'}
                  </th>
                  <th className="py-3 px-3 text-center font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'الحالة' : 'Status'}
                  </th>
                  <th className="py-3 px-3 text-end font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Tag className="w-8 h-8 text-slate-400 opacity-50" />
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {isAr ? 'لا توجد علامات تجارية مسجلة لهذا المتجر' : 'No brands registered for this store'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'أضف علامات تجارية حقيقية باستخدام زر "إضافة علامة تجارية" أعلاه' : 'Add genuine brands using the "Add Brand" button above'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBrands.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="py-3 px-3">
                        <div
                          className="w-10 h-10 rounded-xl border flex items-center justify-center p-1 overflow-hidden shadow-2xs relative group cursor-pointer"
                          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                          onClick={() => openEditBrandModal(b)}
                          title={isAr ? 'انقر لتعديل الشعار' : 'Click to edit logo'}
                        >
                          <BrandLogoImage
                            logo={b.logo}
                            name={(isAr ? b.nameAr : b.nameEn) || b.name}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold" style={{ color: 'var(--text)' }}>
                        {(isAr ? b.nameAr : b.nameEn) || b.name}
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate" style={{ color: 'var(--muted)' }}>
                        {(isAr ? b.descriptionAr : b.descriptionEn) || b.description}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold" style={{ color: 'var(--text)' }}>
                        {b.productsCount}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleBrandChannel(b.id)}
                          className="cursor-pointer inline-flex items-center"
                        >
                          {b.showInChannels ? (
                            <ToggleRight className="w-7 h-7 text-blue-500" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleBrandStatus(b.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            b.status === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          ● {b.status === 'active' ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير نشط' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-end">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Edit Button with Full Functional Modal */}
                          <button
                            type="button"
                            onClick={() => openEditBrandModal(b)}
                            className="p-1.5 rounded-lg border hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors cursor-pointer"
                            style={{ borderColor: 'var(--border)' }}
                            title={isAr ? 'تعديل العلامة التجارية' : 'Edit Brand'}
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                          </button>

                          {/* Delete Brand */}
                          <button
                            type="button"
                            onClick={() => handleDeleteBrand(b.id, b.name)}
                            className="p-1.5 rounded-lg border hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 transition-colors cursor-pointer"
                            style={{ borderColor: 'var(--border)' }}
                            title={isAr ? 'حذف العلامة التجارية' : 'Delete Brand'}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            className="p-3 border-t flex items-center justify-between text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <span>
              {isAr
                ? `عرض 1-${filteredBrands.length} من ${brands.length} علامة تجارية`
                : `Showing 1-${filteredBrands.length} of ${brands.length} brands`}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="w-7 h-7 rounded-lg border flex items-center justify-center opacity-60 cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center"
                style={{ background: 'var(--portal-cta)' }}
              >
                1
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-lg border flex items-center justify-center opacity-60 cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 2: CUSTOM FIELDS ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                {isAr ? 'الحقول المخصصة' : 'Custom Fields'}
              </h2>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1.5"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                <Boxes className="w-3 h-3" />
                <span>{activeStore.name}</span>
                <span className="opacity-75 text-[10px]">({customFields.length} {isAr ? 'حقول' : 'fields'})</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              {isAr
                ? `الحقول المخصصة ومواصفات المنتجات لمتجر "${activeStore.name}". معزولة ومستقلة لكل متجر وثيم.`
                : `Custom product fields and specifications for "${activeStore.name}". Isolated per store & theme.`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddFieldOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90 shrink-0"
            style={{ background: 'var(--portal-cta)' }}
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? '+ إضافة حقل مخصص' : '+ Add Custom Field'}</span>
          </button>
        </div>

        {/* Custom Fields Table */}
        <div
          className="rounded-2xl border shadow-xs overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <th className="py-3 px-3 w-8">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="py-3 px-3 text-start font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'اسم الحقل' : 'Field Name'}
                  </th>
                  <th className="py-3 px-3 text-start font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'نوع الحقل' : 'Field Type'}
                  </th>
                  <th className="py-3 px-3 text-start font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'يطبق على' : 'Applied To'}
                  </th>
                  <th className="py-3 px-3 text-center font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'الظهور للعميل' : 'Show to Customer'}
                  </th>
                  <th className="py-3 px-3 text-center font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'الحالة' : 'Status'}
                  </th>
                  <th className="py-3 px-3 text-end font-bold uppercase tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {customFields.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Boxes className="w-8 h-8 text-slate-400 opacity-50" />
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {isAr ? 'لا توجد حقول مخصصة مسجلة لهذا المتجر' : 'No custom fields registered for this store'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'أضف حقول مخصصة جديدة بالنقر على "إضافة حقل جديد" أعلاه' : 'Add new custom fields using the "Add New Field" button above'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customFields.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="py-3 px-3 font-bold" style={{ color: 'var(--text)' }}>
                        {(isAr ? f.nameAr : f.nameEn) || f.name}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-lg border text-[11px]" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                          {renderFieldTypeIcon(f.type)}
                          <span>{isAr ? (f.type === 'Text' ? 'نص' : f.type === 'File' ? 'ملف' : f.type === 'Number' ? 'رقم' : f.type === 'Date' ? 'تاريخ' : 'اختيار فردي') : f.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3" style={{ color: 'var(--muted)' }}>
                        {(isAr ? f.appliedToAr : f.appliedToEn) || f.appliedTo}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFieldCustomer(f.id)}
                          className="cursor-pointer inline-flex items-center"
                        >
                          {f.showToCustomer ? (
                            <ToggleRight className="w-7 h-7 text-blue-500" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFieldStatus(f.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            f.status === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          ● {f.status === 'active' ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير نشط' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-end">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditFieldModal(f)}
                            className="p-1.5 rounded-lg border hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors cursor-pointer"
                            style={{ borderColor: 'var(--border)' }}
                            title={isAr ? 'تعديل الحقل' : 'Edit Field'}
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(f.id, f.name)}
                            className="p-1.5 rounded-lg border hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 transition-colors cursor-pointer"
                            style={{ borderColor: 'var(--border)' }}
                            title={isAr ? 'حذف الحقل' : 'Delete Field'}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: Add Brand (with Full Media Upload) ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isAddBrandOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {isAr ? 'إضافة علامة تجارية جديدة' : 'Add New Brand'}
                </h3>
                <p className="text-[11px] opacity-70">
                  {isAr ? 'أدخل تفاصيل العلامة وارفع شعارها عالي الدقة' : 'Enter brand details and upload high-res logo'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBrandOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBrandSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'اسم العلامة التجارية *' : 'Brand Name *'}
                </label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder={isAr ? 'مثال: هاريو، كيمكس، فيلو...' : 'e.g. Hario, Chemex, Fellow...'}
                  required
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={newBrandDesc}
                  onChange={(e) => setNewBrandDesc(e.target.value)}
                  placeholder={isAr ? 'نبذة مختصرة عن العلامة التجارية...' : 'Short brand summary…'}
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              {/* Media Upload Section for Logo */}
              <div className="space-y-2">
                <label className="block font-bold" style={{ color: 'var(--text)' }}>
                  {isAr ? 'رفع شعار العلامة التجارية *' : 'Brand Logo Media Upload *'}
                </label>
                
                {/* Drag and Drop Zone */}
                <div
                  className="p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={() => addLogoInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleLogoFileUpload(file, setNewBrandLogo);
                  }}
                >
                  <input
                    ref={addLogoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoFileUpload(file, setNewBrandLogo);
                    }}
                  />

                  {newBrandLogo ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-xl border overflow-hidden p-1 bg-white shadow-xs">
                        <BrandLogoImage logo={newBrandLogo} name={newBrandName || 'New Brand'} />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ {isAr ? 'تم تحديد الشعار بنجاح (انقر للتغيير)' : 'Logo uploaded! Click to change'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {isAr ? 'انقر لرفع صورة الشعار من جهازك' : 'Click to browse image or drag & drop'}
                      </span>
                      <span className="text-[10px] opacity-60">PNG, SVG, WEBP, JPG up to 5MB</span>
                    </div>
                  )}
                </div>

                {/* Alternative URL Input */}
                <div className="pt-1">
                  <span className="text-[10px] opacity-60 block mb-1">
                    {isAr ? 'أو أدخل رابط الصورة المباشر:' : 'Or enter direct image URL:'}
                  </span>
                  <input
                    type="url"
                    value={newBrandLogo}
                    onChange={(e) => setNewBrandLogo(e.target.value)}
                    placeholder="https://... or /images/coffee-brands/..."
                    className="w-full px-3 py-1.5 text-[11px] rounded-xl border focus:outline-none font-mono"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddBrandOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold cursor-pointer"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  {isAr ? 'حفظ العلامة' : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: Edit Brand (Full Functional Edit + Media Upload) ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isEditBrandOpen && editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {isAr ? 'تعديل العلامة التجارية' : 'Edit Brand'}
                </h3>
                <p className="text-[11px] opacity-70">
                  {(isAr ? editingBrand.nameAr : editingBrand.nameEn) || editingBrand.name} · ID: {editingBrand.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditBrandOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditBrandSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'اسم العلامة التجارية *' : 'Brand Name *'}
                </label>
                <input
                  type="text"
                  value={editBrandName}
                  onChange={(e) => setEditBrandName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={editBrandDesc}
                  onChange={(e) => setEditBrandDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              {/* Logo Media Upload */}
              <div className="space-y-2">
                <label className="block font-bold" style={{ color: 'var(--text)' }}>
                  {isAr ? 'رفع شعار العلامة التجارية' : 'Brand Logo Media Upload'}
                </label>

                <div
                  className="p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={() => editLogoInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleLogoFileUpload(file, setEditBrandLogo);
                  }}
                >
                  <input
                    ref={editLogoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoFileUpload(file, setEditBrandLogo);
                    }}
                  />

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-xl border overflow-hidden p-1 bg-white shadow-xs">
                      <BrandLogoImage logo={editBrandLogo} name={editBrandName || 'Brand'} />
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {isAr ? 'انقر لتغيير أو رفع شعار جديد' : 'Click to replace logo or browse files'}
                    </span>
                  </div>
                </div>

                <input
                  type="url"
                  value={editBrandLogo}
                  onChange={(e) => setEditBrandLogo(e.target.value)}
                  placeholder="https://... or /images/coffee-brands/..."
                  className="w-full px-3 py-1.5 text-[11px] rounded-xl border focus:outline-none font-mono"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              {/* Status and Channels Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={editBrandStatus}
                    onChange={(e) => setEditBrandStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value="active">{isAr ? 'نشط' : 'Active'}</option>
                    <option value="inactive">{isAr ? 'غير نشط' : 'Inactive'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الظهور في قنوات البيع' : 'Show in Sales Channels'}
                  </label>
                  <select
                    value={editBrandChannels ? 'yes' : 'no'}
                    onChange={(e) => setEditBrandChannels(e.target.value === 'yes')}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value="yes">{isAr ? 'ظاهر' : 'Visible'}</option>
                    <option value="no">{isAr ? 'مخفي' : 'Hidden'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setIsEditBrandOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold cursor-pointer"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Custom Field ── */}
      {isAddFieldOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-extrabold text-base">{isAr ? 'إضافة حقل مخصص جديد' : 'Add Custom Field'}</h3>
              <button
                type="button"
                onClick={() => setIsAddFieldOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFieldSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'اسم الحقل *' : 'Field Name *'}
                </label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder={isAr ? 'مثال: الخامة، بلد المنشأ، درجة الطحن...' : 'e.g. Material, Origin, Grind Size...'}
                  required
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'نوع الحقل' : 'Field Type'}
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  <option value="Text">{isAr ? 'نص' : 'Text'}</option>
                  <option value="File">{isAr ? 'ملف / صورة' : 'File'}</option>
                  <option value="Number">{isAr ? 'رقم' : 'Number'}</option>
                  <option value="Date">{isAr ? 'تاريخ' : 'Date'}</option>
                  <option value="Single Select">{isAr ? 'اختيار فردي' : 'Single Select'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'يطبق على' : 'Applied To'}
                </label>
                <input
                  type="text"
                  value={newFieldAppliedTo}
                  onChange={(e) => setNewFieldAppliedTo(e.target.value)}
                  placeholder={isAr ? 'مثال: جميع المنتجات، مستلزمات الباريستا...' : 'e.g. All Products, Barista Gear...'}
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFieldOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  {isAr ? 'حفظ الحقل' : 'Save Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Custom Field ── */}
      {isEditFieldOpen && editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-extrabold text-base">{isAr ? 'تعديل الحقل المخصص' : 'Edit Custom Field'}</h3>
              <button
                type="button"
                onClick={() => setIsEditFieldOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditFieldSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'اسم الحقل *' : 'Field Name *'}
                </label>
                <input
                  type="text"
                  value={editFieldName}
                  onChange={(e) => setEditFieldName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'نوع الحقل' : 'Field Type'}
                </label>
                <select
                  value={editFieldType}
                  onChange={(e) => setEditFieldType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  <option value="Text">{isAr ? 'نص' : 'Text'}</option>
                  <option value="File">{isAr ? 'ملف / صورة' : 'File'}</option>
                  <option value="Number">{isAr ? 'رقم' : 'Number'}</option>
                  <option value="Date">{isAr ? 'تاريخ' : 'Date'}</option>
                  <option value="Single Select">{isAr ? 'اختيار فردي' : 'Single Select'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'يطبق على' : 'Applied To'}
                </label>
                <input
                  type="text"
                  value={editFieldAppliedTo}
                  onChange={(e) => setEditFieldAppliedTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'الظهور للعميل' : 'Show to Customer'}
                  </label>
                  <select
                    value={editFieldShowToCust ? 'yes' : 'no'}
                    onChange={(e) => setEditFieldShowToCust(e.target.value === 'yes')}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value="yes">{isAr ? 'نعم' : 'Yes'}</option>
                    <option value="no">{isAr ? 'لا' : 'No'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={editFieldStatus}
                    onChange={(e) => setEditFieldStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value="active">{isAr ? 'نشط' : 'Active'}</option>
                    <option value="inactive">{isAr ? 'غير نشط' : 'Inactive'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditFieldOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold"
                  style={{ background: 'var(--portal-cta)' }}
                >
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Docs Guide Modal */}
      <PageDocsGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        pageId="brands"
      />
    </AdminPageShell>
  );
};

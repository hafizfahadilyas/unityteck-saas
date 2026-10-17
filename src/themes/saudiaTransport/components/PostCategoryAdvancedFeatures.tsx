import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  Palette, 
  Layers, 
  Clock, 
  Car, 
  Zap, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  ShoppingCart, 
  Search, 
  Check, 
  Star, 
  Info,
  Sliders,
  Eye,
  Tag,
  Plus,
  Settings,
  Edit3,
  Save,
  RotateCcw,
  X,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react';
import { 
  CarBrandItem, 
  SeatColorOption, 
  CAR_BRANDS, 
  SEAT_COLORS, 
  FEATURED_HOME_SEATS, 
  FEATURED_FLOOR_MATS,
  CAR_MODELS_MAP,
  BLECO_STORE_INFO
} from '../../../data/blecoStoreData';
import { Product } from '../../../types';

export interface StudioAdminSettings {
  // Base Prices (SAR)
  seatsPrice: number;
  seatsOldPrice: number;
  matsPrice: number;
  matsOldPrice: number;
  comboPrice: number;
  comboOldPrice: number;

  // Leather Addons (SAR)
  nappaAddon: number;
  diamondAddon: number;
  coolingAddon: number;
  alcantaraAddon: number;

  // Accessories Addons (SAR)
  steeringAddon: number;
  cushionsAddon: number;

  // Texts & Badges
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  warrantyBadgeAr: string;
  warrantyBadgeEn: string;
  turnaroundBadgeAr: string;
  turnaroundBadgeEn: string;
  installationNoteAr: string;
  installationNoteEn: string;

  // Optional custom images
  customSeatsImage?: string;
  customMatsImage?: string;
}

export const DEFAULT_STUDIO_SETTINGS: StudioAdminSettings = {
  seatsPrice: 390,
  seatsOldPrice: 480,
  matsPrice: 260,
  matsOldPrice: 320,
  comboPrice: 590,
  comboOldPrice: 740,

  nappaAddon: 0,
  diamondAddon: 40,
  coolingAddon: 25,
  alcantaraAddon: 55,

  steeringAddon: 35,
  cushionsAddon: 45,

  titleAr: 'صمّم مقصورتك الملكية حسب رغبتك في ثوانٍ',
  titleEn: 'Customize Your VIP Interior in Real-Time',
  subtitleAr: 'اختر سيارتك، نوع البكج، خامة الجلد، ولون الوكالة المطلوب. تتحدث الأسعار والصور فورياً مع تفصيل ليزري بدقة 0.1 ملم وضمان سنتين.',
  subtitleEn: 'Select your vehicle, package, leather grade, and OEM matching color. Real-time dynamic updates with 0.1mm laser fit.',
  warrantyBadgeAr: 'ضمان سنتين ذهبي',
  warrantyBadgeEn: '2-Yr Gold Warranty',
  turnaroundBadgeAr: 'جاهز خلال 24 ساعة',
  turnaroundBadgeEn: 'Ready in 24h',
  installationNoteAr: 'تركيب مجاني بفرع مكة',
  installationNoteEn: 'Free Makkah Installation',
  customSeatsImage: '',
  customMatsImage: '',
};

interface PostCategoryAdvancedFeaturesProps {
  isAr?: boolean;
  isAdmin?: boolean;
  storeId?: string;
  onOpenVehicleModal: (make?: string, model?: string) => void;
  onAddToCart: (product: Product, color?: SeatColorOption) => void;
  onWhatsAppOrder: (product?: Product, color?: SeatColorOption, customText?: string) => void;
  onTriggerToast: (toast: {
    type: 'success' | 'vehicle-match' | 'warranty' | 'cart' | 'info';
    title: string;
    titleEn?: string;
    message: string;
    messageEn?: string;
    actionLabel?: string;
    actionLabelEn?: string;
    onAction?: () => void;
  }) => void;
}

// Popular Saudi cars available for immediate customization
interface CustomCarPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  brand: string;
  seatImages: Record<string, string>;
}

const POPULAR_CUSTOM_CARS: CustomCarPreset[] = [
  {
    id: 'camry',
    nameAr: 'تويوتا كامري (Camry)',
    nameEn: 'Toyota Camry',
    brand: 'toyota',
    seatImages: {
      beige: '/images/seat-covers/camry-beige.jpg',
      camel: '/images/seat-covers/camry-camel.jpg',
      black: '/images/seat-covers/camry-black.jpg',
      grey: '/images/seat-covers/accord-grey.jpg',
      maroon: '/images/seat-covers/camry-camel.jpg',
      navy: '/images/seat-covers/camry-black.jpg',
    }
  },
  {
    id: 'land-cruiser',
    nameAr: 'لاند كروزر (LC300)',
    nameEn: 'Land Cruiser',
    brand: 'toyota',
    seatImages: {
      beige: '/images/seat-covers/camry-beige.jpg',
      camel: '/images/seat-covers/landcruiser-camel.jpg',
      black: '/images/seat-covers/camry-black.jpg',
      grey: '/images/seat-covers/accord-grey.jpg',
      maroon: '/images/seat-covers/camry-camel.jpg',
      navy: '/images/seat-covers/camry-black.jpg',
    }
  },
  {
    id: 'yukon',
    nameAr: 'جمس يوكن / تاهو',
    nameEn: 'GMC Yukon / Tahoe',
    brand: 'gmc',
    seatImages: {
      beige: '/images/seat-covers/yukon-beige.jpg',
      camel: '/images/seat-covers/yukon-camel.jpg',
      grey: '/images/seat-covers/yukon-grey.jpg',
      black: '/images/seat-covers/camry-black.jpg',
      maroon: '/images/seat-covers/yukon-camel.jpg',
      navy: '/images/seat-covers/yukon-grey.jpg',
    }
  },
  {
    id: 'sonata',
    nameAr: 'هيونداي سوناتا / أكسنت',
    nameEn: 'Hyundai Sonata / Accent',
    brand: 'hyundai',
    seatImages: {
      beige: '/images/seat-covers/accord-beige.jpg',
      camel: '/images/seat-covers/accord-camel.jpg',
      grey: '/images/seat-covers/accord-grey.jpg',
      black: '/images/seat-covers/camry-black.jpg',
      maroon: '/images/seat-covers/accord-camel.jpg',
      navy: '/images/seat-covers/camry-black.jpg',
    }
  },
  {
    id: 'patrol',
    nameAr: 'نيسان باترول (Patrol)',
    nameEn: 'Nissan Patrol',
    brand: 'nissan',
    seatImages: {
      camel: '/images/seat-covers/camry-camel.jpg',
      beige: '/images/seat-covers/camry-beige.jpg',
      black: '/images/seat-covers/camry-black.jpg',
      grey: '/images/seat-covers/accord-grey.jpg',
      maroon: '/images/seat-covers/camry-camel.jpg',
      navy: '/images/seat-covers/camry-black.jpg',
    }
  },
  {
    id: 'taurus',
    nameAr: 'فورد تورس (Taurus)',
    nameEn: 'Ford Taurus',
    brand: 'ford',
    seatImages: {
      black: '/images/seat-covers/camry-black.jpg',
      camel: '/images/seat-covers/camry-camel.jpg',
      beige: '/images/seat-covers/camry-beige.jpg',
      grey: '/images/seat-covers/accord-grey.jpg',
      maroon: '/images/seat-covers/camry-camel.jpg',
      navy: '/images/seat-covers/camry-black.jpg',
    }
  },
  {
    id: 'lexus-es',
    nameAr: 'لكزس ES / RX',
    nameEn: 'Lexus ES / RX',
    brand: 'lexus',
    seatImages: {
      camel: '/images/seat-covers/camry-camel.jpg',
      beige: '/images/seat-covers/camry-beige.jpg',
      black: '/images/seat-covers/camry-black.jpg',
      grey: '/images/seat-covers/accord-grey.jpg',
      maroon: '/images/seat-covers/camry-camel.jpg',
      navy: '/images/seat-covers/camry-black.jpg',
    }
  },
  {
    id: 'all-cars',
    nameAr: 'سيارة أخرى (جميع السيارات)',
    nameEn: 'Other Vehicle (All Models)',
    brand: 'other',
    seatImages: {
      beige: '/images/seat-covers/camry-beige.jpg',
      camel: '/images/seat-covers/camry-camel.jpg',
      black: '/images/seat-covers/camry-black.jpg',
      grey: '/images/seat-covers/accord-grey.jpg',
      maroon: '/images/seat-covers/camry-camel.jpg',
      navy: '/images/seat-covers/camry-black.jpg',
    }
  }
];

// 5D Floor mat images mapping
const FLOOR_MAT_VISUALS: Record<string, string> = {
  nappa: '/images/floor-mats/triangle-floors.jpg',
  diamond: '/images/floor-mats/diamond-floors.jpg',
  cooling: '/images/floor-mats/laser-flooring.jpg',
  alcantara: '/images/floor-mats/luxury-flooring.jpg',
};

// Available leather materials & craftsmanship
const LEATHER_GRADES = [
  {
    id: 'nappa',
    nameAr: 'جلد نابا ألماني أصلي',
    nameEn: 'German Nappa',
    descAr: 'ملمس ناعم عالي التهوية ومقاوم للحرارة',
    descEn: 'Ultra-soft & breathable micro-pores',
    priceAddon: 0,
    badgeAr: 'الأكثر طلباً',
    badgeEn: 'Best Seller',
    colorHex: '#d5a027'
  },
  {
    id: 'diamond',
    nameAr: 'جلد دايموند ملكي 5D',
    nameEn: 'Diamond Quilted 5D',
    descAr: 'تطريز هندسي دايموند مع تبطين ميموري مضاعف',
    descEn: '5D geometric embroidery & cushion',
    priceAddon: 40,
    badgeAr: 'فخامة VIP',
    badgeEn: 'VIP Luxury',
    colorHex: '#f59e0b'
  },
  {
    id: 'cooling',
    nameAr: 'قماش ياباني بارد مبرد',
    nameEn: 'Japanese Cooling Fabric',
    descAr: 'عزل حراري صيفي 55°C مقاوم لأشعة الشمس',
    descEn: '55°C heat & UV sun repellent',
    priceAddon: 25,
    badgeAr: 'صيفي بارد',
    badgeEn: 'Cool Summer',
    colorHex: '#10b981'
  },
  {
    id: 'alcantara',
    nameAr: 'شامواه كانتارا رويال',
    nameEn: 'Royal Alcantara Suede',
    descAr: 'ملمس مخملي رياضي يمنع الانزلاق والتعرق',
    descEn: 'Sport velvet texture & anti-slip grip',
    priceAddon: 55,
    badgeAr: 'رياضي فاخر',
    badgeEn: 'Sport Luxe',
    colorHex: '#8b5cf6'
  }
];

// Rich OEM Color swatches
const CUSTOM_COLORS: SeatColorOption[] = [
  {
    id: 'beige',
    nameAr: 'بيج وكالة OEM',
    nameEn: 'OEM Beige',
    hex: '#d8c8b4',
    image: '/images/seat-covers/camry-beige.jpg',
  },
  {
    id: 'camel',
    nameAr: 'جملي رويال ملكي',
    nameEn: 'Royal Camel',
    hex: '#b87b44',
    image: '/images/seat-covers/camry-camel.jpg',
  },
  {
    id: 'black',
    nameAr: 'أسود ملكي فاخر',
    nameEn: 'Royal Black',
    hex: '#1e2124',
    image: '/images/seat-covers/camry-black.jpg',
  },
  {
    id: 'grey',
    nameAr: 'رمادي ألماني أنيق',
    nameEn: 'German Grey',
    hex: '#7e848d',
    image: '/images/seat-covers/accord-grey.jpg',
  },
  {
    id: 'maroon',
    nameAr: 'عنابي لكزس فاخر',
    nameEn: 'Luxury Maroon',
    hex: '#6b1426',
    image: '/images/seat-covers/camry-camel.jpg',
  },
  {
    id: 'navy',
    nameAr: 'كحلي ملكي عميق',
    nameEn: 'Navy Blue',
    hex: '#1b263b',
    image: '/images/seat-covers/camry-black.jpg',
  },
];

// WhatsApp Icon
function WhatsAppGlyph({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const PostCategoryAdvancedFeaturesComponent: React.FC<PostCategoryAdvancedFeaturesProps> = ({
  isAr = true,
  isAdmin = false,
  storeId = 'store-bleco',
  onOpenVehicleModal,
  onAddToCart,
  onWhatsAppOrder,
  onTriggerToast,
}) => {
  const effectiveIsAdmin = isAdmin || (typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('admin') === 'true' ||
    new URLSearchParams(window.location.search).get('admin') === '1' ||
    !!localStorage.getItem('unityteck_auth')
  ));

  // Admin Persisted Settings for Customizer Studio
  const storageKey = `alsaeedi_vip_studio_settings_${storeId}`;
  const [adminSettings, setAdminSettings] = useState<StudioAdminSettings>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return { ...DEFAULT_STUDIO_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load studio settings', e);
    }
    return DEFAULT_STUDIO_SETTINGS;
  });

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'packages' | 'materials' | 'texts' | 'media'>('packages');
  const [editForm, setEditForm] = useState<StudioAdminSettings>(adminSettings);

  const handleOpenAdminModal = () => {
    setEditForm(adminSettings);
    setIsAdminModalOpen(true);
  };

  const handleSaveAdminSettings = () => {
    setAdminSettings(editForm);
    try {
      localStorage.setItem(storageKey, JSON.stringify(editForm));
    } catch (e) {
      console.warn('Failed to save studio settings', e);
    }
    setIsAdminModalOpen(false);
    onTriggerToast({
      type: 'success',
      title: isAr ? 'تم حفظ إعدادات الاستوديو بنجاح' : 'Studio Settings Saved Successfully',
      message: isAr ? 'تم تحديث الأسعار والنصوص والصور فورياً على المتجر' : 'Prices, texts, and media updated live on storefront',
    });
  };

  const handleResetAdminSettings = () => {
    setEditForm(DEFAULT_STUDIO_SETTINGS);
    setAdminSettings(DEFAULT_STUDIO_SETTINGS);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {}
    setIsAdminModalOpen(false);
    onTriggerToast({
      type: 'info',
      title: isAr ? 'تمت استعادة الإعدادات الافتراضية' : 'Restored Default Settings',
      message: isAr ? 'تمت إعادة ضبط الأسعار والنصوص إلى القيم الأصلية' : 'Prices and texts reset to default factory values',
    });
  };

  // Customizer Studio State (All selections update dynamically without popup spam)
  const [selectedCar, setSelectedCar] = useState<CustomCarPreset>(POPULAR_CUSTOM_CARS[0]);
  const [studioType, setStudioType] = useState<'seats' | 'mats' | 'combo'>('combo');
  const [selectedMaterial, setSelectedMaterial] = useState<'nappa' | 'diamond' | 'cooling' | 'alcantara'>('nappa');
  const [selectedColor, setSelectedColor] = useState<SeatColorOption>(CUSTOM_COLORS[1]); // Default camel
  const [previewTab, setPreviewTab] = useState<'seats' | 'mats'>('seats');
  
  // Custom Addons / Personalization Preferences
  const [addonLogo, setAddonLogo] = useState(true); // Free brand logo embroidery
  const [addonSteering, setAddonSteering] = useState(false); // Matching steering cover
  const [addonCushions, setAddonCushions] = useState(false); // Memory foam neck pillows

  const [quickCheckQuery, setQuickCheckQuery] = useState('');

  // Active leather grade config with dynamic admin pricing
  const activeGrade = useMemo(() => {
    const base = LEATHER_GRADES.find(g => g.id === selectedMaterial) || LEATHER_GRADES[0];
    const addonPrice = selectedMaterial === 'diamond' 
      ? adminSettings.diamondAddon 
      : selectedMaterial === 'cooling' 
        ? adminSettings.coolingAddon 
        : selectedMaterial === 'alcantara' 
          ? adminSettings.alcantaraAddon 
          : adminSettings.nappaAddon;
    return { ...base, priceAddon: addonPrice };
  }, [selectedMaterial, adminSettings]);

  // Dynamic Base Pricing from Admin Settings
  const packageBasePrice = studioType === 'combo' ? adminSettings.comboPrice : (studioType === 'mats' ? adminSettings.matsPrice : adminSettings.seatsPrice);
  const packageOldPrice = studioType === 'combo' ? adminSettings.comboOldPrice : (studioType === 'mats' ? adminSettings.matsOldPrice : adminSettings.seatsOldPrice);

  // Addons Total
  const materialAddonPrice = activeGrade.priceAddon;
  const accessoriesPrice = (addonSteering ? adminSettings.steeringAddon : 0) + (addonCushions ? adminSettings.cushionsAddon : 0);

  // Dynamic Total Price & Savings
  const studioTotalPrice = packageBasePrice + materialAddonPrice + accessoriesPrice;
  const studioOldTotalPrice = packageOldPrice + materialAddonPrice + accessoriesPrice + (studioType === 'combo' ? 50 : 25);
  const studioTotalSavings = studioOldTotalPrice - studioTotalPrice;

  // Active item reference for cart
  const baseProduct = studioType === 'mats' 
    ? FEATURED_FLOOR_MATS[0] 
    : FEATURED_HOME_SEATS[0];

  // Resolve dynamic preview image based on choices and admin overrides
  const dynamicPreviewImage = useMemo(() => {
    if (adminSettings.customSeatsImage && studioType === 'seats') {
      return adminSettings.customSeatsImage;
    }
    if (adminSettings.customMatsImage && studioType === 'mats') {
      return adminSettings.customMatsImage;
    }
    if (studioType === 'mats') {
      return FLOOR_MAT_VISUALS[selectedMaterial] || '/images/floor-mats/triangle-floors.jpg';
    }
    if (studioType === 'combo') {
      if (previewTab === 'mats') {
        return adminSettings.customMatsImage || FLOOR_MAT_VISUALS[selectedMaterial] || '/images/floor-mats/diamond-floors.jpg';
      }
      return adminSettings.customSeatsImage || selectedCar.seatImages[selectedColor.id] || selectedColor.image;
    }
    // 'seats'
    return selectedCar.seatImages[selectedColor.id] || selectedColor.image;
  }, [studioType, previewTab, selectedCar, selectedColor, selectedMaterial, adminSettings]);

  // Construct customized cart product payload
  const handleCustomizerAddToCart = () => {
    const customTitleAr = studioType === 'combo'
      ? `بكج تفصيل شامل (مقاعد + أرضيات 5D) لـ ${selectedCar.nameAr}`
      : studioType === 'mats'
        ? `طقم أرضيات 5D ليزر لـ ${selectedCar.nameAr}`
        : `تلابيس مقاعد VIP لـ ${selectedCar.nameAr}`;

    const customTitleEn = studioType === 'combo'
      ? `Full VIP Bespoke Combo (Seats + 5D Mats) for ${selectedCar.nameEn}`
      : studioType === 'mats'
        ? `5D Laser Armor Floor Mats for ${selectedCar.nameEn}`
        : `VIP Bespoke Seat Covers for ${selectedCar.nameEn}`;

    const customizedProduct: Product = {
      ...baseProduct,
      id: `bespoke-${selectedCar.id}-${studioType}-${activeGrade.id}-${selectedColor.id}-${Date.now().toString(36)}`,
      name: isAr ? customTitleAr : customTitleEn,
      nameAr: customTitleAr,
      nameEn: customTitleEn,
      price: studioTotalPrice,
      originalPrice: studioOldTotalPrice,
      discountedPrice: studioTotalPrice,
      image: dynamicPreviewImage,
      galleryUrls: [dynamicPreviewImage],
      brand: selectedCar.nameAr,
      categoryAr: studioType === 'mats' ? 'أرضيات 5D' : 'تلابيس وتنجيد ملكي',
      categoryEn: studioType === 'mats' ? '5D Floor Mats' : 'VIP Seat Covers',
    };

    onAddToCart(customizedProduct, selectedColor);

    // Single crisp confirmation toast
    onTriggerToast({
      type: 'cart',
      title: isAr ? 'تمت إضافة التخصيص الملكي إلى السلة' : 'Custom VIP Kit Added to Cart',
      message: isAr 
        ? `تم تجهيز مواصفات (${selectedCar.nameAr}) بخامة (${activeGrade.nameAr}) ولون (${selectedColor.nameAr}) بسعر (${studioTotalPrice} ر.س)`
        : `Ready to tailor: ${selectedCar.nameEn} in ${activeGrade.nameEn} - ${selectedColor.nameEn} (${studioTotalPrice} SAR)`,
      actionLabel: isAr ? 'عرض السلة' : 'View Cart',
      actionLabelEn: 'View Cart',
      onAction: () => {
        const cartBtn = document.querySelector('.alsaeedi-cart-trigger') as HTMLElement;
        if (cartBtn) cartBtn.click();
      }
    });
  };

  // WhatsApp Order with comprehensive dynamic details
  const handleCustomizerWhatsApp = () => {
    const addonsList: string[] = [];
    if (addonLogo) addonsList.push(isAr ? 'تطريز شعار السيارة ليزرياً (مجاناً)' : 'Free Laser Logo Embroidery');
    if (addonSteering) addonsList.push(isAr ? 'تلبيسة دركسون ملكية متناسقة (+35 ر.س)' : 'Matching Steering Cover (+35 SAR)');
    if (addonCushions) addonsList.push(isAr ? 'طقم مخدات ميموري فوم 2x (+45 ر.س)' : '2x Memory Foam Neck Pillows (+45 SAR)');

    const msg = isAr 
      ? `مرحباً متجر السعيدي لخدمات السيارات، أرغب بحجز تفصيل ليزري لمقصورة سيارتي حسب التخصيص التالي:
🚗 نوع وموديل السيارة: ${selectedCar.nameAr}
📦 البكج المطلوب: ${studioType === 'combo' ? 'البكج الملكي الشامل (تلابيس مقاعد + أرضيات 5D ليزر)' : studioType === 'mats' ? 'طقم أرضيات 5D ليزرية' : 'تلابيس مقاعد VIP تفصيل كامل'}
🧵 خامة وتطريز الجلد: ${activeGrade.nameAr}
🎨 اللون المختار: ${selectedColor.nameAr}
✨ الإضافات المختارة: ${addonsList.length > 0 ? addonsList.join(' + ') : 'بدون إضافات'}
💰 السعر الإجمالي شامل الضريبة: ${studioTotalPrice} ر.س (وفرت ${studioTotalSavings} ر.س)
📍 مكان التركيب: فرع مكة المكرمة (بطحاء قريش) مع ضمان سنتين ذهبي.
أرجو تأكيد موعد التفصيل والتركيب.`
      : `Hello Al-Saeedi Car Services, I want to book bespoke interior tailoring:
🚗 Vehicle: ${selectedCar.nameEn}
📦 Package: ${studioType === 'combo' ? 'Full VIP Combo (Seat Covers + 5D Mats)' : studioType === 'mats' ? '5D Laser Floor Mats' : 'VIP Bespoke Seat Covers'}
🧵 Leather Grade: ${activeGrade.nameEn}
🎨 Color: ${selectedColor.nameEn}
✨ Extras: ${addonsList.length > 0 ? addonsList.join(', ') : 'None'}
💰 Total Price: ${studioTotalPrice} SAR (Saved ${studioTotalSavings} SAR)
📍 Installation: Free Makkah fitting with 2-year warranty.`;

    onWhatsAppOrder(baseProduct, selectedColor, msg);
  };

  const handleQuickCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCheckQuery.trim()) {
      onTriggerToast({
        type: 'info',
        title: isAr ? 'يرجى كتابة اسم السيارة' : 'Please enter car name',
        message: isAr ? 'مثال: كامري، سوناتا، لاندكروزر، تاهو، باترول...' : 'e.g. Camry, Sonata, Land Cruiser, Tahoe...',
      });
      return;
    }

    onTriggerToast({
      type: 'vehicle-match',
      title: isAr ? 'تم تأكيد المطابقة الليزرية 100%' : '100% Laser Fitment Verified',
      message: isAr 
        ? `مقاسات وكالة ${quickCheckQuery} متوفرة وجاهزة للتفصيل خلال 24 ساعة مع ضمان سنتين ذهبي`
        : `OEM laser templates for ${quickCheckQuery} are ready for bespoke crafting with 2-year warranty`,
      actionLabel: isAr ? 'عرض التفاصيل' : 'View Details',
      actionLabelEn: 'View Details',
      onAction: () => onOpenVehicleModal(quickCheckQuery, quickCheckQuery)
    });

    onOpenVehicleModal(quickCheckQuery, quickCheckQuery);
  };

  return (
    <div className="space-y-16 animate-fadeIn">

      {/* ========================================================
          FEATURE 1: VIP 3D REAL-TIME CABIN CUSTOMIZATION STUDIO
          (استوديو التخصيص الملكي التفاعلي لمقصورة سيارتك)
          ======================================================== */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#16032e] via-[#210643] to-[#0e011f] text-white p-4 sm:p-7 lg:p-9 border-2 border-[#d5a027]/40 shadow-[0_30px_70px_-15px_rgba(22,3,46,0.6)] overflow-hidden">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#d5a027]/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/15 pb-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-500/10 border border-[#d5a027]/50 text-amber-300 text-xs font-black shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#f6c344]" />
              <span>{isAr ? 'استوديو التخصيص التفاعلي المتكامل للمقصورة' : 'Interactive VIP Cabin Customizer Studio'}</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {isAr ? adminSettings.titleAr : adminSettings.titleEn}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium">
              {isAr ? adminSettings.subtitleAr : adminSettings.subtitleEn}
            </p>
          </div>

          {/* Quick Fitment Check & Admin Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {effectiveIsAdmin && (
              <button
                type="button"
                onClick={handleOpenAdminModal}
                className="self-start md:self-auto px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-[#f6c344] to-amber-500 hover:brightness-110 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-lg hover:shadow-amber-500/30 border border-amber-300 shrink-0"
              >
                <Settings className="w-4 h-4 text-slate-950" />
                <span>{isAr ? 'تعديل الأسعار والمحتوى (Admin)' : 'Edit Pricing & Studio (Admin)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenVehicleModal(selectedCar.brand, selectedCar.nameEn)}
              className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-[#d5a027]/40 text-amber-300 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md hover:border-[#f6c344] shrink-0"
            >
              <Car className="w-4 h-4 text-[#f6c344]" />
              <span>{isAr ? 'فحص مطابقة سيارتك الفوري' : 'Quick Fitment Checker'}</span>
            </button>
          </div>
        </div>

        {/* Studio Interactive Console */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-6 sm:mt-8 items-start">
          
          {/* Left Column: Interactive Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Step 1: Vehicle Selector (Popular Saudi Cars) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#d5a027] text-[#16032e] text-[10px] flex items-center justify-center font-black">1</span>
                  <span>{isAr ? 'اختر موديل سيارتك:' : 'Select Your Vehicle Model:'}</span>
                </label>
                <span className="text-[11px] font-bold text-amber-300/90 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'قالب ليزري معتمد' : 'OEM Fit Guaranteed'}</span>
                </span>
              </div>

              {/* Responsive Car Selector Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {POPULAR_CUSTOM_CARS.map(car => {
                  const isCarActive = selectedCar.id === car.id;
                  return (
                    <button
                      key={car.id}
                      type="button"
                      onClick={() => setSelectedCar(car)}
                      className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 text-xs font-bold ${
                        isCarActive
                          ? 'bg-gradient-to-b from-[#d5a027]/30 to-purple-900/50 border-[#f6c344] text-white shadow-md ring-2 ring-[#f6c344]/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <span className="truncate w-full">{isAr ? car.nameAr : car.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Upgrade Package Selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#d5a027] text-[#16032e] text-[10px] flex items-center justify-center font-black">2</span>
                <span>{isAr ? 'اختر نوع البكج المطلوب للمقصورة:' : 'Select Cabin Package:'}</span>
              </label>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* Seats */}
                <button
                  type="button"
                  onClick={() => setStudioType('seats')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    studioType === 'seats'
                      ? 'bg-gradient-to-b from-[#d5a027]/25 to-purple-900/40 border-[#f6c344] shadow-[0_0_20px_rgba(213,160,39,0.3)] ring-2 ring-[#f6c344]/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <Palette className="w-5 h-5 text-[#f6c344]" />
                  <span className="text-xs font-black text-white">{isAr ? 'تلابيس مقاعد VIP' : 'Bespoke Covers'}</span>
                  <span className="text-[11px] text-amber-200/90 font-bold">{adminSettings.seatsPrice} {isAr ? 'ر.س' : 'SAR'}</span>
                  <span className="text-[9px] text-slate-400 line-through">{adminSettings.seatsOldPrice} {isAr ? 'ر.س' : 'SAR'}</span>
                </button>

                {/* Mats */}
                <button
                  type="button"
                  onClick={() => setStudioType('mats')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    studioType === 'mats'
                      ? 'bg-gradient-to-b from-[#d5a027]/25 to-purple-900/40 border-[#f6c344] shadow-[0_0_20px_rgba(213,160,39,0.3)] ring-2 ring-[#f6c344]/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-black text-white">{isAr ? 'أرضيات 5D ليزر' : '5D Laser Mats'}</span>
                  <span className="text-[11px] text-amber-200/90 font-bold">{adminSettings.matsPrice} {isAr ? 'ر.س' : 'SAR'}</span>
                  <span className="text-[9px] text-slate-400 line-through">{adminSettings.matsOldPrice} {isAr ? 'ر.س' : 'SAR'}</span>
                </button>

                {/* Full Combo */}
                <button
                  type="button"
                  onClick={() => setStudioType('combo')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative overflow-hidden ${
                    studioType === 'combo'
                      ? 'bg-gradient-to-b from-amber-500/30 to-purple-900/50 border-[#f6c344] shadow-[0_0_25px_rgba(213,160,39,0.4)] ring-2 ring-[#f6c344]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <span className="absolute top-1 right-1 bg-amber-400 text-[#120224] text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                    {isAr ? 'وفر 150+' : 'Save 150+'}
                  </span>
                  <Award className="w-5 h-5 text-amber-300" />
                  <span className="text-xs font-black text-white">{isAr ? 'البكج الشامل' : 'Full Combo'}</span>
                  <span className="text-[11px] text-[#f6c344] font-black">{adminSettings.comboPrice} {isAr ? 'ر.س' : 'SAR'}</span>
                  <span className="text-[9px] text-slate-400 line-through">{adminSettings.comboOldPrice} {isAr ? 'ر.س' : 'SAR'}</span>
                </button>
              </div>
            </div>

            {/* Step 3: Material Grade Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#d5a027] text-[#16032e] text-[10px] flex items-center justify-center font-black">3</span>
                  <span>{isAr ? 'اختر خامة الجلد والتطريز الفاخر:' : 'Select Leather Grade & Stitching:'}</span>
                </label>
                <span className="text-xs font-bold text-amber-300">
                  {isAr ? activeGrade.nameAr : activeGrade.nameEn}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LEATHER_GRADES.map(grade => {
                  const isSelected = selectedMaterial === grade.id;
                  const priceAddon = grade.id === 'diamond' 
                    ? adminSettings.diamondAddon 
                    : grade.id === 'cooling' 
                      ? adminSettings.coolingAddon 
                      : grade.id === 'alcantara' 
                        ? adminSettings.alcantaraAddon 
                        : adminSettings.nappaAddon;

                  return (
                    <button
                      key={grade.id}
                      type="button"
                      onClick={() => setSelectedMaterial(grade.id as any)}
                      className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-white/15 border-[#f6c344] shadow-md text-white ring-1 ring-[#f6c344]/40'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                          style={{ backgroundColor: grade.colorHex }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span className="truncate">{isAr ? grade.nameAr : grade.nameEn}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/10 text-amber-300 font-bold shrink-0">
                              {isAr ? grade.badgeAr : grade.badgeEn}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {isAr ? grade.descAr : grade.descEn}
                          </div>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <span className={`text-xs font-black ${priceAddon === 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {priceAddon === 0 ? (isAr ? 'مشمول' : 'Included') : `+${priceAddon} ${isAr ? 'ر.س' : 'SAR'}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Color Palette Swatches */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#d5a027] text-[#16032e] text-[10px] flex items-center justify-center font-black">4</span>
                  <span>{isAr ? 'اختر لون الوكالة المتناسق:' : 'Select OEM Interior Color:'}</span>
                </label>
                <span className="text-xs font-extrabold text-[#f6c344] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                  {isAr ? selectedColor.nameAr : selectedColor.nameEn}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {CUSTOM_COLORS.map(c => {
                  const isSelected = selectedColor.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white/20 border-[#f6c344] shadow-lg ring-2 ring-[#f6c344]/40'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span 
                        className="w-4 h-4 rounded-full border border-black/30 shadow-xs shrink-0" 
                        style={{ backgroundColor: c.hex }} 
                      />
                      <span className="text-xs font-bold text-white">
                        {isAr ? c.nameAr : c.nameEn}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#f6c344]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 5: Custom Addons & VIP Touches */}
            <div className="space-y-2.5 pt-1 border-t border-white/10">
              <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#d5a027] text-[#16032e] text-[10px] flex items-center justify-center font-black">5</span>
                <span>{isAr ? 'تخصيص الإضافات واللمسات الملكية:' : 'VIP Custom Extras & Add-ons:'}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Free Logo */}
                <button
                  type="button"
                  onClick={() => setAddonLogo(!addonLogo)}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    addonLogo 
                      ? 'bg-amber-400/15 border-[#f6c344] text-white shadow-xs' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${addonLogo ? 'bg-[#f6c344] border-[#f6c344] text-[#16032e]' : 'border-white/20'}`}>
                      {addonLogo && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-bold truncate">
                      {isAr ? 'تطريز شعار السيارة' : 'Car Logo Embroidery'}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 shrink-0">
                    {isAr ? 'مجاناً' : 'FREE'}
                  </span>
                </button>

                {/* Steering Cover */}
                <button
                  type="button"
                  onClick={() => setAddonSteering(!addonSteering)}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    addonSteering 
                      ? 'bg-amber-400/15 border-[#f6c344] text-white shadow-xs' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${addonSteering ? 'bg-[#f6c344] border-[#f6c344] text-[#16032e]' : 'border-white/20'}`}>
                      {addonSteering && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-bold truncate">
                      {isAr ? 'تلبيسة دركسون' : 'Steering Cover'}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-amber-300 shrink-0">
                    +{adminSettings.steeringAddon} {isAr ? 'ر.س' : 'SAR'}
                  </span>
                </button>

                {/* Neck Cushions */}
                <button
                  type="button"
                  onClick={() => setAddonCushions(!addonCushions)}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    addonCushions 
                      ? 'bg-amber-400/15 border-[#f6c344] text-white shadow-xs' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${addonCushions ? 'bg-[#f6c344] border-[#f6c344] text-[#16032e]' : 'border-white/20'}`}>
                      {addonCushions && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-bold truncate">
                      {isAr ? 'مخدات ميموري 2x' : 'Memory Pillows 2x'}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-amber-300 shrink-0">
                    +{adminSettings.cushionsAddon} {isAr ? 'ر.س' : 'SAR'}
                  </span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Live Interactive Preview Card (5 Cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-[#d5a027]/70 shadow-2xl flex flex-col justify-between group">
              
              {/* Product Live Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                <img 
                  src={dynamicPreviewImage} 
                  alt={isAr ? selectedCar.nameAr : selectedCar.nameEn} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent pointer-events-none" />
                
                {/* Floating Preview Badges */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                  <span className="bg-[#16032e]/90 text-[#f6c344] text-[10px] font-black px-2.5 py-1 rounded-full border border-[#f6c344]/40 backdrop-blur-md shadow">
                    {isAr ? 'تفصيل ليزري 0.1 مم' : '0.1mm Laser Fit'}
                  </span>
                  <span className="bg-emerald-500/90 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isAr ? adminSettings.warrantyBadgeAr : adminSettings.warrantyBadgeEn}</span>
                  </span>
                </div>

                {/* For Combo Package: Quick Preview Switcher Tabs */}
                {studioType === 'combo' && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 z-20">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('seats')}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                        previewTab === 'seats'
                          ? 'bg-[#d5a027] text-[#16032e] shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{isAr ? 'عرض المقاعد' : 'Seats View'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('mats')}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                        previewTab === 'mats'
                          ? 'bg-[#d5a027] text-[#16032e] shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>{isAr ? 'عرض الأرضيات' : 'Mats View'}</span>
                    </button>
                  </div>
                )}

                {/* Bottom Car & Customization Indicator */}
                <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-xs text-slate-200">
                  <div className="min-w-0 pr-2">
                    <div className="font-black text-amber-200 truncate">
                      {isAr ? selectedCar.nameAr : selectedCar.nameEn}
                    </div>
                    <div className="text-[10px] text-slate-300 truncate">
                      {studioType === 'combo' ? (isAr ? 'البكج الشامل (مقاعد + أرضيات 5D)' : 'Full VIP Combo') : (studioType === 'mats' ? (isAr ? 'أرضيات 5D ليزر' : '5D Laser Mats') : (isAr ? 'تلابيس مقاعد VIP' : 'VIP Seat Covers'))}
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-[#f6c344] bg-black/60 px-2 py-0.5 rounded-md border border-white/10 shrink-0">
                    {isAr ? selectedColor.nameAr : selectedColor.nameEn}
                  </span>
                </div>
              </div>

              {/* Price & Action Area */}
              <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-900 to-[#140226] border-t border-white/10 space-y-4">
                
                {/* Dynamic Configuration Summary Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="bg-white/10 text-amber-200 px-2 py-0.5 rounded-md border border-white/10 font-bold">
                    {isAr ? activeGrade.nameAr : activeGrade.nameEn}
                  </span>
                  {addonLogo && (
                    <span className="bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 font-bold">
                      {isAr ? 'تطريز ليزري مجاناً' : 'Free Logo'}
                    </span>
                  )}
                  {addonSteering && (
                    <span className="bg-amber-400/15 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30 font-bold">
                      {isAr ? 'تلبيسة دركسون' : 'Steering Cover'}
                    </span>
                  )}
                  {addonCushions && (
                    <span className="bg-purple-400/15 text-purple-300 px-2 py-0.5 rounded-md border border-purple-400/30 font-bold">
                      {isAr ? 'مخدات رقبة 2x' : '2x Pillows'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400 font-semibold">{isAr ? 'السعر الإجمالي بعد التخصيص:' : 'Total Price with Tax:'}</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black text-[#f6c344]">{studioTotalPrice}</span>
                      <span className="text-xs font-bold text-amber-200">{isAr ? 'ر.س' : 'SAR'}</span>
                      <span className="text-xs line-through text-slate-500 ml-1">{studioOldTotalPrice} {isAr ? 'ر.س' : 'SAR'}</span>
                    </div>
                  </div>

                  <div className="text-end">
                    <span className="inline-block bg-amber-400 text-[#120224] text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                      {isAr ? `وفرت ${studioTotalSavings} ر.س` : `Save ${studioTotalSavings} SAR`}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">{isAr ? adminSettings.installationNoteAr : adminSettings.installationNoteEn}</div>
                  </div>
                </div>

                {/* 2 Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleCustomizerAddToCart}
                    className="py-2.5 px-3 bg-gradient-to-r from-[#d5a027] via-[#f6c344] to-[#e5a93b] text-[#120224] text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:brightness-105 active:scale-95 transition-all"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#120224]" />
                    <span>{isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCustomizerWhatsApp}
                    className="py-2.5 px-3 bg-[#25d366] hover:bg-[#20ba59] text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-xl active:scale-95 transition-all"
                  >
                    <WhatsAppGlyph className="w-4 h-4" />
                    <span>{isAr ? 'حجز واتساب' : 'WhatsApp'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ========================================================
            ADMIN MODAL: VIP CUSTOMIZER STUDIO CONTROLS
            (نافذة تعديل الأسعار، الخامات، والنصوص والصور الخاصة بالأدمن)
            ======================================================== */}
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#1c0438] via-[#120224] to-[#090112] border-2 border-[#d5a027] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden text-white flex flex-col max-h-[92vh]">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950 via-[#1e043a] to-slate-950 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-[#f6c344] border border-[#d5a027]/40 flex items-center justify-center shadow-inner">
                    <Settings className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-white">
                      {isAr ? 'لوحة تحكم وتعديل استوديو التخصيص (Admin)' : 'VIP Customizer Studio Admin Controls'}
                    </h4>
                    <p className="text-[11px] text-amber-200/80 font-medium">
                      {isAr ? 'تحكم في أسعار البكجات، الخامات، النصوص، والصور مع حفظ فوري' : 'Manage package pricing, materials addons, texts, and media live'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center border-b border-white/10 bg-black/30 p-2 gap-1.5 overflow-x-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAdminActiveTab('packages')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    adminActiveTab === 'packages'
                      ? 'bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-[#120224] font-black shadow-sm'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{isAr ? 'أسعار البكجات' : 'Package Pricing'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveTab('materials')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    adminActiveTab === 'materials'
                      ? 'bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-[#120224] font-black shadow-sm'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>{isAr ? 'الخامات والإضافات' : 'Materials & Addons'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveTab('texts')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    adminActiveTab === 'texts'
                      ? 'bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-[#120224] font-black shadow-sm'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'النصوص والضمان' : 'Texts & Badges'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminActiveTab('media')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    adminActiveTab === 'media'
                      ? 'bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-[#120224] font-black shadow-sm'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isAr ? 'الصور المخصصة' : 'Media Overrides'}</span>
                </button>
              </div>

              {/* Modal Body / Tab Contents */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                
                {/* TAB 1: PACKAGES & BASE PRICING */}
                {adminActiveTab === 'packages' && (
                  <div className="space-y-4">
                    <div className="text-xs text-amber-300 font-bold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      {isAr ? '💡 حدد السعر الحالي (بعد العرض) والسعر القديم (المشطوب) لكل بكج:' : '💡 Set active offer price and old crossed-out price for each package:'}
                    </div>

                    {/* Seats */}
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-xs font-black text-[#f6c344]">{isAr ? '1. بكج تلابيس المقاعد VIP' : '1. Bespoke Seat Covers'}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'سعر البيع (ر.س):' : 'Offer Price (SAR):'}</label>
                          <input 
                            type="number"
                            value={editForm.seatsPrice}
                            onChange={e => setEditForm({ ...editForm, seatsPrice: Number(e.target.value) || 0 })}
                            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">{isAr ? 'السعر القديم المشطوب:' : 'Old Price (SAR):'}</label>
                          <input 
                            type="number"
                            value={editForm.seatsOldPrice}
                            onChange={e => setEditForm({ ...editForm, seatsOldPrice: Number(e.target.value) || 0 })}
                            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-slate-400 text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mats */}
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-xs font-black text-emerald-400">{isAr ? '2. بكج أرضيات 5D ليزر' : '2. 5D Laser Armor Mats'}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'سعر البيع (ر.س):' : 'Offer Price (SAR):'}</label>
                          <input 
                            type="number"
                            value={editForm.matsPrice}
                            onChange={e => setEditForm({ ...editForm, matsPrice: Number(e.target.value) || 0 })}
                            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">{isAr ? 'السعر القديم المشطوب:' : 'Old Price (SAR):'}</label>
                          <input 
                            type="number"
                            value={editForm.matsOldPrice}
                            onChange={e => setEditForm({ ...editForm, matsOldPrice: Number(e.target.value) || 0 })}
                            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-slate-400 text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Combo */}
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-xs font-black text-amber-300">{isAr ? '3. البكج الشامل (مقاعد + أرضيات)' : '3. Full VIP Combo'}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'سعر البيع (ر.س):' : 'Offer Price (SAR):'}</label>
                          <input 
                            type="number"
                            value={editForm.comboPrice}
                            onChange={e => setEditForm({ ...editForm, comboPrice: Number(e.target.value) || 0 })}
                            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">{isAr ? 'السعر القديم المشطوب:' : 'Old Price (SAR):'}</label>
                          <input 
                            type="number"
                            value={editForm.comboOldPrice}
                            onChange={e => setEditForm({ ...editForm, comboOldPrice: Number(e.target.value) || 0 })}
                            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-slate-400 text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LEATHER MATERIALS & ADDONS */}
                {adminActiveTab === 'materials' && (
                  <div className="space-y-4">
                    <div className="text-xs text-amber-300 font-bold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      {isAr ? '💡 حدد تكلفة الإضافة الإضافية (Add-on) لكل نوع جلد أو ملحق:' : '💡 Set additional addon price for each leather grade or accessory:'}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'جلد نابا ألماني (افتراضي):' : 'German Nappa Addon:'}</label>
                        <input 
                          type="number"
                          value={editForm.nappaAddon}
                          onChange={e => setEditForm({ ...editForm, nappaAddon: Number(e.target.value) || 0 })}
                          className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'تطريز دايموند 5D:' : '5D Diamond Quilted Addon:'}</label>
                        <input 
                          type="number"
                          value={editForm.diamondAddon}
                          onChange={e => setEditForm({ ...editForm, diamondAddon: Number(e.target.value) || 0 })}
                          className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'قماش ياباني بارد 55°C:' : 'Cooling Fabric Addon:'}</label>
                        <input 
                          type="number"
                          value={editForm.coolingAddon}
                          onChange={e => setEditForm({ ...editForm, coolingAddon: Number(e.target.value) || 0 })}
                          className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'شامواه كانتارا رويال:' : 'Alcantara Suede Addon:'}</label>
                        <input 
                          type="number"
                          value={editForm.alcantaraAddon}
                          onChange={e => setEditForm({ ...editForm, alcantaraAddon: Number(e.target.value) || 0 })}
                          className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'تلبيسة دركسون متناسقة:' : 'Steering Cover Addon:'}</label>
                        <input 
                          type="number"
                          value={editForm.steeringAddon}
                          onChange={e => setEditForm({ ...editForm, steeringAddon: Number(e.target.value) || 0 })}
                          className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'مخدات رقبة ميموري فوم 2x:' : 'Memory Foam Pillows 2x Addon:'}</label>
                        <input 
                          type="number"
                          value={editForm.cushionsAddon}
                          onChange={e => setEditForm({ ...editForm, cushionsAddon: Number(e.target.value) || 0 })}
                          className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: TEXTS & BADGES */}
                {adminActiveTab === 'texts' && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'عنوان القسم الرئيسي (عربي):' : 'Studio Title (Arabic):'}</label>
                      <input 
                        type="text"
                        value={editForm.titleAr}
                        onChange={e => setEditForm({ ...editForm, titleAr: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'الوصف الفرعي (عربي):' : 'Subtitle (Arabic):'}</label>
                      <textarea 
                        rows={2}
                        value={editForm.subtitleAr}
                        onChange={e => setEditForm({ ...editForm, subtitleAr: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-medium focus:border-[#f6c344] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'نص الضمان (عربي):' : 'Warranty Badge:'}</label>
                        <input 
                          type="text"
                          value={editForm.warrantyBadgeAr}
                          onChange={e => setEditForm({ ...editForm, warrantyBadgeAr: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'مدة التجهيز (عربي):' : 'Turnaround Badge:'}</label>
                        <input 
                          type="text"
                          value={editForm.turnaroundBadgeAr}
                          onChange={e => setEditForm({ ...editForm, turnaroundBadgeAr: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'مكان التركيب (عربي):' : 'Installation Note:'}</label>
                        <input 
                          type="text"
                          value={editForm.installationNoteAr}
                          onChange={e => setEditForm({ ...editForm, installationNoteAr: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: MEDIA OVERRIDES */}
                {adminActiveTab === 'media' && (
                  <div className="space-y-4">
                    <div className="text-xs text-amber-300 font-bold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                      {isAr ? '💡 يمكنك استبدال صورة المقاعد أو الأرضيات الافتراضية برابط صورة مخصصة:' : '💡 You can optionally override default seat or floor mat images with custom URLs:'}
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'رابط صورة المقاعد المخصصة (URL):' : 'Custom Seats Image URL:'}</label>
                      <input 
                        type="text"
                        placeholder="e.g. /images/seat-covers/camry-beige.jpg or https://..."
                        value={editForm.customSeatsImage || ''}
                        onChange={e => setEditForm({ ...editForm, customSeatsImage: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">{isAr ? 'رابط صورة الأرضيات المخصصة (URL):' : 'Custom Mats Image URL:'}</label>
                      <input 
                        type="text"
                        placeholder="e.g. /images/floor-mats/triangle-floors.jpg or https://..."
                        value={editForm.customMatsImage || ''}
                        onChange={e => setEditForm({ ...editForm, customMatsImage: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-bold focus:border-[#f6c344] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer / Actions */}
              <div className="p-4 sm:p-5 bg-black/40 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetAdminSettings}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAdminSettings}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/30"
                  >
                    <Save className="w-4 h-4 text-slate-950" />
                    <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </section>


      {/* ========================================================
          FEATURE 2: LASER 3D SCANNER & SAFETY LAB
          (مختبر المقاسات الليزرية وأمان الوسائد الهوائية)
          ======================================================== */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#b07e16] text-xs font-black mb-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'معايير الجودة الألمانية' : 'German Engineering Standard'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{isAr ? 'لماذا يختار عملاؤنا تفصيل السعيدي الملكي؟' : 'Why Choose Al-Saeedi Bespoke Tailoring?'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr ? 'أحدث أجهزة المسح الليزري ثلاثي الأبعاد لضمان مطابقة 100% بدون أي فراغات أو انزلاق.' : '3D laser scanning tech ensuring 100% exact fit with zero wrinkles and airbag compliance.'}
            </p>
          </div>

          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'ضمان ذهبي معتمد سنتين' : 'Certified 2-Year VIP Warranty'}</span>
          </div>
        </div>

        {/* 4 Interactive Feature Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: 3D Laser Scanner */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#d5a027] hover:shadow-xl transition-all duration-300 space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#b07e16] border border-amber-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#16032e] group-hover:text-[#f6c344] transition-all">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900 group-hover:text-[#16032e]">
              {isAr ? 'ماسح ليزري بدقة 0.1 مم' : '3D Laser Precision (0.1mm)'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {isAr 
                ? 'نأخذ أبعاد مقاعد وأرضيات كل سيارة بالليزر لتخرج التلبيسة كأنها تنجيد أصلي من مصنع الوكالة تماماً.' 
                : 'Scanned millimeter-by-millimeter to fit snugly over original seats with no sliding or bunching.'}
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-bold text-[#b07e16] flex items-center gap-1">
              <span>{isAr ? 'مطابقة وكالة 100%' : '100% Factory Match'}</span>
            </div>
          </div>

          {/* Card 2: Airbag Safety */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700">
              {isAr ? 'خياطة ذكية آمنة للإيرباق' : 'Airbag Deployment Safe'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {isAr 
                ? 'خياطة سرية خاصة معتمدة تفتح تلقائياً عند انطلاق الوسائد الهوائية الجانبية في حالات الطوارئ دون أي إعاقة.' 
                : 'Engineered seams burst open safely if side airbags deploy, preserving full factory safety rating.'}
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <span>{isAr ? 'أمان وسائد معتمد' : 'Airbag Certified'}</span>
            </div>
          </div>

          {/* Card 3: Extreme Heat Defense */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-xl transition-all duration-300 space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#16032e] group-hover:text-[#f6c344] transition-all">
              <Flame className="w-6 h-6 text-amber-500" />
            </div>
            <h4 className="text-sm font-black text-slate-900 group-hover:text-[#16032e]">
              {isAr ? 'عزل حراري صيفي 55°C' : '55°C Saudi Heat Defense'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {isAr 
                ? 'جلد بيئي ألماني مقاوم لأشعة شمس مكة الحارقة، لا يتشقق ولا يتغير لونه ولا يُصدر أي روائح بلاستيكية.' 
                : 'Formulated for Gulf climates. Odor-free, UV-resistant, crack-proof synthetic leather and cooling fabric.'}
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-bold text-amber-700 flex items-center gap-1">
              <span>{isAr ? 'بارد ومقاوم للجفاف' : 'Cool & Crack-Proof'}</span>
            </div>
          </div>

          {/* Card 4: Free Fitting */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 space-y-3 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-700">
              {isAr ? 'تركيب مجاني بمكة المكرمة' : 'Free Professional Fitting'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {isAr 
                ? 'تركيب احترافي مجاني في فرعنا ببطحاء قريش مكة، مع شحن سريع مجاني لجميع مدن ومناطق المملكة.' 
                : 'Free expert fitting at our Makkah branch or express nationwide shipping in 3-5 business days.'}
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-bold text-blue-700 flex items-center gap-1">
              <span>{isAr ? 'بطحاء قريش + شحن سريع' : 'Makkah + All KSA'}</span>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================
          FEATURE 3: INSTANT COMPATIBILITY QUICK-TEST ALERT BAR
          (فاحص التوافق السريع الفوري مع تنبيه مطابق ليزري)
          ======================================================== */}
      <section className="relative rounded-2xl bg-gradient-to-r from-purple-50 via-amber-50/50 to-purple-50 border-2 border-[#d5a027]/40 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-start">
            <div className="w-12 h-12 rounded-2xl bg-[#16032e] text-[#f6c344] flex items-center justify-center shrink-0 shadow-sm">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {isAr ? 'هل سيارتك متوافقة مع تفصيل السعيدي؟' : 'Is Your Vehicle Compatible? Quick Fit Check'}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {isAr 
                  ? 'اكتب اسم سيارتك وتحقق فوراً من توافر القوالب الليزرية والضمان الذهبي خلال ثانية واحدة:' 
                  : 'Type your car name to verify exact laser cutting templates and warranty support in 1 second:'}
              </p>
            </div>
          </div>

          {/* Quick Check Input Form */}
          <form onSubmit={handleQuickCheck} className="flex items-center gap-2 w-full lg:w-auto min-w-[280px] sm:min-w-[340px]">
            <input 
              type="text" 
              value={quickCheckQuery}
              onChange={e => setQuickCheckQuery(e.target.value)}
              placeholder={isAr ? "مثال: كامري 2024، تاهو، سوناتا..." : "e.g. Camry 2024, Tahoe, Sonata..."}
              className="flex-1 h-11 bg-white border border-slate-300 focus:border-[#3e0f77] focus:ring-2 focus:ring-[#d5a027]/40 rounded-xl px-3.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none shadow-xs"
            />
            <button
              type="submit"
              className="h-11 px-4 bg-[#16032e] hover:bg-[#270650] text-[#f6c344] text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0 border border-[#f6c344]/30"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'فحص سريع' : 'Check Now'}</span>
            </button>
          </form>
        </div>
      </section>

    </div>
  );
};

export const PostCategoryAdvancedFeatures = React.memo(PostCategoryAdvancedFeaturesComponent);

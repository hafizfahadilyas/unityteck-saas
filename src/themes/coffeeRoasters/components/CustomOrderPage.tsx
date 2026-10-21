import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { CustomCornerOrderSpecs } from '../types';
import { readAllThemeSettings } from '../../settings/themeSettingsStore';
import {
  Ruler,
  Layers,
  Sparkles,
  Grid,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  Phone,
  MessageCircle,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  Wrench,
  HelpCircle,
  FileText,
  Clock,
  Send,
  Eye,
  Sliders,
  Maximize2,
  Box,
  Palette,
  Compass,
  DollarSign,
  ChevronDown
} from 'lucide-react';

// ==========================================
// CONFIGURATION DATA & OPTIONS CATALOG
// ==========================================

interface DimensionPreset {
  id: string;
  name: string;
  nameAr: string;
  width: number;
  depth: number;
  height: number;
  badgeAr?: string;
  badgeEn?: string;
}

const DIMENSION_PRESETS: DimensionPreset[] = [
  {
    id: 'studio',
    name: 'Compact Studio',
    nameAr: 'استوديو مدمج',
    width: 100,
    depth: 50,
    height: 90,
    badgeAr: 'شائع للشقق',
    badgeEn: 'Popular for Apts'
  },
  {
    id: 'executive',
    name: 'Executive Barista',
    nameAr: 'الركن التنفيذي المتكامل',
    width: 140,
    depth: 60,
    height: 92,
    badgeAr: 'الأكثر طلباً ★',
    badgeEn: 'Best Seller ★'
  },
  {
    id: 'grand',
    name: 'Grand Island Corner',
    nameAr: 'ركن الجزيرة الملكي',
    width: 180,
    depth: 65,
    height: 95,
    badgeAr: 'للمجالس الفاخرة',
    badgeEn: 'Luxury Living'
  }
];

// Wood Structure Colors
const MDF_COLORS = [
  {
    id: 'mdf-white',
    name: 'Pure Matte White',
    nameAr: 'أبيض مطفي ناصع',
    hex: '#F8FAFC',
    border: '#E2E8F0',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
    descriptionAr: 'دهان ناري أملس ناصع مقاوم للاصفرار'
  },
  {
    id: 'mdf-cashmere',
    name: 'Warm Cashmere Cream',
    nameAr: 'كشمير عاجي دافئ',
    hex: '#E7DFD5',
    border: '#D1C7BA',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&q=80',
    descriptionAr: 'درجة كشمير مخملية تتماشى مع الإضاءة الدافئة'
  },
  {
    id: 'mdf-anthracite',
    name: 'Charcoal Anthracite',
    nameAr: 'رمادي أنثراسيت فحمي',
    hex: '#33373B',
    border: '#232528',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
    descriptionAr: 'فخامة هادئة وتناسق رائع مع مكائن الستانلس ستيل'
  },
  {
    id: 'mdf-navy',
    name: 'Royal Espresso Navy',
    nameAr: 'كحلي ملكي عميق',
    hex: '#1E293B',
    border: '#0F172A',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80',
    descriptionAr: 'لون كحلي فاخر مع لمسات مقابض ذهبية'
  },
  {
    id: 'mdf-emerald',
    name: 'Forest Emerald',
    nameAr: 'أخضر زمردي داكن',
    hex: '#1B3B36',
    border: '#112522',
    image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400&q=80',
    descriptionAr: 'طابع راقٍ مستوحى من أشجار البن والقصور الكلاسيكية'
  }
];

const CHIPBOARD_COLORS = [
  {
    id: 'chip-oak',
    name: 'Natural Nordic Oak',
    nameAr: 'خشب بلوط طبيعي فاتح',
    hex: '#D4B895',
    border: '#BA9C76',
    image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=400&q=80',
    descriptionAr: 'عروق خشب طبيعية مهدئة بنمط اسكندنافي عصري'
  },
  {
    id: 'chip-walnut',
    name: 'Smoked Dark Walnut',
    nameAr: 'خشب جوز مدخن داكن',
    hex: '#5C4033',
    border: '#422C22',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
    descriptionAr: 'درجة جوز غنية تعكس أصالة أركان القهوة التراثية'
  },
  {
    id: 'chip-concrete',
    name: 'Industrial Concrete Grey',
    nameAr: 'رمادي خرساني مودرن',
    hex: '#8C8D8E',
    border: '#6F7071',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
    descriptionAr: 'ملمس إسمنتي صناعي يواكب أحدث المقاهي المختصة'
  },
  {
    id: 'chip-teak',
    name: 'Rustic Teak Textured',
    nameAr: 'تيك ريفي بارز الملمس',
    hex: '#8B5A2B',
    border: '#69411D',
    image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=400&q=80',
    descriptionAr: 'تأثير الخشب الريفي مع مقاومة عالية للخدش والحرارة'
  },
  {
    id: 'chip-ash',
    name: 'Scandinavian Snow Ash',
    nameAr: 'رمادي ثلجي اسكندنافي',
    hex: '#CFCBC4',
    border: '#B3AFA7',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&q=80',
    descriptionAr: 'خشب رمادي فاتح يعطي رحابة وسعة بصرية فائقة'
  }
];

// Top Surface Colors
const MARBLE_ALT_COLORS = [
  {
    id: 'alt-calacatta',
    name: 'Calacatta Gold',
    nameAr: 'كلكتا جولد مع عروق ذهبية',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80',
    pattern: 'linear-gradient(135deg, #fdfbf7 0%, #ece5d8 50%, #e2d1b3 100%)'
  },
  {
    id: 'alt-statuario',
    name: 'Statuario White',
    nameAr: 'ستاتواريو إيطالي ناصع',
    image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=400&q=80',
    pattern: 'linear-gradient(135deg, #ffffff 0%, #e8eaed 50%, #d1d5db 100%)'
  },
  {
    id: 'alt-marquina',
    name: 'Nero Marquina Black',
    nameAr: 'ماركينا أسود بعروق بيضاء',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80',
    pattern: 'linear-gradient(135deg, #18181b 0%, #27272a 60%, #3f3f46 100%)'
  },
  {
    id: 'alt-armani',
    name: 'Grey Armani',
    nameAr: 'رمادي أرماني هادئ',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
    pattern: 'linear-gradient(135deg, #6b7280 0%, #4b5563 60%, #374151 100%)'
  },
  {
    id: 'alt-terrazzo',
    name: 'Snow White Terrazzo',
    nameAr: 'تيرازو أبيض كريستالي',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&q=80',
    pattern: 'radial-gradient(circle, #e5e7eb 10%, #f9fafb 90%)'
  }
];

const CAST_MARBLE_COLORS = [
  {
    id: 'cast-pearl',
    name: 'Pearl White Galaxy',
    nameAr: 'أبيض لؤلؤي بذرات كريستال',
    image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=400&q=80'
  },
  {
    id: 'cast-marfil',
    name: 'Crema Marfil Cast',
    nameAr: 'كريم مارفيل ناعم',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80'
  },
  {
    id: 'cast-silver',
    name: 'Silver Cloud Cast',
    nameAr: 'سيلفر كلاود رمادي سحابي',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80'
  },
  {
    id: 'cast-emperador',
    name: 'Dark Emperador Cast',
    nameAr: 'بني إمبرادور معرق',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80'
  },
  {
    id: 'cast-ivory',
    name: 'Matte Ivory Cast',
    nameAr: 'عاجي مطفي مانع للبقع',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&q=80'
  }
];

const SLAB_MARBLE_COLORS = [
  {
    id: 'slab-carrara',
    name: 'Italian Carrara Natural',
    nameAr: 'كرارا إيطالي نخب أول',
    image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=400&q=80'
  },
  {
    id: 'slab-marquina',
    name: 'Spanish Nero Marquina Natural',
    nameAr: 'نيرو ماركينا إسباني طبيعي',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80'
  },
  {
    id: 'slab-mugla',
    name: 'Turkish Mugla White',
    nameAr: 'موجلا تركي طبيعي ناصع',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80'
  },
  {
    id: 'slab-botticino',
    name: 'Royal Botticino Classic',
    nameAr: 'بوتشينو كلاسيك ملكي بيج',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80'
  },
  {
    id: 'slab-quartzite',
    name: 'Brazilian Quartzite Green',
    nameAr: 'أخضر كوارتزيت برازيلي نادر',
    image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400&q=80'
  }
];

// Handles
const HANDLE_OPTIONS = [
  {
    id: 'push-open',
    name: 'Minimalist Push-to-Open',
    nameAr: 'نظام ضغط بوش بدون مقابض ظاهرية',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
    descriptionAr: 'سطح أملس بالكامل يفتح بضغطة خفيفة باليد'
  },
  {
    id: 'gola-profile',
    name: 'Concealed Gola Profile',
    nameAr: 'مجرى جولا مخفي مدمج (ذهبي / أسود)',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80',
    descriptionAr: 'قناة ألمنيوم مخفية أسفل السطح للسحب الانسيابي'
  },
  {
    id: 'knurled-brass',
    name: 'Knurled Brushed Brass',
    nameAr: 'مقبض نحاسي مخرش فاخر Barista Pro',
    image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=400&q=80',
    descriptionAr: 'معدن صلب بملمس ماسي مانع للانزلاق'
  },
  {
    id: 'matte-black-t',
    name: 'Matte Black Slim T-Bar',
    nameAr: 'مقبض أسود مطفي نحيف مودرن T-Bar',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
    descriptionAr: 'تصميم عصري رفيع بخطوط حادة أنيقة'
  },
  {
    id: 'antique-bronze',
    name: 'Vintage Antique Bronze',
    nameAr: 'مقبض كلاسيكي برونزي معتق',
    image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=400&q=80',
    descriptionAr: 'لمسة تراثية فاخرة تليق بخشب الجوز والكرارا'
  }
];

// 5 Internal Division Options
const DIVISION_OPTIONS = [
  {
    id: 'div-1-drawers-shelf',
    name: 'Dual Drawers + Open Shelving',
    nameAr: 'درجان واسعان للأدوات + رفوف سفلية مفتوحة',
    descriptionEn: 'Two smooth barista utensil drawers on top with open bottom display shelves for coffee bags and drippers.',
    descriptionAr: 'درجان هيدروليكيان علويان لأدوات الباريستا والموازين، مع رفوف سفلية مفتوحة لعرض أكياس البن ومطحنة القهوة.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
    layoutBadge: 'النمط العملي الأكثر مرونة'
  },
  {
    id: 'div-2-bay-doors',
    name: 'Espresso Bay + Double Doors',
    nameAr: 'حجرة مخصصة للماكينة + درف تخزين مزدوجة',
    descriptionEn: 'Dedicated machine recessed nook with double closed doors concealing extra espresso gear and syrups.',
    descriptionAr: 'مساحة مركزية منسقة للماكينة مع درفتين مغلقتين لتخزين قوارير السيروب وأجهزة التبخير بدون فوضى.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
    layoutBadge: 'تنظيم محكم ومظهر نقي'
  },
  {
    id: 'div-3-fridge-rinser',
    name: 'Mini-Fridge Cavity + Rinser Cutout',
    nameAr: 'فجوة لثلاجة الحليب المدمجة + مسار شطاف الأكواب',
    descriptionEn: 'Engineered cavity sized for built-in milk mini-fridge with pre-drilled water supply & rinser drains.',
    descriptionAr: 'فجوة مهيأة لثلاجة حفظ الحليب المدمجة أسفل الركن مع فتحة مصممة مسبقاً لشطاف الأكواب والنوك بوكس.',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&q=80',
    layoutBadge: 'مثالي لمحبي مشروبات الحليب واللاتيه'
  },
  {
    id: 'div-4-multi-glass',
    name: 'Multi-Drawer + LED Glass Display',
    nameAr: 'وحدة أدراج باريستا + رف زجاجي بإضاءة LED',
    descriptionEn: '4 partitioned sliding organizer trays plus a tempered glass shelf with warm integrated LED downlights.',
    descriptionAr: 'أربعة أدراج مقسمة لحفظ البورتافلتر والباسكت والمباخر، مع رف زجاجي مقوى وإضاءة شريطية دافئة مدمجة.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80',
    layoutBadge: 'إطلالة ليلية ساحرة'
  },
  {
    id: 'div-5-water-pump',
    name: 'Concealed Water Station + Pull-out Trays',
    nameAr: 'مقصورة جالون الماء والمضخة + صواني سحب هيدروليكية',
    descriptionEn: 'Sound-dampened compartment for 20L water bottle and silent pump with 3 pull-out utility trays.',
    descriptionAr: 'خزانة عازلة للصوت تتسع لجالون ماء 20 لتر مع فتحات مضخة الضغط الأوتوماتيكية و3 صواني سحب ناعمة.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&q=80',
    layoutBadge: 'تجهيز كامل بدون تمديدات جدارية'
  }
];

// Accessories & Add-ons Catalog
interface AccessoryItem {
  id: string;
  name: string;
  nameAr: string;
  unitPrice: number;
  descriptionAr: string;
  image: string;
}

const ACCESSORIES_LIST: AccessoryItem[] = [
  {
    id: 'acc-rinser',
    name: 'Pitcher Rinser 304 Stainless',
    nameAr: 'شطاف أكواب احترافي مدمج (ستانلس ستيل 304)',
    unitPrice: 280,
    descriptionAr: 'شطاف ضغط عالي مع وصلات دخول المياه ومجرى تصريف مباشر مدمج بالسطح.',
    image: './src/assets/images/coffee_barista_accessories_set_1791219198302.jpg'
  },
  {
    id: 'acc-knockbox',
    name: 'Integrated Knockbox Bin',
    nameAr: 'صندوق نوك بوكس مدمج لمخلفات القهوة',
    unitPrice: 220,
    descriptionAr: 'وعاء مدمج بالسطح بقضيب مطاطي قوي لامتصاص صوت الطرق وسهولة التفريغ.',
    image: './src/assets/images/hibrew_portafilter_isolated.jpg'
  },
  {
    id: 'acc-faucet',
    name: 'Dedicated Barista Drinking Faucet',
    nameAr: 'صنبور مياه باريستا مخصص للفلترة',
    unitPrice: 340,
    descriptionAr: 'صنبور ستانلس ستيل مطفي بمقبض تحكم دقيق متصل بأنظمة التناضح والفلترة.',
    image: './src/assets/images/product_machine_silver_pro.png'
  },
  {
    id: 'acc-pump',
    name: 'Automatic Silent Water Pump',
    nameAr: 'مضخة مياه أوتوماتيكية صامتة لجالون الماء',
    unitPrice: 460,
    descriptionAr: 'مضخة كهربائية هادئة 220V تزود ماكينة الإسبريسو بالماء المضغوط من الجالون تلقائياً.',
    image: './src/assets/images/hibrew_espresso_isolated.jpg'
  },
  {
    id: 'acc-covers',
    name: 'Protective Silicone Mats & Machine Covers',
    nameAr: 'حصائر سيليكون حرارية وأغطية حماية للسطح',
    unitPrice: 120,
    descriptionAr: 'حصائر سميكة مقاومة للحرارة والخدش وانسكاب السوائل مع غطاء قماشي واقٍ.',
    image: './src/assets/images/hibrew_scale_isolated.jpg'
  },
  {
    id: 'acc-grips',
    name: 'Barista Grips & Magnetic Portafilter Wall Mounts',
    nameAr: 'مقابض باريستا إضافية وحوامل بورتافلتر مغناطيسية',
    unitPrice: 150,
    descriptionAr: 'طقم مثبتات جدارية مغناطيسية أنيقة لتعليق البورتافلتر والمكبس والفرش.',
    image: './src/assets/images/hibrew_barista_kit_isolated.jpg'
  }
];

export const CustomOrderPage: React.FC = () => {
  const { language, addCustomCornerToCart, navigateTo, showToast, storeIdentity } = useCart();
  const { activeStore } = useTenant();
  const isAr = language === 'AR';

  useEffect(() => {
    try {
      const s = readAllThemeSettings(activeStore?.id, activeStore);
      if (!s?.customOrder?.enabled) {
        navigateTo('home');
      }
    } catch {}
  }, [activeStore, navigateTo]);

  // Dynamic WhatsApp details from store owner settings
  const rawWhatsAppPhone =
    storeIdentity?.whatsapp ||
    (activeStore as any)?.whatsapp ||
    storeIdentity?.phone ||
    activeStore?.phone ||
    '+966549876543';

  let cleanWhatsAppPhone = rawWhatsAppPhone.replace(/\D/g, '') || '966549876543';
  if (cleanWhatsAppPhone.startsWith('05')) {
    cleanWhatsAppPhone = '966' + cleanWhatsAppPhone.substring(1);
  } else if (cleanWhatsAppPhone.startsWith('5') && cleanWhatsAppPhone.length === 9) {
    cleanWhatsAppPhone = '966' + cleanWhatsAppPhone;
  }

  const dynamicStoreName = isAr
    ? storeIdentity?.storeName || activeStore?.nameAr || activeStore?.name || 'متجر القهوة'
    : storeIdentity?.storeName || activeStore?.nameEn || activeStore?.name || 'Coffee Store';

  // Mode Selection: 'direct' (Automatic price & Add to Cart) vs 'quotation' (Quotation Request / RFQ)
  const [orderMode, setOrderMode] = useState<'direct' | 'quotation'>('direct');

  // Step 1: Dimensions (cm)
  const [width, setWidth] = useState<number>(140);
  const [depth, setDepth] = useState<number>(60);
  const [height, setHeight] = useState<number>(92);
  const [selectedPreset, setSelectedPreset] = useState<string>('executive');

  // Step 2: Structure Wood Type, Edge Finishing, Color
  const [woodType, setWoodType] = useState<'mdf' | 'chipboard'>('mdf');
  // MDF Edge options: 'paint' | 'pvc'. Chipboard MUST be 'pvc'.
  const [mdfEdgeFinish, setMdfEdgeFinish] = useState<'paint' | 'pvc'>('paint');
  const [selectedMdfColor, setSelectedMdfColor] = useState(MDF_COLORS[0]);
  const [selectedChipColor, setSelectedChipColor] = useState(CHIPBOARD_COLORS[0]);

  // Step 3: Top Surface Details
  const [surfaceType, setSurfaceType] = useState<'alternative' | 'natural'>('alternative');
  // If alternative: thickness ('18mm' | '4cm')
  const [altThickness, setAltThickness] = useState<'18mm' | '4cm'>('4cm');
  const [selectedAltColor, setSelectedAltColor] = useState(MARBLE_ALT_COLORS[0]);

  // If natural marble: kind ('cast' | 'slab')
  const [naturalKind, setNaturalKind] = useState<'cast' | 'slab'>('slab');
  const [selectedCastColor, setSelectedCastColor] = useState(CAST_MARBLE_COLORS[0]);
  const [selectedSlabColor, setSelectedSlabColor] = useState(SLAB_MARBLE_COLORS[0]);

  // Handles
  const [selectedHandle, setSelectedHandle] = useState(HANDLE_OPTIONS[1]);

  // Step 4: Internal Division
  const [selectedDivision, setSelectedDivision] = useState(DIVISION_OPTIONS[1]);
  const [divisionNotes, setDivisionNotes] = useState<string>('');

  // Step 5: Add-ons Quantities
  const [accessoryQuantities, setAccessoryQuantities] = useState<Record<string, number>>({
    'acc-rinser': 1,
    'acc-knockbox': 1,
    'acc-faucet': 0,
    'acc-pump': 1,
    'acc-covers': 1,
    'acc-grips': 0
  });

  // Additional general notes
  const [generalNotes, setGeneralNotes] = useState<string>('');

  // RFQ Modal State
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqName, setRfqName] = useState('فهد العتيبي');
  const [rfqPhone, setRfqPhone] = useState('0501234567');
  const [rfqCity, setRfqCity] = useState('الرياض (Riyadh)');
  const [rfqSubmitted, setRfqSubmitted] = useState(false);
  const [generatedRfqId, setGeneratedRfqId] = useState('');

  // Apply Dimension Preset
  const handleSelectPreset = (preset: DimensionPreset) => {
    setSelectedPreset(preset.id);
    setWidth(preset.width);
    setDepth(preset.depth);
    setHeight(preset.height);
  };

  // Stepper for accessories
  const handleQuantityChange = (accId: string, delta: number) => {
    setAccessoryQuantities(prev => {
      const current = prev[accId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [accId]: next };
    });
  };

  // ==========================================
  // DYNAMIC PRICING ALGORITHM (Section 7)
  // ==========================================
  const pricingBreakdown = useMemo(() => {
    // 1. Base Dimensions / Volume Pricing
    // Base unit: (W * D * H) in cubic meters * base carpentry rate
    const volumeM3 = (width * depth * height) / 1000000;
    const baseCarpentryRate = 1850; // SAR per m3 base structure
    const baseDimensionCost = Math.round(volumeM3 * baseCarpentryRate + 850);

    // 2. Wood Material Multiplier & Edge Finish
    let woodCost = 0;
    if (woodType === 'mdf') {
      const edgeCost = mdfEdgeFinish === 'paint' ? 360 : 180;
      woodCost = 280 + edgeCost;
    } else {
      // Chipboard (PVC only)
      woodCost = 140 + 150;
    }

    // 3. Top Surface Pricing
    let surfaceCost = 0;
    const surfaceAreaM2 = (width * depth) / 10000;
    if (surfaceType === 'alternative') {
      const thicknessRate = altThickness === '4cm' ? 580 : 380;
      surfaceCost = Math.round(surfaceAreaM2 * thicknessRate + 320);
    } else {
      // Natural Marble
      if (naturalKind === 'cast') {
        surfaceCost = Math.round(surfaceAreaM2 * 750 + 490);
      } else {
        // Slab natural marble
        surfaceCost = Math.round(surfaceAreaM2 * 1150 + 780);
      }
    }

    // 4. Handle Hardware
    let handleCost = 0;
    if (selectedHandle.id === 'knurled-brass') handleCost = 180;
    else if (selectedHandle.id === 'gola-profile') handleCost = 140;
    else if (selectedHandle.id === 'antique-bronze') handleCost = 160;
    else if (selectedHandle.id === 'matte-black-t') handleCost = 110;
    else handleCost = 80; // push-to-open

    // 5. Division Complexity
    let divisionCost = 0;
    if (selectedDivision.id === 'div-4-multi-glass') divisionCost = 390;
    else if (selectedDivision.id === 'div-3-fridge-rinser') divisionCost = 310;
    else if (selectedDivision.id === 'div-5-water-pump') divisionCost = 290;
    else if (selectedDivision.id === 'div-1-drawers-shelf') divisionCost = 240;
    else divisionCost = 190;

    // 6. Accessories Total
    const accessoriesTotal = ACCESSORIES_LIST.reduce((sum, item) => {
      const qty = accessoryQuantities[item.id] || 0;
      return sum + item.unitPrice * qty;
    }, 0);

    const subtotal = baseDimensionCost + woodCost + surfaceCost + handleCost + divisionCost + accessoriesTotal;
    const vat = Math.round(subtotal * 0.15 / 1.15); // 15% inclusive VAT

    return {
      baseDimensionCost,
      woodCost,
      surfaceCost,
      handleCost,
      divisionCost,
      accessoriesTotal,
      subtotal,
      vat,
      total: subtotal
    };
  }, [
    width,
    depth,
    height,
    woodType,
    mdfEdgeFinish,
    surfaceType,
    altThickness,
    naturalKind,
    selectedHandle,
    selectedDivision,
    accessoryQuantities
  ]);

  // Build the complete Specs Object
  const currentSpecs: CustomCornerOrderSpecs = useMemo(() => {
    const selectedWoodColor = woodType === 'mdf' ? selectedMdfColor : selectedChipColor;

    let surfaceColorObj = {
      id: selectedAltColor.id,
      name: selectedAltColor.name,
      nameAr: selectedAltColor.nameAr,
      image: selectedAltColor.image
    };

    if (surfaceType === 'natural') {
      if (naturalKind === 'cast') {
        surfaceColorObj = {
          id: selectedCastColor.id,
          name: selectedCastColor.name,
          nameAr: selectedCastColor.nameAr,
          image: selectedCastColor.image
        };
      } else {
        surfaceColorObj = {
          id: selectedSlabColor.id,
          name: selectedSlabColor.name,
          nameAr: selectedSlabColor.nameAr,
          image: selectedSlabColor.image
        };
      }
    }

    const selectedAccessories = ACCESSORIES_LIST.filter(
      acc => (accessoryQuantities[acc.id] || 0) > 0
    ).map(acc => ({
      id: acc.id,
      name: acc.name,
      nameAr: acc.nameAr,
      quantity: accessoryQuantities[acc.id],
      unitPrice: acc.unitPrice
    }));

    return {
      dimensions: { width, depth, height },
      woodType,
      woodTypeName: woodType === 'mdf' ? 'MDF High-Density' : 'Engineered Chipboard',
      woodTypeNameAr: woodType === 'mdf' ? 'خشب إم دي إف (MDF) عالي الكثافة' : 'خشب شيب بورد ملامين معالج',
      edgeFinishing:
        woodType === 'mdf'
          ? mdfEdgeFinish === 'paint'
            ? 'Smooth Lacquer Paint Finish'
            : 'PVC Edge Banding'
          : 'PVC Edge Banding Only',
      edgeFinishingAr:
        woodType === 'mdf'
          ? mdfEdgeFinish === 'paint'
            ? 'تشطيب دهان ناري أملس'
            : 'شريط حواف بي في سي حراري 2مم'
          : 'شريط حواف بي في سي حراري 2مم فقط',
      structureColor: {
        id: selectedWoodColor.id,
        name: selectedWoodColor.name,
        nameAr: selectedWoodColor.nameAr,
        hex: selectedWoodColor.hex,
        image: selectedWoodColor.image
      },
      surfaceType,
      surfaceTypeName: surfaceType === 'alternative' ? 'Marble Alternative (Sintered Stone)' : 'Natural Marble',
      surfaceTypeNameAr: surfaceType === 'alternative' ? 'بديل الرخام (حجر تلبيد / Sintered Stone)' : 'رخام طبيعي أصلي',
      surfaceThickness: surfaceType === 'alternative' ? altThickness : undefined,
      surfaceThicknessAr:
        surfaceType === 'alternative' ? (altThickness === '4cm' ? 'سماكة 4 سم مدبولة' : 'سماكة 18 مم') : undefined,
      marbleKind: surfaceType === 'natural' ? naturalKind : undefined,
      marbleKindName: surfaceType === 'natural' ? (naturalKind === 'cast' ? 'Cast Marble' : 'Slab Marble') : undefined,
      marbleKindNameAr:
        surfaceType === 'natural'
          ? naturalKind === 'cast'
            ? 'رخام مصبوب معالج'
            : 'رخام ألواح صخرية طبيعية'
          : undefined,
      surfaceColor: surfaceColorObj,
      handleType: {
        id: selectedHandle.id,
        name: selectedHandle.name,
        nameAr: selectedHandle.nameAr,
        image: selectedHandle.image
      },
      internalDivision: {
        id: selectedDivision.id,
        name: selectedDivision.name,
        nameAr: selectedDivision.nameAr,
        image: selectedDivision.image
      },
      divisionNotes,
      accessories: selectedAccessories,
      generalNotes,
      orderMode,
      quoteReference: generatedRfqId || undefined
    };
  }, [
    width,
    depth,
    height,
    woodType,
    mdfEdgeFinish,
    selectedMdfColor,
    selectedChipColor,
    surfaceType,
    altThickness,
    selectedAltColor,
    naturalKind,
    selectedCastColor,
    selectedSlabColor,
    selectedHandle,
    selectedDivision,
    divisionNotes,
    accessoryQuantities,
    generalNotes,
    orderMode,
    generatedRfqId
  ]);

  // Handle Action 1: Add to Bag (Direct)
  const handleAddToCart = () => {
    addCustomCornerToCart(currentSpecs, pricingBreakdown.total, true);
  };

  // Handle Action 2: Instant Checkout
  const handleInstantCheckout = () => {
    addCustomCornerToCart(currentSpecs, pricingBreakdown.total, false);
    navigateTo('checkout');
  };

  // Handle Action 3: Submit Quotation Request (Option 2)
  const handleSubmitQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const quoteId = `RFQ-HB-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedRfqId(quoteId);
    setRfqSubmitted(true);
    showToast(
      language === 'AR'
        ? `تم رفع طلب عرض السعر برقم مرجعي: ${quoteId}`
        : `Quotation Request submitted: Ref #${quoteId}`
    );
    // Directly launch WhatsApp with the quotation request sent to the store owner's WhatsApp!
    setTimeout(() => {
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }
    }, 400);
  };

  // Pre-filled WhatsApp link with full technical specifications
  const whatsappUrl = useMemo(() => {
    const textAr = `مرحباً ${dynamicStoreName} ☕️
أرغب في الحصول على استشارة وعرض سعر لتفصيل ركن قهوة مخصص بالمواصفات التالية:
• رقم الطلب: ${generatedRfqId || 'طلب جديد'}
• المقاسات: العرض ${width} سم × العمق ${depth} سم × الارتفاع ${height} سم
• نوع الخشب: ${currentSpecs.woodTypeNameAr}
• تشطيب الحواف: ${currentSpecs.edgeFinishingAr}
• لون الهيكل: ${currentSpecs.structureColor.nameAr}
• السطح العلوي: ${currentSpecs.surfaceTypeNameAr} (${currentSpecs.surfaceThicknessAr || currentSpecs.marbleKindNameAr || ''})
• لون السطح: ${currentSpecs.surfaceColor.nameAr}
• المقابض: ${currentSpecs.handleType.nameAr}
• التقسيم الداخلي: ${currentSpecs.internalDivision.nameAr}
• ملاحظات التقسيم: ${divisionNotes || 'لا توجد'}
• الإضافات والإكسسوارات: ${currentSpecs.accessories.map(a => `${a.nameAr} (x${a.quantity})`).join(', ') || 'بدون إضافات'}
• العميل: ${rfqName || 'عميل المتجر'} - ${rfqPhone || ''} (${rfqCity || ''})
${pricingBreakdown.total ? `• التقدير المبدئي: ${pricingBreakdown.total.toLocaleString()} ر.س` : ''}

يرجى التواصل معي لتأكيد التفاصيل وموعد المعاينة والتنفيذ. شكراً لكم!`;

    const textEn = `Hello ${dynamicStoreName} ☕️
I would like to request a consultation and quote for a custom coffee station with the following specs:
• Order Ref: ${generatedRfqId || 'New Custom Order'}
• Dimensions: Width ${width} cm × Depth ${depth} cm × Height ${height} cm
• Structure Wood: ${currentSpecs.woodTypeName}
• Color: ${currentSpecs.structureColor.name}
• Top Surface: ${currentSpecs.surfaceTypeName} (${currentSpecs.surfaceColor.name})
• Handles: ${currentSpecs.handleType.name}
• Internal Division: ${currentSpecs.internalDivision.name}
• Accessories: ${currentSpecs.accessories.map(a => `${a.name} (x${a.quantity})`).join(', ') || 'None'}
• Customer: ${rfqName || 'Store Customer'} - ${rfqPhone || ''} (${rfqCity || ''})
${pricingBreakdown.total ? `• Estimated Total: ${pricingBreakdown.total.toLocaleString()} SAR` : ''}

Please contact me to confirm the details. Thank you!`;

    const message = isAr ? textAr : textEn;
    return `https://wa.me/${cleanWhatsAppPhone}?text=${encodeURIComponent(message)}`;
  }, [
    dynamicStoreName,
    cleanWhatsAppPhone,
    isAr,
    width,
    depth,
    height,
    currentSpecs,
    divisionNotes,
    rfqName,
    rfqPhone,
    rfqCity,
    generatedRfqId,
    pricingBreakdown.total
  ]);

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-neutral-900 selection:bg-neutral-900 selection:text-white pb-24 text-start">
      {/* 1. HERO & PAGE HEADER */}
      <div className="bg-white border-b border-neutral-200/80 pt-8 pb-10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <button
              onClick={() => navigateTo('home')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              {language === 'AR' ? 'الرئيسية' : 'Home'}
            </button>
            <span>/</span>
            <button
              onClick={() => navigateTo('products')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              {language === 'AR' ? 'دواليب وأركان القهوة' : 'Coffee Cabinets'}
            </button>
            <span>/</span>
            <span className="text-black font-bold">
              {language === 'AR' ? 'تفصيل حسب الطلب' : 'Custom Made'}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-2">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-900 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{language === 'AR' ? 'التخطيط - التصميم - التنفيذ' : 'Planning - Design - Execution'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-950 font-sans">
                {language === 'AR' ? 'تفصيل ركن القهوة حسب الطلب' : 'Custom Made / Tailor-Made Coffee Station'}
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                {language === 'AR'
                  ? 'صمّم ركن قهوتك المثالي بأدق المقاسات واختيارات الأخشاب والرخام الطبيعي والتقسيمات الداخلية مع حساب فوري للسعر أو طلب عرض سعر رسمي واستشارة مجانية.'
                  : 'Configure your bespoke coffee corner: exact dimensions in cm, solid MDF or Chipboard, sintered stone or natural marble, internal bays, and barista add-ons.'}
              </p>
            </div>

            {/* Ordering Mechanism Selector Tabs (Requirement #7) */}
            <div className="bg-neutral-100 p-1.5 rounded-2xl flex items-center gap-1 shrink-0 self-start lg:self-auto border border-neutral-200/60 shadow-xs">
              <button
                type="button"
                onClick={() => setOrderMode('direct')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  orderMode === 'direct'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>{language === 'AR' ? 'تسعير فوري ودفع مباشر' : 'Direct Order & Pricing'}</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderMode('quotation')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  orderMode === 'quotation'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>{language === 'AR' ? 'طلب عرض سعر واستشارة' : 'Quotation Request'}</span>
              </button>
            </div>
          </div>

          {/* Highlights Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-100 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{language === 'AR' ? 'ضمان الوكيل المعتمد سنتين' : '2-Year Agency Warranty'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{language === 'AR' ? 'توصيل وتركيب لكافة مدن المملكة' : 'White-Glove Setup across KSA'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{language === 'AR' ? 'تنفيذ بأيدي نجارين مهرة' : 'Master Carpenter Precision'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{language === 'AR' ? 'معاينة واعتماد قبل التصنيع' : 'Digital Drawing Approval'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE / CONFIGURATION FORM */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: 5 CONFIGURATION STEPS (7 or 8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* ======================================================== */}
            {/* STEP 1: CORNER DIMENSIONS                               */}
            {/* ======================================================== */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">
                      {language === 'AR' ? 'أبعاد ومقاسات الركن' : '1. Corner Dimensions'}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      {language === 'AR'
                        ? 'أدخل المقاسات بالسنتيمتر (العرض × العمق × الارتفاع)'
                        : 'Enter size in centimeters (Width × Depth × Height)'}
                    </p>
                  </div>
                </div>

                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
                  {language === 'AR' ? 'حقل إلزامي *' : 'Mandatory *'}
                </span>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 block">
                  {language === 'AR' ? 'مقاسات جاهزة مقترحة:' : 'Popular Dimension Presets:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DIMENSION_PRESETS.map(preset => {
                    const isSelected = selectedPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-black bg-neutral-900 text-white shadow-xs'
                            : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50 text-neutral-800'
                        }`}
                      >
                        {preset.badgeAr && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 inline-block ${
                              isSelected
                                ? 'bg-amber-400 text-neutral-950'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {language === 'AR' ? preset.badgeAr : preset.badgeEn}
                          </span>
                        )}
                        <div className="font-bold text-xs sm:text-sm">
                          {language === 'AR' ? preset.nameAr : preset.name}
                        </div>
                        <div
                          className={`text-xs font-mono mt-0.5 ${
                            isSelected ? 'text-neutral-300' : 'text-neutral-500'
                          }`}
                        >
                          {preset.width}W × {preset.depth}D × {preset.height}H cm
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exact Slider / Input Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                {/* 1. Width */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      {language === 'AR' ? 'العرض (Width)' : 'Width (cm)'}
                    </span>
                    <span className="text-xs font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                      {width} سم
                    </span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={260}
                    step={5}
                    value={width}
                    onChange={e => {
                      setWidth(Number(e.target.value));
                      setSelectedPreset('custom');
                    }}
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={60}
                      max={260}
                      value={width}
                      onChange={e => {
                        setWidth(Number(e.target.value));
                        setSelectedPreset('custom');
                      }}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-mono text-center font-bold focus:outline-hidden"
                    />
                    <span className="text-[11px] text-neutral-500 shrink-0">cm</span>
                  </div>
                  <p className="text-[10.5px] text-neutral-400">
                    {language === 'AR' ? 'النطاق: 60 سم – 260 سم' : 'Range: 60cm – 260cm'}
                  </p>
                </div>

                {/* 2. Depth */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      {language === 'AR' ? 'العمق (Depth)' : 'Depth (cm)'}
                    </span>
                    <span className="text-xs font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                      {depth} سم
                    </span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={90}
                    step={5}
                    value={depth}
                    onChange={e => {
                      setDepth(Number(e.target.value));
                      setSelectedPreset('custom');
                    }}
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={40}
                      max={90}
                      value={depth}
                      onChange={e => {
                        setDepth(Number(e.target.value));
                        setSelectedPreset('custom');
                      }}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-mono text-center font-bold focus:outline-hidden"
                    />
                    <span className="text-[11px] text-neutral-500 shrink-0">cm</span>
                  </div>
                  <p className="text-[10.5px] text-neutral-400">
                    {language === 'AR' ? 'العمق القياسي: 60 سم' : 'Standard depth: 60cm'}
                  </p>
                </div>

                {/* 3. Height */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      {language === 'AR' ? 'الارتفاع (Height)' : 'Height (cm)'}
                    </span>
                    <span className="text-xs font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                      {height} سم
                    </span>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={120}
                    step={1}
                    value={height}
                    onChange={e => {
                      setHeight(Number(e.target.value));
                      setSelectedPreset('custom');
                    }}
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={70}
                      max={120}
                      value={height}
                      onChange={e => {
                        setHeight(Number(e.target.value));
                        setSelectedPreset('custom');
                      }}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-mono text-center font-bold focus:outline-hidden"
                    />
                    <span className="text-[11px] text-neutral-500 shrink-0">cm</span>
                  </div>
                  <p className="text-[10.5px] text-neutral-400">
                    {language === 'AR' ? 'ارتفاع باريستا المريح: 90–92 سم' : 'Ergonomic height: 90–92cm'}
                  </p>
                </div>
              </div>

              {/* Calculated Area Metric Note */}
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>
                    {language === 'AR'
                      ? 'مساحة سطح العمل الإجمالية المقدرة:'
                      : 'Calculated Countertop Working Area:'}
                  </span>
                </div>
                <span className="font-mono font-bold">
                  {((width * depth) / 10000).toFixed(2)} م² (متر مربع)
                </span>
              </div>
            </section>

            {/* ======================================================== */}
            {/* STEP 2: STRUCTURE DETAILS (WOOD, EDGE, COLORS)          */}
            {/* ======================================================== */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">
                      {language === 'AR' ? 'تفاصيل الهيكل الأساسي' : '2. Structure Details'}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      {language === 'AR'
                        ? 'نوع الخشب، تشطيب الحواف، ولون الهيكل'
                        : 'Wood type, Edge finishing, and Structure color'}
                    </p>
                  </div>
                </div>

                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
                  {language === 'AR' ? 'حقل إلزامي *' : 'Mandatory *'}
                </span>
              </div>

              {/* 2.1 Wood Type Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-800 block">
                  {language === 'AR' ? '1. اختيار نوع الخشب:' : '1. Wood Type Selection:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* MDF Wood */}
                  <div
                    onClick={() => setWoodType('mdf')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative space-y-2 ${
                      woodType === 'mdf'
                        ? 'border-black bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base">
                        {language === 'AR' ? 'خشب إم دي إف (MDF Wood)' : 'MDF Wood'}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          woodType === 'mdf'
                            ? 'border-white bg-white text-black'
                            : 'border-neutral-300'
                        }`}
                      >
                        {woodType === 'mdf' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        woodType === 'mdf' ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                    >
                      {language === 'AR'
                        ? 'ألواح فايبر عالية الكثافة معالجة ضد الرطوبة، سطح فائق النعومة يدعم دهان اللكر الناري والألوان الفاخرة.'
                        : 'Moisture-resistant high-density board, ultra-smooth for fine lacquer paint finishes.'}
                    </p>
                    <span
                      className={`text-[10.5px] px-2 py-0.5 rounded font-mono inline-block font-semibold ${
                        woodType === 'mdf'
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {language === 'AR' ? 'خيار الفخامة الموصى به' : 'Recommended Premium'}
                    </span>
                  </div>

                  {/* Chipboard Wood */}
                  <div
                    onClick={() => {
                      setWoodType('chipboard');
                      setMdfEdgeFinish('pvc'); // Chipboard enforces PVC tape only!
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative space-y-2 ${
                      woodType === 'chipboard'
                        ? 'border-black bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base">
                        {language === 'AR' ? 'خشب شيب بورد (Chipboard Wood)' : 'Chipboard Wood'}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          woodType === 'chipboard'
                            ? 'border-white bg-white text-black'
                            : 'border-neutral-300'
                        }`}
                      >
                        {woodType === 'chipboard' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        woodType === 'chipboard' ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                    >
                      {language === 'AR'
                        ? 'خشب مضغوط معالج مع طبقة ملامين ألمانية E1 بملمس خشب طبيعي بارز ومقاومة عالية للخدوش وسعر اقتصادي.'
                        : 'German E1 grade particle board with textured melamine layer, scratch resistant & cost effective.'}
                    </p>
                    <span
                      className={`text-[10.5px] px-2 py-0.5 rounded font-mono inline-block font-semibold ${
                        woodType === 'chipboard'
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {language === 'AR' ? 'اقتصادي وعملي' : 'Value & Practical'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2.2 Edge Finishing (Conditional as required by Section 2.2) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800">
                    {language === 'AR' ? '2. تشطيب الحواف (Edge Finishing):' : '2. Edge Finishing:'}
                  </label>
                  {woodType === 'chipboard' && (
                    <span className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-semibold border border-amber-200/60">
                      {language === 'AR'
                        ? 'حصر خشب الشيب بورد: شريط PVC حراري فقط'
                        : 'Chipboard requires PVC tape only'}
                    </span>
                  )}
                </div>

                {woodType === 'mdf' ? (
                  /* MDF allows Paint Finish OR PVC Tape */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMdfEdgeFinish('paint')}
                      className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                        mdfEdgeFinish === 'paint'
                          ? 'border-black bg-neutral-900 text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 text-neutral-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs sm:text-sm">
                          {language === 'AR' ? 'تشطيب دهان ناري أملس' : 'Smooth Paint Finish'}
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            mdfEdgeFinish === 'paint' ? 'text-neutral-300' : 'text-neutral-500'
                          }`}
                        >
                          {language === 'AR' ? 'دهان رش ناري متصل بدون فواصل مرئية' : 'Seamless sprayed lacquer joints'}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold shrink-0">
                        {language === 'AR' ? '+ 360 ر.س' : '+ SAR 360'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMdfEdgeFinish('pvc')}
                      className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                        mdfEdgeFinish === 'pvc'
                          ? 'border-black bg-neutral-900 text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 text-neutral-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs sm:text-sm">
                          {language === 'AR' ? 'شريط حواف بي في سي حراري' : 'PVC Adhesive Tape'}
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            mdfEdgeFinish === 'pvc' ? 'text-neutral-300' : 'text-neutral-500'
                          }`}
                        >
                          {language === 'AR' ? 'حواف PVC مقواة 2مم مقاومة للصدمات' : '2mm heavy duty edge banding'}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold shrink-0">
                        {language === 'AR' ? '+ 180 ر.س' : '+ SAR 180'}
                      </span>
                    </button>
                  </div>
                ) : (
                  /* Chipboard enforces PVC adhesive tape ONLY */
                  <div className="p-4 rounded-2xl bg-neutral-100 border border-neutral-300 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                        <span>{language === 'AR' ? 'شريط حواف بي في سي حراري (PVC فقط)' : 'PVC Adhesive Tape Only'}</span>
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs text-neutral-600">
                        {language === 'AR'
                          ? 'تم تثبيت خيار شريط PVC تلقائياً لضمان عزل حواف الشيب بورد ضد الرطوبة وحمايتها من التقشير.'
                          : 'Automatically locked to heat-sealed PVC edge tape to seal core moisture and prevent chipping.'}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-900 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 shrink-0">
                      {language === 'AR' ? 'مشمول' : 'Included'}
                    </span>
                  </div>
                )}
              </div>

              {/* 2.3 Structure Colors (5 options per wood type with images as required) */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-neutral-800 block">
                  {language === 'AR'
                    ? `3. ألوان الهيكل (${woodType === 'mdf' ? '5 ألوان لخشب MDF' : '5 خيارات لخشب الشيب بورد'}):`
                    : `3. Structure Colors (${woodType === 'mdf' ? '5 MDF Colors' : '5 Chipboard Colors'}):`}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(woodType === 'mdf' ? MDF_COLORS : CHIPBOARD_COLORS).map(colorOpt => {
                    const activeColor = woodType === 'mdf' ? selectedMdfColor : selectedChipColor;
                    const isSelected = activeColor.id === colorOpt.id;

                    return (
                      <div
                        key={colorOpt.id}
                        onClick={() => {
                          if (woodType === 'mdf') setSelectedMdfColor(colorOpt);
                          else setSelectedChipColor(colorOpt);
                        }}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center space-y-2 group ${
                          isSelected
                            ? 'border-black ring-2 ring-black/10 bg-white shadow-xs'
                            : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                        }`}
                      >
                        {/* Swatch Image / Texture Preview */}
                        <div className="w-full h-16 rounded-xl overflow-hidden relative shadow-inner">
                          <img
                            src={colorOpt.image}
                            alt={colorOpt.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div
                            className="absolute bottom-1 right-1 w-4 h-4 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: colorOpt.hex }}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="w-full">
                          <div className="font-bold text-xs text-neutral-900 truncate">
                            {language === 'AR' ? colorOpt.nameAr : colorOpt.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            {colorOpt.hex}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ======================================================== */}
            {/* STEP 3: TOP SURFACE DETAILS (SURFACE, THICKNESS/MARBLE, HANDLE) */}
            {/* ======================================================== */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">
                      {language === 'AR' ? 'تفاصيل السطح العلوي والمقابض' : '3. Top Surface & Handle Details'}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      {language === 'AR'
                        ? 'بديل الرخام أو الرخام الطبيعي، السماكة، ونوع المقابض'
                        : 'Marble alternative or Natural marble, thickness, and handle selection'}
                    </p>
                  </div>
                </div>

                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
                  {language === 'AR' ? 'حقل إلزامي *' : 'Mandatory *'}
                </span>
              </div>

              {/* 3.1 Surface Type Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-800 block">
                  {language === 'AR' ? '1. نوع السطح العلوي:' : '1. Surface Type Selection:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setSurfaceType('alternative')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative space-y-2 ${
                      surfaceType === 'alternative'
                        ? 'border-black bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base">
                        {language === 'AR' ? 'بديل الرخام (Sintered Stone / PVC)' : 'Marble Alternative (Sintered Stone)'}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          surfaceType === 'alternative'
                            ? 'border-white bg-white text-black'
                            : 'border-neutral-300'
                        }`}
                      >
                        {surfaceType === 'alternative' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        surfaceType === 'alternative' ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                    >
                      {language === 'AR'
                        ? 'حجر تلبيد بورسلان صناعي فائق الصلابة ومقاوم للحرارة حتى 300° مئوية ومانع لامتصاص بقع القهوة.'
                        : 'Ultra-durable sintered stone, heat resistant up to 300°C, non-porous and zero coffee stains.'}
                    </p>
                    <span
                      className={`text-[10.5px] px-2 py-0.5 rounded font-mono inline-block font-semibold ${
                        surfaceType === 'alternative'
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {language === 'AR' ? 'مقاوم للبقع والحرارة 100%' : '100% Heat & Stain Proof'}
                    </span>
                  </div>

                  <div
                    onClick={() => setSurfaceType('natural')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative space-y-2 ${
                      surfaceType === 'natural'
                        ? 'border-black bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base">
                        {language === 'AR' ? 'رخام طبيعي أصلي (Natural Marble)' : 'Natural Marble'}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          surfaceType === 'natural'
                            ? 'border-white bg-white text-black'
                            : 'border-neutral-300'
                        }`}
                      >
                        {surfaceType === 'natural' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        surfaceType === 'natural' ? 'text-neutral-300' : 'text-neutral-500'
                      }`}
                    >
                      {language === 'AR'
                        ? 'صخور طبيعية جبلية أو مصبوبة بلمعان أصيل وعروق فريدة تمنح ركن القهوة طابعاً فندقياً استثنائياً.'
                        : 'Quarried natural stone slabs or engineered cast marble with rich authentic vein patterns.'}
                    </p>
                    <span
                      className={`text-[10.5px] px-2 py-0.5 rounded font-mono inline-block font-semibold ${
                        surfaceType === 'natural'
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {language === 'AR' ? 'فخامة ملكية أصيلة' : 'Royal Stone Luxury'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3.2 Conditional: If Marble Alternative -> Thickness (18mm or 4cm) + 5 Colors */}
              {surfaceType === 'alternative' && (
                <div className="space-y-5 pt-2 border-t border-neutral-100">
                  {/* Thickness */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-800 block">
                      {language === 'AR' ? 'سماكة بديل الرخام:' : 'Marble Alternative Thickness:'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAltThickness('18mm')}
                        className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                          altThickness === '18mm'
                            ? 'border-black bg-neutral-900 text-white'
                            : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 text-neutral-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm">
                            {language === 'AR' ? 'سماكة 18 مم (1.8 سم)' : '18mm Thickness'}
                          </div>
                          <div
                            className={`text-[11px] mt-0.5 ${
                              altThickness === '18mm' ? 'text-neutral-300' : 'text-neutral-500'
                            }`}
                          >
                            {language === 'AR' ? 'انسيابي وناعم وخفيف الوزن' : 'Slim, lightweight modern profile'}
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold shrink-0">
                          {language === 'AR' ? '+ 380 ر.س' : '+ SAR 380'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAltThickness('4cm')}
                        className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                          altThickness === '4cm'
                            ? 'border-black bg-neutral-900 text-white'
                            : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 text-neutral-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm">
                            {language === 'AR' ? 'سماكة 4 سم (حافة مدبولة فخمة)' : '4cm Double Edge Profile'}
                          </div>
                          <div
                            className={`text-[11px] mt-0.5 ${
                              altThickness === '4cm' ? 'text-neutral-300' : 'text-neutral-500'
                            }`}
                          >
                            {language === 'AR' ? 'حافة صلبة مضاعفة بمظهر الكتل الحجرية الفاخرة' : 'Thick monolithic block aesthetic'}
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold shrink-0">
                          {language === 'AR' ? '+ 580 ر.س' : '+ SAR 580'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 5 Colors for Marble Alternative */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-neutral-800 block">
                      {language === 'AR'
                        ? 'ألوان بديل الرخام (5 خيارات مع صور توضيحية):'
                        : 'Marble Alternative Colors (5 Options with HD Preview):'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {MARBLE_ALT_COLORS.map(colorOpt => {
                        const isSelected = selectedAltColor.id === colorOpt.id;
                        return (
                          <div
                            key={colorOpt.id}
                            onClick={() => setSelectedAltColor(colorOpt)}
                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center space-y-2 group ${
                              isSelected
                                ? 'border-black ring-2 ring-black/10 bg-white shadow-xs'
                                : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                            }`}
                          >
                            <div className="w-full h-16 rounded-xl overflow-hidden relative shadow-inner">
                              <img
                                src={colorOpt.image}
                                alt={colorOpt.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="font-bold text-xs text-neutral-900 truncate w-full">
                              {language === 'AR' ? colorOpt.nameAr : colorOpt.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 3.3 Conditional: If Natural Marble -> Subtype (Cast Marble vs Slab Marble) + 5 Colors for each */}
              {surfaceType === 'natural' && (
                <div className="space-y-5 pt-2 border-t border-neutral-100">
                  {/* Marble Subtype */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-800 block">
                      {language === 'AR' ? 'نوع الرخام الطبيعي:' : 'Natural Marble Sub-Type:'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNaturalKind('cast')}
                        className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                          naturalKind === 'cast'
                            ? 'border-black bg-neutral-900 text-white'
                            : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 text-neutral-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm">
                            {language === 'AR' ? 'رخام مصبوب (Cast Marble)' : 'Cast Marble'}
                          </div>
                          <div
                            className={`text-[11px] mt-0.5 ${
                              naturalKind === 'cast' ? 'text-neutral-300' : 'text-neutral-500'
                            }`}
                          >
                            {language === 'AR' ? 'رخام مصبوب متجانس عالي الصلابة ومعالج ضد البقع' : 'Engineered cast stone with stain seal'}
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold shrink-0">
                          {language === 'AR' ? '+ 750 ر.س' : '+ SAR 750'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNaturalKind('slab')}
                        className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
                          naturalKind === 'slab'
                            ? 'border-black bg-neutral-900 text-white'
                            : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 text-neutral-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm">
                            {language === 'AR' ? 'رخام ألواح طبيعي (Slab Marble)' : 'Slab Marble Slabs'}
                          </div>
                          <div
                            className={`text-[11px] mt-0.5 ${
                              naturalKind === 'slab' ? 'text-neutral-300' : 'text-neutral-500'
                            }`}
                          >
                            {language === 'AR' ? 'ألواح صخرية جبلية إيطالية وإسبانية طبيعية 100%' : '100% natural quarried mountain slabs'}
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold shrink-0">
                          {language === 'AR' ? '+ 1,150 ر.س' : '+ SAR 1,150'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 5 Colors for Cast or Slab Marble */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-neutral-800 block">
                      {language === 'AR'
                        ? `ألوان ${naturalKind === 'cast' ? 'الرخام المصبوب (5 خيارات)' : 'الرخام الألواح الطبيعي (5 خيارات)'}:`
                        : `${naturalKind === 'cast' ? 'Cast Marble' : 'Slab Marble'} Colors (5 Options):`}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {(naturalKind === 'cast' ? CAST_MARBLE_COLORS : SLAB_MARBLE_COLORS).map(colorOpt => {
                        const activeColor = naturalKind === 'cast' ? selectedCastColor : selectedSlabColor;
                        const isSelected = activeColor.id === colorOpt.id;

                        return (
                          <div
                            key={colorOpt.id}
                            onClick={() => {
                              if (naturalKind === 'cast') setSelectedCastColor(colorOpt);
                              else setSelectedSlabColor(colorOpt);
                            }}
                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center space-y-2 group ${
                              isSelected
                                ? 'border-black ring-2 ring-black/10 bg-white shadow-xs'
                                : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                            }`}
                          >
                            <div className="w-full h-16 rounded-xl overflow-hidden relative shadow-inner">
                              <img
                                src={colorOpt.image}
                                alt={colorOpt.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="font-bold text-xs text-neutral-900 truncate w-full">
                              {language === 'AR' ? colorOpt.nameAr : colorOpt.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 3.4 Handle Options (Requirement #3.4) */}
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <label className="text-xs font-bold text-neutral-800 block">
                  {language === 'AR' ? '4. خيارات المقابض (مع صور توضيحية):' : '4. Handle Hardware Selection:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {HANDLE_OPTIONS.map(handle => {
                    const isSelected = selectedHandle.id === handle.id;
                    return (
                      <div
                        key={handle.id}
                        onClick={() => setSelectedHandle(handle)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-between group ${
                          isSelected
                            ? 'border-black bg-white ring-2 ring-black/10 shadow-xs'
                            : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="w-full h-20 rounded-xl overflow-hidden relative shadow-inner">
                            <img
                              src={handle.image}
                              alt={handle.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="font-bold text-xs text-neutral-900">
                            {language === 'AR' ? handle.nameAr : handle.name}
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-500 pt-1 line-clamp-2">
                          {handle.descriptionAr}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ======================================================== */}
            {/* STEP 4: CORNER DIVISION BASED ON SIZE                   */}
            {/* ======================================================== */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">
                      {language === 'AR' ? 'التقسيم الداخلي للركن' : '4. Internal Division Layout'}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      {language === 'AR'
                        ? 'اختر النمط المناسب لاحتياجات أجهزتك وأدواتك، وأضف ملاحظاتك الخاصة'
                        : 'Select the interior partition style and add custom division notes'}
                    </p>
                  </div>
                </div>

                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
                  {language === 'AR' ? '5 خيارات متاحة' : '5 Layout Options'}
                </span>
              </div>

              {/* 5 Division Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DIVISION_OPTIONS.map(divOpt => {
                  const isSelected = selectedDivision.id === divOpt.id;
                  return (
                    <div
                      key={divOpt.id}
                      onClick={() => setSelectedDivision(divOpt)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group space-y-3 relative ${
                        isSelected
                          ? 'border-black bg-white ring-2 ring-black/10 shadow-xs'
                          : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Division Image / Diagram */}
                        <div className="w-full h-28 rounded-xl overflow-hidden relative shadow-inner bg-neutral-100">
                          <img
                            src={divOpt.image}
                            alt={language === 'AR' ? divOpt.nameAr : divOpt.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&q=80';
                            }}
                          />
                          <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {divOpt.layoutBadge}
                          </span>
                          {isSelected && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                            </div>
                          )}
                        </div>

                        <h3 className="font-bold text-xs sm:text-sm text-neutral-900">
                          {language === 'AR' ? divOpt.nameAr : divOpt.name}
                        </h3>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">
                          {language === 'AR' ? divOpt.descriptionAr : divOpt.descriptionEn}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold text-neutral-800">
                          {isSelected ? (language === 'AR' ? 'محدد ✓' : 'Selected ✓') : (language === 'AR' ? 'اختيار' : 'Select')}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'bg-black border-black text-white' : 'border-neutral-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Special Division Notes Field (Requirement #4) */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-2">
                  <span>{language === 'AR' ? 'ملاحظات خاصة حول التقسيم الداخلي:' : 'Special Division Notes:'}</span>
                  <span className="text-[11px] text-neutral-400 font-normal">
                    {language === 'AR' ? '(اختياري)' : '(Optional)'}
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={divisionNotes}
                  onChange={e => setDivisionNotes(e.target.value)}
                  placeholder={
                    language === 'AR'
                      ? 'مثال: أرغب بإضافة فتحة لتمرير أسلاك الماكينة في الجدار الخلفي، وتخصيص الرف الأيمن لثلاجة عرض مقاس 45 سم...'
                      : 'e.g. Please add cable grommet at rear wall, expand right bay for 45cm beverage cooler, adjust shelf height...'
                  }
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-2xl p-3.5 text-xs text-neutral-900 focus:outline-hidden focus:border-black transition-colors"
                />
              </div>
            </section>

            {/* ======================================================== */}
            {/* STEP 5: ADD-ONS & ACCESSORIES                           */}
            {/* ======================================================== */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
                    5
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">
                      {language === 'AR' ? 'الإضافات والإكسسوارات' : '5. Add-ons & Accessories'}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      {language === 'AR'
                        ? 'حدد الملحقات المطلوبة والكميات ليتم دمجها وتجهيز توصيلاتها بالركن'
                        : 'Select required equipment and exact quantities for integrated setup'}
                    </p>
                  </div>
                </div>

                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200/60">
                  {language === 'AR' ? 'حسب الرغبة' : 'Optional Add-ons'}
                </span>
              </div>

              {/* Accessories List with Quantity Steppers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ACCESSORIES_LIST.map(acc => {
                  const qty = accessoryQuantities[acc.id] || 0;
                  return (
                    <div
                      key={acc.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        qty > 0
                          ? 'border-neutral-900 bg-white ring-1 ring-black/5 shadow-xs'
                          : 'border-neutral-200 bg-neutral-50/50'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <img
                          src={acc.image}
                          alt={acc.name}
                          className="w-16 h-16 object-contain rounded-xl bg-white border border-neutral-100 p-1 shrink-0"
                        />
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-bold text-xs text-neutral-900">
                            {language === 'AR' ? acc.nameAr : acc.name}
                          </h4>
                          <p className="text-[10.5px] text-neutral-500 line-clamp-2">
                            {acc.descriptionAr}
                          </p>
                          <div className="text-xs font-mono font-bold text-neutral-950 pt-1">
                            {language === 'AR' ? `${acc.unitPrice.toLocaleString()} ر.س` : `SAR ${acc.unitPrice.toLocaleString()}`}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-500 font-medium">
                          {language === 'AR' ? 'الكمية المطلوبة:' : 'Quantity:'}
                        </span>

                        {/* Counter Stepper */}
                        <div className="flex items-center rounded-xl bg-neutral-200/80 p-0.5 border border-neutral-300/80">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(acc.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-neutral-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(acc.id, 1)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* General Notes Field */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <label className="text-xs font-bold text-neutral-800 block">
                  {language === 'AR' ? 'ملاحظات إضافية عامة للمصنع والإدارة:' : 'General Additional Notes:'}
                </label>
                <input
                  type="text"
                  value={generalNotes}
                  onChange={e => setGeneralNotes(e.target.value)}
                  placeholder={
                    language === 'AR'
                      ? 'ملاحظات حول موقع التركيب، ألوان الجدران، أو رقم دور العمارة...'
                      : 'Notes on delivery location, wall color match, floor level...'
                  }
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-black"
                />
              </div>
            </section>
          </div>

          {/* RIGHT: REAL-TIME SUMMARY, 3D BLUEPRINT, & CHECKOUT (4 or 5 Cols) */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            {/* Visual Blueprint / Architectural 3D Card */}
            <div className="bg-neutral-950 text-white p-6 rounded-3xl border border-neutral-800 shadow-xl space-y-4 overflow-hidden relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-white/10 px-2.5 py-0.5 rounded-full">
                  {language === 'AR' ? 'معاينة المخطط الفني' : 'Bespoke Blueprint'}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {width} × {depth} × {height} cm
                </span>
              </div>

              {/* Blueprint SVG Schematic Visualizer */}
              <div className="w-full h-44 rounded-2xl bg-[#0D1117] border border-neutral-800/80 p-4 relative flex flex-col justify-between overflow-hidden">
                {/* Architectural Grid overlay */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }}
                />

                {/* Top Countertop Bar Representation */}
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                    <span>{language === 'AR' ? 'السطح العلوي' : 'Countertop'}: {surfaceType === 'alternative' ? 'Sintered Stone' : 'Marble'}</span>
                    <span>{surfaceType === 'alternative' ? altThickness : naturalKind}</span>
                  </div>
                  <div
                    className="w-full h-5 rounded-md shadow-xs transition-all duration-300 border border-white/20"
                    style={{
                      background:
                        surfaceType === 'alternative'
                          ? selectedAltColor.pattern
                          : 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 100%)'
                    }}
                  />
                </div>

                {/* Cabinet Base Box Representation with selected wood color */}
                <div className="relative z-10 flex-1 my-2 flex items-center justify-center">
                  <div
                    className="w-[85%] h-full rounded-xl border border-white/20 transition-all duration-300 flex flex-col justify-between p-2 shadow-lg"
                    style={{
                      backgroundColor:
                        woodType === 'mdf' ? selectedMdfColor.hex : selectedChipColor.hex,
                      color:
                        (woodType === 'mdf' && selectedMdfColor.hex === '#F8FAFC') ||
                        (woodType === 'chipboard' && selectedChipColor.hex === '#CFCBC4')
                          ? '#000'
                          : '#fff'
                    }}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono px-1">
                      <span className="font-bold opacity-80">{woodType.toUpperCase()}</span>
                      <span className="opacity-80">
                        {language === 'AR' ? selectedHandle.nameAr.slice(0, 15) : selectedHandle.name.slice(0, 15)}...
                      </span>
                    </div>

                    {/* Division Graphic Lines */}
                    <div className="grid grid-cols-3 gap-1 h-8 opacity-75 my-1">
                      <div className="border border-dashed border-current rounded-xs flex items-center justify-center text-[8px]">
                        D1
                      </div>
                      <div className="border border-dashed border-current rounded-xs flex items-center justify-center text-[8px]">
                        BAY
                      </div>
                      <div className="border border-dashed border-current rounded-xs flex items-center justify-center text-[8px]">
                        D2
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-center font-bold">
                      {width} cm · {depth} cm
                    </div>
                  </div>
                </div>

                {/* Footer spec tags */}
                <div className="relative z-10 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                  <span>{language === 'AR' ? 'تشطيب الحواف' : 'Edges'}: {woodType === 'mdf' ? mdfEdgeFinish : 'PVC'}</span>
                  <span>
                    {language === 'AR' ? 'الملحقات' : 'Add-ons'}: {currentSpecs.accessories.length}
                  </span>
                </div>
              </div>
            </div>

            {/* ORDER SUMMARY (Requirement #6) */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-base font-bold text-neutral-900">
                  {language === 'AR' ? '6. ملخص مواصفات الطلب' : '6. Order Specification Summary'}
                </h3>
                <span className="text-xs font-mono text-neutral-500">HB-BESPOKE</span>
              </div>

              {/* Spec Items List */}
              <div className="space-y-3 text-xs text-neutral-700">
                {/* Dimensions */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-neutral-500 shrink-0">{language === 'AR' ? 'المقاسات:' : 'Dimensions:'}</span>
                  <span className="font-mono font-bold text-neutral-900 text-end">
                    {width} سم عرض × {depth} سم عمق × {height} سم ارتفاع
                  </span>
                </div>

                {/* Wood & Edge */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-neutral-500 shrink-0">{language === 'AR' ? 'الهيكل والتشطيب:' : 'Wood & Edge:'}</span>
                  <span className="font-semibold text-neutral-900 text-end">
                    {language === 'AR' ? currentSpecs.woodTypeNameAr : currentSpecs.woodTypeName} · {language === 'AR' ? currentSpecs.edgeFinishingAr : currentSpecs.edgeFinishing}
                  </span>
                </div>

                {/* Structure Color */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-neutral-500 shrink-0">{language === 'AR' ? 'لون الهيكل:' : 'Structure Color:'}</span>
                  <span className="font-semibold text-neutral-900 text-end flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-neutral-300"
                      style={{ backgroundColor: currentSpecs.structureColor.hex }}
                    />
                    <span>{language === 'AR' ? currentSpecs.structureColor.nameAr : currentSpecs.structureColor.name}</span>
                  </span>
                </div>

                {/* Top Surface */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-neutral-500 shrink-0">{language === 'AR' ? 'السطح العلوي:' : 'Countertop:'}</span>
                  <span className="font-semibold text-neutral-900 text-end">
                    {language === 'AR' ? currentSpecs.surfaceTypeNameAr : currentSpecs.surfaceTypeName} ({currentSpecs.surfaceThicknessAr || currentSpecs.marbleKindNameAr})
                  </span>
                </div>

                {/* Surface Color */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-neutral-500 shrink-0">{language === 'AR' ? 'لون السطح:' : 'Surface Color:'}</span>
                  <span className="font-semibold text-neutral-900 text-end">
                    {language === 'AR' ? currentSpecs.surfaceColor.nameAr : currentSpecs.surfaceColor.name}
                  </span>
                </div>

                {/* Handle Type */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-neutral-500 shrink-0">{language === 'AR' ? 'المقابض:' : 'Handles:'}</span>
                  <span className="font-semibold text-neutral-900 text-end">
                    {language === 'AR' ? currentSpecs.handleType.nameAr : currentSpecs.handleType.name}
                  </span>
                </div>

                {/* Internal Division */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-neutral-500 shrink-0">{language === 'AR' ? 'التقسيم الداخلي:' : 'Interior Bay:'}</span>
                  <span className="font-semibold text-neutral-900 text-end">
                    {language === 'AR' ? currentSpecs.internalDivision.nameAr : currentSpecs.internalDivision.name}
                  </span>
                </div>

                {/* Selected Accessories Count */}
                {currentSpecs.accessories.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                    <span className="text-[11px] font-bold text-neutral-800 block">
                      {language === 'AR' ? 'الملحقات والإكسسوارات المحددة:' : 'Selected Accessories:'}
                    </span>
                    <ul className="space-y-0.5 text-[11px] text-neutral-600">
                      {currentSpecs.accessories.map(acc => (
                        <li key={acc.id} className="flex justify-between">
                          <span>• {language === 'AR' ? acc.nameAr : acc.name} (x{acc.quantity})</span>
                          <span className="font-mono">{(acc.unitPrice * acc.quantity).toLocaleString()} ر.س</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* PRICING BREAKDOWN (Requirement #7 & #8) */}
              <div className="pt-3 border-t border-neutral-200/80 space-y-2 text-xs">
                {orderMode === 'direct' ? (
                  <>
                    <div className="flex justify-between text-neutral-600">
                      <span>{language === 'AR' ? 'الهيكل والنجارة الأساسية' : 'Base Cabinetry'}</span>
                      <span className="font-mono">
                        {pricingBreakdown.baseDimensionCost.toLocaleString()}.00 ر.س
                      </span>
                    </div>

                    <div className="flex justify-between text-neutral-600">
                      <span>{language === 'AR' ? 'خامة الخشب وتشطيب الحواف' : 'Wood & Edge Finish'}</span>
                      <span className="font-mono">
                        {pricingBreakdown.woodCost.toLocaleString()}.00 ر.س
                      </span>
                    </div>

                    <div className="flex justify-between text-neutral-600">
                      <span>{language === 'AR' ? 'السطح العلوي والمقابض' : 'Stone Top & Handles'}</span>
                      <span className="font-mono">
                        {(pricingBreakdown.surfaceCost + pricingBreakdown.handleCost).toLocaleString()}.00 ر.س
                      </span>
                    </div>

                    {pricingBreakdown.accessoriesTotal > 0 && (
                      <div className="flex justify-between text-neutral-600">
                        <span>{language === 'AR' ? 'مجموع الملحقات المدمجة' : 'Add-ons Total'}</span>
                        <span className="font-mono">
                          {pricingBreakdown.accessoriesTotal.toLocaleString()}.00 ر.س
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                      <span>{language === 'AR' ? 'التوصيل والتركيب المنزلي' : 'KSA White-Glove Setup'}</span>
                      <span>{language === 'AR' ? 'مجاني بالكامل' : 'FREE'}</span>
                    </div>

                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>{language === 'AR' ? 'شامل ضريبة القيمة المضافة 15%' : '15% VAT Included'}</span>
                      <span className="font-mono">{pricingBreakdown.vat.toLocaleString()} ر.س</span>
                    </div>

                    {/* Final Big Total */}
                    <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                      <span className="font-bold text-sm text-neutral-900">
                        {language === 'AR' ? 'السعر الإجمالي:' : 'Total Price:'}
                      </span>
                      <span className="font-black text-xl text-neutral-950 font-sans">
                        {language === 'AR'
                          ? `${pricingBreakdown.total.toLocaleString()}.00 ر.س`
                          : `SAR ${pricingBreakdown.total.toLocaleString()}.00`}
                      </span>
                    </div>
                  </>
                ) : (
                  /* Quotation Mode Info Box */
                  <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1.5 text-xs text-amber-950">
                    <div className="font-bold flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-700" />
                      <span>{language === 'AR' ? 'مسار طلب عرض سعر معتمد:' : 'Formal RFQ Mode:'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-900">
                      {language === 'AR'
                        ? 'سيتم إرسال كافة المواصفات والقياسات لإدارة المتجر والمهندسين لمعاينتها وتحديد السعر النهائي والتواصل معك بدون دفع أي مبلغ مقدماً.'
                        : 'Your exact specs will be forwarded to HiBrew KSA engineering team for quote approval with zero upfront payment.'}
                    </p>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS (Section 7: Option 1 vs Option 2) */}
              <div className="space-y-2.5 pt-2">
                {orderMode === 'direct' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-98"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{language === 'AR' ? 'إضافة الركن إلى سلة المشتريات' : 'Add Custom Corner to Bag'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleInstantCheckout}
                      className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    >
                      <span>{language === 'AR' ? 'إتمام الشراء والدفع الفوري' : 'Proceed to Checkout'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRfqModalOpen(true)}
                    className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-98"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{language === 'AR' ? 'إرسال طلب عرض السعر الآن' : 'Submit Quotation Request'}</span>
                  </button>
                )}

                {/* Direct WhatsApp Consultation Button */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2 border border-emerald-200/60"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'AR' ? 'استشارة المهندس عبر واتساب (فوري)' : 'Chat with Engineer via WhatsApp'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RFQ MODAL (Option 2: Quotation Request Before Purchase)   */}
      {/* ======================================================== */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-neutral-100 text-start">
            {!rfqSubmitted ? (
              <form onSubmit={handleSubmitQuotation} className="space-y-4">
                <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900">
                      {language === 'AR' ? 'طلب عرض سعر واستشارة هندسية' : 'Request Official Quotation'}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {language === 'AR'
                        ? 'سيتم تدقيق القياسات والتواصل معك للتأكيد والتسعير'
                        : 'Our carpentry team will review your specifications and contact you'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRfqModalOpen(false)}
                    className="text-neutral-400 hover:text-black p-1 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      {language === 'AR' ? 'الاسم الكامل:' : 'Full Name:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={rfqName}
                      onChange={e => setRfqName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-xs text-neutral-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      {language === 'AR' ? 'رقم الجوال السعودي:' : 'Mobile Number (KSA):'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={rfqPhone}
                      onChange={e => setRfqPhone(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-xs font-mono text-neutral-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      {language === 'AR' ? 'المدينة:' : 'City:'}
                    </label>
                    <select
                      value={rfqCity}
                      onChange={e => setRfqCity(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-xs text-neutral-900 focus:outline-hidden cursor-pointer"
                    >
                      <option value="الرياض (Riyadh)">الرياض (Riyadh)</option>
                      <option value="جدة (Jeddah)">جدة (Jeddah)</option>
                      <option value="الدمام والخبر (Dammam & Khobar)">الدمام والخبر (Dammam & Khobar)</option>
                      <option value="مكة المكرمة (Mecca)">مكة المكرمة (Mecca)</option>
                      <option value="المدينة المنورة (Medina)">المدينة المنورة (Medina)</option>
                      <option value="القصيم (Qassim)">القصيم (Qassim)</option>
                      <option value="أبها وخميس مشيط (Abha)">أبها وخميس مشيط (Abha)</option>
                      <option value="مدينة أخرى بالمملكة (Other KSA City)">مدينة أخرى بالمملكة (Other KSA City)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-100 text-[11px] text-neutral-600 space-y-1">
                  <div className="font-semibold text-neutral-900">
                    {language === 'AR' ? 'ملخص المقاس والخامات:' : 'Quick Summary:'}
                  </div>
                  <div>• {width}W × {depth}D × {height}H cm</div>
                  <div>• {language === 'AR' ? currentSpecs.woodTypeNameAr : currentSpecs.woodTypeName} ({language === 'AR' ? currentSpecs.edgeFinishingAr : currentSpecs.edgeFinishing})</div>
                  <div>• {language === 'AR' ? currentSpecs.surfaceTypeNameAr : currentSpecs.surfaceTypeName}</div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'AR' ? 'إرسال الطلب لإدارة المتجر' : 'Submit to Store Admin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRfqModalOpen(false)}
                    className="px-4 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    {language === 'AR' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            ) : (
              /* Success confirmation state */
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-xl text-neutral-900">
                  {language === 'AR' ? 'تم استلام طلب عرض السعر بنجاح!' : 'Quotation Request Received!'}
                </h3>
                <div className="text-xs text-neutral-600 max-w-sm mx-auto space-y-1">
                  <p>
                    {language === 'AR'
                      ? 'تم تسجيل طلبك وإرسال كافة القياسات والمواصفات إلى فريق الهندسة والتصنيع لدى هايبرو.'
                      : 'Your inquiry has been assigned to our furniture engineering team for review.'}
                  </p>
                  <p className="font-mono font-bold text-black text-sm pt-2">
                    {generatedRfqId}
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{language === 'AR' ? 'فتح المحادثة عبر واتساب الآن' : 'Open WhatsApp Chat'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRfqModalOpen(false);
                      setRfqSubmitted(false);
                    }}
                    className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {language === 'AR' ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

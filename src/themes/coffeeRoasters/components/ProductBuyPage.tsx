import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { ProductColor, StorageOption, WarrantyOption, BundleOption } from '../types';
import { PRODUCTS, CATEGORIES } from '../data/products';
import {
  Star,
  ShieldCheck,
  Truck,
  ShoppingBag,
  Zap,
  Gift,
  Award,
  Coins,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Headphones,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  Layers,
  Flame,
  Gauge,
  Send,
  Coffee,
  RotateCcw,
  Mail,
  Clock
} from 'lucide-react';
import { TabbyIcon, TamaraIcon, MadaIcon, ApplePayIcon, VisaIcon, MastercardIcon } from './PaymentIcons';
import { ProductComparisonSection } from './ProductComparisonSection';
import baristaKitImg from '../assets/images/hibrew_barista_kit_isolated.jpg';
import scaleImg from '../assets/images/hibrew_scale_isolated.jpg';
import specInfographicImg from '../assets/images/hibrew_specs_comparison_infographic.png';

interface ProductBuyPageProps {
  isAdmin?: boolean;
}

export const ProductBuyPage: React.FC<ProductBuyPageProps> = ({ isAdmin = false }) => {
  const { selectedProduct, addToCart, triggerFlyToCart, navigateTo, goBack, language } = useCart();
  const product = selectedProduct;

  const categoryObj = CATEGORIES.find(c => c.id === product.category);
  const categoryLabel = language === 'AR' ? (categoryObj?.nameAr || 'مكائن القهوة') : (categoryObj?.name || 'Coffee Machines');

  type BuyTabType = 'configure' | 'bundles' | 'features' | 'specs' | 'reviews' | 'faq';
  const [activeBuyTab, setActiveBuyTab] = useState<BuyTabType>('configure');

  const defaultColor: ProductColor = product?.colors?.[0] || { name: 'Default', hex: '#1c1917', image: product?.image || '' };
  const defaultStorage: StorageOption = product?.storageOptions?.[0] || { capacity: 'Standard', ram: 'Default', priceDelta: 0 };

  const [selectedColor, setSelectedColor] = useState<ProductColor>(defaultColor);
  const [selectedStorage, setSelectedStorage] = useState<StorageOption>(defaultStorage);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyOption | undefined>(undefined);
  const [selectedBundles, setSelectedBundles] = useState<BundleOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Comparison banner image directly from product entity (API / Database-backed)
  const customSpecImg = useMemo(() => {
    if (language === 'AR' && product?.specComparisonImageAr) {
      return product.specComparisonImageAr;
    }
    return product?.specComparisonImage || specInfographicImg;
  }, [product?.specComparisonImage, product?.specComparisonImageAr, language]);

  // Sync state whenever selectedProduct changes
  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors?.[0] || defaultColor);
      setSelectedStorage(product.storageOptions?.[0] || defaultStorage);
      setSelectedBundles([]);
      setSelectedWarranty(undefined);
      setActiveImageIndex(0);
      setQuantity(1);
    }
  }, [product?.id, product?.colors, product?.images, (product as any)?.image]);

  // Glass Zoom Magnifier State (Screenshot 2)
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, percentX: 0, percentY: 0 });
  const imageStageRef = useRef<HTMLDivElement | null>(null);

  // Reviews System State (Screenshot 4)
  const [activeReviewTab, setActiveReviewTab] = useState<'all' | 'images'>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newAuthor, setNewAuthor] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);

  const [reviewsList, setReviewsList] = useState([
    {
      id: 'rev-1',
      author: 'س***د',
      city: 'الرياض',
      cityEn: 'Riyadh',
      verified: true,
      rating: 5,
      date: '2026-03-28',
      modelBought: 'HiBrew Barista Pro H7A / Silver Chrome',
      modelBoughtAr: 'هايبرو بارستا برو H7A / فضي كروم',
      contentAr: 'ما شاء الله تبارك الله، ماكينة جبارة استخلاص متوازن جداً وضغط الـ 20 بار مع دبل بويلر يعطيك تبخير حليب احترافي مثل أرقى مقاهي الرياض المختصة. شكراً هايبرو السعودية على التوصيل السريع خلال 24 ساعة.',
      contentEn: 'Spectacular coffee machine! Dual-boiler architecture gives instant microfoam steaming and balanced 20-bar extraction just like high-end specialty cafes. Express delivery in Riyadh took less than 24 hours.',
      hasImage: true,
      likes: 34,
      liked: false
    },
    {
      id: 'rev-2',
      author: 'ع***ي',
      city: 'جدة',
      cityEn: 'Jeddah',
      verified: true,
      rating: 5,
      date: '2026-03-22',
      modelBought: 'HiBrew Barista Pro H7A / Matte Black',
      modelBoughtAr: 'هايبرو بارستا برو H7A / أسود مطفي',
      contentAr: 'التحكم بالحرارة الرقمي PID دقيق للغاية، والبورتافلتر التجاري 58 ملم يغير تجربة القهوة 180 درجة. الهدايا المرفقة والتامبر الموزون وفرت علي شراء أدوات إضافية.',
      contentEn: 'The digital PID temperature control is razor-sharp. 58mm commercial portafilter changes the espresso game completely. The bundled precision tamper and mat saved me extra costs.',
      hasImage: true,
      likes: 28,
      liked: false
    },
    {
      id: 'rev-3',
      author: 'ف***د',
      city: 'الدمام',
      cityEn: 'Dammam',
      verified: true,
      rating: 5,
      date: '2026-03-15',
      modelBought: 'HiBrew Barista Pro H7A / Walnut Wood',
      modelBoughtAr: 'هايبرو بارستا برو H7A / خشب الجوز',
      contentAr: 'إصدار خشب الجوز تحفة فنية على بار القهوة. تسخين سريع جداً وخامة الفولاذ ثقيلة ومتينة. خدمة العملاء والضمان المعتمد سنتين يعطيك راحة بال تامة.',
      contentEn: 'The walnut wood finish is a centerpiece on my coffee station. Rapid thermo heat-up and heavy-duty stainless steel build. 2-year authorized agency warranty gives peace of mind.',
      hasImage: false,
      likes: 19,
      liked: false
    },
    {
      id: 'rev-4',
      author: 'م***ل',
      city: 'الخبر',
      cityEn: 'Khobar',
      verified: true,
      rating: 5,
      date: '2026-03-10',
      modelBought: 'HiBrew Barista Pro H7A / Platinum White',
      modelBoughtAr: 'هايبرو بارستا برو H7A / أبيض بلاتينيوم',
      contentAr: 'أفضل ماكينة منزلية بدون منازع في فئتها السعرية. خاصية الترطيب المسبق المنخفض الضغط تصنع طبقة كريمة ذهبية لا تصدق.',
      contentEn: 'Unrivaled home espresso machine in its class. Low-pressure pre-infusion produces unbelievable golden crema consistency every single morning.',
      hasImage: true,
      likes: 15,
      liked: false
    }
  ]);

  // Stable gallery images: all product colors first in fixed order, followed by product images
  const candidateImages = [
    ...(product.colors || []).map(c => c.image),
    ...(product.images || []).filter(img => !product.colors?.some(col => col.image === img)),
  ].filter(Boolean) as string[];

  // Fallback to product.image or flagship PNG if empty
  if (candidateImages.length === 0) {
    if ((product as any).image) {
      candidateImages.push((product as any).image);
    } else {
      candidateImages.push('/src/assets/images/hibrew_h7a_flagship_machine.png');
    }
  }

  const allImages = Array.from(new Set(candidateImages));
  const displayThumbnails = allImages.slice(0, 5);

  const currentDisplayImage = allImages[activeImageIndex] || selectedColor?.image || product.images[0];

  const thumbnailFallbackDeltas = [0, 50, 90, 130, 170];
  const colorOrImagePriceDelta =
    activeImageIndex < product.colors.length
      ? (selectedColor?.priceDelta ?? product.colors[activeImageIndex]?.priceDelta ?? thumbnailFallbackDeltas[activeImageIndex] ?? activeImageIndex * 45)
      : (thumbnailFallbackDeltas[activeImageIndex] ?? activeImageIndex * 45);

  const extraPrice = colorOrImagePriceDelta +
    (selectedStorage?.priceDelta || 0) +
    (selectedWarranty ? selectedWarranty.price : 0) +
    selectedBundles.reduce((s, b) => s + b.price, 0);

  const unitPrice = product.basePrice + extraPrice;
  const totalPrice = unitPrice * quantity;
  const originalUnitPrice = product.originalPrice ? product.originalPrice + extraPrice : Math.round(unitPrice * 1.15);
  const originalPrice = originalUnitPrice * quantity;
  const savingsSAR = originalPrice - totalPrice;
  const installmentSAR = Math.round(totalPrice / 4);

  // Countdown Timer state for Limited Time Offer Banner (Matches Theme Brown Colors)
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 7,
    minutes: 7,
    seconds: 13,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Product Highlight Bullets (4 key specs per product - Image 1)
  const productBullets = useMemo(() => {
    const isAr = language === 'AR';
    if (isAr && product.heroBanner?.featuresAr && product.heroBanner.featuresAr.length > 0) {
      return product.heroBanner.featuresAr.slice(0, 4);
    }
    if (!isAr && product.heroBanner?.featuresEn && product.heroBanner.featuresEn.length > 0) {
      return product.heroBanner.featuresEn.slice(0, 4);
    }
    if (product.specs && product.specs.length > 0) {
      return product.specs.slice(0, 4).map(s =>
        isAr
          ? `${s.labelAr || s.label}: ${s.valueAr || s.value}`
          : `${s.label}: ${s.value}`
      );
    }
    if (isAr && product.taglineAr) {
      return product.taglineAr.split('·').map(t => t.trim()).filter(Boolean).slice(0, 4);
    }
    if (product.tagline) {
      return product.tagline.split('·').map(t => t.trim()).filter(Boolean).slice(0, 4);
    }
    return isAr
      ? [
          'هندسة استخلاص إيطالية عالية الدقة بضغط متوازن',
          'نظام تحكم حراري رقمي ذكي لثبات الأداء',
          'تصميم متين من الفولاذ المقاوم للصدأ عالي الجودة',
          'ضمان سنتين معتمد من الوكيل الرسمي بالمملكة'
        ]
      : [
          'Commercial Italian high-precision extraction engineering',
          'Digital smart thermal PID stability control',
          'Heavy-duty food-grade stainless steel architecture',
          'Official 2-Year KSA Agency Warranty coverage'
        ];
  }, [product, language]);

  // Dynamic Discount calculation per product (Image 1)
  const displayDiscount = useMemo(() => {
    if (savingsSAR > 0) return savingsSAR;
    if (product.originalPrice && product.originalPrice > product.basePrice) {
      return (product.originalPrice - product.basePrice) * quantity;
    }
    return Math.round(unitPrice * 0.15) * quantity || 600;
  }, [savingsSAR, product.originalPrice, product.basePrice, unitPrice, quantity]);


  // Mouse move handler for glass zoom magnifier
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageStageRef.current) return;
    const rect = imageStageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const percentX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (y / rect.height) * 100));

    setZoomPos({ x, y, percentX, percentY });
  };

  const handleThumbnailClick = (idx: number) => {
    setActiveImageIndex(idx);
    const clickedImg = allImages[idx];
    if (!clickedImg) return;
    const matchingColor = product.colors.find(col => col.image === clickedImg) || (idx < product.colors.length ? product.colors[idx] : undefined);
    if (matchingColor) {
      setSelectedColor(matchingColor);
    }
  };

  const handlePrevImage = () => {
    const nextIdx = activeImageIndex === 0 ? allImages.length - 1 : activeImageIndex - 1;
    handleThumbnailClick(nextIdx);
  };

  const handleNextImage = () => {
    const nextIdx = activeImageIndex === allImages.length - 1 ? 0 : activeImageIndex + 1;
    handleThumbnailClick(nextIdx);
  };

  const handleColorChange = (c: ProductColor) => {
    setSelectedColor(c);
    const colorIdx = product.colors.findIndex(col => col.name === c.name);
    const foundIdx = allImages.findIndex(img => img === c.image);
    if (foundIdx !== -1) {
      setActiveImageIndex(foundIdx);
    } else if (colorIdx !== -1) {
      setActiveImageIndex(colorIdx);
    }
  };

  const toggleBundle = (bundle: BundleOption) => {
    if (selectedBundles.some(b => b.id === bundle.id)) {
      setSelectedBundles(selectedBundles.filter(b => b.id !== bundle.id));
    } else {
      setSelectedBundles([...selectedBundles, bundle]);
    }
  };

  const effectiveSelectedColor: ProductColor = {
    ...selectedColor,
    image: currentDisplayImage,
    priceDelta: colorOrImagePriceDelta,
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerFlyToCart(rect, currentDisplayImage || product.colors[0]?.image);
    }
    for (let i = 0; i < quantity; i++) {
      addToCart(product, effectiveSelectedColor, selectedStorage, selectedWarranty, selectedBundles, false);
    }
  };

  const handleInstantBuy = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, effectiveSelectedColor, selectedStorage, selectedWarranty, selectedBundles);
    }
    navigateTo('checkout');
  };

  const toggleLikeReview = (id: string) => {
    setReviewsList(prev =>
      prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            liked: !r.liked,
            likes: r.liked ? r.likes - 1 : r.likes + 1
          };
        }
        return r;
      })
    );
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newRev = {
      id: `rev-${Date.now()}`,
      author: newAuthor.trim() ? newAuthor.slice(0, 1) + '***' + newAuthor.slice(-1) : (language === 'AR' ? 'م***ك' : 'u***r'),
      city: newCity.trim() || (language === 'AR' ? 'المملكة' : 'KSA'),
      cityEn: newCity.trim() || 'Saudi Arabia',
      verified: true,
      rating: newRating,
      date: new Date().toISOString().split('T')[0],
      modelBought: `${product.name} / ${selectedColor?.name || 'Default'}`,
      modelBoughtAr: `${product.nameAr || product.name} / ${selectedColor?.nameAr || selectedColor?.name || 'الافتراضي'}`,
      contentAr: newComment,
      contentEn: newComment,
      hasImage: false,
      likes: 1,
      liked: true
    };

    setReviewsList([newRev, ...reviewsList]);
    setIsWritingReview(false);
    setNewComment('');
    setNewAuthor('');
    setNewCity('');
    setShowReviewSuccess(true);
    setTimeout(() => setShowReviewSuccess(false), 5000);
  };

  const scrollToSection = (id: string, tab?: BuyTabType) => {
    if (tab) setActiveBuyTab(tab);
    if (id === 'buy-stage-section') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -145;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections: { id: string; tab: BuyTabType }[] = [
        { id: 'faq-section', tab: 'faq' },
        { id: 'customer-reviews-section', tab: 'reviews' },
        { id: 'specs-comparison-section', tab: 'specs' },
        { id: 'overview-features', tab: 'features' },
        { id: 'bundle-offers-section', tab: 'bundles' },
        { id: 'buy-stage-section', tab: 'configure' },
      ];

      const scrollPosition = window.scrollY + 160;
      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveBuyTab(sec.tab);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // FAQ items
  const FAQS = [
    {
      qAr: 'هل الماكينة متوافقة مع الجهد الكهربائي ومقابس المملكة العربية السعودية (220V)؟',
      qEn: 'Is the machine compatible with Saudi Arabia 220V 50/60Hz electrical standards and UK 3-pin plug?',
      aAr: 'نعم بالتأكيد، جميع أجهزتنا مستوردة بمواصفات مطابقة 100% لهيئة المواصفات والمقاييس والجودة السعودية (SASO)، تعمل بتردد 50/60 هرتز وجهد 220-240 فولت مع قابس ثلاثي معتمد.',
      aEn: 'Yes absolutely. All our machines fully comply with Saudi Standards, Metrology and Quality Organization (SASO), operating at 220-240V 50/60Hz with official BS 1363 3-pin plugs.'
    },
    {
      qAr: 'ماذا يشمل الضمان الرسمي المعتمد لمدة سنتين؟',
      qEn: 'What is covered under the 2-Year Official Agency Warranty in Saudi Arabia?',
      aAr: 'يشمل الضمان استبدال وصيانة قطع الغيار الأصلية مجاناً ضد العيوب المصنعية، ومضخة الضغط الإيطالية، ونظام التحكم الحراري PID، مع خدمة الاستلام والتوصيل المجاني للمنزل في حال الحاجة للصيانة.',
      aEn: 'The warranty covers free genuine parts replacement, the Italian ULKA 20-bar pump, and PID thermal modules against manufacturing defects, including free pickup and doorstep return across KSA.'
    },
    {
      qAr: 'كم يستغرق التوصيل الفوري داخل مدن المملكة؟',
      qEn: 'How fast is express delivery across Saudi Arabia (Riyadh, Jeddah, Dammam, etc.)?',
      aAr: 'التوصيل يتم خلال 24 إلى 48 ساعة كحد أقصى في الرياض، جدة، الدمام، مكة، والمدينة المنورة. وباقي مدن ومحافظات المملكة خلال 2 إلى 3 أيام عمل مع رقم تتبع فوري عبر الرسائل النصية.',
      aEn: 'Express delivery arrives within 24 to 48 hours in Riyadh, Jeddah, Dammam, Makkah, and Madinah. Other KSA regions within 2-3 business days with live SMS tracking.'
    },
    {
      qAr: 'ما هي الهدايا والإكسسوارات المرفقة مع الماكينة عند الشراء؟',
      qEn: 'What free barista gifts and accessories are included in the box?',
      aAr: 'تحتوي العلبة مجاناً على: بورتافلتر احترافي 58 ملم من الفولاذ، تامبر ضغط موزون 30 باوند، موزع قهوة، ربلة تسوية سيليكون، إبريق تبخير الحليب ستانلس ستيل، ومكيال تنظيف.',
      aEn: 'Included free: 58mm commercial stainless steel portafilter, 30lb calibrated spring tamper, distribution tool, silicone tamping mat, stainless milk frothing pitcher, and cleaning accessories.'
    },
    {
      qAr: 'هل يمكن الدفع بنظام التقسيط المريح بدون فوائد؟',
      qEn: 'Can I pay in interest-free installments via Tabby or Tamara?',
      aAr: 'نعم، نوفر خيار الدفع على 4 دفعات ميسرة بدون أي فوائد أو رسوم إضافية عبر تابي (Tabby) أو تمارا (Tamara)، متوافقة مع الشريعة الإسلامية.',
      aEn: 'Yes, you can split your total into 4 interest-free installments through Tabby or Tamara with zero extra fees and instant approval at checkout.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 text-start pb-28 lg:pb-24 selection:bg-neutral-900 selection:text-white w-full max-w-full">
      {/* ========================================================================= */}
      {/* 1. HONOR-STYLE STICKY SUB-BAR (Back Button, Breadcrumbs, Multi-Sections)  */}
      {/* ========================================================================= */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] w-full shadow-xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row: Back button, Breadcrumbs trail, Learn More CTA & Instant Buy */}
          <div className="h-11 sm:h-12 flex items-center justify-between gap-3 border-b border-neutral-100 py-1 sm:py-1.5">
            {/* Left: Prominent Back Button & Breadcrumbs */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all border border-neutral-300/80 cursor-pointer shrink-0 shadow-xs active:scale-95"
                title={language === 'AR' ? 'الرجوع للصفحة السابقة' : 'Go back'}
              >
                {language === 'AR' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                <span>{language === 'AR' ? 'رجوع' : 'Back'}</span>
              </button>

              <span className="text-neutral-300 shrink-0 hidden xs:inline">|</span>

              {/* Breadcrumbs */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500 whitespace-nowrap min-w-0">
                <button
                  onClick={() => navigateTo('home')}
                  className="hover:text-black transition-colors cursor-pointer shrink-0 font-medium"
                >
                  {language === 'AR' ? 'الرئيسية' : 'Home'}
                </button>
                <span className="text-neutral-300 shrink-0">/</span>
                <button
                  onClick={() => navigateTo('products')}
                  className="hover:text-black transition-colors cursor-pointer shrink-0 font-medium"
                >
                  {language === 'AR' ? 'المنتجات' : 'Products'}
                </button>
                <span className="text-neutral-300 shrink-0 hidden sm:inline">/</span>
                <button
                  onClick={() => navigateTo('products')}
                  className="hover:text-black transition-colors cursor-pointer shrink-0 font-medium text-neutral-500 hidden sm:inline"
                >
                  {categoryLabel}
                </button>
                <span className="text-neutral-300 shrink-0">/</span>
                <button
                  onClick={() => navigateTo('product-detail', product.id)}
                  className="hover:text-black transition-colors cursor-pointer shrink-0 font-medium text-neutral-600 truncate max-w-[120px] sm:max-w-[200px]"
                  title={language === 'AR' ? 'انقر لعرض تفاصيل ومميزات الماكينة' : 'Click to view product detail page'}
                >
                  {language === 'AR' && product.nameAr ? product.nameAr : product.name}
                </button>
                <span className="text-neutral-300 shrink-0">/</span>
                <span className="font-extrabold text-black shrink-0">
                  {language === 'AR' ? 'شراء الآن' : 'Buy Now'}
                </span>
              </nav>
            </div>

            {/* Right: Learn More Link & Instant Buy CTA */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => navigateTo('product-detail', product.id)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border border-neutral-300 text-neutral-700 hover:text-black hover:border-black text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'AR' ? 'تفاصيل الماكينة' : 'Learn More'}</span>
              </button>

              <button
                onClick={handleInstantBuy}
                className="px-4 sm:px-5 py-1 sm:py-1.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-full transition-transform active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{language === 'AR' ? 'شراء الآن' : 'Buy Now'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Multi-Sections Navigation Bar (Mobile swipeable & desktop clean pills) */}
          <div className="py-1 sm:py-1.5 overflow-x-auto no-scrollbar flex items-center gap-1 sm:gap-1.5">
            {[
              { id: 'buy-stage-section', tab: 'configure', labelAr: 'خيارات الشراء واللون', labelEn: 'Options & Color' },
              { id: 'bundle-offers-section', tab: 'bundles', labelAr: 'الهدايا والملحقات', labelEn: 'Gifts & Bundles' },
              { id: 'overview-features', tab: 'features', labelAr: 'نظرة عامة والمميزات', labelEn: 'Features' },
              { id: 'specs-comparison-section', tab: 'specs', labelAr: 'المواصفات والمقارنة', labelEn: 'Tech Specs' },
              { id: 'customer-reviews-section', tab: 'reviews', labelAr: 'التقييمات والتجارب', labelEn: 'Reviews' },
              { id: 'faq-section', tab: 'faq', labelAr: 'الأسئلة الشائعة', labelEn: 'FAQ' },
            ].map(item => (
              <button
                key={item.tab}
                onClick={() => scrollToSection(item.id, item.tab as BuyTabType)}
                className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeBuyTab === item.tab
                    ? 'bg-black text-white font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`}
              >
                {language === 'AR' ? item.labelAr : item.labelEn}
              </button>
            ))}

            {/* Mobile Learn More pill shortcut */}
            <button
              onClick={() => navigateTo('product-detail', product.id)}
              className="sm:hidden ltr:ml-auto rtl:mr-auto flex items-center gap-1 text-[11px] font-bold text-neutral-800 hover:text-black bg-neutral-100 px-2 py-0.5 rounded-full shrink-0"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{language === 'AR' ? 'تفاصيل الماكينة' : 'Details'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* ========================================================================= */}
        {/* 2. SAVINGS CALLOUT BAR (Screenshot 2 Top Right Highlight)                 */}
        {/* ========================================================================= */}
        <div className="flex items-baseline justify-end gap-3 pb-6 border-b border-[#E5E5E5] flex-wrap">
          {savingsSAR > 0 && (
            <span className="text-red-600 font-bold text-sm sm:text-base">
              {language === 'AR' ? `وفر ${savingsSAR.toLocaleString()}.00 ر.س` : `Save SAR ${savingsSAR.toLocaleString()}.00`}
            </span>
          )}
          {originalPrice && (
            <span className="text-neutral-400 line-through text-sm sm:text-base font-sans">
              {language === 'AR' ? `${originalPrice.toLocaleString()}.00 ر.س` : `SAR ${originalPrice.toLocaleString()}.00`}
            </span>
          )}
          <span className="text-xl sm:text-3xl font-black text-neutral-900 font-sans tracking-tight">
            {language === 'AR' ? `${totalPrice.toLocaleString()}.00 ر.س` : `SAR ${totalPrice.toLocaleString()}.00`}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN 2-COLUMN STAGE (Honor Buy Layout with Glass Zoom Effect)          */}
        {/* ========================================================================= */}
        <div id="buy-stage-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-8 items-start relative scroll-mt-28">
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: Gallery, Badges, Glass Zoom Lens, Installment Banner       */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24 lg:self-start z-10 flex flex-col items-center">
            {/* Main Image Stage - Pure White Clean Background Matching Image 1 */}
            <div
              ref={imageStageRef}
              onMouseEnter={() => setIsHoveringImage(true)}
              onMouseLeave={() => setIsHoveringImage(false)}
              onMouseMove={handleMouseMove}
              className="relative w-full h-[300px] sm:h-[350px] flex items-center justify-center select-none bg-white py-2 px-4 group cursor-zoom-in overflow-hidden rounded-2xl"
            >
              {/* Top-left Spec badge pill (Matches Image 1: Standard 58mm Kit) */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-4 z-20 pointer-events-none">
                <span className="px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full border border-[#D2D2D7] bg-white text-neutral-800 font-normal text-[12px] sm:text-[13px] tracking-wide inline-block shadow-none">
                  {selectedStorage
                    ? (language === 'AR' && selectedStorage.capacityAr ? selectedStorage.capacityAr : selectedStorage.capacity)
                    : (language === 'AR' ? (product.badgeAr || product.badge || 'طقم بورتفلتر 58 مم') : (product.badge || 'Standard 58mm Kit'))}
                </span>
              </div>

              {/* Side Floating Gift Preview Card (Desktop & Tablet view) */}
              <div
                onMouseEnter={() => setIsHoveringImage(false)}
                onMouseMove={(e) => {
                  e.stopPropagation();
                  setIsHoveringImage(false);
                }}
                className="hidden sm:flex absolute top-1/2 -translate-y-1/2 right-2 sm:right-6 z-20 w-[94px] sm:w-[106px] h-[184px] sm:h-[198px] rounded-[22px] bg-[#ECECEE] p-2.5 pt-5 pb-3 flex-col items-center justify-between pointer-events-auto transition-transform hover:scale-105 shadow-2xs cursor-default"
              >
                {/* Floating Top Circular Gift Icon (Coffee brown circle with white gift box) */}
                <div className="absolute -top-3.5 sm:-top-4 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#8B5A2B] text-white flex items-center justify-center shadow-xs">
                  <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                </div>

                {/* Gift Item 1 */}
                <div className="flex flex-col items-center text-center">
                  <img
                    src={baristaKitImg}
                    alt="Gift 1"
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] text-neutral-500 font-medium tracking-tight mt-0.5 font-sans">
                    {language === 'AR' ? '99 ر.س' : 'SAR 99'}
                  </span>
                </div>

                {/* Plus Separator */}
                <span className="text-neutral-400 text-xs font-light leading-none -my-0.5 select-none">
                  +
                </span>

                {/* Gift Item 2 */}
                <div className="flex flex-col items-center text-center">
                  <img
                    src={scaleImg}
                    alt="Gift 2"
                    className="w-9 h-9 sm:w-11 sm:h-11 object-contain mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] text-neutral-500 font-medium tracking-tight mt-0.5 font-sans">
                    {language === 'AR' ? '199 ر.س' : 'SAR 199'}
                  </span>
                </div>
              </div>

              {/* Main Product Image (Direct, Unobstructed, Pure White Canvas) */}
              <img
                src={currentDisplayImage}
                alt={product.name}
                className="max-h-[300px] sm:max-h-[380px] w-auto max-w-[95%] sm:max-w-[80%] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />

              {/* Interactive Glass Zoom Magnifier Lens */}
              {isHoveringImage && (
                <div
                  className="pointer-events-none absolute z-30 w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-white/95 ring-1 ring-[#8B5A2B]/35 shadow-[0_16px_40px_rgba(0,0,0,0.22),inset_0_2px_8px_rgba(255,255,255,0.9),inset_0_-4px_10px_rgba(0,0,0,0.08)] overflow-hidden"
                  style={{
                    left: `${zoomPos.x}px`,
                    top: `${zoomPos.y}px`,
                    transform: 'translate(-50%, -50%)',
                    backgroundImage: `url(${currentDisplayImage})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '260%',
                    backgroundPosition: `${zoomPos.percentX}% ${zoomPos.percentY}%`,
                    backgroundColor: '#ffffff',
                  }}
                >
                  {/* Realistic Optical Glass Glare & Reflection Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/40 pointer-events-none" />
                  <div className="absolute inset-1 rounded-full border border-white/50 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Mobile Only Clean Horizontal Gift Strip (Zero Overlap on Mobile screen) */}
            <div className="sm:hidden w-full flex items-center justify-between bg-neutral-50 border border-neutral-200/80 rounded-xl px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#8B5A2B] text-white flex items-center justify-center shrink-0">
                  <Gift className="w-3 h-3" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[11px] text-neutral-900 leading-tight">
                    {language === 'AR' ? 'بكج هدايا الباريستا المجاني' : 'Free Barista Bonus Kit'}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {language === 'AR' ? 'تامبر 30 باوند + إبريق تبخير ستانلس' : '30lb Tamper + Frothing Pitcher'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                {language === 'AR' ? 'بقيمة 457 ر.س مجاناً' : 'SAR 457 Free'}
              </span>
            </div>

            {/* Coffee Brown Promotional Installment Wave Banner (Exact 1:1 Match with Image 1) */}
            <div className="w-full h-[52px] sm:h-[60px] rounded-2xl sm:rounded-[20px] overflow-hidden relative flex items-center justify-between select-none shadow-2xs" dir="ltr">
              {/* Dual-Tone SVG Wave Background */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
                viewBox="0 0 500 60"
              >
                {/* Right side background #A46836 */}
                <rect width="500" height="60" fill="#A46836" />

                {/* Left side wave path #8B5A2B */}
                <path
                  d="M 0,0 L 225,0 C 248,0 256,18 268,36 C 278,50 290,60 310,60 L 0,60 Z"
                  fill="#8B5A2B"
                />

                {/* Bottom right decorative light origami facets */}
                <polygon points="500,24 500,60 455,60" fill="#BA7D49" opacity="0.6" />
                <polygon points="455,60 482,36 430,60" fill="#CD9562" opacity="0.35" />
              </svg>

              {/* Left Side: Installment Content + Star (Matches Image 1) */}
              <div className="relative pl-3 xs:pl-4 sm:pl-6 text-white text-left flex flex-col justify-center z-10 shrink-0">
                <span className="text-[9.5px] xs:text-[11px] sm:text-xs font-semibold leading-tight text-white drop-shadow-2xs">
                  {language === 'AR'
                    ? `أو يبدأ من ${(totalPrice / 12).toFixed(2)} ر.س شهرياً`
                    : `or starts from SAR ${(totalPrice / 12).toFixed(2)}/mo`}
                </span>
                <span className="text-[8.5px] xs:text-[10px] sm:text-[11px] text-white/95 font-medium leading-tight mt-0.5">
                  {language === 'AR' ? '(بدون فوائد)' : '(interest free)'}
                </span>

                {/* Decorative Sparkle Star on Left */}
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-white/80 fill-white absolute -left-1 sm:left-1 bottom-0.5 pointer-events-none"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z" />
                </svg>
              </div>

              {/* Right Side: Price Content + Dual Sparkles (Matches Image 1) */}
              <div className="relative pr-3 xs:pr-4 sm:pr-6 flex items-center gap-1 sm:gap-1.5 z-10 shrink-0">
                <span className="text-base xs:text-lg sm:text-2xl font-black text-white font-sans tracking-wide">
                  {language === 'AR' ? `${totalPrice.toLocaleString()} ر.س` : `SAR ${totalPrice.toLocaleString()}`}
                </span>
                <div className="relative ml-0.5 sm:ml-1 shrink-0">
                  <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white fill-white drop-shadow-2xs" viewBox="0 0 24 24">
                    <path d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z" />
                  </svg>
                  <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white/90 fill-white absolute -top-1 -right-1.5" viewBox="0 0 24 24">
                    <path d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Thumbnail Carousel Slider (Matches Image 1 5-Box Array with Clean Outline Chevrons) */}
            <div className="w-full flex items-center justify-center gap-2 sm:gap-3 pt-2" dir="ltr">
              <button
                onClick={handlePrevImage}
                aria-label="Previous image"
                className="text-neutral-400 hover:text-black transition-colors cursor-pointer p-1 shrink-0"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
              </button>

              <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
                {displayThumbnails.map((img, idx) => {
                  const isActive = activeImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleThumbnailClick(idx)}
                      className={`w-11 h-11 xs:w-13 xs:h-13 sm:w-15 sm:h-15 rounded-lg sm:rounded-xl bg-white p-1 transition-all cursor-pointer shrink-0 overflow-hidden ${
                        isActive
                          ? 'border-2 border-black scale-102'
                          : 'border border-[#D2D2D7] hover:border-neutral-400 opacity-90 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNextImage}
                aria-label="Next image"
                className="text-neutral-400 hover:text-black transition-colors cursor-pointer p-1 shrink-0"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
              </button>
            </div>

            {/* 3 Trust Assurance Outline Icons + Bottom Indicator Bar (Matches Image 4) */}
            <div className="w-full pt-4 sm:pt-5">
              <div className="flex items-center justify-around max-w-xs mx-auto px-4">
                <div className="flex items-center justify-center text-neutral-800 hover:text-black transition-colors cursor-default">
                  <Truck className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="flex items-center justify-center text-neutral-800 hover:text-black transition-colors cursor-default">
                  <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="flex items-center justify-center text-neutral-800 hover:text-black transition-colors cursor-default">
                  <Headphones className="w-6 h-6 stroke-[1.5]" />
                </div>
              </div>

              {/* Horizontal divider with center indicator pill */}
              <div className="w-full border-t border-[#E5E5E7] mt-4 relative">
                <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-14 sm:w-18 h-[3px] bg-neutral-900 rounded-full" />
              </div>
            </div>
          </div>


          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: Product Title, Rating, Offers, Color, Specs, Buy Actions */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-6 space-y-5">
            {/* PRODUCT TITLE & STAR REVIEWS & SHARE ICON (Exact 1:1 Match with Reference Image 2) */}
            <div className="space-y-1.5 pb-1">
              <h1 className={`text-xl sm:text-2xl font-black text-neutral-900 ${
                language === 'AR' ? 'leading-[1.4] tracking-normal' : 'leading-snug tracking-[-0.01em]'
              }`}>
                {language === 'AR' && product.nameAr ? product.nameAr : product.name}{' '}
                {selectedStorage ? `${(language === 'AR' && selectedStorage.capacityAr ? selectedStorage.capacityAr : selectedStorage.capacity)} ` : ''}
                {language === 'AR' && selectedColor?.nameAr ? selectedColor.nameAr : selectedColor?.name}
              </h1>

              {/* Star Rating, Total Reviews Link & Brown Paper Airplane Share Icon (Image 2) */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {/* 5 Solid Black Stars */}
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-black text-black" />
                    ))}
                  </div>

                  {/* Rating Number */}
                  <span className="font-bold text-xs text-neutral-900">
                    {(product.rating || 5.0).toFixed(1)}
                  </span>

                  {/* Brown Clickable Reviews Link with Chevron */}
                  <button
                    type="button"
                    onClick={() => scrollToSection('customer-reviews-section')}
                    className="inline-flex items-center gap-0.5 text-xs text-[#8B5A2B] hover:text-[#6F4E37] hover:underline cursor-pointer font-normal transition-colors ml-1"
                  >
                    <span>
                      {language === 'AR'
                        ? `${product.reviewCount || 362} تقييم إجمالي`
                        : `${product.reviewCount || 362} reviews in total`}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2] rtl:rotate-180" />
                  </button>
                </div>

                {/* Brown Paper Airplane Share Icon (Matches Image 2) */}
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: product.name, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#8B5A2B] hover:bg-[#8B5A2B]/10 transition-colors cursor-pointer"
                  title="Share"
                >
                  <Send className="w-4 h-4 fill-[#8B5A2B] -rotate-45 ml-0.5 mb-0.5" />
                </button>
              </div>
            </div>

            {/* 1. KEY PRODUCT HIGHLIGHT BULLETS (Exact 1:1 Match with Image 1) */}
            <div className="space-y-2 pt-2.5 pb-2">
              {productBullets.map((bullet, bIdx) => (
                <div key={bIdx} className="flex items-center gap-2.5 text-xs sm:text-[13px] font-semibold text-neutral-800 leading-snug">
                  <span className="w-1.5 h-1.5 rounded-none bg-neutral-900 shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>

            {/* 2. BROWN LIMITED TIME OFFER COUNTDOWN BANNER (Matches Theme Brown Colors) */}
            <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#8B5A2B] via-[#986131] to-[#A46836] p-4 sm:p-4.5 text-white shadow-sm overflow-hidden select-none my-3">
              {/* Top Row: Title + Discount Text + Sparkling Star */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-2xs">
                    {language === 'AR' ? 'عرض لفترة محدودة' : 'Limited Time Offer'}
                  </h3>
                  <div className="text-xs sm:text-sm font-bold text-white/95 font-sans">
                    {language === 'AR'
                      ? `خصم SAR ${displayDiscount.toLocaleString()}`
                      : `SAR ${displayDiscount.toLocaleString()} OFF`}
                  </div>
                </div>

                {/* Decorative 4-point Sparkle Icon (Matches Image 1) */}
                <div className="relative shrink-0 p-1">
                  <svg className="w-7 h-7 text-white fill-white drop-shadow-sm" viewBox="0 0 24 24">
                    <path d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white/90" />
                </div>
              </div>

              {/* Bottom Row: Clock/Timer Icon + Countdown Boxes (Matches Image 1) */}
              <div className="mt-3.5 flex items-center justify-between gap-2 pt-2.5 border-t border-white/25 flex-wrap sm:flex-nowrap">
                {/* Timer Icon */}
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                </div>

                {/* Countdown Tiles & Label */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[11px] sm:text-xs font-bold text-white shrink-0">
                    {language === 'AR' ? 'ينتهي في' : 'Ends in'}
                  </span>

                  {/* Days */}
                  <div className="flex items-center gap-1">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-[#8B5A2B] font-black text-xs sm:text-sm font-sans flex items-center justify-center shadow-xs">
                      {timeLeft.days}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-white">
                      {language === 'AR' ? 'يوماً' : 'd'}
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="flex items-center gap-1">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-[#8B5A2B] font-black text-xs sm:text-sm font-sans flex items-center justify-center shadow-xs">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-white">
                      {language === 'AR' ? 'س' : 'h'}
                    </span>
                  </div>

                  {/* Minutes */}
                  <div className="flex items-center gap-1">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-[#8B5A2B] font-black text-xs sm:text-sm font-sans flex items-center justify-center shadow-xs">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-white">
                      {language === 'AR' ? 'د' : 'm'}
                    </span>
                  </div>

                  {/* Seconds */}
                  <div className="flex items-center gap-1">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-[#8B5A2B] font-black text-xs sm:text-sm font-sans flex items-center justify-center shadow-xs">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-white">
                      {language === 'AR' ? 'ث' : 's'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* OFFERS SECTION (Exact 1:1 Match with Reference Image 1 & 2) */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-neutral-900 shrink-0" />
                <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                  {language === 'AR' ? 'العروض' : 'Offers'}
                </h2>
              </div>

              <div className="space-y-2 text-xs text-neutral-800">
                {/* Offer 1: Subscribe to Get Coupon! (Image 2) */}
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-neutral-900 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span>{language === 'AR' ? 'اشترك للحصول على كوبون!' : 'Subscribe to Get Coupon!'}</span>
                    <button
                      onClick={() => navigateTo('profile')}
                      className="text-[#8B5A2B] hover:text-[#6F4E37] hover:underline font-semibold cursor-pointer inline-flex items-center"
                    >
                      <span>{language === 'AR' ? 'اشتراك' : 'Subscribe'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Offer 2: Get free gifts worth up to SAR 298 / 457 (Image 2) */}
                <div className="flex items-center gap-2.5">
                  <Gift className="w-4 h-4 text-neutral-900 shrink-0" />
                  <span>
                    {language === 'AR'
                      ? `احصل على هدايا مجانية بقيمة تصل إلى ${savingsSAR || 298} ر.س`
                      : `Get free gifts worth up to SAR ${savingsSAR || 298}`}
                  </span>
                </div>

                {/* Offer 3: Earn 3x Points (Image 2) */}
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-neutral-900 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span>
                      {language === 'AR'
                        ? 'اكسب 3 أضعاف نقاط هايبرو على عملية الشراء هذه.'
                        : 'Earn 3x HiBrew Points on your purchase.'}
                    </span>
                    <button
                      onClick={() => navigateTo('reviews')}
                      className="text-[#8B5A2B] hover:text-[#6F4E37] hover:underline font-semibold cursor-pointer inline-flex items-center"
                    >
                      <span>{language === 'AR' ? 'اعرف المزيد' : 'Learn More'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Offer 4: New users get 2000 Points (Image 2) */}
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-neutral-900 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span>
                      {language === 'AR'
                        ? 'يحصل المستخدمون الجدد على 2000 نقطة هايبرو عند أول تسجيل.'
                        : 'New users get 2000 HiBrew Points upon first registration.'}
                    </span>
                    <button
                      onClick={() => navigateTo('profile')}
                      className="text-[#8B5A2B] hover:text-[#6F4E37] hover:underline font-semibold cursor-pointer inline-flex items-center"
                    >
                      <span>{language === 'AR' ? 'تسجيل' : 'Register'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>


            {/* 2. COLOR SELECTION (Screenshot 2 Circular Swatches with Ring) */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                {language === 'AR' ? 'اللون' : 'Color'}
              </h2>

              {/* Swatch circular dots */}
              <div className="flex items-center gap-4">
                {product.colors.map((c, idx) => {
                  const isSelected = selectedColor?.name === c.name;
                  return (
                    <button
                      key={c.name || idx}
                      onClick={() => handleColorChange(c)}
                      aria-label={c.name}
                      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-black ring-offset-2 scale-105'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span
                        className="w-full h-full rounded-full border border-neutral-300/80 shadow-xs block"
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Selected Color Name and Price */}
              <div className="pt-1">
                <div className="text-sm font-bold text-neutral-900">
                  {language === 'AR' && selectedColor?.nameAr ? selectedColor.nameAr : selectedColor?.name}
                </div>
                <div className="text-xs text-neutral-500 font-sans mt-0.5">
                  {language === 'AR' ? `${unitPrice.toLocaleString()}.00 ر.س` : `SAR ${unitPrice.toLocaleString()}.00`}
                </div>
              </div>
            </div>

            {/* 3. SPECIFICATION EDITIONS (Screenshot 2 Rounded Cards) */}
            {product.storageOptions && product.storageOptions.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                  {language === 'AR' ? 'الإصدار / المواصفات' : 'Specification / Edition'}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.storageOptions.map((opt, idx) => {
                    const isSelected = selectedStorage?.capacity === opt.capacity;
                    const optPrice = product.basePrice + colorOrImagePriceDelta + (opt.priceDelta || 0);
                    return (
                      <button
                        key={opt.capacity || idx}
                        onClick={() => setSelectedStorage(opt)}
                        className={`p-4 rounded-2xl text-start transition-all cursor-pointer border ${
                          isSelected
                            ? 'border-2 border-black bg-white shadow-xs'
                            : 'border-neutral-200 bg-white hover:border-neutral-400'
                        }`}
                      >
                        <div className="font-extrabold text-sm text-neutral-900">
                          {language === 'AR' && opt.capacityAr ? opt.capacityAr : opt.capacity}
                        </div>
                        {(opt.ramAr || opt.ram) && (
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {language === 'AR' && opt.ramAr ? opt.ramAr : opt.ram}
                          </div>
                        )}
                        <div className="font-sans text-xs font-semibold text-neutral-600 mt-2">
                          {language === 'AR' ? `${optPrice.toLocaleString()}.00 ر.س` : `SAR ${optPrice.toLocaleString()}.00`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. OPTIONAL BARISTA ADD-ONS / BUNDLES */}
            {product.bundles && product.bundles.length > 0 && (
              <div id="bundle-offers-section" className="space-y-3 pt-3 border-t border-neutral-100 scroll-mt-28">
                <h2 className="text-base font-extrabold text-neutral-900 tracking-tight flex items-center justify-between">
                  <span>{language === 'AR' ? 'إضافات وبكجات الباريستا الموصى بها' : 'Recommended Barista Kits'}</span>
                  <span className="text-xs font-normal text-emerald-600">
                    {language === 'AR' ? 'عرض خاص على البكج' : 'Special Bundle Offer'}
                  </span>
                </h2>

                <div className="space-y-2">
                  {product.bundles.map(bundle => {
                    const isSelected = selectedBundles.some(b => b.id === bundle.id);
                    return (
                      <button
                        key={bundle.id}
                        onClick={() => toggleBundle(bundle)}
                        className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${
                          isSelected
                            ? 'border-black bg-neutral-50 font-bold'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-start">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-black text-white border-black' : 'border-neutral-300'}`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-neutral-900 block">
                              {language === 'AR' && bundle.nameAr ? bundle.nameAr : bundle.name}
                            </span>
                          </div>
                        </div>
                        <span className="font-sans text-xs font-bold text-neutral-900">
                          {language === 'AR' ? `+${bundle.price} ر.س` : `+SAR ${bundle.price}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. QUANTITY STEPPER */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-100">
              <span className="text-xs font-bold text-neutral-800">
                {language === 'AR' ? 'الكمية المطلوبة:' : 'Quantity:'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 border border-neutral-200 font-bold text-sm cursor-pointer flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="font-mono font-black text-sm w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 border border-neutral-200 font-bold text-sm cursor-pointer flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* 6. HONOR SUMMARY BOX (Exact 1:1 match with Reference Image 1) */}
            <div className="rounded-2xl bg-[#F8F9FA] p-5 sm:p-6 space-y-4">
              <h3 className="font-bold text-base sm:text-lg text-neutral-900 tracking-tight">
                {language === 'AR' ? 'ملخص الطلب' : 'Order Summary'}
              </h3>

              {/* Main Product Line */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-xs sm:text-sm text-neutral-900 leading-snug">
                      {language === 'AR' && product.nameAr ? product.nameAr : product.name} {selectedStorage ? `(${language === 'AR' && selectedStorage.capacityAr ? selectedStorage.capacityAr : selectedStorage.capacity})` : ''} - {language === 'AR' && selectedColor?.nameAr ? selectedColor.nameAr : selectedColor?.name}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      {language === 'AR' ? 'اللون:' : 'Color:'} {language === 'AR' && selectedColor?.nameAr ? selectedColor.nameAr : selectedColor?.name} · {selectedStorage ? (language === 'AR' && selectedStorage.capacityAr ? selectedStorage.capacityAr : selectedStorage.capacity) : (language === 'AR' ? 'الإصدار المعتمد' : 'Standard Edition')}
                    </p>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-neutral-900 shrink-0 font-sans">
                    {language === 'AR' ? `${unitPrice.toLocaleString()}.00 ر.س` : `SAR ${unitPrice.toLocaleString()}.00`}
                  </span>
                </div>
              </div>

              {/* Subtle Divider */}
              <div className="border-t border-neutral-200/70" />

              {/* Free Gifts List Gift(2) - Exact clean style as Image 1 */}
              <div className="space-y-3">
                <div className="text-xs sm:text-sm font-bold text-neutral-900">
                  {language === 'AR' ? 'هدايا مجانية (2)' : 'Free Gifts (2)'}
                </div>

                {/* Gift 1 */}
                <div className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                  <div className="space-y-0.5">
                    <span className="text-neutral-800 font-normal block leading-snug">
                      {language === 'AR' ? 'طقم باريستا الموزون (تامبر 30 باوند + ربلة تسوية سيليكون)' : 'Precision Barista 30lb Spring Tamper & Silicone Mat'}
                    </span>
                    <span className="text-xs text-neutral-400 block">
                      {language === 'AR' ? 'عرض حصري مع كل ماكينة' : 'Free Trial Bonus Package'}
                    </span>
                  </div>
                  <div className="text-end shrink-0">
                    <span className="font-bold text-neutral-900 block">
                      {language === 'AR' ? '0.00 ر.س' : 'SAR 0.00'}
                    </span>
                    <span className="text-xs text-neutral-400 line-through block mt-0.5">
                      {language === 'AR' ? '258.00 ر.س' : 'SAR 258.00'}
                    </span>
                  </div>
                </div>

                {/* Gift 2 */}
                <div className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                  <div className="space-y-0.5">
                    <span className="text-neutral-800 font-normal block leading-snug">
                      {language === 'AR' ? 'بكج الهدايا الترويجي 2 (إبريق تبخير ستانلس 400 مل + قلم لاتيه آرت)' : 'Promotion Gift Package 2 (Sports Kettle 400ml + Latte Art Pen)'}
                    </span>
                    <span className="text-xs text-neutral-400 block">
                      {language === 'AR' ? 'هدية الشراء الفوري' : 'Instant Order Gift'}
                    </span>
                  </div>
                  <div className="text-end shrink-0">
                    <span className="font-bold text-neutral-900 block">
                      {language === 'AR' ? '0.00 ر.س' : 'SAR 0.00'}
                    </span>
                    <span className="text-xs text-neutral-400 line-through block mt-0.5">
                      {language === 'AR' ? '199.00 ر.س' : 'SAR 199.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subtle Divider */}
              <div className="border-t border-neutral-200/70" />

              {/* Total & Savings - Matching Image 1 */}
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-base text-neutral-900">
                    {language === 'AR' ? 'المجموع الكلي' : 'Total'}
                  </span>
                  <div className="text-end">
                    <div className="text-base sm:text-xl font-bold text-neutral-900 font-sans">
                      {language === 'AR' ? `${totalPrice.toLocaleString()}.00 ر.س` : `SAR ${totalPrice.toLocaleString()}.00`}
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-red-600 font-sans">
                        {language === 'AR' ? `وفرت ${savingsSAR || 457}.00 ر.س` : `Save SAR ${savingsSAR || 457}.00`}
                      </span>
                      <span className="text-xs text-neutral-400 line-through font-sans">
                        {language === 'AR' ? `${(totalPrice + (savingsSAR || 457)).toLocaleString()}.00 ر.س` : `SAR ${(totalPrice + (savingsSAR || 457)).toLocaleString()}.00`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BUY NOW BUTTON (Inside Summary Box - Black Pill capsule matching Image 1) */}
              <div className="pt-2">
                <button
                  onClick={handleInstantBuy}
                  className="w-full py-3.5 sm:py-4 px-8 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-sm sm:text-base flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span>{language === 'AR' ? 'شراء الآن' : 'Buy Now'}</span>
                </button>

                {/* Subtle Add to Bag option for store functionality */}
                <button
                  onClick={handleAddToCart}
                  className="w-full mt-2 text-center text-xs text-neutral-400 hover:text-neutral-900 font-medium py-1 cursor-pointer transition-colors"
                >
                  {language === 'AR' ? 'أو أضف إلى حقيبة التسوق' : 'or Add to Bag'}
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 7. SECOND SECTIONS: TABBY & TAMARA CARDS (Exact match with Image 1)       */}
            {/* ========================================================================= */}
            <div className="space-y-3">
              {/* Tabby Installment Card */}
              <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs hover:border-neutral-300 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-neutral-700 leading-relaxed">
                      {language === 'AR' ? (
                        <>
                          يبدأ من <span className="font-bold text-neutral-900">﷼ {(totalPrice / 12).toFixed(2)}/شهرياً</span> حتى 12 دفعة شهرية. متوافق مع الشريعة.
                        </>
                      ) : (
                        <>
                          From <span className="font-bold text-neutral-900">﷼ {(totalPrice / 12).toFixed(2)}/mo</span> with up to 12 monthly payments. Shariah-compliant.
                        </>
                      )}
                    </p>
                    <button
                      type="button"
                      className="mt-1 text-xs font-semibold text-[#8B5A2B] hover:text-[#6F4E37] hover:underline cursor-pointer block text-start"
                    >
                      {language === 'AR' ? 'اعرف المزيد' : 'Learn more'}
                    </button>
                  </div>
                  <div className="shrink-0 bg-[#38FF9C] text-black font-extrabold text-[12px] px-2.5 py-1 rounded-md tracking-tight select-none">
                    tabby
                  </div>
                </div>

                <div className="border-t border-neutral-200/80 my-3" />

                <div className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-neutral-800">
                    <div className="w-4 h-4 rounded-full bg-[#8B5A2B] text-white flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current">
                        <path d="M12 2l2.4 5.5 6 .5-4.5 4 1.3 5.8L12 15l-5.2 2.8 1.3-5.8-4.5-4 6-.5z"/>
                      </svg>
                    </div>
                    <span>
                      {language === 'AR'
                        ? '8 دفعات بدون أي فوائد على المنتجات المؤهلة'
                        : '8 Interest-free payments on eligible items'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 group-hover:translate-x-0.5 rtl:rotate-180 transition-all shrink-0" />
                </div>
              </div>

              {/* Tamara Installment Card */}
              <div className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-2xs hover:border-neutral-300 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-neutral-700 leading-relaxed">
                      {language === 'AR' ? (
                        <>
                          يبدأ من <span className="font-bold text-neutral-900">﷼ {(totalPrice / 24).toFixed(2)}/شهرياً</span> حتى 24 شهراً، متوافق مع الشريعة!
                        </>
                      ) : (
                        <>
                          From <span className="font-bold text-neutral-900">﷼ {(totalPrice / 24).toFixed(2)}/Month</span> for up to 24 months, shariah compliant!
                        </>
                      )}
                    </p>
                    <button
                      type="button"
                      className="mt-1 text-xs font-semibold text-neutral-900 underline hover:text-black cursor-pointer block text-start"
                    >
                      {language === 'AR' ? 'خيارات إضافية' : 'More options'}
                    </button>
                  </div>
                  <div className="shrink-0 bg-gradient-to-r from-[#FF9863] to-[#EB5D82] text-white font-extrabold text-[12px] px-2.5 py-1 rounded-md tracking-tight select-none">
                    tamara
                  </div>
                </div>
              </div>
            </div>

            {/* APPROVED PAYMENT LOGOS */}
            <div className="pt-2 space-y-2">
              <span className="text-[11px] text-neutral-500 block text-center">
                {language === 'AR' ? 'وسائل الدفع المعتمدة والتقسيط بالمملكة:' : 'Approved Payment & Installment Methods in KSA:'}
              </span>
              <div className="flex items-center justify-center gap-3.5 flex-wrap">
                <MadaIcon className="h-4.5" />
                <ApplePayIcon className="h-4.5" />
                <TabbyIcon className="h-4" />
                <TamaraIcon className="h-4" />
                <VisaIcon className="h-4" />
                <MastercardIcon className="h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. BELOW STICKY SECTION: HIGH-RES FEATURE STORY BANNERS                   */}
        {/* ========================================================================= */}
        <section id="overview-features" className="mt-20 sm:mt-28 space-y-12 border-t border-[#E5E5E5] pt-16 scroll-mt-28">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-block text-xs font-bold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-4 py-1.5 rounded-full">
              {language === 'AR' ? 'الهندسة والابتكار' : 'Flagship Architecture'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight text-center">
              {language === 'AR' ? `هندسة متطورة لتجربة باريستا حقيقية مع ${product.nameAr || product.name}` : `Engineered for Specialty Coffee Masters · ${product.name}`}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto">
              {language === 'AR'
                ? 'استخلاص متوازن بضغط فائق مع تقنيات تسخين متطورة وتحكم حراري رقمي دقيق لمذاق المقاهي المختصة.'
                : 'Commercial-grade engineering with calibrated extraction pressure and thermal stability for barista perfection.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#F8F9FA] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between border border-neutral-100 hover:shadow-[0_12px_36px_rgba(0,0,0,0.04)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6">
                <Gauge className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-neutral-900 tracking-tight">
                  {language === 'AR' ? 'مضخة إيطالية 20 بار' : '20-Bar Italian ULKA Pump'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {language === 'AR'
                    ? 'ضغط تدفق ثابت يضمن استخلاص أعمق الزيوت العطرية من البن وتشكيل طبقة كريمة ذهبية كثيفة.'
                    : 'Provides consistent high-pressure flow to extract aromatic espresso oils with signature dense crema.'}
                </p>
              </div>
            </div>

            <div className="bg-[#F8F9FA] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between border border-neutral-100 hover:shadow-[0_12px_36px_rgba(0,0,0,0.04)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6">
                <Flame className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-neutral-900 tracking-tight">
                  {language === 'AR' ? 'نظام التحكم الحراري المزدوج' : 'Dual Thermo PID Control'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {language === 'AR'
                    ? 'تحكم حراري رقمي مستقل للقهوة والتبخير بفارق ±0.5°م فقط لمنع احتراق نكهات القهوة.'
                    : 'Independent temperature equilibrium across brewing and steaming chambers within ±0.5°C accuracy.'}
                </p>
              </div>
            </div>

            <div className="bg-[#F8F9FA] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between border border-neutral-100 hover:shadow-[0_12px_36px_rgba(0,0,0,0.04)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-neutral-900 tracking-tight">
                  {language === 'AR' ? 'بورتافلتر تجاري 58 مم' : '58mm Commercial Group'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {language === 'AR'
                    ? 'مقاس تجاري عالمي من الفولاذ المقاوم للصدأ يتيح استخدام باسكتات احترافية وتوزيع بن مثالي.'
                    : 'Full commercial stainless steel portafilter for uniform extraction bed saturation and barista ergonomics.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. HARDWARE SPECIFICATIONS & DYNAMIC MODEL COMPARISON (Image 1 & Image 2)  */}
        {/* ========================================================================= */}
        <ProductComparisonSection
          currentProduct={product}
          language={language}
          onNavigateToProduct={(targetId) => {
            navigateTo('product-buy', targetId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          customSpecImgUrl={customSpecImg}
          isAdmin={isAdmin}
        />

        {/* ========================================================================= */}
        {/* 6. HONOR-STYLE CUSTOMER REVIEWS (Screenshot 4)                            */}
        {/* ========================================================================= */}
        <section id="customer-reviews-section" className="mt-20 sm:mt-28 space-y-10 border-t border-[#E5E5E5] pt-16 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{language === 'AR' ? 'تقييمات العملاء الموثقة بالمملكة' : 'Verified Customer Ratings in KSA'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                {language === 'AR' ? 'تجارب وآراء المشترين' : 'Customer Reviews & Feedback'}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                {language === 'AR'
                  ? 'جميع التقييمات صادرة عن مشترين تم التحقق من طلباتهم وتوصيلها داخل المملكة العربية السعودية'
                  : 'All reviews are submitted by verified buyers delivered within Saudi Arabia'}
              </p>
            </div>

            <button
              onClick={() => setIsWritingReview(!isWritingReview)}
              className="px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              <span>
                {isWritingReview
                  ? (language === 'AR' ? 'إلغاء' : 'Cancel')
                  : (language === 'AR' ? 'كتابة تقييم جديد' : 'Write a Review')}
              </span>
            </button>
          </div>

          {/* Rating Summary Card (Honor Style 5.0 Rating Box) */}
          <div className="bg-[#F8F9FA] rounded-[28px] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center border border-neutral-100">
            {/* Score & Stars */}
            <div className="md:col-span-4 text-center md:text-start flex flex-col items-center md:items-start justify-center border-b md:border-b-0 md:border-r rtl:md:border-r-0 rtl:md:border-l border-neutral-200/70 pb-6 md:pb-0 md:pr-8 rtl:md:pl-8">
              <div className="text-5xl sm:text-6xl font-black text-neutral-950 font-mono tracking-tight">
                5.0
              </div>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="text-xs sm:text-sm text-neutral-500 font-medium">
                {language === 'AR' ? 'بناءً على 531 تقييم موثق بالمملكة' : 'Based on 531 verified reviews in KSA'}
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{language === 'AR' ? 'نسبة رضا 99.4%' : '99.4% Satisfaction Rate'}</span>
              </div>
            </div>

            {/* Breakdown Bars */}
            <div className="md:col-span-8 space-y-2">
              {[
                { star: 5, pct: '98%', count: '520' },
                { star: 4, pct: '2%', count: '11' },
                { star: 3, pct: '0%', count: '0' },
                { star: 2, pct: '0%', count: '0' },
                { star: 1, pct: '0%', count: '0' }
              ].map(row => (
                <div key={row.star} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 shrink-0 font-medium text-neutral-600">
                    <span>{row.star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                      style={{ width: row.pct }}
                    />
                  </div>
                  <span className="w-10 text-neutral-400 text-end font-mono text-[11px] shrink-0">
                    {row.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Success Notification Alert */}
          {showReviewSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {language === 'AR'
                  ? 'تم استلام تقييمك بنجاح! شكراً لمشاركتك رأيك القيم مع عائلة هاي برو.'
                  : 'Your review was submitted successfully! Thank you for sharing your experience.'}
              </span>
            </div>
          )}

          {/* Review Submission Form */}
          {isWritingReview && (
            <form
              onSubmit={handleSubmitReview}
              className="bg-white border border-neutral-200 rounded-[28px] p-6 sm:p-8 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="font-extrabold text-sm sm:text-base text-neutral-900">
                  {language === 'AR' ? 'شارك رأيك في هذا المنتج' : 'Write Your Review'}
                </span>
                <span className="text-xs text-neutral-400">
                  {language === 'AR' ? 'تقييم فوري موثق' : 'Instant Verified Review'}
                </span>
              </div>

              {/* Star Rating Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700">
                  {language === 'AR' ? 'تقييمك للمنتج (بالنجوم):' : 'Your Rating:'}
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewRating(st)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          st <= newRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={language === 'AR' ? 'اسمك الأول أو اللقب' : 'Your name / nickname'}
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-black"
                />
                <input
                  type="text"
                  placeholder={language === 'AR' ? 'المدينة (مثل: الرياض، جدة)' : 'City (e.g. Riyadh, Jeddah)'}
                  value={newCity}
                  onChange={e => setNewCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <textarea
                placeholder={language === 'AR' ? 'اكتب رأيك وتجربتك مع الماكينة واستخلاص القهوة...' : 'Write your detailed thoughts on extraction, build quality and steaming...'}
                rows={4}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-black"
              />

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-7 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'AR' ? 'نشر التقييم الآن' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Reviews Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            <button
              onClick={() => setActiveReviewTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                activeReviewTab === 'all'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR' ? `جميع التقييمات (${reviewsList.length})` : `All Reviews (${reviewsList.length})`}
            </button>
            <button
              onClick={() => setActiveReviewTab('images')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                activeReviewTab === 'images'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR' ? 'مع صور للمنتج (3)' : 'With Photos (3)'}
            </button>
          </div>

          {/* Review Cards (Screenshot 4) */}
          <div className="space-y-4">
            {reviewsList
              .filter(r => (activeReviewTab === 'images' ? r.hasImage : true))
              .map(rev => (
                <div
                  key={rev.id}
                  className="bg-[#F8F9FA] rounded-[24px] p-6 border border-neutral-100/80 space-y-3"
                >
                  {/* Top user row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-xs text-neutral-700">
                        {rev.author.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-neutral-900">{rev.author}</span>
                          <span className="text-[10px] text-neutral-400">({language === 'AR' ? rev.city : rev.cityEn})</span>
                          {rev.verified && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{language === 'AR' ? 'مشتري موثق بالمملكة' : 'Verified Buyer'}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] text-neutral-400 font-mono">{rev.date}</span>
                  </div>

                  {/* Model Purchased Badge */}
                  <div className="text-[11px] text-neutral-500 font-medium">
                    {language === 'AR' ? 'المنتج المشترى:' : 'Purchased Edition:'} <span className="text-neutral-700 font-semibold">{language === 'AR' && (rev as any).modelBoughtAr ? (rev as any).modelBoughtAr : rev.modelBought}</span>
                  </div>

                  {/* Content */}
                  <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal">
                    {language === 'AR' ? rev.contentAr : rev.contentEn}
                  </p>

                  {/* Helpful Button (Screenshot 4) */}
                  <div className="flex items-center justify-end pt-2">
                    <button
                      onClick={() => toggleLikeReview(rev.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                        rev.liked
                          ? 'bg-[#8B5A2B]/10 text-[#8B5A2B] font-bold'
                          : 'bg-white hover:bg-neutral-200/60 text-neutral-600'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{language === 'AR' ? 'مفيد' : 'Helpful'}</span>
                      <span className="font-mono text-[11px]">({rev.likes})</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FAQ ACCORDION SECTION                                                  */}
        {/* ========================================================================= */}
        <section id="faq-section" className="mt-20 sm:mt-28 space-y-8 border-t border-[#E5E5E5] pt-16 max-w-4xl mx-auto scroll-mt-28">
          <div className="text-center space-y-3">
            <span className="inline-block text-xs font-bold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-4 py-1.5 rounded-full">
              {language === 'AR' ? 'الأسئلة الشائعة والدعم' : 'Frequently Asked Questions'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight text-center">
              {language === 'AR' ? 'كل ما تود معرفته قبل الشراء' : 'Everything You Need to Know'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto">
              {language === 'AR' ? 'إجابات شاملة لجميع تساؤلاتك حول الاستخدام، الضمان والشحن السريع.' : 'Answers to all your questions about features, agency warranty, and express delivery.'}
            </p>
          </div>

          <div className="divide-y divide-neutral-200">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-start gap-4 cursor-pointer group py-1"
                  >
                    <span className="font-bold text-sm sm:text-base text-neutral-900 group-hover:text-black">
                      {language === 'AR' ? faq.qAr : faq.qEn}
                    </span>
                    <span className="text-neutral-400 group-hover:text-neutral-700">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed pr-2">
                      {language === 'AR' ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 8. MOBILE FIXED BOTTOM BUY BAR (< lg screens)                             */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-2.5 px-4 safe-area-pb">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          {/* Price & savings */}
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-neutral-500 font-medium truncate">
              {language === 'AR' && product.nameAr ? product.nameAr : product.name}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-neutral-900 font-sans tracking-tight">
                {language === 'AR' ? `${totalPrice.toLocaleString()} ر.س` : `SAR ${totalPrice.toLocaleString()}`}
              </span>
              {savingsSAR > 0 && (
                <span className="text-[10px] text-red-600 font-bold font-sans">
                  {language === 'AR' ? `وفر ${savingsSAR} ر.س` : `Save SAR ${savingsSAR}`}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAddToCart}
              className="px-3.5 py-2.5 rounded-full border border-neutral-300 hover:border-black bg-white text-neutral-900 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title={language === 'AR' ? 'أضف للسلة' : 'Add to Bag'}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden xs:inline">{language === 'AR' ? 'للسلة' : 'Bag'}</span>
            </button>
            <button
              onClick={handleInstantBuy}
              className="px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <span>{language === 'AR' ? 'شراء الآن' : 'Buy Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

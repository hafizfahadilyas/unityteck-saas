import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import {
  Search,
  ShoppingBag,
  User,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
  LayoutGrid,
  Columns,
  Sparkles,
  ArrowRight,
  Palette
} from 'lucide-react';

type MegaMenuKey = 'machines' | 'mills' | 'cabinets' | 'accessories' | 'offers' | 'custom-order' | 'explore' | null;

interface MegaProductItem {
  id: string;
  name: string;
  nameAr: string;
  image: string;
  isNew: boolean;
}

// 100% Curated 5 products for every category and every sub-filter
const MEGA_CATALOG: Record<string, Record<string, MegaProductItem[]>> = {
  machines: {
    latest: [
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew Barista Pro H7A Dual-Boiler',
        nameAr: 'ماكينة بارستا برو H7A دبل بويلر 20 بار',
        image: './src/assets/images/hibrew_h7a_flagship_machine.png',
        isNew: true
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew H10A Pro Dual PID',
        nameAr: 'ماكينة هايبرو H10A بنظام PID المزدوج',
        image: './src/assets/images/hibrew_espresso_isolated.jpg',
        isNew: true
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew H10B Barista Master 58mm',
        nameAr: 'ماكينة بارستا ماستر بمقبس تجاري 58مم',
        image: './src/assets/images/product_machine_silver_pro.png',
        isNew: false
      },
      {
        id: 'hb-h4a-portable-travel',
        name: 'HiBrew H4A Portable 4-in-1 Espresso',
        nameAr: 'ماكينة القهوة المحمولة 4 في 1 للسفر',
        image: './src/assets/images/hibrew_h4a_portable_isolated.jpg',
        isNew: true
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew H11 Semi-Automatic 19-Bar',
        nameAr: 'ماكينة هايبرو H11 الإيطالية 19 بار',
        image: './src/assets/images/product_machine_compact_black.png',
        isNew: false
      }
    ],
    pro: [
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew Barista Pro H7A Dual-Boiler',
        nameAr: 'ماكينة بارستا برو H7A دبل بويلر 20 بار',
        image: './src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
        isNew: true
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew H10A Pro Dual PID',
        nameAr: 'ماكينة هايبرو H10A بنظام PID المزدوج',
        image: './src/assets/images/hero_hibrew_espresso_1791217182679.jpg',
        isNew: true
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew Touchscreen PID Commercial',
        nameAr: 'ماكينة اللمس الذكية PID للتحكم الحراري',
        image: './src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg',
        isNew: false
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew Dual Thermo Pressure Gauge',
        nameAr: 'ماكينة مقياس الضغط واستخلاص الكريمة',
        image: './src/assets/images/barista_crema_macro_1791363328316.jpg',
        isNew: false
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew Pro Walnut Wood Edition',
        nameAr: 'ماكينة برو إصدار خشب الجوز الفاخر',
        image: './src/assets/images/espresso_wood_pitcher_1791363392554.jpg',
        isNew: true
      }
    ],
    compact: [
      {
        id: 'hb-h4a-portable-travel',
        name: 'HiBrew H4A Portable 4-in-1 Espresso',
        nameAr: 'ماكينة القهوة المحمولة 4 في 1 للسفر',
        image: './src/assets/images/hero_multicapsule_portable_1791217213863.jpg',
        isNew: true
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew H2B 5-in-1 Multi-Capsule',
        nameAr: 'ماكينة كبسولات متعددة 5 في 1 مدمجة',
        image: './src/assets/images/saudi_cafe_machine_1791363309148.jpg',
        isNew: false
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew H1A Compact 3-in-1 Pod Maker',
        nameAr: 'ماكينة هايبرو H1A المدمجة السريعة',
        image: './src/assets/images/hero_hibrew_espresso_1791217182679.jpg',
        isNew: false
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew H11 Slim 19-Bar Italian',
        nameAr: 'ماكينة هايبرو H11 سليم ستانلس ستيل',
        image: './src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
        isNew: true
      },
      {
        id: 'hb-h4a-portable-travel',
        name: 'HiBrew H4B Car & Camping Espresso',
        nameAr: 'ماكينة السيارة والتخييم مع كابل 12V',
        image: './src/assets/images/hero_multicapsule_portable_1791217213863.jpg',
        isNew: false
      }
    ],
    commercial: [
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew Commercial 58mm Dual Boiler',
        nameAr: 'ماكينة 58مم التجارية دبل بويلر ULKA',
        image: './src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
        isNew: true
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew H10A Rotary Pump Dual Group',
        nameAr: 'ماكينة بمضخة روتاري تجارية هادئة',
        image: './src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg',
        isNew: false
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew E61 Saturated Brass Group',
        nameAr: 'رأس استخلاص نحاسي E61 مشبع بالحرارة',
        image: './src/assets/images/hero_hibrew_espresso_1791217182679.jpg',
        isNew: false
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew Cafe Pro Master Espresso Bar',
        nameAr: 'محطة الكافيه الاحترافية المتكاملة',
        image: './src/assets/images/saudi_cafe_machine_1791363309148.jpg',
        isNew: true
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'HiBrew Commercial Microfoam Steamer',
        nameAr: 'ماكينة التبخير الجاف 3 فتحات للاتيه',
        image: './src/assets/images/barista_milk_steaming_1791363367164.jpg',
        isNew: false
      }
    ]
  },
  mills: {
    latest: [
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew Conical Burr Coffee Mill G5',
        nameAr: 'مطحنة بن هايبرو G5 بتروس مخروطية',
        image: './src/assets/images/hibrew_grinder_isolated.jpg',
        isNew: true
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew G3 Flat Burr 64mm Mill',
        nameAr: 'مطحنة التروس المسطحة 64مم فلات بير',
        image: './src/assets/images/hibrew_grinder_silver.jpg',
        isNew: true
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew G4 Pro Zero-Retention Single',
        nameAr: 'مطحنة الاحتباس الصفري مع مضخة تفريغ',
        image: './src/assets/images/hibrew_grinder_isolated.jpg',
        isNew: false
      },
      {
        id: 'hb-v60-complete-kit',
        name: 'HiBrew CNC Titanium Precision Hand Mill',
        nameAr: 'مطحنة يدوية تروس تيتانيوم خماسية CNC',
        image: './src/assets/images/hibrew_grinder_silver.jpg',
        isNew: true
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew Stepless Low-RPM Commercial Mill',
        nameAr: 'مطحنة تجارية دوران بطيء مانع للحرارة',
        image: './src/assets/images/hibrew_grinder_isolated.jpg',
        isNew: false
      }
    ],
    conical: [
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew G5 40mm Titanium Conical Mill',
        nameAr: 'مطحنة G5 تروس تيتانيوم 40 ملم مخروطية',
        image: './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg',
        isNew: true
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew G5 Pro Anti-Static Bellows',
        nameAr: 'مطحنة G5 برو مع مضخة سيليكون هوائية',
        image: './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg',
        isNew: true
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew G2 Conical Burr Daily Espresso',
        nameAr: 'مطحنة مخروطية للإسبريسو اليومي والفلتر',
        image: './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg',
        isNew: false
      },
      {
        id: 'hb-v60-complete-kit',
        name: 'HiBrew Compact Travel Conical Grinder',
        nameAr: 'مطحنة مخروطية مدمجة للرحلات والمكتب',
        image: './src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg',
        isNew: false
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew 48mm Italian Conical Burrs',
        nameAr: 'تروس إيطالية مخروطية 48 ملم عالية الصلابة',
        image: './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg',
        isNew: true
      }
    ],
    flat: [
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew G3 64mm Titanium Flat Burr',
        nameAr: 'مطحنة تروس مسطحة 64مم مطلية تيتانيوم',
        image: './src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
        isNew: true
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew G4 Flat Burr Commercial Hopper',
        nameAr: 'مطحنة فلات بير مع هوبر تجاري 250 جرام',
        image: './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg',
        isNew: true
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew Ultra-Uniform Single Dose 54mm',
        nameAr: 'مطحنة سينجل دوز 54مم تناسق فائق',
        image: './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg',
        isNew: false
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew Lab Precision Flat Burr Espresso',
        nameAr: 'مطحنة مسطحة بدقة مخبرية لتحضير V60',
        image: './src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
        isNew: false
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'HiBrew DLC Coated Commercial Flat',
        nameAr: 'تروس كربونية DLC مقاومة للاحتكاك والحرارة',
        image: './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg',
        isNew: true
      }
    ]
  },
  cabinets: {
    latest: [
      {
        id: 'hb-cabinet-solid-oak',
        name: 'Artisan Fluted Oak Coffee Cabinet',
        nameAr: 'دولاب ركن القهوة خشب البلوط المضلع',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        isNew: true
      },
      {
        id: 'hb-corner-station-led',
        name: 'Barista Corner Station Sintered Stone',
        nameAr: 'ركن باريستا متكامل مع سطح بورسلان حراري',
        image: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
        isNew: true
      },
      {
        id: 'hb-cabinet-solid-oak',
        name: 'Luxury Floating Espresso Bar with LED',
        nameAr: 'بار إسبريسو جداري معلق بإضاءة دافئة',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        isNew: false
      },
      {
        id: 'hb-corner-station-led',
        name: 'Mobile Barista Hardwood Cart on Wheels',
        nameAr: 'عربة باريستا متحركة بعجلات نحاسية',
        image: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
        isNew: false
      },
      {
        id: 'hb-cabinet-solid-oak',
        name: 'Grand Barista Corner Cabinet Deluxe',
        nameAr: 'دولاب ركن القهوة الملكي مع منافذ كهرباء',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        isNew: true
      }
    ],
    cabinets: [
      {
        id: 'hb-cabinet-solid-oak',
        name: 'Artisan Fluted Oak Cabinet 140cm',
        nameAr: 'دولاب قهوة خشب بلوط مضلع 140 سم',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        isNew: true
      },
      {
        id: 'hb-corner-station-led',
        name: 'Solid Walnut Double Door Coffee Bar',
        nameAr: 'خزانة قهوة خشب جوز طبيعي ببابين',
        image: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
        isNew: false
      },
      {
        id: 'hb-cabinet-solid-oak',
        name: 'Warm Oak Tempered Glass Cabinet',
        nameAr: 'دولاب زجاج حراري لعرض الأكواب والمكائن',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        isNew: true
      },
      {
        id: 'hb-corner-station-led',
        name: 'Porcelain Top Sintered Stone Cupboard',
        nameAr: 'طاولة قهوة بسطح حجري مقاوم للبقع',
        image: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
        isNew: false
      },
      {
        id: 'hb-cabinet-solid-oak',
        name: 'Minimalist Nordic Oak Coffee Console',
        nameAr: 'كونسول قهوة بتصميم نورديك عصري بسيط',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        isNew: false
      }
    ],
    corners: [
      {
        id: 'hb-corner-station-led',
        name: 'Barista Corner Station Sintered Stone',
        nameAr: 'محطة ركن القهوة الذكية مع رفوف علوية',
        image: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
        isNew: true
      },
      {
        id: 'hb-cabinet-solid-oak',
        name: 'L-Shaped Luxury Coffee Corner Cabinet',
        nameAr: 'ركن قهوة زاوية حرف L للصالات والمكاتب',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        isNew: false
      },
      {
        id: 'hb-corner-station-led',
        name: 'Barista Island Station with Outlets',
        nameAr: 'محطة جزيرة باريستا مع توصيلات مدمجة',
        image: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
        isNew: true
      },
      {
        id: 'hb-cabinet-solid-oak',
        name: 'Compact 100cm Coffee Corner Station',
        nameAr: 'ركن قهوة مدمج 100 سم للشقق والغرف',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        isNew: false
      },
      {
        id: 'hb-corner-station-led',
        name: 'Full Home Cafe Deluxe Barista Corner',
        nameAr: 'ركن الكافيه المنزلي الفاخر بإضاءة ليد مخفية',
        image: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
        isNew: true
      }
    ]
  },
  accessories: {
    latest: [
      {
        id: 'hb-boltfilter-58-naked',
        name: '58mm Naked Walnut Boltfilter',
        nameAr: 'بورتافلتر مكشوف 58 ملم خشب الجوز',
        image: './src/assets/images/hibrew_portafilter_isolated.jpg',
        isNew: true
      },
      {
        id: 'hb-ceramic-cups-set',
        name: 'Artisan Stoneware Ceramic Cup Set',
        nameAr: 'طقم أكواب سيراميك حجري مع صحون خشب',
        image: './src/assets/images/hibrew_ceramic_cup_isolated.jpg',
        isNew: true
      },
      {
        id: 'hb-smart-scale-timer',
        name: 'Precision Barista Smart Scale Timer',
        nameAr: 'ميزان القهوة الذكي مع مؤقت التدفق 0.1g',
        image: './src/assets/images/hibrew_scale_isolated.jpg',
        isNew: false
      },
      {
        id: 'hb-barista-tools-pro',
        name: 'Constant Pressure 30lb Spring Tamper',
        nameAr: 'تامبر تسوية أوتوماتيكي بضغط ثابت 30lb',
        image: './src/assets/images/hibrew_barista_kit_isolated.jpg',
        isNew: true
      },
      {
        id: 'hb-v60-complete-kit',
        name: 'Crystal Glass Dripper & Server Kit',
        nameAr: 'طقم قمع ترشيح كريستال وسيرفر زجاجي',
        image: './src/assets/images/hibrew_v60_isolated.jpg',
        isNew: false
      }
    ],
    boltfilters: [
      {
        id: 'hb-boltfilter-58-naked',
        name: '58mm Naked Walnut Bottomless Filter',
        nameAr: 'بورتافلتر مكشوف 58 ملم خشب جوز طبيعي',
        image: './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg',
        isNew: true
      },
      {
        id: 'hb-boltfilter-58-naked',
        name: '58mm Double Spout Ergonomic Portafilter',
        nameAr: 'بورتافلتر مخرج مزدوج بمقبض مريح',
        image: './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg',
        isNew: false
      },
      {
        id: 'hb-boltfilter-58-naked',
        name: '58mm Dark Ebony Hardwood Filter',
        nameAr: 'بورتافلتر بمقبض خشب الأبنوس الأسود',
        image: './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg',
        isNew: true
      },
      {
        id: 'hb-boltfilter-58-naked',
        name: '58.4mm Micro-Laser Precision Basket 18g',
        nameAr: 'باسكت دقيق الفتحات بالليزر مقاس 18 جرام',
        image: './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg',
        isNew: false
      },
      {
        id: 'hb-boltfilter-58-naked',
        name: '58mm Puck Screen Stainless Steel Mesh',
        nameAr: 'شبكة توزيع المياه ومصفاة البك سكرين 58مم',
        image: './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg',
        isNew: true
      }
    ],
    cups: [
      {
        id: 'hb-ceramic-cups-set',
        name: 'Artisan Stoneware Ceramic Cup Set',
        nameAr: 'طقم أكواب سيراميك حجري مع صحون خشب',
        image: './src/assets/images/product_ceramic_cups_set_1791217230149.jpg',
        isNew: true
      },
      {
        id: 'hb-ceramic-cups-set',
        name: 'Matte Espresso Cup with Wooden Saucer',
        nameAr: 'كوب إسبريسو 80 مل أسود مطفي مع صحن',
        image: './src/assets/images/product_ceramic_cups_set_1791217230149.jpg',
        isNew: false
      },
      {
        id: 'hb-ceramic-cups-set',
        name: 'Flat White & Cortado Ceramic Cup 180ml',
        nameAr: 'كوب فلات وايت وكورتادو سيراميك 180 مل',
        image: './src/assets/images/product_ceramic_cups_set_1791217230149.jpg',
        isNew: true
      },
      {
        id: 'hb-ceramic-cups-set',
        name: 'Latte Art Wide-Rim Ceramic Mug 250ml',
        nameAr: 'كوب لاتيه عريض الحافة لرسم اللاتيه آرت',
        image: './src/assets/images/product_ceramic_cups_set_1791217230149.jpg',
        isNew: false
      },
      {
        id: 'hb-v60-complete-kit',
        name: 'Royal Saudi Emerald Heritage Cup Set',
        nameAr: 'طقم فناجين اليوم الوطني الأخضر والذهبي',
        image: './src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg',
        isNew: true
      }
    ],
    tools: [
      {
        id: 'hb-barista-tools-pro',
        name: 'Constant Pressure 30lb Spring Tamper',
        nameAr: 'تامبر تسوية أوتوماتيكي بضغط ثابت 30 باوند',
        image: './src/assets/images/coffee_barista_accessories_set_1791219198302.jpg',
        isNew: true
      },
      {
        id: 'hb-barista-tools-pro',
        name: 'Magnetic WDT Tool with 8 Needles',
        nameAr: 'مفكك تكتلات القهوة المغناطيسي 8 إبر',
        image: './src/assets/images/coffee_barista_accessories_set_1791219198302.jpg',
        isNew: false
      },
      {
        id: 'hb-barista-tools-pro',
        name: 'Teflon Sharp-Spout Milk Pitcher 450ml',
        nameAr: 'بتشر تبخير تيفلون بفتحة صب دقيقة للرسم',
        image: './src/assets/images/espresso_wood_pitcher_1791363392554.jpg',
        isNew: true
      },
      {
        id: 'hb-smart-scale-timer',
        name: 'Precision Barista Smart Scale Timer',
        nameAr: 'ميزان إلكتروني بمؤقت ذكي وحساس 0.1 جرام',
        image: './src/assets/images/coffee_barista_accessories_set_1791219198302.jpg',
        isNew: false
      },
      {
        id: 'hb-barista-tools-pro',
        name: 'Solid Walnut Barista Tamping Mat',
        nameAr: 'قاعدة كبس وتنظيم أدوات من خشب الجوز',
        image: './src/assets/images/coffee_barista_accessories_set_1791219198302.jpg',
        isNew: true
      }
    ]
  },
  offers: {
    latest: [
      {
        id: 'hb-v60-complete-kit',
        name: 'Royal Saudi 96 V60 Pour-Over Set',
        nameAr: 'بكج التقطير الملكي V60 وغلاية التحكم الرقمي',
        image: './src/assets/images/hibrew_v60_isolated.jpg',
        isNew: true
      },
      {
        id: 'hb-h4a-portable-travel',
        name: 'HiBrew H4A Portable Travel Espresso Kit',
        nameAr: 'بكج السفر المتكامل مع حقيبة وكابل 12V',
        image: './src/assets/images/hibrew_h4a_portable_isolated.jpg',
        isNew: true
      },
      {
        id: 'hb-h10a-dualboiler',
        name: 'Complete Home Barista Master Station',
        nameAr: 'بكج محطة الباريستا المتكاملة (ماكينة + مطحنة)',
        image: './src/assets/images/hibrew_h7a_flagship_machine.png',
        isNew: true
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'Specialty Espresso Duo Pack (H10A + G5)',
        nameAr: 'عرض الثنائي الذهبي: ماكينة H10A + مطحنة G5',
        image: './src/assets/images/hibrew_grinder_isolated.jpg',
        isNew: true
      },
      {
        id: 'hb-ceramic-cups-set',
        name: 'Dual Cup & Pitcher Barista Gift Set',
        nameAr: 'بوكس الهدايا: أكواب سيراميك + بتشر تبخير',
        image: './src/assets/images/hibrew_ceramic_cup_isolated.jpg',
        isNew: true
      }
    ],
    bundles: [
      {
        id: 'hb-h10a-dualboiler',
        name: 'Complete Home Barista Master Station',
        nameAr: 'بكج محطة الباريستا المتكاملة (ماكينة + مطحنة)',
        image: './src/assets/images/hibrew_h7a_flagship_machine.png',
        isNew: true
      },
      {
        id: 'hb-v60-complete-kit',
        name: 'Royal Saudi 96 V60 Pour-Over Set',
        nameAr: 'بكج التقطير الملكي V60 وغلاية التحكم الرقمي',
        image: './src/assets/images/hibrew_v60_isolated.jpg',
        isNew: true
      },
      {
        id: 'hb-h4a-portable-travel',
        name: 'HiBrew H4A Portable Travel Espresso Kit',
        nameAr: 'بكج السفر المتكامل مع حقيبة وكابل 12V',
        image: './src/assets/images/hibrew_h4a_portable_isolated.jpg',
        isNew: true
      },
      {
        id: 'hb-barista-tools-pro',
        name: 'Barista Pro Puck Prep Complete Set',
        nameAr: 'بكج أدوات تحضير البك المتكاملة (8 قطع)',
        image: './src/assets/images/hibrew_barista_kit_isolated.jpg',
        isNew: false
      },
      {
        id: 'hb-mill-g5-pro',
        name: 'Specialty Espresso Duo Pack (H10A + G5)',
        nameAr: 'عرض الثنائي الذهبي: ماكينة H10A + مطحنة G5',
        image: './src/assets/images/hibrew_grinder_isolated.jpg',
        isNew: true
      }
    ]
  }
};

export const Header: React.FC = () => {
  const {
    cartCount,
    cartBump,
    setIsMiniCartOpen,
    setIsSearchOpen,
    navigateTo,
    countryNoticeVisible,
    dismissCountryNotice,
    language,
    setLanguage,
    toggleLanguage,
    currentRoute,
    user
  } = useCart();

  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey>(null);
  const [renderedMegaMenu, setRenderedMegaMenu] = useState<MegaMenuKey>(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubNavKey, setMobileSubNavKey] = useState<MegaMenuKey | null>(null);
  const [mobileSubFilter, setMobileSubFilter] = useState<string>('latest');
  const [activeSubFilter, setActiveSubFilter] = useState<string>('latest');
  const [isScrolled, setIsScrolled] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const megaMenuContainerRef = useRef<HTMLDivElement | null>(null);

  // Track window scroll for sticky border & shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Clear hover timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (closeAnimationTimeoutRef.current) clearTimeout(closeAnimationTimeoutRef.current);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setMobileSubNavKey(null);
      setMobileSubFilter('latest');
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Rock-solid glitch-free hover handlers with smooth slide-down and automatic slide-up
  const handleNavMouseEnter = (menuKey: MegaMenuKey) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (closeAnimationTimeoutRef.current) {
      clearTimeout(closeAnimationTimeoutRef.current);
      closeAnimationTimeoutRef.current = null;
    }
    setActiveMegaMenu(menuKey);
    setRenderedMegaMenu(menuKey);
    setIsMegaMenuOpen(true);
    setActiveSubFilter('latest');
  };

  const scheduleMenuClose = (delay = 180) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      // Trigger smooth slide-up animation
      setIsMegaMenuOpen(false);

      if (closeAnimationTimeoutRef.current) {
        clearTimeout(closeAnimationTimeoutRef.current);
      }
      closeAnimationTimeoutRef.current = setTimeout(() => {
        setActiveMegaMenu(null);
        setRenderedMegaMenu(null);
      }, 300);
    }, delay);
  };

  const closeMenuImmediately = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (closeAnimationTimeoutRef.current) clearTimeout(closeAnimationTimeoutRef.current);
    setIsMegaMenuOpen(false);
    setActiveMegaMenu(null);
    setRenderedMegaMenu(null);
  };

  const handleDropdownMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (closeAnimationTimeoutRef.current) {
      clearTimeout(closeAnimationTimeoutRef.current);
      closeAnimationTimeoutRef.current = null;
    }
    setIsMegaMenuOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    scheduleMenuClose(150);
  };

  const handleHeaderMouseLeave = (e: React.MouseEvent) => {
    const related = e.relatedTarget;
    if (
      megaMenuContainerRef.current &&
      related instanceof Node &&
      megaMenuContainerRef.current.contains(related)
    ) {
      return;
    }
    scheduleMenuClose(160);
  };

  // Get active products for current mega menu and sub-filter
  const currentMenu = renderedMegaMenu || activeMegaMenu || 'machines';
  const getActiveProducts = (): MegaProductItem[] => {
    const menuToUse = renderedMegaMenu || activeMegaMenu || 'machines';
    if (!menuToUse || menuToUse === 'custom-order' || menuToUse === 'explore') return [];
    const cat = MEGA_CATALOG[menuToUse];
    if (!cat) return [];
    return cat[activeSubFilter] || cat['latest'] || [];
  };

  const activeProducts = getActiveProducts();

  return (
    <>
      {/* 1. TOP BAR (Honor Style Country/Region Selector Bar) */}
      {countryNoticeVisible && (
        <div className="w-full bg-[#f7f7f8] border-b border-neutral-200/70 text-[12px] text-neutral-600 py-1.5 px-4 sm:px-6 lg:px-8 transition-all duration-300 overflow-hidden">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="truncate block font-normal text-neutral-700">
                {language === 'AR'
                  ? 'اختر دولتك أو منطقتك للاطلاع على المحتوى المخصص والشراء مباشرة مع الشحن الفوري بالمملكة.'
                  : 'Choose your country or region to see content related to you and shop directly with express KSA delivery.'}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 bg-white px-3 py-0.5 rounded-full border border-neutral-300/80 text-[11px] font-medium text-neutral-800 shadow-2xs">
                <span>{language === 'AR' ? 'المملكة العربية السعودية / العربية' : 'Saudi Arabia / English'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              </div>

              <button
                onClick={dismissCountryNotice}
                className="px-3.5 py-0.5 rounded-full bg-black text-white text-[11px] font-semibold hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              >
                {language === 'AR' ? 'متابعة' : 'Continue'}
              </button>

              <button
                onClick={dismissCountryNotice}
                className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer shrink-0"
                title="Close"
                aria-label="Close region selector"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN HEADER NAVIGATION BAR (Sticky Fixed on Scroll with Honor Slim Profile & Perfect Center Alignment) */}
      <header
        className={`sticky top-0 z-50 w-full bg-white text-neutral-900 border-b border-neutral-200/80 transition-all duration-200 ${
          isScrolled ? 'shadow-[0_2px_15px_rgba(0,0,0,0.06)]' : ''
        }`}
        onMouseLeave={handleHeaderMouseLeave}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative bg-white z-50">
          {/* 1. Left: Brand Logo */}
          <div className="flex items-center shrink-0 z-10" onMouseEnter={() => scheduleMenuClose(80)}>
            <button
              type="button"
              onClick={() => {
                closeMenuImmediately();
                setMobileMenuOpen(false);
                navigateTo('home');
              }}
              className="flex items-center gap-1.5 sm:gap-2 group focus:outline-hidden cursor-pointer text-start tracking-tight font-black text-xl sm:text-2xl font-sans text-black uppercase shrink-0"
              title="HiBrew Coffee Official Store KSA"
            >
              <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-black shrink-0" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.5" />
                <path d="M12 3.5 A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="tracking-tighter font-extrabold text-[19px] sm:text-[22px]">{language === 'AR' ? 'هايبرو' : 'HIBREW'}</span>
            </button>
          </div>

          {/* 2. Center: Desktop Nav Items (Flex in-flow layout ensuring zero overlap in both RTL Arabic and LTR English) */}
          <nav className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-2 lg:mx-3 xl:mx-4 2xl:mx-6 gap-2 lg:gap-2.5 xl:gap-3.5 2xl:gap-5 text-[12px] lg:text-[12.5px] xl:text-[13px] 2xl:text-[13.5px] font-normal text-neutral-800 h-16 whitespace-nowrap">
            {/* 1. Machines (مكائن القهوة) */}
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('machines')}
            >
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'machines' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span>{language === 'AR' ? 'المكائن' : 'Machines'}</span>
                {activeMegaMenu === 'machines' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>

            {/* 2. Mills (مطاحن القهوة) */}
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('mills')}
            >
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'mills' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span>{language === 'AR' ? 'المطاحن' : 'Mills'}</span>
                {activeMegaMenu === 'mills' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>

            {/* 3. Cabinets (أركان ودواليب القهوة) */}
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('cabinets')}
            >
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'cabinets' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span>{language === 'AR' ? 'أركان ودواليب القهوة' : 'Coffee Bars'}</span>
                {activeMegaMenu === 'cabinets' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>

            {/* 4. Accessories (المستلزمات والأكواب) */}
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('accessories')}
            >
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'accessories' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span>{language === 'AR' ? 'الأكواب والمستلزمات' : 'Accessories'}</span>
                {activeMegaMenu === 'accessories' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>

            {/* 5. Offers (العروض والباقات) */}
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('offers')}
            >
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className={`py-2 transition-colors cursor-pointer relative whitespace-nowrap ${
                  activeMegaMenu === 'offers' && isMegaMenuOpen
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span>{language === 'AR' ? 'العروض والباقات' : 'HiBrew CHOICE'}</span>
                {activeMegaMenu === 'offers' && isMegaMenuOpen && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>

            {/* 6. Smart AI Tech */}
            <div className="h-full flex items-center shrink-0" onMouseEnter={() => scheduleMenuClose(80)}>
              <button
                onClick={() => {
                  closeMenuImmediately();
                  const el = document.getElementById('machine-story-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigateTo('home');
                }}
                className="py-2 inline-flex items-center gap-1 text-neutral-700 hover:text-black transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{language === 'AR' ? 'الذكاء الاصطناعي' : 'AI'}</span>
                <Sparkles className="w-3.5 h-3.5 text-[#2563eb] fill-[#2563eb]/20" />
              </button>
            </div>

            {/* 7. Business */}
            <div className="h-full hidden xl:flex items-center shrink-0" onMouseEnter={() => scheduleMenuClose(80)}>
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('products');
                }}
                className="py-2 text-neutral-700 hover:text-black transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{language === 'AR' ? 'قطاع الأعمال' : 'Business'}</span>
              </button>
            </div>

            {/* 8. Support */}
            <div className="h-full hidden xl:flex items-center shrink-0" onMouseEnter={() => scheduleMenuClose(80)}>
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('reviews');
                }}
                className="py-2 text-neutral-700 hover:text-black transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{language === 'AR' ? 'الدعم والضمان' : 'Support'}</span>
              </button>
            </div>

            {/* 9. Custom Made to Order */}
            <div
              className="relative h-full flex items-center shrink-0"
              onMouseEnter={() => handleNavMouseEnter('custom-order')}
            >
              <button
                onClick={() => {
                  closeMenuImmediately();
                  navigateTo('custom-order');
                }}
                className={`py-2 transition-colors cursor-pointer relative whitespace-nowrap ${
                  (activeMegaMenu === 'custom-order' && isMegaMenuOpen) || currentRoute === 'custom-order'
                    ? 'text-black font-semibold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                <span>{language === 'AR' ? 'تفصيل حسب الطلب' : 'Custom Made to Order'}</span>
                {((activeMegaMenu === 'custom-order' && isMegaMenuOpen) || currentRoute === 'custom-order') && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            </div>
          </nav>

          {/* 3. Right: Search, Cart, Profile, Store Pill, Language, Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 xl:gap-4 shrink-0 z-10" onMouseEnter={() => scheduleMenuClose(80)}>
            {/* Search Icon */}
            <button
              type="button"
              onClick={() => {
                setActiveMegaMenu(null);
                setMobileMenuOpen(false);
                setIsSearchOpen(true);
              }}
              className="p-1.5 text-neutral-800 hover:text-black transition-colors cursor-pointer"
              title="Search"
              aria-label="Search"
            >
              <Search className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* Cart Icon with badge & Flying Cart Destination */}
            <button
              id="header-cart-btn"
              type="button"
              onClick={() => {
                setActiveMegaMenu(null);
                setMobileMenuOpen(false);
                setIsMiniCartOpen(true);
              }}
              className={`relative p-1.5 text-neutral-800 hover:text-black transition-all duration-300 cursor-pointer ${
                cartBump ? 'scale-135 text-black' : 'scale-100'
              }`}
              title="Cart"
              aria-label="Cart"
            >
              <ShoppingBag
                className={`w-5 h-5 stroke-[1.8] transition-transform duration-300 ${
                  cartBump ? 'scale-125 stroke-[2.2]' : ''
                }`}
              />
              {cartCount > 0 && (
                <span
                  className={`absolute -top-0.5 -end-0.5 bg-black text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                    cartBump
                      ? 'scale-135 bg-emerald-600 shadow-lg ring-2 ring-emerald-300'
                      : 'scale-100'
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Icon */}
            <button
              type="button"
              onClick={() => {
                setActiveMegaMenu(null);
                setMobileMenuOpen(false);
                navigateTo('profile');
              }}
              className="p-1.5 text-neutral-800 hover:text-black transition-colors cursor-pointer"
              title="User Profile"
              aria-label="Account"
            >
              <User className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* Store Pill Button */}
            <button
              type="button"
              onClick={() => {
                setActiveMegaMenu(null);
                setMobileMenuOpen(false);
                navigateTo('products');
              }}
              className="hidden xl:inline-flex items-center justify-center px-4 py-1 rounded-full border border-neutral-300 hover:border-black text-[12px] font-medium text-neutral-800 hover:text-black transition-colors cursor-pointer"
            >
              {language === 'AR' ? 'المتجر' : 'Store'}
            </button>

            {/* Language Switcher (EN | AR) */}
            <div className="flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-full border border-neutral-200/90 bg-neutral-50/80 text-neutral-800 transition-colors shrink-0">
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  language === 'EN'
                    ? 'font-bold text-white bg-black shadow-xs'
                    : 'text-neutral-500 hover:text-black hover:bg-neutral-200/60'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('AR')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  language === 'AR'
                    ? 'font-bold text-white bg-black shadow-xs'
                    : 'text-neutral-500 hover:text-black hover:bg-neutral-200/60'
                }`}
                title="التحويل للغة العربية"
              >
                AR
              </button>
            </div>

            {/* Mobile Menu Hamburger Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMegaMenu(null);
                setMobileMenuOpen((prev) => !prev);
              }}
              className={`lg:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all cursor-pointer shrink-0 ${
                mobileMenuOpen
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
              }`}
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 stroke-[2.2]" /> : <Menu className="w-5 h-5 stroke-[2.2]" />}
            </button>
          </div>
        </div>

        {/* MOBILE QUICK NAVIGATION BAR (Visible on mobile below main header bar) */}
        {currentRoute !== 'product-detail' && currentRoute !== 'product-buy' && (
          <div className="lg:hidden w-full bg-white border-t border-neutral-100 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigateTo('home');
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                currentRoute === 'home' && !mobileMenuOpen
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR' ? 'الرئيسية' : 'Home'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileSubNavKey('machines');
                setMobileSubFilter('latest');
                setMobileMenuOpen(true);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                mobileMenuOpen && mobileSubNavKey === 'machines'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR' ? 'المكائن' : 'Machines'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileSubNavKey('mills');
                setMobileSubFilter('latest');
                setMobileMenuOpen(true);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                mobileMenuOpen && mobileSubNavKey === 'mills'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR' ? 'المطاحن' : 'Mills'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileSubNavKey('cabinets');
                setMobileSubFilter('latest');
                setMobileMenuOpen(true);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                mobileMenuOpen && mobileSubNavKey === 'cabinets'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR' ? 'أركان القهوة' : 'Coffee Bars'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileSubNavKey('accessories');
                setMobileSubFilter('latest');
                setMobileMenuOpen(true);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                mobileMenuOpen && mobileSubNavKey === 'accessories'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR' ? 'الأكواب والمستلزمات' : 'Accessories'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileSubNavKey('offers');
                setMobileSubFilter('latest');
                setMobileMenuOpen(true);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                mobileMenuOpen && mobileSubNavKey === 'offers'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR' ? 'العروض والباقات' : 'Offers'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigateTo('products');
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                currentRoute === 'products' && !mobileMenuOpen
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR' ? 'المتجر' : 'Store'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigateTo('reviews');
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                currentRoute === 'reviews' && !mobileMenuOpen
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR' ? 'التقييمات والدعم' : 'Reviews'}
            </button>
          </div>
        )}

        {/* 3. DESKTOP MEGA MENU DROPDOWN PANEL & BACKDROP (Smooth Slide-In & Slide-Out on Hover & Leave) */}
        {/* Backdrop Overlay: Smooth fade, covers page below header, mouseleave/click closes menu */}
        <div
          className={`hidden lg:block fixed inset-x-0 bottom-0 top-16 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ease-out z-40 ${
            isMegaMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onMouseEnter={() => scheduleMenuClose(50)}
          onClick={closeMenuImmediately}
        />

        {/* Dropdown Panel: Smooth slide down on hover, automatic slide UP on mouse leave */}
        <div
          ref={megaMenuContainerRef}
          className={`hidden lg:block absolute top-full left-0 right-0 w-full bg-white border-b border-neutral-200/80 shadow-[0_20px_45px_rgba(0,0,0,0.10)] z-50 max-h-[calc(100vh-120px)] overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            isMegaMenuOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto visible'
              : 'opacity-0 -translate-y-5 pointer-events-none invisible'
          }`}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          {/* Seamless Hover Bridge: Prevents any hover gap */}
          <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent pointer-events-auto" />

          <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-5 sm:pb-6 flex flex-col items-center">
            {/* IF CUSTOM MADE TO ORDER MENU */}
            {currentMenu === 'custom-order' ? (
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch py-2">
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-start">
                  {/* Col 1 */}
                  <div className="space-y-2.5">
                    <h5 className="font-bold text-[12.5px] text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2">
                      {language === 'AR' ? 'المواد والأخشاب الفاخرة' : 'PREMIUM MATERIALS'}
                    </h5>
                    <div className="flex flex-col space-y-2 text-[13.5px] text-neutral-800">
                      <button
                        onClick={() => { closeMenuImmediately(); navigateTo('product-detail', 'hb-cabinet-solid-oak'); }}
                        className="hover:text-neutral-500 transition-colors text-start"
                      >
                        {language === 'AR' ? 'خشب البلوط والسنديان الطبيعي' : 'Kiln-Dried Solid White Oak'}
                      </button>
                      <button
                        onClick={() => { closeMenuImmediately(); navigateTo('product-detail', 'hb-corner-station-led'); }}
                        className="hover:text-neutral-500 transition-colors text-start"
                      >
                        {language === 'AR' ? 'أسطح البورسلان والرخام الإيطالي' : 'Sintered Stone Countertops'}
                      </button>
                      <button
                        onClick={() => { closeMenuImmediately(); navigateTo('product-detail', 'hb-cabinet-solid-oak'); }}
                        className="hover:text-neutral-500 transition-colors text-start"
                      >
                        {language === 'AR' ? 'خشب الجوز الملكي الطبيعي' : 'Natural American Walnut'}
                      </button>
                    </div>
                  </div>

                  {/* Col 2 */}
                  <div className="space-y-2.5">
                    <h5 className="font-bold text-[12.5px] text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2">
                      {language === 'AR' ? 'المواصفات والتجهيزات' : 'CUSTOM ENGINEERING'}
                    </h5>
                    <div className="flex flex-col space-y-2 text-[13.5px] text-neutral-800">
                      <button
                        onClick={() => { closeMenuImmediately(); navigateTo('product-detail', 'hb-corner-station-led'); }}
                        className="hover:text-neutral-500 transition-colors text-start"
                      >
                        {language === 'AR' ? 'تمديدات مياه وصرف مخفية' : 'Concealed Water & Drain Lines'}
                      </button>
                      <button
                        onClick={() => { closeMenuImmediately(); navigateTo('product-detail', 'hb-corner-station-led'); }}
                        className="hover:text-neutral-500 transition-colors text-start"
                      >
                        {language === 'AR' ? 'مسارات إضاءة LED مدمجة' : 'Integrated LED Rail Lighting'}
                      </button>
                      <button
                        onClick={() => { closeMenuImmediately(); navigateTo('product-detail', 'hb-cabinet-solid-oak'); }}
                        className="hover:text-neutral-500 transition-colors text-start"
                      >
                        {language === 'AR' ? 'منافذ شحن وكهرباء باريستا' : 'Built-in Barista Power Outlets'}
                      </button>
                    </div>
                  </div>

                  {/* Col 3 */}
                  <div className="space-y-2.5">
                    <h5 className="font-bold text-[12.5px] text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2">
                      {language === 'AR' ? 'خدمة التفصيل والتركيب' : 'BESPOKE SERVICE'}
                    </h5>
                    <div className="flex flex-col space-y-2 text-[13.5px] text-neutral-800">
                      <a
                        href="https://wa.me/9668008440443?text=%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%B7%D9%84%D8%A8%20%D8%AA%D9%81%D8%B5%D9%8A%D9%84%20%D8%B1%D9%83%D9%86%20%D9%82%D9%87%D9%88%D8%A9%20%D8%AD%D8%B3%D8%A8%20%D8%A7%D9%84%D8%B7%D9%84%D8%A8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-500 transition-colors text-start inline-flex items-center gap-1.5 text-emerald-600 font-semibold"
                      >
                        {language === 'AR' ? 'طلب تفصيل بمقاساتك (واتساب)' : 'Custom Sizing via WhatsApp'}
                      </a>
                      <button
                        onClick={() => { closeMenuImmediately(); navigateTo('products'); }}
                        className="hover:text-neutral-500 transition-colors text-start"
                      >
                        {language === 'AR' ? 'استعراض جميع أركان القهوة' : 'View All Custom Cabinets'}
                      </button>
                      <button
                        onClick={() => { closeMenuImmediately(); navigateTo('reviews'); }}
                        className="hover:text-neutral-500 transition-colors text-start"
                      >
                        {language === 'AR' ? 'توصيل وتركيب منزلي احترافي' : 'White-Glove KSA Setup'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Hero Showcase */}
                <div
                  className="lg:col-span-4 bg-neutral-900 rounded-[18px] p-5 text-white cursor-pointer flex flex-col justify-between group overflow-hidden border border-neutral-800"
                  onClick={() => {
                    closeMenuImmediately();
                    navigateTo('custom-order');
                  }}
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold bg-white/10 px-2.5 py-0.5 rounded-full inline-block">
                      {language === 'AR' ? 'تصميم وتنفيذ حسب الطلب' : 'Custom Made to Order'}
                    </span>
                    <h4 className="text-[16px] font-bold text-white group-hover:text-amber-300 transition-colors">
                      {language === 'AR' ? 'ركن القهوة المخصص - التخطيط والتصميم والتنفيذ' : 'Custom Tailor-Made Coffee Corner'}
                    </h4>
                    <p className="text-[11.5px] text-neutral-400 line-clamp-2">
                      {language === 'AR'
                        ? 'حدد المقاسات بالسنتيمتر، نوع الخشب، بديل الرخام أو الطبيعي، التقسيم الداخلي والإكسسوارات مع تسعير فوري أو طلب عرض سعر.'
                        : 'Choose custom dimensions in cm, wood type, edge finishing, marble top, division, and add-ons with instant pricing or quote request.'}
                    </p>
                  </div>
                  <div className="pt-3 flex items-center justify-between border-t border-neutral-800 text-xs font-semibold">
                    <span className="text-amber-400 font-mono text-[13px]">
                      {language === 'AR' ? 'يبدأ من 1,490 ر.س' : 'From SAR 1,490'}
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {language === 'AR' ? 'بدء تفصيل الركن الآن' : 'Start Customizing Now'} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* PRODUCTS MEGA MENU */
              <div className="w-full flex flex-col items-center">
                {/* Top Sub-category Tabs (Centered, Pure Text Links, Crisp Spacing) */}
                <div className="flex items-center justify-center gap-5 sm:gap-8 pb-4 sm:pb-5 text-[13px] sm:text-[13.5px] flex-wrap" role="tablist">
                  <button
                    role="tab"
                    aria-selected={activeSubFilter === 'latest'}
                    onClick={() => setActiveSubFilter('latest')}
                    className={`transition-colors cursor-pointer ${
                      activeSubFilter === 'latest'
                        ? 'text-black font-semibold'
                        : 'text-[#666666] hover:text-black font-normal'
                    }`}
                  >
                    {language === 'AR' ? 'أحدث المنتجات' : 'Latest Product'}
                  </button>

                  {currentMenu === 'machines' && (
                    <>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'pro'}
                        onClick={() => setActiveSubFilter('pro')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'pro'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة باريستا برو' : 'HiBrew Barista Pro Series'}
                      </button>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'compact'}
                        onClick={() => setActiveSubFilter('compact')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'compact'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة المكائن المدمجة' : 'HiBrew Compact Series'}
                      </button>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'commercial'}
                        onClick={() => setActiveSubFilter('commercial')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'commercial'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة 58 مم التجارية' : 'HiBrew Commercial 58mm Series'}
                      </button>
                    </>
                  )}

                  {currentMenu === 'mills' && (
                    <>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'conical'}
                        onClick={() => setActiveSubFilter('conical')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'conical'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'مطاحن التروس المخروطية' : 'Conical Burr Series'}
                      </button>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'flat'}
                        onClick={() => setActiveSubFilter('flat')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'flat'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'مطاحن التروس المسطحة' : 'Flat Burr Series'}
                      </button>
                    </>
                  )}

                  {currentMenu === 'cabinets' && (
                    <>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'cabinets'}
                        onClick={() => setActiveSubFilter('cabinets')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'cabinets'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة دواليب القهوة الفاخرة' : 'Artisan Cabinet Series'}
                      </button>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'corners'}
                        onClick={() => setActiveSubFilter('corners')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'corners'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة محطات وأركان الباريستا' : 'Barista Station Series'}
                      </button>
                    </>
                  )}

                  {currentMenu === 'accessories' && (
                    <>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'boltfilters'}
                        onClick={() => setActiveSubFilter('boltfilters')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'boltfilters'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة البورتافلتر 58مم' : 'Boltfilter 58mm Series'}
                      </button>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'cups'}
                        onClick={() => setActiveSubFilter('cups')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'cups'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة الأكواب السيراميك' : 'Ceramic Cup Series'}
                      </button>
                      <button
                        role="tab"
                        aria-selected={activeSubFilter === 'tools'}
                        onClick={() => setActiveSubFilter('tools')}
                        className={`transition-colors cursor-pointer ${
                          activeSubFilter === 'tools'
                            ? 'text-black font-semibold'
                            : 'text-[#666666] hover:text-black font-normal'
                        }`}
                      >
                        {language === 'AR' ? 'سلسلة أدوات الباريستا' : 'Barista Tools Series'}
                      </button>
                    </>
                  )}

                  {currentMenu === 'offers' && (
                    <button
                      role="tab"
                      aria-selected={activeSubFilter === 'bundles'}
                      onClick={() => setActiveSubFilter('bundles')}
                      className={`transition-colors cursor-pointer ${
                        activeSubFilter === 'bundles'
                          ? 'text-black font-semibold'
                          : 'text-[#666666] hover:text-black font-normal'
                      }`}
                    >
                      {language === 'AR' ? 'باقات المحطة المتكاملة' : 'Complete Kit Bundles'}
                    </button>
                  )}
                </div>

                {/* 5 Columns Product Cards Grid (Compact & Sleek Sizing with Bottom Gap) */}
                <div
                  key={`${currentMenu}-${activeSubFilter}`}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 lg:gap-4.5 w-full items-stretch justify-center"
                >
                  {activeProducts.slice(0, 5).map((prod, idx) => {
                    const animClass =
                      idx === 0
                        ? 'animate-honor-card-1'
                        : idx === 1
                        ? 'animate-honor-card-2'
                        : idx === 2
                        ? 'animate-honor-card-3'
                        : idx === 3
                        ? 'animate-honor-card-4'
                        : 'animate-honor-card-5';

                    return (
                      <div
                        key={prod.name}
                        onClick={() => {
                          closeMenuImmediately();
                          navigateTo('product-detail', prod.id);
                        }}
                        className={`bg-[#F7F7F8] hover:bg-[#EFEFF2] rounded-[18px] p-3.5 sm:p-4 flex flex-col items-center justify-between text-center transition-all duration-200 cursor-pointer group shadow-none hover:shadow-2xs min-h-[210px] sm:min-h-[225px] border-none ${animClass}`}
                      >
                        {/* Product Image */}
                        <div className="w-full h-26 sm:h-30 lg:h-32 flex items-center justify-center mb-2 overflow-hidden">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 ease-out"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Details: New Label + Product Title */}
                        <div className="w-full flex flex-col items-center text-center">
                          <span className={`text-[11px] font-medium text-[#0066CC] min-h-[16px] mb-0.5 leading-none text-center ${prod.isNew ? 'opacity-100' : 'opacity-0'}`}>
                            {language === 'AR' ? 'جديد' : 'New'}
                          </span>
                          <h4 className="text-[12.5px] sm:text-[13px] font-normal text-[#111111] leading-snug line-clamp-2 text-center group-hover:text-black transition-colors min-h-[34px] flex items-center justify-center">
                            {language === 'AR' && prod.nameAr ? prod.nameAr : prod.name}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action Pill Buttons */}
                <div className="flex items-center justify-center gap-3.5 mt-5">
                  <button
                    onClick={() => {
                      closeMenuImmediately();
                      navigateTo('products');
                    }}
                    className="flex items-center gap-2 px-6 py-2 rounded-full border border-[#D2D2D7] hover:border-black text-[12.5px] font-normal text-[#111111] bg-white transition-all duration-200 cursor-pointer shadow-none hover:shadow-2xs"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-[#111111]" />
                    <span>{language === 'AR' ? 'عرض المزيد من المنتجات' : 'More Products'}</span>
                  </button>

                  <button
                    onClick={() => {
                      closeMenuImmediately();
                      const el = document.getElementById('machine-story-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else navigateTo('products');
                    }}
                    className="flex items-center gap-2 px-6 py-2 rounded-full border border-[#D2D2D7] hover:border-black text-[12.5px] font-normal text-[#111111] bg-white transition-all duration-200 cursor-pointer shadow-none hover:shadow-2xs"
                  >
                    <Columns className="w-3.5 h-3.5 text-[#111111]" />
                    <span>{language === 'AR' ? 'مقارنة المواصفات' : 'Compare'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. HONOR MOBILE DRILLDOWN SLIDE NAVIGATION */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 w-full h-[calc(100vh-4rem)] max-h-[calc(100dvh-4rem)] bg-white z-[100] border-t border-neutral-200 shadow-[0_25px_50px_rgba(0,0,0,0.22)] overflow-y-auto overscroll-contain text-neutral-800 animate-honor-mega">
            {/* LEVEL 1: Primary Category List */}
            {!mobileSubNavKey ? (
              <div className="p-4 sm:p-6 pb-24 space-y-4">
                {/* Search Bar */}
                <div
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-neutral-100 text-neutral-500 text-xs font-semibold cursor-pointer"
                >
                  <Search className="w-4 h-4 text-neutral-600 shrink-0" />
                  <span>{language === 'AR' ? 'ابحث عن آلة، مطحنة، أو بورتافلتر...' : 'Search machines, mills, boltfilters...'}</span>
                </div>

                {/* Main Drilldown Navigation Items */}
                <div className="space-y-2">
                  {/* 0. Home */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('home');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'الرئيسية' : 'Home'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 1. Machines */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('machines');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'مكائن القهوة' : 'Machines'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 2. Mills */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('mills');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'مطاحن القهوة' : 'Mills'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 3. Cabinets */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('cabinets');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'أركان ودواليب القهوة' : 'Coffee Bars & Cabinets'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 4. Accessories */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('accessories');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'الأكواب والمستلزمات' : 'Accessories & Cups'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 5. HiBrew CHOICE (Offers) */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSubFilter('latest');
                      setMobileSubNavKey('offers');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'عروض وباقات هايبرو' : 'HiBrew CHOICE Offers'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 6. All Products Store */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('products');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'المتجر - جميع المنتجات' : 'Store - All Products'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 7. Custom Made to Order */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('custom-order');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>{language === 'AR' ? 'تفصيل حسب الطلب' : 'Custom Made to Order'}</span>
                      <Palette className="w-3.5 h-3.5 text-amber-600" />
                    </span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 8. Smart AI Tech & Craft */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const el = document.getElementById('machine-story-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else navigateTo('home');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>{language === 'AR' ? 'الذكاء الاصطناعي وهندسة الآلة' : 'AI & Craft Engineering'}</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#2563eb] fill-[#2563eb]/20" />
                    </span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 8. Reviews & Support */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('reviews');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'الدعم والضمان وتجارب العملاء' : 'Support & Customer Reviews'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {/* 9. Account */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('profile');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors font-semibold text-sm text-neutral-900 cursor-pointer"
                  >
                    <span>{user.isLoggedIn ? user.name : language === 'AR' ? 'حسابي / تسجيل الدخول' : 'Account / Login'}</span>
                    {language === 'AR' ? <ChevronLeft className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </button>
                </div>

                {/* Bottom Language & Store */}
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-semibold">
                    {language === 'AR' ? 'اللغة:' : 'Language:'}
                  </span>
                  <button
                    type="button"
                    onClick={toggleLanguage}
                    className="px-4 py-1.5 rounded-full bg-black text-white font-bold text-xs shadow-md active:scale-95 cursor-pointer"
                  >
                    {language === 'AR' ? 'English' : 'العربية'}
                  </button>
                </div>
              </div>
            ) : (
              /* LEVEL 2: Sub-Menu Drilldown */
              <div className={`p-4 sm:p-6 pb-24 space-y-4 ${language === 'AR' ? 'animate-mobile-subnav-rtl' : 'animate-mobile-subnav-ltr'}`}>
                {/* Back Button & Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setMobileSubNavKey(null)}
                    className="flex items-center gap-1 text-sm font-bold text-neutral-900 hover:text-black cursor-pointer"
                  >
                    {language === 'AR' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    <span>{language === 'AR' ? 'رجوع للقائمة' : 'Back'}</span>
                  </button>
                  <h4 className="text-sm font-bold text-neutral-950">
                    {mobileSubNavKey === 'machines'
                      ? language === 'AR' ? 'المكائن' : 'Machines'
                      : mobileSubNavKey === 'mills'
                      ? language === 'AR' ? 'المطاحن' : 'Mills'
                      : mobileSubNavKey === 'cabinets'
                      ? language === 'AR' ? 'الدواليب والأركان' : 'Cabinets & Corners'
                      : mobileSubNavKey === 'accessories'
                      ? language === 'AR' ? 'المستلزمات والأكواب' : 'Accessories & Cups'
                      : language === 'AR' ? 'عروض وباقات هايبرو' : 'HiBrew CHOICE'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                    aria-label="Close Menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-Category Filter Pills on Mobile */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => setMobileSubFilter('latest')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      mobileSubFilter === 'latest' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {language === 'AR' ? 'أحدث المنتجات' : 'Latest'}
                  </button>

                  {mobileSubNavKey === 'machines' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('pro')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'pro' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'باريستا برو' : 'Barista Pro'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('compact')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'compact' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'المكائن المدمجة' : 'Compact'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('commercial')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'commercial' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? '58 مم التجارية' : 'Commercial 58mm'}
                      </button>
                    </>
                  )}

                  {mobileSubNavKey === 'mills' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('conical')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'conical' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'التروس المخروطية' : 'Conical Burr'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('flat')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'flat' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'التروس المسطحة' : 'Flat Burr'}
                      </button>
                    </>
                  )}

                  {mobileSubNavKey === 'cabinets' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('cabinets')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'cabinets' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'دواليب القهوة' : 'Cabinets'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('corners')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'corners' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'أركان الباريستا' : 'Barista Stations'}
                      </button>
                    </>
                  )}

                  {mobileSubNavKey === 'accessories' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('boltfilters')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'boltfilters' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'البورتافلتر 58مم' : 'Boltfilters 58mm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('cups')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'cups' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'الأكواب السيراميك' : 'Ceramic Cups'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSubFilter('tools')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                          mobileSubFilter === 'tools' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {language === 'AR' ? 'أدوات الباريستا' : 'Barista Tools'}
                      </button>
                    </>
                  )}

                  {mobileSubNavKey === 'offers' && (
                    <button
                      type="button"
                      onClick={() => setMobileSubFilter('bundles')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                        mobileSubFilter === 'bundles' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {language === 'AR' ? 'باقات المحطة المتكاملة' : 'Complete Bundles'}
                    </button>
                  )}
                </div>

                {/* Product Grid in Mobile Drilldown */}
                <div className="grid grid-cols-2 gap-3">
                  {(MEGA_CATALOG[mobileSubNavKey || 'machines']?.[mobileSubFilter] || MEGA_CATALOG[mobileSubNavKey || 'machines']?.latest || []).map(prod => (
                    <div
                      key={prod.name}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigateTo('product-detail', prod.id);
                      }}
                      className="bg-[#F7F7F8] active:bg-[#EFEFF2] rounded-[16px] p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-2xs"
                    >
                      <div className="w-full h-24 flex items-center justify-center mb-2 bg-white rounded-lg p-1 border border-neutral-100/60">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className={`text-[10px] font-medium text-[#0066CC] min-h-[15px] ${prod.isNew ? 'opacity-100' : 'opacity-0'}`}>
                        {language === 'AR' ? 'جديد' : 'New'}
                      </span>
                      <h5 className="text-xs font-medium text-neutral-900 line-clamp-2 mt-0.5 leading-snug">
                        {language === 'AR' && prod.nameAr ? prod.nameAr : prod.name}
                      </h5>
                    </div>
                  ))}
                </div>

                {/* Action: View All */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('products');
                    }}
                    className="w-full py-3 bg-black text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{language === 'AR' ? 'عرض المزيد من المنتجات' : 'More Products'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 5. BACKDROP OVERLAY (Strictly positioned UNDER Header & Mega Menu so no darkening over navbar!) */}
      <div
        className={`fixed inset-0 top-16 bg-black/25 backdrop-blur-[1px] transition-opacity duration-300 ease-out z-40 ${
          activeMegaMenu || mobileMenuOpen
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
        }`}
        onClick={() => {
          setActiveMegaMenu(null);
          setMobileMenuOpen(false);
        }}
      />
    </>
  );
};

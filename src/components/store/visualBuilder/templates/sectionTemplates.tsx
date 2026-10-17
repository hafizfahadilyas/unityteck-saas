import React from 'react';

export interface SectionTemplate {
  key: string;
  nameEn: string;
  nameAr: string;
  badge: string;
  descEn: string;
  descAr: string;
  previewSvg: React.ReactNode;
  presetSettings?: Record<string, any>;
}

export function getTemplatesForSection(blockType: string, isAr: boolean): SectionTemplate[] {
  switch (blockType) {
    // 1. NAVBAR / HEADER
    case 'header':
    case 'navbar':
      return [
        {
          key: 'header-luxury-emerald',
          nameEn: 'Royal Emerald & Gold Center',
          nameAr: 'الزمردي الملكي والشعار الذهبي الأوسط',
          badge: 'Royal Luxe',
          descEn: 'Centered gold crest logo with search, currency, cart and quick call actions',
          descAr: 'شعار ذهبي ملكي في المنتصف مع شريط البحث والعملة وسلة المشتريات',
          presetSettings: {
            bgColor: '#102a1c',
            textColor: '#FAF9F5',
            accentColor: '#e6ca98',
            layout: 'center_logo',
            stickyHeader: true,
            glassmorphism: false,
          },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-1.5 flex flex-col justify-between border border-[#e6ca98]/40 shadow-xs">
              <div className="flex justify-between items-center text-[8px] text-[#e6ca98] border-b border-[#e6ca98]/20 pb-0.5">
                <span className="w-8 h-1.5 bg-[#e6ca98]/60 rounded-xs" />
                <span className="w-12 h-1.5 bg-[#e6ca98]/40 rounded-xs" />
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-full bg-[#163826] border border-[#e6ca98]/40" />
                  <div className="w-4 h-4 rounded-full bg-[#163826] border border-[#e6ca98]/40" />
                </div>
                <div className="h-4 px-3 bg-[#e6ca98] text-[#102a1c] font-black text-[7px] flex items-center justify-center rounded-xs shadow-xs">
                  MECCA GIFTS
                </div>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-full bg-[#e6ca98]/20 border border-[#e6ca98]/50" />
                  <div className="w-4 h-4 rounded-full bg-[#e6ca98] text-[#102a1c] flex items-center justify-center text-[7px] font-bold">🛒</div>
                </div>
              </div>
            </div>
          ),
        },
        {
          key: 'header-minimal-clean',
          nameEn: 'Modern Minimalist Sleek',
          nameAr: 'العصري الأنيق البسيط',
          badge: 'Minimal',
          descEn: 'Clean white background with slim dark typography and rapid search bar',
          descAr: 'خلفية بيضاء نقية مع خطوط واضحة وتصميم عصري فائق الخفة',
          presetSettings: {
            bgColor: '#FFFFFF',
            textColor: '#0f172a',
            accentColor: '#4f46e5',
            layout: 'minimal',
            stickyHeader: true,
            glassmorphism: false,
          },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex flex-col justify-between border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 bg-slate-900 rounded-xs" />
                <div className="flex gap-1.5">
                  <div className="h-2 w-8 bg-slate-300 rounded-xs" />
                  <div className="h-2 w-8 bg-slate-300 rounded-xs" />
                  <div className="h-2 w-8 bg-slate-300 rounded-xs" />
                </div>
                <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-200" />
              </div>
              <div className="h-3.5 bg-slate-100 rounded-md border border-slate-200 flex items-center px-2">
                <span className="w-12 h-1 bg-slate-300 rounded-xs" />
              </div>
            </div>
          ),
        },
        {
          key: 'header-glassmorphic',
          nameEn: 'Floating Glassmorphism Blur',
          nameAr: 'الزجاجي العائم الشفاف (Glass UI)',
          badge: 'Glassmorphism',
          descEn: 'Translucent floating header with frosted backdrop and floating pill menu',
          descAr: 'تصميم زجاجي فاخر مع خلفية ضبابية شفافة وقوائم عائمة',
          presetSettings: {
            bgColor: 'rgba(255,255,255,0.85)',
            textColor: '#1e293b',
            accentColor: '#10b981',
            layout: 'glass',
            stickyHeader: true,
            glassmorphism: true,
          },
          previewSvg: (
            <div className="w-full h-14 bg-gradient-to-r from-emerald-800/80 to-teal-900/80 rounded-lg p-1.5 flex items-center justify-center border border-emerald-400/40 shadow-xs">
              <div className="w-full h-9 bg-white/20 backdrop-blur-md rounded-xl p-1.5 flex items-center justify-between border border-white/40">
                <div className="h-2.5 w-12 bg-white/90 rounded-xs" />
                <div className="flex gap-1 bg-black/20 px-2 py-0.5 rounded-full">
                  <div className="h-1.5 w-5 bg-white/80 rounded-xs" />
                  <div className="h-1.5 w-5 bg-white/80 rounded-xs" />
                </div>
                <div className="w-4 h-4 rounded-full bg-white text-emerald-950 text-[8px] flex items-center justify-center font-bold">
                  ★
                </div>
              </div>
            </div>
          ),
        },
        {
          key: 'header-dark-noir',
          nameEn: 'Midnight Black & Gold Accent',
          nameAr: 'الأسود الملكي والذهب النقي',
          badge: 'Dark Noir',
          descEn: 'Dark OLED black aesthetic with polished gold typography and VIP badges',
          descAr: 'تصميم داكن شديد الفخامة مع لمسات ذهبية براقة وأيقونات مميزة',
          presetSettings: {
            bgColor: '#09090b',
            textColor: '#FAF9F5',
            accentColor: '#eab308',
            layout: 'center_logo',
            stickyHeader: true,
            glassmorphism: false,
          },
          previewSvg: (
            <div className="w-full h-14 bg-zinc-950 rounded-lg p-1.5 flex flex-col justify-between border border-yellow-500/30">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-14 bg-yellow-500 rounded-xs" />
                <div className="flex gap-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-zinc-800 border border-yellow-500/50" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 text-black text-[7px] flex items-center justify-center font-bold">
                    🛍
                  </div>
                </div>
              </div>
              <div className="flex gap-1 justify-center">
                <div className="h-1.5 w-6 bg-zinc-700 rounded-xs" />
                <div className="h-1.5 w-6 bg-zinc-700 rounded-xs" />
                <div className="h-1.5 w-6 bg-yellow-500/80 rounded-xs" />
              </div>
            </div>
          ),
        },
      ];

    // 2. HERO SLIDER
    case 'hero_slider':
    case 'hero':
      return [
        {
          key: 'hero-luxury-gold',
          nameEn: '3D Gold Floating Luxury Hero',
          nameAr: 'الهيرو الملكي ثلاثي الأبعاد والذهب',
          badge: '3D Floating',
          descEn: 'Dynamic 3D perspective hero with gold accents, glowing CTA, and quick features',
          descAr: 'بانر رئيسي تفاعلي مع بطاقات عائمة وتأثيرات ضوئية وأزرار دعوة للشراء',
          presetSettings: {
            titleFontSize: 38,
            bgStyle: 'emerald_gradient',
            showCountdown: true,
            ctaStyle: 'gold_glow',
          },
          previewSvg: (
            <div className="w-full h-14 bg-gradient-to-br from-[#102a1c] to-[#08170f] rounded-lg p-1.5 flex items-center justify-between border border-[#e6ca98]/40 shadow-xs">
              <div className="space-y-1 max-w-[60%]">
                <div className="h-1.5 w-8 bg-[#e6ca98] rounded-xs" />
                <div className="h-2.5 w-24 bg-white rounded-xs" />
                <div className="h-1.5 w-16 bg-[#e6ca98]/80 rounded-xs" />
                <div className="h-3.5 w-12 bg-[#e6ca98] rounded-xs mt-1" />
              </div>
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-[#e6ca98]/40 flex items-center justify-center shadow-md">
                <span className="text-xs">🌸</span>
              </div>
            </div>
          ),
        },
        {
          key: 'hero-split-asymmetric',
          nameEn: 'Split Dual Highlight Hero',
          nameAr: 'الهيرو المزدوج المنقسم (Dual Promo)',
          badge: 'Split View',
          descEn: 'Left feature showcase with right promotional dual card stack',
          descAr: 'عرض منقسم: البانر الرئيسي على اليمين مع كرتين ترويجيين على اليسار',
          presetSettings: {
            layoutColumns: '2-asym-left',
            bgStyle: 'split_clean',
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-100 rounded-lg p-1.5 flex gap-1 border border-slate-200">
              <div className="flex-2 bg-[#102a1c] rounded-md p-1 flex flex-col justify-between">
                <div className="h-1.5 w-10 bg-[#e6ca98] rounded-xs" />
                <div className="h-2 w-16 bg-white rounded-xs" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex-1 bg-amber-100 rounded-xs border border-amber-200" />
                <div className="flex-1 bg-emerald-100 rounded-xs border border-emerald-200" />
              </div>
            </div>
          ),
        },
        {
          key: 'hero-minimal-cinema',
          nameEn: 'Cinematic Full-Bleed Video Hero',
          nameAr: 'الفيديو السينمائي البانورامي العريض',
          badge: 'Cinema Video',
          descEn: 'Edge-to-edge video or ultra high-res background with centered overlay typography',
          descAr: 'عرض سينمائي يملأ الشاشة مع نصوص مركزية وأزرار تشغيل تفاعلية',
          presetSettings: {
            bgStyle: 'cinema_fullbleed',
            overlayDarkness: 0.6,
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-900 rounded-lg p-1.5 flex flex-col items-center justify-center text-center border border-slate-700">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[8px] text-white mb-1">
                ▶
              </div>
              <div className="h-2 w-20 bg-white rounded-xs" />
              <div className="h-1 w-12 bg-white/60 rounded-xs mt-0.5" />
            </div>
          ),
        },
      ];

    // 3. ANNOUNCEMENT BAR & MARQUEE
    case 'announcement':
    case 'marquee_banner':
      return [
        {
          key: 'marquee-luxury-gold',
          nameEn: 'Infinite Running Gold Ticker',
          nameAr: 'الشريط المتحرك بالذهب اللامع',
          badge: 'Gold Marquee',
          descEn: 'Smooth infinite ticker with delivery tags, trust guarantees, and animated stars',
          descAr: 'شريط ترويجي متحرك بسلاسة مع نجوم وشارات التوصيل السريع وضمان الورد الطازج',
          presetSettings: {
            bgColor: '#102a1c',
            textColor: '#e6ca98',
            speed: 'normal',
          },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-2 flex items-center justify-between border border-[#e6ca98]/40 overflow-hidden">
              <div className="flex items-center gap-2 whitespace-nowrap text-[8px] text-[#e6ca98] font-bold">
                <span>✦ توصيل ساعتين</span>
                <span className="text-white">•</span>
                <span>ورد هولندي طازج</span>
                <span className="text-white">•</span>
                <span>دفع عند الاستلام</span>
              </div>
            </div>
          ),
        },
        {
          key: 'announcement-flash-urgent',
          nameEn: 'Flash Urgency Crimson Ribbon',
          nameAr: 'الشريط الأحمر التحفيزي للخصم الفوري',
          badge: 'Urgent Promo',
          descEn: 'High conversion alert bar with flashing beacon and coupon copy button',
          descAr: 'شريط ترويجي أحمر ينبه إلى العروض المحدودة مع زر نسخ الكوبون الفوري',
          presetSettings: {
            bgColor: '#991b1b',
            textColor: '#ffffff',
            showButton: true,
          },
          previewSvg: (
            <div className="w-full h-14 bg-red-800 rounded-lg p-1.5 flex items-center justify-between border border-red-500 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                <span className="text-[8px] text-white font-bold">خصم ٢٠٪ كود: MAKKAH</span>
              </div>
              <div className="h-4 px-2 bg-white text-red-900 font-black text-[7px] flex items-center rounded-xs">
                انسخ الكود
              </div>
            </div>
          ),
        },
      ];

    // 4. CIRCLE CATEGORIES
    case 'circle_categories':
      return [
        {
          key: 'circle-gold-glow',
          nameEn: '3D Gold Glow Circular Avatars',
          nameAr: 'الدوائر المتوهجة بالإطار الذهبي الملكي',
          badge: '3D Glow',
          descEn: 'Three non-duplicate category circular cards with gold pulsing ring on hover',
          descAr: 'أقسام دائرية فاخرة غير مكررة مع إطار ذهبي متوهج وظلال ثلاثية الأبعاد',
          presetSettings: {
            avatarShape: 'circle',
            borderGlow: true,
            showCountBadge: true,
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-900 rounded-lg p-1.5 flex items-center justify-around border border-[#e6ca98]/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#102a1c] to-[#e6ca98] p-0.5 shadow-md">
                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-[8px]">
                      🌹
                    </div>
                  </div>
                  <div className="h-1 w-6 bg-[#e6ca98] rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
        {
          key: 'circle-minimal-pills',
          nameEn: 'Modern Floating Category Pills',
          nameAr: 'كبسولات التصنيفات العصرية العائمة',
          badge: 'Pills Row',
          descEn: 'Horizontal scrollable pills with round icons and sleek active state badges',
          descAr: 'كبسولات أفقية أنيقة مع أيقونات مصغرة وتأثير نشط واضح',
          presetSettings: {
            avatarShape: 'pill',
            borderGlow: false,
          },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex items-center justify-around border border-slate-200">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 px-2.5 bg-slate-100 rounded-full flex items-center gap-1 border border-slate-200">
                  <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[6px]">★</div>
                  <div className="h-1.5 w-6 bg-slate-700 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 5. PRODUCT SECTION: NATURAL BOUQUETS
    case 'product_section_natural':
      return [
        {
          key: 'prod-natural-royal-4col',
          nameEn: 'Royal 4-Column Rose Bouquets',
          nameAr: 'شبكة ٤ أعمدة لباقات الجوري الطبيعي',
          badge: 'Royal 4-Col',
          descEn: 'Four elegant product cards with fresh Dutch rose badge, price tag, and 1-click cart',
          descAr: 'عرض متناسق من ٤ أعمدة بلمسات زمردية وشارة الورد الطبيعي وزر شراء فوري',
          presetSettings: { columns: 4, layout: 'slider', limit: 8, cardRadius: 16, cardStyle: 'natural_emerald' },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex gap-1 border border-slate-200 shadow-xs">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 bg-emerald-50/50 rounded-md border border-emerald-200/60 p-1 flex flex-col justify-between">
                  <div className="h-5 bg-emerald-100 rounded-xs flex items-center justify-center text-[7px]">🌹</div>
                  <div className="h-1 w-full bg-slate-700 rounded-xs" />
                  <div className="flex justify-between items-center">
                    <div className="h-1.5 w-4 bg-emerald-700 rounded-xs" />
                    <div className="w-2.5 h-2.5 rounded-xs bg-[#102a1c]" />
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: 'prod-natural-bento',
          nameEn: 'Bento Spotlight Grand Bouquet',
          nameAr: 'شبكة بينتو مع باقة رئيسية ملكية عملاقة',
          badge: 'Bento Hero',
          descEn: 'Hero bouquet on the left with smaller supporting rose selections on the right',
          descAr: 'عرض باقة عروس رئيسية فاخرة باليسار مع باقات مرافقة بتصميم بينتو',
          presetSettings: { layoutColumns: 'bento', limit: 6, cardStyle: 'bento_hero' },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex gap-1.5 border border-slate-200">
              <div className="flex-2 bg-[#102a1c] rounded-md p-1 flex flex-col justify-between border border-[#e6ca98]/40">
                <div className="h-1.5 w-12 bg-[#e6ca98] rounded-xs" />
                <div className="h-4 bg-white/10 rounded-xs flex items-center justify-center text-[8px]">💐</div>
                <div className="h-1.5 w-8 bg-white/80 rounded-xs" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex-1 bg-emerald-50 rounded-xs border border-emerald-200 p-0.5 flex items-center justify-center text-[6px]">🌸</div>
                <div className="flex-1 bg-emerald-50 rounded-xs border border-emerald-200 p-0.5 flex items-center justify-center text-[6px]">🌺</div>
              </div>
            </div>
          ),
        },
        {
          key: 'prod-natural-5col-density',
          nameEn: '5-Column High-Density Floral Grid',
          nameAr: 'شبكة الـ ٥ أعمدة للمبيعات العالية والسريعة',
          badge: 'High Conversion',
          descEn: 'Compact grid showing 5 fresh flower arrangements per row with quick add',
          descAr: 'تخطيط خفيف وسريع يعرض ٥ باقات في الصف لزيادة خيارات العميل',
          presetSettings: { columns: 5, layout: 'grid', limit: 10 },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-1 flex gap-0.5 border border-slate-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-1 bg-white rounded-xs border border-slate-200 p-0.5 flex flex-col justify-between">
                  <div className="h-4 bg-emerald-100 rounded-xs flex items-center justify-center text-[6px]">🌸</div>
                  <div className="h-1 w-full bg-slate-400 rounded-xs" />
                  <div className="h-1 w-2/3 bg-emerald-600 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 6. PRODUCT SECTION: LUXURY GIFTS
    case 'product_section_luxury':
      return [
        {
          key: 'prod-lux-velvet-gold',
          nameEn: 'Midnight Velvet & Gold Tier',
          nameAr: 'المخمل الملكي الأسود والذهب النقي',
          badge: 'VIP Velvet',
          descEn: 'Deep dark card backgrounds with gold trims, perfume bottle tag, and VIP ribbon',
          descAr: 'بطاقات مخملية داكنة مع لمسات ذهبية مخصصة لأطقم الساعات والعطور الفاخرة',
          presetSettings: { bgColor: '#0a0f0d', columns: 3, cardStyle: 'velvet_gold', limit: 6 },
          previewSvg: (
            <div className="w-full h-14 bg-[#0a0f0d] rounded-lg p-1.5 flex gap-1 border border-[#e6ca98]/50 shadow-xs">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 bg-[#121c17] rounded-md border border-[#e6ca98]/30 p-1 flex flex-col justify-between">
                  <div className="h-4 bg-[#e6ca98]/10 rounded-xs flex items-center justify-center text-[7px]">👑</div>
                  <div className="h-1 w-full bg-[#e6ca98] rounded-xs" />
                  <div className="h-1.5 w-1/2 bg-white/80 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
        {
          key: 'prod-lux-dual-highlight',
          nameEn: 'Dual Executive Showcase',
          nameAr: 'العرض التنفيذي المزدوج لأطقم كبار الشخصيات',
          badge: 'Executive',
          descEn: 'Two grand showcase cards for high-ticket men and women gift sets',
          descAr: 'عرض كرتين عملاقين لأطقم الهدايا الفخمة مع تفاصيل المحتويات وزر الطلب المباشر',
          presetSettings: { columns: 2, layout: 'grid', limit: 4 },
          previewSvg: (
            <div className="w-full h-14 bg-slate-900 rounded-lg p-1.5 flex gap-1.5 border border-amber-500/40">
              <div className="flex-1 bg-white/10 rounded-md p-1 flex flex-col justify-between border border-amber-400/30">
                <div className="h-1.5 w-10 bg-amber-400 rounded-xs" />
                <div className="h-3 bg-white/10 rounded-xs flex items-center justify-center text-[7px]">⌚ طقم رجالي</div>
                <div className="h-1.5 w-6 bg-white rounded-xs" />
              </div>
              <div className="flex-1 bg-white/10 rounded-md p-1 flex flex-col justify-between border border-amber-400/30">
                <div className="h-1.5 w-10 bg-amber-400 rounded-xs" />
                <div className="h-3 bg-white/10 rounded-xs flex items-center justify-center text-[7px]">💍 طقم نسائي</div>
                <div className="h-1.5 w-6 bg-white rounded-xs" />
              </div>
            </div>
          ),
        },
      ];

    // 7. PRODUCT SECTION: CHOCOLATE
    case 'product_section_chocolate':
      return [
        {
          key: 'prod-choco-patchi-gold',
          nameEn: 'Belgian Chocolate & Patchi Carousel',
          nameAr: 'سلايدر الشوكولاتة البلجيكية وباتشي الذهبي',
          badge: 'Patchi Luxe',
          descEn: 'Warm cocoa card aesthetic with gold ribbons and chocolate box badges',
          descAr: 'سلايدر دافئ بلون الكاكاو والذهب لعرض بوكسات باتشي وبستاني الفاخرة',
          presetSettings: { columns: 4, layout: 'slider', cardStyle: 'cocoa_gold', limit: 8 },
          previewSvg: (
            <div className="w-full h-14 bg-[#2b170c] rounded-lg p-1.5 flex gap-1 border border-amber-600/40 shadow-xs">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 bg-[#3d2111] rounded-md border border-amber-500/30 p-1 flex flex-col justify-between">
                  <div className="h-4 bg-amber-900/40 rounded-xs flex items-center justify-center text-[7px]">🍫</div>
                  <div className="h-1 w-full bg-amber-300 rounded-xs" />
                  <div className="h-1.5 w-2/3 bg-white/80 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 8. PRODUCT SECTION: CAKE
    case 'product_section_cake':
      return [
        {
          key: 'prod-cake-korean-celebration',
          nameEn: 'Korean Lunchbox & Celebration Cake Grid',
          nameAr: 'شبكة الكيك الكوري وكيك المناسبات الفاخر',
          badge: 'Artisan Cakes',
          descEn: 'Soft pastel celebration cards with candle icons and custom message box tag',
          descAr: 'تصميم باستيل ناعم مع شارة كتابة العبارة الخاصة وتنسيقات كيك التخرج والأعياد',
          presetSettings: { columns: 4, layout: 'slider', cardStyle: 'pastel_cake', limit: 8 },
          previewSvg: (
            <div className="w-full h-14 bg-rose-50/70 rounded-lg p-1.5 flex gap-1 border border-rose-200 shadow-xs">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 bg-white rounded-md border border-rose-200 p-1 flex flex-col justify-between">
                  <div className="h-4 bg-rose-100 rounded-xs flex items-center justify-center text-[7px]">🎂</div>
                  <div className="h-1 w-full bg-rose-900 rounded-xs" />
                  <div className="h-1.5 w-1/2 bg-rose-600 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 9. PRODUCT SECTION: COFFEE & SWEETS
    case 'product_section_coffee':
      return [
        {
          key: 'prod-coffee-hijazi-dallah',
          nameEn: 'Arabic Dallah & Hijazi Hospitality',
          nameAr: 'الدلة الحجازية والضيافة المكية الأصيلة',
          badge: 'Hijazi Heritage',
          descEn: 'Traditional heritage cards showcasing Arabic coffee flasks, stuffed dates and blooms',
          descAr: 'تصميم تراثي حجازي لعرض دلال القهوة العربية والتمور المحشوة والحلويات',
          presetSettings: { columns: 3, layout: 'slider', cardStyle: 'hijazi_coffee', limit: 6 },
          previewSvg: (
            <div className="w-full h-14 bg-[#1e150f] rounded-lg p-1.5 flex gap-1 border border-amber-700/40 shadow-xs">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 bg-[#2e2017] rounded-md border border-amber-600/30 p-1 flex flex-col justify-between">
                  <div className="h-4 bg-amber-950/60 rounded-xs flex items-center justify-center text-[7px]">☕</div>
                  <div className="h-1 w-full bg-[#e6ca98] rounded-xs" />
                  <div className="h-1.5 w-1/2 bg-white/70 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 10. PRODUCT SECTION: VASES
    case 'product_section_vases':
      return [
        {
          key: 'prod-vases-crystal-gallery',
          nameEn: 'Handcrafted Crystal & Ceramic Vases',
          nameAr: 'معرض الفازات الكريستالية والسيراميك',
          badge: 'Crystal Vases',
          descEn: 'High-contrast gallery highlighting fluted ceramic and crystal vase dimensions',
          descAr: 'عرض تفصيلي للفازات الكريستالية والسيراميك مع مقاسات وتنسيقات المجالس',
          presetSettings: { columns: 4, layout: 'grid', cardStyle: 'crystal_vases', limit: 8 },
          previewSvg: (
            <div className="w-full h-14 bg-slate-900 rounded-lg p-1.5 flex gap-1 border border-cyan-500/30">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 bg-slate-800 rounded-md border border-cyan-500/20 p-1 flex flex-col justify-between">
                  <div className="h-4 bg-cyan-950 rounded-xs flex items-center justify-center text-[7px]">🏺</div>
                  <div className="h-1 w-full bg-cyan-300 rounded-xs" />
                  <div className="h-1.5 w-1/2 bg-white/70 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 11. PRODUCT SECTION: MAWAJEEB & HERITAGE
    case 'product_section_mawajeeb':
      return [
        {
          key: 'prod-mawajeeb-oud-plaque',
          nameEn: 'Maroki Oud & Wooden Heritage Plaque',
          nameAr: 'لوحات المواجيب الخشبية وبخور المروكي',
          badge: 'Mawajeeb Wooden',
          descEn: 'Hand-carved wooden plaque displays paired with authentic Maroki oud incense and blooms',
          descAr: 'عرض فاخر للوحات المواجيب المنقوشة مع رقائق العود المروكي والزهور النضرة',
          presetSettings: { columns: 3, layout: 'slider', cardStyle: 'mawajeeb_wood', limit: 6 },
          previewSvg: (
            <div className="w-full h-14 bg-[#1a120b] rounded-lg p-1.5 flex gap-1 border border-yellow-700/40">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 bg-[#281c12] rounded-md border border-yellow-600/30 p-1 flex flex-col justify-between">
                  <div className="h-4 bg-yellow-950 rounded-xs flex items-center justify-center text-[7px]">🪵</div>
                  <div className="h-1 w-full bg-yellow-400 rounded-xs" />
                  <div className="h-1.5 w-1/2 bg-white/70 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 12. 3D DISCOUNTED BOUQUETS GALLERY
    case 'discounted_bouquets_3d':
      return [
        {
          key: 'discount-3d-perspective-stack',
          nameEn: '3D Perspective Stack & Coverflow',
          nameAr: 'معرض البطاقات المائلة ثلاثية الأبعاد 3D',
          badge: '3D Coverflow',
          descEn: 'Interactive 3D card tilt with instant buy modal and discount percentages',
          descAr: 'بطاقات مائلة ثلاثية الأبعاد تفاعلية مع نسب الخصم وزر الطلب الفوري السريع',
          presetSettings: { columns: 4, layout: 'slider', limit: 6, cardStyle: '3d_tilt' },
          previewSvg: (
            <div className="w-full h-14 bg-gradient-to-r from-emerald-950 to-teal-950 rounded-lg p-1.5 flex items-center justify-center gap-1.5 border border-[#e6ca98]/40">
              <div className="w-8 h-10 bg-white/20 rounded-md border border-white/30 transform -rotate-6 shadow-md" />
              <div className="w-10 h-11 bg-white rounded-md p-1 flex flex-col justify-between transform scale-105 shadow-xl border border-[#e6ca98]">
                <div className="h-5 bg-emerald-100 rounded-xs flex items-center justify-center text-[6px]">💐</div>
                <div className="h-1 w-full bg-slate-800 rounded-xs" />
                <div className="h-2 w-full bg-[#102a1c] rounded-xs" />
              </div>
              <div className="w-8 h-10 bg-white/20 rounded-md border border-white/30 transform rotate-6 shadow-md" />
            </div>
          ),
        },
      ];

    // 13. DYNAMIC PRODUCT ROW / SHORTCODE / PRODUCT TABS
    case 'dynamic_product_row':
    case 'shortcode_widget':
    case 'product_tabs':
      return [
        {
          key: 'dynamic-row-slider',
          nameEn: 'Dynamic Filterable Category Carousel',
          nameAr: 'سلايدر ديناميكي مخصص حسب التصنيف والبراند',
          badge: 'Filterable Slider',
          descEn: 'Elementor-style row with real-time category, brand or collection filter',
          descAr: 'تحكم فوري: اختر التصنيف، عدد المنتجات، وطريقة العرض المتناسقة',
          presetSettings: { columns: 4, layout: 'slider', limit: 8 },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex gap-1 border border-slate-200">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 bg-indigo-50/40 rounded-md border border-indigo-200 p-1 flex flex-col justify-between">
                  <div className="h-4 bg-indigo-100 rounded-xs flex items-center justify-center text-[6px]">🛒</div>
                  <div className="h-1 w-full bg-indigo-900 rounded-xs" />
                  <div className="h-1.5 w-1/2 bg-indigo-600 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
        {
          key: 'dynamic-row-mega-6col',
          nameEn: '6-Column Mega Catalog Grid',
          nameAr: 'شبكة الـ ٦ أعمدة الشاملة للكتالوج',
          badge: '6 Columns',
          descEn: 'Ultra-wide catalog grid presenting full assortment with instant quick view',
          descAr: 'عرض بانورامي من ٦ أعمدة لعرض كامل التشكيلات وتسهيل التصفح السريع',
          presetSettings: { columns: 6, layout: 'grid', limit: 12 },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1 flex gap-0.5 border border-slate-200">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-1 bg-slate-50 rounded-xs border border-slate-200 p-0.5 flex flex-col justify-between">
                  <div className="h-4 bg-emerald-50 rounded-xs" />
                  <div className="h-1 w-full bg-slate-400 rounded-xs" />
                  <div className="h-1 w-1/2 bg-indigo-600 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 14. HEADING WIDGET
    case 'heading':
    case 'w_heading':
      return [
        {
          key: 'heading-luxury-gold',
          nameEn: 'Royal Gold Centered Crest Heading',
          nameAr: 'العنوان الملكي المذهب في المنتصف',
          badge: 'Royal Heading',
          descEn: 'Centered gold luxury title with crown emblem, subtitle, and decorative flourishes',
          descAr: 'عنوان رئيسي في المنتصف بلمسات ذهبية ملكية وشعار مصغر وأسطر متناسقة',
          presetSettings: {
            titleFontSize: 32,
            textColor: '#102a1c',
            accentColor: '#e6ca98',
            textAlign: 'center',
            showCrown: true,
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center text-center border border-[#e6ca98]/40">
              <span className="text-[7px] text-[#e6ca98] font-serif">✦ MECCA LUXURY ✦</span>
              <div className="h-3 w-32 bg-[#102a1c] rounded-xs mt-0.5" />
              <div className="h-1.5 w-20 bg-slate-400 rounded-xs mt-1" />
            </div>
          ),
        },
        {
          key: 'heading-left-accent-bar',
          nameEn: 'Left Accent Gradient Bar',
          nameAr: 'العنوان العصري مع شريط التمييز الجانبي',
          badge: 'Modern Bar',
          descEn: 'Modern left-aligned heading with colored gradient side accent bar',
          descAr: 'عنوان عصري محاذى مع شريط لوني جانبي يعكس هوية المتجر',
          presetSettings: {
            titleFontSize: 28,
            textColor: '#0f172a',
            accentColor: '#4f46e5',
            textAlign: 'start',
            showAccentBar: true,
          },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-2.5 flex items-center gap-2 border border-slate-200">
              <div className="w-1 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full" />
              <div className="space-y-1">
                <div className="h-2.5 w-28 bg-slate-900 rounded-xs" />
                <div className="h-1.5 w-16 bg-slate-400 rounded-xs" />
              </div>
            </div>
          ),
        },
      ];

    // 15. TEXT EDITOR WIDGET
    case 'text_editor':
    case 'w_text':
      return [
        {
          key: 'text-editorial-journal',
          nameEn: 'Editorial Journal Two-Column Text',
          nameAr: 'نصوص مقال المجلة بعمودين متناسقين',
          badge: 'Editorial',
          descEn: 'Two-column balanced typography with drop cap and comfortable line spacing',
          descAr: 'تنسيق نصوص احترافي من عمودين مع مساحات مريحة للقراءة',
          presetSettings: {
            columns: 2,
            fontSize: 15,
            lineHeight: 1.7,
            textColor: '#334155',
          },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-2 flex gap-2 border border-slate-200">
              <div className="flex-1 space-y-1">
                <div className="h-1.5 w-full bg-slate-800 rounded-xs" />
                <div className="h-1.5 w-full bg-slate-400 rounded-xs" />
                <div className="h-1.5 w-3/4 bg-slate-400 rounded-xs" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="h-1.5 w-full bg-slate-400 rounded-xs" />
                <div className="h-1.5 w-full bg-slate-400 rounded-xs" />
                <div className="h-1.5 w-2/3 bg-slate-400 rounded-xs" />
              </div>
            </div>
          ),
        },
        {
          key: 'text-callout-luxury-box',
          nameEn: 'Gold Bordered Callout Box',
          nameAr: 'مربع الاقتباس الفاخر بإطار ذهبي',
          badge: 'Callout Box',
          descEn: 'Highlighted message callout box with emerald background and gold quotation mark',
          descAr: 'صندوق نصي بارز مع خلفية زمردية مخصصة للعبارات والرسائل الترحيبية',
          presetSettings: {
            bgColor: '#102a1c',
            textColor: '#FAF9F5',
            accentColor: '#e6ca98',
            boxStyle: 'callout',
          },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-2 flex items-center gap-2 border border-[#e6ca98]/40">
              <span className="text-[#e6ca98] text-lg font-serif">“</span>
              <div className="space-y-1 flex-1">
                <div className="h-2 w-3/4 bg-white rounded-xs" />
                <div className="h-1.5 w-1/2 bg-[#e6ca98]/80 rounded-xs" />
              </div>
            </div>
          ),
        },
      ];

    // 16. BUTTON / CTA WIDGET
    case 'button_cta':
    case 'w_button':
      return [
        {
          key: 'btn-emerald-gold-pill',
          nameEn: 'Royal Emerald & Gold 3D Pill',
          nameAr: 'الزر الملكي الزمردي الدائري المتوهج',
          badge: 'Royal Pill',
          descEn: 'Rounded pill button with gold border, glowing shadow and shopping bag icon',
          descAr: 'زر دائري فاخر مع إطار ذهبي وظل متوهج وأيقونة سلة الشراء',
          presetSettings: {
            bgColor: '#102a1c',
            textColor: '#FAF9F5',
            borderColor: '#e6ca98',
            borderRadius: 9999,
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-2 flex items-center justify-center border border-slate-200">
              <div className="h-7 px-4 bg-[#102a1c] text-[#e6ca98] rounded-full border border-[#e6ca98] flex items-center gap-1.5 shadow-md">
                <span className="text-[8px]">🛍</span>
                <span className="text-[8px] font-black">اطلب الآن بخصم ٢٠٪</span>
              </div>
            </div>
          ),
        },
        {
          key: 'btn-dual-call-whatsapp',
          nameEn: 'Dual WhatsApp & Direct Order',
          nameAr: 'زران متجاوران (طلب فوري + واتساب)',
          badge: 'Dual CTA',
          descEn: 'Two connected buttons for instant cart addition and direct WhatsApp concierge',
          descAr: 'زران عمليان يتيحان للعميل الطلب المباشر أو التواصل عبر الواتساب فوراً',
          presetSettings: {
            layout: 'dual_buttons',
          },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-2 flex items-center justify-center gap-2 border border-slate-200">
              <div className="h-6 px-3 bg-emerald-600 text-white rounded-md text-[7px] font-bold flex items-center gap-1">
                <span>💬</span> واتساب
              </div>
              <div className="h-6 px-3 bg-slate-900 text-white rounded-md text-[7px] font-bold flex items-center gap-1">
                <span>🛒</span> أضف للسلة
              </div>
            </div>
          ),
        },
      ];

    // 17. COLUMNS CONTAINER
    case 'columns_container':
    case 'w_columns':
      return [
        {
          key: 'cols-2-equal',
          nameEn: '2-Column Equal Split (50% / 50%)',
          nameAr: 'عمودان متساويان (٥٠٪ / ٥٠٪)',
          badge: '2 Columns',
          descEn: 'Side-by-side equal container for image and text balance',
          descAr: 'تقسيم متوازن إلى عمودين متساويين للصورة والنصوص',
          presetSettings: { layoutColumns: '2' },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-2 flex gap-1.5 border border-slate-200">
              <div className="flex-1 bg-white rounded-md border border-indigo-200 p-1 flex items-center justify-center text-[7px] text-indigo-700 font-bold">٥٠٪</div>
              <div className="flex-1 bg-white rounded-md border border-indigo-200 p-1 flex items-center justify-center text-[7px] text-indigo-700 font-bold">٥٠٪</div>
            </div>
          ),
        },
        {
          key: 'cols-3-equal',
          nameEn: '3-Column Equal Grid (33% each)',
          nameAr: '٣ أعمدة متساوية (٣٣٪ لكل عمود)',
          badge: '3 Columns',
          descEn: 'Three equal columns suitable for feature cards or product highlights',
          descAr: '٣ أعمدة متناسقة لعرض المزايا والخدمات',
          presetSettings: { layoutColumns: '3' },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-2 flex gap-1 border border-slate-200">
              <div className="flex-1 bg-white rounded-md border border-indigo-200 flex items-center justify-center text-[6px] text-indigo-700 font-bold">٣٣٪</div>
              <div className="flex-1 bg-white rounded-md border border-indigo-200 flex items-center justify-center text-[6px] text-indigo-700 font-bold">٣٣٪</div>
              <div className="flex-1 bg-white rounded-md border border-indigo-200 flex items-center justify-center text-[6px] text-indigo-700 font-bold">٣٣٪</div>
            </div>
          ),
        },
        {
          key: 'cols-bento-66-33',
          nameEn: 'Bento Asymmetric (66% / 33%)',
          nameAr: 'شبكة بينتو غير المتماثلة (٦٦٪ / ٣٣٪)',
          badge: 'Bento Grid',
          descEn: 'Hero feature column on the left with supporting widgets on the right',
          descAr: 'عمود عريض رئيسي مع عمود جانبي للمحتوى المساعد',
          presetSettings: { layoutColumns: '2-asym-left' },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-2 flex gap-1.5 border border-slate-200">
              <div className="flex-2 bg-indigo-600 text-white rounded-md flex items-center justify-center text-[7px] font-bold">٦٦٪ رئيسي</div>
              <div className="flex-1 bg-white rounded-md border border-indigo-200 flex items-center justify-center text-[6px] text-indigo-700 font-bold">٣٣٪</div>
            </div>
          ),
        },
      ];

    // 18. PROMO BANNERS PAIR & IMAGE GRID
    case 'promo_banners_pair':
    case 'image_grid':
      return [
        {
          key: 'banners-asymmetric-pair',
          nameEn: 'Royal Dual Seasonal Banners',
          nameAr: 'زوج البنرات الترويجية الملكية',
          badge: 'Royal Dual',
          descEn: 'Two complementary promotional cards highlighting Haram gifts and seasonal offers',
          descAr: 'زوج بنرات متناسقة لهدايا الحرم وعروض المواسم مع تأثيرات زووم تفاعلية',
          presetSettings: {
            banner1TitleAr: 'هدايا مكة المكرمة',
            banner2TitleAr: 'باقات المناسبات والتخرج',
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-100 rounded-lg p-1.5 flex gap-1.5 border border-slate-200 shadow-xs">
              <div className="flex-1 bg-gradient-to-r from-emerald-900 to-teal-950 rounded-md p-1 flex flex-col justify-between border border-[#e6ca98]/40">
                <div className="h-1.5 w-10 bg-[#e6ca98] rounded-xs" />
                <div className="h-2 w-14 bg-white rounded-xs" />
              </div>
              <div className="flex-1 bg-gradient-to-r from-amber-900 to-stone-900 rounded-md p-1 flex flex-col justify-between border border-amber-400/40">
                <div className="h-1.5 w-10 bg-amber-400 rounded-xs" />
                <div className="h-2 w-14 bg-white rounded-xs" />
              </div>
            </div>
          ),
        },
        {
          key: 'banners-bento-trio',
          nameEn: '3-Tile Bento Promo Collage',
          nameAr: 'كولاج بينتو الثلاثي للعروض الترويجية',
          badge: 'Bento 3-Tile',
          descEn: 'One large landscape banner with two stacked square offer cards',
          descAr: 'بنر عريض رئيسي مع بطاقتين مربعتين للعروض الحصرية',
          presetSettings: { layout: 'bento_3' },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex gap-1 border border-slate-200">
              <div className="flex-2 bg-[#102a1c] rounded-md p-1 flex flex-col justify-between">
                <div className="h-1.5 w-12 bg-[#e6ca98] rounded-xs" />
                <div className="h-2 w-16 bg-white rounded-xs" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex-1 bg-slate-100 rounded-xs border border-slate-200" />
                <div className="flex-1 bg-slate-100 rounded-xs border border-slate-200" />
              </div>
            </div>
          ),
        },
      ];

    // 19. PROMO COUNTDOWN BANNER
    case 'promo_countdown_banner':
    case 'special_offer':
      return [
        {
          key: 'countdown-urgent-crimson',
          nameEn: 'Crimson Urgent Countdown Bar',
          nameAr: 'شريط العد التنازلي الحماسي العاجل',
          badge: 'Urgent Timer',
          descEn: 'High conversion countdown ticker with hours/mins digits and direct coupon button',
          descAr: 'عداد تنازلي حي مع خانات الساعات والدقائق وزر الخصم المباشر لرفع التحويلات',
          presetSettings: {
            bgColor: '#831843',
            textColor: '#ffffff',
            showFlipDigits: true,
          },
          previewSvg: (
            <div className="w-full h-14 bg-gradient-to-r from-rose-900 to-pink-950 rounded-lg p-1.5 flex items-center justify-between border border-rose-400/40">
              <div className="space-y-0.5">
                <div className="h-2 w-20 bg-white rounded-xs" />
                <div className="h-1 w-12 bg-rose-300 rounded-xs" />
              </div>
              <div className="flex gap-1">
                <div className="w-4 h-5 bg-black/40 rounded-xs text-white text-[7px] font-mono flex items-center justify-center">12</div>
                <div className="w-4 h-5 bg-black/40 rounded-xs text-white text-[7px] font-mono flex items-center justify-center">45</div>
              </div>
            </div>
          ),
        },
      ];

    // 20. SOCIAL REELS
    case 'social_reels':
      return [
        {
          key: 'reels-4-phones',
          nameEn: '4-Phone Mobile Video Reels',
          nameAr: '٤ شاشات ريلز تفاعلية للهواتف',
          badge: 'Phone Reels',
          descEn: 'Four vertical smartphone frames with instant video playback and interactive play badge',
          descAr: '٤ مقاطع ريلز بتصميم الهواتف الذكية مع تشغيل فوري وتفاعل مباشر',
          presetSettings: { reelsCount: 4, showPlayIcons: true },
          previewSvg: (
            <div className="w-full h-14 bg-slate-900 rounded-lg p-1.5 flex items-center justify-around border border-slate-700">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-6 h-10 bg-slate-800 rounded-md border border-slate-600 p-0.5 flex flex-col justify-between items-center shadow-md">
                  <div className="w-2 h-0.5 bg-slate-500 rounded-full" />
                  <div className="w-3 h-3 rounded-full bg-white/20 text-[6px] text-white flex items-center justify-center">▶</div>
                  <div className="h-0.5 w-4 bg-white/40 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 21. VIDEO SECTION
    case 'video_section':
      return [
        {
          key: 'video-cinema-brand',
          nameEn: 'Cinematic Full-Bleed Showcase',
          nameAr: 'الفيديو السينمائي لعراقة مكة والزهور',
          badge: 'Cinema 4K',
          descEn: 'Full-bleed cinema video player with centered gold play button and brand narration',
          descAr: 'مشغل فيديو سينمائي عريض مع زر تشغيل ذهبي وسرد لقصة المتجر',
          presetSettings: { layout: 'cinema' },
          previewSvg: (
            <div className="w-full h-14 bg-black rounded-lg p-1.5 flex flex-col items-center justify-center text-center border border-[#e6ca98]/40 shadow-xs">
              <div className="w-6 h-6 rounded-full bg-[#e6ca98] text-[#102a1c] text-[9px] flex items-center justify-center font-bold shadow-lg mb-0.5">
                ▶
              </div>
              <div className="h-1.5 w-24 bg-white rounded-xs" />
            </div>
          ),
        },
      ];

    // 22. STORE FEATURES / TRUST BADGES
    case 'store_features_bar':
    case 'features':
      return [
        {
          key: 'features-gold-cards',
          nameEn: '4-Card Luxury Trust Badges',
          nameAr: 'شارات الثقة الفاخرة المذهبة',
          badge: 'Gold Badges',
          descEn: 'Refrigerated 2-hour delivery, authentic fresh roses, secure payment via Mada & Apple Pay',
          descAr: 'توصيل مبرد خلال ساعتين، ورد هولندي طبيعي، ودفع آمن عبر مدى وآبل باي',
          presetSettings: {
            bgColor: '#FAF9F5',
            textColor: '#102a1c',
            cardBorder: true,
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-1.5 flex gap-1 border border-slate-200">
              {[
                { icon: '🚀', text: 'توصيل ساعتين' },
                { icon: '🌸', text: 'ورد هولندي' },
                { icon: '💳', text: 'دفع آمن' },
                { icon: '⭐', text: 'ضمان ١٠٠٪' },
              ].map((f, i) => (
                <div key={i} className="flex-1 bg-white rounded-md border border-slate-200 p-1 flex flex-col items-center justify-center text-center">
                  <span className="text-[7px]">{f.icon}</span>
                  <span className="text-[6px] font-bold text-slate-800 truncate mt-0.5">{f.text}</span>
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 23. REVIEWS & TESTIMONIALS
    case 'reviews':
      return [
        {
          key: 'reviews-hotel-guests',
          nameEn: 'Verified Hotel Guests & Testimonials',
          nameAr: 'شهادات وتقييمات نزلاء فنادق الحرم',
          badge: 'Guest Reviews',
          descEn: 'Testimonial cards with star ratings, guest names, and Clock Tower delivery tags',
          descAr: 'تجارب حقيقية موثقة من نزلاء أبراج الساعة وفنادق الحرم المكي الشريف',
          presetSettings: {
            showHotelTags: true,
            columns: 3,
          },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex gap-1 border border-slate-200 shadow-xs">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 bg-slate-50 rounded-md border border-slate-200 p-1 flex flex-col justify-between">
                  <div className="flex text-amber-400 text-[6px]">★★★★★</div>
                  <div className="h-1 w-full bg-slate-600 rounded-xs" />
                  <div className="h-1 w-2/3 bg-slate-400 rounded-xs" />
                  <div className="h-1.5 w-1/2 bg-emerald-700 rounded-xs mt-0.5" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 24. METRICS / STATS
    case 'metrics_section':
    case 'statistics':
      return [
        {
          key: 'stats-gold-milestones',
          nameEn: 'Mecca Milestones & Verified Numbers',
          nameAr: 'أرقام وإحصائيات الثقة الموثقة',
          badge: 'Gold Milestones',
          descEn: 'Animated counters highlighting 15,000+ happy clients, 50+ Haram hotels, and 4.9 rating',
          descAr: '١٥,٠٠٠+ باقة منسقة، ٥٠+ فندق، و٤.٩ تقييم ضيوف الحرم',
          presetSettings: {
            bgColor: '#102a1c',
            textColor: '#FAF9F5',
            accentColor: '#e6ca98',
          },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-1.5 flex items-center justify-around border border-[#e6ca98]/40 shadow-xs">
              {[
                { num: '+١٥ ألف', label: 'باقة منسقة' },
                { num: '+٥٠', label: 'فندق شريك' },
                { num: '٤.٩★', label: 'تقييم الضيوف' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <span className="text-[9px] font-black text-[#e6ca98] block">{s.num}</span>
                  <span className="text-[6px] text-white/70 block">{s.label}</span>
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 25. FAQ SECTION
    case 'faq':
      return [
        {
          key: 'faq-accordion-clean',
          nameEn: 'Expandable Delivery & Payment FAQ',
          nameAr: 'أكورديون الأسئلة الشائعة حول التوصيل والدفع',
          badge: 'FAQ Accordion',
          descEn: 'Clean expandable accordion answering delivery to Haram hotels, packaging and payment',
          descAr: 'أكورديون تفاعلي يوضح آلية التوصيل لفنادق الحرم، التغليف، وطرق الدفع',
          presetSettings: {
            openFirstItem: true,
          },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex flex-col justify-between border border-slate-200">
              <div className="p-1 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between">
                <div className="h-1.5 w-24 bg-slate-800 rounded-xs" />
                <span className="text-[7px] text-slate-500">−</span>
              </div>
              <div className="p-1 bg-white rounded-md border border-slate-100 flex items-center justify-between">
                <div className="h-1.5 w-20 bg-slate-400 rounded-xs" />
                <span className="text-[7px] text-slate-500">+</span>
              </div>
            </div>
          ),
        },
      ];

    // 26. MAGAZINE / BLOG
    case 'magazine_section':
    case 'blog':
      return [
        {
          key: 'magazine-editorial-3col',
          nameEn: 'Editorial Journal Articles Grid',
          nameAr: 'مجلة ومقالات هدايا مكة التحريرية',
          badge: 'Magazine Grid',
          descEn: 'Curated editorial journal articles on floral care and gifting etiquette in Makkah',
          descAr: 'مقالات نصائح اختيار الزهور ودليل العناية بالباقات في أجواء مكة المكرمة',
          presetSettings: { columns: 3 },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-1.5 flex gap-1 border border-slate-200">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 bg-white rounded-md border border-slate-200 p-1 flex flex-col justify-between">
                  <div className="h-4 bg-emerald-100/60 rounded-xs" />
                  <div className="h-1 w-full bg-slate-800 rounded-xs" />
                  <div className="h-1 w-2/3 bg-slate-400 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 27. VIP NEWSLETTER
    case 'newsletter':
      return [
        {
          key: 'newsletter-gold-coupon',
          nameEn: 'VIP 10% Off Instant Coupon Card',
          nameAr: 'النشرة البريدية الملكية لكوبون الخصم ١٠٪',
          badge: 'VIP Coupon',
          descEn: 'Subscription card providing instant 10% coupon code on registration',
          descAr: 'صندوق اشتراك للنشرة البريدية للحصول على كود خصم فوري ١٠٪',
          presetSettings: {
            bgColor: '#102a1c',
            textColor: '#FAF9F5',
            accentColor: '#e6ca98',
          },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-2 flex items-center justify-between border border-[#e6ca98]/40 shadow-xs">
              <div className="space-y-1">
                <div className="h-2 w-20 bg-white rounded-xs" />
                <div className="h-1.5 w-14 bg-[#e6ca98] rounded-xs" />
              </div>
              <div className="h-5 px-3 bg-[#e6ca98] text-[#102a1c] text-[7px] font-black rounded-xs flex items-center">
                احصل على ١٠٪
              </div>
            </div>
          ),
        },
      ];

    // 28. CART & CART DRAWER
    case 'cart':
    case 'cart_drawer':
    case 'builder_cart':
      return [
        {
          key: 'cart-royal-drawer',
          nameEn: 'Royal Gold Luxury Slide Drawer',
          nameAr: 'الدرج الجانبي الملكي المنزلق (Slide Drawer)',
          badge: 'Royal Drawer',
          descEn: 'Side drawer with free shipping progress bar, gift card note, and express Apple Pay',
          descAr: 'درج جانبي فاخر مع شريط التوصيل المجاني، كتابة كرت الإهداء، والدفع السريع',
          presetSettings: {
            showFreeShippingBar: true,
            freeShippingThreshold: 200,
            bgColor: '#ffffff',
            primaryColor: '#102a1c',
            accentColor: '#e6ca98',
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-900/60 rounded-lg p-1.5 flex justify-end border border-slate-700">
              <div className="w-20 h-full bg-white rounded-md p-1 flex flex-col justify-between shadow-xl border border-slate-200">
                <div className="flex justify-between items-center text-[6px] font-bold text-slate-800 border-b pb-0.5">
                  <span>سلة المشتريات</span>
                  <span className="text-rose-500">×</span>
                </div>
                <div className="h-2 bg-emerald-100 rounded-xs flex items-center px-1 text-[5px] text-emerald-800">
                  شحن مجاني!
                </div>
                <div className="h-3 bg-[#102a1c] text-[#e6ca98] text-[6px] font-bold rounded-xs flex items-center justify-center">
                  إتمام الطلب
                </div>
              </div>
            </div>
          ),
        },
        {
          key: 'cart-clean-modal',
          nameEn: 'Clean Minimal Floating Basket',
          nameAr: 'النافذة العائمة المنبثقة للسلة السريعة',
          badge: 'Floating Modal',
          descEn: 'Centered popup modal with rapid checkout and quantity spinners',
          descAr: 'نافذة منبثقة في منتصف الشاشة مع تعديل فوري للكميات وإتمام سريع',
          presetSettings: {
            layout: 'center_modal',
            bgColor: '#ffffff',
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-900/40 rounded-lg p-2 flex items-center justify-center">
              <div className="w-28 h-10 bg-white rounded-md shadow-lg border border-slate-200 p-1 flex flex-col justify-between">
                <div className="h-1.5 w-12 bg-slate-800 rounded-xs" />
                <div className="flex justify-between items-center">
                  <div className="h-1.5 w-6 bg-indigo-600 rounded-xs" />
                  <div className="h-3 px-1.5 bg-indigo-600 text-white text-[6px] font-bold rounded-xs flex items-center">
                    الدفع
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ];

    // 29. FOOTER
    case 'footer':
      return [
        {
          key: 'footer-royal-emerald',
          nameEn: 'Royal Emerald & Gold Mega Footer',
          nameAr: 'الفوتر الملكي الزمردي الشامل',
          badge: 'Mega Emerald',
          descEn: '4-Column luxury footer with VAT number, Maroof badge, payment methods and map',
          descAr: 'فوتر ملكي متكامل مع الرقم الضريبي، معروف، طرق الدفع وشبكات التواصل',
          presetSettings: { bgColor: '#06170e', textColor: '#FAF9F5', accentColor: '#e6ca98' },
          previewSvg: (
            <div className="w-full h-14 bg-[#06170e] rounded-lg p-1.5 flex flex-col justify-between border border-[#e6ca98]/40">
              <div className="flex justify-between gap-1">
                <div className="h-2 w-14 bg-[#e6ca98] rounded-xs" />
                <div className="h-1.5 w-8 bg-white/40 rounded-xs" />
                <div className="h-1.5 w-8 bg-white/40 rounded-xs" />
                <div className="h-1.5 w-8 bg-white/40 rounded-xs" />
              </div>
              <div className="flex justify-between items-center border-t border-white/10 pt-1">
                <div className="h-1 w-20 bg-white/30 rounded-xs" />
                <div className="flex gap-1">
                  <div className="w-3 h-2 bg-white/20 rounded-xs" />
                  <div className="w-3 h-2 bg-white/20 rounded-xs" />
                  <div className="w-3 h-2 bg-white/20 rounded-xs" />
                </div>
              </div>
            </div>
          ),
        },
        {
          key: 'footer-minimal-dark',
          nameEn: 'Clean Dark Minimalist Footer',
          nameAr: 'الفوتر الداكن البسيط والعصري',
          badge: 'Dark Minimal',
          descEn: 'Minimalist black footer with clean quick links and copyright bar',
          descAr: 'تصميم هادئ وعصري يركز على الروابط الهامة وحقوق المتجر',
          presetSettings: { bgColor: '#09090b', textColor: '#ffffff' },
          previewSvg: (
            <div className="w-full h-14 bg-zinc-950 rounded-lg p-1.5 flex flex-col justify-between border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="h-2 w-16 bg-white rounded-xs" />
                <div className="flex gap-1">
                  <div className="h-1.5 w-6 bg-zinc-600 rounded-xs" />
                  <div className="h-1.5 w-6 bg-zinc-600 rounded-xs" />
                </div>
              </div>
              <div className="h-1 w-full bg-zinc-800 rounded-xs" />
            </div>
          ),
        },
      ];

    // DEFAULT FALLBACK TEMPLATES FOR ANY CUSTOM SECTION
    default:
      return [
        {
          key: 'tpl-default-clean',
          nameEn: 'Modern Clean Minimal',
          nameAr: 'العصري الأنيق البسيط',
          badge: 'Clean',
          descEn: 'Clean balanced spacing with modern high-contrast typography',
          descAr: 'تصميم متوازن وبسيط مع مساحات مريحة وتنسيق عصري',
          presetSettings: { bgColor: '#ffffff', textColor: '#1e293b' },
          previewSvg: (
            <div className="w-full h-14 bg-slate-100 rounded-lg p-1.5 flex flex-col justify-between border border-slate-200">
              <div className="h-2 w-1/3 bg-indigo-500 rounded-xs" />
              <div className="flex gap-1">
                <div className="h-6 flex-1 bg-white rounded-xs border border-slate-200" />
                <div className="h-6 flex-1 bg-white rounded-xs border border-slate-200" />
              </div>
            </div>
          ),
        },
        {
          key: 'tpl-royal-luxury',
          nameEn: 'Royal Emerald Luxury',
          nameAr: 'الفخامة الملكية الزمردية',
          badge: 'Luxury',
          descEn: 'Deep emerald velvet background with radiant golden trims',
          descAr: 'خلفية زمردية مخملية عميقة مع لمسات ذهبية ملكية',
          presetSettings: { bgColor: '#102a1c', textColor: '#FAF9F5', accentColor: '#e6ca98' },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-1.5 flex flex-col justify-between border border-[#e6ca98]/40">
              <div className="h-2 w-1/2 bg-[#e6ca98] rounded-xs mx-auto" />
              <div className="flex gap-1">
                <div className="h-6 flex-1 bg-[#163826] rounded-xs border border-[#e6ca98]/30" />
                <div className="h-6 flex-1 bg-[#163826] rounded-xs border border-[#e6ca98]/30" />
              </div>
            </div>
          ),
        },
      ];
  }
}

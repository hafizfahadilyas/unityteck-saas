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
          nameEn: 'Dark VIP Noir & Gold Edition',
          nameAr: 'أونيكس VIP الأسود الملكي',
          badge: 'Dark Noir',
          descEn: 'Midnight black with glowing gold accents, premium luxury boutique vibe',
          descAr: 'أسود ملكي فخم مع لمسات ذهبية متوهجة لمحلات الهدايا الراقية',
          presetSettings: {
            bgColor: '#09090b',
            textColor: '#FAF9F5',
            accentColor: '#d4af37',
            layout: 'dark_vip',
            stickyHeader: true,
            glassmorphism: false,
          },
          previewSvg: (
            <div className="w-full h-14 bg-[#09090b] rounded-lg p-1.5 flex flex-col justify-between border border-amber-500/40 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-14 bg-gradient-to-r from-amber-400 to-yellow-200 rounded-xs" />
                <div className="flex gap-1">
                  <div className="h-2 w-6 bg-zinc-800 rounded-xs" />
                  <div className="h-2 w-6 bg-zinc-800 rounded-xs" />
                </div>
                <div className="h-4 px-1.5 bg-amber-500 text-black font-black text-[6px] rounded-xs flex items-center">
                  VIP
                </div>
              </div>
              <div className="flex gap-1">
                <div className="h-2.5 flex-1 bg-zinc-900 border border-zinc-800 rounded-xs" />
                <div className="h-2.5 flex-1 bg-zinc-900 border border-zinc-800 rounded-xs" />
                <div className="h-2.5 flex-1 bg-zinc-900 border border-zinc-800 rounded-xs" />
              </div>
            </div>
          ),
        },
        {
          key: 'header-split-mega',
          nameEn: 'Split Mega-Menu with Featured Banner',
          nameAr: 'القائمة الضخمة المنقسمة (Mega Menu)',
          badge: 'Mega Menu',
          descEn: 'Full-width navigation bar with category hover dropdowns and promotional card',
          descAr: 'شريط تنقل متكامل يفتح قوائم منسدلة عريضة مع بطاقة إعلانية مميزة',
          presetSettings: {
            bgColor: '#FFFFFF',
            textColor: '#111827',
            accentColor: '#102a1c',
            layout: 'split_mega',
            stickyHeader: true,
          },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex flex-col justify-between border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center">
                <div className="h-2.5 w-16 bg-emerald-950 rounded-xs" />
                <div className="flex gap-1">
                  <div className="h-2 w-7 bg-slate-200 rounded-xs" />
                  <div className="h-2 w-7 bg-slate-200 rounded-xs" />
                  <div className="h-2 w-7 bg-slate-200 rounded-xs" />
                </div>
                <div className="w-4 h-4 rounded-full bg-emerald-100" />
              </div>
              <div className="h-4 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between px-2 text-[6px] font-bold text-slate-500">
                <span>تصفح حسب المناسبة</span>
                <span className="text-emerald-700">باقات الورد الطبيعي</span>
              </div>
            </div>
          ),
        },
      ];

    // 2. HERO BANNER / MOTION SLIDER
    case 'hero_slider':
    case 'hero':
      return [
        {
          key: 'hero-3d-motion',
          nameEn: '3D Interactive Parallax Slider',
          nameAr: 'سلايدر الحركات ثلاثية الأبعاد 3D',
          badge: '3D Pro',
          descEn: 'Multi-layer parallax slide with floating luxury cards and glowing CTA buttons',
          descAr: 'سلايدر تفاعلي ثلاثي الأبعاد مع بطاقات عائمة وتأثيرات عمق سينمائية',
          presetSettings: {
            animationSpeed: 5000,
            parallax3d: true,
            showBadges: true,
          },
          previewSvg: (
            <div className="w-full h-14 bg-gradient-to-r from-emerald-950 to-teal-950 rounded-lg p-1.5 flex items-center justify-between border border-[#e6ca98]/40 shadow-xs">
              <div className="space-y-1 w-1/2">
                <div className="h-2 w-3/4 bg-[#e6ca98] rounded-xs" />
                <div className="h-1.5 w-full bg-white/60 rounded-xs" />
                <div className="h-3 w-12 bg-[#e6ca98] rounded-xs" />
              </div>
              <div className="relative w-14 h-11 bg-white/10 rounded-lg border border-white/30 flex items-center justify-center transform -rotate-3 shadow-lg">
                <span className="text-[10px]">🌸</span>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-[6px] font-bold px-1 rounded-xs text-black">3D</div>
              </div>
            </div>
          ),
        },
        {
          key: 'hero-split-video',
          nameEn: 'Split Cinematic Video & Banner',
          nameAr: 'البنر السينمائي المنقسم مع الفيديو',
          badge: 'Cinematic',
          descEn: 'Side-by-side video playback with luxury editorial bouquet storytelling',
          descAr: 'عرض منقسم يجمع فيديو التنسيق الحي مع نصوص الطلب الفوري',
          presetSettings: {
            videoAutoplay: true,
            layout: 'split_video',
          },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-1.5 flex gap-1.5 border border-emerald-600/40">
              <div className="flex-1 bg-black/40 rounded-md border border-white/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white/80 text-black text-[8px] flex items-center justify-center font-bold">▶</div>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-1">
                <div className="h-2 w-full bg-[#e6ca98] rounded-xs" />
                <div className="h-1.5 w-2/3 bg-white/50 rounded-xs" />
                <div className="h-2.5 w-10 bg-emerald-500 rounded-xs" />
              </div>
            </div>
          ),
        },
        {
          key: 'hero-flash-countdown',
          nameEn: 'Urgent Flash Sale Countdown Hero',
          nameAr: 'الواجهة الترويجية مع العداد التنازلي',
          badge: 'Flash Urgency',
          descEn: 'Hero slider with active live countdown timer driving urgent purchase intent',
          descAr: 'واجهة رئيسية حيوية مع عداد تنازلي للساعات والدقائق لمضاعفة المبيعات',
          presetSettings: {
            enableCountdown: true,
            badgeAr: 'عرض محدود',
            badgeEn: 'Limited Offer',
          },
          previewSvg: (
            <div className="w-full h-14 bg-gradient-to-r from-rose-950 to-amber-950 rounded-lg p-1.5 flex flex-col justify-between border border-rose-500/40">
              <div className="flex justify-between items-center">
                <div className="h-2 w-1/3 bg-amber-400 rounded-xs" />
                <div className="flex gap-0.5">
                  <span className="px-1 bg-white text-rose-950 font-mono font-black text-[6px] rounded-xs">02</span>
                  <span className="text-[6px] text-white">:</span>
                  <span className="px-1 bg-white text-rose-950 font-mono font-black text-[6px] rounded-xs">45</span>
                </div>
              </div>
              <div className="h-4 bg-white/10 rounded-md border border-white/20 flex items-center justify-between px-1.5">
                <span className="text-[7px] text-white font-bold">خصم 30% فندقي</span>
                <span className="h-2.5 px-1.5 bg-amber-400 text-black text-[6px] font-bold rounded-xs flex items-center">اطلب</span>
              </div>
            </div>
          ),
        },
        {
          key: 'hero-minimal-chic',
          nameEn: 'Modern Minimalist Chic Banner',
          nameAr: 'العصري البسيط مع مساحة بيضاء واسعة',
          badge: 'Minimal Chic',
          descEn: 'High-end minimalist aesthetic with elegant typography and clean backdrop',
          descAr: 'تصميم راقٍ وهادئ يركز على جمال صور الورود وجودة التنسيق',
          presetSettings: {
            bgColor: '#f8fafc',
            textColor: '#0f172a',
            accentColor: '#102a1c',
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-1.5 flex items-center justify-between border border-slate-200">
              <div className="space-y-1 w-1/2">
                <div className="h-2.5 w-3/4 bg-slate-900 rounded-xs" />
                <div className="h-1.5 w-full bg-slate-400 rounded-xs" />
                <div className="h-3 w-10 bg-slate-900 rounded-xs" />
              </div>
              <div className="w-14 h-10 bg-white rounded-md border border-slate-200 flex items-center justify-center text-xs">
                💐
              </div>
            </div>
          ),
        },
      ];

    // 3. ANNOUNCEMENT & MARQUEE
    case 'announcement':
    case 'marquee_banner':
      return [
        {
          key: 'marquee-pulsing-gold',
          nameEn: 'Pulsing Luxury Gold Marquee Ticker',
          nameAr: 'الشريط المتحرك الذهبي المتوهج',
          badge: 'Pulsing Ticker',
          descEn: 'Smooth continuous marquee with glowing golden badges and flash shipping tags',
          descAr: 'شريط متحرك فاخر بانسيابية كاملة مع شارات التوصيل السريع وضمان الجودة',
          presetSettings: { bgColor: '#102a1c', textColor: '#e6ca98' },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-2 flex flex-col justify-center border border-[#e6ca98]/40 space-y-1">
              <div className="flex items-center gap-1 overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="h-2 w-20 bg-[#e6ca98] rounded-xs" />
                <span className="text-[7px] text-amber-300">✦</span>
                <span className="h-2 w-24 bg-[#e6ca98]/80 rounded-xs" />
                <span className="text-[7px] text-amber-300">✦</span>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#e6ca98] to-transparent" />
            </div>
          ),
        },
        {
          key: 'announcement-luxury-strip',
          nameEn: 'Dual-Badge Topbar Notice Strip',
          nameAr: 'شريط التنبيهات الملكي مع زر الشراء',
          badge: 'Dual Badge',
          descEn: 'Top announcement bar with hotel delivery notice and quick order button',
          descAr: 'شريط علوي أنيق يبرز سرعة التوصيل لفنادق مكة مع زر الشراء الفوري',
          presetSettings: { bgColor: '#064e3b', textColor: '#ffffff' },
          previewSvg: (
            <div className="w-full h-14 bg-emerald-900 rounded-lg p-2 flex items-center justify-between border border-emerald-500/30">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400 text-black text-[6px] flex items-center justify-center font-bold">✓</div>
                <div className="h-2 w-28 bg-white rounded-xs" />
              </div>
              <div className="h-4 px-2 bg-amber-400 text-black font-black text-[7px] flex items-center rounded-xs">
                اطلب الآن
              </div>
            </div>
          ),
        },
        {
          key: 'announcement-minimal-mono',
          nameEn: 'Clean Monochrome Shipping Bar',
          nameAr: 'الشريط الأحادي البسيط والمباشر',
          badge: 'Monochrome',
          descEn: 'High contrast black and white top bar for clear, concise store notices',
          descAr: 'شريط كلاسيكي عالي التباين للإعلانات الهامة وتفاصيل الشحن',
          presetSettings: { bgColor: '#000000', textColor: '#FFFFFF' },
          previewSvg: (
            <div className="w-full h-14 bg-black rounded-lg p-2 flex items-center justify-center border border-zinc-700">
              <div className="h-2.5 w-44 bg-white rounded-xs text-center" />
            </div>
          ),
        },
      ];

    // 4. CIRCLE CATEGORIES
    case 'circle_categories':
      return [
        {
          key: 'cats-gold-rings',
          nameEn: 'Floating 3D Gold Rings & Glow',
          nameAr: 'الحلقات الذهبية الملكية ثلاثية الأبعاد',
          badge: '3D Gold',
          descEn: 'Glowing circular badges with gold double border and floating zoom on hover',
          descAr: 'أيقونات دائرية محاطة بإطارات ذهبية مزدوجة مع تأثيرات تكبير فاخرة',
          presetSettings: { ringStyle: 'gold_double', zoomEffect: true },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-1.5 flex items-center justify-around border border-[#e6ca98]/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className="w-7 h-7 rounded-full bg-[#163826] border-2 border-[#e6ca98] p-0.5 flex items-center justify-center shadow-xs">
                    <div className="w-full h-full rounded-full bg-[#e6ca98]/30" />
                  </div>
                  <div className="h-1 w-5 bg-[#e6ca98]/80 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
        {
          key: 'cats-story-avatar',
          nameEn: 'Instagram / Snapchat Story Circles',
          nameAr: 'تصميم ستوري التواصل الاجتماعي المتدرج',
          badge: 'Story Avatar',
          descEn: 'Social story avatar rings with colorful live gradient and active status badge',
          descAr: 'تصميم ستوري تفاعلي بتدرجات ألوان نابضة ونبضات حية للعروض',
          presetSettings: { ringStyle: 'gradient_story', pulseBadge: true },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex items-center justify-around border border-slate-200">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-white p-0.5">
                      <div className="w-full h-full rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-1 w-5 bg-slate-600 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
        {
          key: 'cats-pill-badges',
          nameEn: 'Modern Rounded Pill Badges',
          nameAr: 'كبسولات التصنيفات العصرية الأنيقة',
          badge: 'Pills',
          descEn: 'Horizontal pill shaped badges with category counts and sleek gold trim',
          descAr: 'كبسولات عصرية أفقية مع عداد المنتجات وتصميم سريع النقر',
          presetSettings: { ringStyle: 'pill_horizontal', showCount: true },
          previewSvg: (
            <div className="w-full h-14 bg-slate-100 rounded-lg p-1.5 flex items-center justify-around border border-slate-200">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 px-2 bg-white rounded-full border border-slate-300 flex items-center gap-1 shadow-2xs">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-600" />
                  <div className="h-1.5 w-6 bg-slate-700 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 5. PRODUCT SECTIONS & DYNAMIC ROWS
    case 'product_section_natural':
    case 'product_section_luxury':
    case 'product_section_chocolate':
    case 'product_section_cake':
    case 'product_section_coffee':
    case 'product_section_vases':
    case 'product_section_mawajeeb':
    case 'product_tabs':
    case 'dynamic_product_row':
    case 'shortcode_widget':
    case 'discounted_bouquets_3d':
      return [
        {
          key: 'prod-4col-luxury',
          nameEn: 'Royal 4-Column Luxury Cards',
          nameAr: 'شبكة ٤ أعمدة بالفخامة الملكية',
          badge: 'Royal 4-Col',
          descEn: 'Four elegant cards with gold ribbons, price tags, and quick-add buttons',
          descAr: 'عرض متناسق من ٤ أعمدة بلمسات ذهبية وشارات الخصم وزر إضافة فوري',
          presetSettings: { columns: 4, layout: 'slider', limit: 8, cardRadius: 16 },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex gap-1 border border-slate-200 shadow-xs">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 bg-slate-50 rounded-md border border-slate-200 p-1 flex flex-col justify-between">
                  <div className="h-5 bg-emerald-100 rounded-xs flex items-center justify-center text-[7px]">🌸</div>
                  <div className="h-1 w-full bg-slate-600 rounded-xs" />
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
          key: 'prod-3d-tilt-slider',
          nameEn: '3D Interactive Tilt & Swipe Slider',
          nameAr: 'سلايدر البطاقات ثلاثية الأبعاد 3D',
          badge: '3D Slider',
          descEn: 'Smooth auto-swipe carousel with 3D card tilt and luxury drop shadows',
          descAr: 'سلايدر تفاعلي سلس مع ميلان ثلاثي الأبعاد وظلال ملكية ناعمة',
          presetSettings: { columns: 4, layout: 'slider', limit: 6, cardStyle: '3d_tilt' },
          previewSvg: (
            <div className="w-full h-14 bg-gradient-to-r from-emerald-950 to-teal-950 rounded-lg p-1.5 flex items-center justify-center gap-1.5 border border-[#e6ca98]/40">
              <div className="w-8 h-10 bg-white/20 rounded-md border border-white/30 transform -rotate-6 shadow-md" />
              <div className="w-10 h-11 bg-white rounded-md p-1 flex flex-col justify-between transform scale-105 shadow-xl border border-[#e6ca98]">
                <div className="h-5 bg-emerald-100 rounded-xs" />
                <div className="h-1 w-full bg-slate-800 rounded-xs" />
                <div className="h-2 w-full bg-[#102a1c] rounded-xs" />
              </div>
              <div className="w-8 h-10 bg-white/20 rounded-md border border-white/30 transform rotate-6 shadow-md" />
            </div>
          ),
        },
        {
          key: 'prod-compact-grid',
          nameEn: 'High-Density 5-Column Grid',
          nameAr: 'الشبكة المكثفة من ٥ أعمدة للمبيعات العالية',
          badge: 'High Conversion',
          descEn: 'Compact multi-column layout showing more catalog products above the fold',
          descAr: 'تخطيط خفيف وسريع يعرض تشكيلة أوسع من الباقات لزيادة المبيعات',
          presetSettings: { columns: 5, layout: 'grid', limit: 10 },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-1 flex gap-0.5 border border-slate-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-1 bg-white rounded-xs border border-slate-200 p-0.5 flex flex-col justify-between">
                  <div className="h-5 bg-slate-100 rounded-xs" />
                  <div className="h-1 w-full bg-slate-400 rounded-xs" />
                  <div className="h-1 w-2/3 bg-emerald-600 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
        {
          key: 'prod-masonry-bento',
          nameEn: 'Bento Asymmetric Highlight Grid',
          nameAr: 'شبكة بينتو المميزة مع باقة رئيسية كبرى',
          badge: 'Bento Layout',
          descEn: 'Hero product card on the left with smaller supporting product tiles',
          descAr: 'عرض باقة مميزة كبرى على اليسار مع باقات مرافقة بتصميم بينتو عصري',
          presetSettings: { layoutColumns: 'bento', limit: 6 },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex gap-1.5 border border-slate-200">
              <div className="flex-2 bg-[#102a1c] rounded-md p-1 flex flex-col justify-between border border-[#e6ca98]/40">
                <div className="h-1.5 w-12 bg-[#e6ca98] rounded-xs" />
                <div className="h-4 bg-white/10 rounded-xs" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex-1 bg-slate-100 rounded-xs border border-slate-200" />
                <div className="flex-1 bg-slate-100 rounded-xs border border-slate-200" />
              </div>
            </div>
          ),
        },
        {
          key: 'prod-grid-6col',
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

    // 6. CART & CART DRAWER
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
            showGiftMessage: true,
            showExpressPay: true,
            bgColor: '#FAF9F5',
            accentColor: '#102a1c',
          },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-1.5 flex justify-end border border-[#e6ca98]/40 shadow-xs">
              <div className="w-1/2 h-full bg-white rounded-md p-1 flex flex-col justify-between border border-[#e6ca98]">
                <div className="flex justify-between items-center text-[6px] font-bold text-[#102a1c]">
                  <span>السلة (٢)</span>
                  <span>✕</span>
                </div>
                <div className="h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-emerald-600" />
                </div>
                <div className="h-2.5 w-full bg-[#102a1c] text-[#e6ca98] text-[5px] font-black rounded-xs flex items-center justify-center">
                  إتمام الطلب
                </div>
              </div>
            </div>
          ),
        },
        {
          key: 'cart-minimal-white',
          nameEn: 'Clean Minimalist White Cart',
          nameAr: 'سلة التسوق البيضاء النقية والمباشرة',
          badge: 'Clean Minimal',
          descEn: 'Clean high-contrast cart modal with instant coupon code and VAT summary',
          descAr: 'نافذة سلة واضحة وسريعة تبرز كود الخصم وضريبة القيمة المضافة',
          presetSettings: {
            showFreeShippingBar: true,
            showCouponInput: true,
            showTaxSummary: true,
            bgColor: '#FFFFFF',
            accentColor: '#4f46e5',
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-1.5 flex justify-center items-center border border-slate-200">
              <div className="w-3/4 h-full bg-white rounded-md p-1.5 flex flex-col justify-between border border-slate-300 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="h-1.5 w-12 bg-slate-800 rounded-xs" />
                  <div className="h-1.5 w-6 bg-slate-400 rounded-xs" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-xs border border-slate-200" />
                <div className="h-3 w-full bg-indigo-600 rounded-xs flex items-center justify-center text-[6px] text-white font-bold">
                  الدفع الآمن
                </div>
              </div>
            </div>
          ),
        },
        {
          key: 'cart-sticky-bar',
          nameEn: 'Sticky Mobile Bottom Checkout Bar',
          nameAr: 'شريط الشراء السفلي المثبت للموبايل',
          badge: 'Sticky Bar',
          descEn: 'Floating bottom bar showing total price, free gift wrap tag and checkout button',
          descAr: 'شريط سفلي ذكي ومثبت يظهر السعر الإجمالي وزر الشراء بنقرة واحدة',
          presetSettings: {
            stickyBottom: true,
            showTotalBadge: true,
            accentColor: '#059669',
          },
          previewSvg: (
            <div className="w-full h-14 bg-slate-200 rounded-lg p-1 flex flex-col justify-end border border-slate-300">
              <div className="h-5 w-full bg-emerald-950 text-white rounded-md p-1 flex items-center justify-between border border-emerald-500/40">
                <div className="flex items-center gap-1">
                  <span className="text-[7px]">🛒</span>
                  <span className="text-[6px] font-bold text-amber-300">٤٩٠ ر.س</span>
                </div>
                <div className="h-3 px-2 bg-amber-400 text-black font-black text-[6px] rounded-xs flex items-center">
                  الدفع الفوري
                </div>
              </div>
            </div>
          ),
        },
      ];

    // 7. PROMO BANNERS PAIR & IMAGE GRID
    case 'promo_banners_pair':
    case 'image_grid':
      return [
        {
          key: 'banner-dual-velvet',
          nameEn: 'Dual Split Luxury Emerald & Gold',
          nameAr: 'زوج البنرات الملكي المتناسق',
          badge: 'Dual Split',
          descEn: 'Two complementary promotional banners with zoom effects and gold CTA',
          descAr: 'زوج بنرات متناسقة لهدايا الحرم والمناسبات مع تأثيرات حركية فاخرة',
          presetSettings: { layout: 'dual_cards', zoomEffect: true },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-1.5 flex gap-1.5 border border-[#e6ca98]/40">
              <div className="flex-1 bg-[#163826] rounded-md p-1 flex flex-col justify-between border border-[#e6ca98]/30">
                <div className="h-2 w-3/4 bg-[#e6ca98] rounded-xs" />
                <div className="h-2 w-1/2 bg-white/50 rounded-xs" />
              </div>
              <div className="flex-1 bg-[#163826] rounded-md p-1 flex flex-col justify-between border border-[#e6ca98]/30">
                <div className="h-2 w-3/4 bg-[#e6ca98] rounded-xs" />
                <div className="h-2 w-1/2 bg-white/50 rounded-xs" />
              </div>
            </div>
          ),
        },
        {
          key: 'banner-asymmetric-3',
          nameEn: '3-Piece Bento Promo Grid',
          nameAr: 'شبكة البنرات الثلاثية العصرية',
          badge: '3-Piece Bento',
          descEn: 'One large focal banner with two smaller seasonal stacked cards',
          descAr: 'بنر رئيسي عريض وبنران فرعيان لمواسم العمرة والأعياد',
          presetSettings: { layout: 'bento_3', zoomEffect: true },
          previewSvg: (
            <div className="w-full h-14 bg-slate-900 rounded-lg p-1.5 flex gap-1 border border-slate-700">
              <div className="flex-2 bg-gradient-to-r from-emerald-800 to-teal-800 rounded-md p-1" />
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex-1 bg-amber-600 rounded-xs" />
                <div className="flex-1 bg-rose-700 rounded-xs" />
              </div>
            </div>
          ),
        },
      ];

    // 8. COUNTDOWN BANNER & SPECIAL OFFER
    case 'promo_countdown_banner':
    case 'special_offer':
      return [
        {
          key: 'countdown-urgent-emerald',
          nameEn: 'Emerald Gold Live Countdown Banner',
          nameAr: 'بنر العرض التنازلي الملكي بالزمردي',
          badge: 'Emerald Timer',
          descEn: 'Full-width luxury emerald banner with live digit countdown and discount badge',
          descAr: 'بنر عريض بعداد زمني حي وسعر العرض الخاص للطلب السريع',
          presetSettings: { bgColor: '#102a1c', textColor: '#FAF9F5', accentColor: '#e6ca98' },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-1.5 flex items-center justify-between border border-[#e6ca98]">
              <div className="space-y-1">
                <div className="h-2 w-20 bg-[#e6ca98] rounded-xs" />
                <div className="h-1.5 w-14 bg-white/60 rounded-xs" />
              </div>
              <div className="flex gap-1">
                <div className="px-1.5 py-0.5 bg-[#e6ca98] text-[#102a1c] font-black text-[7px] rounded-xs">12h</div>
                <div className="px-1.5 py-0.5 bg-[#e6ca98] text-[#102a1c] font-black text-[7px] rounded-xs">34m</div>
              </div>
            </div>
          ),
        },
        {
          key: 'countdown-dark-fire',
          nameEn: 'Midnight Noir Flame Flash Deal',
          nameAr: 'عرض الشعلة الأسود الفاخر Flash Deal',
          badge: 'Midnight Flame',
          descEn: 'Dark midnight black layout with glowing red/gold urgency indicators',
          descAr: 'تصميم داكن عالي التأثير للشحنات الحصرية وعروض المناسبات الخاصة',
          presetSettings: { bgColor: '#09090b', textColor: '#ffffff', accentColor: '#f43f5e' },
          previewSvg: (
            <div className="w-full h-14 bg-black rounded-lg p-1.5 flex items-center justify-between border border-rose-500/50">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🔥</span>
                <div className="h-2.5 w-24 bg-gradient-to-r from-rose-500 to-amber-400 rounded-xs" />
              </div>
              <div className="h-4 px-2 bg-rose-600 text-white font-black text-[7px] flex items-center rounded-xs">
                خصم 40%
              </div>
            </div>
          ),
        },
      ];

    // 9. SOCIAL REELS & VIDEOS
    case 'social_reels':
    case 'video_section':
      return [
        {
          key: 'reels-tiktok-slider',
          nameEn: 'Vertical 9:16 Video Reels Swipe',
          nameAr: 'ريلز تيك توك وسناب شات 9:16',
          badge: '9:16 Reels',
          descEn: 'Four vertical video cards with play buttons, product tags and Saudi buyer reviews',
          descAr: '٤ بطاقات فيديو ريلز عمودية لتنسيق الورود واستلام النزلاء',
          presetSettings: { aspectRatio: '9:16', autoplayOnHover: true },
          previewSvg: (
            <div className="w-full h-14 bg-slate-900 rounded-lg p-1.5 flex gap-1.5 border border-slate-700">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 bg-slate-800 rounded-md border border-slate-700 flex flex-col items-center justify-center relative">
                  <div className="w-3 h-3 rounded-full bg-white/80 text-black text-[6px] flex items-center justify-center font-bold">▶</div>
                  <div className="absolute bottom-1 w-3/4 h-1 bg-white/40 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
        {
          key: 'video-cinema-widescreen',
          nameEn: 'Cinematic Widescreen 4K Showcase',
          nameAr: 'العرض السينمائي الشامل 4K',
          badge: 'Cinema 4K',
          descEn: 'Full bleed video showcase with sound toggle and brand story narration',
          descAr: 'عرض فيديو عريض يروي قصة هدايا مكة وروح الضيافة الحجازية',
          presetSettings: { aspectRatio: '16:9', showSoundToggle: true },
          previewSvg: (
            <div className="w-full h-14 bg-black rounded-lg p-1.5 flex items-center justify-center border border-[#e6ca98]/40 relative">
              <div className="w-6 h-6 rounded-full bg-[#e6ca98] text-[#102a1c] flex items-center justify-center font-black text-[9px] shadow-lg">▶</div>
              <div className="absolute bottom-1.5 left-2 h-1.5 w-24 bg-white/60 rounded-xs" />
            </div>
          ),
        },
      ];

    // 10. STORE FEATURES & TRUST BADGES
    case 'store_features_bar':
    case 'features':
      return [
        {
          key: 'features-4col-pills',
          nameEn: '4 Floating Royal Gold Pills',
          nameAr: 'كبسولات الضمان الملكية الـ ٤ العائمة',
          badge: 'Gold Pills',
          descEn: 'Four floating emerald capsules with gold icons (2-Hour delivery, Fresh roses, etc.)',
          descAr: '٤ كبسولات راقية تبرز سرعة التوصيل وضمان الورد الطازج والدفع الآمن',
          presetSettings: { bgColor: '#FAF9F5', textColor: '#102a1c' },
          previewSvg: (
            <div className="w-full h-14 bg-[#FAF9F5] rounded-lg p-1.5 flex gap-1 border border-slate-200">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 bg-white rounded-md border border-[#e6ca98]/50 p-1 flex flex-col justify-between shadow-2xs">
                  <div className="w-3 h-3 rounded-full bg-[#102a1c] text-[#e6ca98] text-[6px] flex items-center justify-center font-bold">★</div>
                  <div className="h-1 w-full bg-slate-700 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
        {
          key: 'features-minimal-strip',
          nameEn: 'Clean Horizontal Icon Strip',
          nameAr: 'الشريط الأفقي البسيط مع فواصل ناعمة',
          badge: 'Minimal Strip',
          descEn: 'Compact horizontal trust bar with subtle dividers and quick icons',
          descAr: 'شريط مقتضب وأنيق يثبت ثقة العميل دون أخذ مساحة رأسية كبيرة',
          presetSettings: { bgColor: '#FFFFFF', textColor: '#334155' },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex items-center justify-around border border-slate-200">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-50 text-emerald-700 text-[7px] flex items-center justify-center font-bold">✓</div>
                  <div className="h-1.5 w-8 bg-slate-700 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 11. REVIEWS & TESTIMONIALS
    case 'reviews':
      return [
        {
          key: 'reviews-verified-slider',
          nameEn: 'Saudi Verified Reviews & Hotel Tags',
          nameAr: 'تقييمات ضيوف فنادق مكة الموثقة',
          badge: 'Saudi Verified',
          descEn: 'Verified customer cards with hotel delivery badges and 5-star ratings',
          descAr: 'بطاقات آراء العملاء مع شارة الفندق المستلم والتقييم الذهبي',
          presetSettings: { showHotelTags: true, ratingStars: 5 },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-1.5 flex gap-1 border border-slate-200">
              {[1, 2].map((i) => (
                <div key={i} className="flex-1 bg-white rounded-md border border-slate-200 p-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <div className="text-[6px] text-amber-500 font-bold">★★★★★</div>
                    <div className="h-1.5 w-6 bg-emerald-100 rounded-xs" />
                  </div>
                  <div className="h-1 w-full bg-slate-600 rounded-xs" />
                  <div className="h-1 w-1/2 bg-slate-400 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 12. METRICS & STATISTICS
    case 'metrics_section':
    case 'statistics':
      return [
        {
          key: 'metrics-gold-counters',
          nameEn: 'Golden Milestone Counters Grid',
          nameAr: 'أرقام وإنجازات المتجر الذهبية',
          badge: 'Milestones',
          descEn: 'Four animated milestone cards with orders delivered, ratings, and hotel hubs',
          descAr: '٤ بطاقات إحصائيات تبرز عدد الطلبات الناجحة ورضا ضيوف الحرم',
          presetSettings: { counterAnimation: true, columns: 4 },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-1.5 flex items-center justify-around border border-[#e6ca98]/40">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <div className="text-[8px] font-black text-[#e6ca98]">+٥٠٠</div>
                  <div className="h-1 w-6 bg-white/60 rounded-xs mx-auto mt-0.5" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 13. FAQ
    case 'faq':
      return [
        {
          key: 'faq-accordion-emerald',
          nameEn: 'Luxury Accordion with Search Bar',
          nameAr: 'الأكورديون الملكي القابل للتمدد مع البحث',
          badge: 'Accordion',
          descEn: 'Clean expandable FAQ accordion covering delivery, flowers, and payments',
          descAr: 'قائمة أسئلة وأجوبة منسدلة وسهلة الاستخدام لسرعة الإجابة على استفسارات النزلاء',
          presetSettings: { showSearch: true, allowMultipleOpen: false },
          previewSvg: (
            <div className="w-full h-14 bg-white rounded-lg p-1.5 flex flex-col justify-between border border-slate-200">
              <div className="h-3 w-full bg-slate-100 rounded-xs border border-slate-200 px-1 flex items-center justify-between text-[6px]">
                <span className="font-bold text-slate-700">كيف يتم التوصيل لفنادق الحرم؟</span>
                <span>+</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-xs border border-slate-200 px-1 flex items-center justify-between text-[6px]">
                <span className="font-bold text-slate-700">هل يمكن كتابة كرت إهداء مجاني؟</span>
                <span>+</span>
              </div>
            </div>
          ),
        },
      ];

    // 14. MAGAZINE & BLOG
    case 'magazine_section':
    case 'blog':
      return [
        {
          key: 'mag-editorial-3col',
          nameEn: 'Editorial 3-Column Articles Showcase',
          nameAr: 'مجلة المقالات التحريرية من ٣ أعمدة',
          badge: 'Editorial',
          descEn: 'Three editorial cards sharing flower care guides, fragrance tips, and gift etiquette',
          descAr: '٣ بطاقات مقالات أنيقة عن أسرار العناية بالورد وإتيكيت الإهداء بمكة',
          presetSettings: { columns: 3, showReadTime: true },
          previewSvg: (
            <div className="w-full h-14 bg-slate-50 rounded-lg p-1.5 flex gap-1 border border-slate-200">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 bg-white rounded-md border border-slate-200 p-1 flex flex-col justify-between">
                  <div className="h-4 bg-slate-100 rounded-xs" />
                  <div className="h-1 w-full bg-slate-700 rounded-xs" />
                  <div className="h-1 w-2/3 bg-slate-400 rounded-xs" />
                </div>
              ))}
            </div>
          ),
        },
      ];

    // 15. NEWSLETTER
    case 'newsletter':
      return [
        {
          key: 'news-vip-gold-banner',
          nameEn: 'Royal Emerald VIP Club Invitation',
          nameAr: 'نادي النخبة الملكي VIP مع قسيمة خصم',
          badge: 'VIP Club',
          descEn: 'Full bleed luxury emerald box offering instant 10% discount on subscription',
          descAr: 'صندوق اشتراك فاخر يمنح العميل قسيمة خصم فورية ١٠٪ على أول طلب',
          presetSettings: { bgColor: '#102a1c', textColor: '#FAF9F5', discountPercent: 10 },
          previewSvg: (
            <div className="w-full h-14 bg-[#102a1c] rounded-lg p-2 flex items-center justify-between border border-[#e6ca98]/50">
              <div className="space-y-1">
                <div className="h-2 w-24 bg-[#e6ca98] rounded-xs" />
                <div className="h-1.5 w-16 bg-white/50 rounded-xs" />
              </div>
              <div className="h-4 px-2 bg-[#e6ca98] text-[#102a1c] font-black text-[7px] flex items-center rounded-xs">
                اشترك الآن
              </div>
            </div>
          ),
        },
      ];

    // 16. FOOTER
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

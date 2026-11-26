<?php

namespace App\Support;

/**
 * Shared Customize Themes defaults for ALL theme-souq-common-* packs.
 * Mirror of src/themes/souqCommon/commonSettingsDefaults.ts (docs/37).
 *
 * @return array<string, mixed>
 */
final class SouqCommonSettingsDefaults
{
    public static function all(): array
    {
        return [
            'general' => [
                'arabicNumerals' => false,
                'preventImageDownload' => false,
                'preventDescriptionCopy' => false,
                'protectStoreContent' => false,
                'platformAttribution' => false,
                'breadcrumbs' => true,
                'autoAnimation' => true,
                'notifyMeOnCard' => true,
            ],
            'productCard' => [
                'equalHeightsHome' => true,
                'equalHeightsCategory' => true,
                'equalHeightsSliders' => true,
                'imageHeightUnits' => 17,
                'productsPerRow' => 4,
                'roundedCorners' => true,
                'borderEnabled' => false,
                'borderColor' => '#e5e7eb',
                'imageFit' => 'cover',
                'hoverAnimation' => true,
                'hoverZoom' => false,
            ],
            'header' => [
                'showLogo' => true,
                'whiteLogoUrl' => '',
                'logoWidth' => 0,
                'logoHeight' => 48,
                'centerLogo' => false,
                'sidebarMenuDesktop' => false,
                'defaultMenu' => true,
                'stickyNav' => true,
                'transparentMenu' => false,
                'moreCategoriesEnabled' => true,
                'categoriesBeforeMore' => 8,
                'hideTopBar' => false,
                'hideImportantLinks' => false,
                'hideSocial' => false,
                'darkTopBar' => false,
                'backgroundColor' => '#ffffff',
                'textColor' => '#272a32',
                'cartIconStyle' => 'bag',
            ],
            'footer' => [
                'showLogo' => true,
                'logoUrl' => '',
                'logoWidth' => 0,
                'logoHeight' => 64,
                'bottomMenu' => true,
                'footerLinks' => true,
                'forceDark' => false,
                'backgroundColor' => '#f3f4f6',
                'textColor' => '#374151',
                'bottomBarBackground' => '#e5e7eb',
                'centerContent' => false,
                'traditionalLayout' => true,
                'importantLinksTwoColumns' => false,
                'importantLinksBullets' => false,
                'enhancedSocialIcons' => true,
                'circularSocialIcons' => true,
                'contactAsIcons' => true,
                'contactTitleEn' => '',
                'contactTitleAr' => '',
                'showSmallBusinessVerification' => false,
                'showVerificationNumber' => false,
            ],
            'productPage' => [
                'showTags' => true,
                'showShortDescription' => true,
                'showFullDescription' => true,
                'fullDescriptionPosition' => 'below_title',
            ],
            'whatsapp' => [
                'enabled' => true,
                'number' => '',
                'messageEn' => '',
                'messageAr' => '',
                'positionRight' => true,
            ],
            'background' => [
                'imageEnabled' => false,
                'imageUrl' => '',
            ],
            'branding' => [
                'fontFamily' => 'Tajawal',
                'primaryColor' => '#0f766e',
            ],
            'colors' => [
                'enableModeSwitch' => true,
                'forceDark' => false,
                'light' => [
                    'background' => '#ffffff',
                    'backgroundSecondary' => '#ffffff',
                    'text' => '#111827',
                    'textSecondary' => '#4b5563',
                    'headerBg' => '#ffffff',
                    'headerText' => '#272a32',
                    'productCardBg' => '#ffffff',
                    'promoLabelBg' => '#ef4444',
                    'footerBg' => '#f3f4f6',
                    'footerText' => '#374151',
                ],
                'dark' => [
                    'background' => '#1d1f1f',
                    'backgroundSecondary' => '#0e0f0f',
                    'text' => '#ffffff',
                    'textSecondary' => '#cccccc',
                    'headerBg' => '#0e0f0f',
                    'headerText' => '#ffffff',
                    'productCardBg' => '#1d1f1f',
                    'promoLabelBg' => '#ef4444',
                    'footerBg' => '#0e0f0f',
                    'footerText' => '#cccccc',
                ],
            ],
            'chrome' => [
                'mergeHeaderHero' => false,
                'darkTransparentOverlay' => false,
                'alternativeLogoUrl' => '',
            ],
        ];
    }

    /**
     * Default Page Builder home for common Souq themes (easiest style per section).
     * Mirror: src/themes/souqCommon/defaultHomeBlocks.ts — not flagship flora/coffee/car.
     *
     * @return list<array<string, mixed>>
     */
    public static function defaultBuilderBlocks(string $storeNameEn, string $storeNameAr, string $accent = '#0f766e'): array
    {
        $nameEn = $storeNameEn !== '' ? $storeNameEn : 'Souq Store';
        $nameAr = $storeNameAr !== '' ? $storeNameAr : 'متجر سوق';

        return [
            [
                'id' => 'header',
                'type' => 'header',
                'titleEn' => 'Store Header ('.$nameEn.')',
                'titleAr' => 'رأس المتجر والقائمة ('.$nameAr.')',
                'visible' => true,
                'templateStyle' => 'header-souq-common',
                'settings' => [
                    'bgColor' => '#ffffff',
                    'textColor' => '#272a32',
                    'accentColor' => $accent,
                    'stickyHeader' => true,
                ],
            ],
            [
                'id' => 'hero_slider',
                'type' => 'hero_slider',
                'titleEn' => 'Hero Slider',
                'titleAr' => 'شريط الواجهة',
                'visible' => true,
                'templateStyle' => 'hero-souq-common',
                'settings' => [
                    'slides' => [
                        [
                            'imageUrl' => '/images/saudi_hero_banner_2.jpg',
                            'titleEn' => 'Welcome to '.$nameEn,
                            'titleAr' => 'مرحباً بكم في '.$nameAr,
                            'subtitleEn' => 'Quality products with fast delivery across Saudi Arabia',
                            'subtitleAr' => 'منتجات موثوقة وتوصيل سريع لجميع مدن المملكة',
                            'ctaEn' => 'Shop now',
                            'ctaAr' => 'تسوق الآن',
                            'ctaHref' => '/shop',
                        ],
                        [
                            'imageUrl' => '/images/saudi_hero_banner_3.jpg',
                            'titleEn' => 'Shop with Confidence in KSA',
                            'titleAr' => 'تسوق بثقة في المملكة',
                            'subtitleEn' => 'Secure payments · Nationwide shipping',
                            'subtitleAr' => 'دفع آمن · شحن لكل مناطق المملكة',
                            'ctaEn' => 'Browse catalog',
                            'ctaAr' => 'تصفح الكتالوج',
                            'ctaHref' => '/shop',
                        ],
                    ],
                ],
            ],
            [
                'id' => 'store_features_bar',
                'type' => 'store_features_bar',
                'titleEn' => 'Store Features',
                'titleAr' => 'مميزات المتجر',
                'visible' => true,
                'templateStyle' => 'classic_cards',
                'settings' => [
                    'selected_template' => 'classic_cards',
                    'titleEn' => 'Why shop with us?',
                    'titleAr' => 'لماذا تتسوق معنا؟',
                ],
            ],
            [
                'id' => 'circle_categories',
                'type' => 'circle_categories',
                'titleEn' => 'Categories',
                'titleAr' => 'التصنيفات',
                'visible' => true,
                'templateStyle' => 'cats-souq-common',
                'settings' => [
                    'titleEn' => 'Shop by category',
                    'titleAr' => 'تسوق حسب التصنيف',
                ],
            ],
            [
                'id' => 'featured_products',
                'type' => 'featured_products',
                'titleEn' => 'Featured Products',
                'titleAr' => 'منتجات مميزة',
                'visible' => true,
                'templateStyle' => 'featured-grid',
                'settings' => [
                    'titleEn' => 'Featured Products',
                    'titleAr' => 'منتجات مميزة',
                    'limit' => 8,
                    'columns' => 4,
                    'layout' => 'grid',
                ],
            ],
            [
                'id' => 'shop_by_category',
                'type' => 'shop_by_category',
                'titleEn' => 'Shop by Category',
                'titleAr' => 'تسوق حسب الأقسام',
                'visible' => true,
                'templateStyle' => 'cats-cards-simple',
                'settings' => [
                    'titleEn' => 'Browse categories',
                    'titleAr' => 'تصفح الأقسام',
                ],
            ],
            [
                'id' => 'promo_countdown_banner',
                'type' => 'promo_countdown_banner',
                'titleEn' => 'Special Offer',
                'titleAr' => 'عرض خاص',
                'visible' => true,
                'templateStyle' => 'countdown-simple',
                'settings' => [
                    'titleEn' => 'Limited-time offer',
                    'titleAr' => 'عرض لفترة محدودة',
                ],
            ],
            [
                'id' => 'promotions',
                'type' => 'promotions',
                'titleEn' => 'Promotions',
                'titleAr' => 'عروض',
                'visible' => true,
                'templateStyle' => 'promo-banner',
                'settings' => [
                    'titleEn' => 'Promotions',
                    'titleAr' => 'عروض',
                    'limit' => 8,
                    'layout' => 'grid',
                ],
            ],
            [
                'id' => 'metrics_section',
                'type' => 'metrics_section',
                'titleEn' => 'Store Statistics',
                'titleAr' => 'إحصائيات المتجر',
                'visible' => true,
                'templateStyle' => 'classic_cards',
                'settings' => [
                    'selected_template' => 'classic_cards',
                    'titleEn' => 'Store at a glance',
                    'titleAr' => 'نظرة على المتجر',
                    'useRealStoreCounts' => true,
                ],
            ],
            [
                'id' => 'testimonials',
                'type' => 'testimonials',
                'titleEn' => 'Customer Reviews',
                'titleAr' => 'آراء العملاء',
                'visible' => true,
                'templateStyle' => 'reviews-simple',
                'settings' => [],
            ],
            [
                'id' => 'newsletter',
                'type' => 'newsletter',
                'titleEn' => 'Newsletter',
                'titleAr' => 'النشرة البريدية',
                'visible' => true,
                'templateStyle' => 'newsletter-simple',
                'settings' => [
                    'titleEn' => 'Get offers & new arrivals',
                    'titleAr' => 'احصل على العروض والمنتجات الجديدة',
                ],
            ],
            [
                'id' => 'footer',
                'type' => 'footer',
                'titleEn' => 'Store Footer ('.$nameEn.')',
                'titleAr' => 'تذييل المتجر ('.$nameAr.')',
                'visible' => true,
                'templateStyle' => 'footer-souq-common',
                'settings' => [],
            ],
        ];
    }
}

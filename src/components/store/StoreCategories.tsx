import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import type { CategoryFieldType, StoreCategory } from '../../types';
import { getCategoryDepth, parentPickerOptions } from '../../utils/categoryHierarchy';
import { FolderTree, Plus, Pencil, Trash2, X, Flower2, Layers, CheckCircle2, Tag } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../common/ToastProvider';
import { resolveSubscription } from '../../auth/subscriptions';
import { isApiEnabled } from '../../api/client';
import * as tenantApi from '../../api/tenantApi';
import { bumpStore } from '../../api/cacheTags';
import {
  AdvancedDataTable,
  type AdvancedTableColumn,
} from '../common/AdvancedDataTable';
import { MediaUploadField } from '../common/MediaUploadField';
import { ConnectedWorkspaceBanner } from '../common/ConnectedWorkspaceBanner';
import { COFFEE_CATEGORIES_SEED } from '../../data/coffeeStoreData';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';
import { toUserFriendlyError } from '../../utils/userFriendlyError';

type FormState = {
  name: string;
  nameAr: string;
  slug: string;
  parentId: string;
  imageUrl: string;
  sortOrder: string;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  name: '',
  nameAr: '',
  slug: '',
  parentId: '',
  imageUrl: '',
  sortOrder: '10',
  metaTitle: '',
  metaDescription: '',
  isActive: true,
});

function formFrom(c: StoreCategory): FormState {
  return {
    name: c.name,
    nameAr: c.nameAr ?? '',
    slug: c.slug,
    parentId: c.parentId ?? '',
    imageUrl: c.imageUrl ?? '',
    sortOrder: String(c.sortOrder),
    metaTitle: c.metaTitle ?? '',
    metaDescription: c.metaDescription ?? '',
    isActive: c.isActive,
  };
}

/** Hierarchy aligned with database/hostinger/02_seed.sql + DatabaseSeeder.php */
export const MECCA_CATEGORIES_SEED: StoreCategory[] = [
  // --- Parent groups ---
  {
    id: 'cat-group-flowers',
    storeId: 'store-1',
    parentId: null,
    name: 'Natural Flowers',
    nameAr: 'الزهور الطبيعية',
    slug: 'natural-flowers',
    imageUrl: 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png',
    sortOrder: 1,
    metaTitle: 'الزهور الطبيعية | هدايا مكة',
    metaDescription: 'باقات وفازات ورود طبيعية وتنسيقات مبتكرة في مكة المكرمة.',
    metaTitleEn: 'Natural Flowers | Hadaya Makkah',
    metaDescriptionEn: 'Natural rose bouquets, vases, and creative floral arrangements in Makkah.',
    isActive: true,
  },
  {
    id: 'cat-group-chocolate',
    storeId: 'store-1',
    parentId: null,
    name: 'Roses and Chocolate',
    nameAr: 'ورد وشوكولاتة',
    slug: 'roses-and-chocolate',
    imageUrl: 'https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png',
    sortOrder: 2,
    metaTitle: 'ورد وشوكولاتة | هدايا مكة',
    metaDescription: 'تنسيقات الورد مع شوكولاتة باتشي وبستاني الفاخرة.',
    metaTitleEn: 'Roses and Chocolate | Hadaya Makkah',
    metaDescriptionEn: 'Rose arrangements with luxury Patchi and Bostani chocolates.',
    isActive: true,
  },
  {
    id: 'cat-group-hospitality',
    storeId: 'store-1',
    parentId: null,
    name: 'Hospitality Presents',
    nameAr: 'تقديمات الضيافة',
    slug: 'hospitality-presents',
    imageUrl: 'https://cdn.salla.sa/form-builder/2fomvXwpTYOOx8h3JMZGP3r5dnXelUxxIUDuzepj.png',
    sortOrder: 3,
    metaTitle: 'تقديمات الضيافة | هدايا مكة',
    metaDescription: 'تقديمات ورد وقهوة وحلا وكيك للضيافة الحجازية الأصيلة.',
    metaTitleEn: 'Hospitality Presents | Hadaya Makkah',
    metaDescriptionEn: 'Roses with coffee, sweets, and cakes for authentic Hijazi hospitality.',
    isActive: true,
  },
  {
    id: 'cat-group-occasions',
    storeId: 'store-1',
    parentId: null,
    name: 'Occasions',
    nameAr: 'المناسبات',
    slug: 'occasions',
    imageUrl: 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png',
    sortOrder: 4,
    metaTitle: 'هدايا المناسبات | هدايا مكة',
    metaDescription: 'هدايا المواليد والتخرج وعيد الحب والزواج وأعياد الميلاد.',
    metaTitleEn: 'Occasion Gifts | Hadaya Makkah',
    metaDescriptionEn: 'Gifts for newborns, graduation, Valentine, weddings, and birthdays.',
    isActive: true,
  },
  {
    id: 'cat-group-luxury',
    storeId: 'store-1',
    parentId: null,
    name: 'Luxury Gifts',
    nameAr: 'الهدايا الفاخرة',
    slug: 'luxury-gifts',
    imageUrl: '/images/hadaya_men_luxury_gift_1791219799100.jpg',
    sortOrder: 5,
    metaTitle: 'الهدايا الفاخرة | هدايا مكة',
    metaDescription: 'أطقم هدايا رجالية ونسائية ملكية مع ورد طبيعي.',
    metaTitleEn: 'Luxury Gifts | Hadaya Makkah',
    metaDescriptionEn: 'Royal men and women gift sets with natural flowers.',
    isActive: true,
  },

  // --- Natural Flowers children ---
  {
    id: 'cat-nat-bouquets',
    storeId: 'store-1',
    parentId: 'cat-group-flowers',
    name: 'Natural Flower Bouquets',
    nameAr: 'باقات الورود الطبيعية',
    slug: 'natural-bouquets',
    imageUrl: 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png',
    sortOrder: 1,
    metaTitle: 'باقات الورود الطبيعية | هدايا مكة',
    metaDescription: 'أجود باقات الورد الطبيعي الهولندي والإكوادوري في مكة المكرمة.',
    metaTitleEn: 'Natural Flower Bouquets | Hadaya Makkah',
    metaDescriptionEn: 'Premium Dutch and Ecuadorian natural rose bouquets in Makkah.',
    isActive: true,
  },
  {
    id: 'cat-flower-vases',
    storeId: 'store-1',
    parentId: 'cat-group-flowers',
    name: 'Natural Flower Vases',
    nameAr: 'فازات ورد طبيعي',
    slug: 'flower-vases',
    imageUrl: 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png',
    sortOrder: 2,
    metaTitle: 'فازات ورد طبيعي كريستال | هدايا مكة',
    metaDescription: 'فازات كريستالية وسيراميك راقية لتزيين المجالس وطاولات القهوة.',
    metaTitleEn: 'Crystal Natural Flower Vases | Hadaya Makkah',
    metaDescriptionEn: 'Elegant crystal and ceramic vases for majlis and coffee tables.',
    isActive: true,
  },
  {
    id: 'cat-vases-chocolate',
    storeId: 'store-1',
    parentId: 'cat-group-flowers',
    name: 'Flower Vases with Chocolate',
    nameAr: 'فازات الورود مع شوكليت',
    slug: 'vases-chocolate',
    imageUrl: 'https://cdn.salla.sa/form-builder/qk6gpVW76xoVeFb6kZrmFFGOFOXQ4q8JalQmKw0R.png',
    sortOrder: 3,
    metaTitle: 'فازات الورود مع الشوكولاتة | هدايا مكة',
    metaDescription: 'توليفة فخمة تجمع بين الفازات الكريستالية والشوكولاتة السويسرية.',
    metaTitleEn: 'Flower Vases with Chocolate | Hadaya Makkah',
    metaDescriptionEn: 'Luxury crystal vases paired with Swiss chocolate.',
    isActive: true,
  },
  {
    id: 'cat-roses-fish',
    storeId: 'store-1',
    parentId: 'cat-group-flowers',
    name: 'Roses with Aquarium Fish',
    nameAr: 'ورود مع أسماك زينة',
    slug: 'roses-fish',
    imageUrl: 'https://cdn.salla.sa/form-builder/ykMusuoNPFuZdMPHsJcYHJb6fejLSpaoSZxKGAwh.png',
    sortOrder: 4,
    metaTitle: 'ورود مع أسماك زينة هدايا مبتكرة | هدايا مكة',
    metaDescription: 'ابتكار حجازي فريد يجمع بين حوض أسماك الزينة وتنسيق الزهور الطبيعية.',
    metaTitleEn: 'Roses with Aquarium Fish | Hadaya Makkah',
    metaDescriptionEn: 'Unique Hijazi gifts combining aquarium fish with natural flowers.',
    isActive: true,
  },
  {
    id: 'cat-roses-lovebirds',
    storeId: 'store-1',
    parentId: 'cat-group-flowers',
    name: 'Roses with Lovebirds',
    nameAr: 'ورود مع عصافير الحب',
    slug: 'roses-lovebirds',
    imageUrl: 'https://cdn.salla.sa/form-builder/dZpSzihLrTks3koUrmlpfNV0AcHVSx3bE1KNFQTQ.png',
    sortOrder: 5,
    metaTitle: 'ورود مع عصافير الحب | هدايا مكة',
    metaDescription: 'هدية رومانسية حية مع قفص عصافير الحب وباقة الجوري الفاتنة.',
    metaTitleEn: 'Roses with Lovebirds | Hadaya Makkah',
    metaDescriptionEn: 'Living romantic gift with lovebirds and a stunning rose bouquet.',
    isActive: true,
  },

  // --- Roses and Chocolate children ---
  {
    id: 'cat-roses-patchi',
    storeId: 'store-1',
    parentId: 'cat-group-chocolate',
    name: 'Roses & Patchi Chocolate',
    nameAr: 'ورد و شوكليت باتشي',
    slug: 'roses-patchi',
    imageUrl: 'https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png',
    sortOrder: 1,
    metaTitle: 'ورد وشوكولاتة باتشي | هدايا مكة',
    metaDescription: 'تناغم شوكولاتة باتشي الفاخرة وباقات الجوري الملكية.',
    metaTitleEn: 'Roses & Patchi Chocolate | Hadaya Makkah',
    metaDescriptionEn: 'Luxury Patchi chocolate paired with royal rose bouquets.',
    isActive: true,
  },
  {
    id: 'cat-roses-bostani',
    storeId: 'store-1',
    parentId: 'cat-group-chocolate',
    name: 'Roses & Bostani Chocolate',
    nameAr: 'ورد وشوكوليت بستاني',
    slug: 'roses-bostani',
    imageUrl: 'https://cdn.salla.sa/form-builder/JEDxluyY7LbYdo5So7sLrPqqupntM3LUhIxV3gXD.png',
    sortOrder: 2,
    metaTitle: 'ورد وشوكوليت بستاني الفاخر | هدايا مكة',
    metaDescription: 'شوكولاتة بستاني البلجيكية الراقية مع تنسيق الجوري الزهري.',
    metaTitleEn: 'Roses & Bostani Chocolate | Hadaya Makkah',
    metaDescriptionEn: 'Belgian Bostani chocolate with elegant rose arrangements.',
    isActive: true,
  },

  // --- Hospitality children ---
  {
    id: 'cat-roses-coffee',
    storeId: 'store-1',
    parentId: 'cat-group-hospitality',
    name: 'Roses & Coffee Presentation',
    nameAr: 'تقديمة ورد وقهوة',
    slug: 'roses-coffee',
    imageUrl: 'https://cdn.salla.sa/form-builder/2fomvXwpTYOOx8h3JMZGP3r5dnXelUxxIUDuzepj.png',
    sortOrder: 1,
    metaTitle: 'تقديمة ورد وقهوة سعودية أصيلة | هدايا مكة',
    metaDescription: 'أصالة الضيافة الحجازية مع القهوة المختصة والزهور الطبيعية.',
    metaTitleEn: 'Roses & Saudi Coffee Presentation | Hadaya Makkah',
    metaDescriptionEn: 'Authentic Hijazi hospitality with specialty coffee and natural flowers.',
    isActive: true,
  },
  {
    id: 'cat-roses-coffee-sweets',
    storeId: 'store-1',
    parentId: 'cat-group-hospitality',
    name: 'Roses with Coffee & Sweets',
    nameAr: 'تقديمة ورد مع قهوة وحلا',
    slug: 'roses-coffee-sweets',
    imageUrl: 'https://cdn.salla.sa/form-builder/zf3HeZ6jT4wON2ZEbeJfdMTc4bMLWQLkFvCndepr.png',
    sortOrder: 2,
    metaTitle: 'تقديمة ورد مع قهوة وحلا | هدايا مكة',
    metaDescription: 'صينية الضيافة الملكية بالقهوة والحلويات الفاخرة وباقة الورد.',
    metaTitleEn: 'Roses with Coffee & Sweets | Hadaya Makkah',
    metaDescriptionEn: 'Royal hospitality tray with coffee, sweets, and a rose bouquet.',
    isActive: true,
  },
  {
    id: 'cat-roses-cake',
    storeId: 'store-1',
    parentId: 'cat-group-hospitality',
    name: 'Roses with Gourmet Cake',
    nameAr: 'ورد مع كيك',
    slug: 'roses-cake',
    imageUrl: 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png',
    sortOrder: 3,
    metaTitle: 'ورد وكيك احتفال | هدايا مكة',
    metaDescription: 'كعكات الريد فيلفت والميلاد مع باقات الورد الجوري الملكي.',
    metaTitleEn: 'Roses & Celebration Cake | Hadaya Makkah',
    metaDescriptionEn: 'Red velvet and birthday cakes with royal rose bouquets.',
    isActive: true,
  },
  {
    id: 'cat-korean-cake',
    storeId: 'store-1',
    parentId: 'cat-group-hospitality',
    name: 'Korean Lunchbox Bento Cake',
    nameAr: 'تقديمة كيك الكوري',
    slug: 'korean-cake',
    imageUrl: 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png',
    sortOrder: 4,
    metaTitle: 'تقديمة كيك الكوري اللطيف | هدايا مكة',
    metaDescription: 'بينتو كيك كوري لعبارات الحب والمفاجآت مع باقة ورد يد صغيرة.',
    metaTitleEn: 'Korean Lunchbox Bento Cake | Hadaya Makkah',
    metaDescriptionEn: 'Cute Korean bento cakes for love notes and surprises with mini roses.',
    isActive: true,
  },

  // --- Occasions children ---
  {
    id: 'cat-mawajeeb',
    storeId: 'store-1',
    parentId: 'cat-group-occasions',
    name: 'Mawajeeb Wooden Plaques & Heritage',
    nameAr: 'لوحات مواجيب وتراث حجازي',
    slug: 'mawajeeb',
    imageUrl: 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp',
    sortOrder: 1,
    metaTitle: 'لوحات مواجيب | هدايا مكة',
    metaDescription: 'لوحات تذكارية وتراث حجازي عريق مع ورد وبخور مروكي.',
    metaTitleEn: 'Mawajeeb Wooden Plaques | Hadaya Makkah',
    metaDescriptionEn: 'Hijazi heritage commemorative plaques with roses and Maroki oud.',
    isActive: true,
  },
  {
    id: 'cat-newborn',
    storeId: 'store-1',
    parentId: 'cat-group-occasions',
    name: 'Newborn Welcome Gifts',
    nameAr: 'هدايا المواليد',
    slug: 'newborn',
    imageUrl: 'https://cdn.salla.sa/form-builder/h7hTylc4cMiriSfxe2sGsX0mL5Sc7akjxHAAUqHp.png',
    sortOrder: 2,
    metaTitle: 'هدايا استقبال المواليد | هدايا مكة',
    metaDescription: 'باقات ودببة ناعمة وستاندات استقبال المواليد الجدد في المشافي والمنازل.',
    metaTitleEn: 'Newborn Welcome Gifts | Hadaya Makkah',
    metaDescriptionEn: 'Soft bouquets, bears, and welcome stands for newborns at hospitals and homes.',
    isActive: true,
  },
  {
    id: 'cat-graduation',
    storeId: 'store-1',
    parentId: 'cat-group-occasions',
    name: 'Graduation Milestones',
    nameAr: 'هدايا التخرج',
    slug: 'graduation',
    imageUrl: 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png',
    sortOrder: 3,
    metaTitle: 'هدايا التخرج الملكية | هدايا مكة',
    metaDescription: 'باقات تخرج مذهبة مع قبعة ووشاح وبوكسات شوكولاتة باتشي.',
    metaTitleEn: 'Royal Graduation Gifts | Hadaya Makkah',
    metaDescriptionEn: 'Gilded graduation bouquets with cap, sash, and Patchi chocolate boxes.',
    isActive: true,
  },
  {
    id: 'cat-valentine',
    storeId: 'store-1',
    parentId: 'cat-group-occasions',
    name: 'Valentine & Love Blooms',
    nameAr: 'هدايا عيد الحب',
    slug: 'valentine',
    imageUrl: 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png',
    sortOrder: 4,
    metaTitle: 'هدايا عيد الحب والرومانسية | هدايا مكة',
    metaDescription: 'أجمل بوكسات الورد الأحمر المخملي والشوكولاتة البلجيكية الفاخرة.',
    metaTitleEn: 'Valentine & Romance Gifts | Hadaya Makkah',
    metaDescriptionEn: 'Velvet red rose boxes and luxury Belgian chocolate for Valentine.',
    isActive: true,
  },
  {
    id: 'cat-wedding',
    storeId: 'store-1',
    parentId: 'cat-group-occasions',
    name: 'Wedding & Bridal Keepsakes',
    nameAr: 'هدايا الزواج والعرائس',
    slug: 'wedding',
    imageUrl: 'https://cdn.salla.sa/form-builder/Z8aMbQ8cDkf9OnQakCZwnH4GvpnqLlXsCqBk70ik.png',
    sortOrder: 5,
    metaTitle: 'مسكات وباقات عرائس الزواج | هدايا مكة',
    metaDescription: 'مسكات العرائس الفاخرة باللؤلؤ والزهور الإكوادورية البيضاء المستوردة.',
    metaTitleEn: 'Wedding & Bridal Keepsakes | Hadaya Makkah',
    metaDescriptionEn: 'Luxury bridal bouquets with pearls and imported Ecuadorian white flowers.',
    isActive: true,
  },
  {
    id: 'cat-birthday',
    storeId: 'store-1',
    parentId: 'cat-group-occasions',
    name: 'Birthday Celebrations',
    nameAr: 'هدايا عيد ميلاد',
    slug: 'birthday',
    imageUrl: 'https://cdn.salla.sa/form-builder/nm5BDgkXRslZvqTetu5wTrCTTTTLTrsBhWwjHMyI.png',
    sortOrder: 6,
    metaTitle: 'هدايا عيد ميلاد مميزة | هدايا مكة',
    metaDescription: 'مفاجآت أعياد الميلاد مع الكيك والبالونات الهيليوم وباقات الورد المبهجة.',
    metaTitleEn: 'Birthday Celebration Gifts | Hadaya Makkah',
    metaDescriptionEn: 'Birthday surprises with cake, helium balloons, and cheerful rose bouquets.',
    isActive: true,
  },

  // --- Luxury Gifts children ---
  {
    id: 'cat-men-gifts',
    storeId: 'store-1',
    parentId: 'cat-group-luxury',
    name: 'Royal Men Luxury Gifts',
    nameAr: 'هدايا رجالية ملكية',
    slug: 'men-gifts',
    imageUrl: '/images/hadaya_men_luxury_gift_1791219799100.jpg',
    sortOrder: 1,
    metaTitle: 'أطقم هدايا رجالية فاخرة | هدايا مكة',
    metaDescription: 'صناديق جلدية ملكية تضم عطور وساعات ومحافظ فاخرة مع ورد طبيعي.',
    metaTitleEn: 'Royal Men Luxury Gift Sets | Hadaya Makkah',
    metaDescriptionEn: 'Royal leather boxes with perfume, watches, wallets, and natural roses.',
    isActive: true,
  },
  {
    id: 'cat-women-gifts',
    storeId: 'store-1',
    parentId: 'cat-group-luxury',
    name: 'Luxury Women Gifts & Perfumes',
    nameAr: 'هدايا نسائية فاخرة',
    slug: 'women-gifts',
    imageUrl: 'https://cdn.files.salla.network/homepage/246985580/67a93505-20fe-4f5e-ad46-0e0b1d2c4390.webp',
    sortOrder: 2,
    metaTitle: 'أطقم هدايا نسائية راقية | هدايا مكة',
    metaDescription: 'صناديق مخملية تضم عطور ومجوهرات زركون مع زهور البيوني الفاتنة.',
    metaTitleEn: 'Luxury Women Gift Sets | Hadaya Makkah',
    metaDescriptionEn: 'Velvet boxes with perfume, zircon jewelry, and peony blooms.',
    isActive: true,
  },
];

const BLECO_CATEGORIES_SEED: StoreCategory[] = [
  {
    id: 'cat-blc-1',
    storeId: 'store-bleco',
    parentId: null,
    name: 'Custom Tailored Seat Covers',
    nameAr: 'تنجيد وتلابيس المقاعد',
    slug: 'seat-covers',
    imageUrl: '/images/categories/vip-luxury-seat-covers.jpg',
    sortOrder: 10,
    metaTitle: 'تنجيد وتلابيس المقاعد | متجر السعيدي',
    metaDescription: 'تفصيل وتنجيد مقاعد كامل بأفخر أنواع الجلود الألمانية والأصلية مع تطريز ليزري فائق الدقة مطابق للوكالة.',
    metaTitleEn: 'Custom Tailored Seat Covers | Al-Saeedi Store',
    metaDescriptionEn: 'Full custom seat upholstery in premium German leather with laser embroidery matching OEM specs.',
    isActive: true,
  },
  {
    id: 'cat-blc-2',
    storeId: 'store-bleco',
    parentId: null,
    name: '5D Diamond & Laser Floor Mats',
    nameAr: 'أرضيات ودعاسات السيارات 5D',
    slug: 'floor-mats',
    imageUrl: '/images/categories/vip-5d-laser-mats.jpg',
    sortOrder: 20,
    metaTitle: 'أرضيات ودعاسات 5D ليزر ودايموند | متجر السعيدي',
    metaDescription: 'أرضيات تفصيل ليزري تغطي كامل مساحة السيارة مع حماية متعددة الطبقات وعازل تام للسوائل والأتربة.',
    metaTitleEn: '5D Diamond & Laser Floor Mats | Al-Saeedi Store',
    metaDescriptionEn: 'Laser-cut full-coverage mats with multi-layer protection against liquids and dust.',
    isActive: true,
  },
  {
    id: 'cat-blc-3',
    storeId: 'store-bleco',
    parentId: null,
    name: 'Car Air Fresheners & Diffusers',
    nameAr: 'معطرات وفواحات السيارة',
    slug: 'car-perfumes',
    imageUrl: 'https://cdn.salla.sa/form-builder/IVTOvvJou4NZ9Q3cEmXACGOBbO8BoyoEsFVAOCcF.png',
    sortOrder: 30,
    metaTitle: 'معطرات وفواحات السيارة الذكية | متجر السعيدي',
    metaDescription: 'فواحات إلكترونية ذكية وزيوت عطرية فرنسية تدوم طويلاً صممت خصيصاً لأجواء الخليج.',
    metaTitleEn: 'Smart Car Air Fresheners & Diffusers | Al-Saeedi Store',
    metaDescriptionEn: 'Smart electronic diffusers and long-lasting French oils for Gulf climates.',
    isActive: true,
  },
  {
    id: 'cat-blc-4',
    storeId: 'store-bleco',
    parentId: null,
    name: 'Car Care & Detailing',
    nameAr: 'منتجات العناية والتلميع',
    slug: 'car-care',
    imageUrl: 'https://cdn.salla.sa/form-builder/0xGu1lj6oQ9nIXWfxRFbittuB7rSuKTCmXoE6Z7q.png',
    sortOrder: 40,
    metaTitle: 'منتجات العناية بالسيارات والتلميع | متجر السعيدي',
    metaDescription: 'شامبوهات نانو وملمعات جلد وطبلون وكفرات احترافية تحافظ على لمعان الوكالة.',
    metaTitleEn: 'Car Care & Detailing Products | Al-Saeedi Store',
    metaDescriptionEn: 'Nano shampoos and pro leather, dashboard, and tire polishes that keep OEM shine.',
    isActive: true,
  },
  {
    id: 'cat-blc-5',
    storeId: 'store-bleco',
    parentId: null,
    name: 'Accessories & Styling',
    nameAr: 'زينة واكسسوارات السيارات',
    slug: 'car-accessories',
    imageUrl: 'https://cdn.salla.sa/form-builder/372cyi5v5BTgsLSjPKuqdfKVNWAXPPyz8ewDjjL1.png',
    sortOrder: 50,
    metaTitle: 'زينة واكسسوارات السيارات الفاخرة | متجر السعيدي',
    metaDescription: 'ستائر تظليل ليزر، شماسات عازلة للشمس، قواعد جوال، ومبردات متنقلة.',
    metaTitleEn: 'Luxury Car Accessories & Styling | Al-Saeedi Store',
    metaDescriptionEn: 'Laser tint curtains, sun shields, phone mounts, and portable coolers.',
    isActive: true,
  },
  {
    id: 'cat-blc-6',
    storeId: 'store-bleco',
    parentId: null,
    name: 'Upholstery Supplies & Hardware',
    nameAr: 'أدوات ومستلزمات التنجيد',
    slug: 'upholstery-tools',
    imageUrl: 'https://cdn.salla.sa/form-builder/mNJjSTAsIGTtdLFZPSFU11iZvndiKha2mxuG9HJp.png',
    sortOrder: 60,
    metaTitle: 'أدوات ومستلزمات التنجيد والتركيب | متجر السعيدي',
    metaDescription: 'مبارم وكلبسات ومشدات تثبيت مراتب أصلية مع أدوات الفك والتركيب بدون خدوش.',
    metaTitleEn: 'Upholstery Supplies & Hardware | Al-Saeedi Store',
    metaDescriptionEn: 'OEM clips, fasteners, and install tools for scratch-free upholstery work.',
    isActive: true,
  },
];

const MOCK_SEED: StoreCategory[] = MECCA_CATEGORIES_SEED;

export const StoreCategories: React.FC = () => {
  const { activeStore } = useTenant();
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { canWrite } = usePermissions();
  const { toast } = useToast();
  const canEdit = canWrite('products');
  const sub = resolveSubscription(activeStore.id);
  const canMutate = canEdit && sub.writable;

  const [rows, setRows] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  type FieldDraft = {
    id?: string;
    nameEn: string;
    nameAr: string;
    fieldType: CategoryFieldType;
    optionsText: string;
    sort: string;
    active: boolean;
  };
  const [fieldDrafts, setFieldDrafts] = useState<FieldDraft[]>([]);

  const [search, setSearch] = useState('');
  const [parentFilter, setParentFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string | null>('sortOrder');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (isApiEnabled()) {
        try {
          const list = await tenantApi.fetchCategories(activeStore.id, { all: true });
          if (Array.isArray(list) && list.length > 0) {
            setRows(list);
            return;
          }
        } catch (apiErr) {
          console.warn('[StoreCategories] Live API categories fetch notice:', apiErr);
        }
      }

      const savedKey = `unityteck_store_categories_${activeStore.id}`;
      let savedList: StoreCategory[] | null = null;
      try {
        const raw = localStorage.getItem(savedKey);
        if (raw) savedList = JSON.parse(raw);
      } catch {}
      if (savedList && Array.isArray(savedList) && savedList.length > 0) {
        if (activeStore.id === 'store-coffee' && (savedList.length < 5 || savedList.some((c) => c.id === 'cat-cof-1'))) {
          savedList = null;
        }
        // Discard flat dummy Mecca seed (c-1..c-19) and replace with hierarchical cat-* seed
        if (
          savedList &&
          savedList.some((c) => /^c-\d+$/.test(c.id))
        ) {
          savedList = null;
        }
      }
      if (savedList && Array.isArray(savedList) && savedList.length > 0) {
        setRows(savedList);
      } else {
        const seed =
          activeStore.id === 'store-coffee'
            ? COFFEE_CATEGORIES_SEED
            : activeStore.id === 'store-bleco'
            ? BLECO_CATEGORIES_SEED
            : activeStore.id === 'store-1' || activeStore.id === 'store-mecca'
            ? MECCA_CATEGORIES_SEED
            : [];
        const mapped = seed.map((c) => ({ ...c, storeId: activeStore.id }));
        setRows(mapped);
        try {
          localStorage.setItem(savedKey, JSON.stringify(mapped));
        } catch {}
      }
    } catch (err) {
      setError(
        toUserFriendlyError(
          err instanceof Error ? err.message : 'Failed to load categories',
        ),
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeStore.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onData = (e: Event) => {
      const tag = String((e as CustomEvent).detail?.tag ?? '');
      if (
        tag.includes(`:${activeStore.id}:categories`) ||
        tag.includes(`:${activeStore.id}:products`) ||
        tag === 'soft-refresh'
      ) {
        void load(true);
      }
    };
    window.addEventListener('unityteck-data', onData as EventListener);
    return () => window.removeEventListener('unityteck-data', onData as EventListener);
  }, [activeStore.id, load]);

  useEffect(() => {
    setPage(1);
  }, [search, parentFilter, pageSize, activeStore.id]);

  const denyMutate = (): boolean => {
    if (!canEdit) {
      toast(t('noPermissionAction'), 'error');
      return true;
    }
    if (!sub.writable) {
      toast(sub.message ?? t('subNotWritable'), 'error');
      return true;
    }
    return false;
  };

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => m.set(r.id, isAr ? (r.nameAr || r.name) : (r.name || r.nameAr || '')));
    return m;
  }, [rows, isAr]);

  const roots = useMemo(
    () => rows.filter((r) => !r.parentId).sort((a, b) => a.sortOrder - b.sortOrder),
    [rows],
  );

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((c) => {
      const matchParent =
        parentFilter === 'all' ||
        (parentFilter === 'roots' && !c.parentId) ||
        c.parentId === parentFilter ||
        c.id === parentFilter;
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.nameAr ?? '').toLowerCase().includes(q) ||
        (c.metaTitle ?? '').toLowerCase().includes(q);
      return matchParent && matchSearch;
    });

    if (sortKey) {
      list = [...list].sort((a, b) => {
        const getter = (c: StoreCategory): string | number => {
          switch (sortKey) {
            case 'slug':
              return c.slug;
            case 'sortOrder':
              return c.sortOrder;
            case 'isActive':
              return c.isActive ? 1 : 0;
            case 'name':
            default:
              return c.name;
          }
        };
        const av = getter(a);
        const bv = getter(b);
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        const cmp = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [rows, search, parentFilter, sortKey, sortDir]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page, pageSize]);

  const onSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const loadFieldDrafts = useCallback(
    async (categoryId: string | null) => {
      if (!isApiEnabled()) {
        setFieldDrafts([]);
        return;
      }
      try {
        const defs = await tenantApi.fetchCategoryFieldDefinitions(
          activeStore.id,
          categoryId ?? undefined,
        );
        setFieldDrafts(
          defs
            .filter((d) => d.categoryId === categoryId)
            .map((d) => ({
            id: d.id,
            nameEn: d.nameEn,
            nameAr: d.nameAr ?? '',
            fieldType: d.fieldType,
            optionsText: (d.options ?? []).join(', '),
            sort: String(d.sort),
            active: d.active,
          })),
        );
      } catch {
        setFieldDrafts([]);
      }
    },
    [activeStore.id],
  );

  const openAdd = () => {
    if (denyMutate()) return;
    setEditingId(null);
    setForm(emptyForm());
    setFieldDrafts([]);
    setShowModal(true);
  };

  const openEdit = (c: StoreCategory) => {
    if (denyMutate()) return;
    setEditingId(c.id);
    setForm(formFrom(c));
    void loadFieldDrafts(c.id);
    setShowModal(true);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (denyMutate()) return;
    if (!form.name.trim()) return;

    const payload: tenantApi.CategoryPayload = {
      name: form.name.trim(),
      name_ar: form.nameAr.trim() || null,
      slug: form.slug.trim() || undefined,
      parent_id: form.parentId || null,
      image_url: form.imageUrl.trim() || null,
      sort_order: parseInt(form.sortOrder, 10) || 0,
      meta_title: form.metaTitle.trim() || null,
      meta_description: form.metaDescription.trim() || null,
      is_active: form.isActive,
    };

    setSaving(true);
    let targetCategoryId: string | null = editingId;
    try {
      if (isApiEnabled()) {
        if (editingId) {
          const updated = await tenantApi.updateCategory(activeStore.id, editingId, payload);
          setRows((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
          targetCategoryId = editingId;
          bumpStore(activeStore.id, 'categories');
          toast('Category updated', 'success');
        } else {
          const created = await tenantApi.createCategory(activeStore.id, payload);
          setRows((prev) => [...prev, created]);
          targetCategoryId = created.id;
          bumpStore(activeStore.id, 'categories');
          toast('Category created', 'success');
        }
      } else {
        const savedKey = `unityteck_store_categories_${activeStore.id}`;
        if (editingId) {
          const next = rows.map((r) =>
            r.id === editingId
              ? {
                  ...r,
                  name: payload.name,
                  nameAr: payload.name_ar ?? null,
                  slug: payload.slug || r.slug,
                  parentId: payload.parent_id ?? null,
                  imageUrl: payload.image_url ?? null,
                  sortOrder: payload.sort_order ?? 0,
                  metaTitle: payload.meta_title ?? null,
                  metaDescription: payload.meta_description ?? null,
                  isActive: payload.is_active ?? true,
                }
              : r,
          );
          setRows(next);
          try {
            localStorage.setItem(savedKey, JSON.stringify(next));
            window.dispatchEvent(new CustomEvent('unityteck-categories-updated', { detail: { storeId: activeStore.id, categories: next } }));
          } catch {}
          bumpStore(activeStore.id, 'categories');
          toast('Category updated', 'success');
        } else {
          const created: StoreCategory = {
            id: `cat-${Date.now()}`,
            storeId: activeStore.id,
            name: payload.name,
            nameAr: payload.name_ar ?? null,
            slug: payload.slug || payload.name.toLowerCase().replace(/\s+/g, '-'),
            parentId: payload.parent_id ?? null,
            imageUrl: payload.image_url ?? null,
            sortOrder: payload.sort_order ?? 10,
            metaTitle: payload.meta_title ?? null,
            metaDescription: payload.meta_description ?? null,
            isActive: payload.is_active ?? true,
          };
          const next = [...rows, created];
          setRows(next);
          try {
            localStorage.setItem(savedKey, JSON.stringify(next));
            window.dispatchEvent(new CustomEvent('unityteck-categories-updated', { detail: { storeId: activeStore.id, categories: next } }));
          } catch {}
          bumpStore(activeStore.id, 'categories');
          toast('Category created', 'success');
          targetCategoryId = created.id;
        }
      }

      if (isApiEnabled() && targetCategoryId && fieldDrafts.length > 0) {
        for (const fd of fieldDrafts) {
          if (!fd.nameEn.trim()) continue;
          const body = {
            category_id: targetCategoryId,
            name_en: fd.nameEn.trim(),
            name_ar: fd.nameAr.trim() || null,
            field_type: fd.fieldType,
            options: fd.optionsText
              ? fd.optionsText.split(',').map((s) => s.trim()).filter(Boolean)
              : null,
            sort: parseInt(fd.sort, 10) || 0,
            active: fd.active,
          };
          if (fd.id) {
            await tenantApi.updateCategoryFieldDefinition(activeStore.id, fd.id, body);
          } else {
            await tenantApi.createCategoryFieldDefinition(activeStore.id, body);
          }
        }
      }

      setShowModal(false);
      setEditingId(null);
      setFieldDrafts([]);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save category failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (denyMutate()) return;
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      toast('Click delete again to confirm', 'info');
      return;
    }
    try {
      if (isApiEnabled()) {
        await tenantApi.deleteCategory(activeStore.id, id);
      }
      const next = rows
        .filter((r) => r.id !== id)
        .map((r) => (r.parentId === id ? { ...r, parentId: null } : r));
      setRows(next);
      if (!isApiEnabled()) {
        try { localStorage.setItem(`unityteck_store_categories_${activeStore.id}`, JSON.stringify(next)); } catch {}
      }
      bumpStore(activeStore.id, 'categories');
      setConfirmDeleteId(null);
      toast('Category deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const columns: AdvancedTableColumn<StoreCategory>[] = [
    {
      key: 'name',
      header: isAr ? 'التصنيف' : 'Category',
      sortable: true,
      className: 'px-4',
      render: (c) => {
        const depth = getCategoryDepth(rows, c.id);
        return (
        <div className="flex items-center gap-3" style={{ paddingInlineStart: depth * 16 }}>
          {c.imageUrl ? (
            <img
              src={c.imageUrl}
              alt={c.name}
              onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <span className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800 shrink-0">
              <Flower2 className="w-5 h-5" />
            </span>
          )}
          <div className="min-w-0">
            <span className="font-bold text-slate-900 dark:text-white block truncate">
              {isAr ? (c.nameAr || c.name) : (c.name || c.nameAr)}
            </span>
          </div>
        </div>
        );
      },
    },
    {
      key: 'slug',
      header: isAr ? 'المعرّف (Slug)' : 'Slug',
      sortable: true,
      render: (c) => <span className="font-mono text-slate-500 dark:text-slate-400">{c.slug}</span>,
    },
    {
      key: 'parent',
      header: isAr ? 'التصنيف الأب' : 'Parent',
      render: (c) => (
        <span className="text-slate-600 dark:text-slate-300">
          {c.parentId ? nameById.get(c.parentId) ?? c.parentId : (
            <span className="text-slate-400 dark:text-slate-500">{isAr ? 'رئيسي' : 'Root'}</span>
          )}
        </span>
      ),
    },
    {
      key: 'sortOrder',
      header: isAr ? 'الترتيب' : 'Sort',
      sortable: true,
      align: 'right',
      render: (c) => <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">{c.sortOrder}</span>,
    },
    {
      key: 'seo',
      header: isAr ? 'تحسين البحث' : 'SEO',
      render: (c) => (
        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] inline-block">
          {(isAr ? c.metaTitle : (c.metaTitleEn || c.metaTitle)) || '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: isAr ? 'الحالة' : 'Status',
      sortable: true,
      align: 'center',
      render: (c) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            c.isActive
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {c.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'مخفي' : 'Hidden')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: isAr ? 'الإجراءات' : 'Action',
      align: 'right',
      className: 'px-4',
      render: (c) => (
        <div className="inline-flex items-center gap-1 justify-end">
          <button
            type="button"
            onClick={() => openEdit(c)}
            disabled={!canMutate}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg disabled:opacity-50"
            title={isAr ? 'تعديل' : 'Edit'}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void handleDelete(c.id)}
            disabled={!canMutate}
            className={`p-1.5 rounded-lg disabled:opacity-50 ${
              confirmDeleteId === c.id
                ? 'text-white bg-rose-600'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30'
            }`}
            title={isAr ? 'حذف' : 'Delete'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const parentOptionsForForm = parentPickerOptions(rows, editingId, isAr);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 rounded-lg border border-teal-200/50 dark:border-teal-800/50">
              <FolderTree className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'تصنيفات المتجر' : 'Categories'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'شجرة التصنيفات · الصور · تحسين محركات البحث SEO · الترتيب'
              : 'Category taxonomy · image · SEO · sort · subcategories'}
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={!canMutate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'إضافة تصنيف' : 'Add Category'}
        </button>
      </div>

      {/* ── Connected Local Project Workspace Banner ── */}
      <ConnectedWorkspaceBanner page="categories" />

      {/* 4 Soft Pastel KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-blue-50/70 hover:bg-blue-50/90 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-blue-200 font-bold">
              {isAr ? 'إجمالي التصنيفات' : 'Total Categories'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {rows.length}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {isAr ? 'جميع تصنيفات المتجر' : 'Active taxonomy branches'}
          </span>
        </div>

        <div className="p-5 bg-emerald-50/70 hover:bg-emerald-50/90 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-emerald-200 font-bold">
              {isAr ? 'التصنيفات الرئيسية' : 'Root Categories'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {rows.filter(r => !r.parentId).length}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {isAr ? 'تصنيفات رئيسية بدون أب' : 'Primary storefront navigation'}
          </span>
        </div>

        <div className="p-5 bg-purple-50/70 hover:bg-purple-50/90 dark:bg-purple-950/30 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-purple-200 font-bold">
              {isAr ? 'التصنيفات الفرعية' : 'Sub-Categories'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {rows.filter(r => !!r.parentId).length}
          </div>
          <span className="text-[11px] text-purple-800 dark:text-purple-300 font-bold">
            {isAr ? 'مرتبطة بتصنيف أب' : 'Nested child collections'}
          </span>
        </div>

        <div className="p-5 bg-amber-50/70 hover:bg-amber-50/90 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-amber-200 font-bold">
              {isAr ? 'النشطة على الواجهة' : 'Storefront Visible'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {rows.filter(r => r.isActive).length}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {isAr ? 'ظاهرة للمتسوقين حالياً' : 'Published to customers'}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#071E26] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden p-1">
        <AdvancedDataTable
          rows={pageRows}
          columns={columns}
          rowKey={(c) => c.id}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={isAr ? 'بحث بالاسم، المعرّف، أو SEO...' : 'Search name, slug, SEO…'}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          total={filteredSorted.length}
          loading={loading}
          error={error}
          emptyMessage={isAr ? 'لا توجد تصنيفات بعد. أضف تصنيفاً رئيسياً للبدء.' : 'No categories yet. Add a root category to start.'}
          filters={
            <select
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">{isAr ? 'جميع المستويات' : 'All levels'}</option>
              <option value="roots">{isAr ? 'الرئيسية فقط' : 'Roots only'}</option>
              {roots.map((r) => (
                <option key={r.id} value={r.id}>
                  {isAr ? `تحت: ${r.nameAr || r.name}` : `Under: ${r.name}`}
                </option>
              ))}
            </select>
          }
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#071E26] rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base">
                  {editingId
                    ? (isAr ? 'تعديل التصنيف' : 'Edit Category')
                    : (isAr ? 'إضافة تصنيف جديد' : 'Add Category')}
                </h3>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSave(e)} className="p-5 space-y-3.5 text-xs text-slate-700 dark:text-slate-200 overflow-y-auto">
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'الاسم بالإنجليزية *' : 'Name *'}</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'الاسم بالعربية' : 'Name (AR)'}</label>
                <input
                  dir="rtl"
                  value={form.nameAr}
                  onChange={(e) => setField('nameAr', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{isAr ? 'الرابط الدائم (Slug)' : 'Slug'}</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setField('slug', e.target.value)}
                    placeholder="auto-generated"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{isAr ? 'الترتيب' : 'Sort order'}</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setField('sortOrder', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'التصنيف الأب' : 'Parent (subcategory)'}</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setField('parentId', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="">{isAr ? '— تصنيف رئيسي —' : '— Root category —'}</option>
                  {parentOptionsForForm.map((r) => (
                    <option key={r.id} value={r.id}>
                      {`${'— '.repeat(r.depth)}${r.label}`}
                    </option>
                  ))}
                </select>
              </div>
              <MediaUploadField
                label={isAr ? 'صورة القسم (Category Image)' : 'Category Image'}
                value={form.imageUrl}
                onChange={(url) => setField('imageUrl', url)}
                recommendedSize="800 × 800 px"
                aspectRatio="square"
                initialFolder="categories"
              />
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'عنوان سيو (SEO)' : 'SEO title'}</label>
                <input
                  value={form.metaTitle}
                  onChange={(e) => setField('metaTitle', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'وصف سيو (SEO)' : 'SEO description'}</label>
                <textarea
                  rows={2}
                  value={form.metaDescription}
                  onChange={(e) => setField('metaDescription', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none"
                />
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField('isActive', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold">{isAr ? 'نشط (ظاهر في المتجر)' : 'Active (visible)'}</span>
              </label>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm">
                    {isAr ? 'حقول مخصصة لهذا التصنيف' : 'Custom fields for this category'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFieldDrafts((prev) => [
                        ...prev,
                        {
                          nameEn: '',
                          nameAr: '',
                          fieldType: 'text',
                          optionsText: '',
                          sort: String((prev.length + 1) * 10),
                          active: true,
                        },
                      ])
                    }
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {isAr ? '+ حقل' : '+ Add field'}
                  </button>
                </div>
                {fieldDrafts.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {isAr ? 'لا حقول مخصصة — أضف حقولاً لمنتجات هذا التصنيف.' : 'No custom fields yet.'}
                  </p>
                ) : (
                  fieldDrafts.map((fd, idx) => (
                    <div
                      key={fd.id ?? `draft-${idx}`}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={fd.nameEn}
                          onChange={(e) =>
                            setFieldDrafts((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, nameEn: e.target.value } : x)),
                            )
                          }
                          placeholder={isAr ? 'الاسم (EN)' : 'Name (EN)'}
                          className="px-2 py-1.5 text-xs border rounded-lg dark:bg-slate-900"
                        />
                        <input
                          value={fd.nameAr}
                          onChange={(e) =>
                            setFieldDrafts((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, nameAr: e.target.value } : x)),
                            )
                          }
                          placeholder={isAr ? 'الاسم (AR)' : 'Name (AR)'}
                          className="px-2 py-1.5 text-xs border rounded-lg dark:bg-slate-900"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <select
                          value={fd.fieldType}
                          onChange={(e) =>
                            setFieldDrafts((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, fieldType: e.target.value as CategoryFieldType } : x,
                              ),
                            )
                          }
                          className="px-2 py-1.5 text-xs border rounded-lg dark:bg-slate-900"
                        >
                          <option value="text">{isAr ? 'نص' : 'Text'}</option>
                          <option value="number">{isAr ? 'رقم' : 'Number'}</option>
                          <option value="select">{isAr ? 'قائمة' : 'Select'}</option>
                          <option value="boolean">{isAr ? 'نعم/لا' : 'Yes/No'}</option>
                          <option value="url">{isAr ? 'رابط' : 'URL'}</option>
                        </select>
                        {fd.fieldType === 'select' ? (
                          <input
                            value={fd.optionsText}
                            onChange={(e) =>
                              setFieldDrafts((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, optionsText: e.target.value } : x)),
                              )
                            }
                            placeholder={isAr ? 'خيارات مفصولة بفاصلة' : 'Options, comma-separated'}
                            className="flex-1 min-w-[120px] px-2 py-1.5 text-xs border rounded-lg dark:bg-slate-900"
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setFieldDrafts((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-rose-600 font-semibold"
                        >
                          {isAr ? 'حذف' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  aria-busy={saving}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-60"
                >
                  {editingId
                    ? (isAr ? 'حفظ التعديلات' : 'Save Changes')
                    : (isAr ? 'إنشاء التصنيف' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

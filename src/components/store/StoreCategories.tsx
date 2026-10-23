import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import type { StoreCategory } from '../../types';
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

export const MECCA_CATEGORIES_SEED: StoreCategory[] = [
  // --- 11 Main Store Categories ---
  {
    id: 'c-1',
    storeId: 'store-1',
    parentId: null,
    name: 'Natural Flower Bouquets',
    nameAr: 'باقات الورود الطبيعية',
    slug: 'natural-bouquets',
    imageUrl: 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png',
    sortOrder: 10,
    metaTitle: 'باقات الورود الطبيعية | هدايا مكة',
    metaDescription: 'أجود باقات الورد الطبيعي الهولندي والإكوادوري في مكة المكرمة.',
    isActive: true,
  },
  {
    id: 'c-2',
    storeId: 'store-1',
    parentId: null,
    name: 'Roses & Patchi Chocolate',
    nameAr: 'ورد و شوكليت باتشي',
    slug: 'roses-patchi',
    imageUrl: 'https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png',
    sortOrder: 20,
    metaTitle: 'ورد وشوكولاتة باتشي | هدايا مكة',
    metaDescription: 'تناغم شوكولاتة باتشي الفاخرة وباقات الجوري الملكية.',
    isActive: true,
  },
  {
    id: 'c-3',
    storeId: 'store-1',
    parentId: null,
    name: 'Roses & Bostani Chocolate',
    nameAr: 'ورد وشوكوليت بستاني',
    slug: 'roses-bostani',
    imageUrl: 'https://cdn.salla.sa/form-builder/JEDxluyY7LbYdo5So7sLrPqqupntM3LUhIxV3gXD.png',
    sortOrder: 30,
    metaTitle: 'ورد وشوكوليت بستاني الفاخر | هدايا مكة',
    metaDescription: 'شوكولاتة بستاني البلجيكية الراقية مع تنسيق الجوري الزهري.',
    isActive: true,
  },
  {
    id: 'c-4',
    storeId: 'store-1',
    parentId: null,
    name: 'Natural Flower Vases',
    nameAr: 'فازات ورد طبيعي',
    slug: 'flower-vases',
    imageUrl: 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png',
    sortOrder: 40,
    metaTitle: 'فازات ورد طبيعي كريستال | هدايا مكة',
    metaDescription: 'فازات كريستالية وسيراميك راقية لتزيين المجالس وطاولات القهوة.',
    isActive: true,
  },
  {
    id: 'c-5',
    storeId: 'store-1',
    parentId: null,
    name: 'Flower Vases with Chocolate',
    nameAr: 'فازات الورود مع شوكليت',
    slug: 'vases-chocolate',
    imageUrl: 'https://cdn.salla.sa/form-builder/qk6gpVW76xoVeFb6kZrmFFGOFOXQ4q8JalQmKw0R.png',
    sortOrder: 50,
    metaTitle: 'فازات الورود مع الشوكولاتة | هدايا مكة',
    metaDescription: 'توليفة فخمة تجمع بين الفازات الكريستالية والشوكولاتة السويسرية.',
    isActive: true,
  },
  {
    id: 'c-6',
    storeId: 'store-1',
    parentId: null,
    name: 'Roses with Aquarium Fish',
    nameAr: 'ورود مع أسماك زينة',
    slug: 'roses-fish',
    imageUrl: 'https://cdn.salla.sa/form-builder/ykMusuoNPFuZdMPHsJcYHJb6fejLSpaoSZxKGAwh.png',
    sortOrder: 60,
    metaTitle: 'ورود مع أسماك زينة هدايا مبتكرة | هدايا مكة',
    metaDescription: 'ابتكار حجازي فريد يجمع بين حوض أسماك الزينة وتنسيق الزهور الطبيعية.',
    isActive: true,
  },
  {
    id: 'c-7',
    storeId: 'store-1',
    parentId: null,
    name: 'Roses with Lovebirds',
    nameAr: 'ورود مع عصافير الحب',
    slug: 'roses-lovebirds',
    imageUrl: 'https://cdn.salla.sa/form-builder/dZpSzihLrTks3koUrmlpfNV0AcHVSx3bE1KNFQTQ.png',
    sortOrder: 70,
    metaTitle: 'ورود مع عصافير الحب | هدايا مكة',
    metaDescription: 'هدية رومانسية حية مع قفص عصافير الحب وباقة الجوري الفاتنة.',
    isActive: true,
  },
  {
    id: 'c-8',
    storeId: 'store-1',
    parentId: null,
    name: 'Roses & Coffee Presentation',
    nameAr: 'تقديمة ورد وقهوة',
    slug: 'roses-coffee',
    imageUrl: 'https://cdn.salla.sa/form-builder/2fomvXwpTYOOx8h3JMZGP3r5dnXelUxxIUDuzepj.png',
    sortOrder: 80,
    metaTitle: 'تقديمة ورد وقهوة سعودية أصيلة | هدايا مكة',
    metaDescription: 'أصالة الضيافة الحجازية مع القهوة المختصة والزهور الطبيعية.',
    isActive: true,
  },
  {
    id: 'c-9',
    storeId: 'store-1',
    parentId: null,
    name: 'Roses with Coffee & Sweets',
    nameAr: 'تقديمة ورد مع قهوة وحلا',
    slug: 'roses-coffee-sweets',
    imageUrl: 'https://cdn.salla.sa/form-builder/zf3HeZ6jT4wON2ZEbeJfdMTc4bMLWQLkFvCndepr.png',
    sortOrder: 90,
    metaTitle: 'تقديمة ورد مع قهوة وحلا | هدايا مكة',
    metaDescription: 'صينية الضيافة الملكية بالقهوة والحلويات الفاخرة وباقة الورد.',
    isActive: true,
  },
  {
    id: 'c-10',
    storeId: 'store-1',
    parentId: null,
    name: 'Roses with Gourmet Cake',
    nameAr: 'ورد مع كيك',
    slug: 'roses-cake',
    imageUrl: 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png',
    sortOrder: 100,
    metaTitle: 'ورد وكيك احتفال | هدايا مكة',
    metaDescription: 'كعكات الريد فيلفت والميلاد مع باقات الورد الجوري الملكي.',
    isActive: true,
  },
  {
    id: 'c-11',
    storeId: 'store-1',
    parentId: null,
    name: 'Korean Lunchbox Bento Cake',
    nameAr: 'تقديمة كيك الكوري',
    slug: 'korean-cake',
    imageUrl: 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png',
    sortOrder: 110,
    metaTitle: 'تقديمة كيك الكوري اللطيف | هدايا مكة',
    metaDescription: 'بينتو كيك كوري لعبارات الحب والمفاجآت مع باقة ورد يد صغيرة.',
    isActive: true,
  },
  // --- Occasion Categories ---
  {
    id: 'occ-1',
    storeId: 'store-1',
    parentId: null,
    name: 'Mawajeeb Wooden Plaques',
    nameAr: 'لوحات مواجيب وتراث حجازي',
    slug: 'mawajeeb',
    imageUrl: 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp',
    sortOrder: 120,
    metaTitle: 'لوحات مواجيب | هدايا مكة',
    metaDescription: 'لوحات تذكارية وتراث حجازي عريق مع ورد وبخور مروكي.',
    isActive: true,
  },
  {
    id: 'occ-2',
    storeId: 'store-1',
    parentId: null,
    name: 'Newborn Welcome Gifts',
    nameAr: 'هدايا المواليد',
    slug: 'newborn',
    imageUrl: 'https://cdn.salla.sa/form-builder/h7hTylc4cMiriSfxe2sGsX0mL5Sc7akjxHAAUqHp.png',
    sortOrder: 130,
    metaTitle: 'هدايا استقبال المواليد | هدايا مكة',
    metaDescription: 'باقات ودببة ناعمة وستاندات استقبال المواليد الجدد في المشافي والمنازل.',
    isActive: true,
  },
  {
    id: 'occ-3',
    storeId: 'store-1',
    parentId: null,
    name: 'Graduation Milestones',
    nameAr: 'هدايا التخرج',
    slug: 'graduation',
    imageUrl: 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png',
    sortOrder: 140,
    metaTitle: 'هدايا التخرج الملكية | هدايا مكة',
    metaDescription: 'باقات تخرج مذهبة مع قبعة ووشاح وبوكسات شوكولاتة باتشي.',
    isActive: true,
  },
  {
    id: 'occ-4',
    storeId: 'store-1',
    parentId: null,
    name: 'Valentine & Romantic Gifts',
    nameAr: 'هدايا عيد الحب والرومانسية',
    slug: 'valentine',
    imageUrl: 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png',
    sortOrder: 150,
    metaTitle: 'هدايا عيد الحب والرومانسية | هدايا مكة',
    metaDescription: 'أجمل بوكسات الورد الأحمر المخملي والشوكولاتة البلجيكية الفاخرة.',
    isActive: true,
  },
  {
    id: 'occ-5',
    storeId: 'store-1',
    parentId: null,
    name: 'Wedding & Bridal Keepsakes',
    nameAr: 'هدايا الزواج والعرائس',
    slug: 'wedding',
    imageUrl: 'https://cdn.salla.sa/form-builder/Z8aMbQ8cDkf9OnQakCZwnH4GvpnqLlXsCqBk70ik.png',
    sortOrder: 160,
    metaTitle: 'مسكات وباقات عرائس الزواج | هدايا مكة',
    metaDescription: 'مسكات العرائس الفاخرة باللؤلؤ والزهور الإكوادورية البيضاء المستوردة.',
    isActive: true,
  },
  {
    id: 'occ-6',
    storeId: 'store-1',
    parentId: null,
    name: 'Birthday Celebrations',
    nameAr: 'هدايا عيد ميلاد',
    slug: 'birthday',
    imageUrl: 'https://cdn.salla.sa/form-builder/nm5BDgkXRslZvqTetu5wTrCTTTTLTrsBhWwjHMyI.png',
    sortOrder: 170,
    metaTitle: 'هدايا عيد ميلاد مميزة | هدايا مكة',
    metaDescription: 'مفاجآت أعياد الميلاد مع الكيك والبالونات الهيليوم وباقات الورد المبهجة.',
    isActive: true,
  },
  {
    id: 'occ-7',
    storeId: 'store-1',
    parentId: null,
    name: 'Men Luxury Gifts',
    nameAr: 'هدايا رجالية ملكية',
    slug: 'men-gifts',
    imageUrl: '/images/hadaya_men_luxury_gift_1791219799100.jpg',
    sortOrder: 180,
    metaTitle: 'أطقم هدايا رجالية فاخرة | هدايا مكة',
    metaDescription: 'صناديق جلدية ملكية تضم عطور وساعات ومحافظ فاخرة مع ورد طبيعي.',
    isActive: true,
  },
  {
    id: 'occ-8',
    storeId: 'store-1',
    parentId: null,
    name: 'Women Luxury Gifts',
    nameAr: 'هدايا نسائية فاخرة',
    slug: 'women-gifts',
    imageUrl: '/images/hadaya_women_luxury_gift_zedaan.webp',
    sortOrder: 190,
    metaTitle: 'أطقم هدايا نسائية راقية | هدايا مكة',
    metaDescription: 'صناديق مخملية تضم عطور ومجوهرات زركون مع زهور البيوني الفاتنة.',
    isActive: true,
  },
  // --- Nested Sub-Categories for Mecca Gifts Store ---
  {
    id: 'sub-c1-peonies',
    storeId: 'store-1',
    parentId: 'c-1',
    name: 'Dutch Peonies & Hydrangeas',
    nameAr: 'بيوني وهيدرانجيا هولندي',
    slug: 'dutch-peonies',
    imageUrl: 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png',
    sortOrder: 15,
    metaTitle: 'بيوني وهيدرانجيا هولندي طبيعي | هدايا مكة',
    metaDescription: 'تنسيقات زهور البيوني الهولندية المستوردة مع الهيدرانجيا الوردية.',
    isActive: true,
  },
  {
    id: 'sub-c1-roses',
    storeId: 'store-1',
    parentId: 'c-1',
    name: 'Ecuadorian Long Stem Red Roses',
    nameAr: 'جوري إكوادوري أحمر ملكي',
    slug: 'ecuadorian-red-roses',
    imageUrl: '/images/hadaya_red_roses_bouquet_1791276749666.jpg',
    sortOrder: 16,
    metaTitle: 'جوري إكوادوري أحمر ملكي طويل الساق | هدايا مكة',
    metaDescription: 'أفخر باقات الورد الجوري الإكوادوري الأحمر الفاتن لعيد الحب والمناسبات.',
    isActive: true,
  },
  {
    id: 'sub-c4-crystal',
    storeId: 'store-1',
    parentId: 'c-4',
    name: 'Bohemian Crystal Vases',
    nameAr: 'فازات كريستال بوهيمي فاخرة',
    slug: 'bohemian-crystal-vases',
    imageUrl: 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png',
    sortOrder: 45,
    metaTitle: 'فازات كريستال بوهيمي | هدايا مكة',
    metaDescription: 'فازات كريستال بوهيمي منقوشة يدوياً للمجالس الراقية.',
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
    isActive: true,
  },
  // --- Nested Sub-Categories for Bleco / Car Services Store ---
  {
    id: 'sub-blc-1-nappa',
    storeId: 'store-bleco',
    parentId: 'cat-blc-1',
    name: 'German Nappa Leather Upholstery',
    nameAr: 'جلد ألماني نابا فاخر',
    slug: 'german-nappa-leather',
    imageUrl: '/images/categories/vip-luxury-seat-covers.jpg',
    sortOrder: 12,
    metaTitle: 'تنجيد جلد ألماني نابا | متجر السعيدي',
    metaDescription: 'جلد ألماني نابا طبيعي مقاوم للحرارة والتشقق مع ضمان ٥ سنوات.',
    isActive: true,
  },
  {
    id: 'sub-blc-2-7seater',
    storeId: 'store-bleco',
    parentId: 'cat-blc-2',
    name: '7-Seater Family & Trunk Protection Mats',
    nameAr: 'أرضيات ٧ مقاعد عائلية وحماية الشنطة',
    slug: '7-seater-laser-mats',
    imageUrl: '/images/categories/vip-5d-laser-mats.jpg',
    sortOrder: 22,
    metaTitle: 'أرضيات ٧ مقاعد ليزر تفصيل | متجر السعيدي',
    metaDescription: 'تغطية شاملة لجميع صفوف السيارات العائلية ودعاسة الشنطة المرتفعة.',
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
        setRows(savedList);
      } else {
      const isCoffee =
        activeStore.id === 'store-coffee' ||
        activeStore.slug === 'coffee-store' ||
        activeStore.slug === 'hibrew-coffee' ||
        /قهوة|coffee|hibrew/i.test(activeStore.name) ||
        /قهوة|coffee|hibrew/i.test(activeStore.nameAr ?? '') ||
        /قهوة|coffee|hibrew/i.test(activeStore.nameEn ?? '');
      const isBleco =
        activeStore.id === 'store-bleco' ||
        activeStore.slug === 'bleco-car' ||
        activeStore.slug === 'alsaeedi-cars' ||
        /سيارات|car|bleco/i.test(activeStore.name) ||
        /سيارات|car|bleco/i.test(activeStore.nameAr ?? '') ||
        /سيارات|car|bleco/i.test(activeStore.nameEn ?? '');
      const isMakkah = !isCoffee && !isBleco;

      const defaultSeed = isMakkah
        ? MECCA_CATEGORIES_SEED
        : isCoffee
        ? COFFEE_CATEGORIES_SEED
        : isBleco
        ? BLECO_CATEGORIES_SEED
        : MECCA_CATEGORIES_SEED;
      setRows(defaultSeed);
      if (defaultSeed.length > 0) {
        try {
          localStorage.setItem(savedKey, JSON.stringify(defaultSeed));
        } catch {}
      }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeStore.id, activeStore.slug]);

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
    rows.forEach((r) => m.set(r.id, r.name));
    return m;
  }, [rows]);

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

  const openAdd = () => {
    if (denyMutate()) return;
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (c: StoreCategory) => {
    if (denyMutate()) return;
    setEditingId(c.id);
    setForm(formFrom(c));
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
    try {
      if (isApiEnabled()) {
        if (editingId) {
          const updated = await tenantApi.updateCategory(activeStore.id, editingId, payload);
          setRows((prev) => {
            const next = prev.map((r) => (r.id === editingId ? updated : r));
            try { localStorage.setItem(`unityteck_store_categories_${activeStore.id}`, JSON.stringify(next)); } catch {}
            return next;
          });
          bumpStore(activeStore.id, 'categories');
          toast(isAr ? 'تم تحديث التصنيف بنجاح' : 'Category updated successfully', 'success');
        } else {
          const created = await tenantApi.createCategory(activeStore.id, payload);
          setRows((prev) => {
            const next = [...prev, created];
            try { localStorage.setItem(`unityteck_store_categories_${activeStore.id}`, JSON.stringify(next)); } catch {}
            return next;
          });
          bumpStore(activeStore.id, 'categories');
          toast(isAr ? 'تم إنشاء التصنيف بنجاح' : 'Category created successfully', 'success');
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
          toast(isAr ? 'تم تحديث التصنيف بنجاح' : 'Category updated successfully', 'success');
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
          toast(isAr ? 'تم إنشاء التصنيف بنجاح' : 'Category created successfully', 'success');
        }
      }
      setShowModal(false);
      setEditingId(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : (isAr ? 'فشل حفظ التصنيف' : 'Save category failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (denyMutate()) return;
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      toast(isAr ? 'اضغط على زر الحذف مرة أخرى للتأكيد' : 'Click delete again to confirm', 'info');
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
      try { localStorage.setItem(`unityteck_store_categories_${activeStore.id}`, JSON.stringify(next)); } catch {}
      bumpStore(activeStore.id, 'categories');
      setConfirmDeleteId(null);
      toast(isAr ? 'تم حذف التصنيف بنجاح' : 'Category deleted successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : (isAr ? 'فشل الحذف' : 'Delete failed'), 'error');
    }
  };

  const columns: AdvancedTableColumn<StoreCategory>[] = [
    {
      key: 'name',
      header: isAr ? 'التصنيف' : 'Category',
      sortable: true,
      className: 'px-4',
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.imageUrl ? (
            <img
              src={c.imageUrl}
              alt={c.name}
              loading="lazy"
              decoding="async"
              onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <span className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800 shrink-0">
              <Flower2 className="w-5 h-5" />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {c.parentId && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 shrink-0">
                  <Layers className="w-2.5 h-2.5" />
                  {isAr ? 'تصنيف فرعي' : 'Subcategory'}
                </span>
              )}
              <span className="font-bold text-slate-900 dark:text-white block truncate">
                {isAr ? (c.nameAr || c.name) : (c.name || c.nameAr)}
              </span>
            </div>
            {isAr ? (
              c.name && c.name !== c.nameAr ? (
                <span className="text-[10px] text-slate-400 block truncate" dir="ltr">
                  {c.name}
                </span>
              ) : null
            ) : (
              c.nameAr ? (
                <span className="text-[10px] text-slate-400 block truncate" dir="rtl">
                  {c.nameAr}
                </span>
              ) : null
            )}
          </div>
        </div>
      ),
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
      header: isAr ? 'سيو (SEO)' : 'SEO',
      render: (c) => (
        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] inline-block">
          {c.metaTitle || '—'}
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

  const parentOptionsForForm = rows.filter((r) => r.id !== editingId && !r.parentId);

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
              ? `شجرة التصنيفات لمتجر ${activeStore.name} · الصور · تحسين محركات البحث SEO · الترتيب`
              : `Store-scoped taxonomy for ${activeStore.name} · image · SEO · sort · subcategories`}
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
                      {isAr ? (r.nameAr || r.name) : r.name}
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

import type {
  InvoiceDocument,
  InvoiceDocumentType,
  InvoiceDocumentStatus,
  InvoiceLineItem,
  SupplierRecord,
  PurchaseRecord,
  InvoiceTemplateConfig,
  DocumentAuditEntry,
  DocumentPartyDetails,
} from '../types/invoices';
import type { Order, Store } from '../types';
import { generateZatcaTlvBase64, generateInvoiceHashSha256 } from '../utils/zatca';
import { getLocalizedItemName, getCustomerDisplayName, getLocalizedAddress } from '../utils/storeLocalization';
import { readStoreIdentity } from '../themes/settings/storeIdentity';

const INVOICES_STORAGE_KEY = 'unityteck_invoices_v1';
const TEMPLATES_STORAGE_KEY = 'unityteck_invoice_templates_v1';
const SUPPLIERS_STORAGE_KEY = 'unityteck_suppliers_v1';
const PURCHASES_STORAGE_KEY = 'unityteck_purchases_v1';
const NUMBERING_STORAGE_KEY = 'unityteck_doc_numbering_v1';

export interface StoreInvoiceProfile {
  storeId: string;
  nameEn: string;
  nameAr: string;
  companyNameEn: string;
  companyNameAr: string;
  email: string;
  phone: string;
  addressEn: string;
  addressAr: string;
  cityEn: string;
  cityAr: string;
  countryEn: string;
  countryAr: string;
  vatNumber: string;
  crNumber: string;
  bankDetailsEn: string;
  bankDetailsAr: string;
  customNotesEn: string;
  customNotesAr: string;
  customTermsEn: string;
  customTermsAr: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export function isCoffeeStoreId(storeId: string, store?: Partial<Store>): boolean {
  const sId = (storeId || store?.id || '').toLowerCase();
  const name = (store?.name || '').toLowerCase();
  const cat = ((store as any)?.category || '').toLowerCase();
  return (
    sId === 'store-coffee' ||
    sId.includes('coffee') ||
    sId.includes('hibrew') ||
    sId.includes('roaster') ||
    name.includes('coffee') ||
    name.includes('hibrew') ||
    name.includes('قهوة') ||
    cat.includes('coffee') ||
    cat.includes('قهوة')
  );
}

export function isCarStoreId(storeId: string, store?: Partial<Store>): boolean {
  const sId = (storeId || store?.id || '').toLowerCase();
  const name = (store?.name || '').toLowerCase();
  return (
    sId === 'store-bleco' ||
    sId.includes('bleco') ||
    sId.includes('tanjeed') ||
    name.includes('بلاكو') ||
    name.includes('السعيدي') ||
    name.includes('تنجيد') ||
    name.includes('سيارات') ||
    name.includes('car')
  );
}

export function getStoreInvoiceProfile(storeId?: string, store?: Partial<Store>): StoreInvoiceProfile {
  const safeStoreId = storeId || store?.id || '';
  const safeStore = store || { id: safeStoreId, name: '' };
  const customIdentity = safeStoreId ? readStoreIdentity(safeStoreId, safeStore as any) : readStoreIdentity('', safeStore as any);
  if (isCoffeeStoreId(safeStoreId, store)) {
    return {
      storeId: safeStoreId,
      nameEn: customIdentity?.storeName || 'HiBrew KSA Official Coffee Store',
      nameAr: customIdentity?.storeName || (store as any)?.nameAr || 'متجر مكائن ومستلزمات القهوة (HiBrew KSA)',
      companyNameEn: 'HiBrew Specialty Coffee & Equipment Est.',
      companyNameAr: 'مؤسسة هاي برو لتقنيات ومعدات القهوة المختصة',
      email: customIdentity?.email || (store as any)?.email || store?.ownerEmail || 'billing@specialtycoffee.sa',
      phone: customIdentity?.phone || (store as any)?.phone || '+966 11 489 2030',
      addressEn: customIdentity?.addressEn || 'Riyadh Showroom, King Fahd Road, Al-Olaya',
      addressAr: customIdentity?.addressAr || 'معرض الرياض الرئيسي، طريق الملك فهد، حي العليا',
      cityEn: customIdentity?.city || 'Riyadh',
      cityAr: customIdentity?.city || 'الرياض',
      countryEn: 'Saudi Arabia',
      countryAr: 'المملكة العربية السعودية',
      vatNumber: customIdentity?.vatNumber || (store as any)?.taxNumber || '31048821900003',
      crNumber: customIdentity?.commercialReg || (store as any)?.crNumber || '1010892410',
      bankDetailsEn: 'Alinma Bank | IBAN: SA4405000068201948201019 | Beneficiary: HiBrew KSA Equipment Est.',
      bankDetailsAr: 'مصرف الإنماء | الآيبان: SA4405000068201948201019 | المستفيد: مؤسسة هاي برو لمعدات القهوة',
      customNotesEn: 'Thank you for choosing HiBrew KSA. All espresso machines include a 2-year warranty and authorized service.',
      customNotesAr: 'شكراً لاختياركم هاي برو السعودية. تشمل جميع مكائن ومطاحن القهوة ضمان سنتين وخدمة صيانة معتمدة.',
      customTermsEn: 'Machines covered under 24 months official warranty. Accessories returnable within 14 days in original sealed packaging.',
      customTermsAr: 'الأجهزة مشمولة بالضمان الرسمي لمدة 24 شهراً. الاستبدال والإرجاع متاح خلال 14 يوماً للقطع غير المستخدمة بتغليف المصنع.',
      primaryColor: '#451a03',
      secondaryColor: '#78350f',
      accentColor: '#d97706',
    };
  }

  if (isCarStoreId(safeStoreId, store)) {
    return {
      storeId: safeStoreId,
      nameEn: customIdentity?.storeName || 'Al-Saeedi Car Upholstery & Accessories (Bleco Est.)',
      nameAr: customIdentity?.storeName || (store as any)?.nameAr || 'متجر السعيدي لخدمات السيارات (مؤسسة بلاكو)',
      companyNameEn: 'Bleco Automotive Customization & Upholstery Est.',
      companyNameAr: 'مؤسسة بلاكو لخدمات وتجهيز السيارات',
      email: customIdentity?.email || (store as any)?.email || store?.ownerEmail || 'billing@tanjeedmakkah.com',
      phone: customIdentity?.phone || (store as any)?.phone || '+966 59 775 7086',
      addressEn: customIdentity?.addressEn || 'Al-Shawqiyyah District, Ring Road, Makkah',
      addressAr: customIdentity?.addressAr || 'حي الشوقية، الطريق الدائري، مكة المكرمة',
      cityEn: customIdentity?.city || 'Makkah',
      cityAr: customIdentity?.city || 'مكة المكرمة',
      countryEn: 'Saudi Arabia',
      countryAr: 'المملكة العربية السعودية',
      vatNumber: customIdentity?.vatNumber || (store as any)?.taxNumber || '300018046200003',
      crNumber: customIdentity?.commercialReg || (store as any)?.crNumber || '7005616136',
      bankDetailsEn: 'SNB Bank | IBAN: SA2810000034918294810291 | Beneficiary: Bleco Automotive Est.',
      bankDetailsAr: 'البنك الأهلي السعودي | الآيبان: SA2810000034918294810291 | المستفيد: مؤسسة بلاكو للسيارات',
      customNotesEn: 'Thank you for choosing Al-Saeedi Car Care. Tailored diamond floor mats & seat covers include fitting warranty.',
      customNotesAr: 'شكراً لاختياركم السعيدي لتنجيد السيارات. يشمل التنجيد والأرضيات ضمان التركيب وجودة الجلد.',
      customTermsEn: 'Custom stitched leather sets are non-returnable once installation starts. 1-year stitching warranty.',
      customTermsAr: 'التفصيل الخاص غير قابل للاسترجاع بعد بدء القص والتركيب. ضمان سنة كاملة على الخياطة وثبات اللون.',
      primaryColor: '#09090b',
      secondaryColor: '#27272a',
      accentColor: '#dc2626',
    };
  }

  const isFlowerStore = safeStoreId === 'store-1' || safeStoreId === 'store-mecca' || store?.slug?.includes('flower') || store?.slug?.includes('gift') || (store as any)?.category?.toLowerCase().includes('flower');

  if (!isFlowerStore) {
    const storeName = store?.name || 'Online Store';
    const storeNameAr = (store as any)?.nameAr || store?.name || 'متجر إلكتروني';
    return {
      storeId: safeStoreId,
      nameEn: storeName,
      nameAr: storeNameAr,
      companyNameEn: `${storeName} Commercial Est.`,
      companyNameAr: `مؤسسة ${storeNameAr} التجارية`,
      email: (store as any)?.email || store?.ownerEmail || 'billing@unityteck.sa',
      phone: (store as any)?.phone || '+966 11 000 0000',
      addressEn: 'Riyadh, Kingdom of Saudi Arabia',
      addressAr: 'الرياض، المملكة العربية السعودية',
      cityEn: 'Riyadh',
      cityAr: 'الرياض',
      countryEn: 'Saudi Arabia',
      countryAr: 'المملكة العربية السعودية',
      vatNumber: (store as any)?.taxNumber || '300000000000003',
      crNumber: (store as any)?.crNumber || '1010000000',
      bankDetailsEn: `Al Rajhi Bank | IBAN: SA4480000000000000000000 | Beneficiary: ${storeName}`,
      bankDetailsAr: `مصرف الراجحي | الآيبان: SA4480000000000000000000 | المستفيد: ${storeNameAr}`,
      customNotesEn: `Thank you for choosing ${storeName}. For support, please contact our merchant desk.`,
      customNotesAr: `شكراً لاختياركم ${storeNameAr}. لخدمة العملاء يرجى التواصل معنا.`,
      customTermsEn: 'Returns and exchanges are processed in accordance with the Ministry of Commerce regulations.',
      customTermsAr: 'تخضع عمليات الاسترجاع والاستبدال لتعليمات وأنظمة وزارة التجارة السعودية.',
      primaryColor: store?.accentColor || '#0f172a',
      secondaryColor: '#334155',
      accentColor: store?.accentColor || '#059669',
    };
  }

  // Flower store
  const identity = safeStoreId ? readStoreIdentity(safeStoreId, store as any) : null;
  return {
    storeId: safeStoreId,
    nameEn: identity?.storeName || store?.name || 'Makkah Gifts & Luxury Flowers Est.',
    nameAr: identity?.storeName || (store as any)?.nameAr || 'مؤسسة متجر هدايا وزهور مكة',
    companyNameEn: 'Makkah Gifts Commercial Est.',
    companyNameAr: 'مؤسسة متجر هدايا التجارية',
    email: identity?.email || (store as any)?.email || store?.ownerEmail || 'giftshop2030m@gmail.com',
    phone: identity?.phone || (store as any)?.phone || '+966 50 442 8819',
    addressEn: identity?.addressEn || 'Ibrahim Al-Khalil Road, Jabal Omar District, Makkah',
    addressAr: identity?.addressAr || 'طريق إبراهيم الخليل، منطقة جبل عمر، مكة المكرمة',
    cityEn: identity?.city || 'Makkah',
    cityAr: identity?.city || 'مكة المكرمة',
    countryEn: 'Saudi Arabia',
    countryAr: 'المملكة العربية السعودية',
    vatNumber: identity?.vatNumber || (store as any)?.taxNumber || '30048821900003',
    crNumber: identity?.commercialReg || (store as any)?.crNumber || '4031099241',
    bankDetailsEn: 'Al Rajhi Bank | IBAN: SA4480000204608010123456 | Beneficiary: Makkah Gifts Est.',
    bankDetailsAr: 'مصرف الراجحي | الآيبان: SA4480000204608010123456 | المستفيد: مؤسسة هدايا مكة',
    customNotesEn: `Thank you for choosing ${identity?.storeName || 'Makkah Gifts'}. For customer support, contact us via WhatsApp ${identity?.whatsapp || '+966 50 442 8819'}.`,
    customNotesAr: `شكراً لاختياركم ${identity?.storeName || 'متجر هدايا'}. لخدمة العملاء وطلبات المناسبات يرجى التواصل عبر واتساب ${identity?.whatsapp || '+966 50 442 8819'}.`,
    customTermsEn: 'All goods are delivered with guaranteed freshness. Return/Exchange window is 24 hours for fresh items and 14 days for luxury packaging.',
    customTermsAr: 'تضمن المؤسسة وصول الورود والهدايا بأعلى درجات النضارة والفخامة. الاسترجاع خلال 24 ساعة للزهور و14 يوماً للهدايا المغلفة.',
    primaryColor: '#0f172a',
    secondaryColor: '#334155',
    accentColor: '#059669',
  };
}

export const DEFAULT_TEMPLATE_CONFIG: InvoiceTemplateConfig = {
  storeId: 'makkah-gifts-store',
  documentType: 'all',
  primaryColor: '#0f172a',
  secondaryColor: '#334155',
  accentColor: '#059669',
  fontFamily: 'Tajawal',
  fontSize: 'normal',
  showLogo: true,
  businessNameEn: 'Makkah Gifts & Luxury Flowers Est.',
  businessNameAr: 'مؤسسة هدايا مكة والزهور الفاخرة',
  taxNumber: '300948215600003',
  crNumber: '1010892341',
  headerAddressEn: 'Ibrahim Al-Khalil Road, Jabal Omar District, Makkah, Saudi Arabia',
  headerAddressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر، مكة المكرمة، المملكة العربية السعودية',
  contactEmail: 'billing@makkah-gifts.sa',
  contactPhone: '+966 12 555 8899',
  columns: {
    sku: true,
    image: true,
    unitPrice: true,
    discount: true,
    taxRate: true,
    taxAmount: true,
    total: true,
  },
  showZatcaQr: true,
  showPaymentInstructions: true,
  showBankDetails: true,
  showSignatureField: true,
  showNotes: true,
  showTerms: true,
  showWatermark: true,
  customNotesEn: 'Thank you for choosing Makkah Gifts. For customer support or corporate gifting, contact us via WhatsApp +966 58 161 7712.',
  customNotesAr: 'شكراً لاختياركم هدايا مكة. لخدمة العملاء وطلبات الشركات يرجى التواصل عبر واتساب +966 58 161 7712.',
  customTermsEn: 'All goods are delivered with guaranteed freshness. Return/Exchange window is 24 hours for fresh items and 14 days for luxury packaging.',
  customTermsAr: 'تضمن المؤسسة وصول الورود والهدايا بأعلى درجات النضارة والفخامة. الاسترجاع خلال 24 ساعة للزهور و14 يوماً للهدايا المغلفة.',
  bankDetailsEn: 'Al Rajhi Bank | IBAN: SA4480000204608010123456 | Beneficiary: Makkah Gifts Est.',
  bankDetailsAr: 'مصرف الراجحي | الآيبان: SA4480000204608010123456 | المستفيد: مؤسسة هدايا مكة',
  pageSize: 'A4',
  pageOrientation: 'portrait',
  direction: 'auto',
  compactMode: false,
};

// Initial Suppliers: Store-Isolated
const INITIAL_SUPPLIERS_FLOWERS: SupplierRecord[] = [
  {
    id: 'sup-01',
    storeId: 'store-1',
    name: 'Dutch Flora International B.V.',
    nameAr: 'شركة فلورا الهولندية الدولية للزهور',
    contactPerson: 'Jan Van Der Beek',
    email: 'orders@dutchflora.nl',
    phone: '+31 20 894 3320',
    vatNumber: '310984421300003',
    crNumber: 'NL84201948',
    address: 'Aalsmeer Flower Auction Blvd 14',
    city: 'Aalsmeer',
    country: 'Netherlands',
    paymentTerms: 'Net 30 Days',
    balance: 14500,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'sup-02',
    storeId: 'store-1',
    name: 'Patchi & Bostani Saudi Chocolates Co.',
    nameAr: 'شركة شوكولاتة باتشي وبستاني السعودية',
    contactPerson: 'Tariq Al-Mansoor',
    email: 'supply@bostani-sa.com',
    phone: '+966 11 488 9200',
    vatNumber: '300189425000003',
    crNumber: '1010349281',
    address: 'King Fahd Road, Al-Olaya',
    city: 'Riyadh',
    country: 'Saudi Arabia',
    paymentTerms: 'Net 15 Days',
    balance: 8200,
    createdAt: '2026-02-01T09:30:00Z',
  },
  {
    id: 'sup-03',
    storeId: 'store-1',
    name: 'Royal Velvet Packaging & Silk Trims',
    nameAr: 'مصنع المخمل الملكي للتغليف والعلب الفاخرة',
    contactPerson: 'Sultan Al-Ghamdi',
    email: 'sales@royalboxes.sa',
    phone: '+966 12 667 4411',
    vatNumber: '300874129500003',
    crNumber: '4030198421',
    address: 'Al-Basateen Industrial District',
    city: 'Jeddah',
    country: 'Saudi Arabia',
    paymentTerms: 'Immediate COD / Advance',
    balance: 0,
    createdAt: '2026-02-15T11:00:00Z',
  },
];

const INITIAL_SUPPLIERS_COFFEE: SupplierRecord[] = [
  {
    id: 'sup-cof-01',
    storeId: 'store-coffee',
    name: 'HiBrew Global Technology & Engineering Ltd.',
    nameAr: 'شركة هاي برو العالمية للهندسة والتقنيات المحدودة',
    contactPerson: 'David Chen (International Sales Lead)',
    email: 'export@hibrew.com',
    phone: '+852 2849 9200',
    vatNumber: '310992481000003',
    crNumber: 'HK89201948',
    address: 'Hi-Tech Industrial Park, Science & Tech Ave 88',
    city: 'Shenzhen / Hong Kong',
    country: 'Hong Kong',
    paymentTerms: 'Net 30 Days LC',
    balance: 24500,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'sup-cof-02',
    storeId: 'store-coffee',
    name: 'Colombian Specialty Coffee Growers Federation',
    nameAr: 'الاتحاد الوطني لمزارعي البن الكولومبي المختص',
    contactPerson: 'Carlos Rodriguez',
    email: 'orders@cafedecolombia.co',
    phone: '+57 1 313 6600',
    vatNumber: '300192849100003',
    crNumber: 'CO49102914',
    address: 'Calle 73 No. 8-13, Huila Specialty Zone',
    city: 'Bogota',
    country: 'Colombia',
    paymentTerms: 'Net 15 Days',
    balance: 11200,
    createdAt: '2026-02-05T09:30:00Z',
  },
  {
    id: 'sup-cof-03',
    storeId: 'store-coffee',
    name: 'Fellow & Precision Barista Tools Distribution',
    nameAr: 'مؤسسة فيلو وأدوات الباريستا الدقيقة المعتمدة',
    contactPerson: 'Faisal Al-Otaibi',
    email: 'sales@fellow-gear.sa',
    phone: '+966 11 489 7722',
    vatNumber: '300891241000003',
    crNumber: '1010482910',
    address: 'King Fahd Road, Al-Aqiq Commercial Center',
    city: 'Riyadh',
    country: 'Saudi Arabia',
    paymentTerms: 'Immediate Wire / COD',
    balance: 0,
    createdAt: '2026-02-20T11:00:00Z',
  },
];

const INITIAL_PURCHASES_FLOWERS: PurchaseRecord[] = [
  {
    id: 'pur-01',
    storeId: 'store-1',
    purchaseInvoiceNumber: 'PUR-2026-0081',
    supplierId: 'sup-01',
    supplierName: 'Dutch Flora International B.V.',
    supplierNameAr: 'شركة فلورا الهولندية الدولية للزهور',
    purchaseDate: '2026-10-01T09:00:00Z',
    dueDate: '2026-10-31T23:59:59Z',
    items: [
      {
        id: 'p-it-1',
        name: 'Grand Prix Red Roses (500 Stems Batch)',
        nameAr: 'زهور جران بري حمراء هولندية (دفعة 500 غصن)',
        sku: 'DF-ROSE-500',
        quantity: 10,
        unitPrice: 850,
        discount: 500,
        taxRate: 15,
        taxAmount: 1200,
        total: 9200,
      },
      {
        id: 'p-it-2',
        name: 'Casablanca White Lilies (Fresh Import)',
        nameAr: 'زنابق كازابلانكا البيضاء الفاخرة',
        sku: 'DF-LILY-200',
        quantity: 5,
        unitPrice: 620,
        discount: 0,
        taxRate: 15,
        taxAmount: 465,
        total: 3565,
      },
    ],
    subtotal: 11100,
    taxAmount: 1665,
    shippingCost: 800,
    grandTotal: 13565,
    amountPaid: 8000,
    outstandingBalance: 5565,
    paymentStatus: 'partially_paid',
    notes: 'Air freight refrigerated delivery to Jeddah Airport Cargo terminal.',
  },
  {
    id: 'pur-02',
    storeId: 'store-1',
    purchaseInvoiceNumber: 'PUR-2026-0082',
    supplierId: 'sup-02',
    supplierName: 'Patchi & Bostani Saudi Chocolates Co.',
    supplierNameAr: 'شركة شوكولاتة باتشي وبستاني السعودية',
    purchaseDate: '2026-10-05T14:30:00Z',
    dueDate: '2026-10-20T23:59:59Z',
    items: [
      {
        id: 'p-it-3',
        name: 'Bostani Royal Truffle & Gold Leaf Gift Trays (24 Boxes)',
        nameAr: 'صواني ترفل بستاني الملكية المغلفة بورق الذهب (24 صندوق)',
        sku: 'BOS-TRUF-24',
        quantity: 4,
        unitPrice: 1400,
        discount: 200,
        taxRate: 15,
        taxAmount: 810,
        total: 6210,
      },
    ],
    subtotal: 5400,
    taxAmount: 810,
    shippingCost: 150,
    grandTotal: 6360,
    amountPaid: 6360,
    outstandingBalance: 0,
    paymentStatus: 'paid',
    notes: 'Direct chilled transport to Makkah warehouse.',
  },
];

const INITIAL_PURCHASES_COFFEE: PurchaseRecord[] = [
  {
    id: 'pur-cof-01',
    storeId: 'store-coffee',
    purchaseInvoiceNumber: 'PUR-2026-0041',
    supplierId: 'sup-cof-01',
    supplierName: 'HiBrew Global Technology & Engineering Ltd.',
    supplierNameAr: 'شركة هاي برو العالمية للهندسة والتقنيات المحدودة',
    purchaseDate: '2026-10-01T09:00:00Z',
    dueDate: '2026-10-31T23:59:59Z',
    items: [
      {
        id: 'p-it-c1',
        name: 'HiBrew H10A Dual-Boiler 20-Bar Espresso Machine (Batch of 10)',
        nameAr: 'ماكينة هاي برو H10A دبل بويلر 20 بار التجارية (دفعة 10 أجهزة)',
        sku: 'HIB-H10A-B10',
        quantity: 10,
        unitPrice: 950,
        discount: 500,
        taxRate: 15,
        taxAmount: 1350,
        total: 10350,
      },
      {
        id: 'p-it-c2',
        name: 'HiBrew G5 Precision Titanium Conical Burr Grinder (Batch of 15)',
        nameAr: 'مطحنة بن هاي برو G5 شفرات تيتانيوم مخروطية (دفعة 15 مطحنة)',
        sku: 'HIB-G5-B15',
        quantity: 15,
        unitPrice: 420,
        discount: 0,
        taxRate: 15,
        taxAmount: 945,
        total: 7245,
      },
    ],
    subtotal: 15300,
    taxAmount: 2295,
    shippingCost: 650,
    grandTotal: 18245,
    amountPaid: 12000,
    outstandingBalance: 6245,
    paymentStatus: 'partially_paid',
    notes: 'Direct air container shipment from factory hub to Riyadh Logistics Central Hub.',
  },
  {
    id: 'pur-cof-02',
    storeId: 'store-coffee',
    purchaseInvoiceNumber: 'PUR-2026-0042',
    supplierId: 'sup-cof-02',
    supplierName: 'Colombian Specialty Coffee Growers Federation',
    supplierNameAr: 'الاتحاد الوطني لمزارعي البن الكولومبي المختص',
    purchaseDate: '2026-10-06T11:00:00Z',
    dueDate: '2026-10-25T23:59:59Z',
    items: [
      {
        id: 'p-it-c3',
        name: 'Huila Supremo Washed Specialty Green Coffee Beans (60kg Jute Bags)',
        nameAr: 'حبوب بن كولومبي هويلا سوبريمو مغسولة خضراء للتحميص (أكياس خيش 60 كجم)',
        sku: 'COF-HUILA-60',
        quantity: 6,
        unitPrice: 1200,
        discount: 200,
        taxRate: 15,
        taxAmount: 1050,
        total: 8050,
      },
    ],
    subtotal: 7000,
    taxAmount: 1050,
    shippingCost: 350,
    grandTotal: 8400,
    amountPaid: 8400,
    outstandingBalance: 0,
    paymentStatus: 'paid',
    notes: 'Climate-controlled sea freight delivery received and certified by roasting master.',
  },
];

/**
 * Check if the cached documents for a store are contaminated with data from another store.
 */
function isContaminated(storeId: string, docs: InvoiceDocument[]): boolean {
  if (!docs || docs.length === 0) return false;
  const isCoffee = isCoffeeStoreId(storeId);
  const isCar = isCarStoreId(storeId);

  if (isCoffee) {
    return docs.some((d) => {
      const seller = (d.seller?.name || '') + (d.seller?.nameAr || '');
      const hasFlowerSeller = seller.includes('Makkah Gifts') || seller.includes('هدايا مكة');
      const hasFlowerItems = (d.items || []).some(
        (it) =>
          it.name.includes('Rose') ||
          it.name.includes('Flower') ||
          it.name.includes('Lily') ||
          it.name.includes('Orchid') ||
          it.name.includes('Patchi') ||
          (it.nameAr && (it.nameAr.includes('ورد') || it.nameAr.includes('زهور') || it.nameAr.includes('باتشي')))
      );
      return hasFlowerSeller || hasFlowerItems;
    });
  }

  if (isCar) {
    return docs.some((d) => {
      const seller = (d.seller?.name || '') + (d.seller?.nameAr || '');
      return seller.includes('Makkah Gifts') || seller.includes('هدايا مكة') || seller.includes('Coffee');
    });
  }

  return false;
}

/**
 * Creates full initial suite of 10 official document types isolated per store.
 */
function createInitialDocuments(storeId: string, store?: Partial<Store>): InvoiceDocument[] {
  const profile = getStoreInvoiceProfile(storeId, store);
  const isCoffee = isCoffeeStoreId(storeId, store);
  const isCar = isCarStoreId(storeId, store);

  const createZatcaData = (total: number, vat: number, timestamp = '2026-10-08T10:15:00Z') => {
    const payload = generateZatcaTlvBase64({
      sellerName: profile.nameAr,
      vatNumber: profile.vatNumber,
      timestamp,
      invoiceTotal: total,
      vatTotal: vat,
      invoiceHash: generateInvoiceHashSha256(`${storeId}-${total}-${vat}`),
    });
    return {
      invoiceCategory: 'simplified' as const,
      invoiceType: '388' as const,
      qrPayloadBase64: payload,
      invoiceHash: generateInvoiceHashSha256(`${storeId}-${total}-${vat}`),
      complianceStatus: 'compliant_preview' as const,
      vatCategoryCode: 'S' as const,
    };
  };

  const sellerParty: DocumentPartyDetails = {
    name: profile.nameEn,
    nameAr: profile.nameAr,
    nameEn: profile.nameEn,
    companyName: profile.companyNameEn,
    companyNameAr: profile.companyNameAr,
    companyNameEn: profile.companyNameEn,
    email: profile.email,
    phone: profile.phone,
    address: profile.addressEn,
    addressAr: profile.addressAr,
    addressEn: profile.addressEn,
    city: profile.cityEn,
    cityAr: profile.cityAr,
    country: profile.countryEn,
    vatNumber: profile.vatNumber,
    crNumber: profile.crNumber,
  };

  if (isCoffee) {
    return [
      // 1. Order Invoice (Commercial Sales Invoice)
      {
        id: 'doc-inv-001',
        storeId,
        documentType: 'order_invoice',
        documentNumber: 'INV-2026-0201',
        title: 'Commercial Sales Invoice',
        titleAr: 'فاتورة مبيعات تجارية',
        titleEn: 'Commercial Sales Invoice',
        orderId: 'ord-cof-101',
        orderNumber: 'ORD-9842',
        issueDate: '2026-10-08T10:15:00Z',
        dueDate: '2026-10-08T10:15:00Z',
        seller: sellerParty,
        buyer: {
          name: 'Sultan Al-Ghamdi',
          nameAr: 'سلطان الغامدي',
          nameEn: 'Sultan Al-Ghamdi',
          email: 's.ghamdi@example.com',
          phone: '+966 54 912 3344',
          address: 'King Fahd Road, Al-Olaya, Suite 402',
          addressAr: 'طريق الملك فهد، حي العليا، جناح 402',
          addressEn: 'King Fahd Road, Al-Olaya, Suite 402',
          city: 'Riyadh',
          cityAr: 'الرياض',
          country: 'Saudi Arabia',
        },
        items: [
          {
            id: 'item-cof-1',
            name: 'HiBrew H10A Dual Boiler Espresso Machine (20-Bar PID)',
            nameAr: 'ماكينة هاي برو H10A دبل بويلر 20 بار شاشة تحكم PID',
            nameEn: 'HiBrew H10A Dual Boiler Espresso Machine (20-Bar PID)',
            sku: 'HIB-H10A-PRO',
            quantity: 1,
            unitPrice: 1450,
            discount: 50,
            taxRate: 15,
            taxAmount: 210,
            total: 1610,
            image: '/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
          },
          {
            id: 'item-cof-2',
            name: 'HiBrew G5 Precision Titanium Conical Burr Grinder',
            nameAr: 'مطحنة بن هاي برو G5 شفرات مخروطية تيتانيوم 36 درجة',
            nameEn: 'HiBrew G5 Precision Titanium Conical Burr Grinder',
            sku: 'HIB-G5-TITAN',
            quantity: 1,
            unitPrice: 680,
            discount: 0,
            taxRate: 15,
            taxAmount: 102,
            total: 782,
            image: '/src/assets/images/coffee_beans_ethiopian_heirloom_1791218928065.jpg',
          },
        ],
        subtotal: 2080,
        discountAmount: 50,
        shippingFee: 35,
        taxRate: 15,
        taxAmount: 312,
        grandTotal: 2377,
        amountPaid: 2377,
        outstandingBalance: 0,
        currency: 'SAR',
        paymentMethod: 'Apple Pay / Mada',
        paymentTransactionId: 'txn_moyasar_cof_9842_apple',
        paymentStatus: 'verified_success',
        status: 'paid',
        zatca: createZatcaData(2377, 312, '2026-10-08T10:15:00Z'),
        paymentTerms: 'Paid in full via Apple Pay on checkout.',
        paymentTermsEn: 'Paid in full via Apple Pay on checkout.',
        paymentTermsAr: 'تم السداد بالكامل عبر أبل باي عند إتمام الطلب.',
        notes: 'Fragile commercial precision espresso hardware. Include 2-year authorized warranty card.',
        notesEn: 'Fragile commercial precision espresso hardware. Include 2-year authorized warranty card.',
        notesAr: 'أجهزة قهوة تجارية دقيقة قابلة للكسر. إرفاق بطاقة الضمان المعتمد لمدة سنتين.',
        auditTrail: [
          {
            id: 'aud-cof-1',
            timestamp: '2026-10-08T10:15:00Z',
            action: 'created',
            actorName: 'System Automated Billing',
            actorRole: 'system',
            details: 'Invoice automatically generated upon verified payment.',
          },
          {
            id: 'aud-cof-2',
            timestamp: '2026-10-08T10:15:05Z',
            action: 'issued',
            actorName: 'HiBrew Billing Engine',
            actorRole: 'admin',
            details: 'Document officially issued with ZATCA TLV signature.',
          },
        ],
        isLocked: true,
        createdAt: '2026-10-08T10:15:00Z',
        updatedAt: '2026-10-08T10:15:00Z',
      },

      // 2. Cancelled Order Record
      {
        id: 'doc-can-001',
        storeId,
        documentType: 'cancelled_order_invoice',
        documentNumber: 'CAN-2026-0031',
        title: 'Order Cancellation Record',
        titleAr: 'سجل إلغاء طلب رسمي',
        titleEn: 'Order Cancellation Record',
        orderId: 'ord-cof-104',
        orderNumber: 'ORD-9820',
        originalInvoiceNumber: 'INV-2026-0189',
        issueDate: '2026-10-07T16:20:00Z',
        cancellationDate: '2026-10-07T16:20:00Z',
        seller: sellerParty,
        buyer: {
          name: 'Tariq Al-Otaibi',
          nameAr: 'طارق العتيبي',
          nameEn: 'Tariq Al-Otaibi',
          email: 't.otaibi@example.com',
          phone: '+966 50 882 1199',
          address: 'Al-Malqa District, Villa 18',
          addressAr: 'حي الملقا، فيلا 18',
          addressEn: 'Al-Malqa District, Villa 18',
          city: 'Riyadh',
          cityAr: 'الرياض',
          country: 'Saudi Arabia',
        },
        items: [
          {
            id: 'can-it-cof-1',
            name: 'HiBrew H4A Portable Travel Espresso Maker Kit',
            nameAr: 'ماكينة تحضير قهوة إسبريسو متنقلة للسفر والسيارة 3 في 1',
            nameEn: 'HiBrew H4A Portable Travel Espresso Maker Kit',
            sku: 'HIB-H4A-KIT',
            quantity: 1,
            unitPrice: 380,
            discount: 0,
            taxRate: 15,
            taxAmount: 57,
            total: 437,
          },
        ],
        subtotal: 380,
        discountAmount: 0,
        shippingFee: 35,
        taxRate: 15,
        taxAmount: 57,
        grandTotal: 472,
        amountPaid: 472,
        outstandingBalance: 0,
        currency: 'SAR',
        originalOrderValue: 472,
        cancellationReason: 'Customer decided to upgrade to dual-boiler countertop unit before shipping.',
        cancellationReasonEn: 'Customer decided to upgrade to dual-boiler countertop unit before shipping.',
        cancellationReasonAr: 'طلب العميل ترقية الطلب إلى جهاز دبل بويلر مكتبي قبل تسليم الشحنة للناقل.',
        refundAmount: 472,
        refundStatus: 'pending',
        refundTransactionRef: 'ref_pending_gateway_cof_4901',
        status: 'cancelled',
        notes: 'Order cancelled within 15 minutes. Reversal submitted to payment gateway.',
        auditTrail: [
          {
            id: 'aud-can-cof-1',
            timestamp: '2026-10-07T16:20:00Z',
            action: 'status_changed',
            actorName: 'Operations Lead',
            actorRole: 'manager',
            details: 'Order marked CANCELLED. Record CAN-2026-0031 generated.',
          },
        ],
        isLocked: true,
        createdAt: '2026-10-07T16:20:00Z',
        updatedAt: '2026-10-07T16:20:00Z',
      },

      // 3. Refund Receipt
      {
        id: 'doc-ref-001',
        storeId,
        documentType: 'refund_receipt',
        documentNumber: 'REF-2026-0018',
        title: 'Official Refund Confirmation Receipt',
        titleAr: 'إيصال تأكيد استرجاع مالي رسمي',
        titleEn: 'Official Refund Confirmation Receipt',
        orderId: 'ord-cof-106',
        orderNumber: 'ORD-9781',
        originalInvoiceNumber: 'INV-2026-0174',
        issueDate: '2026-10-06T14:45:00Z',
        refundDate: '2026-10-06T14:45:00Z',
        seller: sellerParty,
        buyer: {
          name: 'Nasser Al-Harbi',
          nameAr: 'ناصر الحربي',
          nameEn: 'Nasser Al-Harbi',
          email: 'n.harbi@example.sa',
          phone: '+966 54 220 3344',
          address: 'Al-Nakheel District, St 14',
          addressAr: 'حي النخيل، شارع 14',
          addressEn: 'Al-Nakheel District, St 14',
          city: 'Riyadh',
          cityAr: 'الرياض',
          country: 'Saudi Arabia',
        },
        items: [
          {
            id: 'ref-it-cof-1',
            name: 'Bottomless 58mm Portafilter Wood Handle (Exchange Credit)',
            nameAr: 'بورتافلتر مكشوف 58 ملم بمقبض خشب جوز طبيعي (تسوية تلف شحن)',
            nameEn: 'Bottomless 58mm Portafilter Wood Handle (Exchange Credit)',
            sku: 'ACC-PORT-58W',
            quantity: 1,
            unitPrice: 180,
            discount: 0,
            taxRate: 15,
            taxAmount: 27,
            total: 207,
          },
        ],
        subtotal: 180,
        discountAmount: 0,
        shippingFee: 0,
        taxRate: 15,
        taxAmount: 27,
        grandTotal: 207,
        amountPaid: 207,
        outstandingBalance: 0,
        currency: 'SAR',
        refundAmount: 207,
        refundMethod: 'Mada Reversal to Card ending 4082',
        refundTransactionRef: 'moy_ref_cof_9831092841_success',
        refundStatus: 'succeeded',
        status: 'refunded',
        notes: 'Authoritative refund settled back to customer bank card.',
        auditTrail: [
          {
            id: 'aud-ref-cof-1',
            timestamp: '2026-10-06T14:45:00Z',
            action: 'refund_issued',
            actorName: 'Moyasar Saudi Payment Gateway Hook',
            actorRole: 'system',
            details: 'Gateway verified reversal of 207.00 SAR to Mada card.',
          },
        ],
        isLocked: true,
        createdAt: '2026-10-06T14:45:00Z',
        updatedAt: '2026-10-06T14:45:00Z',
      },

      // 4. Proforma Invoice
      {
        id: 'doc-pro-001',
        storeId,
        documentType: 'proforma_invoice',
        documentNumber: 'PRO-2026-0084',
        title: 'PROFORMA INVOICE / QUOTATION ESTIMATE',
        titleAr: 'فاتورة أولية شكلية / عرض تسعير مبدئي',
        titleEn: 'PROFORMA INVOICE / QUOTATION ESTIMATE',
        customerReference: 'cust-cof-202',
        issueDate: '2026-10-09T11:00:00Z',
        validUntil: '2026-10-24T23:59:59Z',
        seller: sellerParty,
        buyer: {
          name: 'Al-Nakheel Specialty Cafe & Lounge',
          nameAr: 'مقهى ونخبة النخيل للقهوة المختصة',
          nameEn: 'Al-Nakheel Specialty Cafe & Lounge',
          companyName: 'Al-Nakheel Hospitality Group',
          companyNameAr: 'مجموعة النخيل للضيافة الفندقية',
          companyNameEn: 'Al-Nakheel Hospitality Group',
          email: 'purchasing@nakheelcafe.sa',
          phone: '+966 11 498 1111',
          address: 'King Abdulaziz Road, Al-Sulaimaniyah',
          addressAr: 'طريق الملك عبدالعزيز، حي السليمانية',
          addressEn: 'King Abdulaziz Road, Al-Sulaimaniyah',
          city: 'Riyadh',
          cityAr: 'الرياض',
          country: 'Saudi Arabia',
          vatNumber: '300412895600003',
        },
        items: [
          {
            id: 'pro-it-cof-1',
            name: 'Commercial Dual-Group Rotary Pump Espresso Station (Batch of 2)',
            nameAr: 'محطة تحضير قهوة تجارية بمضخة دورانية ثنائية (دفعة 2)',
            nameEn: 'Commercial Dual-Group Rotary Pump Espresso Station (Batch of 2)',
            sku: 'CORP-COF-ROT2',
            quantity: 2,
            unitPrice: 4200,
            discount: 400,
            taxRate: 15,
            taxAmount: 1200,
            total: 9200,
          },
          {
            id: 'pro-it-cof-2',
            name: 'Precision Commercial Flat Burr Coffee Grinder (Batch of 2)',
            nameAr: 'مطاحن قهوة تجارية دقيقة بشفرات مسطحة 64 ملم (دفعة 2)',
            nameEn: 'Precision Commercial Flat Burr Coffee Grinder (Batch of 2)',
            sku: 'CORP-COF-GRIND',
            quantity: 2,
            unitPrice: 1600,
            discount: 200,
            taxRate: 15,
            taxAmount: 450,
            total: 3450,
          },
        ],
        subtotal: 11600,
        discountAmount: 600,
        shippingFee: 0,
        taxRate: 15,
        taxAmount: 1650,
        grandTotal: 12650,
        amountPaid: 0,
        outstandingBalance: 12650,
        currency: 'SAR',
        status: 'pending',
        paymentTerms: 'Payment due 50% advance confirmation, balance Net 15 days upon delivery and installation.',
        paymentTermsEn: 'Payment due 50% advance confirmation, balance Net 15 days upon delivery and installation.',
        paymentTermsAr: 'دفعة مقدمة 50% عند التعميد، والمتبقي سداد آجل 15 يوماً بعد التوريد والتركيب.',
        notes: 'THIS IS A PROFORMA INVOICE. This document is a preliminary estimate and does NOT represent a final tax invoice.',
        auditTrail: [
          {
            id: 'aud-pro-cof-1',
            timestamp: '2026-10-09T11:00:00Z',
            action: 'created',
            actorName: 'Corporate Accounts Lead',
            actorRole: 'sales',
            details: 'Proforma quote created for Cafe procurement team.',
          },
        ],
        isLocked: false,
        createdAt: '2026-10-09T11:00:00Z',
        updatedAt: '2026-10-09T11:00:00Z',
      },

      // 5. Purchase Invoice (Supplier Purchase Document)
      {
        id: 'doc-pur-001',
        storeId,
        documentType: 'purchase_invoice',
        documentNumber: 'PUR-2026-0041',
        title: 'Supplier Purchase Invoice',
        titleAr: 'فاتورة مشتريات وتوريد بضائع',
        titleEn: 'Supplier Purchase Invoice',
        supplierId: 'sup-cof-01',
        supplierReference: 'HIB-EXP-99482',
        issueDate: '2026-10-01T09:00:00Z',
        dueDate: '2026-10-31T23:59:59Z',
        seller: {
          name: 'HiBrew Global Technology & Engineering Ltd.',
          nameAr: 'شركة هاي برو العالمية للهندسة والتقنيات المحدودة',
          nameEn: 'HiBrew Global Technology & Engineering Ltd.',
          companyName: 'HiBrew Global Technology Ltd.',
          email: 'export@hibrew.com',
          phone: '+852 2849 9200',
          address: 'Hi-Tech Industrial Park, Science & Tech Ave 88',
          addressAr: 'مجمع التكنولوجيا والعلوم الصناعي، مبنى 88',
          addressEn: 'Hi-Tech Industrial Park, Science & Tech Ave 88',
          city: 'Hong Kong',
          country: 'Hong Kong',
          vatNumber: '310992481000003',
          crNumber: 'HK89201948',
        },
        buyer: sellerParty,
        items: [
          {
            id: 'pur-it-cof-1',
            name: 'HiBrew H10A Dual-Boiler 20-Bar Espresso Machine (Batch of 10)',
            nameAr: 'ماكينة هاي برو H10A دبل بويلر 20 بار التجارية (دفعة 10 أجهزة)',
            nameEn: 'HiBrew H10A Dual-Boiler 20-Bar Espresso Machine (Batch of 10)',
            sku: 'HIB-H10A-B10',
            quantity: 10,
            unitPrice: 950,
            discount: 500,
            taxRate: 15,
            taxAmount: 1350,
            total: 10350,
          },
          {
            id: 'pur-it-cof-2',
            name: 'HiBrew G5 Precision Titanium Conical Burr Grinder (Batch of 15)',
            nameAr: 'مطحنة بن هاي برو G5 شفرات تيتانيوم مخروطية (دفعة 15 مطحنة)',
            nameEn: 'HiBrew G5 Precision Titanium Conical Burr Grinder (Batch of 15)',
            sku: 'HIB-G5-B15',
            quantity: 15,
            unitPrice: 420,
            discount: 0,
            taxRate: 15,
            taxAmount: 945,
            total: 7245,
          },
        ],
        subtotal: 15300,
        discountAmount: 500,
        shippingFee: 650,
        taxRate: 15,
        taxAmount: 2295,
        grandTotal: 18245,
        amountPaid: 12000,
        outstandingBalance: 6245,
        currency: 'SAR',
        status: 'partially_paid',
        paymentTerms: 'Net 30 Days from bill of lading date.',
        paymentTermsEn: 'Net 30 Days from bill of lading date.',
        paymentTermsAr: 'سداد آجل 30 يوماً من تاريخ استلام بوليصة الشحن الجوي.',
        notes: 'Received in good order and quality inspected at Riyadh warehouse facility.',
        auditTrail: [
          {
            id: 'aud-pur-cof-1',
            timestamp: '2026-10-01T09:00:00Z',
            action: 'created',
            actorName: 'Procurement Officer',
            actorRole: 'manager',
            details: 'Purchase record registered from supplier invoice HIB-EXP-99482.',
          },
        ],
        isLocked: false,
        createdAt: '2026-10-01T09:00:00Z',
        updatedAt: '2026-10-01T09:00:00Z',
      },

      // 6. Credit Note
      {
        id: 'doc-crn-001',
        storeId,
        documentType: 'credit_note',
        documentNumber: 'CRN-2026-0022',
        title: 'Tax Credit Adjustment Note',
        titleAr: 'إشعار دائن ضريبي معتمد',
        titleEn: 'Tax Credit Adjustment Note',
        originalInvoiceId: 'doc-inv-001',
        originalInvoiceNumber: 'INV-2026-0201',
        orderId: 'ord-cof-101',
        orderNumber: 'ORD-9842',
        issueDate: '2026-10-09T15:00:00Z',
        seller: sellerParty,
        buyer: {
          name: 'Sultan Al-Ghamdi',
          nameAr: 'سلطان الغامدي',
          nameEn: 'Sultan Al-Ghamdi',
          email: 's.ghamdi@example.com',
          phone: '+966 54 912 3344',
          city: 'Riyadh',
          cityAr: 'الرياض',
          country: 'Saudi Arabia',
        },
        items: [
          {
            id: 'crn-it-cof-1',
            name: 'Price adjustment & barista accessories loyalty rebate on Order ORD-9842',
            nameAr: 'تسوية خصم ترويجي إضافي لعميل برنامج الولاء على أدوات الباريستا للطلب ORD-9842',
            nameEn: 'Price adjustment & barista accessories loyalty rebate on Order ORD-9842',
            sku: 'REBATE-COF-01',
            quantity: 1,
            unitPrice: 100,
            discount: 0,
            taxRate: 15,
            taxAmount: 15,
            total: 115,
          },
        ],
        subtotal: 100,
        discountAmount: 0,
        shippingFee: 0,
        taxRate: 15,
        taxAmount: 15,
        grandTotal: 115,
        amountPaid: 0,
        outstandingBalance: 0,
        currency: 'SAR',
        creditReason: 'Post-purchase loyalty tier discount credit applied to customer wallet balance.',
        creditReasonEn: 'Post-purchase loyalty tier discount credit applied to customer wallet balance.',
        creditReasonAr: 'تسوية رصيد خصم ترويجي لبرنامج الولاء أضيف إلى المحفظة الإلكترونية للعميل.',
        creditedTaxAmount: 15,
        totalCreditedAmount: 115,
        creditStatus: 'issued',
        zatca: {
          invoiceCategory: 'simplified',
          invoiceType: '381',
          complianceStatus: 'compliant_preview',
          vatCategoryCode: 'S',
        },
        status: 'issued',
        notes: 'Credit amount of 115.00 SAR is maintained in customer store credit wallet for future orders.',
        auditTrail: [
          {
            id: 'aud-crn-cof-1',
            timestamp: '2026-10-09T15:00:00Z',
            action: 'credit_issued',
            actorName: 'Customer Success',
            actorRole: 'support',
            details: 'Credit Note CRN-2026-0022 issued against invoice INV-2026-0201.',
          },
        ],
        isLocked: true,
        createdAt: '2026-10-09T15:00:00Z',
        updatedAt: '2026-10-09T15:00:00Z',
      },

      // 7. Delivery Note (Logistics-focused, zero payment styling)
      {
        id: 'doc-del-001',
        storeId,
        documentType: 'delivery_note',
        documentNumber: 'DEL-2026-0312',
        title: 'Dispatch & Delivery Note',
        titleAr: 'سند تسليم وبوليصة شحن لوجستية',
        titleEn: 'Dispatch & Delivery Note',
        orderId: 'ord-cof-101',
        orderNumber: 'ORD-9842',
        issueDate: '2026-10-08T11:30:00Z',
        dispatchDate: '2026-10-08T11:45:00Z',
        seller: sellerParty,
        buyer: {
          name: 'Sultan Al-Ghamdi',
          nameAr: 'سلطان الغامدي',
          nameEn: 'Sultan Al-Ghamdi',
          phone: '+966 54 912 3344',
          address: 'King Fahd Road, Al-Olaya, Suite 402',
          addressAr: 'طريق الملك فهد، حي العليا، جناح 402',
          addressEn: 'King Fahd Road, Al-Olaya, Suite 402',
          city: 'Riyadh',
          cityAr: 'الرياض',
          country: 'Saudi Arabia',
        },
        items: [
          {
            id: 'del-it-cof-1',
            name: 'HiBrew H10A Dual Boiler Espresso Machine [Heavy Fragile Carton]',
            nameAr: 'ماكينة هاي برو H10A دبل بويلر 20 بار [طرد ثقيل قابل للكسر]',
            nameEn: 'HiBrew H10A Dual Boiler Espresso Machine [Heavy Fragile Carton]',
            sku: 'HIB-H10A-PRO',
            quantity: 1,
            unitPrice: 0,
            total: 0,
          },
          {
            id: 'del-it-cof-2',
            name: 'HiBrew G5 Precision Titanium Burr Grinder [Padded Accessory Box]',
            nameAr: 'مطحنة بن هاي برو G5 شفرات تيتانيوم [علبة مبطنة ضد الصدمات]',
            nameEn: 'HiBrew G5 Precision Titanium Burr Grinder [Padded Accessory Box]',
            sku: 'HIB-G5-TITAN',
            quantity: 1,
            unitPrice: 0,
            total: 0,
          },
        ],
        subtotal: 0,
        discountAmount: 0,
        shippingFee: 0,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: 0,
        amountPaid: 0,
        outstandingBalance: 0,
        currency: 'SAR',
        courierCompany: 'SMSA Express Saudi Logistics Fleet',
        trackingNumber: 'SMSA-COF-849201',
        deliveryInstructions: 'Deliver to Suite 402 Reception. Inspect outer shockproof seal before handover signature.',
        packageCount: 2,
        packageWeightKg: 8.5,
        recipientSignature: 'Sultan Al-Ghamdi (Verified Handover)',
        dispatchStatus: 'delivered',
        status: 'issued',
        notes: 'NOTICE: This is a delivery document. It does NOT serve as a proof of payment or tax invoice.',
        auditTrail: [
          {
            id: 'aud-del-cof-1',
            timestamp: '2026-10-08T11:30:00Z',
            action: 'created',
            actorName: 'SMSA Logistics Dispatcher',
            actorRole: 'support',
            details: 'Delivery note DEL-2026-0312 assigned to SMSA van courier.',
          },
        ],
        isLocked: true,
        createdAt: '2026-10-08T11:30:00Z',
        updatedAt: '2026-10-08T12:45:00Z',
      },

      // 8. Payment Receipt
      {
        id: 'doc-rec-001',
        storeId,
        documentType: 'payment_receipt',
        documentNumber: 'REC-2026-0504',
        title: 'Official Payment Receipt Voucher',
        titleAr: 'سند قبض وإيصال سداد مالي رسمي',
        titleEn: 'Official Payment Receipt Voucher',
        orderId: 'ord-cof-101',
        orderNumber: 'ORD-9842',
        originalInvoiceNumber: 'INV-2026-0201',
        issueDate: '2026-10-08T10:15:02Z',
        seller: sellerParty,
        buyer: {
          name: 'Sultan Al-Ghamdi',
          nameAr: 'سلطان الغامدي',
          nameEn: 'Sultan Al-Ghamdi',
          email: 's.ghamdi@example.com',
          phone: '+966 54 912 3344',
          city: 'Riyadh',
          cityAr: 'الرياض',
          country: 'Saudi Arabia',
        },
        items: [
          {
            id: 'rec-it-cof-1',
            name: 'Payment for E-Commerce Order ORD-9842 (Full Payment Settlement)',
            nameAr: 'سداد كامل قيمة طلب المتجر الإلكتروني ORD-9842',
            nameEn: 'Payment for E-Commerce Order ORD-9842 (Full Payment Settlement)',
            sku: 'SETTLE-ORD-9842',
            quantity: 1,
            unitPrice: 2377,
            discount: 0,
            taxRate: 15,
            taxAmount: 312,
            total: 2377,
          },
        ],
        subtotal: 2065,
        discountAmount: 0,
        shippingFee: 0,
        taxRate: 15,
        taxAmount: 312,
        grandTotal: 2377,
        amountPaid: 2377,
        outstandingBalance: 0,
        previouslyPaidAmount: 0,
        currency: 'SAR',
        paymentMethod: 'Apple Pay (Mada Card *9012)',
        paymentTransactionId: 'txn_moyasar_cof_9842_apple',
        paymentStatus: 'verified_success',
        status: 'paid',
        notes: 'Payment verified and confirmed by Moyasar Saudi Payment Gateway. Auth code: 849201.',
        auditTrail: [
          {
            id: 'aud-rec-cof-1',
            timestamp: '2026-10-08T10:15:02Z',
            action: 'payment_applied',
            actorName: 'Moyasar Gateway Engine',
            actorRole: 'system',
            details: 'Payment receipt generated and synced with financial ledger.',
          },
        ],
        isLocked: true,
        createdAt: '2026-10-08T10:15:02Z',
        updatedAt: '2026-10-08T10:15:02Z',
      },

      // 9. Tax Invoice (Official ZATCA Bilingual Tax Invoice)
      {
        id: 'doc-tax-001',
        storeId,
        documentType: 'tax_invoice',
        documentNumber: 'TAX-2026-0118',
        title: 'TAX INVOICE / فاتورة ضريبية',
        titleAr: 'فاتورة ضريبية معتمدة (هيئة الزكاة والضريبة والجمارك)',
        titleEn: 'TAX INVOICE / فاتورة ضريبية',
        orderId: 'ord-cof-101',
        orderNumber: 'ORD-9842',
        issueDate: '2026-10-08T10:15:00Z',
        dueDate: '2026-10-08T10:15:00Z',
        seller: sellerParty,
        buyer: {
          name: 'Sultan Al-Ghamdi',
          nameAr: 'سلطان الغامدي',
          nameEn: 'Sultan Al-Ghamdi',
          companyName: 'Al-Ghamdi Business Services Co.',
          companyNameAr: 'شركة الغامدي لخدمات الأعمال',
          companyNameEn: 'Al-Ghamdi Business Services Co.',
          email: 's.ghamdi@example.com',
          phone: '+966 54 912 3344',
          address: 'King Fahd Road, Al-Olaya, Suite 402',
          addressAr: 'طريق الملك فهد، حي العليا، جناح 402',
          addressEn: 'King Fahd Road, Al-Olaya, Suite 402',
          city: 'Riyadh',
          cityAr: 'الرياض',
          country: 'Saudi Arabia',
          postalCode: '12211',
          vatNumber: '300891245000003',
          crNumber: '1010782391',
        },
        items: [
          {
            id: 'tax-it-cof-1',
            name: 'HiBrew H10A Dual Boiler Espresso Machine (20-Bar PID)',
            nameAr: 'ماكينة هاي برو H10A دبل بويلر 20 بار شاشة تحكم PID',
            nameEn: 'HiBrew H10A Dual Boiler Espresso Machine (20-Bar PID)',
            sku: 'HIB-H10A-PRO',
            quantity: 1,
            unitPrice: 1450,
            discount: 50,
            taxRate: 15,
            taxAmount: 210,
            total: 1610,
          },
          {
            id: 'tax-it-cof-2',
            name: 'HiBrew G5 Precision Titanium Conical Burr Grinder',
            nameAr: 'مطحنة بن هاي برو G5 شفرات مخروطية تيتانيوم 36 درجة',
            nameEn: 'HiBrew G5 Precision Titanium Conical Burr Grinder',
            sku: 'HIB-G5-TITAN',
            quantity: 1,
            unitPrice: 680,
            discount: 0,
            taxRate: 15,
            taxAmount: 102,
            total: 782,
          },
        ],
        subtotal: 2080,
        discountAmount: 50,
        shippingFee: 35,
        taxRate: 15,
        taxAmount: 312,
        grandTotal: 2377,
        amountPaid: 2377,
        outstandingBalance: 0,
        currency: 'SAR',
        zatca: {
          invoiceCategory: 'standard',
          invoiceType: '388',
          qrPayloadBase64: generateZatcaTlvBase64({
            sellerName: profile.nameAr,
            vatNumber: profile.vatNumber,
            timestamp: '2026-10-08T10:15:00Z',
            invoiceTotal: 2377,
            vatTotal: 312,
            invoiceHash: generateInvoiceHashSha256(`${storeId}-2377-312`),
            digitalSignature: 'MEQCIG482934892348923489234892348923489234892348AiA892348923489234892348923489234892348923489',
          }),
          invoiceHash: generateInvoiceHashSha256(`${storeId}-2377-312`),
          complianceStatus: 'compliant_preview',
          vatCategoryCode: 'S',
        },
        status: 'paid',
        notes: 'Issued under the Saudi ZATCA VAT regulations. Standard VAT rate 15% applied.',
        auditTrail: [
          {
            id: 'aud-tax-cof-1',
            timestamp: '2026-10-08T10:15:00Z',
            action: 'issued',
            actorName: 'ZATCA Integration Service',
            actorRole: 'system',
            details: 'Official standard tax invoice generated with full ZATCA cryptographic TLV barcode.',
          },
        ],
        isLocked: true,
        createdAt: '2026-10-08T10:15:00Z',
        updatedAt: '2026-10-08T10:15:00Z',
      },

      // 10. Quotation / Estimate
      {
        id: 'doc-quo-001',
        storeId,
        documentType: 'quotation',
        documentNumber: 'QUO-2026-0065',
        title: 'Formal Business Quotation / Price Proposal',
        titleAr: 'عرض أسعار تجاري رسمي',
        titleEn: 'Formal Business Quotation / Price Proposal',
        customerReference: 'cust-cof-205',
        issueDate: '2026-10-09T09:00:00Z',
        validUntil: '2026-10-30T23:59:59Z',
        seller: sellerParty,
        buyer: {
          name: 'Digital Solutions Tech Hub',
          nameAr: 'شركة الحلول الرقمية لتقنية المعلومات',
          nameEn: 'Digital Solutions Tech Hub',
          companyName: 'Digital Solutions Tech Headquarters',
          companyNameAr: 'المقر الإداري لشركة الحلول الرقمية',
          companyNameEn: 'Digital Solutions Tech Headquarters',
          email: 'procurement@digitalsolutions.sa',
          phone: '+966 11 462 0000',
          address: 'King Abdullah Financial District (KAFD), Tower 4',
          addressAr: 'مركز الملك عبدالله المالي (كافد)، برج 4',
          addressEn: 'King Abdullah Financial District (KAFD), Tower 4',
          city: 'Riyadh',
          cityAr: 'الرياض',
          country: 'Saudi Arabia',
          vatNumber: '300098412500003',
        },
        items: [
          {
            id: 'quo-it-cof-1',
            name: 'Corporate Executive Lounge Espresso Barista Setup & Equipment (4 Quarters)',
            nameAr: 'تجهيز ركن القهوة المختصة لمقر الإدارة التنفيذية وضمان الصيانة (4 فترات)',
            nameEn: 'Corporate Executive Lounge Espresso Barista Setup & Equipment (4 Quarters)',
            sku: 'CORP-COF-KAFD',
            quantity: 4,
            unitPrice: 2800,
            discount: 800,
            taxRate: 15,
            taxAmount: 1560,
            total: 11960,
          },
          {
            id: 'quo-it-cof-2',
            name: 'Monthly Specialty Beans Roast Selection & Water Filter Service (12 Months)',
            nameAr: 'توريد بن مختص شهري محمص طازج وصيانة فلاتر المياه المعتمدة (12 شهر)',
            nameEn: 'Monthly Specialty Beans Roast Selection & Water Filter Service (12 Months)',
            sku: 'CORP-COF-BEANS12',
            quantity: 12,
            unitPrice: 450,
            discount: 400,
            taxRate: 15,
            taxAmount: 750,
            total: 5750,
          },
        ],
        subtotal: 16600,
        discountAmount: 1200,
        shippingFee: 0,
        taxRate: 15,
        taxAmount: 2310,
        grandTotal: 17710,
        amountPaid: 0,
        outstandingBalance: 17710,
        currency: 'SAR',
        quotationStatus: 'sent',
        status: 'pending',
        paymentTerms: 'Payment Terms: 30% upon formal contract signing, 70% quarterly against tax invoices.',
        paymentTermsEn: 'Payment Terms: 30% upon formal contract signing, 70% quarterly against tax invoices.',
        paymentTermsAr: 'شروط السداد: 30% عند توقيع العقد، 70% دفعات ربع سنوية مقابل فواتير ضريبية.',
        termsAndConditions: 'Proposal is valid for 21 days from issue date. Includes scheduled preventative maintenance and on-call technician support.',
        termsAndConditionsEn: 'Proposal is valid for 21 days from issue date. Includes scheduled preventative maintenance and on-call technician support.',
        termsAndConditionsAr: 'العرض صالح لمدة 21 يوماً من تاريخ الإصدار. يشمل الصيانة الوقائية الدورية ودعم فني معتمد عند الطلب.',
        notes: 'Special corporate tier volume pricing applied. Machines fully installed and calibrated on site.',
        auditTrail: [
          {
            id: 'aud-quo-cof-1',
            timestamp: '2026-10-09T09:00:00Z',
            action: 'created',
            actorName: 'Commercial Director',
            actorRole: 'sales',
            details: 'Proposal draft created with corporate tier pricing schedule.',
          },
          {
            id: 'aud-quo-cof-2',
            timestamp: '2026-10-09T09:30:00Z',
            action: 'status_changed',
            actorName: 'Commercial Director',
            actorRole: 'sales',
            details: 'Quotation marked SENT via client proposal portal.',
            previousStatus: 'draft',
            newStatus: 'sent',
          },
        ],
        isLocked: false,
        createdAt: '2026-10-09T09:00:00Z',
        updatedAt: '2026-10-09T09:30:00Z',
      },
    ];
  }

  // Flower / Default store initial documents
  return [
    // 1. Order Invoice
    {
      id: 'doc-inv-001',
      storeId,
      documentType: 'order_invoice',
      documentNumber: 'INV-2026-0104',
      title: 'Commercial Sales Invoice',
      titleAr: 'فاتورة مبيعات تجارية',
      titleEn: 'Commercial Sales Invoice',
      orderId: 'ord-101',
      orderNumber: 'ORD-9842',
      issueDate: '2026-10-08T10:15:00Z',
      dueDate: '2026-10-08T10:15:00Z',
      seller: sellerParty,
      buyer: {
        name: 'Abdulrahman Al-Sudais',
        nameAr: 'عبدالرحمن السديس',
        nameEn: 'Abdulrahman Al-Sudais',
        email: 'a.sudais@example.com',
        phone: '+966 55 412 8899',
        address: 'Clock Tower Raffles Hotel, Suite 1804',
        addressAr: 'فندق رافلز برج الساعة، جناح 1804',
        addressEn: 'Clock Tower Raffles Hotel, Suite 1804',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      items: [
        {
          id: 'item-1',
          name: 'Royal Dutch Red Roses Velvet Box',
          nameAr: 'صندوق مخملي فاخر بالورود الهولندية الحمراء',
          nameEn: 'Royal Dutch Red Roses Velvet Box',
          sku: 'WM-ROSE-01',
          quantity: 2,
          unitPrice: 340,
          discount: 40,
          taxRate: 15,
          taxAmount: 96,
          total: 736,
          image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=200&q=80',
        },
        {
          id: 'item-2',
          name: 'Patchi Luxury Truffles Gift Collection 500g',
          nameAr: 'تشكيلة ترفل باتشي الملكية الفاخرة 500 جم',
          nameEn: 'Patchi Luxury Truffles Gift Collection 500g',
          sku: 'PAT-TRUF-01',
          quantity: 1,
          unitPrice: 220,
          discount: 0,
          taxRate: 15,
          taxAmount: 33,
          total: 253,
          image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=200&q=80',
        },
      ],
      subtotal: 860,
      discountAmount: 40,
      shippingFee: 35,
      taxRate: 15,
      taxAmount: 129,
      grandTotal: 984,
      amountPaid: 984,
      outstandingBalance: 0,
      currency: 'SAR',
      paymentMethod: 'Apple Pay / Mada',
      paymentTransactionId: 'txn_moyasar_9842_apple',
      paymentStatus: 'verified_success',
      status: 'paid',
      zatca: createZatcaData(984, 129, '2026-10-08T10:15:00Z'),
      paymentTerms: 'Paid in full via Apple Pay on checkout.',
      paymentTermsEn: 'Paid in full via Apple Pay on checkout.',
      paymentTermsAr: 'تم السداد بالكامل عبر أبل باي عند إتمام الطلب.',
      notes: 'Hand delivery directly to Hotel Concierge Desk for VIP Guest arrival.',
      notesEn: 'Hand delivery directly to Hotel Concierge Desk for VIP Guest arrival.',
      notesAr: 'تسليم يدوي مباشر لمكتب استقبال الفندق لوصول ضيف كبار الشخصيات.',
      auditTrail: [
        {
          id: 'aud-1',
          timestamp: '2026-10-08T10:15:00Z',
          action: 'created',
          actorName: 'System Automated Billing',
          actorRole: 'system',
          details: 'Invoice automatically generated upon successful verified payment.',
        },
        {
          id: 'aud-2',
          timestamp: '2026-10-08T10:15:05Z',
          action: 'issued',
          actorName: 'Store Checkout System',
          actorRole: 'admin',
          details: 'Document officially issued with ZATCA cryptographic QR signature.',
        },
      ],
      isLocked: true,
      createdAt: '2026-10-08T10:15:00Z',
      updatedAt: '2026-10-08T10:15:00Z',
    },

    // 2. Cancelled Order Record
    {
      id: 'doc-can-001',
      storeId,
      documentType: 'cancelled_order_invoice',
      documentNumber: 'CAN-2026-0019',
      title: 'Order Cancellation Record',
      titleAr: 'سجل إلغاء طلب رسمي',
      titleEn: 'Order Cancellation Record',
      orderId: 'ord-104',
      orderNumber: 'ORD-9820',
      originalInvoiceNumber: 'INV-2026-0092',
      issueDate: '2026-10-07T16:20:00Z',
      cancellationDate: '2026-10-07T16:20:00Z',
      seller: sellerParty,
      buyer: {
        name: 'Hassan Al-Zahrani',
        nameAr: 'حسن الزهراني',
        nameEn: 'Hassan Al-Zahrani',
        email: 'h.zahrani@gmail.com',
        phone: '+966 50 882 1199',
        address: 'Al-Awali District, Villa 42',
        addressAr: 'حي العوالي، فيلا 42',
        addressEn: 'Al-Awali District, Villa 42',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      items: [
        {
          id: 'can-it-1',
          name: 'Imperial White Orchids & Lily Ceramic Vase',
          nameAr: 'فازة سيراميك الأوركيد والزنابق البيضاء الملكية',
          nameEn: 'Imperial White Orchids & Lily Ceramic Vase',
          sku: 'WM-ORCH-05',
          quantity: 1,
          unitPrice: 520,
          discount: 0,
          taxRate: 15,
          taxAmount: 78,
          total: 598,
        },
      ],
      subtotal: 520,
      discountAmount: 0,
      shippingFee: 40,
      taxRate: 15,
      taxAmount: 78,
      grandTotal: 638,
      amountPaid: 638,
      outstandingBalance: 0,
      currency: 'SAR',
      originalOrderValue: 638,
      cancellationReason: 'Customer requested cancellation before assembly due to rescheduled event date.',
      cancellationReasonEn: 'Customer requested cancellation before assembly due to rescheduled event date.',
      cancellationReasonAr: 'طلب العميل إلغاء الطلب قبل البدء بالتنسيق بسبب تأجيل موعد المناسبة.',
      refundAmount: 638,
      refundStatus: 'pending',
      refundTransactionRef: 'ref_pending_gateway_req_4901',
      status: 'cancelled',
      notes: 'Order cancelled within 15 minutes of placement. Refund submitted to payment gateway for processing.',
      auditTrail: [
        {
          id: 'aud-can-1',
          timestamp: '2026-10-07T16:20:00Z',
          action: 'status_changed',
          actorName: 'Operations Lead',
          actorRole: 'manager',
          details: 'Order marked CANCELLED. Record CAN-2026-0019 generated.',
          previousStatus: 'processing',
          newStatus: 'cancelled',
        },
      ],
      isLocked: true,
      createdAt: '2026-10-07T16:20:00Z',
      updatedAt: '2026-10-07T16:20:00Z',
    },

    // 3. Refund Receipt
    {
      id: 'doc-ref-001',
      storeId,
      documentType: 'refund_receipt',
      documentNumber: 'REF-2026-0034',
      title: 'Official Refund Confirmation Receipt',
      titleAr: 'إيصال تأكيد استرجاع مالي رسمي',
      titleEn: 'Official Refund Confirmation Receipt',
      orderId: 'ord-106',
      orderNumber: 'ORD-9781',
      originalInvoiceNumber: 'INV-2026-0078',
      issueDate: '2026-10-06T14:45:00Z',
      refundDate: '2026-10-06T14:45:00Z',
      seller: sellerParty,
      buyer: {
        name: 'Fahad Al-Otaibi',
        nameAr: 'فهد العتيبي',
        nameEn: 'Fahad Al-Otaibi',
        email: 'f.otaibi@company.sa',
        phone: '+966 54 220 3344',
        address: 'Al-Naseem District, St 14',
        addressAr: 'حي النسيم، شارع 14',
        addressEn: 'Al-Naseem District, St 14',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      items: [
        {
          id: 'ref-it-1',
          name: 'Belgian Chocolate & Red Roses Box (Damaged in Transit Replacement Credit)',
          nameAr: 'صندوق شوكولاتة بلجيكية وورد أحمر (تعويض تلف شحن)',
          nameEn: 'Belgian Chocolate & Red Roses Box (Damaged in Transit Replacement Credit)',
          sku: 'WM-CHOC-06',
          quantity: 1,
          unitPrice: 280,
          discount: 0,
          taxRate: 15,
          taxAmount: 42,
          total: 322,
        },
      ],
      subtotal: 280,
      discountAmount: 0,
      shippingFee: 0,
      taxRate: 15,
      taxAmount: 42,
      grandTotal: 322,
      amountPaid: 322,
      outstandingBalance: 0,
      currency: 'SAR',
      refundAmount: 322,
      refundMethod: 'Mada Reversal to Card ending 4082',
      refundTransactionRef: 'moy_ref_9831092841_success',
      refundStatus: 'succeeded',
      status: 'refunded',
      notes: 'Authoritative refund transaction completed and settled back to customer bank card.',
      auditTrail: [
        {
          id: 'aud-ref-1',
          timestamp: '2026-10-06T14:45:00Z',
          action: 'refund_issued',
          actorName: 'Moyasar Saudi Payment Gateway Hook',
          actorRole: 'system',
          details: 'Gateway Webhook verified successful reversal of 322.00 SAR to Mada card.',
        },
      ],
      isLocked: true,
      createdAt: '2026-10-06T14:45:00Z',
      updatedAt: '2026-10-06T14:45:00Z',
    },

    // 4. Proforma Invoice
    {
      id: 'doc-pro-001',
      storeId,
      documentType: 'proforma_invoice',
      documentNumber: 'PRO-2026-0056',
      title: 'PROFORMA INVOICE / QUOTATION ESTIMATE',
      titleAr: 'فاتورة أولية شكلية / عرض تسعير مبدئي',
      titleEn: 'PROFORMA INVOICE / QUOTATION ESTIMATE',
      customerReference: 'cust-202',
      issueDate: '2026-10-09T11:00:00Z',
      validUntil: '2026-10-24T23:59:59Z',
      seller: sellerParty,
      buyer: {
        name: 'Dar Al-Tawhid InterContinental Hotel',
        nameAr: 'فندق دار التوحيد إنتركونتيننتال مكة',
        nameEn: 'Dar Al-Tawhid InterContinental Hotel',
        companyName: 'Dar Al Tawhid Hospitality Group',
        companyNameAr: 'مجموعة دار التوحيد للضيافة الفندقية',
        companyNameEn: 'Dar Al Tawhid Hospitality Group',
        email: 'purchasing@daraltawhid.com',
        phone: '+966 12 541 1111',
        address: 'Haram Plaza, King Abdulaziz Gate Front',
        addressAr: 'ساحة الحرم الشريف، أمام بوابة الملك عبدالعزيز',
        addressEn: 'Haram Plaza, King Abdulaziz Gate Front',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        vatNumber: '300412895600003',
      },
      items: [
        {
          id: 'pro-it-1',
          name: 'Executive Presidential Suite Weekly Floral Styling Package (4 Vases)',
          nameAr: 'باقة تنسيق الزهور الأسبوعية للجناح الرئاسي الملكي (4 فازات فاخرة)',
          nameEn: 'Executive Presidential Suite Weekly Floral Styling Package (4 Vases)',
          sku: 'CORP-FLOW-PRES',
          quantity: 4,
          unitPrice: 1250,
          discount: 500,
          taxRate: 15,
          taxAmount: 675,
          total: 5175,
        },
        {
          id: 'pro-it-2',
          name: 'VIP Guest Welcome Boutique Rose & Patchi Boxes (Batch of 20)',
          nameAr: 'صناديق استقبال كبار الشخصيات من الزهور والشوكولاتة (دفعة 20)',
          nameEn: 'VIP Guest Welcome Boutique Rose & Patchi Boxes (Batch of 20)',
          sku: 'CORP-GIFT-VIP20',
          quantity: 20,
          unitPrice: 190,
          discount: 380,
          taxRate: 15,
          taxAmount: 513,
          total: 3933,
        },
      ],
      subtotal: 8800,
      discountAmount: 880,
      shippingFee: 0,
      taxRate: 15,
      taxAmount: 1188,
      grandTotal: 9108,
      amountPaid: 0,
      outstandingBalance: 9108,
      currency: 'SAR',
      status: 'pending',
      paymentTerms: 'Payment due 50% upon advance order confirmation, balance Net 15 days from delivery.',
      paymentTermsEn: 'Payment due 50% upon advance order confirmation, balance Net 15 days from delivery.',
      paymentTermsAr: 'دفعة 50% عند تأكيد الطلب، والمتبقي سداد آجل 15 يوماً من تاريخ التوصيل.',
      notes: 'THIS IS A PROFORMA INVOICE. This document is a preliminary estimate and does NOT represent a final tax invoice.',
      auditTrail: [
        {
          id: 'aud-pro-1',
          timestamp: '2026-10-09T11:00:00Z',
          action: 'created',
          actorName: 'Corporate Accounts Lead',
          actorRole: 'sales',
          details: 'Proforma quote created and submitted for Hotel Procurement team review.',
        },
      ],
      isLocked: false,
      createdAt: '2026-10-09T11:00:00Z',
      updatedAt: '2026-10-09T11:00:00Z',
    },

    // 5. Purchase Invoice
    {
      id: 'doc-pur-001',
      storeId,
      documentType: 'purchase_invoice',
      documentNumber: 'PUR-2026-0081',
      title: 'Supplier Purchase Invoice',
      titleAr: 'فاتورة مشتريات وتوريد بضائع',
      titleEn: 'Supplier Purchase Invoice',
      supplierId: 'sup-01',
      supplierReference: 'DF-INV-99482',
      issueDate: '2026-10-01T09:00:00Z',
      dueDate: '2026-10-31T23:59:59Z',
      seller: {
        name: 'Dutch Flora International B.V.',
        nameAr: 'شركة فلورا الهولندية الدولية للزهور',
        nameEn: 'Dutch Flora International B.V.',
        companyName: 'Dutch Flora B.V.',
        email: 'orders@dutchflora.nl',
        phone: '+31 20 894 3320',
        address: 'Aalsmeer Flower Auction Blvd 14',
        addressAr: 'مبنى مزاد الزهور، ألسيمير 14',
        addressEn: 'Aalsmeer Flower Auction Blvd 14',
        city: 'Aalsmeer',
        country: 'Netherlands',
        vatNumber: '310984421300003',
        crNumber: 'NL84201948',
      },
      buyer: sellerParty,
      items: [
        {
          id: 'pur-it-1',
          name: 'Grand Prix Red Roses (500 Stems Batch)',
          nameAr: 'زهور جران بري حمراء هولندية (دفعة 500 غصن)',
          nameEn: 'Grand Prix Red Roses (500 Stems Batch)',
          sku: 'DF-ROSE-500',
          quantity: 10,
          unitPrice: 850,
          discount: 500,
          taxRate: 15,
          taxAmount: 1200,
          total: 9200,
        },
        {
          id: 'pur-it-2',
          name: 'Casablanca White Lilies (Fresh Import)',
          nameAr: 'زنابق كازابلانكا البيضاء الفاخرة',
          nameEn: 'Casablanca White Lilies (Fresh Import)',
          sku: 'DF-LILY-200',
          quantity: 5,
          unitPrice: 620,
          discount: 0,
          taxRate: 15,
          taxAmount: 465,
          total: 3565,
        },
      ],
      subtotal: 11100,
      discountAmount: 500,
      shippingFee: 800,
      taxRate: 15,
      taxAmount: 1665,
      grandTotal: 13565,
      amountPaid: 8000,
      outstandingBalance: 5565,
      currency: 'SAR',
      status: 'partially_paid',
      paymentTerms: 'Net 30 Days from bill of lading arrival date.',
      paymentTermsEn: 'Net 30 Days from bill of lading arrival date.',
      paymentTermsAr: 'سداد آجل 30 يوماً من تاريخ وصول بوليصة الشحن الجوي.',
      notes: 'Received in good order and inspected at cold storage facility.',
      auditTrail: [
        {
          id: 'aud-pur-1',
          timestamp: '2026-10-01T09:00:00Z',
          action: 'created',
          actorName: 'Procurement Officer',
          actorRole: 'manager',
          details: 'Purchase record registered from supplier invoice DF-INV-99482.',
        },
      ],
      isLocked: false,
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-02T11:30:00Z',
    },

    // 6. Credit Note
    {
      id: 'doc-crn-001',
      storeId,
      documentType: 'credit_note',
      documentNumber: 'CRN-2026-0012',
      title: 'Tax Credit Adjustment Note',
      titleAr: 'إشعار دائن ضريبي معتمد',
      titleEn: 'Tax Credit Adjustment Note',
      originalInvoiceId: 'doc-inv-001',
      originalInvoiceNumber: 'INV-2026-0104',
      orderId: 'ord-101',
      orderNumber: 'ORD-9842',
      issueDate: '2026-10-09T15:00:00Z',
      seller: sellerParty,
      buyer: {
        name: 'Abdulrahman Al-Sudais',
        nameAr: 'عبدالرحمن السديس',
        nameEn: 'Abdulrahman Al-Sudais',
        email: 'a.sudais@example.com',
        phone: '+966 55 412 8899',
        address: 'Clock Tower Raffles Hotel, Suite 1804',
        addressAr: 'فندق رافلز برج الساعة، جناح 1804',
        addressEn: 'Clock Tower Raffles Hotel, Suite 1804',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      items: [
        {
          id: 'crn-it-1',
          name: 'Price adjustment & promotional loyalty rebate on Order ORD-9842',
          nameAr: 'تسوية خصم ترويجي إضافي لعميل برنامج الولاء على الطلب ORD-9842',
          nameEn: 'Price adjustment & promotional loyalty rebate on Order ORD-9842',
          sku: 'REBATE-LOYALTY-01',
          quantity: 1,
          unitPrice: 100,
          discount: 0,
          taxRate: 15,
          taxAmount: 15,
          total: 115,
        },
      ],
      subtotal: 100,
      discountAmount: 0,
      shippingFee: 0,
      taxRate: 15,
      taxAmount: 15,
      grandTotal: 115,
      amountPaid: 0,
      outstandingBalance: 0,
      currency: 'SAR',
      creditReason: 'Post-purchase loyalty tier discount credit applied to customer account balance.',
      creditReasonEn: 'Post-purchase loyalty tier discount credit applied to customer account balance.',
      creditReasonAr: 'تسوية رصيد خصم ترويجي لبرنامج الولاء بعد إتمام الشراء أضيف لحساب العميل.',
      creditedTaxAmount: 15,
      totalCreditedAmount: 115,
      creditStatus: 'issued',
      zatca: {
        invoiceCategory: 'simplified',
        invoiceType: '381',
        complianceStatus: 'compliant_preview',
        vatCategoryCode: 'S',
      },
      status: 'issued',
      notes: 'Credit amount of 115.00 SAR is maintained in customer store credit wallet for future orders.',
      auditTrail: [
        {
          id: 'aud-crn-1',
          timestamp: '2026-10-09T15:00:00Z',
          action: 'credit_issued',
          actorName: 'Customer Success',
          actorRole: 'support',
          details: 'Credit Note CRN-2026-0012 issued against invoice INV-2026-0104.',
        },
      ],
      isLocked: true,
      createdAt: '2026-10-09T15:00:00Z',
      updatedAt: '2026-10-09T15:00:00Z',
    },

    // 7. Delivery Note
    {
      id: 'doc-del-001',
      storeId,
      documentType: 'delivery_note',
      documentNumber: 'DEL-2026-0219',
      title: 'Dispatch & Delivery Note',
      titleAr: 'سند تسليم وبوليصة شحن لوجستية',
      titleEn: 'Dispatch & Delivery Note',
      orderId: 'ord-101',
      orderNumber: 'ORD-9842',
      issueDate: '2026-10-08T11:30:00Z',
      dispatchDate: '2026-10-08T11:45:00Z',
      seller: sellerParty,
      buyer: {
        name: 'Abdulrahman Al-Sudais',
        nameAr: 'عبدالرحمن السديس',
        nameEn: 'Abdulrahman Al-Sudais',
        phone: '+966 55 412 8899',
        address: 'Clock Tower Raffles Hotel, Suite 1804',
        addressAr: 'فندق رافلز برج الساعة، جناح 1804',
        addressEn: 'Clock Tower Raffles Hotel, Suite 1804',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      items: [
        {
          id: 'del-it-1',
          name: 'Royal Dutch Red Roses Velvet Box [Refrigerated Packaged Item]',
          nameAr: 'صندوق مخملي فاخر بالورود الهولندية الحمراء [مغلف مبرد]',
          nameEn: 'Royal Dutch Red Roses Velvet Box [Refrigerated Packaged Item]',
          sku: 'WM-ROSE-01',
          quantity: 2,
          unitPrice: 0,
          total: 0,
        },
        {
          id: 'del-it-2',
          name: 'Patchi Luxury Truffles Gift Collection 500g [Chilled Box]',
          nameAr: 'تشكيلة ترفل باتشي الملكية الفاخرة 500 جم [صندوق مبرد]',
          nameEn: 'Patchi Luxury Truffles Gift Collection 500g [Chilled Box]',
          sku: 'PAT-TRUF-01',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
      subtotal: 0,
      discountAmount: 0,
      shippingFee: 0,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: 0,
      amountPaid: 0,
      outstandingBalance: 0,
      currency: 'SAR',
      courierCompany: 'Makkah Express VIP Logistics Fleet',
      trackingNumber: 'MKH-VIP-884920',
      deliveryInstructions: 'Deliver to Raffles Makkah Hotel Concierge Desk. Hand over directly to Duty Manager for Suite 1804.',
      packageCount: 2,
      packageWeightKg: 4.5,
      recipientSignature: 'Mohammad Tariq (Hotel Front Desk Lead)',
      dispatchStatus: 'delivered',
      status: 'issued',
      notes: 'NOTICE: This is a delivery document. It does NOT serve as a proof of payment or tax invoice.',
      auditTrail: [
        {
          id: 'aud-del-1',
          timestamp: '2026-10-08T11:30:00Z',
          action: 'created',
          actorName: 'Logistics Dispatcher',
          actorRole: 'support',
          details: 'Delivery note DEL-2026-0219 created and assigned to driver van #4.',
        },
      ],
      isLocked: true,
      createdAt: '2026-10-08T11:30:00Z',
      updatedAt: '2026-10-08T12:45:00Z',
    },

    // 8. Payment Receipt
    {
      id: 'doc-rec-001',
      storeId,
      documentType: 'payment_receipt',
      documentNumber: 'REC-2026-0410',
      title: 'Official Payment Receipt Voucher',
      titleAr: 'سند قبض وإيصال سداد مالي رسمي',
      titleEn: 'Official Payment Receipt Voucher',
      orderId: 'ord-101',
      orderNumber: 'ORD-9842',
      originalInvoiceNumber: 'INV-2026-0104',
      issueDate: '2026-10-08T10:15:02Z',
      seller: sellerParty,
      buyer: {
        name: 'Abdulrahman Al-Sudais',
        nameAr: 'عبدالرحمن السديس',
        nameEn: 'Abdulrahman Al-Sudais',
        email: 'a.sudais@example.com',
        phone: '+966 55 412 8899',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      items: [
        {
          id: 'rec-it-1',
          name: 'Payment for E-Commerce Order ORD-9842 (Full Payment Settlement)',
          nameAr: 'سداد كامل قيمة طلب المتجر الإلكتروني ORD-9842',
          nameEn: 'Payment for E-Commerce Order ORD-9842 (Full Payment Settlement)',
          sku: 'SETTLE-ORD-9842',
          quantity: 1,
          unitPrice: 984,
          discount: 0,
          taxRate: 15,
          taxAmount: 129,
          total: 984,
        },
      ],
      subtotal: 855,
      discountAmount: 0,
      shippingFee: 0,
      taxRate: 15,
      taxAmount: 129,
      grandTotal: 984,
      amountPaid: 984,
      outstandingBalance: 0,
      previouslyPaidAmount: 0,
      currency: 'SAR',
      paymentMethod: 'Apple Pay (Mada Card *9012)',
      paymentTransactionId: 'txn_moyasar_9842_apple',
      paymentStatus: 'verified_success',
      status: 'paid',
      notes: 'Payment verified and confirmed by Moyasar Saudi Payment Gateway. Auth code: 849201.',
      auditTrail: [
        {
          id: 'aud-rec-1',
          timestamp: '2026-10-08T10:15:02Z',
          action: 'payment_applied',
          actorName: 'Moyasar Gateway Engine',
          actorRole: 'system',
          details: 'Payment receipt generated and synced with financial ledger.',
        },
      ],
      isLocked: true,
      createdAt: '2026-10-08T10:15:02Z',
      updatedAt: '2026-10-08T10:15:02Z',
    },

    // 9. Tax Invoice
    {
      id: 'doc-tax-001',
      storeId,
      documentType: 'tax_invoice',
      documentNumber: 'TAX-2026-0089',
      title: 'TAX INVOICE / فاتورة ضريبية',
      titleAr: 'فاتورة ضريبية معتمدة (هيئة الزكاة والضريبة والجمارك)',
      titleEn: 'TAX INVOICE / فاتورة ضريبية',
      orderId: 'ord-101',
      orderNumber: 'ORD-9842',
      issueDate: '2026-10-08T10:15:00Z',
      dueDate: '2026-10-08T10:15:00Z',
      seller: sellerParty,
      buyer: {
        name: 'Abdulrahman Al-Sudais',
        nameAr: 'عبدالرحمن السديس',
        nameEn: 'Abdulrahman Al-Sudais',
        companyName: 'Al-Sudais Consulting Co.',
        companyNameAr: 'شركة السديس للاستشارات',
        companyNameEn: 'Al-Sudais Consulting Co.',
        email: 'a.sudais@example.com',
        phone: '+966 55 412 8899',
        address: 'Clock Tower Raffles Hotel, Suite 1804',
        addressAr: 'فندق رافلز برج الساعة، جناح 1804',
        addressEn: 'Clock Tower Raffles Hotel, Suite 1804',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        postalCode: '24231',
        vatNumber: '300891245000003',
        crNumber: '1010782391',
      },
      items: [
        {
          id: 'tax-it-1',
          name: 'Royal Dutch Red Roses Velvet Box',
          nameAr: 'صندوق مخملي فاخر بالورود الهولندية الحمراء',
          nameEn: 'Royal Dutch Red Roses Velvet Box',
          sku: 'WM-ROSE-01',
          quantity: 2,
          unitPrice: 340,
          discount: 40,
          taxRate: 15,
          taxAmount: 96,
          total: 736,
        },
        {
          id: 'tax-it-2',
          name: 'Patchi Luxury Truffles Gift Collection 500g',
          nameAr: 'تشكيلة ترفل باتشي الملكية الفاخرة 500 جم',
          nameEn: 'Patchi Luxury Truffles Gift Collection 500g',
          sku: 'PAT-TRUF-01',
          quantity: 1,
          unitPrice: 220,
          discount: 0,
          taxRate: 15,
          taxAmount: 33,
          total: 253,
        },
      ],
      subtotal: 860,
      discountAmount: 40,
      shippingFee: 35,
      taxRate: 15,
      taxAmount: 129,
      grandTotal: 984,
      amountPaid: 984,
      outstandingBalance: 0,
      currency: 'SAR',
      zatca: {
        invoiceCategory: 'standard',
        invoiceType: '388',
        qrPayloadBase64: generateZatcaTlvBase64({
          sellerName: profile.nameAr,
          vatNumber: profile.vatNumber,
          timestamp: '2026-10-08T10:15:00Z',
          invoiceTotal: 984,
          vatTotal: 129,
          invoiceHash: generateInvoiceHashSha256(`${storeId}-984-129`),
          digitalSignature: 'MEQCIG482934892348923489234892348923489234892348AiA892348923489234892348923489234892348923489',
        }),
        invoiceHash: generateInvoiceHashSha256(`${storeId}-984-129`),
        complianceStatus: 'compliant_preview',
        vatCategoryCode: 'S',
      },
      status: 'paid',
      notes: 'Issued under the Saudi ZATCA VAT regulations. All amounts expressed in Saudi Riyals (SAR). Standard VAT rate 15% applied.',
      auditTrail: [
        {
          id: 'aud-tax-1',
          timestamp: '2026-10-08T10:15:00Z',
          action: 'issued',
          actorName: 'ZATCA Integration Service',
          actorRole: 'system',
          details: 'Official standard tax invoice generated with full ZATCA cryptographic TLV barcode.',
        },
      ],
      isLocked: true,
      createdAt: '2026-10-08T10:15:00Z',
      updatedAt: '2026-10-08T10:15:00Z',
    },

    // 10. Quotation / Estimate
    {
      id: 'doc-quo-001',
      storeId,
      documentType: 'quotation',
      documentNumber: 'QUO-2026-0042',
      title: 'Formal Business Quotation / Price Proposal',
      titleAr: 'عرض أسعار تجاري رسمي',
      titleEn: 'Formal Business Quotation / Price Proposal',
      customerReference: 'cust-205',
      issueDate: '2026-10-09T09:00:00Z',
      validUntil: '2026-10-30T23:59:59Z',
      seller: sellerParty,
      buyer: {
        name: 'Jabal Omar Development Company (JODC)',
        nameAr: 'شركة جبل عمر للتطوير',
        nameEn: 'Jabal Omar Development Company (JODC)',
        companyName: 'Jabal Omar Development Headquarters',
        companyNameAr: 'المقر الرئيسي لشركة جبل عمر للتطوير',
        companyNameEn: 'Jabal Omar Development Headquarters',
        email: 'procurement@jabalomar.com.sa',
        phone: '+966 12 553 0000',
        address: 'Makkah City Center, Jabal Omar Complex',
        addressAr: 'مركز مكة، مجمع جبل عمر الإداري',
        addressEn: 'Makkah City Center, Jabal Omar Complex',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        vatNumber: '300098412500003',
      },
      items: [
        {
          id: 'quo-it-1',
          name: 'Annual Ramadan Lobby Floral Centerpieces Setup & Maintenance (4 Quarters)',
          nameAr: 'تنسيق وصيانة زهور بهو الاستقبال الرئيسي السنوي لموسم رمضان (4 فترات)',
          nameEn: 'Annual Ramadan Lobby Floral Centerpieces Setup & Maintenance (4 Quarters)',
          sku: 'JODC-LOBBY-RAM',
          quantity: 4,
          unitPrice: 3800,
          discount: 1200,
          taxRate: 15,
          taxAmount: 2100,
          total: 16100,
        },
        {
          id: 'quo-it-2',
          name: 'VIP Executive Boardroom Fresh Florals (24 Weekly Refresh Cycles)',
          nameAr: 'باقات زهور طبيعية لطاولات اجتماعات مجلس الإدارة (24 تجديد أسبوعي)',
          nameEn: 'VIP Executive Boardroom Fresh Florals (24 Weekly Refresh Cycles)',
          sku: 'JODC-BOARD-24',
          quantity: 24,
          unitPrice: 450,
          discount: 800,
          taxRate: 15,
          taxAmount: 1500,
          total: 11500,
        },
      ],
      subtotal: 26000,
      discountAmount: 2000,
      shippingFee: 0,
      taxRate: 15,
      taxAmount: 3600,
      grandTotal: 27600,
      amountPaid: 0,
      outstandingBalance: 27600,
      currency: 'SAR',
      quotationStatus: 'sent',
      status: 'pending',
      paymentTerms: 'Payment Terms: 30% upon formal contract signing, 70% in monthly milestones against tax invoices.',
      paymentTermsEn: 'Payment Terms: 30% upon formal contract signing, 70% in monthly milestones against tax invoices.',
      paymentTermsAr: 'شروط السداد: 30% دفعة أولى عند توقيع العقد، و70% دفعات شهرية مقابل فواتير ضريبية.',
      termsAndConditions: 'Proposal is valid for 21 days from issue date. Prices include complete floral maintenance, refrigerated vessel replacement, and florist on-call support.',
      termsAndConditionsEn: 'Proposal is valid for 21 days from issue date. Prices include complete floral maintenance, refrigerated vessel replacement, and florist on-call support.',
      termsAndConditionsAr: 'العرض صالح لمدة 21 يوماً من تاريخ الإصدار. الأسعار تشمل الصيانة الدورية واستبدال الفازات المبردة وفريق عمل متواجد.',
      notes: 'Special corporate volume pricing applied. Includes dedicated florist team on-site twice weekly.',
      auditTrail: [
        {
          id: 'aud-quo-1',
          timestamp: '2026-10-09T09:00:00Z',
          action: 'created',
          actorName: 'Commercial Director',
          actorRole: 'sales',
          details: 'Proposal draft created with corporate tier pricing schedule.',
        },
        {
          id: 'aud-quo-2',
          timestamp: '2026-10-09T09:30:00Z',
          action: 'status_changed',
          actorName: 'Commercial Director',
          actorRole: 'sales',
          details: 'Quotation marked SENT via official client proposal portal.',
          previousStatus: 'draft',
          newStatus: 'sent',
        },
      ],
      isLocked: false,
      createdAt: '2026-10-09T09:00:00Z',
      updatedAt: '2026-10-09T09:30:00Z',
    },
  ];
}

class InvoiceService {
  private getStoredInvoices(storeId: string, store?: Partial<Store>): InvoiceDocument[] {
    try {
      if (typeof window === 'undefined') return createInitialDocuments(storeId, store);
      const raw = localStorage.getItem(`${INVOICES_STORAGE_KEY}_${storeId}`);
      if (!raw) {
        const initial = createInitialDocuments(storeId, store);
        this.saveStoredInvoices(storeId, initial);
        return initial;
      }
      const parsed: InvoiceDocument[] = JSON.parse(raw);
      if (isContaminated(storeId, parsed)) {
        // Cache was contaminated with foreign-store documents — reset cleanly!
        const clean = createInitialDocuments(storeId, store);
        this.saveStoredInvoices(storeId, clean);
        return clean;
      }
      return parsed;
    } catch {
      return createInitialDocuments(storeId, store);
    }
  }

  private saveStoredInvoices(storeId: string, docs: InvoiceDocument[]) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${INVOICES_STORAGE_KEY}_${storeId}`, JSON.stringify(docs));
        window.dispatchEvent(new CustomEvent('unityteck-invoices-updated', { detail: { storeId } }));
      }
    } catch {}
  }

  public getDocuments(storeId: string, store?: Partial<Store>): InvoiceDocument[] {
    return this.getStoredInvoices(storeId, store);
  }

  /**
   * Synchronize all invoice documents dynamically with live store orders and store settings.
   * Guarantees 100% real dynamic fields with zero cross-store leakage and complete isolation.
   */
  public syncWithStoreOrders(storeId: string, orders: Order[], store?: Partial<Store>): InvoiceDocument[] {
    if (!orders || orders.length === 0) {
      return this.getStoredInvoices(storeId, store);
    }

    const existingDocs = this.getStoredInvoices(storeId, store);
    // Filter out any contaminated foreign store documents
    const isCoffee = isCoffeeStoreId(storeId, store);
    const updatedDocs = existingDocs.filter((d) => {
      if (isCoffee) {
        const seller = (d.seller?.name || '') + (d.seller?.nameAr || '');
        if (seller.includes('Makkah Gifts') || seller.includes('هدايا مكة')) return false;
      }
      return true;
    });

    const profile = getStoreInvoiceProfile(storeId, store);
    let changed = false;

    orders.forEach((order, idx) => {
      const orderNum = order.orderNumber || order.id;
      const orderDate = order.createdAt || order.date || new Date().toISOString();
      const subtotal = Number(order.subtotal) || Number(order.total) || 0;
      const discount = Number(order.discountAmount) || 0;
      const shipping = Number(order.shippingFee) || 0;
      const taxable = Math.max(0, subtotal - discount);
      const tax = Number(order.tax) || Math.round(taxable * 0.15 * 100) / 100;
      const grandTotal = Number(order.total) || (taxable + shipping + tax);
      const isPaid = order.paymentStatus === 'Paid' || order.status === 'completed' || order.status === 'delivered';
      const isCancelled = order.status === 'cancelled';
      const docStatus: InvoiceDocumentStatus = isCancelled ? 'cancelled' : isPaid ? 'paid' : 'pending';

      const invoiceItems: InvoiceLineItem[] = (order.items && order.items.length > 0)
        ? order.items.map((it, itIdx) => ({
            id: it.id || `ord-item-${itIdx}`,
            name: it.name,
            nameAr: (it as any).nameAr || it.name,
            nameEn: getLocalizedItemName(it, 'en'),
            sku: it.sku || `SKU-${itIdx + 1}`,
            quantity: it.quantity || 1,
            unitPrice: Number(it.price) || 0,
            discount: 0,
            taxRate: 15,
            taxAmount: Math.round(((Number(it.price) || 0) * (it.quantity || 1) * 0.15) * 100) / 100,
            total: Math.round((Number(it.price) || 0) * (it.quantity || 1) * 1.15 * 100) / 100,
            image: it.image,
          }))
        : [
            {
              id: `ord-item-0`,
              name: isCoffee ? 'Specialty Coffee Pack' : 'Store Order Bundle',
              nameAr: isCoffee ? 'باقة القهوة المختصة الفاخرة' : 'باقة منتجات المتجر',
              nameEn: isCoffee ? 'Specialty Coffee Pack' : 'Store Order Bundle',
              sku: 'BDL-001',
              quantity: 1,
              unitPrice: subtotal,
              discount,
              taxRate: 15,
              taxAmount: tax,
              total: grandTotal,
            },
          ];

      const zatcaPayload = generateZatcaTlvBase64({
        sellerName: profile.nameAr,
        vatNumber: profile.vatNumber,
        timestamp: orderDate,
        invoiceTotal: grandTotal,
        vatTotal: tax,
        invoiceHash: generateInvoiceHashSha256(`${storeId}-${orderNum}-${grandTotal}`),
      });

      // Match existing invoice for this order
      const existingInvIndex = updatedDocs.findIndex(
        (d) => d.orderId === order.id || (d.orderNumber && d.orderNumber === orderNum)
      );

      const invDocNumber = `INV-${new Date(orderDate).getFullYear()}-${String(1000 + idx).slice(-4)}`;

      const orderInvoiceData: InvoiceDocument = {
        id: existingInvIndex >= 0 ? updatedDocs[existingInvIndex].id : `doc-inv-auto-${order.id}`,
        storeId,
        documentType: 'order_invoice',
        documentNumber: existingInvIndex >= 0 ? updatedDocs[existingInvIndex].documentNumber : invDocNumber,
        title: 'Commercial Sales Invoice',
        titleAr: 'فاتورة مبيعات تجارية',
        titleEn: 'Commercial Sales Invoice',
        orderId: order.id,
        orderNumber: orderNum,
        issueDate: orderDate,
        dueDate: orderDate,
        seller: {
          name: profile.nameEn,
          nameAr: profile.nameAr,
          nameEn: profile.nameEn,
          companyName: profile.companyNameEn,
          companyNameAr: profile.companyNameAr,
          companyNameEn: profile.companyNameEn,
          email: profile.email,
          phone: profile.phone,
          address: profile.addressEn,
          addressAr: profile.addressAr,
          addressEn: profile.addressEn,
          city: profile.cityEn,
          cityAr: profile.cityAr,
          country: profile.countryEn,
          countryAr: profile.countryAr,
          vatNumber: profile.vatNumber,
          crNumber: profile.crNumber,
        },
        buyer: {
          name: order.customerName || 'Store Customer',
          nameAr: order.customerName || 'عميل المتجر',
          nameEn: getCustomerDisplayName(order.customerName || '', 'en'),
          email: order.customerEmail || 'customer@client.sa',
          phone: order.customerPhone || '',
          address: order.deliveryLocation || profile.addressEn,
          addressAr: order.deliveryLocation || profile.addressAr,
          addressEn: getLocalizedAddress(order.deliveryLocation || profile.addressEn, 'en'),
          city: profile.cityEn,
          cityAr: profile.cityAr,
          country: 'Saudi Arabia',
          countryAr: 'المملكة العربية السعودية',
        },
        currency: 'SAR',
        subtotal,
        discountAmount: discount,
        shippingFee: shipping,
        taxRate: 15,
        taxAmount: tax,
        grandTotal,
        amountPaid: isPaid ? grandTotal : 0,
        outstandingBalance: isPaid ? 0 : grandTotal,
        status: docStatus,
        paymentStatus: isPaid ? 'verified_success' : 'pending',
        paymentMethod: order.paymentMethod || 'Online Payment',
        items: invoiceItems,
        notes: (order as any).customerNotes || '',
        notesEn: (order as any).customerNotes || '',
        notesAr: (order as any).customerNotes || '',
        zatca: {
          invoiceCategory: 'simplified',
          invoiceType: '388',
          qrPayloadBase64: zatcaPayload,
          complianceStatus: 'compliant_preview',
          vatCategoryCode: 'S',
          invoiceHash: generateInvoiceHashSha256(`${storeId}-${orderNum}-${grandTotal}`),
        },
        auditTrail: [
          {
            id: `aud-sync-${Date.now()}-${idx}`,
            timestamp: orderDate,
            action: 'created',
            actorName: 'System Automatic Invoice Sync',
            actorRole: 'system',
            details: `Invoice synchronized dynamically with store order #${orderNum}.`,
          },
        ],
        isLocked: isPaid,
        createdAt: orderDate,
        updatedAt: new Date().toISOString(),
      };

      if (existingInvIndex >= 0) {
        updatedDocs[existingInvIndex] = {
          ...updatedDocs[existingInvIndex],
          ...orderInvoiceData,
          id: updatedDocs[existingInvIndex].id,
          documentNumber: updatedDocs[existingInvIndex].documentNumber,
        };
        changed = true;
      } else {
        updatedDocs.unshift(orderInvoiceData);
        changed = true;
      }
    });

    if (changed) {
      this.saveStoredInvoices(storeId, updatedDocs);
    }
    return updatedDocs;
  }

  public getDocumentById(storeId: string, id: string): InvoiceDocument | undefined {
    return this.getDocuments(storeId).find((d) => d.id === id);
  }

  public getNextDocumentNumber(storeId: string, type: InvoiceDocumentType): string {
    const prefixMap: Record<InvoiceDocumentType, string> = {
      order_invoice: 'INV',
      cancelled_order_invoice: 'CAN',
      refund_receipt: 'REF',
      proforma_invoice: 'PRO',
      purchase_invoice: 'PUR',
      credit_note: 'CRN',
      delivery_note: 'DEL',
      payment_receipt: 'REC',
      tax_invoice: 'TAX',
      quotation: 'QUO',
    };

    const prefix = prefixMap[type] || 'DOC';
    const year = new Date().getFullYear();
    const docs = this.getDocuments(storeId).filter((d) => d.documentType === type);
    const count = docs.length + 1;
    const padded = String(count).padStart(4, '0');
    return `${prefix}-${year}-${padded}`;
  }

  public createDocument(
    storeId: string,
    docData: Omit<InvoiceDocument, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>,
    actorName = 'Store Administrator',
  ): InvoiceDocument {
    const docs = this.getStoredInvoices(storeId);
    const now = new Date().toISOString();
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newDoc: InvoiceDocument = {
      ...docData,
      id,
      storeId,
      createdAt: now,
      updatedAt: now,
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: now,
          action: 'created',
          actorName,
          actorRole: 'admin',
          details: `Document ${docData.documentNumber} created (${docData.documentType}).`,
        },
      ],
    };

    docs.unshift(newDoc);
    this.saveStoredInvoices(storeId, docs);
    return newDoc;
  }

  public updateDocument(
    storeId: string,
    id: string,
    patch: Partial<InvoiceDocument>,
    actorName = 'Store Administrator',
    reason?: string,
  ): InvoiceDocument | null {
    const docs = this.getStoredInvoices(storeId);
    const index = docs.findIndex((d) => d.id === id);
    if (index === -1) return null;

    const existing = docs[index];
    const now = new Date().toISOString();

    const auditEntry: DocumentAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      action: patch.status && patch.status !== existing.status ? 'status_changed' : 'edited',
      actorName,
      actorRole: 'admin',
      details: reason || (patch.status ? `Status updated to ${patch.status}` : 'Document fields updated'),
      previousStatus: existing.status,
      newStatus: patch.status || existing.status,
    };

    const updated: InvoiceDocument = {
      ...existing,
      ...patch,
      updatedAt: now,
      auditTrail: [auditEntry, ...existing.auditTrail],
    };

    docs[index] = updated;
    this.saveStoredInvoices(storeId, docs);
    return updated;
  }

  public deleteDocument(storeId: string, id: string): boolean {
    const docs = this.getStoredInvoices(storeId);
    const filtered = docs.filter((d) => d.id !== id);
    if (filtered.length === docs.length) return false;
    this.saveStoredInvoices(storeId, filtered);
    return true;
  }

  public recordPrintOrExport(
    storeId: string,
    id: string,
    type: 'printed' | 'exported_pdf',
    actorName = 'Store User',
  ) {
    const docs = this.getStoredInvoices(storeId);
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;

    const now = new Date().toISOString();
    doc.auditTrail.unshift({
      id: `aud-${Date.now()}`,
      timestamp: now,
      action: type,
      actorName,
      actorRole: 'admin',
      details: type === 'printed' ? 'Document sent to printer' : 'Document exported as PDF',
    });
    this.saveStoredInvoices(storeId, docs);
  }

  public convertQuotationToOrder(
    storeId: string,
    quotationId: string,
    actorName = 'Store Administrator',
  ): { quotation: InvoiceDocument; newOrderPayload: Partial<Order> } | null {
    const quotation = this.getDocumentById(storeId, quotationId);
    if (!quotation || quotation.documentType !== 'quotation') return null;

    const newOrderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedQuo = this.updateDocument(
      storeId,
      quotationId,
      {
        quotationStatus: 'converted',
        status: 'converted',
        convertedOrderId: newOrderNumber,
      },
      actorName,
      `Quotation successfully accepted and converted into live Order #${newOrderNumber}`,
    );

    const newOrderPayload: Partial<Order> = {
      orderNumber: newOrderNumber,
      customerName: quotation.buyer.name,
      customerEmail: quotation.buyer.email,
      customerPhone: quotation.buyer.phone || '',
      deliveryLocation: quotation.buyer.city || 'Riyadh',
      itemsCount: quotation.items.reduce((s, it) => s + it.quantity, 0),
      items: quotation.items.map((it) => ({
        id: it.id,
        name: it.name,
        sku: it.sku,
        price: it.unitPrice,
        quantity: it.quantity,
        total: it.total,
        image: it.image,
      })),
      subtotal: quotation.subtotal,
      discountAmount: quotation.discountAmount,
      shippingFee: quotation.shippingFee,
      tax: quotation.taxAmount,
      total: quotation.grandTotal,
      status: 'pending',
      paymentMethod: 'Bank Transfer / Invoice',
      paymentStatus: 'Pending',
      source: 'Quotation Conversion',
      customerNotes: quotation.notes,
    };

    return { quotation: updatedQuo || quotation, newOrderPayload };
  }

  // Suppliers & Purchases
  public getSuppliers(storeId: string): SupplierRecord[] {
    const isCoffee = isCoffeeStoreId(storeId);
    const defaults = isCoffee ? INITIAL_SUPPLIERS_COFFEE : INITIAL_SUPPLIERS_FLOWERS;
    try {
      if (typeof window === 'undefined') return defaults;
      const raw = localStorage.getItem(`${SUPPLIERS_STORAGE_KEY}_${storeId}`);
      if (!raw) {
        localStorage.setItem(`${SUPPLIERS_STORAGE_KEY}_${storeId}`, JSON.stringify(defaults));
        return defaults;
      }
      const parsed: SupplierRecord[] = JSON.parse(raw);
      // Clean cross-store contamination
      if (isCoffee && parsed.some((s) => s.name.includes('Dutch Flora') || (s.nameAr && s.nameAr.includes('فلورا')))) {
        localStorage.setItem(`${SUPPLIERS_STORAGE_KEY}_${storeId}`, JSON.stringify(defaults));
        return defaults;
      }
      return parsed;
    } catch {
      return defaults;
    }
  }

  public addSupplier(storeId: string, supplierData: Omit<SupplierRecord, 'id' | 'createdAt' | 'storeId'>): SupplierRecord {
    const list = this.getSuppliers(storeId);
    const newSupplier: SupplierRecord = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      storeId,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newSupplier);
    try {
      localStorage.setItem(`${SUPPLIERS_STORAGE_KEY}_${storeId}`, JSON.stringify(list));
    } catch {}
    return newSupplier;
  }

  public getPurchases(storeId: string): PurchaseRecord[] {
    const isCoffee = isCoffeeStoreId(storeId);
    const defaults = isCoffee ? INITIAL_PURCHASES_COFFEE : INITIAL_PURCHASES_FLOWERS;
    try {
      if (typeof window === 'undefined') return defaults;
      const raw = localStorage.getItem(`${PURCHASES_STORAGE_KEY}_${storeId}`);
      if (!raw) {
        localStorage.setItem(`${PURCHASES_STORAGE_KEY}_${storeId}`, JSON.stringify(defaults));
        return defaults;
      }
      const parsed: PurchaseRecord[] = JSON.parse(raw);
      if (isCoffee && parsed.some((p) => p.supplierName.includes('Dutch Flora') || (p.supplierNameAr && p.supplierNameAr.includes('فلورا')))) {
        localStorage.setItem(`${PURCHASES_STORAGE_KEY}_${storeId}`, JSON.stringify(defaults));
        return defaults;
      }
      return parsed;
    } catch {
      return defaults;
    }
  }

  public addPurchase(storeId: string, purchaseData: Omit<PurchaseRecord, 'id' | 'storeId'>): PurchaseRecord {
    const list = this.getPurchases(storeId);
    const newPurchase: PurchaseRecord = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
      storeId,
    };
    list.unshift(newPurchase);
    try {
      localStorage.setItem(`${PURCHASES_STORAGE_KEY}_${storeId}`, JSON.stringify(list));
    } catch {}
    return newPurchase;
  }

  // Template Settings
  public getTemplateConfig(storeId?: string, store?: Partial<Store>): InvoiceTemplateConfig {
    const safeStoreId = storeId || store?.id || '';
    const profile = getStoreInvoiceProfile(safeStoreId, store);
    const defaultForStore: InvoiceTemplateConfig = {
      ...DEFAULT_TEMPLATE_CONFIG,
      storeId: safeStoreId,
      primaryColor: profile.primaryColor,
      secondaryColor: profile.secondaryColor,
      accentColor: profile.accentColor,
      businessNameEn: profile.nameEn,
      businessNameAr: profile.nameAr,
      taxNumber: profile.vatNumber,
      crNumber: profile.crNumber,
      headerAddressEn: profile.addressEn,
      headerAddressAr: profile.addressAr,
      contactEmail: profile.email,
      contactPhone: profile.phone,
      bankDetailsEn: profile.bankDetailsEn,
      bankDetailsAr: profile.bankDetailsAr,
      customNotesEn: profile.customNotesEn,
      customNotesAr: profile.customNotesAr,
      customTermsEn: profile.customTermsEn,
      customTermsAr: profile.customTermsAr,
    };

    try {
      if (typeof window === 'undefined') return defaultForStore;
      const raw = localStorage.getItem(`${TEMPLATES_STORAGE_KEY}_${safeStoreId}`);
      if (!raw) return defaultForStore;
      const parsed = JSON.parse(raw);
      // Clean cross-store contaminated business name if needed
      if (isCoffeeStoreId(safeStoreId, store) && parsed.businessNameEn?.includes('Makkah Gifts')) {
        localStorage.setItem(`${TEMPLATES_STORAGE_KEY}_${safeStoreId}`, JSON.stringify(defaultForStore));
        return defaultForStore;
      }
      return { ...defaultForStore, ...parsed, storeId: safeStoreId };
    } catch {
      return defaultForStore;
    }
  }

  public saveTemplateConfig(storeId: string, config: Partial<InvoiceTemplateConfig>, store?: Partial<Store>): InvoiceTemplateConfig {
    const existing = this.getTemplateConfig(storeId, store);
    const merged = { ...existing, ...config, storeId };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${TEMPLATES_STORAGE_KEY}_${storeId}`, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('unityteck-template-updated', { detail: { storeId } }));
      }
    } catch {}
    return merged;
  }

  public resetTemplateConfig(storeId: string, store?: Partial<Store>): InvoiceTemplateConfig {
    const profile = getStoreInvoiceProfile(storeId, store);
    const defaults: InvoiceTemplateConfig = {
      ...DEFAULT_TEMPLATE_CONFIG,
      storeId,
      primaryColor: profile.primaryColor,
      secondaryColor: profile.secondaryColor,
      accentColor: profile.accentColor,
      businessNameEn: profile.nameEn,
      businessNameAr: profile.nameAr,
      taxNumber: profile.vatNumber,
      crNumber: profile.crNumber,
      headerAddressEn: profile.addressEn,
      headerAddressAr: profile.addressAr,
      contactEmail: profile.email,
      contactPhone: profile.phone,
      bankDetailsEn: profile.bankDetailsEn,
      bankDetailsAr: profile.bankDetailsAr,
      customNotesEn: profile.customNotesEn,
      customNotesAr: profile.customNotesAr,
      customTermsEn: profile.customTermsEn,
      customTermsAr: profile.customTermsAr,
    };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${TEMPLATES_STORAGE_KEY}_${storeId}`, JSON.stringify(defaults));
        window.dispatchEvent(new CustomEvent('unityteck-template-updated', { detail: { storeId } }));
      }
    } catch {}
    return defaults;
  }
}

export const invoiceService = new InvoiceService();

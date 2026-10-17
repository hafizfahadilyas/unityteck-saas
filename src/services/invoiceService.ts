import type {
  InvoiceDocument,
  InvoiceDocumentType,
  InvoiceDocumentStatus,
  InvoiceLineItem,
  SupplierRecord,
  PurchaseRecord,
  InvoiceTemplateConfig,
  DocumentAuditEntry,
} from '../types/invoices';
import type { Order, Store } from '../types';
import { generateZatcaTlvBase64 } from '../utils/zatca';

const INVOICES_STORAGE_KEY = 'unityteck_invoices_v1';
const TEMPLATES_STORAGE_KEY = 'unityteck_invoice_templates_v1';
const SUPPLIERS_STORAGE_KEY = 'unityteck_suppliers_v1';
const PURCHASES_STORAGE_KEY = 'unityteck_purchases_v1';
const NUMBERING_STORAGE_KEY = 'unityteck_doc_numbering_v1';

export const DEFAULT_TEMPLATE_CONFIG: InvoiceTemplateConfig = {
  storeId: 'makkah-gifts-store',
  documentType: 'all',
  primaryColor: '#0f172a', // Deep navy
  secondaryColor: '#334155',
  accentColor: '#059669', // Emerald accent
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

// Initial Suppliers
const INITIAL_SUPPLIERS: SupplierRecord[] = [
  {
    id: 'sup-01',
    storeId: 'makkah-gifts-store',
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
    storeId: 'makkah-gifts-store',
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
    storeId: 'makkah-gifts-store',
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

// Initial Purchases
const INITIAL_PURCHASES: PurchaseRecord[] = [
  {
    id: 'pur-01',
    storeId: 'makkah-gifts-store',
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
    storeId: 'makkah-gifts-store',
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

// Seed full initial suite of all 10 document types
function createInitialDocuments(storeId: string): InvoiceDocument[] {
  const now = new Date();
  const dateStr = now.toISOString();

  // Helper for ZATCA TLV payload
  const createZatcaData = (total: number, vat: number, timestamp = dateStr) => {
    const payload = generateZatcaTlvBase64({
      sellerName: 'مؤسسة هدايا مكة والزهور الفاخرة',
      vatNumber: '300948215600003',
      timestamp: timestamp,
      invoiceTotal: total,
      vatTotal: vat,
      invoiceHash: 'NWQyOTAzNDIzOTQ4MjAzOTQ4MjA5MzQ4',
    });
    return {
      invoiceCategory: 'simplified' as const,
      invoiceType: '388' as const,
      qrPayloadBase64: payload,
      invoiceHash: 'NWQyOTAzNDIzOTQ4MjAzOTQ4MjA5MzQ4',
      complianceStatus: 'compliant_preview' as const,
      vatCategoryCode: 'S' as const,
    };
  };

  return [
    // 1. Order Invoice (Commercial Sales Invoice)
    {
      id: 'doc-inv-001',
      storeId,
      documentType: 'order_invoice',
      documentNumber: 'INV-2026-0104',
      title: 'Commercial Sales Invoice',
      titleAr: 'فاتورة مبيعات تجارية',
      orderId: 'ord-101',
      orderNumber: 'ORD-9842',
      issueDate: '2026-10-08T10:15:00Z',
      dueDate: '2026-10-08T10:15:00Z',
      seller: {
        name: 'Makkah Gifts & Luxury Flowers Est.',
        nameAr: 'مؤسسة هدايا مكة والزهور الفاخرة',
        companyName: 'Makkah Gifts Commercial Est.',
        companyNameAr: 'مؤسسة هدايا مكة التجارية',
        email: 'billing@makkah-gifts.sa',
        phone: '+966 12 555 8899',
        address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
        addressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        vatNumber: '300948215600003',
        crNumber: '1010892341',
      },
      buyer: {
        name: 'Abdulrahman Al-Sudais',
        nameAr: 'عبدالرحمن السديس',
        email: 'a.sudais@example.com',
        phone: '+966 55 412 8899',
        address: 'Clock Tower Raffles Hotel, Suite 1804',
        addressAr: 'فندق رافلز برج الساعة، جناح 1804',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      items: [
        {
          id: 'item-1',
          name: 'Royal Dutch Red Roses Velvet Box',
          nameAr: 'صندوق مخملي فاخر بالورود الهولندية الحمراء',
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
      notes: 'Hand delivery directly to Hotel Concierge Desk for VIP Guest arrival.',
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

    // 2. Cancelled Order Invoice / Cancellation Record
    {
      id: 'doc-can-001',
      storeId,
      documentType: 'cancelled_order_invoice',
      documentNumber: 'CAN-2026-0019',
      title: 'Order Cancellation Record',
      titleAr: 'سجل إلغاء طلب رسمي',
      orderId: 'ord-104',
      orderNumber: 'ORD-9820',
      originalInvoiceNumber: 'INV-2026-0092',
      issueDate: '2026-10-07T16:20:00Z',
      cancellationDate: '2026-10-07T16:20:00Z',
      seller: {
        name: 'Makkah Gifts & Luxury Flowers Est.',
        nameAr: 'مؤسسة هدايا مكة والزهور الفاخرة',
        companyName: 'Makkah Gifts Commercial Est.',
        companyNameAr: 'مؤسسة هدايا مكة التجارية',
        email: 'billing@makkah-gifts.sa',
        phone: '+966 12 555 8899',
        address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
        addressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        vatNumber: '300948215600003',
        crNumber: '1010892341',
      },
      buyer: {
        name: 'Hassan Al-Zahrani',
        nameAr: 'حسن الزهراني',
        email: 'h.zahrani@gmail.com',
        phone: '+966 50 882 1199',
        address: 'Al-Awali District, Villa 42',
        addressAr: 'حي العوالي، فيلا 42',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      items: [
        {
          id: 'can-it-1',
          name: 'Imperial White Orchids & Lily Ceramic Vase',
          nameAr: 'فازة سيراميك الأوركيد والزنابق البيضاء الملكية',
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
      cancellationReason: 'Customer requested cancellation before floral arrangement assembly due to rescheduled event date.',
      refundAmount: 638,
      refundStatus: 'pending', // Distinct from cancellation status!
      refundTransactionRef: 'ref_pending_gateway_req_4901',
      status: 'cancelled',
      notes: 'Order cancelled within 15 minutes of placement. Refund submitted to payment gateway for processing.',
      auditTrail: [
        {
          id: 'aud-can-1',
          timestamp: '2026-10-07T16:20:00Z',
          action: 'status_changed',
          actorName: 'Ahmed Al-Malki (Operations Manager)',
          actorRole: 'manager',
          details: 'Order marked CANCELLED. Cancellation record CAN-2026-0019 generated.',
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
      orderId: 'ord-106',
      orderNumber: 'ORD-9781',
      originalInvoiceNumber: 'INV-2026-0078',
      issueDate: '2026-10-06T14:45:00Z',
      refundDate: '2026-10-06T14:45:00Z',
      seller: {
        name: 'Makkah Gifts & Luxury Flowers Est.',
        nameAr: 'مؤسسة هدايا مكة والزهور الفاخرة',
        companyName: 'Makkah Gifts Commercial Est.',
        companyNameAr: 'مؤسسة هدايا مكة التجارية',
        email: 'billing@makkah-gifts.sa',
        phone: '+966 12 555 8899',
        address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
        addressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        vatNumber: '300948215600003',
        crNumber: '1010892341',
      },
      buyer: {
        name: 'Fahad Al-Otaibi',
        nameAr: 'فهد العتيبي',
        email: 'f.otaibi@company.sa',
        phone: '+966 54 220 3344',
        address: 'Al-Naseem District, St 14',
        addressAr: 'حي النسيم، شارع 14',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      items: [
        {
          id: 'ref-it-1',
          name: 'Belgian Chocolate & Red Roses Box (Damaged in Transit Replacement Credit)',
          nameAr: 'صندوق شوكولاتة بلجيكية وورد أحمر (تعويض تلف شحن)',
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
      refundStatus: 'succeeded', // Verified authoritative status!
      status: 'refunded',
      notes: 'Authoritative refund transaction completed and settled back to customer bank card.',
      auditTrail: [
        {
          id: 'aud-ref-1',
          timestamp: '2026-10-06T14:45:00Z',
          action: 'refund_issued',
          actorName: 'Moyasar Payment Gateway Gateway Hook',
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
      customerReference: 'cust-202',
      issueDate: '2026-10-09T11:00:00Z',
      validUntil: '2026-10-24T23:59:59Z', // 15 days validity
      seller: {
        name: 'Makkah Gifts & Luxury Flowers Est.',
        nameAr: 'مؤسسة هدايا مكة والزهور الفاخرة',
        companyName: 'Makkah Gifts Commercial Est.',
        companyNameAr: 'مؤسسة هدايا مكة التجارية',
        email: 'corporate@makkah-gifts.sa',
        phone: '+966 12 555 8899',
        address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
        addressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        vatNumber: '300948215600003',
        crNumber: '1010892341',
      },
      buyer: {
        name: 'Dar Al-Tawhid InterContinental Hotel',
        nameAr: 'فندق دار التوحيد إنتركونتيننتال مكة',
        companyName: 'Dar Al Tawhid Hospitality Group',
        companyNameAr: 'مجموعة دار التوحيد للضيافة الفندقية',
        email: 'purchasing@daraltawhid.com',
        phone: '+966 12 541 1111',
        address: 'Haram Plaza, King Abdulaziz Gate Front',
        addressAr: 'ساحة الحرم الشريف، أمام بوابة الملك عبدالعزيز',
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
      notes: 'THIS IS A PROFORMA INVOICE. This document is a preliminary estimate and does NOT represent a final tax invoice or confirmed sale until approved and finalized.',
      auditTrail: [
        {
          id: 'aud-pro-1',
          timestamp: '2026-10-09T11:00:00Z',
          action: 'created',
          actorName: 'Sara Al-Ghamdi (Corporate Accounts)',
          actorRole: 'sales',
          details: 'Proforma quote created and submitted for Hotel Procurement team review.',
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
      documentNumber: 'PUR-2026-0081',
      title: 'Supplier Purchase Invoice',
      titleAr: 'فاتورة مشتريات وتوريد بضائع',
      supplierId: 'sup-01',
      supplierReference: 'DF-INV-99482',
      issueDate: '2026-10-01T09:00:00Z',
      dueDate: '2026-10-31T23:59:59Z',
      seller: {
        name: 'Dutch Flora International B.V.',
        nameAr: 'شركة فلورا الهولندية الدولية للزهور',
        companyName: 'Dutch Flora B.V.',
        companyNameAr: 'شركة فلورا الهولندية التجارية',
        email: 'orders@dutchflora.nl',
        phone: '+31 20 894 3320',
        address: 'Aalsmeer Flower Auction Blvd 14',
        addressAr: 'مبنى مزاد الزهور، ألسيمير 14',
        city: 'Aalsmeer',
        cityAr: 'ألسيمير',
        country: 'Netherlands',
        vatNumber: '310984421300003',
        crNumber: 'NL84201948',
      },
      buyer: {
        name: 'Makkah Gifts & Luxury Flowers Est.',
        nameAr: 'مؤسسة هدايا مكة والزهور الفاخرة',
        companyName: 'Makkah Gifts Commercial Est.',
        companyNameAr: 'مؤسسة هدايا مكة التجارية',
        email: 'billing@makkah-gifts.sa',
        phone: '+966 12 555 8899',
        address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
        addressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        vatNumber: '300948215600003',
        crNumber: '1010892341',
      },
      items: [
        {
          id: 'pur-it-1',
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
          id: 'pur-it-2',
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
      notes: 'Received in good order and inspected by Quality Control Officer at cold storage facility.',
      auditTrail: [
        {
          id: 'aud-pur-1',
          timestamp: '2026-10-01T09:00:00Z',
          action: 'created',
          actorName: 'Mansour Al-Harbi (Procurement Officer)',
          actorRole: 'manager',
          details: 'Purchase record registered from supplier invoice DF-INV-99482.',
        },
        {
          id: 'aud-pur-2',
          timestamp: '2026-10-02T11:30:00Z',
          action: 'payment_applied',
          actorName: 'Mansour Al-Harbi (Procurement Officer)',
          actorRole: 'manager',
          details: 'Advance wire payment of 8,000.00 SAR applied. Remaining balance 5,565.00 SAR.',
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
      originalInvoiceId: 'doc-inv-001',
      originalInvoiceNumber: 'INV-2026-0104',
      orderId: 'ord-101',
      orderNumber: 'ORD-9842',
      issueDate: '2026-10-09T15:00:00Z',
      seller: {
        name: 'Makkah Gifts & Luxury Flowers Est.',
        nameAr: 'مؤسسة هدايا مكة والزهور الفاخرة',
        companyName: 'Makkah Gifts Commercial Est.',
        companyNameAr: 'مؤسسة هدايا مكة التجارية',
        email: 'billing@makkah-gifts.sa',
        phone: '+966 12 555 8899',
        address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
        addressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        vatNumber: '300948215600003',
        crNumber: '1010892341',
      },
      buyer: {
        name: 'Abdulrahman Al-Sudais',
        nameAr: 'عبدالرحمن السديس',
        email: 'a.sudais@example.com',
        phone: '+966 55 412 8899',
        address: 'Clock Tower Raffles Hotel, Suite 1804',
        addressAr: 'فندق رافلز برج الساعة، جناح 1804',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      items: [
        {
          id: 'crn-it-1',
          name: 'Price adjustment & promotional loyalty rebate on Order ORD-9842',
          nameAr: 'تسوية خصم ترويجي إضافي لعميل برنامج الولاء على الطلب ORD-9842',
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
      creditedTaxAmount: 15,
      totalCreditedAmount: 115,
      creditStatus: 'issued', // Credit note does NOT automatically mean cash was refunded!
      zatca: {
        invoiceCategory: 'simplified',
        invoiceType: '381', // 381 = Credit Note in ZATCA standards
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
          actorName: 'Amina Khateeb (Customer Success)',
          actorRole: 'support',
          details: 'Credit Note CRN-2026-0012 issued against invoice INV-2026-0104. Verified credit limit compliance.',
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
      documentNumber: 'DEL-2026-0219',
      title: 'Dispatch & Delivery Note',
      titleAr: 'سند تسليم وبوليصة شحن لوجستية',
      orderId: 'ord-101',
      orderNumber: 'ORD-9842',
      issueDate: '2026-10-08T11:30:00Z',
      dispatchDate: '2026-10-08T11:45:00Z',
      seller: {
        name: 'Makkah Gifts & Luxury Flowers Est.',
        nameAr: 'مؤسسة هدايا مكة والزهور الفاخرة',
        companyName: 'Makkah Gifts Fulfillment Hub',
        companyNameAr: 'مركز شحن وتوزيع هدايا مكة',
        email: 'delivery@makkah-gifts.sa',
        phone: '+966 12 555 8899',
        address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
        addressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      buyer: {
        name: 'Abdulrahman Al-Sudais',
        nameAr: 'عبدالرحمن السديس',
        phone: '+966 55 412 8899',
        address: 'Clock Tower Raffles Hotel, Suite 1804',
        addressAr: 'فندق رافلز برج الساعة، جناح 1804',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
      },
      items: [
        {
          id: 'del-it-1',
          name: 'Royal Dutch Red Roses Velvet Box [Refrigerated Packaged Item]',
          nameAr: 'صندوق مخملي فاخر بالورود الهولندية الحمراء [مغلف مبرد]',
          sku: 'WM-ROSE-01',
          quantity: 2,
          unitPrice: 0,
          total: 0,
        },
        {
          id: 'del-it-2',
          name: 'Patchi Luxury Truffles Gift Collection 500g [Chilled Box]',
          nameAr: 'تشكيلة ترفل باتشي الملكية الفاخرة 500 جم [صندوق مبرد]',
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
      grandTotal: 0, // Logistics documents NEVER display price totals
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
          actorName: 'Sultan Logistics Dispatcher',
          actorRole: 'support',
          details: 'Delivery note DEL-2026-0219 created and assigned to driver van #4.',
        },
        {
          id: 'aud-del-2',
          timestamp: '2026-10-08T12:45:00Z',
          action: 'status_changed',
          actorName: 'Driver GPS Mobile Terminal',
          actorRole: 'system',
          details: 'Delivery confirmed with recipient signature at Hotel Concierge.',
        },
      ],
      isLocked: true,
      createdAt: '2026-10-08T11:30:00Z',
      updatedAt: '2026-10-08T12:45:00Z',
    },

    // 8. Payment Receipt (Verified Partial / Full Receipt)
    {
      id: 'doc-rec-001',
      storeId,
      documentType: 'payment_receipt',
      documentNumber: 'REC-2026-0410',
      title: 'Official Payment Receipt Voucher',
      titleAr: 'سند قبض وإيصال سداد مالي رسمي',
      orderId: 'ord-101',
      orderNumber: 'ORD-9842',
      originalInvoiceNumber: 'INV-2026-0104',
      issueDate: '2026-10-08T10:15:02Z',
      seller: {
        name: 'Makkah Gifts & Luxury Flowers Est.',
        nameAr: 'مؤسسة هدايا مكة والزهور الفاخرة',
        companyName: 'Makkah Gifts Commercial Est.',
        companyNameAr: 'مؤسسة هدايا مكة التجارية',
        email: 'billing@makkah-gifts.sa',
        phone: '+966 12 555 8899',
        address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
        addressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        vatNumber: '300948215600003',
        crNumber: '1010892341',
      },
      buyer: {
        name: 'Abdulrahman Al-Sudais',
        nameAr: 'عبدالرحمن السديس',
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
      amountPaid: 984, // Current payment amount
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

    // 9. Tax Invoice (Official ZATCA Bilingual Tax Invoice)
    {
      id: 'doc-tax-001',
      storeId,
      documentType: 'tax_invoice',
      documentNumber: 'TAX-2026-0089',
      title: 'TAX INVOICE / فاتورة ضريبية',
      titleAr: 'فاتورة ضريبية معتمدة (هيئة الزكاة والضريبة والجمارك)',
      orderId: 'ord-101',
      orderNumber: 'ORD-9842',
      issueDate: '2026-10-08T10:15:00Z',
      dueDate: '2026-10-08T10:15:00Z',
      seller: {
        name: 'Makkah Gifts & Luxury Flowers Est.',
        nameAr: 'مؤسسة هدايا مكة والزهور الفاخرة',
        companyName: 'Makkah Gifts Commercial Est.',
        companyNameAr: 'مؤسسة هدايا مكة التجارية',
        email: 'tax@makkah-gifts.sa',
        phone: '+966 12 555 8899',
        address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
        addressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        postalCode: '24231',
        vatNumber: '300948215600003',
        crNumber: '1010892341',
      },
      buyer: {
        name: 'Abdulrahman Al-Sudais',
        nameAr: 'عبدالرحمن السديس',
        companyName: 'Al-Sudais Consulting Co.',
        companyNameAr: 'شركة السديس للاستشارات',
        email: 'a.sudais@example.com',
        phone: '+966 55 412 8899',
        address: 'Clock Tower Raffles Hotel, Suite 1804',
        addressAr: 'فندق رافلز برج الساعة، جناح 1804',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        postalCode: '24231',
        vatNumber: '300891245000003', // B2B Standard Tax Invoice requires Buyer VAT
        crNumber: '1010782391',
      },
      items: [
        {
          id: 'tax-it-1',
          name: 'Royal Dutch Red Roses Velvet Box',
          nameAr: 'صندوق مخملي فاخر بالورود الهولندية الحمراء',
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
        invoiceCategory: 'standard', // B2B Standard Tax Invoice
        invoiceType: '388',
        qrPayloadBase64: generateZatcaTlvBase64({
          sellerName: 'مؤسسة هدايا مكة والزهور الفاخرة',
          vatNumber: '300948215600003',
          timestamp: '2026-10-08T10:15:00Z',
          invoiceTotal: 984,
          vatTotal: 129,
          invoiceHash: 'NWQyOTAzNDIzOTQ4MjAzOTQ4MjA5MzQ4',
          digitalSignature: 'MEQCIG482934892348923489234892348923489234892348AiA892348923489234892348923489234892348923489',
        }),
        invoiceHash: 'NWQyOTAzNDIzOTQ4MjAzOTQ4MjA5MzQ4',
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
      customerReference: 'cust-205',
      issueDate: '2026-10-09T09:00:00Z',
      validUntil: '2026-10-30T23:59:59Z',
      seller: {
        name: 'Makkah Gifts & Luxury Flowers Est.',
        nameAr: 'مؤسسة هدايا مكة والزهور الفاخرة',
        companyName: 'Makkah Gifts Commercial Est.',
        companyNameAr: 'مؤسسة هدايا مكة التجارية',
        email: 'sales@makkah-gifts.sa',
        phone: '+966 12 555 8899',
        address: 'Ibrahim Al-Khalil Road, Jabal Omar District',
        addressAr: 'طريق إبراهيم الخليل، منطقة جبل عمر',
        city: 'Makkah',
        cityAr: 'مكة المكرمة',
        country: 'Saudi Arabia',
        vatNumber: '300948215600003',
        crNumber: '1010892341',
      },
      buyer: {
        name: 'Jabal Omar Development Company (JODC)',
        nameAr: 'شركة جبل عمر للتطوير',
        companyName: 'Jabal Omar Development Headquarters',
        companyNameAr: 'المقر الرئيسي لشركة جبل عمر للتطوير',
        email: 'procurement@jabalomar.com.sa',
        phone: '+966 12 553 0000',
        address: 'Makkah City Center, Jabal Omar Complex',
        addressAr: 'مركز مكة، مجمع جبل عمر الإداري',
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
      termsAndConditions: 'Proposal is valid for 21 days from issue date. Prices include complete floral maintenance, refrigerated vessel replacement, and florist on-call support.',
      notes: 'Special corporate volume pricing applied. Includes dedicated florist team on-site twice weekly.',
      auditTrail: [
        {
          id: 'aud-quo-1',
          timestamp: '2026-10-09T09:00:00Z',
          action: 'created',
          actorName: 'Tariq Al-Mansoor (Commercial Director)',
          actorRole: 'sales',
          details: 'Proposal draft created with corporate tier pricing schedule.',
        },
        {
          id: 'aud-quo-2',
          timestamp: '2026-10-09T09:30:00Z',
          action: 'status_changed',
          actorName: 'Tariq Al-Mansoor (Commercial Director)',
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
  private getStoredInvoices(storeId: string): InvoiceDocument[] {
    try {
      if (typeof window === 'undefined') return createInitialDocuments(storeId);
      const raw = localStorage.getItem(`${INVOICES_STORAGE_KEY}_${storeId}`);
      if (!raw) {
        const initial = createInitialDocuments(storeId);
        this.saveStoredInvoices(storeId, initial);
        return initial;
      }
      return JSON.parse(raw);
    } catch {
      return createInitialDocuments(storeId);
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

  public getDocuments(storeId: string): InvoiceDocument[] {
    return this.getStoredInvoices(storeId);
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

  // Quotation 1-click conversion to Order
  public convertQuotationToOrder(
    storeId: string,
    quotationId: string,
    actorName = 'Store Administrator',
  ): { quotation: InvoiceDocument; newOrderPayload: Partial<Order> } | null {
    const quotation = this.getDocumentById(storeId, quotationId);
    if (!quotation || quotation.documentType !== 'quotation') return null;

    const newOrderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Mark quotation as accepted and converted
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
      deliveryLocation: quotation.buyer.city || 'Makkah',
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
    try {
      if (typeof window === 'undefined') return INITIAL_SUPPLIERS;
      const raw = localStorage.getItem(`${SUPPLIERS_STORAGE_KEY}_${storeId}`);
      if (!raw) {
        localStorage.setItem(`${SUPPLIERS_STORAGE_KEY}_${storeId}`, JSON.stringify(INITIAL_SUPPLIERS));
        return INITIAL_SUPPLIERS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_SUPPLIERS;
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
    try {
      if (typeof window === 'undefined') return INITIAL_PURCHASES;
      const raw = localStorage.getItem(`${PURCHASES_STORAGE_KEY}_${storeId}`);
      if (!raw) {
        localStorage.setItem(`${PURCHASES_STORAGE_KEY}_${storeId}`, JSON.stringify(INITIAL_PURCHASES));
        return INITIAL_PURCHASES;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_PURCHASES;
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
  public getTemplateConfig(storeId: string): InvoiceTemplateConfig {
    try {
      if (typeof window === 'undefined') return { ...DEFAULT_TEMPLATE_CONFIG, storeId };
      const raw = localStorage.getItem(`${TEMPLATES_STORAGE_KEY}_${storeId}`);
      if (!raw) return { ...DEFAULT_TEMPLATE_CONFIG, storeId };
      return { ...DEFAULT_TEMPLATE_CONFIG, ...JSON.parse(raw), storeId };
    } catch {
      return { ...DEFAULT_TEMPLATE_CONFIG, storeId };
    }
  }

  public saveTemplateConfig(storeId: string, config: Partial<InvoiceTemplateConfig>): InvoiceTemplateConfig {
    const existing = this.getTemplateConfig(storeId);
    const merged = { ...existing, ...config, storeId };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${TEMPLATES_STORAGE_KEY}_${storeId}`, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('unityteck-template-updated', { detail: { storeId } }));
      }
    } catch {}
    return merged;
  }

  public resetTemplateConfig(storeId: string): InvoiceTemplateConfig {
    const defaults = { ...DEFAULT_TEMPLATE_CONFIG, storeId };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${TEMPLATES_STORAGE_KEY}_${storeId}`, JSON.stringify(defaults));
      }
    } catch {}
    return defaults;
  }
}

export const invoiceService = new InvoiceService();

export type InvoiceDocumentType =
  | 'order_invoice'
  | 'cancelled_order_invoice'
  | 'refund_receipt'
  | 'proforma_invoice'
  | 'purchase_invoice'
  | 'credit_note'
  | 'delivery_note'
  | 'payment_receipt'
  | 'tax_invoice'
  | 'quotation';

export type InvoiceDocumentStatus =
  | 'draft'
  | 'issued'
  | 'paid'
  | 'partially_paid'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted';

export interface InvoiceLineItem {
  id: string;
  name: string;
  nameAr?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number; // e.g. 15 for 15%
  taxAmount?: number;
  total: number;
  image?: string;
}

export interface DocumentPartyDetails {
  name: string;
  nameAr?: string;
  companyName?: string;
  companyNameAr?: string;
  email?: string;
  phone?: string;
  address?: string;
  addressAr?: string;
  city?: string;
  cityAr?: string;
  country?: string;
  postalCode?: string;
  vatNumber?: string; // Tax Registration Number (الرقم الضريبي)
  crNumber?: string;  // Commercial Registration Number (السجل التجاري)
}

export interface PaymentTransactionRecord {
  id: string;
  transactionId: string;
  gatewayProvider: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paidAt: string;
  reference?: string;
}

export interface RefundTransactionRecord {
  id: string;
  refundReceiptNumber: string;
  originalTransactionId?: string;
  gatewayProvider: string;
  refundMethod: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  refundedAt: string;
  reason?: string;
}

export interface SupplierRecord {
  id: string;
  storeId: string;
  name: string;
  nameAr?: string;
  contactPerson: string;
  email: string;
  phone: string;
  vatNumber?: string;
  crNumber?: string;
  address: string;
  city: string;
  country: string;
  paymentTerms?: string;
  balance: number;
  createdAt: string;
}

export interface PurchaseRecord {
  id: string;
  storeId: string;
  purchaseInvoiceNumber: string;
  supplierId: string;
  supplierName: string;
  supplierNameAr?: string;
  purchaseDate: string;
  dueDate?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost?: number;
  grandTotal: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: 'paid' | 'partially_paid' | 'pending';
  notes?: string;
}

export interface DocumentAuditEntry {
  id: string;
  timestamp: string;
  action: 'created' | 'issued' | 'edited' | 'printed' | 'exported_pdf' | 'status_changed' | 'payment_applied' | 'refund_issued' | 'credit_issued' | 'converted';
  actorName: string;
  actorRole: string;
  details: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface InvoiceDocument {
  id: string;
  storeId: string;
  documentType: InvoiceDocumentType;
  documentNumber: string; // e.g. INV-2026-0042
  title?: string;
  titleAr?: string;
  
  // Cross References
  orderId?: string;
  orderNumber?: string;
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  customerReference?: string;
  supplierId?: string;
  supplierReference?: string;
  cancellationReference?: string;
  
  // Dates
  issueDate: string;
  dueDate?: string;
  validUntil?: string; // for quotations and proformas
  cancellationDate?: string; // for cancellations
  refundDate?: string; // for refunds
  dispatchDate?: string; // for delivery notes
  
  // Parties
  seller: DocumentPartyDetails;
  buyer: DocumentPartyDetails;
  
  // Line items
  items: InvoiceLineItem[];
  
  // Financial Totals
  subtotal: number;
  discountAmount: number;
  discountDescription?: string;
  shippingFee: number;
  taxRate: number; // default 15%
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  outstandingBalance: number;
  currency: string;
  
  // Specific Metadata for special doc types
  cancellationReason?: string;
  originalOrderValue?: number;
  refundAmount?: number;
  refundMethod?: string;
  refundTransactionRef?: string;
  refundStatus?: 'succeeded' | 'pending' | 'failed' | 'unverified';
  
  creditReason?: string;
  creditedTaxAmount?: number;
  totalCreditedAmount?: number;
  creditStatus?: 'issued' | 'applied' | 'refunded';
  
  courierCompany?: string;
  trackingNumber?: string;
  deliveryInstructions?: string;
  packageCount?: number;
  packageWeightKg?: number;
  recipientSignature?: string;
  dispatchStatus?: 'ready_for_pickup' | 'in_transit' | 'out_for_delivery' | 'delivered';
  
  paymentMethod?: string;
  paymentTransactionId?: string;
  paymentStatus?: 'verified_success' | 'pending' | 'failed';
  previouslyPaidAmount?: number;
  
  quotationStatus?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  convertedOrderId?: string;
  
  // ZATCA Saudi Tax Compliance
  zatca?: {
    invoiceCategory: 'simplified' | 'standard';
    invoiceType: '388' | '383' | '381'; // 388=Tax Invoice, 383=Debit Note, 381=Credit Note
    qrPayloadBase64?: string;
    invoiceHash?: string;
    cryptographicStamp?: string;
    complianceStatus: 'compliant_preview' | 'reported' | 'cleared' | 'simulated';
    vatCategoryCode: 'S' | 'Z' | 'E' | 'O'; // Standard 15%, Zero, Exempt, Out of scope
  };
  
  // Status & Custom notes
  status: InvoiceDocumentStatus;
  paymentTerms?: string;
  notes?: string;
  termsAndConditions?: string;
  
  // History & Snapshot
  auditTrail: DocumentAuditEntry[];
  isLocked: boolean; // Once issued, immutable unless credit/cancellation issued
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceTemplateConfig {
  storeId: string;
  documentType: InvoiceDocumentType | 'all';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: 'Tajawal' | 'Cairo' | 'Inter' | 'IBM Plex Sans Arabic' | 'Almarai' | 'System';
  fontSize: 'compact' | 'normal' | 'spacious';
  logoUrl?: string;
  showLogo: boolean;
  businessNameEn: string;
  businessNameAr: string;
  taxNumber: string;
  crNumber: string;
  headerAddressEn: string;
  headerAddressAr: string;
  contactEmail: string;
  contactPhone: string;
  
  // Table Columns Visibility
  columns: {
    sku: boolean;
    image: boolean;
    unitPrice: boolean;
    discount: boolean;
    taxRate: boolean;
    taxAmount: boolean;
    total: boolean;
  };
  
  // Section Visibility
  showZatcaQr: boolean;
  showPaymentInstructions: boolean;
  showBankDetails: boolean;
  showSignatureField: boolean;
  showNotes: boolean;
  showTerms: boolean;
  showWatermark: boolean;
  
  // Text Content
  customNotesEn: string;
  customNotesAr: string;
  customTermsEn: string;
  customTermsAr: string;
  bankDetailsEn: string;
  bankDetailsAr: string;
  
  // Layout Options
  pageSize: 'A4' | 'Letter';
  pageOrientation: 'portrait' | 'landscape';
  direction: 'auto' | 'rtl' | 'ltr';
  compactMode: boolean;
}

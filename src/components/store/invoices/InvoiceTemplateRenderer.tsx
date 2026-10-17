import React from 'react';
import type { InvoiceDocument, InvoiceTemplateConfig } from '../../../types/invoices';
import { OrderInvoiceTemplate } from './templates/OrderInvoiceTemplate';
import { CancellationRecordTemplate } from './templates/CancellationRecordTemplate';
import { RefundReceiptTemplate } from './templates/RefundReceiptTemplate';
import { ProformaInvoiceTemplate } from './templates/ProformaInvoiceTemplate';
import { PurchaseInvoiceTemplate } from './templates/PurchaseInvoiceTemplate';
import { CreditNoteTemplate } from './templates/CreditNoteTemplate';
import { DeliveryNoteTemplate } from './templates/DeliveryNoteTemplate';
import { PaymentReceiptTemplate } from './templates/PaymentReceiptTemplate';
import { TaxInvoiceTemplate } from './templates/TaxInvoiceTemplate';
import { QuotationTemplate } from './templates/QuotationTemplate';

interface InvoiceTemplateRendererProps {
  document: InvoiceDocument;
  config: InvoiceTemplateConfig;
  locale?: 'en' | 'ar';
}

export const InvoiceTemplateRenderer: React.FC<InvoiceTemplateRendererProps> = ({
  document,
  config,
  locale = 'ar',
}) => {
  const resolvedLocale = config.direction === 'ltr' ? 'en' : config.direction === 'rtl' ? 'ar' : locale;

  // Render appropriate dedicated template
  switch (document.documentType) {
    case 'order_invoice':
      return <OrderInvoiceTemplate document={document} config={config} locale={resolvedLocale} />;
    case 'cancelled_order_invoice':
      return <CancellationRecordTemplate document={document} config={config} locale={resolvedLocale} />;
    case 'refund_receipt':
      return <RefundReceiptTemplate document={document} config={config} locale={resolvedLocale} />;
    case 'proforma_invoice':
      return <ProformaInvoiceTemplate document={document} config={config} locale={resolvedLocale} />;
    case 'purchase_invoice':
      return <PurchaseInvoiceTemplate document={document} config={config} locale={resolvedLocale} />;
    case 'credit_note':
      return <CreditNoteTemplate document={document} config={config} locale={resolvedLocale} />;
    case 'delivery_note':
      return <DeliveryNoteTemplate document={document} config={config} locale={resolvedLocale} />;
    case 'payment_receipt':
      return <PaymentReceiptTemplate document={document} config={config} locale={resolvedLocale} />;
    case 'tax_invoice':
      return <TaxInvoiceTemplate document={document} config={config} locale={resolvedLocale} />;
    case 'quotation':
      return <QuotationTemplate document={document} config={config} locale={resolvedLocale} />;
    default:
      return <OrderInvoiceTemplate document={document} config={config} locale={resolvedLocale} />;
  }
};

import { invoiceService } from '../src/services/invoiceService';
import { generateZatcaTlvBase64, isValidSaudiVatNumber } from '../src/utils/zatca';
import type { InvoiceDocumentType } from '../src/types/invoices';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING INVOICE MANAGEMENT SYSTEM AUTOMATED TESTS');
  console.log('====================================================\n');

  const testStoreId = 'test-store-invoice-suite';

  // 1. Test All 10 Document Types Initialized
  console.log('--- Test Suite 1: 10 Document Types Availability ---');
  const docs = invoiceService.getDocuments(testStoreId);
  assert(docs.length === 10, `Initial seeded documents count should be 10, got ${docs.length}`);

  const requiredTypes: InvoiceDocumentType[] = [
    'order_invoice',
    'cancelled_order_invoice',
    'refund_receipt',
    'proforma_invoice',
    'purchase_invoice',
    'credit_note',
    'delivery_note',
    'payment_receipt',
    'tax_invoice',
    'quotation',
  ];

  for (const docType of requiredTypes) {
    const found = docs.find((d) => d.documentType === docType);
    assert(Boolean(found), `Document type "${docType}" must exist in seeded suite`);
    assert(Boolean(found?.documentNumber), `Document "${docType}" must have a valid document number`);
  }

  // 2. Test ZATCA TLV Encoding & QR Base64 Generation
  console.log('\n--- Test Suite 2: ZATCA Saudi E-Invoicing TLV Base64 Encoding ---');
  const zatcaPayload = generateZatcaTlvBase64({
    sellerName: 'مؤسسة هدايا مكة',
    vatNumber: '300948215600003',
    timestamp: '2026-10-10T12:00:00Z',
    invoiceTotal: 1150.0,
    vatTotal: 150.0,
  });

  assert(typeof zatcaPayload === 'string' && zatcaPayload.length > 20, 'ZATCA TLV payload generated as non-empty Base64 string');
  assert(isValidSaudiVatNumber('300948215600003'), '300948215600003 is recognized as valid 15-digit Saudi VAT');
  assert(!isValidSaudiVatNumber('1234567890'), '1234567890 is correctly rejected as invalid VAT number');
  assert(!isValidSaudiVatNumber('400948215600003'), '400948215600003 is rejected because it does not start with 3');

  // 3. Test Cancellation vs Refund Separation
  console.log('\n--- Test Suite 3: Cancellation vs Refund Separation Rule ---');
  const cancelDoc = docs.find((d) => d.documentType === 'cancelled_order_invoice');
  assert(cancelDoc?.status === 'cancelled', 'Cancellation record status is "cancelled"');
  assert(cancelDoc?.refundStatus === 'pending', 'Cancelled order does NOT automatically mark refund as succeeded');

  // 4. Test Delivery Note Zero-Financial Integrity
  console.log('\n--- Test Suite 4: Delivery Note Logistics Waybill Rule ---');
  const deliveryDoc = docs.find((d) => d.documentType === 'delivery_note');
  assert(deliveryDoc?.grandTotal === 0, 'Delivery note must not display financial pricing totals');
  assert(Boolean(deliveryDoc?.courierCompany), 'Delivery note includes courier company info');
  assert(Boolean(deliveryDoc?.recipientSignature), 'Delivery note includes recipient handover signature field');

  // 5. Test Payment Receipt & Partial Ledger Breakdown
  console.log('\n--- Test Suite 5: Payment Receipt Partial Payment Ledger ---');
  const receiptDoc = docs.find((d) => d.documentType === 'payment_receipt');
  assert(Boolean(receiptDoc?.paymentTransactionId), 'Payment receipt contains verified transaction ID');
  assert(receiptDoc?.amountPaid === 984, `Received amount should match payment record (984 SAR), got ${receiptDoc?.amountPaid}`);
  assert(receiptDoc?.outstandingBalance === 0, 'Remaining balance matches after full settlement');

  // 6. Test Quotation 1-Click Conversion to Order
  console.log('\n--- Test Suite 6: Quotation Explicit Conversion Action ---');
  const quoDoc = docs.find((d) => d.documentType === 'quotation');
  assert(quoDoc?.quotationStatus === 'sent', 'Initial quotation status is "sent"');

  const conversionResult = invoiceService.convertQuotationToOrder(testStoreId, quoDoc!.id, 'Test Suite Agent');
  assert(Boolean(conversionResult), 'Quotation conversion succeeds');
  assert(conversionResult?.quotation.status === 'converted', 'Quotation marked as "converted"');
  assert(conversionResult?.quotation.quotationStatus === 'converted', 'Quotation quotationStatus updated to "converted"');
  assert(Boolean(conversionResult?.newOrderPayload.orderNumber), 'New Order payload generated with unique order number');
  assert(conversionResult?.newOrderPayload.customerName === quoDoc?.buyer.name, 'Customer name mapped correctly to new order');
  assert(conversionResult?.newOrderPayload.total === quoDoc?.grandTotal, 'Order total matches quotation proposal total');

  // 7. Test Numbering Sequence Generation
  console.log('\n--- Test Suite 7: Sequential Numbering Generators ---');
  const nextInv = invoiceService.getNextDocumentNumber(testStoreId, 'order_invoice');
  const nextCan = invoiceService.getNextDocumentNumber(testStoreId, 'cancelled_order_invoice');
  const nextTax = invoiceService.getNextDocumentNumber(testStoreId, 'tax_invoice');

  assert(nextInv.startsWith('INV-'), `Invoice prefix should be INV-, got ${nextInv}`);
  assert(nextCan.startsWith('CAN-'), `Cancellation prefix should be CAN-, got ${nextCan}`);
  assert(nextTax.startsWith('TAX-'), `Tax invoice prefix should be TAX-, got ${nextTax}`);

  // 8. Test Suppliers and Purchases
  console.log('\n--- Test Suite 8: Suppliers & Purchase Invoices ---');
  const suppliers = invoiceService.getSuppliers(testStoreId);
  assert(suppliers.length >= 3, `Suppliers list should have at least 3 suppliers, got ${suppliers.length}`);
  const purchases = invoiceService.getPurchases(testStoreId);
  assert(purchases.length >= 2, `Purchases list should have at least 2 purchase records, got ${purchases.length}`);

  // 9. Test Template Settings Customization
  console.log('\n--- Test Suite 9: Template Customizer Persistence ---');
  const defaultConf = invoiceService.getTemplateConfig(testStoreId);
  assert(Boolean(defaultConf.businessNameAr), 'Default template configuration has Arabic business name');
  assert(Boolean(defaultConf.taxNumber), 'Default template configuration has VAT number');

  const updatedConf = invoiceService.saveTemplateConfig(testStoreId, {
    primaryColor: '#1e3a8a',
    fontSize: 'compact',
  });
  assert(updatedConf.primaryColor === '#1e3a8a', 'Primary color updated in config');
  assert(updatedConf.fontSize === 'compact', 'Font size updated to compact in config');

  // 10. Test ZATCA Phase 2 Cryptographic TLV & XML Hashing
  console.log('\n--- Test Suite 10: ZATCA Phase 2 Cryptographic Validation & SHA-256 Hashing ---');
  const { parseAndVerifyZatcaTlv, generateInvoiceHashSha256 } = await import('../src/utils/zatca');
  
  const testXmlString = '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"><ID>INV-2026-0042</ID><IssueDate>2026-10-18</IssueDate></Invoice>';
  const computedHash = generateInvoiceHashSha256(testXmlString);
  assert(typeof computedHash === 'string' && computedHash.length > 20, 'Invoice SHA-256 hash successfully calculated in Base64');

  const phase2Payload = generateZatcaTlvBase64({
    sellerName: 'مؤسسة هدايا مكة والزهور الفاخرة',
    vatNumber: '300948215600003',
    timestamp: '2026-10-18T14:30:00Z',
    invoiceTotal: 1500.0,
    vatTotal: 225.0,
    invoiceHash: computedHash,
    digitalSignature: 'MEQCID6v9320kL81_ZATCA_PHASE2_ECDSA_STAMP_VERIFIED',
    publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7ZATCA_PUBKEY',
    stampIdentifier: 'CSID-SA-TEST-9921',
  });

  const verification = parseAndVerifyZatcaTlv(phase2Payload);
  assert(verification.isValid, 'Phase 2 TLV payload is valid with 0 errors');
  assert(verification.isPhase2Compliant, 'Phase 2 compliance verified (Tags 6, 7, 8 detected)');
  assert(verification.sellerName === 'مؤسسة هدايا مكة والزهور الفاخرة', 'Parsed seller name matches in Arabic UTF-8');
  assert(verification.vatNumber === '300948215600003', 'Parsed VAT registration number matches');
  assert(verification.invoiceTotal === 1500, 'Parsed invoice total matches 1500 SAR');
  assert(verification.invoiceHash === computedHash, 'Parsed XML hash matches input computedHash');
  assert(verification.parsedTags.length >= 8, `Parsed tags count should be at least 8, got ${verification.parsedTags.length}`);

  // 11. Test Courier Code 128 Barcodes & Shipping Label Specifications
  console.log('\n--- Test Suite 11: Courier Code 128 Printable Barcodes (SMSA / SPL / Aramex) ---');
  const { generateCode128Svg, getCarrierBrand } = await import('../src/utils/courierBarcode');

  const smsaBrand = getCarrierBrand('smsa');
  assert(smsaBrand.code === 'smsa', 'SMSA brand recognized correctly');
  assert(smsaBrand.serviceCenterPhone === '920009999', 'SMSA official customer support hotline matches');

  const splBrand = getCarrierBrand('spl');
  assert(splBrand.code === 'spl', 'SPL brand recognized correctly');
  assert(splBrand.serviceCenterPhone === '19992', 'SPL official customer support hotline matches');

  const aramexBrand = getCarrierBrand('aramex');
  assert(aramexBrand.code === 'aramex', 'Aramex brand recognized correctly');
  assert(aramexBrand.serviceCenterPhone === '920027447', 'Aramex official customer care hotline matches');

  const awbSvg = generateCode128Svg('SMSA-AWB-984210-SA', { height: 50 });
  assert(awbSvg.includes('<svg') && awbSvg.includes('SMSA-AWB-984210-SA'), 'Generated SVG contains valid Code 128 barcode markup and text');

  console.log('\n====================================================');
  console.log('🎉 ALL 11 TEST SUITES COMPLETED SUCCESSFULLY! (100% PASS)');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

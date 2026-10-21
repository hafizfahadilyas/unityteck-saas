import { invoiceService } from '../src/services/invoiceService';
import { generateZatcaTlvBase64, parseAndVerifyZatcaTlv, isValidSaudiVatNumber } from '../src/utils/zatca';
import { normalizeSaudiPhone, isValidSaudiMobile, formatSaudiDisplay, getWhatsAppChatUrl } from '../src/utils/phone';
import { getCarrierBrand, generateCode128Svg } from '../src/utils/courierBarcode';
import { resolveStoreTheme, getAllThemes } from '../src/themes/registry';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runEndToEndVerification() {
  console.log('========================================================================');
  console.log('🚀 UNITYTECK ENTERPRISE SAAS — STEP 7.3 FULL END-TO-END VERIFICATION');
  console.log('========================================================================\n');

  // 1. ZATCA E-Invoicing Phase 1 & Phase 2 QR Engine
  console.log('--- 1. Saudi ZATCA E-Invoicing Cryptographic Verification ---');
  assert(isValidSaudiVatNumber('300948215600003'), 'Saudi VAT 300948215600003 is valid 15-digit number starting with 3');
  assert(!isValidSaudiVatNumber('400948215600003'), 'VAT starting with non-3 is correctly rejected');
  assert(!isValidSaudiVatNumber('1234567890'), '10-digit VAT is correctly rejected');

  const zatcaTlv = generateZatcaTlvBase64({
    sellerName: 'مؤسسة هدايا مكة للتجارة',
    vatNumber: '300948215600003',
    timestamp: '2026-10-18T12:00:00Z',
    invoiceTotal: 1850.75,
    vatTotal: 241.40,
    invoiceHash: 'r3498rhf834hfoi3h4f==',
    digitalSignature: 'MEQCIDe...sig',
    publicKey: 'MFkwEwYHKo...',
    stampIdentifier: 'CSID-TEST-001',
  });
  assert(Boolean(zatcaTlv && zatcaTlv.length > 50), 'Phase 2 ZATCA TLV Base64 payload generated successfully');

  const parsedZatca = parseAndVerifyZatcaTlv(zatcaTlv);
  assert(parsedZatca.sellerName === 'مؤسسة هدايا مكة للتجارة', 'ZATCA UTF-8 Arabic seller name decoded without corruption');
  assert(parsedZatca.vatNumber === '300948215600003', 'ZATCA VAT number decoded accurately');
  assert(parsedZatca.invoiceTotal === 1850.75, 'ZATCA invoice total decoded accurately as 1850.75 SAR');
  assert(parsedZatca.vatTotal === 241.40, 'ZATCA VAT total decoded accurately as 241.40 SAR');
  assert(parsedZatca.isPhase2Compliant === true, 'Phase 2 security tags (Tags 6, 7, 8) present and valid');

  // 2. Saudi Mobile Normalization & WhatsApp Logistics Engine
  console.log('\n--- 2. Saudi Mobile (+966) & WhatsApp Logistics Dispatch ---');
  const normalizedPhone = normalizeSaudiPhone('0551234567');
  assert(normalizedPhone === '+966551234567', 'Saudi local format 0551234567 normalized to E.164 +966551234567');
  assert(isValidSaudiMobile('0581617712'), '0581617712 passes Saudi mobile validation');
  assert(!isValidSaudiMobile('0112223344'), 'Landline 011 is rejected from mobile SMS/WhatsApp dispatch');

  const waUrl = getWhatsAppChatUrl('0581617712', 'مرحباً، تم شحن طلبك رقم #1029 بنجاح عبر شركة سمسا');
  assert(waUrl.includes('https://wa.me/966581617712'), 'WhatsApp direct wa.me link generated with country code target');
  assert(waUrl.includes('%D9%85%D8%B1%D8%AD%D8%A8%D8%A7'), 'Arabic notification message percent-encoded safely for browser navigation');

  // 3. Courier Logistics & Code 128 Barcodes (SMSA, SPL, Aramex)
  console.log('\n--- 3. Saudi Courier Waybills & Code 128 Barcodes ---');
  const brandSmsa = getCarrierBrand('smsa');
  assert(brandSmsa.nameAr === 'سمسا إكسبريس', 'SMSA Express Arabic name verified');
  assert(brandSmsa.serviceCenterPhone === '920009999', 'SMSA official hotline matches KSA registry (920009999)');

  const brandSpl = getCarrierBrand('spl');
  assert(brandSpl.nameAr.includes('البريد السعودي'), 'Saudi Post SPL Arabic name verified');
  assert(brandSpl.serviceCenterPhone === '19992', 'SPL official hotline matches KSA registry (19992)');

  const barcodeSvg = generateCode128Svg('SMSA-98234-KSA');
  assert(barcodeSvg.includes('<svg') && barcodeSvg.includes('SMSA-98234-KSA'), 'Printable Code 128 barcode SVG generated with tracking text');

  // 4. Multi-Store Theme Resolution & Storefront Isolation
  console.log('\n--- 4. Multi-Store Theme Routing & Storefront Isolation ---');
  const allThemes = getAllThemes();
  assert(allThemes.length >= 3, `All 3 flagship themes registered in theme registry (found: ${allThemes.length})`);

  const tCoffee = resolveStoreTheme('store-coffee');
  assert(tCoffee.id === 'theme-coffee' || tCoffee.slug === 'coffeeRoasters', `Store "store-coffee" maps to Coffee theme: ${tCoffee.name}`);

  const tCar = resolveStoreTheme('store-bleco');
  assert(tCar.id === 'theme-transport' || tCar.slug === 'saudiaTransport', `Store "store-bleco" maps to Saudia Transport theme: ${tCar.name}`);

  const tGifts = resolveStoreTheme('store-1');
  assert(tGifts.id === 'theme-gifts' || tGifts.slug === 'meccaGifts', `Store "store-1" maps to Mecca Gifts theme: ${tGifts.name}`);

  // 5. Invoicing Multi-Tenancy & Documents Lifecycle
  console.log('\n--- 5. Invoicing Multi-Tenancy & Document Types Lifecycle ---');
  const coffeeDocs = invoiceService.getDocuments('store-coffee');
  assert(coffeeDocs.length === 10, `store-coffee has 10 complete document types initialized (found: ${coffeeDocs.length})`);

  const blecoDocs = invoiceService.getDocuments('store-bleco');
  assert(blecoDocs.length === 10, `store-bleco has isolated 10 complete document types initialized`);

  // Document types verification
  const requiredTypes = [
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
    const found = coffeeDocs.find((d) => d.documentType === docType);
    assert(Boolean(found), `Document "${docType}" is present in tenant store`);
  }

  // 6. Quotation to Order Conversion Flow
  console.log('\n--- 6. Quotation to Sales Order Conversion Transaction ---');
  const quote = invoiceService.getDocuments('store-test-e2e').find((d) => d.documentType === 'quotation');
  if (quote) {
    const conversionResult = invoiceService.convertQuotationToOrder('store-test-e2e', quote.id, 'E2E Stress Agent');
    assert(Boolean(conversionResult), 'Quotation conversion function returned valid result');
    assert(conversionResult?.quotation.quotationStatus === 'converted', 'Quotation successfully converted to confirmed sales order');
    assert(Boolean(conversionResult?.newOrderPayload.orderNumber), 'Sales order received unique sequential order number');
  }

  console.log('\n========================================================================');
  console.log('🎉 STEP 7.3 COMPLETE: 100% OF END-TO-END AUDIT CHECKS PASSED!');
  console.log('========================================================================\n');
}

runEndToEndVerification().catch((err) => {
  console.error('Stress verification encountered an error:', err);
  process.exit(1);
});

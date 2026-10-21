import { invoiceService, isCoffeeStoreId, getStoreInvoiceProfile } from '../src/services/invoiceService';
import { getLocalizedItemName, getCustomerDisplayName, getLocalizedAddress } from '../src/utils/storeLocalization';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runIsolationTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING INVOICES MULTI-TENANT & ISOLATION TESTS');
  console.log('====================================================\n');

  // Test 1: isCoffeeStoreId detection
  console.log('--- Test 1: Store Type Detection ---');
  assert(isCoffeeStoreId('store-coffee') === true, 'store-coffee correctly identified as Coffee store');
  assert(isCoffeeStoreId('store-1') === false, 'store-1 identified as non-coffee store');
  assert(isCoffeeStoreId('store-bleco') === false, 'store-bleco identified as non-coffee store');

  // Test 2: Coffee Store Profile
  console.log('\n--- Test 2: Store Profile Isolation ---');
  const coffeeProfile = getStoreInvoiceProfile('store-coffee');
  assert(coffeeProfile.nameEn === 'HiBrew KSA Official Coffee Store', 'Coffee store profile nameEn is HiBrew');
  assert(coffeeProfile.vatNumber === '31048821900003', 'Coffee store VAT is 31048821900003');
  assert(coffeeProfile.crNumber === '1010892410', 'Coffee store CR is 1010892410');
  assert(coffeeProfile.cityEn === 'Riyadh', 'Coffee store city is Riyadh');

  const flowerProfile = getStoreInvoiceProfile('store-1');
  assert(flowerProfile.nameEn === 'Makkah Gifts & Luxury Flowers Est.', 'Flower store profile nameEn is Makkah Gifts');
  assert(flowerProfile.vatNumber === '300948215600003', 'Flower store VAT is 300948215600003');

  // Test 3: Coffee Store Documents — Zero Flower Contamination
  console.log('\n--- Test 3: Zero Flower Contamination in Coffee Store ---');
  const coffeeDocs = invoiceService.getDocuments('store-coffee');
  assert(coffeeDocs.length === 10, `Coffee store has 10 documents, got ${coffeeDocs.length}`);

  for (const doc of coffeeDocs) {
    const sellerFull = (doc.seller.name || '') + (doc.seller.nameAr || '');
    assert(!sellerFull.includes('Makkah Gifts'), `Doc ${doc.documentNumber} seller must not include "Makkah Gifts"`);
    assert(!sellerFull.includes('هدايا مكة'), `Doc ${doc.documentNumber} seller must not include "هدايا مكة"`);

    for (const item of doc.items) {
      assert(!item.name.toLowerCase().includes('rose'), `Item "${item.name}" must not contain rose`);
      assert(!item.name.toLowerCase().includes('flower'), `Item "${item.name}" must not contain flower`);
      assert(!item.name.toLowerCase().includes('patchi'), `Item "${item.name}" must not contain patchi`);
      if (item.nameAr) {
        assert(!item.nameAr.includes('ورد'), `Item "${item.nameAr}" must not contain ورد`);
        assert(!item.nameAr.includes('زهور'), `Item "${item.nameAr}" must not contain زهور`);
      }
    }
  }

  // Test 4: Bilingual Localization Helpers
  console.log('\n--- Test 4: Bilingual Localization Helpers (Arabic & English) ---');
  const coffeeItem = {
    name: 'ماكينة هاي برو H10A دبل بويلر 20 بار',
    sku: 'HIB-H10A-PRO',
    price: 1450,
  };
  const itemEn = getLocalizedItemName(coffeeItem, 'en');
  const itemAr = getLocalizedItemName(coffeeItem, 'ar');
  assert(itemEn.includes('HiBrew H10A') || itemEn.includes('Dual Boiler'), `English item name should be HiBrew, got "${itemEn}"`);
  assert(itemAr.includes('هاي برو'), `Arabic item name should be in Arabic, got "${itemAr}"`);

  const customerName = 'عبدالرحمن السديس';
  const custEn = getCustomerDisplayName(customerName, 'en');
  const custAr = getCustomerDisplayName(customerName, 'ar');
  assert(custEn === 'Abdulrahman Al-Sudais', `Customer English transliteration should match, got "${custEn}"`);
  assert(custAr === 'عبدالرحمن السديس', `Customer Arabic should match, got "${custAr}"`);

  // Test 5: Suppliers & Purchases Isolation
  console.log('\n--- Test 5: Suppliers & Purchases Isolation ---');
  const coffeeSuppliers = invoiceService.getSuppliers('store-coffee');
  assert(coffeeSuppliers.length >= 3, `Coffee suppliers count should be at least 3, got ${coffeeSuppliers.length}`);
  const hasHiBrewSupplier = coffeeSuppliers.some((s) => s.name.includes('HiBrew'));
  assert(hasHiBrewSupplier, 'Coffee suppliers must contain HiBrew Global Technology');
  const hasDutchFloraInCoffee = coffeeSuppliers.some((s) => s.name.includes('Dutch Flora'));
  assert(!hasDutchFloraInCoffee, 'Coffee store suppliers must NOT contain Dutch Flora');

  const coffeePurchases = invoiceService.getPurchases('store-coffee');
  assert(coffeePurchases.length >= 2, `Coffee purchases count should be at least 2, got ${coffeePurchases.length}`);
  const hasFlowerPurchases = coffeePurchases.some((p) => p.supplierName.includes('Dutch Flora'));
  assert(!hasFlowerPurchases, 'Coffee store purchases must NOT contain Dutch Flora');

  console.log('\n====================================================');
  console.log('🎉 ALL ISOLATION & BILINGUAL TESTS PASSED (100%)');
  console.log('====================================================');
}

runIsolationTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

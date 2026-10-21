import {
  normalizeSaudiPhone,
  isValidSaudiMobile,
  formatSaudiDisplay,
  getWhatsAppChatUrl,
  interpolateNotificationTemplate,
} from '../src/utils/phone';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runNotificationTests() {
  console.log('================================================================');
  console.log('📱 RUNNING SAUDI ARABIA (+966) NOTIFICATION SYSTEM AUTOMATED TESTS');
  console.log('================================================================\n');

  // 1. Phone Normalization Tests
  console.log('--- Test Suite 1: Saudi Mobile Normalization (E.164 +9665XXXXXXXX) ---');

  const testCases = [
    { input: '0551234567', expected: '+966551234567' },
    { input: '0509876543', expected: '+966509876543' },
    { input: '581617712', expected: '+966581617712' },
    { input: '966581617712', expected: '+966581617712' },
    { input: '+966581617712', expected: '+966581617712' },
    { input: '00966581617712', expected: '+966581617712' },
    { input: ' 058-161-7712 ', expected: '+966581617712' },
    { input: '+966 58 161 7712', expected: '+966581617712' },
  ];

  for (const tc of testCases) {
    const result = normalizeSaudiPhone(tc.input);
    assert(result === tc.expected, `Input "${tc.input}" normalized to "${result}", expected "${tc.expected}"`);
  }

  // 2. Saudi Mobile Number Validation Tests
  console.log('\n--- Test Suite 2: Saudi Mobile Validation ---');

  const validNumbers = [
    '0551234567',
    '0501112233',
    '0549998877',
    '0561234987',
    '0570001122',
    '0581617712',
    '0591234567',
    '+966581617712',
  ];

  for (const num of validNumbers) {
    assert(isValidSaudiMobile(num), `Valid mobile number "${num}" must pass validation`);
  }

  const invalidNumbers = [
    '0125558899',       // Landline (Makkah 012)
    '0112223344',       // Landline (Riyadh 011)
    '12345678',         // Incomplete
    '+14155552671',     // US Number
    '+971501234567',    // UAE Number
    'not_a_number',     // Text
  ];

  for (const num of invalidNumbers) {
    assert(!isValidSaudiMobile(num), `Invalid number "${num}" must fail Saudi mobile validation`);
  }

  // 3. Saudi Mobile Display Formatting
  console.log('\n--- Test Suite 3: Mobile Display Formatting ---');
  const formatted = formatSaudiDisplay('0581617712');
  assert(formatted === '+966 58 161 7712', `Formatted "+966 58 161 7712" matches, got "${formatted}"`);

  // 4. WhatsApp Direct Chat URL Generation
  console.log('\n--- Test Suite 4: WhatsApp wa.me Link Generation ---');
  const waUrl = getWhatsAppChatUrl('0581617712', 'مرحباً، أود الاستفسار عن طلبي #WM-1001');
  assert(waUrl.startsWith('https://wa.me/966581617712?text='), `WhatsApp direct URL properly generated with target 966581617712`);
  assert(waUrl.includes('%D9%85%D8%B1%D8%AD%D8%A8%D8%A7'), `Arabic message properly UTF-8 percent-encoded in query string`);

  // 5. Template Tag Interpolation
  console.log('\n--- Test Suite 5: Dynamic Template Tag Interpolation ---');
  const templateAr = 'مرحباً {{customer_name}}، تم شحن طلبك #{{order_number}} بمبلغ {{order_total}} ر.س مع {{courier_name}} برقم تتبع {{tracking_number}}. للتتبع: {{tracking_url}}';

  const interpolated = interpolateNotificationTemplate(templateAr, {
    customer_name: 'فهد العصيمي',
    order_number: 'MK-9821',
    order_total: '450.00',
    courier_name: 'سمسا إكسبريس (SMSA)',
    tracking_number: 'SMSA-9821443',
    tracking_url: 'https://track.unityteck.sa/?c=smsa&awb=SMSA-9821443',
  });

  assert(interpolated.includes('فهد العصيمي'), 'Substituted {{customer_name}} correctly');
  assert(interpolated.includes('MK-9821'), 'Substituted {{order_number}} correctly');
  assert(interpolated.includes('450.00'), 'Substituted {{order_total}} correctly');
  assert(interpolated.includes('سمسا إكسبريس (SMSA)'), 'Substituted {{courier_name}} correctly');
  assert(interpolated.includes('SMSA-9821443'), 'Substituted {{tracking_number}} correctly');
  assert(interpolated.includes('https://track.unityteck.sa/?c=smsa&awb=SMSA-9821443'), 'Substituted {{tracking_url}} correctly');
  assert(!interpolated.includes('{{'), 'All tags were replaced without leftovers');

  console.log('\n================================================================');
  console.log('🎉 ALL 20 NOTIFICATION TEST CASES PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runNotificationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

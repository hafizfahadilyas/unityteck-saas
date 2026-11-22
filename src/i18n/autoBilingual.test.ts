import assert from 'node:assert/strict';
import { autoBilingualPair, autoBilingualLabels } from './autoBilingual.ts';

assert.deepEqual(autoBilingualPair('Shop'), { en: 'Shop', ar: 'المتجر' });
assert.deepEqual(autoBilingualPair('المتجر'), { en: 'Shop', ar: 'المتجر' });
assert.deepEqual(autoBilingualPair('Machines'), { en: 'Machines', ar: 'المكائن' });
assert.deepEqual(autoBilingualPair('My Custom Link'), {
  en: 'My Custom Link',
  ar: 'My Custom Link',
});
assert.deepEqual(autoBilingualPair(''), { en: '', ar: '' });
assert.deepEqual(autoBilingualLabels('Home'), { labelEn: 'Home', labelAr: 'الرئيسية' });

console.log('autoBilingual.test.ts: ok');

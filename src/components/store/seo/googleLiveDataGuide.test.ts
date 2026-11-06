import assert from 'node:assert/strict';
import { googleLiveDataGuide, guideLocaleIsClean } from './googleLiveDataGuide.ts';

assert.equal(guideLocaleIsClean(), true);
assert.equal(googleLiveDataGuide.length, 8);
const joined = googleLiveDataGuide.map((row) => `${row.waitEn} ${row.howEn} ${row.waitAr} ${row.howAr}`).join(' ');
assert.equal(/instant|immediately|seamlessly|لحظياً/.test(joined), false);
assert.ok(googleLiveDataGuide.some((row) => row.id === 'console' && /two days/.test(row.waitEn)));
assert.ok(googleLiveDataGuide.some((row) => row.id === 'analytics' && /one to two days/.test(row.waitEn)));
console.log('google live data guide ok');

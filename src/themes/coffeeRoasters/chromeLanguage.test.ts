import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = [
  'src/components/store/visualBuilder',
  'src/components/store/themeCustomizer',
  'src/components/store/themeSettings',
];

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files(path, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(path);
  }
  return out;
}

function shown(text: string): string {
  return text.replace(/\$\{[\s\S]*?\}/g, '');
}

function pairs(source: string): Array<{ ar: string; en: string }> {
  const found: Array<{ ar: string; en: string }> = [];
  const pattern = /isAr\s*\?\s*(['"`])([\s\S]*?)\1\s*:\s*(['"`])([\s\S]*?)\3/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    found.push({ ar: match[2], en: match[4] });
  }
  return found;
}

const mixed: string[] = [];
for (const root of roots) {
  for (const file of files(root)) {
    const source = readFileSync(file, 'utf8');
    for (const pair of pairs(source)) {
      const ar = shown(pair.ar);
      const en = shown(pair.en);
      if (/[\u0600-\u06FF]/.test(ar) && /[A-Za-z]{3,}/.test(ar)) mixed.push(`${file} AR ${pair.ar}`);
      if (/[\u0600-\u06FF]/.test(en)) mixed.push(`${file} EN ${pair.en}`);
    }
  }
}

assert.deepEqual(mixed, []);
console.log('builder and customizer chrome language ok');

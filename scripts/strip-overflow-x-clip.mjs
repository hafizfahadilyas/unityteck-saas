/**
 * Remove overflow-x-clip / contain-inline-size from page shells —
 * those clip Filter Orders and similar dropdowns (CSS overflow coupling).
 */
import fs from 'node:fs';
import path from 'node:path';

const roots = [
  path.resolve('src/components/store'),
  path.resolve('src/components/master'),
  path.resolve('src/notification-system'),
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|jsx)$/.test(name)) out.push(p);
  }
  return out;
}

let files = 0;
let hits = 0;
for (const file of roots.flatMap((r) => walk(r))) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('overflow-x-clip') && !src.includes('contain-inline-size')) continue;
  const next = src
    .replace(/\s*overflow-x-clip\b/g, '')
    .replace(/\s*contain-inline-size\b/g, '');
  if (next !== src) {
    fs.writeFileSync(file, next, 'utf8');
    files += 1;
    hits += 1;
    console.log('stripped', path.relative(process.cwd(), file));
  }
}
console.log(`done: ${files} files cleaned`);

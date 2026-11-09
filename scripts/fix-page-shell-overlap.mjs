/**
 * One-shot: add anti-overlap shell classes to store/master page roots
 * that still use bare p-4/p-6 wrappers (skip AdminPageShell / already patched).
 */
import fs from 'node:fs';
import path from 'node:path';

const roots = [
  path.resolve('src/components/store'),
  path.resolve('src/components/master'),
];

const SHELL =
  'u-page w-full min-w-0 overflow-x-clip contain-inline-size';

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

const reClass = /className=(["'`])([^"'`]*?)\1/g;

let filesChanged = 0;
let replacements = 0;

for (const file of roots.flatMap((r) => walk(r))) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('max-w-[') && !src.includes('mx-auto')) continue;
  if (src.includes('data-page-shell')) continue;

  let changed = false;
  const next = src.replace(reClass, (full, q, cls) => {
    // Only page-like roots: padding + mx-auto + max-w
    const isPageRoot =
      /\b(?:p-4|p-3|p-5|p-6)\b/.test(cls) &&
      /\bmx-auto\b/.test(cls) &&
      /\bmax-w-\[/.test(cls) &&
      /\bspace-y-/.test(cls);
    if (!isPageRoot) return full;
    if (/\bu-page\b/.test(cls) && /\bmin-w-0\b/.test(cls) && /\boverflow-x-clip\b/.test(cls)) {
      return full;
    }
    let patched = cls;
    if (!/\bu-page\b/.test(patched)) patched = `u-page ${patched}`;
    if (!/\bw-full\b/.test(patched)) patched = `${patched} w-full`;
    if (!/\bmin-w-0\b/.test(patched)) patched = `${patched} min-w-0`;
    if (!/\boverflow-x-clip\b/.test(patched)) patched = `${patched} overflow-x-clip`;
    if (!/\bcontain-inline-size\b/.test(patched)) patched = `${patched} contain-inline-size`;
    if (patched === cls) return full;
    changed = true;
    replacements += 1;
    return `className=${q}${patched}${q}`;
  });

  if (changed) {
    fs.writeFileSync(file, next, 'utf8');
    filesChanged += 1;
    console.log('patched', path.relative(process.cwd(), file));
  }
}

console.log(`done: ${filesChanged} files, ${replacements} classNames (+ ${SHELL})`);

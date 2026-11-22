#!/usr/bin/env node
/**
 * Safe bulk replace: UI display ر.س / ternary SAR labels → official U+20C1 (⃁).
 * Does NOT touch ISO currency codes in APIs / JSON-LD / gateways / DB defaults.
 *
 * Usage: node scripts/replace-saudi-riyal-symbol.cjs [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SIGN = '\u20C1';
const OLD_AR = 'ر.س';
const DRY = process.argv.includes('--dry-run');

const EXT_OK = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.php', '.html', '.mdx']);
const SKIP_DIR = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'vendor',
  'coverage',
  '_newfolder_changes_backup',
  'New folder',
  '.deploy-manifests',
]);

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (SKIP_DIR.has(ent.name)) continue;
    if (ent.name.startsWith('.') && ent.name !== '.htaccess') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full, out);
      continue;
    }
    const ext = path.extname(ent.name);
    if (ent.name.endsWith('.blade.php') || EXT_OK.has(ext)) {
      out.push(full);
    }
  }
  return out;
}

function shouldSkipFile(rel) {
  if (rel.includes(`${path.sep}node_modules${path.sep}`)) return true;
  if (rel.endsWith('package-lock.json')) return true;
  if (rel.includes('replace-saudi-riyal-symbol.')) return true;
  return false;
}

function lineAt(content, offset) {
  const lineStart = content.lastIndexOf('\n', offset) + 1;
  const lineEnd = content.indexOf('\n', offset);
  return content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
}

function isIsoProtectedLine(line) {
  return /currency\s*:|priceCurrency|currenciesAccepted|DEFAULT|gateway|moyasar|code\s*:\s*['"]SAR|DisplayCurrency|ISO\s+code|currenciesAccepted/i.test(
    line,
  );
}

/**
 * Replace display currency labels while preserving ISO code assignments.
 */
function transform(content) {
  let next = content;
  let hits = 0;

  // 1) Ternaries: isAr ? 'ر.س' : 'SAR' → SIGN
  const ternaryPatterns = [
    /isAr\s*\?\s*['"]ر\.س['"]\s*:\s*['"]SAR['"]/g,
    /isAr\s*\?\s*['"]SAR['"]\s*:\s*['"]ر\.س['"]/g,
    /locale\s*===\s*['"]ar['"]\s*\?\s*['"]ر\.س['"]\s*:\s*['"]SAR['"]/g,
    /locale\s*===\s*['"]ar['"]\s*\?\s*['"]SAR['"]\s*:\s*['"]ر\.س['"]/g,
    /\(\s*isAr\s*\?\s*['"]ر\.س['"]\s*:\s*['"]SAR['"]\s*\)/g,
  ];
  for (const re of ternaryPatterns) {
    next = next.replace(re, () => {
      hits += 1;
      return `'${SIGN}'`;
    });
  }

  // 2) currencyLabel = isAr ? 'ر.س' : 'SAR'
  next = next.replace(
    /(currencyLabel\s*=\s*)isAr\s*\?\s*['"]ر\.س['"]\s*:\s*['"]SAR['"]/g,
    (_m, p1) => {
      hits += 1;
      return `${p1}'${SIGN}'`;
    },
  );

  // 3) English UI "SAR 180" style
  next = next.replace(/(['"`])SAR\s+(\d+(?:[.,]\d+)?)\1/g, (m, q, num, offset) => {
    if (isIsoProtectedLine(lineAt(next, offset))) return m;
    hits += 1;
    return `${q}${SIGN} ${num}${q}`;
  });

  // `SAR ${price}`
  next = next.replace(/`SAR\s+\$\{/g, (m, offset) => {
    if (isIsoProtectedLine(lineAt(next, offset))) return m;
    hits += 1;
    return '`' + SIGN + ' ${';
  });

  // Trailing "300 SAR" / "${n} SAR" in UI strings
  next = next.replace(/(\d(?:[.,]\d+)?|\})\s+SAR(?=['"`)\s,.!?]|$)/g, (m, head, offset) => {
    const line = lineAt(next, offset);
    if (isIsoProtectedLine(line)) return m;
    if (!/[`'"]/.test(line) && !/\$\{/.test(line)) return m;
    hits += 1;
    return `${head} ${SIGN}`;
  });

  // 4) Plain ر.س
  if (next.includes(OLD_AR)) {
    const count = next.split(OLD_AR).length - 1;
    next = next.split(OLD_AR).join(SIGN);
    hits += count;
  }

  // 5) Comment cleanup
  next = next.replace(
    /Handles SAR \(ر\.س in Arabic, SAR in English\)/,
    `Handles SAR (${SIGN} official symbol AR/EN)`,
  );
  next = next.replace(
    /Handles SAR \(⃁ in Arabic, SAR in English\)/,
    `Handles SAR (${SIGN} official symbol AR/EN)`,
  );

  // 6) UI label suffixes "(SAR)" → "(⃁)" inside quoted strings / template literals
  next = next.replace(/\(SAR\)/g, (m, offset) => {
    const line = lineAt(next, offset);
    if (isIsoProtectedLine(line)) return m;
    // skip pure code comments that document ISO columns
    if (/DEFAULT\s+['"]SAR['"]|VARCHAR|priceCurrency|currenciesAccepted/i.test(line)) return m;
    hits += 1;
    return `(${SIGN})`;
  });

  // 7) Leftover ternaries isAr ? '⃁' : ' SAR' (display-only)
  next = next.replace(/isAr\s*\?\s*['"]⃁['"]\s*:\s*['"]\s*SAR['"]/g, () => {
    hits += 1;
    return `'${SIGN}'`;
  });

  return { next, hits };
}

function hasDisplayMarkers(content) {
  return (
    content.includes(OLD_AR) ||
    /isAr\s*\?\s*['"]ر\.س['"]/.test(content) ||
    /`SAR\s+\$\{/.test(content) ||
    /['"`]SAR\s+\d/.test(content) ||
    /\d\s+SAR['"`)\s,.]/.test(content) ||
    /\}\s+SAR['"`)\s,.]/.test(content) ||
    /\(SAR\)/.test(content) ||
    /isAr\s*\?\s*['"]⃁['"]\s*:\s*['"]\s*SAR['"]/.test(content)
  );
}

function main() {
  const targets = [
    path.join(ROOT, 'src'),
    path.join(ROOT, 'apps', 'api'),
    path.join(ROOT, 'public', 'api'),
    path.join(ROOT, 'tests'),
  ].filter((p) => fs.existsSync(p));

  const files = [];
  for (const t of targets) walk(t, files);

  let changedFiles = 0;
  let totalHits = 0;
  const samples = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (shouldSkipFile(rel)) continue;

    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    if (!hasDisplayMarkers(content)) continue;

    const { next, hits } = transform(content);
    if (hits === 0 || next === content) continue;

    changedFiles += 1;
    totalHits += hits;
    if (samples.length < 30) samples.push({ rel: rel.replace(/\\/g, '/'), hits });

    if (!DRY) {
      fs.writeFileSync(file, next, 'utf8');
    }
  }

  let remaining = 0;
  const remainingFiles = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (shouldSkipFile(rel)) continue;
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const c = DRY ? transform(content).next : fs.readFileSync(file, 'utf8');
    const n = (c.match(/ر\.س/g) || []).length;
    if (n > 0) {
      remaining += n;
      remainingFiles.push({ rel: rel.replace(/\\/g, '/'), n });
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun: DRY,
        changedFiles,
        totalHits,
        remainingRsCount: remaining,
        remainingFiles: remainingFiles.slice(0, 40),
        samples,
      },
      null,
      2,
    ),
  );
}

main();

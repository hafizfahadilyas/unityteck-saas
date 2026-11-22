import fs from 'node:fs';
import path from 'node:path';

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/** Strip balanced `${...}` interpolations. */
function stripTemplates(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '$' && s[i + 1] === '{') {
      let depth = 1;
      i += 2;
      while (i < s.length && depth > 0) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}') depth--;
        i++;
      }
      i--;
      continue;
    }
    out += s[i];
  }
  return out;
}

const roots = [
  'src/components/store/visualBuilder',
  'src/components/store/themeCustomizer',
  'src/components/store/themeSettings/coffee',
];
const files = roots.flatMap((r) => walk(r));
const hits = [];
const re =
  /(?:isAr\s*\?\s*|labelAr:\s*|titleAr:\s*|placeholderAr:\s*|toastAr:\s*|descAr:\s*|nameAr:\s*)['"`]([^'"`]{2,220})['"`]/g;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  const local = new RegExp(re.source, 'g');
  while ((match = local.exec(text))) {
    const raw = match[1];
    // Nested quotes / truncated template capture → skip (false positive)
    if (raw.includes('${') && !/\$\{[^}]*\}/.test(raw) && !raw.includes('}')) continue;
    const s = stripTemplates(raw).trim();
    if (!s) continue;
    if (/[\u0600-\u06FF]/.test(s) && /[A-Za-z]{2,}/.test(s)) {
      hits.push(`${file.replace(/\\/g, '/')}: ${raw}`);
    }
  }
}

console.log(`MIXED_AR_COUNT=${hits.length}`);
hits.forEach((h) => console.log(h));
process.exitCode = hits.length > 0 ? 1 : 0;

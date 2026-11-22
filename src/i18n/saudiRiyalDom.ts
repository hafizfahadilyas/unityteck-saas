/**
 * Replace bare U+20C1 (missing-glyph tofu/bars) with the official SAMA SVG glyph.
 * Covers every store / admin / storefront surface without rewriting price strings.
 */
import { SAUDI_RIYAL_SIGN } from './saudiRiyal';

const SAR_CHAR = SAUDI_RIYAL_SIGN;
const ATTR = 'data-sar-glyph';

const SVG_HTML =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="1em" height="1.12em" aria-hidden="true" focusable="false" style="display:inline-block;vertical-align:-0.15em;fill:currentColor">` +
  `<path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>` +
  `<path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>` +
  `</svg>`;

const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'SVG', 'TITLE']);

function makeGlyph(): HTMLElement {
  const span = document.createElement('span');
  span.setAttribute(ATTR, '1');
  span.setAttribute('aria-hidden', 'true');
  span.className = 'sar-glyph';
  span.style.cssText =
    'display:inline-flex;align-items:center;justify-content:center;width:1em;height:1.12em;line-height:0;vertical-align:-0.15em;flex-shrink:0';
  span.innerHTML = SVG_HTML;
  return span;
}

function replaceInTextNode(node: Text): void {
  const text = node.nodeValue;
  if (!text || !text.includes(SAR_CHAR)) return;
  const parent = node.parentElement;
  if (!parent || parent.closest(`[${ATTR}]`)) return;
  if (SKIP.has(parent.tagName)) return;

  const parts = text.split(SAR_CHAR);
  const frag = document.createDocumentFragment();
  parts.forEach((part, i) => {
    if (part) frag.appendChild(document.createTextNode(part));
    if (i < parts.length - 1) frag.appendChild(makeGlyph());
  });
  parent.replaceChild(frag, node);
}

function walk(root: Node): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let cur = walker.nextNode();
  while (cur) {
    const t = cur as Text;
    if (t.nodeValue && t.nodeValue.includes(SAR_CHAR)) nodes.push(t);
    cur = walker.nextNode();
  }
  for (const n of nodes) replaceInTextNode(n);
}

let scheduled = false;
let observer: MutationObserver | null = null;

function flush(root: ParentNode = document.body): void {
  scheduled = false;
  if (!root) return;
  walk(root);
}

function schedule(root?: ParentNode): void {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => flush(root || document.body));
}

/** Start global U+20C1 → official Riyal SVG glyph replacement. */
export function installSaudiRiyalGlyphDom(target: ParentNode = document.body): () => void {
  if (typeof document === 'undefined' || !target) return () => undefined;
  flush(target);
  if (observer) return () => undefined;

  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
        replaceInTextNode(m.target as Text);
        continue;
      }
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) replaceInTextNode(n as Text);
          else if (n.nodeType === Node.ELEMENT_NODE) {
            const el = n as Element;
            if (el.getAttribute?.(ATTR)) return;
            walk(el);
          }
        });
      }
    }
  });

  observer.observe(target, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  // React commits often finish after microtask — one extra pass
  schedule(target);
  requestAnimationFrame(() => schedule(target));

  return () => {
    observer?.disconnect();
    observer = null;
  };
}

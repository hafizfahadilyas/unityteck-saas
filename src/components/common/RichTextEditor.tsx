import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Code,
  Image as ImageIcon,
  Film,
  Heading,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Minus,
  Table2,
  Columns2,
  Columns3,
  Undo2,
  Redo2,
  IndentIncrease,
  IndentDecrease,
  Highlighter,
  Smile,
  Sparkles,
  Youtube,
  Eraser,
  Type,
} from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';
import type { MediaAsset, MediaType } from '../../types/media';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number | string;
  rows?: number;
  required?: boolean;
  className?: string;
  label?: string;
  requiredMark?: boolean;
  maxLength?: number;
  isAr?: boolean;
  showCodeToggle?: boolean;
  /** Enable H1–H6 / paragraph block styles (SEO structure). Default true. */
  enableHeadings?: boolean;
  /** Enable insert image / video from media library. Default true. */
  enableMedia?: boolean;
  /** Media library folder when inserting images/videos. Default products. */
  mediaFolder?: string;
  /**
   * Full blogger-style toolbar: tables, columns, emoji, icons, alignment,
   * YouTube, highlight, indent, etc. Default false (compact product editor).
   */
  enableAdvanced?: boolean;
}

const BLOCK_OPTIONS = [
  { value: 'p', labelEn: 'Paragraph', labelAr: 'فقرة' },
  { value: 'h1', labelEn: 'Heading 1', labelAr: 'عنوان 1' },
  { value: 'h2', labelEn: 'Heading 2', labelAr: 'عنوان 2' },
  { value: 'h3', labelEn: 'Heading 3', labelAr: 'عنوان 3' },
  { value: 'h4', labelEn: 'Heading 4', labelAr: 'عنوان 4' },
  { value: 'h5', labelEn: 'Heading 5', labelAr: 'عنوان 5' },
  { value: 'h6', labelEn: 'Heading 6', labelAr: 'عنوان 6' },
] as const;

const FONT_SIZES = [
  { value: '1', labelEn: 'Small', labelAr: 'صغير' },
  { value: '3', labelEn: 'Normal', labelAr: 'عادي' },
  { value: '5', labelEn: 'Large', labelAr: 'كبير' },
  { value: '7', labelEn: 'Huge', labelAr: 'ضخم' },
] as const;

const EMOJI_SET = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '🙌', '👍', '👏', '🙏', '💪',
  '🔥', '✨', '⭐', '💯', '🎉', '❤️', '💚', '💙', '🇸🇦', '🌹', '🎁', '📦', '🛒', '💳',
  '🚚', '☕', '🌸', '🏆', '✅', '❌', '⚠️', '📌', '📍', '🔗', '📸', '🎬', '📢', '💡',
];

const ICON_SET: { glyph: string; labelEn: string; labelAr: string }[] = [
  { glyph: '✓', labelEn: 'Check', labelAr: 'صح' },
  { glyph: '★', labelEn: 'Star', labelAr: 'نجمة' },
  { glyph: '♥', labelEn: 'Heart', labelAr: 'قلب' },
  { glyph: '◆', labelEn: 'Diamond', labelAr: 'معين' },
  { glyph: '●', labelEn: 'Bullet', labelAr: 'نقطة' },
  { glyph: '➤', labelEn: 'Arrow', labelAr: 'سهم' },
  { glyph: '✉', labelEn: 'Mail', labelAr: 'بريد' },
  { glyph: '☎', labelEn: 'Phone', labelAr: 'هاتف' },
  { glyph: '⌂', labelEn: 'Home', labelAr: 'منزل' },
  { glyph: '⚙', labelEn: 'Settings', labelAr: 'إعدادات' },
  { glyph: '⚑', labelEn: 'Flag', labelAr: 'علم' },
  { glyph: '☀', labelEn: 'Sun', labelAr: 'شمس' },
  { glyph: '☁', labelEn: 'Cloud', labelAr: 'سحاب' },
  { glyph: '⚡', labelEn: 'Bolt', labelAr: 'برق' },
  { glyph: '☘', labelEn: 'Leaf', labelAr: 'ورقة' },
  { glyph: '✈', labelEn: 'Plane', labelAr: 'طائرة' },
];

const EDITOR_PROSE_CLASS =
  '[&_ul]:list-disc [&_ul]:ps-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:my-1.5 [&_li]:my-0.5 ' +
  '[&_a]:underline [&_a]:font-semibold [&_a]:text-[color:var(--accent,#0d9488)] ' +
  '[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through ' +
  '[&_blockquote]:border-s-4 [&_blockquote]:border-[color:var(--accent)] [&_blockquote]:ps-3 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:opacity-90 ' +
  '[&_h1]:text-2xl [&_h1]:font-black [&_h1]:my-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:my-2 ' +
  '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-1.5 [&_h4]:text-base [&_h4]:font-bold [&_h4]:my-1.5 ' +
  '[&_h5]:text-sm [&_h5]:font-bold [&_h5]:my-1 [&_h6]:text-xs [&_h6]:font-bold [&_h6]:my-1 ' +
  '[&_p]:my-1.5 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_img]:cursor-pointer ' +
  '[&_img.rte-img-selected]:outline [&_img.rte-img-selected]:outline-2 [&_img.rte-img-selected]:outline-[color:var(--accent,#0d9488)] [&_img.rte-img-selected]:outline-offset-2 ' +
  '[&_video]:max-w-full [&_video]:rounded-lg [&_video]:my-2 ' +
  '[&_iframe]:max-w-full [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-lg [&_iframe]:my-2 ' +
  '[&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-50 ' +
  '[&_.rte-cols]:grid [&_.rte-cols]:gap-3 [&_.rte-cols]:my-3 [&_.rte-cols-2]:grid-cols-1 [&_.rte-cols-2]:sm:grid-cols-2 ' +
  '[&_.rte-cols-3]:grid-cols-1 [&_.rte-cols-3]:sm:grid-cols-3 [&_.rte-icon]:inline-block [&_.rte-icon]:mx-0.5 ' +
  '[&_.rte-img-sm]:max-w-[33%] [&_.rte-img-md]:max-w-[55%] [&_.rte-img-full]:max-w-full ' +
  '[&_.rte-media]:relative [&_.rte-media]:inline-block [&_.rte-media]:max-w-full';

function detectBlockTag(node: Node | null, root: HTMLElement): string {
  let el: Element | null =
    node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement || null;
  while (el && el !== root) {
    const tag = el.tagName?.toLowerCase();
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tag)) return tag;
    el = el.parentElement;
  }
  return 'p';
}

function youtubeEmbedUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '').split('?')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split('/');
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`;
      }
      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[shortsIdx + 1]}`;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type PopoverKind = 'emoji' | 'icons' | 'link' | 'table' | 'imgsize' | null;

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write product description...',
  minHeight = 120,
  rows = 4,
  required = false,
  className = '',
  label,
  requiredMark = false,
  maxLength,
  isAr = false,
  showCodeToggle = true,
  enableHeadings = true,
  enableMedia = true,
  mediaFolder = 'products',
  enableAdvanced = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    bulletList: false,
    orderedList: false,
    link: false,
  });
  const [blockTag, setBlockTag] = useState('p');
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceCode, setSourceCode] = useState(value || '');
  const [charCount, setCharCount] = useState(0);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTypes, setMediaPickerTypes] = useState<MediaType[]>(['image', 'gif', 'svg']);
  const [mediaInsertMode, setMediaInsertMode] = useState<'image' | 'video'>('image');
  const [pendingImageUrl, setPendingImageUrl] = useState<{ url: string; alt: string } | null>(null);
  const [popover, setPopover] = useState<PopoverKind>(null);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('https://');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  /** Mouse-resize: selected image + overlay frame inside the editor wrap. */
  const selectedImgRef = useRef<HTMLImageElement | null>(null);
  const [imgFrame, setImgFrame] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const resizeDragRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    ratio: number;
    corner: 'se' | 'sw' | 'ne' | 'nw';
  } | null>(null);
  const [isResizingImg, setIsResizingImg] = useState(false);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html);
    setSourceCode(html);
    setCharCount((editorRef.current.innerText || '').trim().length);
  }, [onChange]);

  const clearImgSelection = useCallback(() => {
    const prev = selectedImgRef.current;
    if (prev) prev.classList.remove('rte-img-selected');
    selectedImgRef.current = null;
    setImgFrame(null);
  }, []);

  const refreshImgFrame = useCallback(() => {
    const img = selectedImgRef.current;
    const editor = editorRef.current;
    if (!img || !editor || !editor.contains(img)) {
      clearImgSelection();
      return;
    }
    const ir = img.getBoundingClientRect();
    const er = editor.getBoundingClientRect();
    // Overlay sits outside the scrolling editor — use viewport delta only (no scrollTop).
    setImgFrame({
      top: ir.top - er.top,
      left: ir.left - er.left,
      width: ir.width,
      height: ir.height,
    });
  }, [clearImgSelection]);

  const selectImg = useCallback(
    (img: HTMLImageElement) => {
      if (selectedImgRef.current && selectedImgRef.current !== img) {
        selectedImgRef.current.classList.remove('rte-img-selected');
      }
      selectedImgRef.current = img;
      img.classList.add('rte-img-selected');
      img.setAttribute('draggable', 'false');
      refreshImgFrame();
    },
    [refreshImgFrame],
  );

  const applyImgWidth = useCallback((img: HTMLImageElement, widthPx: number) => {
    const editor = editorRef.current;
    const maxW = Math.max(120, (editor?.clientWidth || 480) - 24);
    const w = Math.round(Math.min(maxW, Math.max(64, widthPx)));
    img.style.width = `${w}px`;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.removeAttribute('width');
    img.removeAttribute('height');
    img.classList.remove('rte-img-sm', 'rte-img-md', 'rte-img-full');
  }, []);

  const updateToolbarStatus = useCallback(() => {
    if (!editorRef.current || isSourceMode) return;
    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const anchorNode = sel.anchorNode;
      if (!anchorNode || !editorRef.current.contains(anchorNode)) return;

      const el =
        anchorNode.nodeType === Node.ELEMENT_NODE
          ? (anchorNode as Element)
          : anchorNode.parentElement;

      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        bulletList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
        link: !!el?.closest('a'),
      });
      setBlockTag(detectBlockTag(anchorNode, editorRef.current));
      setCharCount((editorRef.current.innerText || '').trim().length);
    } catch {
      /* quiet */
    }
  }, [isSourceMode]);

  useEffect(() => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const incoming = value || '';
    setSourceCode(incoming);
    if (currentHtml === incoming) {
      setCharCount((editorRef.current.innerText || '').trim().length);
      return;
    }
    if (incoming && !/<[a-z][\s\S]*>/i.test(incoming) && incoming.includes('\n')) {
      editorRef.current.innerHTML = incoming
        .split('\n\n')
        .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
        .join('');
    } else {
      editorRef.current.innerHTML = incoming;
    }
    selectedImgRef.current = null;
    setImgFrame(null);
    setCharCount((editorRef.current.innerText || '').trim().length);
  }, [value]);

  useEffect(() => {
    const handleSelectionChange = () => updateToolbarStatus();
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [updateToolbarStatus]);

  useEffect(() => {
    if (!imgFrame) return;
    const editor = editorRef.current;
    if (!editor) return;
    const onScrollOrResize = () => refreshImgFrame();
    editor.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      editor.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [imgFrame, refreshImgFrame]);

  useEffect(() => {
    if (isSourceMode) clearImgSelection();
  }, [isSourceMode, clearImgSelection]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = resizeDragRef.current;
      const img = selectedImgRef.current;
      if (!drag || !img) return;
      e.preventDefault();
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      let nextW = drag.startW;
      if (drag.corner === 'se' || drag.corner === 'ne') {
        nextW = drag.startW + dx;
      } else {
        nextW = drag.startW - dx;
      }
      // Prefer width-driven resize; if vertical drag dominates, derive from height.
      if (Math.abs(dy) > Math.abs(dx) * 1.25 && drag.ratio > 0) {
        let nextH = drag.startH;
        if (drag.corner === 'se' || drag.corner === 'sw') nextH = drag.startH + dy;
        else nextH = drag.startH - dy;
        nextW = nextH * drag.ratio;
      }
      applyImgWidth(img, nextW);
      refreshImgFrame();
    };
    const onUp = () => {
      if (!resizeDragRef.current) return;
      resizeDragRef.current = null;
      setIsResizingImg(false);
      emitChange();
      refreshImgFrame();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [applyImgWidth, emitChange, refreshImgFrame]);

  const execCmd = (command: string, arg?: string) => {
    if (isSourceMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
    updateToolbarStatus();
  };

  const insertHtml = (html: string) => {
    if (isSourceMode) return;
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    emitChange();
    updateToolbarStatus();
  };

  const applyBlockFormat = (tag: string) => {
    if (isSourceMode) return;
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag === 'p' ? 'p' : tag);
    setBlockTag(tag);
    emitChange();
    updateToolbarStatus();
  };

  const openLinkPopover = () => {
    if (isSourceMode) return;
    if (activeFormats.link) {
      execCmd('unlink');
      return;
    }
    const sel = window.getSelection();
    const selectedText = sel?.toString() || '';
    setLinkText(selectedText);
    setLinkUrl('https://');
    setPopover(popover === 'link' ? null : 'link');
  };

  const applyLink = () => {
    const urlRaw = linkUrl.trim();
    if (!urlRaw || urlRaw === 'https://') {
      setPopover(null);
      return;
    }
    const validUrl =
      urlRaw.startsWith('http') || urlRaw.startsWith('mailto:') || urlRaw.startsWith('tel:') || urlRaw.startsWith('/')
        ? urlRaw
        : `https://${urlRaw}`;
    const text = (linkText.trim() || validUrl).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && !linkText.trim()) {
      execCmd('createLink', validUrl);
      // ensure target blank on created link
      const anchor = editorRef.current?.querySelector(`a[href="${validUrl}"]`);
      if (anchor) {
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
        emitChange();
      }
    } else {
      insertHtml(
        `<a href="${escapeAttr(validUrl)}" target="_blank" rel="noopener noreferrer">${text}</a>`,
      );
    }
    setPopover(null);
  };

  const openMediaPicker = (mode: 'image' | 'video') => {
    if (isSourceMode) return;
    setMediaInsertMode(mode);
    setMediaPickerTypes(mode === 'video' ? ['video'] : ['image', 'gif', 'svg']);
    setMediaPickerOpen(true);
  };

  const insertImageWithSize = (url: string, alt: string, size: 'full' | 'md' | 'sm') => {
    const sizeClass = size === 'sm' ? 'rte-img-sm' : size === 'md' ? 'rte-img-md' : 'rte-img-full';
    insertHtml(
      `<figure class="rte-media"><img class="${sizeClass}" src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" loading="lazy" draggable="false" /></figure><p></p>`,
    );
    setPendingImageUrl(null);
    setPopover(null);
  };

  const beginImgResize = (
    e: React.MouseEvent,
    corner: 'se' | 'sw' | 'ne' | 'nw',
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const img = selectedImgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const ratio = rect.height > 0 ? rect.width / rect.height : 1;
    resizeDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: rect.width,
      startH: rect.height,
      ratio,
      corner,
    };
    setIsResizingImg(true);
  };

  const handleEditorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.rte-img-resize-overlay')) return;
    if (target.tagName === 'IMG') {
      e.preventDefault();
      selectImg(target as HTMLImageElement);
      return;
    }
    clearImgSelection();
  };

  const handleMediaSelect = (selected: MediaAsset | MediaAsset[]) => {
    const asset = Array.isArray(selected) ? selected[0] : selected;
    setMediaPickerOpen(false);
    if (!asset) return;
    const url =
      asset.optimizedUrl || asset.webpUrl || asset.originalUrl || asset.thumbnailUrl || '';
    if (!url) return;
    const alt = asset.altText || asset.title || asset.fileName || 'Media';

    if (
      mediaInsertMode === 'image' ||
      asset.fileType === 'image' ||
      asset.fileType === 'gif' ||
      asset.fileType === 'svg'
    ) {
      if (enableAdvanced) {
        setPendingImageUrl({ url, alt });
        setPopover('imgsize');
        return;
      }
      insertImageWithSize(url, alt, 'full');
      return;
    }

    insertHtml(
      `<figure class="rte-media"><video src="${escapeAttr(url)}" controls playsinline preload="metadata"></video></figure><p></p>`,
    );
  };

  const handleYoutube = () => {
    if (isSourceMode) return;
    const raw = window.prompt(
      isAr ? 'أدخل رابط يوتيوب:' : 'Enter YouTube URL:',
      'https://',
    );
    if (!raw?.trim() || raw.trim() === 'https://') return;
    const yt = youtubeEmbedUrl(raw.trim());
    if (!yt) {
      window.alert(isAr ? 'رابط يوتيوب غير صالح' : 'Invalid YouTube URL');
      return;
    }
    insertHtml(
      `<figure class="rte-media"><iframe src="${yt}" title="YouTube" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></figure><p></p>`,
    );
  };

  const handleVideoUrl = () => {
    if (isSourceMode) return;
    const raw = window.prompt(
      isAr ? 'أدخل رابط فيديو (ملف مباشر):' : 'Enter direct video URL (MP4 / WebM):',
      'https://',
    );
    if (!raw?.trim() || raw.trim() === 'https://') return;
    const url = raw.trim();
    const yt = youtubeEmbedUrl(url);
    if (yt) {
      insertHtml(
        `<figure class="rte-media"><iframe src="${yt}" title="Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></figure><p></p>`,
      );
      return;
    }
    insertHtml(
      `<figure class="rte-media"><video src="${escapeAttr(url)}" controls playsinline preload="metadata"></video></figure><p></p>`,
    );
  };

  const insertTable = () => {
    const r = Math.min(10, Math.max(1, tableRows));
    const c = Math.min(8, Math.max(1, tableCols));
    let html = '<table class="rte-table"><tbody>';
    for (let i = 0; i < r; i++) {
      html += '<tr>';
      for (let j = 0; j < c; j++) {
        const cell = i === 0 ? 'th' : 'td';
        html += `<${cell}>&nbsp;</${cell}>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table><p></p>';
    insertHtml(html);
    setPopover(null);
  };

  const insertColumns = (n: 2 | 3) => {
    const cols = Array.from({ length: n }, (_, i) => {
      const sample = isAr
        ? `<p>عمود ${i + 1} — اكتب هنا…</p>`
        : `<p>Column ${i + 1} — write here…</p>`;
      return `<div>${sample}</div>`;
    }).join('');
    insertHtml(`<div class="rte-cols rte-cols-${n}">${cols}</div><p></p>`);
  };

  const handleInput = () => {
    emitChange();
    updateToolbarStatus();
  };

  const handleSourceCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setSourceCode(newCode);
    onChange(newCode);
    if (editorRef.current) editorRef.current.innerHTML = newCode;
    setCharCount(newCode.replace(/<[^>]*>/g, '').trim().length);
  };

  const toggleSourceMode = () => {
    if (!isSourceMode && editorRef.current) {
      setSourceCode(editorRef.current.innerHTML);
    } else if (isSourceMode && editorRef.current) {
      editorRef.current.innerHTML = sourceCode;
      onChange(sourceCode);
    }
    setIsSourceMode(!isSourceMode);
    setPopover(null);
  };

  const btnClass = (active: boolean) =>
    `p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
      active
        ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-extrabold shadow-2xs'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
    }`;

  const Divider = () => (
    <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-0.5 shrink-0" />
  );

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
          {label} {requiredMark && <span className="text-rose-500">*</span>}
          {required && !requiredMark && <span className="sr-only">required</span>}
        </label>
      )}

      <div
        className="rounded-xl border bg-white dark:bg-[#071E26] shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/30 transition-all relative"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Toolbar */}
        <div
          className="flex items-start justify-between gap-1 p-1.5 border-b bg-slate-50/90 dark:bg-slate-900/60 select-none"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-0.5 flex-wrap flex-1 min-w-0">
            {enableAdvanced && (
              <>
                <button
                  type="button"
                  title={isAr ? 'تراجع' : 'Undo'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execCmd('undo');
                  }}
                  className={btnClass(false)}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'إعادة' : 'Redo'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execCmd('redo');
                  }}
                  className={btnClass(false)}
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <Divider />
              </>
            )}

            {enableHeadings && (
              <>
                <div className="relative flex items-center gap-0.5">
                  <Heading className="w-3.5 h-3.5 text-slate-400 ms-0.5 shrink-0" />
                  <select
                    value={blockTag}
                    disabled={isSourceMode}
                    onChange={(e) => applyBlockFormat(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={isAr ? 'نمط الفقرة / العناوين' : 'Paragraph / Heading'}
                    className="h-7 max-w-[7.5rem] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-bold px-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
                    style={{ color: 'var(--input-fg)' }}
                  >
                    {BLOCK_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isAr ? opt.labelAr : opt.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
                {enableAdvanced && (
                  <select
                    disabled={isSourceMode}
                    defaultValue="3"
                    onChange={(e) => execCmd('fontSize', e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={isAr ? 'حجم الخط' : 'Font size'}
                    className="h-7 max-w-[5.5rem] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-bold px-1 cursor-pointer"
                    style={{ color: 'var(--input-fg)' }}
                  >
                    {FONT_SIZES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {isAr ? s.labelAr : s.labelEn}
                      </option>
                    ))}
                  </select>
                )}
                <Divider />
              </>
            )}

            <button
              type="button"
              title={isAr ? 'عريض' : 'Bold'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('bold');
              }}
              className={btnClass(activeFormats.bold)}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title={isAr ? 'مائل' : 'Italic'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('italic');
              }}
              className={btnClass(activeFormats.italic)}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title={isAr ? 'تسطير' : 'Underline'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('underline');
              }}
              className={btnClass(activeFormats.underline)}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            {enableAdvanced && (
              <button
                type="button"
                title={isAr ? 'يتوسطه خط' : 'Strikethrough'}
                onMouseDown={(e) => {
                  e.preventDefault();
                  execCmd('strikeThrough');
                }}
                className={btnClass(activeFormats.strike)}
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
            )}

            <label
              className="relative inline-flex items-center justify-center p-1.5 rounded-lg cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800"
              title={isAr ? 'لون الخط' : 'Text color'}
            >
              <Type className="w-3.5 h-3.5" />
              <span className="absolute bottom-1 start-1.5 end-1.5 h-0.5 rounded-full bg-rose-500" />
              <input
                type="color"
                disabled={isSourceMode}
                defaultValue="#0f172a"
                onChange={(e) => execCmd('foreColor', e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label={isAr ? 'لون الخط' : 'Text color'}
              />
            </label>

            {enableAdvanced && (
              <label
                className="relative inline-flex items-center justify-center p-1.5 rounded-lg cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                title={isAr ? 'تظليل' : 'Highlight'}
              >
                <Highlighter className="w-3.5 h-3.5" />
                <input
                  type="color"
                  disabled={isSourceMode}
                  defaultValue="#fef08a"
                  onChange={(e) => execCmd('hiliteColor', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label={isAr ? 'تظليل' : 'Highlight'}
                />
              </label>
            )}

            <Divider />

            {/* Alignment */}
            {enableAdvanced && (
              <>
                <button
                  type="button"
                  title={isAr ? 'محاذاة لليسار' : 'Align left'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execCmd('justifyLeft');
                  }}
                  className={btnClass(false)}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'توسيط' : 'Align center'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execCmd('justifyCenter');
                  }}
                  className={btnClass(false)}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'محاذاة لليمين' : 'Align right'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execCmd('justifyRight');
                  }}
                  className={btnClass(false)}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'ضبط كامل' : 'Justify'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execCmd('justifyFull');
                  }}
                  className={btnClass(false)}
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
                <Divider />
                <button
                  type="button"
                  title={isAr ? 'زيادة المسافة البادئة' : 'Indent'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execCmd('indent');
                  }}
                  className={btnClass(false)}
                >
                  <IndentIncrease className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'تقليل المسافة البادئة' : 'Outdent'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execCmd('outdent');
                  }}
                  className={btnClass(false)}
                >
                  <IndentDecrease className="w-3.5 h-3.5" />
                </button>
                <Divider />
              </>
            )}

            <button
              type="button"
              title={isAr ? 'قائمة نقطية' : 'Bullet list'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('insertUnorderedList');
              }}
              className={btnClass(activeFormats.bulletList)}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title={isAr ? 'قائمة مرقمة' : 'Numbered list'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('insertOrderedList');
              }}
              className={btnClass(activeFormats.orderedList)}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            {enableAdvanced && (
              <>
                <button
                  type="button"
                  title={isAr ? 'اقتباس' : 'Blockquote'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyBlockFormat('blockquote');
                  }}
                  className={btnClass(false)}
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'خط فاصل' : 'Horizontal line'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertHtml('<hr /><p></p>');
                  }}
                  className={btnClass(false)}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              title={isAr ? 'إدراج رابط (عربي / إنجليزي)' : 'Insert link (AR / EN text)'}
              onMouseDown={(e) => {
                e.preventDefault();
                if (enableAdvanced) openLinkPopover();
                else {
                  const url = window.prompt(isAr ? 'أدخل الرابط:' : 'Enter Link URL:', 'https://');
                  if (url?.trim() && url.trim() !== 'https://') {
                    const valid =
                      url.trim().startsWith('http') || url.trim().startsWith('/')
                        ? url.trim()
                        : `https://${url.trim()}`;
                    execCmd('createLink', valid);
                  }
                }
              }}
              className={btnClass(activeFormats.link || popover === 'link')}
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>

            {enableAdvanced && (
              <>
                <Divider />
                <button
                  type="button"
                  title={isAr ? 'جدول' : 'Insert table'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setPopover(popover === 'table' ? null : 'table');
                  }}
                  className={btnClass(popover === 'table')}
                >
                  <Table2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'تخطيط عمودين' : '2-column layout'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertColumns(2);
                  }}
                  className={btnClass(false)}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'تخطيط ثلاثة أعمدة (مضغوط)' : '3-column compact layout'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertColumns(3);
                  }}
                  className={btnClass(false)}
                >
                  <Columns3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'إيموجي' : 'Emoji'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setPopover(popover === 'emoji' ? null : 'emoji');
                  }}
                  className={btnClass(popover === 'emoji')}
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'أيقونات' : 'Icons'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setPopover(popover === 'icons' ? null : 'icons');
                  }}
                  className={btnClass(popover === 'icons')}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'مسح التنسيق' : 'Clear formatting'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execCmd('removeFormat');
                  }}
                  className={btnClass(false)}
                >
                  <Eraser className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {enableMedia && (
              <>
                <Divider />
                <button
                  type="button"
                  title={isAr ? 'رفع / إدراج صورة' : 'Upload / insert image'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    openMediaPicker('image');
                  }}
                  className={btnClass(false)}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'رفع فيديو من المكتبة' : 'Upload video from library'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    openMediaPicker('video');
                  }}
                  className={btnClass(false)}
                >
                  <Film className="w-3.5 h-3.5" />
                </button>
                {enableAdvanced ? (
                  <>
                    <button
                      type="button"
                      title={isAr ? 'فيديو يوتيوب' : 'YouTube video'}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleYoutube();
                      }}
                      className={btnClass(false)}
                    >
                      <Youtube className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title={isAr ? 'رابط فيديو عادي' : 'Direct video URL'}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleVideoUrl();
                      }}
                      className={`${btnClass(false)} text-[9px] font-bold px-1.5 gap-0.5`}
                    >
                      <Film className="w-3 h-3" />
                      {isAr ? 'رابط' : 'URL'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    title={isAr ? 'إدراج رابط فيديو' : 'Insert video URL'}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleVideoUrl();
                    }}
                    className={`${btnClass(false)} text-[9px] font-bold px-1.5 gap-0.5 hidden sm:flex`}
                  >
                    <Film className="w-3 h-3" />
                    {isAr ? 'رابط' : 'URL'}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
            {maxLength && (
              <span className="font-mono">
                {charCount}/{maxLength}
              </span>
            )}
            {showCodeToggle && (
              <button
                type="button"
                onClick={toggleSourceMode}
                title={isSourceMode ? (isAr ? 'عرض منسق' : 'Visual') : isAr ? 'كود HTML' : 'HTML code'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  isSourceMode
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">
                  {isSourceMode ? (isAr ? 'تنسيق' : 'Visual') : isAr ? 'كود' : 'Code'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Popovers */}
        {popover === 'emoji' && (
          <div
            className="absolute z-20 mt-0 start-2 end-2 sm:end-auto sm:max-w-sm p-2 rounded-xl border shadow-lg grid grid-cols-8 gap-1"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', top: '3rem' }}
          >
            {EMOJI_SET.map((em) => (
              <button
                key={em}
                type="button"
                className="text-lg p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertHtml(em);
                  setPopover(null);
                }}
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {popover === 'icons' && (
          <div
            className="absolute z-20 mt-0 start-2 p-2 rounded-xl border shadow-lg grid grid-cols-4 gap-1 min-w-[220px]"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', top: '3rem' }}
          >
            {ICON_SET.map((ic) => (
              <button
                key={ic.glyph}
                type="button"
                title={isAr ? ic.labelAr : ic.labelEn}
                className="text-base p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertHtml(`<span class="rte-icon" aria-hidden="true">${ic.glyph}</span>`);
                  setPopover(null);
                }}
              >
                {ic.glyph}
              </button>
            ))}
          </div>
        )}

        {popover === 'link' && (
          <div
            className="absolute z-20 start-2 end-2 sm:end-auto sm:w-80 p-3 rounded-xl border shadow-lg space-y-2"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', top: '3rem' }}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <p className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'رابط (نص عربي أو إنجليزي + عنوان الرابط)' : 'Link (Arabic or English text + URL)'}
            </p>
            <input
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder={isAr ? 'نص الرابط (عربي / إنجليزي)' : 'Link text (AR / EN)'}
              className="w-full rounded-lg border px-2 py-1.5 text-xs"
              style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
              dir="auto"
            />
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              className="w-full rounded-lg border px-2 py-1.5 text-xs"
              style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
              dir="ltr"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-2 py-1 text-xs rounded-lg border"
                style={{ borderColor: 'var(--border)' }}
                onClick={() => setPopover(null)}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="button" className="unity-btn-primary px-3 py-1 text-xs rounded-lg font-bold" onClick={applyLink}>
                {isAr ? 'إدراج' : 'Insert'}
              </button>
            </div>
          </div>
        )}

        {popover === 'table' && (
          <div
            className="absolute z-20 start-2 p-3 rounded-xl border shadow-lg space-y-2 w-56"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', top: '3rem' }}
          >
            <p className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'إدراج جدول' : 'Insert table'}
            </p>
            <label className="flex items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--muted)' }}>
              {isAr ? 'صفوف' : 'Rows'}
              <input
                type="number"
                min={1}
                max={10}
                value={tableRows}
                onChange={(e) => setTableRows(Number(e.target.value) || 3)}
                className="w-16 rounded border px-1 py-0.5 text-xs"
                style={{ borderColor: 'var(--border)' }}
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--muted)' }}>
              {isAr ? 'أعمدة' : 'Columns'}
              <input
                type="number"
                min={1}
                max={8}
                value={tableCols}
                onChange={(e) => setTableCols(Number(e.target.value) || 3)}
                className="w-16 rounded border px-1 py-0.5 text-xs"
                style={{ borderColor: 'var(--border)' }}
              />
            </label>
            <button type="button" className="unity-btn-primary w-full py-1.5 text-xs rounded-lg font-bold" onClick={insertTable}>
              {isAr ? 'إدراج الجدول' : 'Insert table'}
            </button>
          </div>
        )}

        {popover === 'imgsize' && pendingImageUrl && (
          <div
            className="absolute z-20 start-2 p-3 rounded-xl border shadow-lg space-y-2 w-64"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', top: '3rem' }}
          >
            <p className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'حجم الصورة / تخطيط مضغوط' : 'Image size / compact layout'}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'full' as const, label: isAr ? 'كامل' : 'Full' },
                  { id: 'md' as const, label: isAr ? 'متوسط' : 'Medium' },
                  { id: 'sm' as const, label: isAr ? 'مضغوط' : 'Compact' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="unity-btn-primary py-1.5 text-[10px] rounded-lg font-bold"
                  onClick={() => insertImageWithSize(pendingImageUrl.url, pendingImageUrl.alt, opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="text-[10px] underline"
              style={{ color: 'var(--muted)' }}
              onClick={() => {
                setPendingImageUrl(null);
                setPopover(null);
              }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        )}

        {isSourceMode ? (
          <textarea
            value={sourceCode}
            onChange={handleSourceCodeChange}
            rows={rows}
            className="w-full p-3.5 text-xs font-mono leading-relaxed bg-slate-900 text-emerald-400 focus:outline-none resize-y"
            style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
            placeholder="<p>Enter HTML code...</p>"
          />
        ) : (
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyUp={updateToolbarStatus}
              onMouseUp={updateToolbarStatus}
              onMouseDown={handleEditorMouseDown}
              onClick={() => {
                if (popover && popover !== 'imgsize') setPopover(null);
              }}
              dir="auto"
              data-placeholder={placeholder}
              className={`w-full p-3.5 text-xs focus:outline-none leading-relaxed overflow-y-auto cursor-text ${
                charCount === 0 ? 'empty-editor' : ''
              } ${EDITOR_PROSE_CLASS} ${isResizingImg ? 'select-none' : ''}`}
              style={{
                minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
                maxHeight: enableAdvanced ? '640px' : '480px',
                resize: 'vertical',
                overflow: 'auto',
                background: 'var(--input-bg, #ffffff)',
                color: 'var(--input-fg, #0f172a)',
              }}
            />
            {charCount === 0 && (
              <div
                onClick={() => editorRef.current?.focus()}
                className="absolute top-3.5 start-3.5 text-slate-400 text-xs pointer-events-none select-none"
              >
                {placeholder}
              </div>
            )}
            {imgFrame && !isSourceMode && (
              <div
                className="rte-img-resize-overlay pointer-events-none absolute z-10"
                style={{
                  top: imgFrame.top,
                  left: imgFrame.left,
                  width: imgFrame.width,
                  height: imgFrame.height,
                }}
                aria-hidden
              >
                <div
                  className="absolute inset-0 rounded-lg border-2 pointer-events-none"
                  style={{ borderColor: 'var(--accent, #0d9488)' }}
                />
                {(
                  [
                    { corner: 'nw' as const, style: { top: -5, left: -5, cursor: 'nwse-resize' } },
                    { corner: 'ne' as const, style: { top: -5, right: -5, cursor: 'nesw-resize' } },
                    { corner: 'sw' as const, style: { bottom: -5, left: -5, cursor: 'nesw-resize' } },
                    { corner: 'se' as const, style: { bottom: -5, right: -5, cursor: 'nwse-resize' } },
                  ] as const
                ).map((h) => (
                  <button
                    key={h.corner}
                    type="button"
                    className="pointer-events-auto absolute w-3 h-3 rounded-sm border-2 shadow-sm p-0"
                    style={{
                      ...h.style,
                      background: '#fff',
                      borderColor: 'var(--accent, #0d9488)',
                    }}
                    title={isAr ? 'اسحب لتغيير الحجم' : 'Drag to resize'}
                    onMouseDown={(ev) => beginImgResize(ev, h.corner)}
                  />
                ))}
                <div
                  className="pointer-events-none absolute -top-6 start-0 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap"
                  style={{
                    background: 'var(--accent, #0d9488)',
                    color: '#fff',
                  }}
                >
                  {isAr
                    ? `${Math.round(imgFrame.width)} بكسل — اسحب الزاوية`
                    : `${Math.round(imgFrame.width)}px — drag corner`}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {enableMedia && (
        <MediaPickerModal
          isOpen={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={handleMediaSelect}
          multiple={false}
          allowedTypes={mediaPickerTypes}
          title={
            mediaInsertMode === 'video'
              ? isAr
                ? 'اختر فيديو للمحتوى'
                : 'Select video for content'
              : isAr
                ? 'اختر صورة للمحتوى'
                : 'Select image for content'
          }
          initialFolder={mediaFolder}
        />
      )}
    </div>
  );
};

/** Shared prose classes for storefront product description HTML */
export const PRODUCT_DESCRIPTION_PROSE_CLASS =
  'rich-text-content leading-relaxed ' +
  '[&_ul]:list-disc [&_ul]:ps-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:my-2 ' +
  '[&_a]:text-emerald-600 [&_a]:underline [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_u]:underline ' +
  '[&_h1]:text-2xl [&_h1]:font-black [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:my-2.5 ' +
  '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_h4]:text-base [&_h4]:font-bold [&_h4]:my-2 ' +
  '[&_h5]:text-sm [&_h5]:font-bold [&_h5]:my-1.5 [&_h6]:text-xs [&_h6]:font-bold [&_h6]:my-1.5 ' +
  '[&_p]:my-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-3 [&_video]:max-w-full [&_video]:rounded-xl [&_video]:my-3 ' +
  '[&_iframe]:max-w-full [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-3 [&_figure]:my-3 ' +
  '[&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 ' +
  '[&_.rte-cols]:grid [&_.rte-cols]:gap-4 [&_.rte-cols-2]:sm:grid-cols-2 [&_.rte-cols-3]:sm:grid-cols-3 ' +
  '[&_.rte-img-sm]:max-w-[33%] [&_.rte-img-md]:max-w-[55%] [&_.rte-img-full]:max-w-full';

export function looksLikeHtml(value?: string | null): boolean {
  return !!value && /<[a-z][\s\S]*>/i.test(value);
}

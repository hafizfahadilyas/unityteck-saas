import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Code,
  Image as ImageIcon,
  Film,
  Heading,
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

const EDITOR_PROSE_CLASS =
  '[&_ul]:list-disc [&_ul]:ps-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:my-1.5 [&_li]:my-0.5 ' +
  '[&_a]:text-blue-600 [&_a]:underline [&_a]:font-semibold [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline ' +
  '[&_h1]:text-2xl [&_h1]:font-black [&_h1]:my-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:my-2 ' +
  '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-1.5 [&_h4]:text-base [&_h4]:font-bold [&_h4]:my-1.5 ' +
  '[&_h5]:text-sm [&_h5]:font-bold [&_h5]:my-1 [&_h6]:text-xs [&_h6]:font-bold [&_h6]:my-1 ' +
  '[&_p]:my-1.5 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_video]:max-w-full [&_video]:rounded-lg [&_video]:my-2 ' +
  '[&_iframe]:max-w-full [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-lg [&_iframe]:my-2';

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
      const id = u.pathname.replace('/', '');
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
    }
  } catch {
    /* ignore */
  }
  return null;
}

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
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
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

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html);
    setSourceCode(html);
    setCharCount((editorRef.current.innerText || '').trim().length);
  }, [onChange]);

  const updateToolbarStatus = useCallback(() => {
    if (!editorRef.current || isSourceMode) return;

    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const anchorNode = sel.anchorNode;
      if (!anchorNode || !editorRef.current.contains(anchorNode)) return;

      const isB = document.queryCommandState('bold');
      const isI = document.queryCommandState('italic');
      const isU = document.queryCommandState('underline');
      const isUl = document.queryCommandState('insertUnorderedList');
      const isOl = document.queryCommandState('insertOrderedList');

      const el =
        anchorNode.nodeType === Node.ELEMENT_NODE
          ? (anchorNode as Element)
          : anchorNode.parentElement;
      const isL = !!el?.closest('a');

      setActiveFormats({
        bold: isB,
        italic: isI,
        underline: isU,
        bulletList: isUl,
        orderedList: isOl,
        link: isL,
      });
      setBlockTag(detectBlockTag(anchorNode, editorRef.current));

      const text = editorRef.current.innerText || '';
      setCharCount(text.trim().length);
    } catch {
      // quiet catch on queryCommandState in rare browser edge-cases
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
      const paragraphs = incoming
        .split('\n\n')
        .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
        .join('');
      editorRef.current.innerHTML = paragraphs;
    } else {
      editorRef.current.innerHTML = incoming;
    }

    setCharCount((editorRef.current.innerText || '').trim().length);
  }, [value]);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateToolbarStatus();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateToolbarStatus]);

  const execCmd = (command: string, arg?: string) => {
    if (isSourceMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    emitChange();
    updateToolbarStatus();
  };

  const applyBlockFormat = (tag: string) => {
    if (isSourceMode) return;
    editorRef.current?.focus();
    // formatBlock expects angle-bracketed tag in most browsers
    document.execCommand('formatBlock', false, tag === 'p' ? 'p' : tag);
    setBlockTag(tag);
    emitChange();
    updateToolbarStatus();
  };

  const handleLink = () => {
    if (isSourceMode) return;
    if (activeFormats.link) {
      execCmd('unlink');
      return;
    }

    const currentSel = window.getSelection();
    const defaultUrl = 'https://';
    const url = window.prompt(isAr ? 'أدخل الرابط:' : 'Enter Link URL:', defaultUrl);

    if (url && url.trim() && url.trim() !== defaultUrl) {
      const validUrl =
        url.trim().startsWith('http') ||
        url.trim().startsWith('mailto:') ||
        url.trim().startsWith('tel:')
          ? url.trim()
          : `https://${url.trim()}`;

      if (currentSel && currentSel.isCollapsed) {
        execCmd(
          'insertHTML',
          `<a href="${validUrl}" target="_blank" rel="noopener noreferrer">${validUrl}</a>`,
        );
      } else {
        execCmd('createLink', validUrl);
      }
    }
  };

  const openMediaPicker = (mode: 'image' | 'video') => {
    if (isSourceMode) return;
    setMediaInsertMode(mode);
    setMediaPickerTypes(mode === 'video' ? ['video'] : ['image', 'gif', 'svg']);
    setMediaPickerOpen(true);
  };

  const insertMediaHtml = (html: string) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    emitChange();
    updateToolbarStatus();
  };

  const handleMediaSelect = (selected: MediaAsset | MediaAsset[]) => {
    const asset = Array.isArray(selected) ? selected[0] : selected;
    setMediaPickerOpen(false);
    if (!asset) return;

    const url =
      asset.optimizedUrl ||
      asset.webpUrl ||
      asset.originalUrl ||
      asset.thumbnailUrl ||
      '';
    if (!url) return;

    const alt = (asset.altText || asset.title || asset.fileName || 'Product media').replace(
      /"/g,
      '&quot;',
    );

    if (
      mediaInsertMode === 'image' ||
      asset.fileType === 'image' ||
      asset.fileType === 'gif' ||
      asset.fileType === 'svg'
    ) {
      insertMediaHtml(
        `<figure class="rte-media"><img src="${url}" alt="${alt}" loading="lazy" /></figure><p></p>`,
      );
      return;
    }

    insertMediaHtml(
      `<figure class="rte-media"><video src="${url}" controls playsinline preload="metadata"></video></figure><p></p>`,
    );
  };

  const handleInsertVideoUrl = () => {
    if (isSourceMode) return;
    const raw = window.prompt(
      isAr
        ? 'أدخل رابط الفيديو:'
        : 'Enter video URL (YouTube or MP4 file):',
      'https://',
    );
    if (!raw || !raw.trim() || raw.trim() === 'https://') return;

    const url = raw.trim();
    const yt = youtubeEmbedUrl(url);
    if (yt) {
      insertMediaHtml(
        `<figure class="rte-media"><iframe src="${yt}" title="Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></figure><p></p>`,
      );
      return;
    }

    insertMediaHtml(
      `<figure class="rte-media"><video src="${url}" controls playsinline preload="metadata"></video></figure><p></p>`,
    );
  };

  const handleInput = () => {
    emitChange();
    updateToolbarStatus();
  };

  const handleSourceCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setSourceCode(newCode);
    onChange(newCode);
    if (editorRef.current) {
      editorRef.current.innerHTML = newCode;
    }
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
  };

  const btnClass = (active: boolean) =>
    `p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
      active
        ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-extrabold shadow-2xs'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
    }`;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
          {label} {requiredMark && <span className="text-rose-500">*</span>}
          {required && !requiredMark && <span className="sr-only">required</span>}
        </label>
      )}

      <div
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071E26] shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/30 transition-all"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between gap-1 p-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 select-none">
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
            {enableHeadings && (
              <>
                <div className="relative flex items-center gap-0.5">
                  <Heading className="w-3.5 h-3.5 text-slate-400 ms-0.5 shrink-0" />
                  <select
                    value={blockTag}
                    disabled={isSourceMode}
                    onChange={(e) => applyBlockFormat(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={isAr ? 'نمط الفقرة / العناوين' : 'Paragraph / Heading (SEO)'}
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
                <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />
              </>
            )}

            <button
              type="button"
              title={isAr ? 'عريض' : 'Bold (Ctrl+B)'}
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
              title={isAr ? 'مائل' : 'Italic (Ctrl+I)'}
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
              title={isAr ? 'تسطير' : 'Underline (Ctrl+U)'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('underline');
              }}
              className={btnClass(activeFormats.underline)}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <label
              className="relative inline-flex items-center justify-center p-1.5 rounded-lg cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800"
              title={isAr ? 'لون الخط' : 'Font Color'}
            >
              <span className="text-[11px] font-black leading-none" aria-hidden>
                A
              </span>
              <span
                className="absolute bottom-1 start-1.5 end-1.5 h-0.5 rounded-full bg-rose-500"
                aria-hidden
              />
              <input
                type="color"
                disabled={isSourceMode}
                defaultValue="#0f172a"
                onChange={(e) => {
                  execCmd('foreColor', e.target.value);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label={isAr ? 'لون الخط' : 'Font Color'}
              />
            </label>

            <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

            <button
              type="button"
              title={isAr ? 'قائمة نقطية' : 'Bullet List'}
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
              title={isAr ? 'قائمة مرقمة' : 'Numbered List'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('insertOrderedList');
              }}
              className={btnClass(activeFormats.orderedList)}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              title={isAr ? 'إدراج رابط' : 'Insert Link'}
              onMouseDown={(e) => {
                e.preventDefault();
                handleLink();
              }}
              className={btnClass(activeFormats.link)}
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>

            {enableMedia && (
              <>
                <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />
                <button
                  type="button"
                  title={isAr ? 'إدراج صورة' : 'Insert Image'}
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
                  title={isAr ? 'إدراج فيديو من المكتبة' : 'Insert Video from library'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    openMediaPicker('video');
                  }}
                  className={btnClass(false)}
                >
                  <Film className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'إدراج رابط فيديو' : 'Insert video URL (YouTube / MP4)'}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleInsertVideoUrl();
                  }}
                  className={`${btnClass(false)} text-[9px] font-bold px-1.5 gap-0.5 hidden sm:flex`}
                >
                  <Film className="w-3 h-3" />
                  {isAr ? 'رابط' : 'URL'}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            {maxLength && (
              <span className="font-mono">
                {charCount}/{maxLength}
              </span>
            )}

            {showCodeToggle && (
              <button
                type="button"
                onClick={toggleSourceMode}
                title={
                  isSourceMode
                    ? isAr
                      ? 'عرض النص المنسق'
                      : 'Visual Editor'
                    : isAr
                      ? 'عرض كود HTML'
                      : 'View HTML Code'
                }
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  isSourceMode
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">
                  {isSourceMode
                    ? isAr
                      ? 'تنسيق'
                      : 'HTML'
                    : isAr
                      ? 'كود'
                      : 'Code'}
                </span>
              </button>
            )}
          </div>
        </div>

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
              dir="auto"
              data-placeholder={placeholder}
              className={`w-full p-3.5 text-xs focus:outline-none leading-relaxed overflow-y-auto cursor-text ${
                charCount === 0 ? 'empty-editor' : ''
              } ${EDITOR_PROSE_CLASS}`}
              style={{
                minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
                maxHeight: '480px',
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
  '[&_p]:my-2 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3 [&_video]:max-w-full [&_video]:rounded-xl [&_video]:my-3 ' +
  '[&_iframe]:max-w-full [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-3 [&_figure]:my-3';

export function looksLikeHtml(value?: string | null): boolean {
  return !!value && /<[a-z][\s\S]*>/i.test(value);
}

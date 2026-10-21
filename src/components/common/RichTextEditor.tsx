import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Code,
  RotateCcw,
  Check,
} from 'lucide-react';

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

  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceCode, setSourceCode] = useState(value || '');
  const [charCount, setCharCount] = useState(0);

  // Sync state formatting flags from selection
  const updateToolbarStatus = useCallback(() => {
    if (!editorRef.current || isSourceMode) return;

    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      // Ensure selection is inside the editor
      const anchorNode = sel.anchorNode;
      if (!anchorNode || !editorRef.current.contains(anchorNode)) return;

      const isB = document.queryCommandState('bold');
      const isI = document.queryCommandState('italic');
      const isU = document.queryCommandState('underline');
      const isUl = document.queryCommandState('insertUnorderedList');
      const isOl = document.queryCommandState('insertOrderedList');

      // Check if current selection has an <a> ancestor
      const el = anchorNode.nodeType === Node.ELEMENT_NODE ? (anchorNode as Element) : anchorNode.parentElement;
      const isL = !!el?.closest('a');

      setActiveFormats({
        bold: isB,
        italic: isI,
        underline: isU,
        bulletList: isUl,
        orderedList: isOl,
        link: isL,
      });

      // Update char count
      const text = editorRef.current.innerText || '';
      setCharCount(text.trim().length);
    } catch {
      // quiet catch on queryCommandState in rare browser edge-cases
    }
  }, [isSourceMode]);

  // Initial and external sync
  useEffect(() => {
    if (!editorRef.current) return;

    const currentHtml = editorRef.current.innerHTML;
    const incoming = value || '';

    // If source mode, keep code in sync
    setSourceCode(incoming);

    // If already identical or user is typing same content, avoid DOM overwrite (prevents caret jumping)
    if (currentHtml === incoming) {
      setCharCount((editorRef.current.innerText || '').trim().length);
      return;
    }

    // If incoming value is plain text without html tags and has newlines, convert \n to <p>
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

  // Selection change listener for active button highlights
  useEffect(() => {
    const handleSelectionChange = () => {
      updateToolbarStatus();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateToolbarStatus]);

  // Execute rich text command while retaining selection
  const execCmd = (command: string, arg?: string) => {
    if (isSourceMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      setSourceCode(html);
      setCharCount((editorRef.current.innerText || '').trim().length);
    }
    updateToolbarStatus();
  };

  // Link command
  const handleLink = () => {
    if (isSourceMode) return;
    if (activeFormats.link) {
      execCmd('unlink');
      return;
    }

    const currentSel = window.getSelection();
    const defaultUrl = 'https://';
    const url = window.prompt(isAr ? 'أدخل رابط URL:' : 'Enter Link URL:', defaultUrl);

    if (url && url.trim() && url.trim() !== defaultUrl) {
      const validUrl = url.trim().startsWith('http') || url.trim().startsWith('mailto:') || url.trim().startsWith('tel:')
        ? url.trim()
        : `https://${url.trim()}`;

      if (currentSel && currentSel.isCollapsed) {
        // If no text was highlighted, insert URL as linked anchor text
        execCmd('insertHTML', `<a href="${validUrl}" target="_blank" rel="noopener noreferrer">${validUrl}</a>`);
      } else {
        execCmd('createLink', validUrl);
      }
    }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html);
    setSourceCode(html);
    setCharCount((editorRef.current.innerText || '').trim().length);
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

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
          {label} {requiredMark && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Editor Main Container */}
      <div
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071E26] shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/30 transition-all"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* ── Toolbar Header (Matching exact layout from reference mockup) ── */}
        <div className="flex items-center justify-between gap-1 p-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 select-none">
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
            {/* Bold */}
            <button
              type="button"
              title={isAr ? 'عريض (Ctrl+B)' : 'Bold (Ctrl+B)'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('bold');
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                activeFormats.bold
                  ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-extrabold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              type="button"
              title={isAr ? 'مائل (Ctrl+I)' : 'Italic (Ctrl+I)'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('italic');
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                activeFormats.italic
                  ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-extrabold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Underline */}
            <button
              type="button"
              title={isAr ? 'تسطير (Ctrl+U)' : 'Underline (Ctrl+U)'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('underline');
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                activeFormats.underline
                  ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-extrabold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* Divider */}
            <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

            {/* Bullet List */}
            <button
              type="button"
              title={isAr ? 'قائمة نقطية' : 'Bullet List'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('insertUnorderedList');
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                activeFormats.bulletList
                  ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-extrabold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              title={isAr ? 'قائمة مرقمة' : 'Numbered List'}
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd('insertOrderedList');
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                activeFormats.orderedList
                  ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-extrabold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            {/* Link */}
            <button
              type="button"
              title={isAr ? 'إدراج رابط' : 'Insert Link'}
              onMouseDown={(e) => {
                e.preventDefault();
                handleLink();
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                activeFormats.link
                  ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-extrabold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Toolbar Actions: Source Code Toggle & Char Counter */}
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
                title={isSourceMode ? (isAr ? 'عرض النص المنسق' : 'Visual Editor') : (isAr ? 'عرض كود HTML' : 'View HTML Code')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  isSourceMode
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">
                  {isSourceMode ? 'HTML' : 'Code'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── Editor Editable Body ── */}
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
              } [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_a]:text-blue-600 [&_a]:underline [&_a]:font-semibold [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline`}
              style={{
                minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
                maxHeight: '400px',
                resize: 'vertical',
                overflow: 'auto',
                background: 'var(--input-bg, #ffffff)',
                color: 'var(--input-fg, #0f172a)',
              }}
            />

            {/* Empty state placeholder */}
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
    </div>
  );
};

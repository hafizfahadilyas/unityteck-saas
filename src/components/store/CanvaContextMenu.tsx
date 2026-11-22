/**
 * Canva-style right-click menu for Design Studio layers.
 * AR chrome = Arabic only · EN chrome = English only.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  ClipboardPaste,
  Paintbrush,
  Trash2,
  Layers,
  AlignHorizontalSpaceAround,
  LockKeyhole,
  Unlock,
  ChevronLeft,
  ChevronRight,
  BringToFront,
  SendToBack,
  ArrowUp,
  ArrowDown,
  PlusSquare,
  Group,
  Ungroup,
} from 'lucide-react';

export type CanvaContextMenuPos = {
  clientX: number;
  clientY: number;
  /** Viewport-fixed coords after clamp */
  x: number;
  y: number;
  elementId: string | null;
};

type Props = {
  isAr: boolean;
  menu: CanvaContextMenuPos;
  locked: boolean;
  hasClipboard: boolean;
  hasSelection: boolean;
  canGroup?: boolean;
  canUngroup?: boolean;
  onClose: () => void;
  onCopy: () => void;
  onCopyStyle: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onLayer: (action: 'forward' | 'backward' | 'front' | 'back') => void;
  onAlign: (mode: 'h-center' | 'v-center' | 'left' | 'right' | 'top' | 'bottom') => void;
};

type SubMenu = 'layer' | 'align' | null;

export const CanvaContextMenu: React.FC<Props> = ({
  isAr,
  menu,
  locked,
  hasClipboard,
  hasSelection,
  canGroup = false,
  canUngroup = false,
  onClose,
  onCopy,
  onCopyStyle,
  onPaste,
  onDuplicate,
  onDelete,
  onToggleLock,
  onGroup,
  onUngroup,
  onLayer,
  onAlign,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [sub, setSub] = useState<SubMenu>(null);
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const row = (
    key: string,
    label: string,
    shortcut: string | null,
    Icon: React.ElementType,
    action: () => void,
    opts?: { disabled?: boolean; danger?: boolean },
  ) => (
    <button
      key={key}
      type="button"
      disabled={opts?.disabled}
      onClick={() => {
        if (opts?.disabled) return;
        action();
        onClose();
      }}
      className={`cs-ctx-row w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        opts?.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-800 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
      <span className="flex-1 text-start">{label}</span>
      {shortcut ? (
        <span className="text-[10px] font-mono text-slate-400 shrink-0" dir="ltr">
          {shortcut}
        </span>
      ) : null}
    </button>
  );

  const flyout = (
    open: boolean,
    items: Array<{
      key: string;
      label: string;
      Icon: React.ElementType;
      action: () => void;
    }>,
  ) =>
    open ? (
      <div className="cs-ctx-flyout absolute top-0 min-w-[11rem] py-1 rounded-xl border border-slate-200 bg-white shadow-xl z-[80]">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => {
              it.action();
              onClose();
            }}
            className="cs-ctx-row w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <it.Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
            <span className="flex-1 text-start">{it.label}</span>
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div
      ref={rootRef}
      className="cs-ctx-menu fixed z-[90] min-w-[15.5rem] py-1 rounded-xl border border-slate-200 bg-white shadow-2xl"
      style={{ left: menu.x, top: menu.y }}
      role="menu"
      dir={isAr ? 'rtl' : 'ltr'}
      onContextMenu={(e) => e.preventDefault()}
    >
      {row(
        'copy',
        isAr ? 'نسخ' : 'Copy',
        'CTRL+C',
        Copy,
        onCopy,
        { disabled: !hasSelection },
      )}
      {row(
        'copy-style',
        isAr ? 'نسخ النمط' : 'Copy style',
        'CTRL+ALT+C',
        Paintbrush,
        onCopyStyle,
        { disabled: !hasSelection },
      )}
      {row(
        'paste',
        isAr ? 'لصق' : 'Paste',
        'CTRL+V',
        ClipboardPaste,
        onPaste,
        { disabled: !hasClipboard },
      )}
      {row(
        'dup',
        isAr ? 'تكرار' : 'Duplicate',
        'CTRL+D',
        PlusSquare,
        onDuplicate,
        { disabled: !hasSelection },
      )}
      {row(
        'del',
        isAr ? 'حذف' : 'Delete',
        'DELETE',
        Trash2,
        onDelete,
        { disabled: !hasSelection, danger: true },
      )}

      <div className="my-1 border-t border-slate-100" />

      <div
        className="relative"
        onMouseEnter={() => setSub('layer')}
        onMouseLeave={() => setSub((s) => (s === 'layer' ? null : s))}
      >
        <button
          type="button"
          disabled={!hasSelection}
          onClick={() => setSub((s) => (s === 'layer' ? null : 'layer'))}
          className="cs-ctx-row w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer disabled:opacity-40"
        >
          <Layers className="w-3.5 h-3.5 shrink-0 opacity-80" />
          <span className="flex-1 text-start">{isAr ? 'طبقة' : 'Layer'}</span>
          <Chevron className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <div
          className="absolute top-0"
          style={isAr ? { right: '100%', paddingRight: 4 } : { left: '100%', paddingLeft: 4 }}
        >
          {flyout(sub === 'layer' && hasSelection, [
            {
              key: 'fwd',
              label: isAr ? 'للأمام' : 'Bring forward',
              Icon: ArrowUp,
              action: () => onLayer('forward'),
            },
            {
              key: 'back',
              label: isAr ? 'للخلف' : 'Send backward',
              Icon: ArrowDown,
              action: () => onLayer('backward'),
            },
            {
              key: 'front',
              label: isAr ? 'إلى المقدمة' : 'Bring to front',
              Icon: BringToFront,
              action: () => onLayer('front'),
            },
            {
              key: 'toback',
              label: isAr ? 'إلى الخلفية' : 'Send to back',
              Icon: SendToBack,
              action: () => onLayer('back'),
            },
          ])}
        </div>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setSub('align')}
        onMouseLeave={() => setSub((s) => (s === 'align' ? null : s))}
      >
        <button
          type="button"
          disabled={!hasSelection}
          onClick={() => setSub((s) => (s === 'align' ? null : 'align'))}
          className="cs-ctx-row w-full flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer disabled:opacity-40"
        >
          <AlignHorizontalSpaceAround className="w-3.5 h-3.5 shrink-0 opacity-80" />
          <span className="flex-1 text-start">
            {isAr ? 'محاذاة إلى الصفحة' : 'Align to page'}
          </span>
          <Chevron className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <div
          className="absolute top-0"
          style={isAr ? { right: '100%', paddingRight: 4 } : { left: '100%', paddingLeft: 4 }}
        >
          {flyout(sub === 'align' && hasSelection, [
            {
              key: 'hc',
              label: isAr ? 'توسيط أفقي' : 'Center horizontally',
              Icon: AlignHorizontalSpaceAround,
              action: () => onAlign('h-center'),
            },
            {
              key: 'vc',
              label: isAr ? 'توسيط عمودي' : 'Center vertically',
              Icon: AlignHorizontalSpaceAround,
              action: () => onAlign('v-center'),
            },
            {
              key: 'l',
              label: isAr ? 'يسار' : 'Left',
              Icon: AlignHorizontalSpaceAround,
              action: () => onAlign('left'),
            },
            {
              key: 'r',
              label: isAr ? 'يمين' : 'Right',
              Icon: AlignHorizontalSpaceAround,
              action: () => onAlign('right'),
            },
            {
              key: 't',
              label: isAr ? 'أعلى' : 'Top',
              Icon: AlignHorizontalSpaceAround,
              action: () => onAlign('top'),
            },
            {
              key: 'b',
              label: isAr ? 'أسفل' : 'Bottom',
              Icon: AlignHorizontalSpaceAround,
              action: () => onAlign('bottom'),
            },
          ])}
        </div>
      </div>

      <div className="my-1 border-t border-slate-100" />

      {row(
        'group',
        isAr ? 'تجميع' : 'Group',
        null,
        Group,
        () => onGroup?.(),
        { disabled: !canGroup || !onGroup },
      )}
      {row(
        'ungroup',
        isAr ? 'فك التجميع' : 'Ungroup',
        null,
        Ungroup,
        () => onUngroup?.(),
        { disabled: !canUngroup || !onUngroup },
      )}

      <div className="my-1 border-t border-slate-100" />

      {row(
        'lock',
        locked
          ? isAr
            ? 'فتح القفل'
            : 'Unlock'
          : isAr
            ? 'قفل'
            : 'Lock',
        'ALT+SHIFT+L',
        locked ? Unlock : LockKeyhole,
        onToggleLock,
        { disabled: !hasSelection },
      )}
    </div>
  );
};

/** Clamp menu into viewport */
export function clampContextMenuPos(
  clientX: number,
  clientY: number,
  width = 260,
  height = 360,
): { x: number; y: number } {
  const pad = 8;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  return {
    x: Math.max(pad, Math.min(clientX, vw - width - pad)),
    y: Math.max(pad, Math.min(clientY, vh - height - pad)),
  };
}

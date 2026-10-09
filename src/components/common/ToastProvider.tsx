import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ConfirmOpts = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ToastApi = {
  toast: (message: string, kind?: ToastKind) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
};

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 1;

/**
 * ToastProvider is mounted above PrefsProvider (see App.tsx), so usePrefs()
 * would only return defaults here. PrefsProvider applies `lang` to <html>,
 * so read it at render time for the built-in labels.
 */
function isArabicDocument(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('lang') === 'ar';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOpts & {
    resolve: (v: boolean) => void;
  }) | null>(null);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId++;
      setItems((prev) => [...prev.slice(-2), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  const confirm = useCallback((opts: ConfirmOpts) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...opts, resolve });
    });
  }, []);

  const closeConfirm = useCallback(
    (value: boolean) => {
      confirmState?.resolve(value);
      setConfirmState(null);
    },
    [confirmState],
  );

  const api = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        className="fixed bottom-4 end-4 z-[100] flex flex-col gap-2.5 max-w-sm w-[min(100%-2rem,24rem)] pointer-events-none"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3.5 text-xs font-semibold shadow-xl border backdrop-blur-sm transition-all duration-150"
            style={{
              background: 'color-mix(in srgb, var(--surface, #fff) 92%, transparent)',
              color: 'var(--text, #04222b)',
              borderColor: 'var(--border, #98d8d0)',
            }}
          >
            <span
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background:
                  t.kind === 'error'
                    ? 'color-mix(in srgb, #f43f5e 16%, transparent)'
                    : 'color-mix(in srgb, var(--portal-600, #1d8b94) 16%, transparent)',
              }}
            >
              {t.kind === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-[var(--portal-600,#1d8b94)]" />
              )}
              {t.kind === 'error' && <XCircle className="w-4 h-4 text-rose-500" />}
              {t.kind === 'info' && (
                <Info className="w-4 h-4 text-[var(--portal-400,#4fb8b4)]" />
              )}
            </span>
            <span className="flex-1 leading-snug pt-1.5">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 p-1 rounded-lg opacity-50 hover:opacity-100 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          danger={confirmState.danger}
          onConfirm={() => closeConfirm(true)}
          onCancel={() => closeConfirm(false)}
        />
      )}
    </ToastContext.Provider>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#04222B]/55 backdrop-blur-[2px] cursor-pointer border-0"
        aria-label="Close"
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl space-y-4 animate-[fadeIn_150ms_ease]"
        style={{
          background: 'var(--surface, #fff)',
          borderColor: 'var(--border, #98d8d0)',
          color: 'var(--text, #04222b)',
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: danger
                ? 'color-mix(in srgb, #f43f5e 14%, transparent)'
                : 'color-mix(in srgb, var(--portal-600, #1d8b94) 14%, transparent)',
            }}
          >
            <AlertTriangle
              className={`w-5 h-5 ${danger ? 'text-rose-500' : 'text-[var(--portal-600,#1d8b94)]'}`}
            />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className="text-base font-extrabold leading-tight">
              {title}
            </h2>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--muted, #0a3d4a)' }}>
              {message}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border cursor-pointer hover:opacity-90 transition-opacity duration-150"
            style={{
              background: 'var(--bg, #e2f4f0)',
              borderColor: 'var(--border, #98d8d0)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer hover:opacity-90 transition-opacity duration-150"
            style={{
              background: danger
                ? 'linear-gradient(90deg, #e11d48, #f43f5e)'
                : 'var(--portal-cta, linear-gradient(90deg, #1d8b94, #4fb8b4))',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => undefined,
      confirm: async () => false,
    };
  }
  return ctx;
}

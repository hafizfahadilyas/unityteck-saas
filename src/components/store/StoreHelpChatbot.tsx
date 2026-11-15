import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Headphones,
  ImagePlus,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Send,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  X,
  Wrench,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../common/ToastProvider';
import { isApiEnabled, apiFetch } from '../../api/client';
import { readAuthSession } from '../../auth/session';
import {
  feedbackHelpChatSession,
  fetchHelpChatFaq,
  fetchHelpChatSession,
  fetchHelpChatSettings,
  openHelpChatSession,
  sendHelpChatMessage,
  type HelpChatEntitlement,
  type HelpChatIntent,
  type HelpChatMessage,
  type HelpChatSession,
  type HelpChatSettings,
  type HelpKbArticle,
} from '../../api/tenantApi';

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

async function uploadHelpAttachment(
  storeId: string,
  dataUrl: string,
  fileName: string,
): Promise<string | null> {
  try {
    const res = await apiFetch<{ data?: { url?: string; optimized_url?: string } }>('/media', {
      method: 'POST',
      storeId,
      portal: 'store',
      body: {
        url: dataUrl,
        file_name: fileName,
        folder: 'help-chat',
        alt: 'help-chat-attachment',
      },
      timeoutMs: 60_000,
    });
    return res?.data?.optimized_url || res?.data?.url || null;
  } catch {
    return null;
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(file);
  });
}

function masterLabel(isAr: boolean, m?: HelpChatMessage | null, settings?: HelpChatSettings | null): string {
  const meta = (m?.meta || {}) as Record<string, unknown>;
  if (typeof meta.label_ar === 'string' && isAr && meta.label_ar) return meta.label_ar;
  if (typeof meta.label_en === 'string' && !isAr && meta.label_en) return meta.label_en;
  if (meta.from === 'souq_master_admin') {
    return isAr ? 'إدارة سوق الرئيسية' : 'Souq Master Admin';
  }
  return isAr
    ? settings?.bot_name_ar || 'إدارة سوق الرئيسية'
    : settings?.bot_name_en || 'Souq Master Admin';
}

export const StoreHelpChatbot: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();
  const storeId = activeStore?.id || '';

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState('');
  const [pendingFile, setPendingFile] = useState<{ dataUrl: string; name: string; type: string } | null>(
    null,
  );
  const [session, setSession] = useState<HelpChatSession | null>(null);
  const [messages, setMessages] = useState<HelpChatMessage[]>([]);
  const [settings, setSettings] = useState<HelpChatSettings | null>(null);
  const [entitlement, setEntitlement] = useState<HelpChatEntitlement | null>(null);
  const [faq, setFaq] = useState<HelpKbArticle[]>([]);
  const [intent, setIntent] = useState<HelpChatIntent>('ask_ai');
  const [faqOpenId, setFaqOpenId] = useState<string | null>(null);
  const [showFaq, setShowFaq] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const pollRef = useRef<number | null>(null);
  const intentRef = useRef<HelpChatIntent>(intent);
  const entitlementRef = useRef<HelpChatEntitlement | null>(null);

  useEffect(() => {
    intentRef.current = intent;
  }, [intent]);

  useEffect(() => {
    entitlementRef.current = entitlement;
  }, [entitlement]);

  const botName = masterLabel(isAr, null, settings);
  const voiceOn = settings?.voice_enabled !== 0 && settings?.voice_enabled !== false;
  const imageOn = settings?.image_enabled !== 0 && settings?.image_enabled !== false;
  const handoffOn =
    settings?.human_handoff_enabled !== 0 && settings?.human_handoff_enabled !== false;
  const aiAllowed = Boolean(entitlement?.ai_enabled);
  const humanAllowed = entitlement?.human_enabled !== false;
  const humanMode = ['waiting_human', 'human_active'].includes(String(session?.status || ''));
  const waitingMaster = humanMode && !messages.some((m) => m.role === 'human');
  const accent = settings?.primary_color || 'var(--portal-cta)';

  const scrollBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, []);

  const ensureSession = useCallback(
    async (forceIntent?: HelpChatIntent, forceNew?: boolean) => {
      if (!storeId || !isApiEnabled()) return;
      setBusy(true);
      try {
        const auth = readAuthSession();
        let ent = entitlementRef.current;
        if (!ent) {
          const pre = await fetchHelpChatSettings(storeId).catch(() => null);
          if (pre?.data) setSettings(pre.data);
          if (pre?.entitlement) {
            ent = pre.entitlement;
            setEntitlement(pre.entitlement);
            entitlementRef.current = pre.entitlement;
          }
        }
        const planAllowsAi = Boolean(ent?.ai_enabled);
        let useIntent = forceIntent || intentRef.current;
        // Free → Master human path only. Paid → keep Ask AI / Fix / Human as chosen.
        if (!planAllowsAi) {
          useIntent = 'contact_human';
          setIntent('contact_human');
        } else if (!forceIntent && useIntent === 'contact_human' && !session?.id) {
          // Fresh paid open defaults to automated Ask AI (still Master-branded welcome).
          useIntent = 'ask_ai';
          setIntent('ask_ai');
        }
        const res = await openHelpChatSession(storeId, {
          locale: isAr ? 'ar' : 'en',
          session_id: forceNew ? undefined : session?.id,
          requester_name: auth?.user?.name || activeStore?.name || auth?.user?.email || undefined,
          requester_email: auth?.user?.email || undefined,
          intent: useIntent,
        });
        setSession(res.data.session);
        setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
        if (res.data.settings) setSettings(res.data.settings);
        if (res.data.entitlement) {
          setEntitlement(res.data.entitlement);
          entitlementRef.current = res.data.entitlement;
        }
        if (Array.isArray(res.data.faq)) setFaq(res.data.faq);
        else {
          const f = await fetchHelpChatFaq(storeId, { suggested: true, limit: 8 }).catch(() => null);
          if (f?.data) setFaq(f.data);
          if (f?.entitlement) {
            setEntitlement(f.entitlement);
            entitlementRef.current = f.entitlement;
          }
        }
        scrollBottom();
      } catch {
        toast(isAr ? 'تعذر فتح مركز المساعدة' : 'Could not open Help Center', 'error');
      } finally {
        setBusy(false);
      }
    },
    [storeId, isAr, session?.id, activeStore?.name, toast, scrollBottom],
  );

  useEffect(() => {
    const onOpen = (ev: Event) => {
      const detail = (ev as CustomEvent<{ intent?: HelpChatIntent }>).detail;
      if (detail?.intent) setIntent(detail.intent);
      setOpen(true);
    };
    window.addEventListener('souq-open-help-center', onOpen as EventListener);
    return () => window.removeEventListener('souq-open-help-center', onOpen as EventListener);
  }, []);

  // Per-store isolation: switching merchant store resets this chat session.
  useEffect(() => {
    setSession(null);
    setMessages([]);
    setSettings(null);
    setEntitlement(null);
    entitlementRef.current = null;
    setFaq([]);
    setDraft('');
    setPendingFile(null);
    setFaqOpenId(null);
    setShowFaq(false);
    setIntent('ask_ai');
  }, [storeId]);

  useEffect(() => {
    if (entitlement && !entitlement.ai_enabled && intent !== 'contact_human') {
      setIntent('contact_human');
    }
  }, [entitlement, intent]);

  useEffect(() => {
    if (open && storeId && !session) void ensureSession();
  }, [open, storeId, session, ensureSession]);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  // Poll while waiting for Master human (Free + paid handoff).
  useEffect(() => {
    if (!open || !storeId || !session?.id || !humanMode) {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = window.setInterval(() => {
      void fetchHelpChatSession(storeId, session.id)
        .then((res) => {
          setSession(res.data.session);
          setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
        })
        .catch(() => undefined);
    }, 4000);
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open, storeId, session?.id, humanMode]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const speak = (text: string) => {
    if (!voiceOn || !text || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = isAr ? 'ar-SA' : 'en-US';
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  };

  const switchIntent = async (next: HelpChatIntent) => {
    if ((next === 'ask_ai' || next === 'fix_problem') && !aiAllowed) {
      toast(
        isAr
          ? 'الذكاء الاصطناعي غير متاح على الخطة المجانية. اكتب مشكلتك وانتظر رد الإدارة.'
          : 'AI is not on Free. Leave your problem and wait for Master Admin.',
        'error',
      );
      setIntent('contact_human');
      return;
    }
    if (next === 'contact_human' && !humanAllowed) {
      toast(isAr ? 'الدعم البشري غير متاح' : 'Human support not available', 'error');
      return;
    }
    setIntent(next);
    setSession(null);
    setMessages([]);
    setOpen(true);
    await ensureSession(next, true);
  };

  const toggleMic = () => {
    if (!voiceOn) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      toast(isAr ? 'المتصفح لا يدعم الإدخال الصوتي' : 'Browser does not support voice input', 'error');
      return;
    }
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
      return;
    }
    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = isAr ? 'ar-SA' : 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const transcript = ev.results?.[0]?.[0]?.transcript || '';
      if (transcript) setDraft((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const onPickFile = async (file: File | null) => {
    if (!file || !imageOn) return;
    const ok =
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      file.type.includes('document') ||
      /\.(png|jpe?g|gif|webp|pdf|txt)$/i.test(file.name);
    if (!ok) {
      toast(isAr ? 'يُسمح بالصور وملفات PDF والنصوص' : 'Images, PDF, or text files only', 'error');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setPendingFile({ dataUrl, name: file.name, type: file.type.startsWith('image/') ? 'image' : 'file' });
    } catch {
      toast(isAr ? 'تعذر قراءة الملف' : 'Could not read file', 'error');
    }
  };

  const send = async () => {
    if (!storeId || !session?.id || sending) return;
    const text = draft.trim();
    if (!text && !pendingFile) return;
    setSending(true);
    try {
      let attachmentUrl: string | undefined;
      let attachmentType: string | undefined;
      if (pendingFile) {
        const uploaded = await uploadHelpAttachment(storeId, pendingFile.dataUrl, pendingFile.name);
        if (!uploaded) {
          toast(isAr ? 'تعذر رفع المرفق' : 'Attachment upload failed', 'error');
          setSending(false);
          return;
        }
        attachmentUrl = uploaded;
        attachmentType = pendingFile.type;
      }
      const res = await sendHelpChatMessage(storeId, session.id, {
        body: text,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      });
      setDraft('');
      setPendingFile(null);
      setSession(res.data.session);
      if (res.data.entitlement) setEntitlement(res.data.entitlement);
      setMessages((prev) => {
        const next = [...prev];
        if (res.data.user_message) next.push(res.data.user_message);
        if (res.data.assistant_message) next.push(res.data.assistant_message);
        return next;
      });
      if (res.data.assistant_message?.body && res.data.assistant_message.role === 'assistant') {
        speak(res.data.assistant_message.body);
      }
    } catch {
      toast(isAr ? 'تعذر إرسال الرسالة' : 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const onFeedback = async (verdict: 'satisfied' | 'unsatisfied') => {
    if (!storeId || !session?.id) return;
    try {
      const res = await feedbackHelpChatSession(storeId, session.id, {
        satisfaction: verdict,
        reason: verdict === 'unsatisfied' ? draft.trim() || undefined : undefined,
      });
      setSession(res.data.session);
      const refreshed = await fetchHelpChatSession(storeId, session.id);
      setMessages(Array.isArray(refreshed.data.messages) ? refreshed.data.messages : []);
      toast(
        verdict === 'satisfied'
          ? isAr
            ? 'شكراً لتقييمك'
            : 'Thanks for your feedback'
          : isAr
            ? 'تم إرسال سؤالك للإدارة'
            : 'Your question was sent to Master Admin',
        'success',
      );
    } catch {
      toast(isAr ? 'تعذر إرسال التقييم' : 'Feedback failed', 'error');
    }
  };

  const askSuggested = (article: HelpKbArticle) => {
    const q = isAr ? article.title_ar || article.title_en : article.title_en || article.title_ar;
    if (q) setDraft(q);
  };

  if (!storeId || !isApiEnabled()) return null;
  if (!open) return null;

  const dockSide = isAr ? 'left' : 'right';
  const statusLine = humanMode
    ? waitingMaster
      ? isAr
        ? 'في انتظار رد الإدارة… اترك مشكلتك هنا'
        : 'Waiting for Master… leave your problem here'
      : isAr
        ? 'الإدارة ترد الآن'
        : 'Master Admin is replying'
    : aiAllowed
      ? isAr
        ? 'ردود آلية مفعّلة'
        : 'Automated replies on'
      : isAr
        ? 'دعم بشري'
        : 'Human support';

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[79] bg-black/35 sm:hidden"
        aria-label={isAr ? 'إغلاق' : 'Close'}
        onClick={() => setOpen(false)}
      />
      <div
        className="souq-help-chat fixed z-[80] flex flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          width: 'min(23rem, calc(100vw - 1.5rem))',
          maxWidth: '23rem',
          height: 'min(34rem, calc(100dvh - 5rem))',
          maxHeight: 'min(34rem, calc(100dvh - 5rem))',
          bottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          [dockSide]: `max(0.75rem, env(safe-area-inset-${dockSide}))`,
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
          fontFamily: 'var(--font-ui)',
          boxShadow: '0 22px 56px rgba(15, 23, 42, 0.32)',
        }}
        dir={isAr ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? 'محادثة المساعدة' : 'Help chat'}
      >
        <header
          className="relative flex items-center justify-between gap-2 px-3 py-3 text-white shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 72%, #04222B) 100%)`,
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 20% 20%, #fff6, transparent 55%)' }} />
          <div className="relative flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/15 ring-2 ring-white/25 flex items-center justify-center shrink-0 shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold truncate leading-tight">
                {isAr ? 'المساعدة والدعم' : 'Help & Support'}
              </div>
              <div className="text-[11px] opacity-95 truncate leading-tight font-semibold">
                {botName}
              </div>
              <div className="text-[10px] opacity-80 truncate leading-tight mt-0.5">
                {statusLine}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="relative p-1.5 rounded-lg hover:bg-white/15 shrink-0"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex gap-1 px-2 py-1.5 border-b overflow-x-auto shrink-0 scrollbar-thin" style={{ borderColor: 'var(--border)' }}>
          {aiAllowed ? (
            <>
              <button
                type="button"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold shrink-0 ${intent === 'ask_ai' && !humanMode ? 'unity-btn-primary text-white' : ''}`}
                style={intent === 'ask_ai' && !humanMode ? undefined : { border: '1px solid var(--border)', color: 'var(--muted)' }}
                onClick={() => void switchIntent('ask_ai')}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAr ? 'ذكاء اصطناعي' : 'Ask AI'}
              </button>
              <button
                type="button"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold shrink-0 ${intent === 'fix_problem' && !humanMode ? 'unity-btn-primary text-white' : ''}`}
                style={intent === 'fix_problem' && !humanMode ? undefined : { border: '1px solid var(--border)', color: 'var(--muted)' }}
                onClick={() => void switchIntent('fix_problem')}
              >
                <Wrench className="w-3.5 h-3.5" />
                {isAr ? 'إصلاح' : 'Fix'}
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold shrink-0 ${intent === 'contact_human' || humanMode || !aiAllowed ? 'unity-btn-primary text-white' : ''}`}
            style={intent === 'contact_human' || humanMode || !aiAllowed ? undefined : { border: '1px solid var(--border)', color: 'var(--muted)' }}
            onClick={() => void switchIntent('contact_human')}
          >
            <Headphones className="w-3.5 h-3.5" />
            {isAr ? 'الإدارة' : 'Master'}
          </button>
        </div>

        {entitlement ? (
          <div
            className="px-2.5 py-1.5 text-[11px] border-b flex flex-wrap items-center gap-x-2 gap-y-1 shrink-0 leading-snug"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{
                background: aiAllowed ? 'color-mix(in srgb, var(--accent) 18%, var(--surface))' : 'color-mix(in srgb, var(--muted) 16%, var(--surface))',
                color: 'var(--text)',
              }}
            >
              {entitlement.plan_code || 'free'}
            </span>
            <span>
              {aiAllowed
                ? isAr
                  ? `ذكاء اصطناعي: ${entitlement.remaining ?? 0}/${entitlement.limit ?? 0}`
                  : `AI: ${entitlement.remaining ?? 0}/${entitlement.limit ?? 0}`
                : isAr
                  ? 'مجاني · رد بشري من الإدارة'
                  : 'Free · Master human reply'}
            </span>
          </div>
        ) : null}

        {faq.length > 0 ? (
          showFaq ? (
            <div className="border-b px-2 py-1.5 max-h-28 overflow-y-auto shrink-0" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                className="w-full flex items-center justify-between text-[11px] font-bold mb-1"
                style={{ color: 'var(--muted)' }}
                onClick={() => setShowFaq(false)}
              >
                {isAr ? 'أسئلة شائعة' : 'FAQs'}
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-wrap gap-1">
                {faq
                  .filter((a) => a.suggested)
                  .slice(0, 4)
                  .map((a) => (
                    <button
                      key={`sug-${a.id}`}
                      type="button"
                      className="text-[11px] px-2 py-1 rounded-full border leading-snug"
                      style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
                      onClick={() => askSuggested(a)}
                    >
                      {isAr ? a.title_ar || a.title_en : a.title_en || a.title_ar}
                    </button>
                  ))}
              </div>
              {faq.slice(0, 3).map((a) => {
                const title = isAr ? a.title_ar || a.title_en : a.title_en || a.title_ar;
                const body = isAr ? a.body_ar || a.body_en : a.body_en || a.body_ar;
                const openA = faqOpenId === a.id;
                return (
                  <div key={a.id} className="mt-1">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-2 text-start text-[11px] font-semibold py-0.5"
                      onClick={() => setFaqOpenId(openA ? null : a.id)}
                    >
                      <span className="truncate">{title}</span>
                      {openA ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                    </button>
                    {openA ? (
                      <p className="text-[11px] whitespace-pre-wrap pb-1 leading-snug" style={{ color: 'var(--muted)' }}>
                        {body}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <button
              type="button"
              className="px-2.5 py-1 text-[11px] border-b flex items-center gap-1 shrink-0"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              onClick={() => setShowFaq(true)}
            >
              <ChevronDown className="w-3.5 h-3.5" />
              {isAr ? 'أسئلة شائعة' : 'FAQs'}
            </button>
          )
        ) : null}

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2.5 min-h-0"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--accent) 4%, var(--surface)) 0%, var(--surface) 40%)',
          }}
        >
          {busy && messages.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm" style={{ color: 'var(--muted)' }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isAr ? 'جاري التحميل…' : 'Loading…'}
            </div>
          ) : null}
          {messages.map((m) => {
            const mine = m.role === 'user';
            const human = m.role === 'human';
            const system = m.role === 'system';
            const masterSide = !mine && !system;
            const label = human
              ? isAr
                ? 'إدارة سوق الرئيسية'
                : 'Souq Master Admin'
              : m.role === 'assistant'
                ? masterLabel(isAr, m, settings)
                : null;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? (isAr ? 'justify-start' : 'justify-end') : isAr ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-[13px] sm:text-sm leading-relaxed shadow-sm ${system ? 'w-full text-center text-[12px] shadow-none' : ''}`}
                  style={{
                    background: mine
                      ? accent
                      : human
                        ? 'color-mix(in srgb, var(--accent) 16%, var(--surface))'
                        : system
                          ? 'transparent'
                          : 'color-mix(in srgb, var(--border) 55%, var(--surface))',
                    color: mine ? '#fff' : 'var(--text)',
                    opacity: system ? 0.88 : 1,
                    border: masterSide && !system ? '1px solid color-mix(in srgb, var(--accent) 22%, var(--border))' : undefined,
                  }}
                >
                  {label ? (
                    <div className="text-[11px] font-bold mb-1 flex items-center gap-1" style={{ color: mine ? '#fff' : 'var(--accent)' }}>
                      <ShieldCheck className="w-3 h-3" />
                      {label}
                    </div>
                  ) : null}
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  {m.attachment_url ? (
                    <a href={m.attachment_url} target="_blank" rel="noreferrer" className="block mt-2">
                      {m.attachment_type === 'image' || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(m.attachment_url) ? (
                        <img src={m.attachment_url} alt="" className="max-h-36 rounded-xl border object-cover" />
                      ) : (
                        <span className="text-[12px] underline">{isAr ? 'مرفق' : 'Attachment'}</span>
                      )}
                    </a>
                  ) : null}
                  {m.role === 'assistant' && voiceOn ? (
                    <button
                      type="button"
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] opacity-80"
                      onClick={() => speak(m.body)}
                    >
                      <Volume2 className="w-3 h-3" />
                      {isAr ? 'استماع' : 'Listen'}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
          {waitingMaster && messages.some((m) => m.role === 'user') ? (
            <div className="flex justify-center">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
                  color: 'var(--accent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border))',
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: 'var(--accent)' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent)' }} />
                </span>
                {isAr ? 'بانتظار رد إدارة سوق…' : 'Waiting for Souq Master…'}
              </div>
            </div>
          ) : null}
        </div>

        {!humanMode &&
        session &&
        session.status !== 'resolved' &&
        session.status !== 'closed' &&
        aiAllowed &&
        messages.some((m) => m.role === 'assistant') ? (
          <div
            className="flex items-center justify-center gap-2 px-2 py-1.5 border-t text-[11px] flex-wrap shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <span>{isAr ? 'هل كانت الإجابة كافية؟' : 'Was this enough?'}</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => void onFeedback('satisfied')}
            >
              <ThumbsUp className="w-3 h-3" />
              {isAr ? 'نعم' : 'Yes'}
            </button>
            {handoffOn ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border"
                style={{ borderColor: 'var(--border)' }}
                onClick={() => void onFeedback('unsatisfied')}
              >
                <ThumbsDown className="w-3 h-3" />
                {isAr ? 'إنسان' : 'Human'}
              </button>
            ) : null}
          </div>
        ) : null}

        {pendingFile ? (
          <div className="px-2.5 pb-1 text-[11px] shrink-0" style={{ color: 'var(--muted)' }}>
            {pendingFile.type === 'image' ? (
              <div className="relative inline-block">
                <img
                  src={pendingFile.dataUrl}
                  alt=""
                  className="h-14 rounded-lg border object-cover"
                  style={{ borderColor: 'var(--border)' }}
                />
                <button
                  type="button"
                  className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs"
                  onClick={() => setPendingFile(null)}
                >
                  ×
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Paperclip className="w-3 h-3" />
                {pendingFile.name}
                <button type="button" onClick={() => setPendingFile(null)}>
                  ×
                </button>
              </span>
            )}
          </div>
        ) : null}

        <footer className="border-t p-2 flex items-end gap-1 shrink-0" style={{ borderColor: 'var(--border)' }}>
          {imageOn ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,.txt,application/pdf"
                className="hidden"
                onChange={(e) => void onPickFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                className="p-2 rounded-xl border shrink-0"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                onClick={() => fileRef.current?.click()}
                aria-label={isAr ? 'إرفاق صورة أو ملف' : 'Attach image or file'}
                title={isAr ? 'صورة / ملف' : 'Image / file'}
              >
                <ImagePlus className="w-4 h-4" />
              </button>
            </>
          ) : null}
          {voiceOn ? (
            <button
              type="button"
              className={`p-2 rounded-xl border shrink-0 ${listening ? 'ring-2 ring-[var(--accent)]' : ''}`}
              style={{ borderColor: 'var(--border)', color: listening ? 'var(--accent)' : 'var(--muted)' }}
              onClick={toggleMic}
              aria-label={isAr ? 'رسالة صوتية' : 'Voice message'}
              title={isAr ? 'صوت' : 'Voice'}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          ) : null}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            onPaste={(e) => {
              if (!imageOn) return;
              const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'));
              if (item) {
                const file = item.getAsFile();
                if (file) void onPickFile(file);
              }
            }}
            rows={1}
            placeholder={
              humanMode
                ? isAr
                  ? 'اكتب مشكلتك للإدارة…'
                  : 'Leave your problem for Master…'
                : isAr
                  ? 'اكتب سؤالك…'
                  : 'Type your message…'
            }
            className="flex-1 resize-none rounded-xl border px-2.5 py-2 text-[13px] sm:text-sm outline-none max-h-24 leading-snug"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <button
            type="button"
            disabled={sending || (!draft.trim() && !pendingFile)}
            onClick={() => void send()}
            className="p-2.5 rounded-xl text-white shrink-0 disabled:opacity-50 unity-btn-primary"
            style={{ background: accent }}
            aria-busy={sending}
            aria-label={isAr ? 'إرسال' : 'Send'}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </footer>
      </div>
    </>
  );
};

export default StoreHelpChatbot;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bot,
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
  const [showFaq, setShowFaq] = useState(true);

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const pollRef = useRef<number | null>(null);

  const botName = isAr
    ? settings?.bot_name_ar || 'مساعدة سوق'
    : settings?.bot_name_en || 'Souq Help';
  const voiceOn = settings?.voice_enabled !== 0 && settings?.voice_enabled !== false;
  const imageOn = settings?.image_enabled !== 0 && settings?.image_enabled !== false;
  const handoffOn =
    settings?.human_handoff_enabled !== 0 && settings?.human_handoff_enabled !== false;
  const aiAllowed = Boolean(entitlement?.ai_enabled);
  const humanAllowed = entitlement?.human_enabled !== false;
  const humanMode = ['waiting_human', 'human_active'].includes(String(session?.status || ''));
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
        const useIntent = forceIntent || intent;
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
        if (res.data.entitlement) setEntitlement(res.data.entitlement);
        if (Array.isArray(res.data.faq)) setFaq(res.data.faq);
        else {
          const f = await fetchHelpChatFaq(storeId, { suggested: true, limit: 8 }).catch(() => null);
          if (f?.data) setFaq(f.data);
          if (f?.entitlement) setEntitlement(f.entitlement);
        }
        scrollBottom();
      } catch {
        toast(isAr ? 'تعذر فتح مركز المساعدة' : 'Could not open Help Center', 'error');
      } finally {
        setBusy(false);
      }
    },
    [storeId, isAr, intent, session?.id, activeStore?.name, toast, scrollBottom],
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

  useEffect(() => {
    if (open && storeId && !session) void ensureSession();
  }, [open, storeId, session, ensureSession]);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

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
    }, 5000);
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
    if (next === 'ask_ai' && !aiAllowed) {
      toast(
        isAr
          ? 'الذكاء الاصطناعي غير متاح على خطتك. استخدم الدعم البشري أو رقِّ الخطة.'
          : 'AI is not on your plan. Use human support or upgrade.',
        'error',
      );
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

  // Floating FAB removed — open only via sidebar "Need Help?" → souq-open-help-center.
  if (!open) return null;

  return (
    <>
      <div
        className="fixed z-[80] bottom-5 w-[min(100vw-1.5rem,420px)] max-h-[min(82vh,680px)] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          [isAr ? 'left' : 'right']: '1.25rem',
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
          fontFamily: 'var(--font-ui)',
        }}
        dir={isAr ? 'rtl' : 'ltr'}
        role="dialog"
        aria-label={isAr ? 'مركز المساعدة' : 'Help Center'}
      >
          <header className="flex items-center justify-between gap-2 px-4 py-3 text-white" style={{ background: accent }}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                {humanMode ? <Headphones className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">
                  {isAr ? 'مركز المساعدة والدعم' : 'Help & Support Center'}
                </div>
                <div className="text-[11px] opacity-90 truncate">
                  {humanMode
                    ? isAr
                      ? 'دعم بشري · الإدارة'
                      : 'Human support · Master'
                    : botName}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/15" aria-label={isAr ? 'إغلاق' : 'Close'}>
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="flex gap-1 p-2 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 ${intent === 'ask_ai' && aiAllowed ? 'unity-btn-primary text-white' : ''}`}
              style={intent === 'ask_ai' && aiAllowed ? undefined : { border: '1px solid var(--border)', color: 'var(--muted)', opacity: aiAllowed ? 1 : 0.45 }}
              onClick={() => void switchIntent('ask_ai')}
              disabled={!aiAllowed && intent !== 'ask_ai'}
              title={!aiAllowed ? (isAr ? 'غير متاح على المجاني' : 'Not on Free plan') : undefined}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? 'اسأل الذكاء الاصطناعي' : 'Ask AI'}
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 ${intent === 'fix_problem' && aiAllowed ? 'unity-btn-primary text-white' : ''}`}
              style={intent === 'fix_problem' && aiAllowed ? undefined : { border: '1px solid var(--border)', color: 'var(--muted)', opacity: aiAllowed ? 1 : 0.45 }}
              onClick={() => void switchIntent('fix_problem')}
              disabled={!aiAllowed}
            >
              <Wrench className="w-3.5 h-3.5" />
              {isAr ? 'أصلح مشكلتي' : 'Fix My Problem'}
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 ${intent === 'contact_human' || humanMode ? 'unity-btn-primary text-white' : ''}`}
              style={intent === 'contact_human' || humanMode ? undefined : { border: '1px solid var(--border)', color: 'var(--muted)' }}
              onClick={() => void switchIntent('contact_human')}
            >
              <Headphones className="w-3.5 h-3.5" />
              {isAr ? 'تواصل مع إنسان' : 'Contact Human'}
            </button>
          </div>

          {entitlement ? (
            <div className="px-3 py-1.5 text-[10px] border-b flex flex-wrap gap-x-2" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              <span>
                {isAr ? 'الخطة' : 'Plan'}: {entitlement.plan_code || '—'}
              </span>
              <span>
                {aiAllowed
                  ? isAr
                    ? `ذكاء اصطناعي: ${entitlement.remaining ?? 0}/${entitlement.limit ?? 0}`
                    : `AI: ${entitlement.remaining ?? 0}/${entitlement.limit ?? 0}`
                  : isAr
                    ? 'بدون ذكاء اصطناعي (مجاني)'
                    : 'No AI (Free)'}
              </span>
            </div>
          ) : null}

          {showFaq && faq.length > 0 ? (
            <div className="border-b px-2 py-2 max-h-36 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                className="w-full flex items-center justify-between text-[11px] font-bold mb-1"
                style={{ color: 'var(--muted)' }}
                onClick={() => setShowFaq(false)}
              >
                {isAr ? 'أسئلة شائعة ومقترحة' : 'FAQs & suggested'}
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-wrap gap-1 mb-1">
                {faq.filter((a) => a.suggested).slice(0, 6).map((a) => (
                  <button
                    key={`sug-${a.id}`}
                    type="button"
                    className="text-[10px] px-2 py-1 rounded-full border"
                    style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
                    onClick={() => askSuggested(a)}
                  >
                    {isAr ? a.title_ar || a.title_en : a.title_en || a.title_ar}
                  </button>
                ))}
              </div>
              {faq.slice(0, 4).map((a) => {
                const title = isAr ? a.title_ar || a.title_en : a.title_en || a.title_ar;
                const body = isAr ? a.body_ar || a.body_en : a.body_en || a.body_ar;
                const openA = faqOpenId === a.id;
                return (
                  <div key={a.id} className="mb-1">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-2 text-start text-[11px] font-semibold py-1"
                      onClick={() => setFaqOpenId(openA ? null : a.id)}
                    >
                      <span className="truncate">{title}</span>
                      {openA ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                    </button>
                    {openA ? (
                      <p className="text-[10px] whitespace-pre-wrap pb-1" style={{ color: 'var(--muted)' }}>
                        {body}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : faq.length > 0 ? (
            <button
              type="button"
              className="px-3 py-1.5 text-[11px] border-b flex items-center gap-1"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              onClick={() => setShowFaq(true)}
            >
              <ChevronDown className="w-3.5 h-3.5" />
              {isAr ? 'إظهار الأسئلة الشائعة' : 'Show FAQs'}
            </button>
          ) : null}

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-[180px]">
            {busy && messages.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm" style={{ color: 'var(--muted)' }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isAr ? 'جاري التحميل…' : 'Loading…'}
              </div>
            ) : null}
            {messages.map((m) => {
              const mine = m.role === 'user';
              const human = m.role === 'human';
              const system = m.role === 'system';
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? (isAr ? 'justify-start' : 'justify-end') : isAr ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${system ? 'w-full text-center text-xs' : ''}`}
                    style={{
                      background: mine
                        ? accent
                        : human
                          ? 'color-mix(in srgb, var(--accent) 18%, var(--surface))'
                          : system
                            ? 'transparent'
                            : 'var(--border)',
                      color: mine ? '#fff' : 'var(--text)',
                      opacity: system ? 0.85 : 1,
                    }}
                  >
                    {human ? (
                      <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--accent)' }}>
                        {isAr ? 'الإدارة' : 'Master Admin'}
                      </div>
                    ) : null}
                    {!mine && !human && !system && m.role === 'assistant' ? (
                      <div className="text-[10px] font-bold mb-1 opacity-70">{botName}</div>
                    ) : null}
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    {m.attachment_url ? (
                      <a href={m.attachment_url} target="_blank" rel="noreferrer" className="block mt-2">
                        {m.attachment_type === 'image' || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(m.attachment_url) ? (
                          <img src={m.attachment_url} alt="" className="max-h-40 rounded-lg border object-cover" />
                        ) : (
                          <span className="text-[11px] underline">{isAr ? 'مرفق' : 'Attachment'}</span>
                        )}
                      </a>
                    ) : null}
                    {m.role === 'assistant' && voiceOn ? (
                      <button type="button" className="mt-1.5 inline-flex items-center gap-1 text-[10px] opacity-80" onClick={() => speak(m.body)}>
                        <Volume2 className="w-3 h-3" />
                        {isAr ? 'استماع' : 'Listen'}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {!humanMode && session && session.status !== 'resolved' && session.status !== 'closed' ? (
            <div className="flex items-center justify-center gap-2 px-3 py-2 border-t text-[11px] flex-wrap" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              {aiAllowed && messages.some((m) => m.role === 'assistant') ? (
                <>
                  <span>{isAr ? 'هل كانت الإجابة كافية؟' : 'Was this enough?'}</span>
                  <button type="button" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => void onFeedback('satisfied')}>
                    <ThumbsUp className="w-3 h-3" />
                    {isAr ? 'نعم' : 'Yes'}
                  </button>
                </>
              ) : null}
              {handoffOn ? (
                <button type="button" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border" style={{ borderColor: 'var(--border)' }} onClick={() => void onFeedback('unsatisfied')}>
                  <ThumbsDown className="w-3 h-3" />
                  {isAr ? 'تحدّث مع إنسان' : 'Contact Human'}
                </button>
              ) : null}
            </div>
          ) : null}

          {pendingFile ? (
            <div className="px-3 pb-1 text-[11px]" style={{ color: 'var(--muted)' }}>
              {pendingFile.type === 'image' ? (
                <div className="relative inline-block">
                  <img src={pendingFile.dataUrl} alt="" className="h-16 rounded-lg border object-cover" style={{ borderColor: 'var(--border)' }} />
                  <button type="button" className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs" onClick={() => setPendingFile(null)}>
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

          <footer className="border-t p-2.5 flex items-end gap-1.5" style={{ borderColor: 'var(--border)' }}>
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
                    ? 'اكتب للإدارة…'
                    : 'Message Master Admin…'
                  : isAr
                    ? 'اكتب سؤالك أو صف المشكلة…'
                    : 'Ask a question or describe the issue…'
              }
              className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none max-h-28"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
            <button
              type="button"
              disabled={sending || (!draft.trim() && !pendingFile)}
              onClick={() => void send()}
              className="p-2.5 rounded-xl text-white shrink-0 disabled:opacity-50 unity-btn-primary"
              style={{ background: accent }}
              aria-busy={sending}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </footer>
        </div>
    </>
  );
};

export default StoreHelpChatbot;

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Mail,
  Inbox,
  PenSquare,
  LayoutTemplate,
  Zap,
  Megaphone,
  ContactRound,
  Settings,
  Smartphone,
  MessagesSquare,
  Bell,
  Sparkles,
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useAdminInnerLayer } from '../../../hooks/useAdminInnerLayer';
import { getStoreDisplayName } from '../../../utils/storeLocalization';
import { PortalHubCard } from '../../common/PortalHubCard';
import { labelForNav, STORE_NAV_KEYS } from '../../../i18n/nav';
import { STORE_COMM_CHANNEL_SOON_TABS } from '../../../config/storeTabVisibility';
import { WhatsAppMessageCenter } from './WhatsAppMessageCenter';
import { WhatsAppComposeTemplates } from './WhatsAppComposeTemplates';
import { WhatsAppContactsSegments } from './WhatsAppContactsSegments';
import { WhatsAppSettingsLogs } from './WhatsAppSettingsLogs';
import { WhatsAppAutomations } from './WhatsAppAutomations';
import { WhatsAppCampaigns } from './WhatsAppCampaigns';
import { WhatsAppAutoReply } from './WhatsAppAutoReply';
import { Bot } from 'lucide-react';

/** Equal card grid — same columns for every hub section (no uneven rows). */
const HUB_GRID =
  'u-equal-sections grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 w-full';

export type WhatsAppSubView =
  | 'center'
  | 'compose'
  | 'templates'
  | 'automations'
  | 'auto-reply'
  | 'campaigns'
  | 'contacts'
  | 'settings';

const WA_VIEWS: WhatsAppSubView[] = [
  'center',
  'compose',
  'templates',
  'automations',
  'auto-reply',
  'campaigns',
  'contacts',
  'settings',
];

interface Props {
  initialSubView?: WhatsAppSubView | null;
  onNavigateTab?: (tab: string) => void;
}

export const StoreWhatsAppManager: React.FC<Props> = ({
  initialSubView = null,
  onNavigateTab,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();

  // null = hub cards only (same pattern as Social Publishing)
  const [currentSubView, setCurrentSubView] = useState<WhatsAppSubView | null>(initialSubView);
  const [navContextData, setNavContextData] = useState<any>(null);

  const backToHub = useCallback(() => {
    setNavContextData(null);
    setCurrentSubView(null);
  }, []);
  const { requestClose: requestCloseWaInner } = useAdminInnerLayer(
    currentSubView !== null,
    backToHub,
  );

  useEffect(() => {
    const applyView = (view: string | null | undefined) => {
      if (view === 'hub' || view === 'home' || view === '') {
        setCurrentSubView(null);
        return;
      }
      if (view && WA_VIEWS.includes(view as WhatsAppSubView)) {
        setCurrentSubView(view as WhatsAppSubView);
      }
    };
    const handleSubViewChange = (e: CustomEvent<string>) => {
      applyView(e.detail);
    };

    window.addEventListener('unityteck-whatsapp-view' as any, handleSubViewChange);
    try {
      const saved = sessionStorage.getItem('unityteck-whatsapp-view');
      if (saved) {
        applyView(saved);
        sessionStorage.removeItem('unityteck-whatsapp-view');
      }
    } catch {
      /* storage may be unavailable */
    }
    return () => {
      window.removeEventListener('unityteck-whatsapp-view' as any, handleSubViewChange);
    };
  }, []);

  const handleNavigate = (view: string, initialData?: any) => {
    setNavContextData(initialData || null);
    if (WA_VIEWS.includes(view as WhatsAppSubView)) {
      setCurrentSubView(view as WhatsAppSubView);
    }
  };

  const storeName = getStoreDisplayName(activeStore, locale) || activeStore?.name || '';

  const soonIcon = (id: string) => {
    if (id === 'email') return Mail;
    if (id === 'sms') return Smartphone;
    if (id === 'live-chat') return MessagesSquare;
    if (id === 'in-app-notifications') return Bell;
    return Sparkles;
  };

  return (
    <div
      className="u-page w-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-w-0"
      style={{ fontFamily: 'var(--font-ui)', color: 'var(--text)' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header — same density as Social Publishing */}
      <div
        className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg shrink-0"
              style={{ background: 'var(--portal-cta)' }}
            >
              <Mail className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'أدوات التواصل' : 'Communication Tools'}
                </h1>
                {storeName ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    {storeName}
                  </span>
                ) : null}
              </div>
              <p className="text-sm mt-0.5 font-semibold" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'واتساب يعمل الآن لهذا المتجر. القنوات الأخرى قريباً. أدوات الذكاء الاصطناعي في صفحة واحدةحدة.'
                  : 'WhatsApp is live for this store. Other channels coming soon. All AI tools are on one page.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hub: equal-size cards · real WhatsApp vs soon channels · AI elsewhere */}
      {currentSubView === null ? (
        <div className="space-y-6">
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                {isAr ? 'واتساب — يعمل الآن' : 'WhatsApp — live'}
              </h2>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'رسائل حقيقية لهذا المتجر فقط (بدون بيانات وهمية).'
                  : 'Real messaging for this store only (no fake data).'}
              </p>
            </div>
            <div className={HUB_GRID}>
              <PortalHubCard
                icon={Inbox}
                title={isAr ? 'مركز الرسائل' : 'Message Center'}
                description={
                  isAr
                    ? 'عرض المحادثات وحالة التسليم لهذا المتجر.'
                    : 'Inbox, delivery status and conversations for this store.'
                }
                onClick={() => handleNavigate('center')}
                isAr={isAr}
              />
              <PortalHubCard
                icon={PenSquare}
                title={isAr ? 'إنشاء رسالة' : 'Compose Message'}
                description={
                  isAr
                    ? 'كتابة وإرسال رسالة واتساب للعملاء.'
                    : 'Write and send a WhatsApp message to customers.'
                }
                onClick={() => handleNavigate('compose')}
                isAr={isAr}
              />
              <PortalHubCard
                icon={LayoutTemplate}
                title={isAr ? 'القوالب' : 'Templates'}
                description={
                  isAr
                    ? 'قوالب الرسائل المعتمدة لهذا المتجر.'
                    : 'Approved message templates for this store.'
                }
                onClick={() => handleNavigate('templates')}
                isAr={isAr}
              />
              <PortalHubCard
                icon={Zap}
                title={isAr ? 'الأتمتة' : 'Automations'}
                description={
                  isAr
                    ? 'ردود وقواعد تلقائية حسب أحداث المتجر.'
                    : 'Auto replies and rules tied to store events.'
                }
                onClick={() => handleNavigate('automations')}
                isAr={isAr}
              />
              <PortalHubCard
                icon={Bot}
                title={isAr ? 'الرد التلقائي على الأرقام' : 'Auto Reply & Real Numbers'}
                description={
                  isAr
                    ? 'الرد الآلي على الأرقام الحقيقية ومساعد الذكاء الاصطناعي.'
                    : 'Real-time auto reply and Gemini AI smart customer care.'
                }
                onClick={() => handleNavigate('auto-reply')}
                isAr={isAr}
              />
              <PortalHubCard
                icon={Megaphone}
                title={isAr ? 'الحملات' : 'Campaigns'}
                description={
                  isAr
                    ? 'بث حملات واتساب وجدولة الإرسال.'
                    : 'Broadcast WhatsApp campaigns and schedule sends.'
                }
                onClick={() => handleNavigate('campaigns')}
                isAr={isAr}
              />
              <PortalHubCard
                icon={ContactRound}
                title={isAr ? 'جهات الاتصال والشرائح' : 'Contacts & Segments'}
                description={
                  isAr
                    ? 'قوائم العملاء والشرائح لهذا المتجر.'
                    : 'Customer lists and segments for this store.'
                }
                onClick={() => handleNavigate('contacts')}
                isAr={isAr}
              />
              <PortalHubCard
                icon={Settings}
                title={isAr ? 'الإعدادات' : 'Settings'}
                description={
                  isAr
                    ? 'ربط واتساب وسجلات الإرسال لهذا المتجر.'
                    : 'WhatsApp connection and send logs for this store.'
                }
                onClick={() => handleNavigate('settings')}
                isAr={isAr}
              />
            </div>
          </section>

          {onNavigateTab ? (
            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'قنوات أخرى — قريباً' : 'Other channels — soon'}
                </h2>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'ليست أدوات ذكاء اصطناعي — قنوات مراسلة إضافية لهذا المتجر.'
                    : 'Not AI tools — extra messaging channels for this store.'}
                </p>
              </div>
              <div className={HUB_GRID}>
                {STORE_COMM_CHANNEL_SOON_TABS.map((id) => (
                  <PortalHubCard
                    key={id}
                    icon={soonIcon(id)}
                    title={`${labelForNav(locale, STORE_NAV_KEYS, id)} · ${isAr ? 'قريباً' : 'Soon'}`}
                    description={
                      isAr
                        ? 'هذه القناة غير متاحة بعد لهذا المتجر.'
                        : 'This channel is not available for this store yet.'
                    }
                    onClick={() => onNavigateTab(id)}
                    isAr={isAr}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {onNavigateTab ? (
            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'أدوات الذكاء الاصطناعي' : 'AI Tools'}
                </h2>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'النص والصور والأتمتة والتشخيص — كلها في صفحة واحدةحدة.'
                    : 'Text, images, automation, diagnostics — all on one page.'}
                </p>
              </div>
              <div className={HUB_GRID}>
                <PortalHubCard
                  icon={Sparkles}
                  title={isAr ? 'فتح أدوات الذكاء' : 'Open AI Tools'}
                  description={
                    isAr
                      ? 'كل أدوات الذكاء الاصطناعي لهذا المتجر في مكان واحد.'
                      : 'All AI tools for this store in one place.'
                  }
                  onClick={() => onNavigateTab('ai-media')}
                  isAr={isAr}
                />
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => requestCloseWaInner()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer shadow-xs"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} aria-hidden />
            {isAr ? 'كل أقسام التواصل' : 'All communication sections'}
          </button>
        </div>
      )}

      {currentSubView === 'center' && (
        <WhatsAppMessageCenter onNavigateSubView={handleNavigate} />
      )}

      {(currentSubView === 'compose' || currentSubView === 'templates') && (
        <WhatsAppComposeTemplates
          initialTab={currentSubView === 'templates' ? 'templates' : 'compose'}
          initialData={navContextData}
          onNavigateSubView={handleNavigate}
        />
      )}

      {currentSubView === 'contacts' && (
        <WhatsAppContactsSegments onNavigateSubView={handleNavigate} />
      )}

      {currentSubView === 'settings' && (
        <WhatsAppSettingsLogs onNavigateSubView={handleNavigate} />
      )}

      {currentSubView === 'automations' && (
        <WhatsAppAutomations onNavigateSubView={handleNavigate} />
      )}

      {currentSubView === 'auto-reply' && (
        <WhatsAppAutoReply onNavigateSubView={handleNavigate} />
      )}

      {currentSubView === 'campaigns' && (
        <WhatsAppCampaigns onNavigateSubView={handleNavigate} />
      )}
    </div>
  );
};

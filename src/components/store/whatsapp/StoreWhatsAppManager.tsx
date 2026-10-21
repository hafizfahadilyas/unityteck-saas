import React, { useState, useEffect } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { WhatsAppMessageCenter } from './WhatsAppMessageCenter';
import { WhatsAppComposeTemplates } from './WhatsAppComposeTemplates';
import { WhatsAppContactsSegments } from './WhatsAppContactsSegments';
import { WhatsAppSettingsLogs } from './WhatsAppSettingsLogs';
import { WhatsAppAutomations } from './WhatsAppAutomations';
import { WhatsAppCampaigns } from './WhatsAppCampaigns';

export type WhatsAppSubView =
  | 'center'
  | 'compose'
  | 'templates'
  | 'automations'
  | 'campaigns'
  | 'contacts'
  | 'settings';

interface Props {
  initialSubView?: WhatsAppSubView;
  onNavigateTab?: (tab: string) => void;
}

export const StoreWhatsAppManager: React.FC<Props> = ({
  initialSubView = 'center',
  onNavigateTab,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();

  const [currentSubView, setCurrentSubView] = useState<WhatsAppSubView>(initialSubView);
  const [navContextData, setNavContextData] = useState<any>(null);

  // Listen to custom navigation events from StoreSidebar
  useEffect(() => {
    const handleSubViewChange = (e: CustomEvent<string>) => {
      const view = e.detail as WhatsAppSubView;
      if (
        ['center', 'compose', 'templates', 'automations', 'campaigns', 'contacts', 'settings'].includes(
          view,
        )
      ) {
        setCurrentSubView(view);
      }
    };

    window.addEventListener('unityteck-whatsapp-view' as any, handleSubViewChange);
    return () => {
      window.removeEventListener('unityteck-whatsapp-view' as any, handleSubViewChange);
    };
  }, []);

  const handleNavigate = (view: string, initialData?: any) => {
    setNavContextData(initialData || null);
    setCurrentSubView(view as WhatsAppSubView);
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-w-0">
      {/* Screen 1: WhatsApp Message Center */}
      {currentSubView === 'center' && (
        <WhatsAppMessageCenter onNavigateSubView={handleNavigate} />
      )}

      {/* Screen 2: Compose Message & Templates */}
      {(currentSubView === 'compose' || currentSubView === 'templates') && (
        <WhatsAppComposeTemplates
          initialTab={currentSubView === 'templates' ? 'templates' : 'compose'}
          initialData={navContextData}
          onNavigateSubView={handleNavigate}
        />
      )}

      {/* Screen 3: Contacts & Segments */}
      {currentSubView === 'contacts' && (
        <WhatsAppContactsSegments onNavigateSubView={handleNavigate} />
      )}

      {/* Screen 4: Settings & Logs */}
      {currentSubView === 'settings' && (
        <WhatsAppSettingsLogs onNavigateSubView={handleNavigate} />
      )}

      {/* Screen 5: Automations */}
      {currentSubView === 'automations' && (
        <WhatsAppAutomations onNavigateSubView={handleNavigate} />
      )}

      {/* Screen 6: Campaigns */}
      {currentSubView === 'campaigns' && (
        <WhatsAppCampaigns onNavigateSubView={handleNavigate} />
      )}
    </div>
  );
};

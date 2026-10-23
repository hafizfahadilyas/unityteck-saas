import React from 'react';
import { MessageCircle } from 'lucide-react';
import { FLOWERS_WHATSAPP } from './pack';
import { readStoreIdentity } from '../settings/storeIdentity';

type Props = {
  lang: string;
  productName?: string;
  isAdmin?: boolean;
  storeId?: string;
  storeName?: string;
  phone?: string;
};

export const WhatsAppChatFab: React.FC<Props> = ({
  lang,
  productName,
  isAdmin = false,
  storeId = 'store-1',
  storeName = 'متجر هدايا',
  phone,
}) => {
  if (isAdmin) return null;

  const identity = readStoreIdentity(storeId, { name: storeName });
  const activePhone = (phone || identity.whatsapp || FLOWERS_WHATSAPP.phone).replace(/[^0-9]/g, '');

  const msg =
    (lang === 'ar' ? FLOWERS_WHATSAPP.defaultMessageAr : FLOWERS_WHATSAPP.defaultMessageEn) +
    (productName ? ` — ${productName}` : '');
  const href = `https://wa.me/${activePhone}?text=${encodeURIComponent(msg)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 end-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#25D366] text-white text-xs font-black shadow-lg shadow-emerald-900/30 hover:brightness-105 transition-all"
      title={lang === 'ar' ? 'دردشة واتساب' : 'WhatsApp chat'}
    >
      <MessageCircle className="w-4 h-4" />
      <span className="hidden sm:inline">{lang === 'ar' ? 'دعم واتساب' : 'Chat support'}</span>
    </a>
  );
};

export function whatsappOrderHref(lang: string, lines: string[], phoneOverride?: string, storeId = 'store-1', storeName = 'متجر هدايا'): string {
  const identity = readStoreIdentity(storeId, { name: storeName });
  const activePhone = (phoneOverride || identity.whatsapp || FLOWERS_WHATSAPP.phone).replace(/[^0-9]/g, '');
  const header = lang === 'ar' ? FLOWERS_WHATSAPP.defaultMessageAr : FLOWERS_WHATSAPP.defaultMessageEn;
  const body = [header, '', ...lines].join('\n');
  return `https://wa.me/${activePhone}?text=${encodeURIComponent(body)}`;
}

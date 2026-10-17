/**
 * @file NotificationCard.tsx
 * Memoized card component enforcing:
 * - Rule 1: Strict 4-condition WhatsApp button guard
 * - Rule 2: Verified data source & stale data badge
 * - Responsive desktop horizontal, tablet, and mobile vertical stack
 */

import React, { memo, useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  CheckCheck,
  Clock,
  Trash2,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  ShoppingCart,
  Tag,
  Coins,
  Sparkles,
  Share2,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { NotificationItem } from '../types/notification.types';
import { getCategoryTheme } from '../config/colorMap';
import { formatRelativeTime } from '../utils/dateFilters';
import { WhatsAppService } from '../services/whatsappService';
import { usePrefs } from '../../i18n/PrefsContext';

interface NotificationCardProps {
  notification: NotificationItem;
  onAction: (item: NotificationItem) => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = memo(({
  notification,
  onAction,
  onMarkRead,
  onDismiss,
  onSnooze,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const categoryTheme = getCategoryTheme(notification.category);
  const relativeTime = formatRelativeTime(notification.timestamp, locale);

  // STRICT RULE 1: WhatsApp Button Visibility Guard
  const canShowWhatsApp =
    notification.whatsappEligible &&
    WhatsAppService.canSendWhatsApp(notification.customer);

  // Category specific icon
  const renderCategoryIcon = () => {
    const cat = notification.category;
    if (cat === 'Abandoned Cart') return <ShoppingCart className="w-5 h-5" />;
    if (cat === 'Special Offer' || cat === 'Marketing & Offers') return <Sparkles className="w-5 h-5" />;
    if (cat === 'Coupon') return <Tag className="w-5 h-5" />;
    if (cat === 'Loyalty Points' || cat === 'Cashback') return <Coins className="w-5 h-5" />;
    if (cat === 'Social Media' || ['Instagram', 'Facebook', 'TikTok', 'Snapchat', 'X', 'Pinterest', 'YouTube'].includes(cat)) {
      return <Share2 className="w-5 h-5" />;
    }
    if (cat === 'Google Ads') return <TrendingUp className="w-5 h-5" />;
    if (cat === 'Products & Inventory') return <Package className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  const actionText = isAr
    ? notification.actionLabelAr || notification.actionLabel
    : notification.actionLabel;

  const titleText = isAr
    ? notification.titleAr || notification.title
    : notification.title;

  const descText = isAr
    ? notification.descriptionAr || notification.description
    : notification.description;

  return (
    <div
      className={`group relative p-4 transition-all duration-200 border-b last:border-b-0 ${
        notification.read
          ? 'bg-transparent opacity-90'
          : 'bg-emerald-50/20 dark:bg-emerald-950/10'
      } hover:bg-slate-50/80 dark:hover:bg-slate-800/40`}
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Unread indicator dot */}
      {!notification.read && (
        <span className="absolute start-1.5 top-5 w-2 h-2 rounded-full bg-emerald-500" />
      )}

      {/* Main card row: Desktop horizontal, Tablet wrap, Mobile vertical stack */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Left Side Group: Time + Icon + Content */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* 1. Timestamp block (80px fixed width on desktop) */}
          <div className="hidden lg:block w-20 shrink-0 text-start text-xs font-medium text-slate-400 dark:text-slate-500 leading-tight">
            {relativeTime}
          </div>

          {/* 2. Category Icon (40x40 circle) */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs ${categoryTheme.iconBg} ${categoryTheme.iconColor}`}
          >
            {renderCategoryIcon()}
          </div>

          {/* 3. Content block */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="lg:hidden text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {relativeTime} ·
              </span>
              <h4
                className="text-sm font-bold truncate leading-snug tracking-tight"
                style={{ color: 'var(--text)' }}
              >
                {titleText}
              </h4>

              {/* STRICT RULE 2: Stale Data & Verified Data Badges */}
              {notification.dataSource && (
                <div className="flex items-center gap-1.5">
                  {notification.dataSource.is_stale ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      <span>{isAr ? 'البيانات قد تكون قديمة' : 'Data may be outdated'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{isAr ? 'بيانات مؤكدة' : 'Verified'}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {descText}
            </p>

            {/* Verified timestamp indication */}
            {notification.dataSource && (
              <span className="block mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                {isAr
                  ? `آخر مزامنة مع ${notification.dataSource.source_name}: ${formatRelativeTime(notification.dataSource.last_synced_at, locale)}`
                  : `Last synced via ${notification.dataSource.source_name}: ${formatRelativeTime(notification.dataSource.last_synced_at, locale)}`}
              </span>
            )}
          </div>
        </div>

        {/* Right Side Group: Category Badge + Action Button + 3-Dot Menu */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          {/* 4. Category Badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${categoryTheme.badgeBg} ${categoryTheme.badgeText} ${categoryTheme.darkBadgeBg} ${categoryTheme.darkBadgeText} ${categoryTheme.badgeBorder || 'border-transparent'}`}
          >
            {notification.category}
          </span>

          {/* 5. Action Button (Rule 1: Only renders WhatsApp if all 4 conditions met) */}
          {canShowWhatsApp ? (
            <button
              type="button"
              onClick={() => onAction(notification)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{actionText}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAction(notification)}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer hover:border-emerald-500 hover:text-emerald-600 active:scale-95 shadow-2xs"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </button>
          )}

          {/* 6. Three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer text-slate-500"
              aria-label="Actions menu"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute end-0 top-full mt-1.5 z-40 w-44 rounded-xl shadow-xl border p-1.5 backdrop-blur-md animate-in fade-in zoom-in-95"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                {!notification.read && (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkRead(notification.id);
                      setMenuOpen(false);
                    }}
                    className="w-full text-start flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? 'تحديد كمقروء' : 'Mark as read'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onSnooze(notification.id, 60);
                    setMenuOpen(false);
                  }}
                  className="w-full text-start flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? 'تأجيل لمدة ساعة' : 'Snooze for 1 hour'}</span>
                </button>
                <div
                  className="my-1 border-t"
                  style={{ borderColor: 'var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    onDismiss(notification.id);
                    setMenuOpen(false);
                  }}
                  className="w-full text-start flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تجاهل الإشعار' : 'Dismiss'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

NotificationCard.displayName = 'NotificationCard';

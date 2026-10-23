import React, { useState, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { Customer, Order } from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Mail,
  Phone,
  Sparkles,
  Calendar,
  MapPin,
  Globe,
  Crown,
  Coins,
  Tag,
  Clock,
  ShoppingCart,
  Plus,
  Edit2,
  Copy,
  Check,
  X,
  Bot,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  FileText,
  Gift,
  Wallet,
  Activity,
  Send,
  Loader2,
  Camera,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { CustomerAvatarUploadModal } from './CustomerAvatarUploadModal';
import { getArabCustomerAvatar, getCustomerSeoAlt } from '../../utils/customerAvatars';
import { handleImageError } from '../../utils/imageFallback';

interface CustomerDetailsProps {
  customer: Customer;
  onBack: () => void;
  onSelectCustomer?: (customerId: string) => void;
}

type TabType = 'orders' | 'loyalty' | 'coupons' | 'offers' | 'wallet' | 'activity';

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customer: initialCustomer,
  onBack,
}) => {
  const { activeStore, currentOrders, currentCoupons, updateCustomer } = useTenant();
  const { money, locale, t } = usePrefs();
  const isAr = locale === 'ar';

  const [customer, setCustomer] = useState<Customer>(() => ({
    ...initialCustomer,
    avatar: initialCustomer.avatar || getArabCustomerAvatar(initialCustomer),
  }));
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orderFilter, setOrderFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync when initialCustomer prop changes
  React.useEffect(() => {
    setCustomer({
      ...initialCustomer,
      avatar: initialCustomer.avatar || getArabCustomerAvatar(initialCustomer),
    });
  }, [initialCustomer]);

  // Edit Customer Info State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [firstName, setFirstName] = useState(
    customer.firstName || customer.name.split(' ')[0] || ''
  );
  const [lastName, setLastName] = useState(
    customer.lastName || customer.name.split(' ').slice(1).join(' ') || ''
  );
  const [email, setEmail] = useState(customer.email || '');
  const [phone, setPhone] = useState(customer.phone?.replace(/^\+966\s?/, '') || '');
  const [gender, setGender] = useState(customer.gender || 'Male');
  const [country, setCountry] = useState(customer.country || 'Saudi Arabia');
  const [city, setCity] = useState(customer.city || 'Jazan');
  const [state, setState] = useState(customer.state || 'Jazan');
  const [dob, setDob] = useState(customer.dob || '2005/07/31');
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSaveSuccess, setInfoSaveSuccess] = useState(false);

  // Marketing & Communication State
  const [isEditingMarketing, setIsEditingMarketing] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(customer.marketingEmails ?? true);
  const [whatsappMessages, setWhatsappMessages] = useState(customer.whatsappMessages ?? true);
  const [smsNotifications, setSmsNotifications] = useState(customer.smsNotifications ?? false);

  // Tags State
  const [tags, setTags] = useState<string[]>(
    customer.tags || ['Flower Lover', 'Regular Customer', 'Interested in Offers']
  );
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTagInput, setShowAddTagInput] = useState(false);

  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello! I have loaded the full profile for ${customer.name}. They are a ${customer.group || 'Regular'} customer from ${customer.city || 'Jazan'}. How can I assist you with tailored marketing or retention today?`,
    },
  ]);
  const [aiInputText, setAiInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Calculate real customer orders strictly isolated by storeId
  const customerOrders = useMemo(() => {
    return (currentOrders || []).filter((o: Order) => {
      if (o.storeId !== activeStore.id) return false;
      const matchEmail = o.customerEmail && customer.email && o.customerEmail.toLowerCase() === customer.email.toLowerCase();
      const matchPhone = o.customerPhone && customer.phone && (o.customerPhone.includes(customer.phone) || customer.phone.includes(o.customerPhone));
      const matchName = o.customerName && customer.name && o.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim();
      return matchEmail || matchPhone || matchName;
    });
  }, [currentOrders, activeStore.id, customer]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return customerOrders;
    if (orderFilter === 'completed') return customerOrders.filter((o) => (o.status as string).toLowerCase() === 'delivered' || (o.status as string).toLowerCase() === 'completed');
    if (orderFilter === 'pending') return customerOrders.filter((o) => (o.status as string).toLowerCase() === 'pending' || (o.status as string).toLowerCase() === 'processing');
    if (orderFilter === 'cancelled') return customerOrders.filter((o) => (o.status as string).toLowerCase() === 'cancelled');
    return customerOrders;
  }, [customerOrders, orderFilter]);

  // Real store coupons
  const storeCoupons = useMemo(() => {
    return (currentCoupons || []).filter((c) => c.storeId === activeStore.id);
  }, [currentCoupons, activeStore.id]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const formattedPhone = phone.startsWith('+') ? phone : `+966${phone.trim()}`;

    const updates: Partial<Customer> = {
      name: fullName,
      firstName,
      lastName,
      email: email.trim(),
      phone: formattedPhone,
      gender: gender as 'Male' | 'Female' | 'Other',
      country,
      city,
      state,
      dob,
    };

    updateCustomer(customer.id, updates);
    setCustomer((prev) => ({ ...prev, ...updates }));
    setIsSavingInfo(false);
    setIsEditingInfo(false);
    setInfoSaveSuccess(true);
    setTimeout(() => setInfoSaveSuccess(false), 2500);
  };

  const handleToggleMarketing = (key: 'emails' | 'whatsapp' | 'sms', value: boolean) => {
    let updates: Partial<Customer> = {};
    if (key === 'emails') {
      setMarketingEmails(value);
      updates = { marketingEmails: value };
    } else if (key === 'whatsapp') {
      setWhatsappMessages(value);
      updates = { whatsappMessages: value };
    } else if (key === 'sms') {
      setSmsNotifications(value);
      updates = { smsNotifications: value };
    }
    updateCustomer(customer.id, updates);
    setCustomer((prev) => ({ ...prev, ...updates }));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    updateCustomer(customer.id, { tags: updatedTags });
    setCustomer((prev) => ({ ...prev, tags: updatedTags }));
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const trimmed = newTagInput.trim();
    if (!tags.includes(trimmed)) {
      const updatedTags = [...tags, trimmed];
      setTags(updatedTags);
      updateCustomer(customer.id, { tags: updatedTags });
      setCustomer((prev) => ({ ...prev, tags: updatedTags }));
    }
    setNewTagInput('');
    setShowAddTagInput(false);
  };

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInputText.trim() || isAiTyping) return;
    const userText = aiInputText.trim();
    setAiChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setAiInputText('');
    setIsAiTyping(true);

    setTimeout(() => {
      let reply = `Based on ${customer.name}'s profile in ${activeStore.name}, they have high purchase propensity. Sending a personalized WhatsApp coupon code for free delivery on floral bouquets has an estimated 32% conversion rate.`;
      if (userText.toLowerCase().includes('discount') || userText.toLowerCase().includes('offer')) {
        reply = `I recommend generating a 15% VIP discount coupon valid for 7 days. ${customer.name} frequently interacts on WhatsApp and responds best to seasonal floral promotions.`;
      } else if (userText.toLowerCase().includes('order')) {
        reply = `${customer.name} currently has ${customerOrders.length} confirmed orders with a total value of ${money(customer.totalSpending || 0)}.`;
      }
      setAiChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      setIsAiTyping(false);
    }, 900);
  };

  const cleanPhoneForWa = customer.phone?.replace(/[^0-9]/g, '') || '966508146695';
  const loyaltyPointsCount = customer.loyaltyPoints ?? 240;
  const cashbackAmount = customer.cashbackBalance ?? 18.0;
  const availableCouponsCount = customer.availableCoupons ?? Math.max(storeCoupons.length, 3);
  const expiringSoonCount = customer.expiringSoonCount ?? 1;

  const aiInsightsList = customer.aiInsights && customer.aiInsights.length > 0
    ? customer.aiInsights
    : [
        isAr ? 'احتمالية عالية لإعادة الشراء' : 'High chance to purchase again',
        isAr ? 'مهتم بالعروض والمنتجات المميزة' : 'Interested in premium catalog & offers',
        isAr ? 'يفضل الخصومات والتوصيل السريع' : 'Prefers discounts and fast delivery',
        isAr ? 'نشط عبر واتساب' : 'Active on WhatsApp',
      ];

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950/40 min-h-screen">
      {/* Toast Notification */}
      {infoSaveSuccess && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-top duration-200 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>{isAr ? 'تم تحديث بيانات العميل بنجاح!' : 'Customer details updated successfully!'}</span>
        </div>
      )}

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium cursor-pointer"
            >
              {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{isAr ? 'العملاء' : 'Customers'}</span>
            </button>
            <span>&gt;</span>
            <span className="text-slate-700 dark:text-slate-200 font-semibold">
              {isAr ? 'تفاصيل العميل' : 'Customer Details'}
            </span>
          </div>

          {/* Title Row with vertical teal accent bar */}
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 rounded-full bg-teal-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'تفاصيل العميل' : 'Customer Details'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 pl-4">
            {isAr
              ? 'عرض وإدارة بيانات العميل، سجل الطلبات، نقاط المكافآت والمزيد.'
              : 'View and manage customer information, orders, loyalty points, and more.'}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Action */}
          <a
            href={`https://wa.me/${cleanPhoneForWa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all"
          >
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <span>{isAr ? 'مراسلة عبر واتساب' : 'Send via WhatsApp'}</span>
          </a>

          {/* Email Action */}
          <a
            href={`mailto:${customer.email}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 shadow-sm transition-all"
          >
            <Mail className="w-4 h-4 text-teal-600" />
            <span>{isAr ? 'إرسال بريد إلكتروني' : 'Send Email'}</span>
          </a>

          {/* Call Action */}
          <a
            href={`tel:${customer.phone}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-all"
          >
            <Phone className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'اتصال بالعميل' : 'Call Customer'}</span>
          </a>

          {/* Chat with AI */}
          <button
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:border-purple-400 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <span>{isAr ? 'محادثة الذكاء الاصطناعي' : 'Chat with AI'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left 2/3 Content & Right 1/3 Sidebars */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 of 12) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Customer Profile Hero Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Profile Avatar & Details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-start">
                {/* Avatar with Status Dot & Change Photo Action */}
                <div className="flex flex-col items-center sm:items-start shrink-0">
                  <div className="relative group">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-teal-100 to-emerald-100 dark:from-teal-950 dark:to-slate-800 border-2 border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-200 font-bold text-2xl shadow-inner overflow-hidden">
                      {customer.avatar ? (
                        <img
                          src={customer.avatar}
                          alt={getCustomerSeoAlt(customer, activeStore?.name, isAr)}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => handleImageError(e)}
                          className="w-full h-full rounded-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <span>{customer.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs" />

                    {/* Hover Camera Overlay Button */}
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(true)}
                      className="absolute inset-0 rounded-full bg-slate-950/60 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]"
                      title={isAr ? 'تغيير صورة العميل' : 'Change customer photo'}
                    >
                      <Camera className="w-5 h-5 drop-shadow" />
                      <span className="text-[10px] font-bold mt-0.5 drop-shadow">
                        {isAr ? 'تغيير' : 'Change'}
                      </span>
                    </button>
                  </div>

                  {/* Explicit Button under avatar */}
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(true)}
                    className="mt-2 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isAr ? 'تغيير الصورة' : 'Change Photo'}</span>
                  </button>
                </div>

                {/* Identity Info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                      {customer.name}
                    </h2>
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {customer.group === 'VIP'
                        ? isAr ? 'عميل VIP' : 'VIP Customer'
                        : isAr ? 'عميل عادي' : 'Regular Customer'}
                    </span>
                  </div>

                  {/* Location & Language */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isAr ? 'المملكة العربية السعودية' : (customer.country || 'Saudi Arabia')}, {customer.city || (isAr ? 'جازان' : 'Jazan')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isAr ? 'العربية' : (customer.language || 'Arabic')}</span>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {isAr
                        ? `عضو منذ ${customer.registeredDate || '23 يوليو 2026'}`
                        : `Member since ${customer.registeredDate || 'Jul 23, 2026'}`}
                    </span>
                  </div>

                  {/* Contact Badges Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {/* Phone pill */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{customer.phone || '+966508146695'}</span>
                      <button
                        onClick={() => handleCopy(customer.phone || '+966508146695', 'phone')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 transition-colors cursor-pointer"
                        title={isAr ? 'نسخ رقم الهاتف' : 'Copy phone'}
                      >
                        {copiedField === 'phone' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* WhatsApp Quick Icon */}
                    <a
                      href={`https://wa.me/${cleanPhoneForWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                      title={isAr ? 'فتح محادثة واتساب' : 'Open WhatsApp chat'}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>

                    {/* Email pill */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[170px]">{customer.email || 'naser@example.com'}</span>
                      <button
                        onClick={() => handleCopy(customer.email || 'naser@example.com', 'email')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 transition-colors cursor-pointer"
                        title={isAr ? 'نسخ البريد الإلكتروني' : 'Copy email'}
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights Card */}
              <div className="lg:w-72 bg-gradient-to-br from-teal-50/70 via-slate-50/60 to-emerald-50/50 dark:from-teal-950/30 dark:via-slate-900 dark:to-emerald-950/20 border border-teal-100 dark:border-teal-900/50 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Bot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{isAr ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {isAr ? 'تجريبي' : 'Beta'}
                  </span>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {aiInsightsList.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                      <span className="leading-snug">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 4 Benefit Metric Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Loyalty Points */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-sm hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-sm">
                  <Crown className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAr ? 'نقاط الولاء' : 'Loyalty Points'}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{loyaltyPointsCount}</p>
              </div>
              <button
                onClick={() => setActiveTab('loyalty')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
              >
                <span>{isAr ? 'عرض السجل' : 'View History'}</span>
                <span className={`text-xs ${isAr ? 'rotate-180' : ''}`}>&rarr;</span>
              </button>
            </div>

            {/* Cashback Balance */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-sm hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAr ? 'رصيد الكاش باك' : 'Cashback Balance'}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{money(cashbackAmount)}</p>
              </div>
              <button
                onClick={() => setActiveTab('wallet')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
              >
                <span>{isAr ? 'عرض السجل' : 'View History'}</span>
                <span className={`text-xs ${isAr ? 'rotate-180' : ''}`}>&rarr;</span>
              </button>
            </div>

            {/* Available Coupons */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-sm hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-sm">
                  <Tag className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAr ? 'الكوبونات المتاحة' : 'Available Coupons'}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{availableCouponsCount}</p>
              </div>
              <button
                onClick={() => setActiveTab('coupons')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
              >
                <span>{isAr ? 'عرض الكوبونات' : 'View Coupons'}</span>
                <span className={`text-xs ${isAr ? 'rotate-180' : ''}`}>&rarr;</span>
              </button>
            </div>

            {/* Expiring Soon */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-sm hover:border-rose-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isAr ? 'تنتهي قريباً' : 'Expiring Soon'}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{expiringSoonCount}</p>
              </div>
              <button
                onClick={() => setActiveTab('coupons')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
              >
                <span>{isAr ? 'عرض التفاصيل' : 'View Details'}</span>
                <span className={`text-xs ${isAr ? 'rotate-180' : ''}`}>&rarr;</span>
              </button>
            </div>
          </div>

          {/* Dynamic Tabs Navigation */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-sm overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <button
                onClick={() => setActiveTab('orders')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {isAr ? `سجل الطلبات (${customerOrders.length})` : `Order History (${customerOrders.length})`}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('loyalty')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'loyalty'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>{isAr ? 'نقاط الولاء (2)' : 'Loyalty Points (2)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('coupons')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'coupons'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>{isAr ? `الكوبونات (${availableCouponsCount})` : `Coupons (${availableCouponsCount})`}</span>
              </button>

              <button
                onClick={() => setActiveTab('offers')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'offers'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>{isAr ? 'العروض (1)' : 'Offers (1)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('wallet')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'wallet'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>{isAr ? 'المحفظة والكاش باك' : 'Wallet & Cashback'}</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'activity'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>{isAr ? 'سجل النشاط' : 'Activity Logs'}</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Order History */}
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
              {/* Header & Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {isAr ? 'سجل الطلبات' : 'Order History'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isAr ? 'قائمة بجميع طلبات هذا العميل في المتجر.' : 'A list of all orders placed by this customer.'}
                    </p>
                  </div>
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value as any)}
                    className="appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="all">{isAr ? 'جميع الطلبات' : 'All Orders'}</option>
                    <option value="completed">{isAr ? 'المكتملة' : 'Completed'}</option>
                    <option value="pending">{isAr ? 'قيد الانتظار' : 'Pending'}</option>
                    <option value="cancelled">{isAr ? 'الملغية' : 'Cancelled'}</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Table / Empty State */}
              {filteredOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-3 font-semibold text-start">#</th>
                        <th className="py-3 px-3 font-semibold text-start">{isAr ? 'تاريخ الطلب' : 'Order Date'}</th>
                        <th className="py-3 px-3 font-semibold text-start">{isAr ? 'المنتجات' : 'Items'}</th>
                        <th className="py-3 px-3 font-semibold text-start">{isAr ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                        <th className="py-3 px-3 font-semibold text-start">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="py-3 px-3 font-semibold text-start">{isAr ? 'طريقة الدفع' : 'Payment Method'}</th>
                        <th className="py-3 px-3 font-semibold text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredOrders.map((ord, idx) => (
                        <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                            {ord.orderNumber || `#${idx + 1}`}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : (isAr ? 'حديثاً' : 'Recent')}
                          </td>
                          <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                            {ord.itemsCount || 1} {isAr ? 'منتج' : 'items'}
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                            {money(ord.total || 0)}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {isAr ? 'مكتمل' : (ord.status || 'Completed')}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                            {ord.paymentMethod || (isAr ? 'مدى / أبل باي' : 'Mada / Apple Pay')}
                          </td>
                          <td className="py-3.5 px-3 text-end">
                            <button className="text-teal-600 hover:text-teal-700 font-semibold text-xs cursor-pointer">
                              {isAr ? 'عرض' : 'View'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* 100% Pixel-Perfect Empty State */
                <div className="py-14 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                    <FileText className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {isAr ? 'لا توجد طلبات سابقة' : 'No orders found'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    {isAr ? 'لم يقم هذا العميل بإجراء أي طلبات حتى الآن.' : "This customer hasn't placed any orders yet."}
                  </p>
                  <button
                    onClick={() => alert(isAr ? `بدء إنشاء طلب جديد للعميل ${customer.name} في متجر ${activeStore.name}` : `Starting new order creation for ${customer.name} in ${activeStore.name}`)}
                    className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'إنشاء طلب' : 'Create Order'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Loyalty Points */}
          {activeTab === 'loyalty' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'سجل نقاط الولاء' : 'Loyalty Points Ledger'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'سجل تدقيق للنقاط المكتسبة والمستبدلة والمعدلة.' : 'Audit trail of earned, redeemed, and adjusted points.'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 font-bold text-sm border border-teal-200 dark:border-teal-800">
                  {isAr ? `الإجمالي: ${loyaltyPointsCount} نقطة` : `Total: ${loyaltyPointsCount} pts`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'النوع' : 'Type'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'النقاط' : 'Points'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'المرجع / السبب' : 'Reference / Reason'}</th>
                      <th className="py-2.5 px-3 text-end">{isAr ? 'الرصيد' : 'Balance'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    <tr>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">2026/08/15</td>
                      <td className="py-3 px-3 font-semibold text-emerald-600">
                        {isAr ? 'مكتسبة (هدية ترحيبية)' : 'Earned (Welcome)'}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600">+100</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {isAr ? 'مكافأة التسجيل بالمتجر' : 'Store Registration Gift'}
                      </td>
                      <td className="py-3 px-3 text-end font-mono font-medium">100</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">2026/09/01</td>
                      <td className="py-3 px-3 font-semibold text-emerald-600">
                        {isAr ? 'مكتسبة (حملة ترويجية)' : 'Earned (Campaign)'}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600">+140</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {isAr ? 'مكافأة اليوم الوطني' : 'National Day Bonus'}
                      </td>
                      <td className="py-3 px-3 text-end font-mono font-medium">240</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Coupons */}
          {activeTab === 'coupons' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'الكوبونات وقسائم الشراء النشطة' : 'Active Coupons & Vouchers'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'كوبونات يمكن للعميل استخدامها عند الدفع.' : 'Coupons available for this customer in checkout.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-teal-200">
                      WELCOME15
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {isAr ? 'نشط' : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {isAr ? 'خصم 15% على أول طلب بقيمة تزيد عن 150 ر.س' : '15% off first order over SAR 150'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'صالح حتى: 30 نوفمبر 2026' : 'Valid until: Nov 30, 2026'}
                  </p>
                </div>

                <div className="border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-purple-200">
                      FREESHIP
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {isAr ? 'نشط' : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {isAr ? 'توصيل مجاني لجميع مناطق المملكة' : 'Free delivery across the region'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'صالح حتى: 31 ديسمبر 2026' : 'Valid until: Dec 31, 2026'}
                  </p>
                </div>

                <div className="border border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-rose-200">
                      VIPGIFT20
                    </span>
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      {isAr ? 'ينتهي قريباً (3 أيام)' : 'Expiring Soon (3 days)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {isAr ? 'استرداد نقدي 20 ر.س على باقات الهدايا' : 'SAR 20 cashback on special gift packages'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'صالح حتى: 21 أكتوبر 2026' : 'Valid until: Oct 21, 2026'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Offers */}
          {activeTab === 'offers' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'العروض المخصصة للعميل' : 'Personalized Offers'}
              </h3>
              <div className="border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl p-4 space-y-1.5">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-200">
                  {isAr ? 'عرض عطلة نهاية الأسبوع الخاص' : 'Weekend Special Package'}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {isAr
                    ? 'احصل على خصم 50% على الإضافات الفاخرة وبطاقات الإهداء عند طلبك القادم.'
                    : 'Get 50% discount on luxury gift additions and greeting cards on your next order.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 5: Wallet & Cashback */}
          {activeTab === 'wallet' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'سجل المحفظة والكاش باك' : 'Wallet & Cashback Ledger'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr ? 'الرصيد المتاح من رصيد المتجر والكاش باك.' : 'Available store credit and cashback balance.'}
                  </p>
                </div>
                <span className="text-base font-bold text-emerald-600">
                  {isAr ? `الرصيد: ${money(cashbackAmount)}` : `Balance: ${money(cashbackAmount)}`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'المعاملات: تم إيداع رصيد كاش باك ترحيبي بعد التحقق من الحساب (+18.00 ر.س).'
                  : 'Transactions: Initial cashback credited upon account verification (+SAR 18.00).'}
              </p>
            </div>
          )}

          {/* Tab 6: Activity Logs */}
          {activeTab === 'activity' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'سجل النشاط' : 'Activity Logs'}
              </h3>
              <ul className="space-y-3 text-xs">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-teal-500 mt-1.5" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {isAr ? 'تم الاطلاع على ملف العميل بواسطة مدير المتجر' : 'Profile accessed by Store Manager'}
                    </p>
                    <p className="text-[11px] text-slate-400">{isAr ? 'اليوم، الآن' : 'Today, just now'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 mt-1.5" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {isAr ? 'تسجيل العميل عبر واتساب' : 'Customer registered via WhatsApp'}
                    </p>
                    <p className="text-[11px] text-slate-400">{customer.registeredDate || '2026/07/23'}</p>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Right Column (4 of 12) Sidebars */}
        <div className="xl:col-span-4 space-y-6">
          {/* 1. Customer Information Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'بيانات العميل' : 'Customer Information'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-teal-600" />
                <span>
                  {isEditingInfo
                    ? isAr ? 'إلغاء' : 'Cancel'
                    : isAr ? 'تعديل' : 'Edit'}
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-3.5">
              {/* Profile Photo Quick Row */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                    {customer.avatar ? (
                      <img
                        src={customer.avatar}
                        alt={getCustomerSeoAlt(customer, activeStore?.name, isAr)}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                        {customer.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAr ? 'الصورة الشخصية للعميل' : 'Customer Profile Photo'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isAr ? 'حجم مربع 1:1 مخصص للمنطقة العربية' : '1:1 square photo, Arab region curated'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-teal-500 hover:text-teal-600 text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'تغيير' : 'Change'}</span>
                </button>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'الاسم الأول' : 'First Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'اسم العائلة' : 'Last Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  disabled={!isEditingInfo}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="text-sm">🇸🇦</span>
                    <span>+966</span>
                  </div>
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                  />
                  <a
                    href={`https://wa.me/${cleanPhoneForWa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Gender & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'الجنس' : 'Gender'}
                  </label>
                  <select
                    disabled={!isEditingInfo}
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Male">{isAr ? 'ذكر' : 'Male'}</option>
                    <option value="Female">{isAr ? 'أنثى' : 'Female'}</option>
                    <option value="Other">{isAr ? 'أخرى' : 'Other'}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'الدولة' : 'Country'}
                  </label>
                  <select
                    disabled={!isEditingInfo}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Saudi Arabia">{isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'}</option>
                    <option value="United Arab Emirates">{isAr ? 'الإمارات العربية المتحدة' : 'United Arab Emirates'}</option>
                    <option value="Kuwait">{isAr ? 'الكويت' : 'Kuwait'}</option>
                  </select>
                </div>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'المدينة' : 'City'}
                  </label>
                  <select
                    disabled={!isEditingInfo}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Jazan">{isAr ? 'جازان' : 'Jazan'}</option>
                    <option value="Makkah">{isAr ? 'مكة المكرمة' : 'Makkah'}</option>
                    <option value="Riyadh">{isAr ? 'الرياض' : 'Riyadh'}</option>
                    <option value="Jeddah">{isAr ? 'جدة' : 'Jeddah'}</option>
                    <option value="Dammam">{isAr ? 'الدمام' : 'Dammam'}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {isAr ? 'المنطقة' : 'State'}
                  </label>
                  <select
                    disabled={!isEditingInfo}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Jazan">{isAr ? 'منطقة جازان' : 'Jazan'}</option>
                    <option value="Makkah Province">{isAr ? 'منطقة مكة المكرمة' : 'Makkah Province'}</option>
                    <option value="Riyadh Province">{isAr ? 'منطقة الرياض' : 'Riyadh Province'}</option>
                    <option value="Eastern Province">{isAr ? 'المنطقة الشرقية' : 'Eastern Province'}</option>
                  </select>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? 'تاريخ الميلاد' : 'Date of Birth'}
                </label>
                <div className="relative">
                  <Calendar className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${isAr ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    disabled={!isEditingInfo}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="YYYY/MM/DD"
                    className={`w-full py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white disabled:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                  />
                </div>
              </div>

              {/* Save Button when in Edit mode */}
              {isEditingInfo && (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSavingInfo}
                    className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSavingInfo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(false)}
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* 2. Marketing & Communication Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'التسويق والتواصل' : 'Marketing & Communication'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingMarketing(!isEditingMarketing)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-teal-600" />
                <span>
                  {isEditingMarketing
                    ? isAr ? 'تم' : 'Done'
                    : isAr ? 'تعديل' : 'Edit'}
                </span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Marketing Emails */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-teal-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? 'استلام رسائل البريد التسويقية' : 'Receive marketing emails'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!isEditingMarketing}
                  onClick={() => handleToggleMarketing('emails', !marketingEmails)}
                  className={`w-10 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    marketingEmails ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  } disabled:opacity-90`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      marketingEmails ? (isAr ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* WhatsApp Messages */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? 'استلام رسائل واتساب' : 'Receive WhatsApp messages'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!isEditingMarketing}
                  onClick={() => handleToggleMarketing('whatsapp', !whatsappMessages)}
                  className={`w-10 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    whatsappMessages ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  } disabled:opacity-90`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      whatsappMessages ? (isAr ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? 'استلام إشعارات SMS' : 'Receive SMS notifications'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!isEditingMarketing}
                  onClick={() => handleToggleMarketing('sms', !smsNotifications)}
                  className={`w-10 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    smsNotifications ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  } disabled:opacity-90`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      smsNotifications ? (isAr ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Customer Tags Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'وسوم العميل' : 'Customer Tags'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddTagInput(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-teal-600" />
                <span>{isAr ? 'إضافة وسم' : 'Add Tag'}</span>
              </button>
            </div>

            {/* Tag Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {tags.map((tg) => (
                <span
                  key={tg}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 text-xs font-medium"
                >
                  <span>{tg}</span>
                  <button
                    onClick={() => handleRemoveTag(tg)}
                    className="text-teal-500 hover:text-teal-700 dark:hover:text-teal-100 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Inline Add Tag Input */}
              {showAddTagInput ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder={isAr ? 'اكتب الوسم...' : 'Type tag...'}
                    autoFocus
                    className="px-2.5 py-1 text-xs rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    onClick={handleAddTag}
                    className="p-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowAddTagInput(false)}
                    className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddTagInput(true)}
                  className="w-7 h-7 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-teal-600 hover:border-teal-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Chat Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {isAr
                      ? 'مساعد الذكاء الاصطناعي لتحليل وسلوك العملاء'
                      : 'AI Customer Intelligence & Retention Assistant'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? `السياق: ${customer.name} • ${activeStore.nameAr || activeStore.name}`
                      : `Context: ${customer.name} • ${activeStore.nameEn || activeStore.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-3 rounded-bl-sm text-slate-500 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    <span>
                      {isAr
                        ? 'الذكاء الاصطناعي يقوم بتحليل سلوك ونمط الشراء للعميل...'
                        : 'AI is analyzing customer purchase patterns...'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendAiMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder={
                  isAr
                    ? 'اسأل الذكاء الاصطناعي عن توصية تسويقية أو كوبون ولاء مخصص...'
                    : 'Ask AI for retention recommendation or personalized coupon...'
                }
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <button
                type="submit"
                disabled={!aiInputText.trim() || isAiTyping}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customer Avatar Media Upload Modal */}
      <CustomerAvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        customerId={customer.id}
        customerName={customer.name}
        customerGender={customer.gender}
        currentAvatar={customer.avatar}
        onAvatarUpdated={(newAvatarUrl) => {
          setCustomer((prev) => ({ ...prev, avatar: newAvatarUrl }));
        }}
      />
    </div>
  );
};

// Simple User Icon helper
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

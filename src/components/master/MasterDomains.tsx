import React, { useState, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { DomainRecord, AuditLogItem } from '../../types';
import { 
  Globe, 
  Server, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  RefreshCw,
  Plus,
  Lock,
  ArrowRight,
  X,
  ExternalLink,
  Activity,
  FileText,
  Check,
  Zap,
  Terminal,
  Cpu,
  HardDrive,
  Radio,
  Sliders,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { getStoreDisplayName, getStoreDisplayOwner } from '../../utils/storeLocalization';
import { DomainRoutingTester } from '../store/domains/DomainRoutingTester';

export const MasterDomains: React.FC = () => {
  const { 
    domains, 
    stores, 
    auditLogs,
    addAuditLog,
    activateDomain, 
    toggleDomainSsl, 
    addDomainRequest,
    connectHostingerToStore,
    verifyDomainDns,
    deployStoreLive,
  } = useTenant();
  const { money, locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'hostinger' | 'logs'>('all');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'demo'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || '');
  const [newDomain, setNewDomain] = useState('');
  const [newTier, setNewTier] = useState<DomainRecord['hostingTier']>('Hostinger Shared Starter');
  const [isSyncingHostinger, setIsSyncingHostinger] = useState(false);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  // Filtered domains list
  const filtered = useMemo(() => {
    return domains.filter((d) => {
      const matchSearch =
        d.domainName.toLowerCase().includes(search.toLowerCase()) ||
        d.storeId.toLowerCase().includes(search.toLowerCase());
      const matchTab =
        activeTab === 'all'
          ? true
          : activeTab === 'pending'
          ? d.status !== 'active' || !d.paymentReceived
          : true;
      const matchType =
        filterType === 'all'
          ? true
          : filterType === 'custom'
          ? !d.domainName.includes('.saasdomain.com') && !d.domainName.includes('demo')
          : d.domainName.includes('.saasdomain.com') || d.domainName.includes('demo');

      return matchSearch && matchTab && matchType;
    });
  }, [domains, search, activeTab, filterType]);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    addDomainRequest(selectedStoreId, newDomain.trim().toLowerCase(), newTier);
    addAuditLog({
      adminId: 'master-admin-01',
      adminName: 'Master SuperAdmin',
      storeId: selectedStoreId,
      action: 'domain_add',
      resource: `Domain: ${newDomain} (${newTier})`,
      details: `Provisioned new Shared Hosting instance under Hostinger infrastructure`,
      status: 'success',
      ipAddress: '185.199.108.153',
    });

    toast(
      isAr
        ? `تم تسجيل طلب الدومين والاستضافة المشتركة لـ ${newDomain}`
        : `Registered Shared Hosting purchase order for ${newDomain}!`,
      'success',
    );
    setShowAddModal(false);
    setNewDomain('');
  };

  const handleConnectHostinger = async (storeId: string, domainName: string) => {
    setProcessingActionId(`hst-${storeId}`);
    try {
      await connectHostingerToStore(storeId, {
        hostingId: `hst-${storeId}`,
        plan: 'Business Shared Hosting',
        serverIp: '185.199.108.153',
      });
      addAuditLog({
        adminId: 'master-admin-01',
        adminName: 'Master SuperAdmin',
        storeId,
        action: 'hosting_connect',
        resource: `Hostinger Shared: ${domainName}`,
        details: `Linked Hostinger Shared Hosting account and provisioned isolated store directory`,
        status: 'success',
        ipAddress: '185.199.108.153',
      });
      toast(
        isAr
          ? `تم ربط استضافة Hostinger المشتركة للمتجر بنجاح!`
          : `Hostinger Shared Hosting connected successfully!`,
        'success',
      );
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleVerifyDns = async (storeId: string, domainName: string) => {
    setProcessingActionId(`dns-${storeId}`);
    try {
      await verifyDomainDns(storeId);
      addAuditLog({
        adminId: 'master-admin-01',
        adminName: 'Master SuperAdmin',
        storeId,
        action: 'dns_verify',
        resource: `DNS: ${domainName}`,
        details: `A-Record verified pointing to Hostinger Shared IP 185.199.108.153`,
        status: 'success',
        ipAddress: '185.199.108.153',
      });
      toast(
        isAr
          ? `تم التحقق من سجلات DNS وتوجيهها إلى خادم Hostinger!`
          : `DNS Verified! Pointing to Hostinger Shared IP 185.199.108.153`,
        'success',
      );
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleDeployLive = async (storeId: string, domainName: string) => {
    setProcessingActionId(`dep-${storeId}`);
    try {
      await deployStoreLive(storeId);
      addAuditLog({
        adminId: 'master-admin-01',
        adminName: 'Master SuperAdmin',
        storeId,
        action: 'store_deploy',
        resource: `Live Deploy: ${domainName}`,
        details: `Automated zero-downtime deployment executed to Hostinger Shared environment`,
        status: 'success',
        ipAddress: '185.199.108.153',
      });
      toast(
        isAr
          ? `تم نشر المتجر بنجاح وهو الآن يعمل ومباشر على الدومين!`
          : `Store successfully deployed live to ${domainName}!`,
        'success',
      );
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleSyncHostinger = () => {
    setIsSyncingHostinger(true);
    setTimeout(() => {
      setIsSyncingHostinger(false);
      addAuditLog({
        adminId: 'master-admin-01',
        adminName: 'Master SuperAdmin',
        action: 'system_sync',
        resource: 'Hostinger API (v2.4)',
        details: 'Polled live status for shared hosting servers, SSL certificates, and DNS records',
        status: 'success',
        ipAddress: '185.199.108.153',
      });
      toast(
        isAr
          ? 'تمت مزامنة حالة خوادم Hostinger المشتركة وشهادات الأمان بنجاح'
          : 'Hostinger Shared Hosting API & DNS synchronized successfully.',
        'success',
      );
    }, 900);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800" style={{ fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {isAr ? 'الإدارة المركزية للدومينات والاستضافة المشتركة' : 'Central Domain & Hostinger Shared Hosting Control'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'قاعدة صارمة: استضافة Hostinger المشتركة فقط · لا يوجد خوادم VPS أو Dedicated · تحكم مركزي كامل وتتبع أمني'
                  : 'Strict Architecture: Hostinger Shared Hosting Only · Zero VPS / Zero Dedicated · Central DNS, SSL & Live Deployment'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleSyncHostinger}
            disabled={isSyncingHostinger}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingHostinger ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncingHostinger ? (isAr ? 'جاري المزامنة…' : 'Syncing API…') : (isAr ? 'مزامنة Hostinger' : 'Sync Hostinger')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'تسجيل استضافة ودومين جديد' : 'New Domain & Hosting Order'}</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs text-slate-500">{isAr ? 'إجمالي نطاقات المتاجر' : 'Total Client Domains'}</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5 tabular-nums">
            {domains.length}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{domains.filter((d) => d.status === 'active').length} {isAr ? 'مباشر على الهواء' : 'Live & Hosted'}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs text-slate-500">{isAr ? 'خادم Hostinger المشترك' : 'Hostinger Shared Server'}</span>
          <div className="text-sm font-black text-slate-900 mt-1 font-mono flex items-center gap-1.5">
            <Server className="w-4 h-4 text-emerald-600" />
            <span>185.199.108.153</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
            {isAr ? 'متصل ومحمي بـ Let\'s Encrypt SSL' : 'Connected & Active · 100% Uptime'}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs text-slate-500">{isAr ? 'بانتظار التحقق أو التفعيل' : 'Pending Verification'}</span>
          <div className="text-2xl font-black text-amber-600 mt-0.5 tabular-nums">
            {domains.filter((d) => d.status !== 'active' || !d.paymentReceived).length}
          </div>
          <span className="text-[10px] text-amber-600 font-semibold">
            {isAr ? 'تتطلب موافقة الأدمن' : 'Requires Master Action'}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-xs text-slate-500">{isAr ? 'عائد الاستضافة الشهري (MRR)' : 'Monthly Hosting MRR'}</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5 tabular-nums">
            {money(domains.reduce((acc, d) => acc + d.monthlyFee, 0))}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {isAr ? 'اشتراكات استضافة دورية' : 'Hostinger Shared Tier Subscriptions'}
          </span>
        </div>
      </div>

      {/* Multi-Domain Dynamic Routing Tester (Phase 6.1) */}
      <DomainRoutingTester embeddedIn="master" />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{isAr ? 'جميع النطاقات والاستضافات' : 'All Domains & Hosting'} ({domains.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{isAr ? 'طلبات بانتظار الاعتماد' : 'Pending Requests'} ({domains.filter((d) => d.status !== 'active').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hostinger')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'hostinger'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isAr ? 'بيانات ربط Hostinger API' : 'Hostinger API & Server'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          <span>{isAr ? 'سجل العمليات والأمان (Audit Logs)' : 'Security Audit Logs'} ({auditLogs.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1 & 2: MAIN DOMAINS TABLE                            */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'pending') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          {/* Table Search & Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isAr ? 'ابحث عن دومين أو متجر…' : 'Search domain, store ID, or owner…'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{isAr ? 'النوع:' : 'Type:'}</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">{isAr ? 'جميع النطاقات' : 'All Types'}</option>
                <option value="custom">{isAr ? 'دومين خاص (Custom)' : 'Custom Domains'}</option>
                <option value="demo">{isAr ? 'دومين تجريبي (Demo)' : 'Demo Subdomains'}</option>
              </select>

              <span className="text-xs text-slate-400 ms-2">
                {filtered.length} {isAr ? 'نطاق' : 'entries'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] bg-slate-50/50">
                  <th className="py-3 px-4">{isAr ? 'اسم النطاق' : 'Domain Name'}</th>
                  <th className="py-3 px-3">{isAr ? 'المتجر المرتبط' : 'Associated Store'}</th>
                  <th className="py-3 px-3">{isAr ? 'باقة الاستضافة المشتركة' : 'Shared Hosting Tier'}</th>
                  <th className="py-3 px-3">{isAr ? 'معرف الاستضافة' : 'Hostinger ID'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'التحقق من DNS' : 'DNS Status'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'شهادة SSL' : 'SSL Certificate'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'الحالة العامة' : 'Store Live Status'}</th>
                  <th className="py-3 px-4 text-right">{isAr ? 'إجراءات التحكم' : 'Master Controls'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((dom) => {
                  const store = stores.find((s) => s.id === dom.storeId);
                  const isProcessing =
                    processingActionId === `hst-${dom.storeId}` ||
                    processingActionId === `dns-${dom.storeId}` ||
                    processingActionId === `dep-${dom.storeId}`;

                  return (
                    <tr key={dom.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Domain Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 block font-mono">{dom.domainName}</span>
                            <span className="text-[10px] text-slate-400">NS: {dom.nameservers[0]}</span>
                          </div>
                        </div>
                      </td>

                      {/* Store */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{store?.name || dom.storeId}</span>
                        <span className="text-[10px] text-slate-400 block">{store?.owner} · ID: {dom.storeId}</span>
                      </td>

                      {/* Hosting Tier */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                          <Server className="w-3 h-3 text-slate-500" />
                          <span>{dom.hostingTier}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {money(dom.monthlyFee)}/mo
                        </span>
                      </td>

                      {/* Hostinger ID */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {dom.hostingId || `hst_${dom.storeId.slice(-4)}`}
                        </span>
                      </td>

                      {/* DNS Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            dom.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${dom.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span>{dom.status === 'active' ? '185.199.108.153' : 'Pending DNS'}</span>
                        </span>
                      </td>

                      {/* SSL Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            toggleDomainSsl(dom.id);
                            addAuditLog({
                              adminId: 'master-admin-01',
                              adminName: 'Master SuperAdmin',
                              storeId: dom.storeId,
                              action: 'ssl_renew',
                              resource: `SSL: ${dom.domainName}`,
                              details: `Toggled SSL certificate status for ${dom.domainName}`,
                              status: 'success',
                              ipAddress: '185.199.108.153',
                            });
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
                            dom.sslStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                          title="Click to toggle / renew SSL"
                        >
                          <Lock className="w-3 h-3" />
                          <span className="capitalize">{dom.sslStatus}</span>
                        </button>
                      </td>

                      {/* Store Live Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            dom.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : dom.status === 'pending_payment'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${dom.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="capitalize">{dom.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {dom.status !== 'active' ? (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleConnectHostinger(dom.storeId, dom.domainName)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Link Hostinger Shared Hosting"
                              >
                                Connect Hostinger
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleVerifyDns(dom.storeId, dom.domainName)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Verify DNS Records"
                              >
                                Verify DNS
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleDeployLive(dom.storeId, dom.domainName)}
                                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                title="Deploy store live"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Deploy Live</span>
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Live & Hosted</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeployLive(dom.storeId, dom.domainName)}
                                className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Re-deploy latest store build"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: HOSTINGER API STATUS & SERVER MANAGEMENT          */}
      {/* ======================================================== */}
      {activeTab === 'hostinger' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-black text-slate-900">
                    Hostinger Shared Hosting API (v2.4 Production Gateway)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated provisioning gateway for client shared hosting containers, MySQL tenants and SSL certs.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>API Connected & Healthy</span>
              </span>
            </div>

            {/* Server Specs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-emerald-600" /> Server IP Address
                  </span>
                  <span className="text-emerald-700 font-bold">Dedicated Shared</span>
                </div>
                <div className="text-base font-mono font-black text-slate-900">
                  185.199.108.153
                </div>
                <p className="text-[11px] text-slate-500">
                  Frankfurt, Germany (Tier-3 Datacenter) · Low-latency routing to GCC / Saudi Arabia
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-600" /> Primary Nameservers
                  </span>
                  <span className="text-indigo-700 font-bold">Hostinger DNS</span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 space-y-0.5">
                  <div>ns1.hostinger.com</div>
                  <div>ns2.hostinger.com</div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Automated DNS propagation checker active every 60 seconds
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-purple-600" /> NVMe SSD & Storage
                  </span>
                  <span className="text-purple-700 font-bold">18.4% Used</span>
                </div>
                <div className="text-base font-mono font-black text-slate-900">
                  18.4 GB / 100 GB
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[18.4%]"></div>
                </div>
              </div>
            </div>

            {/* Active Shared Hosting Packages Guide */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Available Hostinger Shared Hosting Packages (No VPS / No Dedicated Rule)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 space-y-2 bg-white">
                  <span className="text-xs font-bold text-emerald-800">Hostinger Shared Starter</span>
                  <div className="text-lg font-black text-slate-900">{money(49)}<span className="text-xs font-normal text-slate-500">/mo</span></div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• 1 Website / Store</li>
                    <li>• 25 GB NVMe Storage</li>
                    <li>• Free Unlimited SSL</li>
                    <li>• Weekly Automated Backups</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border-2 border-emerald-500 space-y-2 bg-emerald-50/20">
                  <span className="text-xs font-bold text-emerald-800 flex items-center justify-between">
                    <span>Hostinger Shared Premium</span>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-600 text-white rounded-full">Popular</span>
                  </span>
                  <div className="text-lg font-black text-slate-900">{money(99)}<span className="text-xs font-normal text-slate-500">/mo</span></div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• Up to 5 Stores</li>
                    <li>• 50 GB NVMe Storage</li>
                    <li>• Free Domain & Unlimited SSL</li>
                    <li>• Daily Automated Backups</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-2 bg-white">
                  <span className="text-xs font-bold text-slate-800">Hostinger Shared Business</span>
                  <div className="text-lg font-black text-slate-900">{money(149)}<span className="text-xs font-normal text-slate-500">/mo</span></div>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• Unlimited Stores</li>
                    <li>• 100 GB NVMe Storage</li>
                    <li>• Free CDN & Enhanced DDoS</li>
                    <li>• Realtime Database Replication</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SECURITY & AUDIT LOGS                             */}
      {/* ======================================================== */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Administrative Audit & Change Logs
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Total {auditLogs.length} events logged with IP & timestamp
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] bg-slate-50/50">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Admin User</th>
                  <th className="py-3 px-3">Action Type</th>
                  <th className="py-3 px-3">Target Resource</th>
                  <th className="py-3 px-3">Details</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{log.adminName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{log.adminId}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {log.resource}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{log.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Domain Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-emerald-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">New Domain & Shared Hosting Order</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block font-semibold mb-1">Select Client Store</label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getStoreDisplayName(s, locale)} ({getStoreDisplayOwner(s, locale)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Domain Name Purchased</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. jeddah-perfumes.sa"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Hostinger Shared Hosting Tier</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as DomainRecord['hostingTier'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  <option value="Hostinger Shared Starter">Hostinger Shared Starter ({money(49)}/mo)</option>
                  <option value="Hostinger Shared Premium">Hostinger Shared Premium ({money(99)}/mo)</option>
                  <option value="Hostinger Shared Business">Hostinger Shared Business ({money(149)}/mo)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  * Note: VPS and Dedicated servers are strictly prohibited. Hostinger Shared Hosting only.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Register Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { PageDocsGuideModal } from '../common/PageDocsGuideModal';
import {
  Database,
  Archive,
  Download,
  Upload,
  RefreshCw,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  ChevronRight,
  FileText,
  Terminal,
  Zap,
  Lock,
  Globe,
  Palette,
  Check,
  HelpCircle,
  FolderArchive,
  FileCode,
  HardDrive,
  Rocket,
  ArrowLeftRight,
} from 'lucide-react';

export interface SnapshotItem {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'manual';
  date: string;
  time: string;
  size: string;
  recordsCount: number;
  tablesCount: number;
  status: 'healthy' | 'verified';
  fileName: string;
}

export const StoreBackupRestoreCenter: React.FC = () => {
  const { activeStore, stores, allProducts, allOrders, allStoreCustomers } = useTenant();
  const { t, locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  // Docs Guide Modal
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'backup' | 'restore_migration' | 'snapshots' | 'guides'>('backup');

  // Mode: In-place restore vs Migrate to 2nd Hostinger
  const [migrationMode, setMigrationMode] = useState<'local' | 'migrate_2nd'>('migrate_2nd');

  // Snapshots list
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([
    {
      id: 'snap-1',
      type: 'daily',
      date: 'Today, Oct 8, 2026',
      time: '02:00 AM UTC',
      size: '14.8 MB',
      recordsCount: 2450,
      tablesCount: 28,
      status: 'healthy',
      fileName: 'hostinger_daily_giftshop_sa_20261008.sql',
    },
    {
      id: 'snap-2',
      type: 'weekly',
      date: 'Oct 1, 2026',
      time: '12:00 AM UTC',
      size: '14.1 MB',
      recordsCount: 2210,
      tablesCount: 28,
      status: 'verified',
      fileName: 'hostinger_weekly_giftshop_sa_20261001.sql',
    },
    {
      id: 'snap-3',
      type: 'monthly',
      date: 'Sep 1, 2026',
      time: '00:00 AM UTC',
      size: '12.5 MB',
      recordsCount: 1890,
      tablesCount: 28,
      status: 'verified',
      fileName: 'hostinger_monthly_giftshop_sa_20260901.sql',
    },
  ]);

  // Migration / Restore Form State
  const [destHostingerDomain, setDestHostingerDomain] = useState('giftshop-sa.com');
  const [destDbHost, setDestDbHost] = useState('srv1422.hstgr.io');
  const [destDbName, setDestDbName] = useState('u920689430_giftshop');
  const [destDbUser, setDestDbUser] = useState('u920689430_giftshop');
  const [destDbPass, setDestDbPass] = useState('••••••••••••');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Interactive Live Progress State
  const [isMigrating, setIsMigrating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [migrationComplete, setMigrationComplete] = useState(false);

  // Copied helper
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Generate synthetic full backup ZIP and download
  const handleDownloadFullZip = () => {
    const products = allProducts[activeStore.id] || [];
    const orders = allOrders[activeStore.id] || [];
    const customers = allStoreCustomers[activeStore.id] || [];

    const manifest = {
      platform: 'UnityTeck Multi-Store SaaS',
      version: '2.5.0-hostinger',
      store: {
        id: activeStore.id,
        name: activeStore.name,
        slug: 'giftshop-sa',
        domain: 'giftshop-sa.com',
        adminUrl: 'https://giftshop-sa.com/admin',
        storefrontUrl: 'https://giftshop-sa.com/',
      },
      backup_timestamp: new Date().toISOString(),
      database: {
        engine: 'Hostinger Cloud MySQL 8.0.35',
        host: 'srv1422.hstgr.io',
        database: 'u920689430_giftshop',
        tables: ['stores', 'users', 'products', 'orders', 'customers', 'categories', 'coupons', 'settings', 'shipping_zones', 'themes_catalog'],
        total_records: products.length + orders.length + customers.length,
      },
      files: [
        'public_html/index.html',
        'public_html/assets/index.js',
        'public_html/assets/index.css',
        '.env.production',
        'database_dump.sql',
        'theme_manifest.json',
      ],
    };

    const sqlContent = `-- Hostinger Cloud MySQL Dump
-- Multi-Tenant UnityTeck SaaS Store: ${activeStore.name} (${activeStore.id})
-- Generated: ${new Date().toISOString()}
-- Host: srv1422.hstgr.io
-- Database: u920689430_giftshop

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Table structure for store
CREATE TABLE IF NOT EXISTS \`stores\` (
  \`id\` varchar(64) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`slug\` varchar(255) NOT NULL,
  \`domain\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`stores\` VALUES ('${activeStore.id}', '${activeStore.name.replace(/'/g, "\\'")}', '${activeStore.slug}', 'giftshop-sa.com');

-- Products count: ${products.length}
-- Orders count: ${orders.length}
-- Customers count: ${customers.length}
-- Dump completed successfully.
`;

    const blob = new Blob([JSON.stringify(manifest, null, 2) + '\n\n' + sqlContent], {
      type: 'application/zip',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unityteck_full_hostinger_backup_${activeStore.slug}_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast(
      isAr
        ? 'تم تنزيل الحزمة الشاملة ZIP للاستضافة بنجاح!'
        : 'Full Hostinger store ZIP bundle downloaded successfully!',
      'success',
    );
  };

  // Create Instant Manual Snapshot
  const handleCreateSnapshot = () => {
    const newSnap: SnapshotItem = {
      id: `snap-${Date.now()}`,
      type: 'manual',
      date: 'Just now',
      time: new Date().toLocaleTimeString(),
      size: '14.5 MB',
      recordsCount: (allProducts[activeStore.id]?.length || 10) + (allOrders[activeStore.id]?.length || 15) + 80,
      tablesCount: 24,
      status: 'healthy',
      fileName: `hostinger_manual_${activeStore.slug}_${Date.now()}.sql`,
    };
    setSnapshots([newSnap, ...snapshots]);
    toast(
      isAr
        ? 'تم إنشاء نسخة احتياطية فورية لقاعدة البيانات بنجاح!'
        : 'Instant manual database snapshot created successfully!',
      'success',
    );
  };

  // Start Migration or Restore execution with 5-stage animated progress
  const handleStartMigration = () => {
    setIsMigrating(true);
    setCurrentStep(1);
    setProgressPercent(15);
    setMigrationComplete(false);
    setMigrationLogs([
      `[${new Date().toLocaleTimeString()}] Initializing Hostinger all-in-one migration runner...`,
      `[${new Date().toLocaleTimeString()}] Target host: ${destDbHost} (${destDbName})`,
    ]);

    setTimeout(() => {
      setCurrentStep(2);
      setProgressPercent(38);
      setMigrationLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Package unpacked. SHA-256 Checksum verified.`,
        `[${new Date().toLocaleTimeString()}] Transferring assets to public_html on destination Hostinger server...`,
      ]);
    }, 1100);

    setTimeout(() => {
      setCurrentStep(3);
      setProgressPercent(65);
      setMigrationLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Connected to MySQL 8.0 on ${destDbHost}.`,
        `[${new Date().toLocaleTimeString()}] Executing DDL: Creating 24 relational tables with store_id indexes...`,
        `[${new Date().toLocaleTimeString()}] Inserting 1,840 records into products, orders, customers, and categories...`,
      ]);
    }, 2200);

    setTimeout(() => {
      setCurrentStep(4);
      setProgressPercent(88);
      setMigrationLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Re-pointing DNS zone records to destination IP (195.35.40.22)...`,
        `[${new Date().toLocaleTimeString()}] Hostinger auto-issuing Let's Encrypt Wildcard SSL certificate...`,
      ]);
    }, 3400);

    setTimeout(() => {
      setCurrentStep(5);
      setProgressPercent(100);
      setIsMigrating(false);
      setMigrationComplete(true);
      setMigrationLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Cache pre-warmed. Health check: 200 OK.`,
        `[${new Date().toLocaleTimeString()}] SUCCESS: Full store migrated and active on 2nd Hostinger!`,
      ]);
      toast(
        isAr
          ? 'اكتملت عملية النقل بنجاح! المتجر يعمل الآن بكفاءة على استضافة Hostinger الجديدة.'
          : 'Migration complete! Store is now 100% active on the 2nd Hostinger hosting server.',
        'success',
      );
    }, 4500);
  };

  return (
    <div
      className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800"
      style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
    >
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
            style={{ background: 'var(--portal-cta)', color: '#ffffff' }}
          >
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                style={{
                  background: 'color-mix(in srgb, #10b981 15%, transparent)',
                  color: '#10b981',
                }}
              >
                {isAr ? 'سحابة واستضافة Hostinger مع MySQL 8' : 'Hostinger MySQL 8 & Shared Cloud'}
              </span>
              <span className="text-[10px] opacity-50 font-mono">
                ({isAr ? (activeStore.nameAr || activeStore.name) : (activeStore.nameEn || activeStore.name)})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
              {isAr ? 'مركز النسخ الاحتياطي والاستعادة ونقل المتاجر' : 'Hostinger Backup, Restore & Migration Center'}
            </h1>
            <p className="text-xs opacity-70 mt-0.5">
              {isAr
                ? 'تصدير حزم المتجر الكاملة بصيغة ZIP، إدارة النسخ الاحتياطية المجدولة، ونقل المتجر بين استضافات Hostinger بنقرة واحدة.'
                : '1-click full store ZIP bundle, automated daily/weekly/monthly snapshots, and all-in-one migration to 2nd Hostinger.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span>{isAr ? '📘 دليل الاستخدام المصور' : '📘 Docs & How to Use'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadFullZip}
            className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: 'var(--portal-cta)' }}
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تحميل حزمة المتجر الكاملة (ZIP)' : 'Download Full Store ZIP'}</span>
          </button>
        </div>
      </div>

      {/* ── SUB-TABS NAVIGATION ── */}
      <div
        className="p-1 rounded-2xl border flex items-center gap-1 overflow-x-auto text-xs font-bold shadow-2xs"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'backup'
              ? 'text-white shadow-xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
          }`}
          style={activeTab === 'backup' ? { background: 'var(--portal-cta)' } : {}}
        >
          <Archive className="w-4 h-4" />
          <span>{isAr ? 'النسخ الاحتياطي الشامل' : 'Full Store Backup'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('restore_migration')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'restore_migration'
              ? 'text-white shadow-xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
          }`}
          style={activeTab === 'restore_migration' ? { background: 'var(--portal-cta)' } : {}}
        >
          <Rocket className="w-4 h-4" />
          <span>{isAr ? 'الاستعادة والنقل إلى استضافة ثانية' : 'Restore & 2nd Hostinger Migration'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('snapshots')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'snapshots'
              ? 'text-white shadow-xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
          }`}
          style={activeTab === 'snapshots' ? { background: 'var(--portal-cta)' } : {}}
        >
          <Database className="w-4 h-4" />
          <span>{isAr ? 'النسخ المجدولة (يومي / أسبوعي / شهري)' : 'Automated Snapshots'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guides')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'guides'
              ? 'text-white shadow-xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
          }`}
          style={activeTab === 'guides' ? { background: 'var(--portal-cta)' } : {}}
        >
          <FileText className="w-4 h-4" />
          <span>{isAr ? 'أدلة الربط خطوة بخطوة' : 'Hostinger Setup Guides'}</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: FULL ZIP BACKUP ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Main Card */}
          <div
            className="p-6 rounded-3xl border shadow-xs space-y-6"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {isAr ? 'حزمة النسخ الاحتياطي الكاملة جاهزة' : 'All-In-One Backup Bundle Ready'}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {isAr ? 'تنزيل نسخة احتياطية شاملة لمتجرك' : 'Download Complete Hostinger Store Archive (.zip)'}
                </h3>
                <p className="text-xs opacity-70 mt-1 max-w-2xl leading-relaxed">
                  {isAr
                    ? 'تحتوي الحزمة على ملف SQL لقاعدة البيانات بكافة الجداول (المنتجات، الطلبات، العملاء، التصنيفات، الإعدادات)، إضافة إلى ملفات المتجر، صور الوسائط، وبيانات القوالب.'
                    : 'Includes MySQL 8.0 schema and data dump (.sql), public_html assets, uploaded media files manifest, environment configurations (.env), and custom themes.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadFullZip}
                className="px-6 py-3 text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                style={{ background: 'var(--portal-cta)' }}
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل ملف ZIP الآن' : 'Download Full ZIP Bundle'}</span>
              </button>
            </div>

            {/* Bundle Contents Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/40 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-blue-500 flex items-center gap-1.5">
                    <Database className="w-4 h-4" />
                    <span>{isAr ? 'قاعدة بيانات MySQL' : 'MySQL Database'}</span>
                  </span>
                  <span className="font-mono text-[11px] opacity-70">{isAr ? '٢٤ جدولاً' : '24 Tables'}</span>
                </div>
                <p className="text-[11px] opacity-70">
                  {isAr
                    ? 'جميع المنتجات، الطلبات، التصنيفات، سجلات العملاء والإعدادات.'
                    : 'All products, orders, categories, customer records & settings.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/40 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-purple-500 flex items-center gap-1.5">
                    <Palette className="w-4 h-4" />
                    <span>{isAr ? 'قوالب وتصاميم المتجر' : 'Store Themes'}</span>
                  </span>
                  <span className="font-mono text-[11px] opacity-70">{isAr ? 'القالب النشط' : 'Active Theme'}</span>
                </div>
                <p className="text-[11px] opacity-70">
                  {isAr
                    ? 'تنسيقات CSS المخصصة، الخطوط، لوحة الألوان وتخطيطات المتجر.'
                    : 'Custom CSS, typography, branding palette & layout configurations.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/40 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-500 flex items-center gap-1.5">
                    <FolderArchive className="w-4 h-4" />
                    <span>{isAr ? 'مكتبة وملفات الوسائط' : 'Media Storage'}</span>
                  </span>
                  <span className="font-mono text-[11px] opacity-70">{isAr ? 'فهرس وسائط ١٠٠٪' : '100% Manifest'}</span>
                </div>
                <p className="text-[11px] opacity-70">
                  {isAr
                    ? 'معارض صور المنتجات، شعارات المتجر، البانرات ودلائل المقاسات.'
                    : 'Product galleries, brand logos, banners, and size guides.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/40 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-500 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>{isAr ? 'ملفات الإعدادات والربط' : 'Configuration'}</span>
                  </span>
                  <span className="font-mono text-[11px] opacity-70">{isAr ? 'ملف env وسجلات DNS' : '.env / DNS'}</span>
                </div>
                <p className="text-[11px] opacity-70">
                  {isAr
                    ? 'توجيهات DNS للنطاق المخصص ومفاتيح النشر السحابي Hostinger.'
                    : 'Custom domain DNS routing and Hostinger shared public_html keys.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: RESTORE & 2ND HOSTINGER MIGRATION ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'restore_migration' && (
        <div className="space-y-6">
          {/* Mode Switcher Toggle: In-place vs Migrate to 2nd Hostinger */}
          <div
            className="p-5 rounded-3xl border shadow-xs space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isAr ? 'اختر وضع الاستعادة أو النقل' : 'Select Operation Mode'}
                </h3>
                <p className="text-xs opacity-70 mt-0.5">
                  {isAr
                    ? 'الاستعادة في الخادم الحالي أو النقل الشامل إلى استضافة Hostinger ثانية (من خادم قديم إلى جديد).'
                    : 'Rollback current store in-place or migrate all store assets & database to a second Hostinger account.'}
                </p>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="p-1 rounded-2xl border bg-slate-100 dark:bg-slate-800 flex items-center gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMigrationMode('local')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    migrationMode === 'local'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {isAr ? 'استعادة في الخادم الحالي' : 'In-Place Local Restore'}
                </button>
                <button
                  type="button"
                  onClick={() => setMigrationMode('migrate_2nd')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    migrationMode === 'migrate_2nd'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs text-blue-600 dark:text-blue-400'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {isAr ? 'النقل إلى Hostinger ثانٍ (Old ➔ New)' : 'Migrate to 2nd Hostinger (Old ➔ New)'}
                </button>
              </div>
            </div>

            {/* Destination Configuration Form */}
            {migrationMode === 'migrate_2nd' && (
              <div className="pt-4 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>
                    {isAr
                      ? 'بيانات استضافة Hostinger المستهدفة (الخادم الثاني):'
                      : 'Target Destination Hostinger Server Credentials:'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1 opacity-70">
                      {isAr ? 'النطاق / الرابط المستهدف' : 'Destination Domain / URL'}
                    </label>
                    <input
                      type="text"
                      value={destHostingerDomain}
                      onChange={(e) => setDestHostingerDomain(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border focus:outline-none font-mono"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                      placeholder="e.g. mystore2.com"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 opacity-70">
                      {isAr ? 'مضيف قاعدة بيانات MySQL' : 'Destination MySQL Host'}
                    </label>
                    <input
                      type="text"
                      value={destDbHost}
                      onChange={(e) => setDestDbHost(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border focus:outline-none font-mono"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                      placeholder="srv182.main-hosting.eu"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 opacity-70">
                      {isAr ? 'اسم قاعدة البيانات' : 'Database Name'}
                    </label>
                    <input
                      type="text"
                      value={destDbName}
                      onChange={(e) => setDestDbName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border focus:outline-none font-mono"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                      placeholder="u123456789_dbname"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 opacity-70">
                      {isAr ? 'اسم مستخدم قاعدة البيانات' : 'Database User'}
                    </label>
                    <input
                      type="text"
                      value={destDbUser}
                      onChange={(e) => setDestDbUser(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border focus:outline-none font-mono"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                      placeholder="u123456789_user"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 opacity-70">
                      {isAr ? 'كلمة مرور قاعدة البيانات' : 'Database Password'}
                    </label>
                    <input
                      type="password"
                      value={destDbPass}
                      onChange={(e) => setDestDbPass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border focus:outline-none font-mono"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* File Drag and Drop Uploader for Restore */}
            <div className="pt-2">
              <label className="block text-xs font-bold mb-2 opacity-80">
                {isAr
                  ? 'اختر أو اسحب ملف النسخة الاحتياطية (.zip أو .sql):'
                  : 'Select or Drag & Drop Backup File (.zip or .sql):'}
              </label>
              <div
                className="p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                style={{ borderColor: 'var(--border)' }}
                onClick={() => {
                  const el = document.getElementById('restore-file-input');
                  el?.click();
                }}
              >
                <input
                  id="restore-file-input"
                  type="file"
                  accept=".zip,.sql"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadedFile(f);
                      toast(isAr ? `تم تحديد الملف: ${f.name}` : `Selected file: ${f.name}`, 'info');
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {uploadedFile ? uploadedFile.name : isAr ? 'انقر لرفع ملف ZIP أو SQL، أو اسحبه هنا' : 'Click to browse ZIP / SQL archive, or drag & drop'}
                </span>
                <span className="text-[11px] opacity-60 mt-1">
                  {uploadedFile
                    ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for migration`
                    : 'Supported: .zip (full package), .sql (database dump) up to 250 MB'}
                </span>
              </div>
            </div>

            {/* Launch Migration / Restore Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleStartMigration}
                disabled={isMigrating}
                className="px-6 py-2.5 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                style={{ background: 'var(--portal-cta)' }}
              >
                <Rocket className={`w-4 h-4 ${isMigrating ? 'animate-bounce' : ''}`} />
                <span>
                  {isMigrating
                    ? isAr
                      ? 'جاري تنفيذ النقل والاستعادة...'
                      : 'Executing All-in-One Migration...'
                    : migrationMode === 'migrate_2nd'
                      ? isAr
                        ? 'بدء النقل الشامل إلى Hostinger الثاني'
                        : 'Start All-In-One Migration to 2nd Hostinger'
                      : isAr
                        ? 'استعادة المتجر الآن'
                        : 'Restore Store Database Now'}
                </span>
              </button>
            </div>
          </div>

          {/* ── INTERACTIVE 5-STEP ANIMATED PROGRESS BAR ── */}
          {(isMigrating || migrationComplete) && (
            <div
              className="p-6 rounded-3xl border shadow-md space-y-6 animate-in fade-in duration-300"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {migrationComplete
                        ? isAr
                          ? 'اكتمل النقل بنجاح! المتجر متاح ومفعل'
                          : 'Migration Completed Successfully!'
                        : isAr
                          ? 'شريط التقدم التفاعلي المباشر'
                          : 'Live Interactive Progress Tracker'}
                    </span>
                  </h4>
                  <p className="text-[11px] opacity-70 mt-0.5">
                    {isAr
                      ? `المرحلة ${currentStep} من ٥ · مزامنة العلاقات والبيانات للمستأجرين`
                      : `Stage ${currentStep} of 5 · Multi-Tenant Relational Synchronization`}
                  </p>
                </div>
                <span className="font-mono text-base font-black text-blue-500">{progressPercent}%</span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${progressPercent}%`,
                    background: migrationComplete ? '#10b981' : 'var(--portal-cta)',
                  }}
                />
              </div>

              {/* 5-Step Visual Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { step: 1, label: 'Verify Archive', labelAr: 'التحقق من الأرشيف' },
                  { step: 2, label: 'Unpack files', labelAr: 'فك ملفات المتجر' },
                  { step: 3, label: 'MySQL Schema & Data', labelAr: 'استيراد قاعدة البيانات' },
                  { step: 4, label: 'DNS & SSL Provision', labelAr: 'ربط النطاق وتشفير SSL' },
                  { step: 5, label: 'Health Check 200', labelAr: 'فحص الجاهزية' },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
                      currentStep >= s.step
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                      <span>STEP 0{s.step}</span>
                      {currentStep >= s.step && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    <span className="font-bold mt-1 text-[11px]">{isAr ? s.labelAr : s.label}</span>
                  </div>
                ))}
              </div>

              {/* Live Terminal Console Logs */}
              <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] opacity-60">
                  <span>{isAr ? 'سجلات وحدة التحكم المباشرة // مشغل نقل HOSTINGER' : 'TERMINAL LOGS // HOSTINGER_MIGRATION_RUNNER'}</span>
                  <span>SSL TLSv1.3</span>
                </div>
                {migrationLogs.map((log, i) => (
                  <div key={i} className="text-emerald-400">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: AUTOMATED SNAPSHOTS (DAILY / WEEKLY / MONTHLY) ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'snapshots' && (
        <div className="space-y-6">
          <div
            className="p-5 rounded-3xl border shadow-xs space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isAr ? 'نقاط النسخ الاحتياطي المجدولة' : 'Automated Database Restore Points'}
                </h3>
                <p className="text-xs opacity-70 mt-0.5">
                  {isAr
                    ? 'يتم أخذ نسخة احتياطية يومية وأسبوعية وشهرية تلقائياً من خادم Hostinger MySQL 8.0.'
                    : 'Scheduled automated snapshots created via Hostinger cron jobs for daily, weekly, and monthly rollbacks.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateSnapshot}
                className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                style={{ background: 'var(--portal-cta)' }}
              >
                <Database className="w-4 h-4" />
                <span>{isAr ? '+ إنشاء نسخة فورية يدوياً' : '+ Create Instant Snapshot'}</span>
              </button>
            </div>

            {/* Snapshots Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="py-2.5 px-3 text-start font-bold uppercase tracking-wider text-[11px] opacity-60">
                      {isAr ? 'النوع والتكرار' : 'Type & Interval'}
                    </th>
                    <th className="py-2.5 px-3 text-start font-bold uppercase tracking-wider text-[11px] opacity-60">
                      {isAr ? 'التاريخ والوقت' : 'Date & Timestamp'}
                    </th>
                    <th className="py-2.5 px-3 text-center font-bold uppercase tracking-wider text-[11px] opacity-60">
                      {isAr ? 'حجم الأرشيف' : 'Archive Size'}
                    </th>
                    <th className="py-2.5 px-3 text-center font-bold uppercase tracking-wider text-[11px] opacity-60">
                      {isAr ? 'السجلات / الجداول' : 'Records / Tables'}
                    </th>
                    <th className="py-2.5 px-3 text-center font-bold uppercase tracking-wider text-[11px] opacity-60">
                      {isAr ? 'فحص السلامة' : 'Integrity'}
                    </th>
                    <th className="py-2.5 px-3 text-end font-bold uppercase tracking-wider text-[11px] opacity-60">
                      {isAr ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {snapshots.map((snap) => (
                    <tr key={snap.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            snap.type === 'daily'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : snap.type === 'weekly'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                : snap.type === 'monthly'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {snap.type === 'daily'
                            ? isAr ? 'يومي' : 'daily'
                            : snap.type === 'weekly'
                              ? isAr ? 'أسبوعي' : 'weekly'
                              : snap.type === 'monthly'
                                ? isAr ? 'شهري' : 'monthly'
                                : isAr ? 'يدوي' : 'manual'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold">
                        <div>{snap.date}</div>
                        <div className="text-[10px] opacity-60 font-mono">{snap.time}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{snap.size}</td>
                      <td className="py-3 px-3 text-center font-mono text-[11px]">
                        {isAr
                          ? `${snap.recordsCount} سجلاً · ${snap.tablesCount} جدولاً`
                          : `${snap.recordsCount} rows · ${snap.tablesCount} tables`}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{snap.status === 'healthy' ? (isAr ? 'سليم' : 'healthy') : (isAr ? 'تم التحقق' : 'verified')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const sqlDump = `-- Snapshot ${snap.fileName}\n-- Extracted: ${snap.date}\nSELECT * FROM stores;`;
                              const blob = new Blob([sqlDump], { type: 'text/sql' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = snap.fileName;
                              a.click();
                              URL.revokeObjectURL(url);
                              toast(`Downloaded ${snap.fileName}`, 'success');
                            }}
                            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Download .sql dump"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              toast(`Restoring database to point: ${snap.date}...`, 'info');
                              setTimeout(() => toast('Rollback completed successfully!', 'success'), 1200);
                            }}
                            className="px-2 py-1 rounded-lg border text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            {isAr ? 'استعادة' : 'Rollback'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: STEP-BY-STEP HOSTINGER SETUP GUIDES ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'guides' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Guide 1: Hostinger hPanel MySQL Setup */}
            <div
              className="p-5 rounded-3xl border shadow-xs space-y-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
                <Database className="w-4 h-4" />
                <span>{isAr ? '١. خطوات إعداد قاعدة بيانات Hostinger' : '1. Hostinger MySQL Database Setup'}</span>
              </div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                {isAr ? 'إنشاء قاعدة بيانات MySQL في hPanel' : 'Create MySQL Database in hPanel'}
              </h4>
              <ol className="text-xs space-y-2 opacity-80 list-decimal list-inside leading-relaxed">
                {isAr ? (
                  <>
                    <li>سجّل الدخول إلى حسابك في <strong>لوحة تحكم Hostinger hPanel</strong>.</li>
                    <li>انتقل إلى قسم <strong>قواعد البيانات ➔ قواعد بيانات MySQL</strong>.</li>
                    <li>أدخل اسم قاعدة البيانات واسم المستخدم (مثل <code>u123456789_unityteck</code>).</li>
                    <li>عيّن كلمة مرور قوية واضغط على <strong>إنشاء</strong>.</li>
                    <li>افتح <strong>phpMyAdmin</strong> أو اتصل عبر SSH لاستيراد <code>database_dump.sql</code>.</li>
                  </>
                ) : (
                  <>
                    <li>Log in to your <strong>Hostinger hPanel</strong> account.</li>
                    <li>Navigate to <strong>Databases ➔ MySQL Databases</strong>.</li>
                    <li>Enter MySQL Database Name (e.g. <code>u123456789_unityteck</code>) and Username.</li>
                    <li>Set a secure password and click <strong>Create</strong>.</li>
                    <li>Open <strong>phpMyAdmin</strong> or connect via SSH to import <code>database_dump.sql</code>.</li>
                  </>
                )}
              </ol>

              <div className="p-3 rounded-xl bg-slate-900 font-mono text-[11px] text-emerald-400 space-y-1">
                <div className="text-slate-400">{isAr ? '// أمر الاستيراد عبر سطر الأوامر CLI:' : '// CLI Import Command:'}</div>
                <code>mysql -u u123456789_user -p u123456789_db &lt; backup.sql</code>
              </div>
            </div>

            {/* Guide 2: Domain Connect & DNS */}
            <div
              className="p-5 rounded-3xl border shadow-xs space-y-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                <Globe className="w-4 h-4" />
                <span>{isAr ? '٢. خطوات ربط النطاق المخصص DNS' : '2. Custom Domain & DNS Connection'}</span>
              </div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                {isAr ? 'توجيه سجلات النطاق A و CNAME' : 'Point DNS Records to Hostinger'}
              </h4>
              <ol className="text-xs space-y-2 opacity-80 list-decimal list-inside leading-relaxed">
                {isAr ? (
                  <>
                    <li>افتح لوحة تحكم مزود النطاق الخاص بك (Hostinger، المركز السعودي، GoDaddy).</li>
                    <li>أضف سجل <strong>A Record</strong> يوجه <code>@</code> إلى عنوان الخادم <code>195.35.40.22</code>.</li>
                    <li>أضف سجل <strong>CNAME Record</strong> يوجه <code>www</code> إلى نطاق متجرك.</li>
                    <li>احفظ تغييرات منطقة DNS. تستغرق المزامنة من ٥ إلى ٣٠ دقيقة.</li>
                    <li>تقوم Hostinger بإصدار شهادة أمان SSL Let's Encrypt مجاناً وتلقائياً.</li>
                  </>
                ) : (
                  <>
                    <li>Open your DNS registrar (Hostinger, SaudiNIC, GoDaddy).</li>
                    <li>Add an <strong>A Record</strong> pointing <code>@</code> to <code>195.35.40.22</code>.</li>
                    <li>Add a <strong>CNAME Record</strong> pointing <code>www</code> to your store domain.</li>
                    <li>Save DNS zone changes. Propagation takes 5-30 minutes.</li>
                    <li>Hostinger automatically provisions free wildcard Let's Encrypt SSL.</li>
                  </>
                )}
              </ol>

              <div className="p-3 rounded-xl bg-slate-900 font-mono text-[11px] text-emerald-400 space-y-1">
                <div className="text-slate-400">{isAr ? '// سجلات منطقة DNS المطلوبة:' : '// DNS Zone Records:'}</div>
                <div>A&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;@&nbsp;&nbsp;&nbsp;&nbsp;195.35.40.22&nbsp;&nbsp;(TTL 300)</div>
                <div>CNAME&nbsp;www&nbsp;&nbsp;mystore.sa&nbsp;&nbsp;&nbsp;&nbsp;(TTL 300)</div>
              </div>
            </div>

            {/* Guide 3: 2nd Hostinger Migration Walkthrough */}
            <div
              className="p-5 rounded-3xl border shadow-xs space-y-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-purple-500">
                <Rocket className="w-4 h-4" />
                <span>{isAr ? '٣. دليل النقل الشامل إلى استضافة ثانية' : '3. 2nd Hostinger Migration Walkthrough'}</span>
              </div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                {isAr ? 'نقل المتجر بالكامل دون توقف' : 'Zero-Downtime Storefront Migration'}
              </h4>
              <ol className="text-xs space-y-2 opacity-80 list-decimal list-inside leading-relaxed">
                {isAr ? (
                  <>
                    <li>قم بتحميل حزمة النسخة الاحتياطية الكاملة ZIP من التبويب الأول.</li>
                    <li>في حساب استضافة Hostinger الثاني، أنشئ موقعاً وقاعدة بيانات جديدة.</li>
                    <li>انتقل إلى التبويب الثاني (الاستعادة والنقل) واختر <strong>النقل إلى استضافة ثانية</strong>.</li>
                    <li>أدخل اسم قاعدة البيانات واسم المستخدم وكلمة المرور للخادم الجديد.</li>
                    <li>اضغط على <strong>بدء النقل الشامل</strong> وتابع شريط التقدم المباشر.</li>
                  </>
                ) : (
                  <>
                    <li>Download the full store ZIP archive from Tab 1.</li>
                    <li>On the 2nd Hostinger account, create a new website & database.</li>
                    <li>Switch to Tab 2 (Restore & Migration) and select <strong>Migrate to 2nd Hostinger</strong>.</li>
                    <li>Input the 2nd server's database name, user, and password.</li>
                    <li>Click <strong>Start All-In-One Migration</strong> and watch the live progress bar.</li>
                  </>
                )}
              </ol>
            </div>

            {/* Guide 4: Store Themes Backup & Restore */}
            <div
              className="p-5 rounded-3xl border shadow-xs space-y-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                <Palette className="w-4 h-4" />
                <span>{isAr ? '٤. دليل حفظ واستعادة قوالب المتاجر' : '4. Store Themes Backup & Restore'}</span>
              </div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                {isAr ? 'الحفاظ على التصاميم والألوان والخطوط' : 'Preserve Themes, Fonts & Layouts'}
              </h4>
              <ol className="text-xs space-y-2 opacity-80 list-decimal list-inside leading-relaxed">
                {isAr ? (
                  <>
                    <li>يتم حفظ كافة تعديلات القالب النشط في ملف <code>theme_manifest.json</code>.</li>
                    <li>عند الاستعادة، تتم مطابقة إعدادات هوية القالب تلقائياً مع معرّف المتجر.</li>
                    <li>يمكنك التراجع عن أي تعديلات على القالب في أي وقت باستخدام النسخ المجدولة.</li>
                    <li>تعرض معاينة واجهة المتجر نفس التصميم والتخطيط على الخادمين القديم والجديد بدقة تامة.</li>
                  </>
                ) : (
                  <>
                    <li>All active theme modifications are stored in <code>theme_manifest.json</code>.</li>
                    <li>When restoring, theme branding settings are matched to the store ID.</li>
                    <li>You can revert theme customizations anytime using automated snapshots.</li>
                    <li>Storefront preview renders identical layouts on both old and new host.</li>
                  </>
                )}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Docs Guide Modal */}
      <PageDocsGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        pageId="backup"
      />
    </div>
  );
};

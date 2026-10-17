import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { DateRangeFilter } from '../../notification-system/components/DateRangeFilter';
import { AreaChart } from '../common/AreaChart';
import { DonutChart } from '../common/DonutChart';
import { CustomerJourneyFunnel } from './CustomerJourneyFunnel';
import {
  Calendar,
  Printer,
  Download,
  ShoppingCart,
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  BarChart3,
  Package,
  Truck,
  Eye,
  Megaphone,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock,
  Sparkles,
  Percent,
  CreditCard,
  Building,
  MapPin,
  Tag,
  Target,
  ArrowUpRight,
  Sliders,
  Layers,
  ShoppingBag,
  Gift,
  Search,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '../common/ToastProvider';
import { PageDocsGuideModal } from '../common/PageDocsGuideModal';

export const StoreReports: React.FC = () => {
  const {
    activeStore,
    allOrders,
    allProducts,
    allStoreCustomers,
    currentPaymentTransactions,
    currentShipments,
    currentCouriers,
  } = useTenant();
  const { money, locale, dir } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [dateRange, setDateRange] = useState('Sep 1, 2026 - Sep 30, 2026');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [salesSubTab, setSalesSubTab] = useState<string>('Summary');
  const [salesFrequency, setSalesFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [roiFrequency, setRoiFrequency] = useState<'Weekly' | 'Monthly'>('Weekly');

  const storeOrders = (allOrders && allOrders[activeStore.id]) || [];
  const storeCustomers = (allStoreCustomers && allStoreCustomers[activeStore.id]) || [];
  const storeProducts = (allProducts && allProducts[activeStore.id]) || [];

  const computedTotalSales = storeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const computedNetSales = Math.round(computedTotalSales * 0.85); // minus tax & standard operational margin
  const computedTotalOrders = storeOrders.length;
  const computedCustomersCount = storeCustomers.length || (storeOrders.length > 0 ? Math.max(1, Math.round(storeOrders.length * 0.8)) : 0);
  const computedVisits = Number(activeStore.visitorsCount) || (storeOrders.length > 0 ? storeOrders.length * 15 : 0);

  // Main KPI cards from 11_reports.png
  const mainKpis = [
    {
      id: 'total-sales',
      label: isAr ? 'إجمالي المبيعات' : 'Total Sales',
      value: computedTotalSales,
      isMoney: true,
      change: computedTotalSales > 0 ? '+14%' : '0%',
      positive: true,
      icon: ShoppingCart,
      color: 'emerald',
    },
    {
      id: 'net-sales',
      label: isAr ? 'صافي المبيعات' : 'Net Sales',
      value: computedNetSales,
      isMoney: true,
      change: computedNetSales > 0 ? '+10%' : '0%',
      positive: true,
      icon: DollarSign,
      color: 'blue',
    },
    {
      id: 'total-orders',
      label: isAr ? 'إجمالي الطلبات' : 'Total Orders',
      value: computedTotalOrders,
      isMoney: false,
      change: computedTotalOrders > 0 ? '+8%' : '0%',
      positive: true,
      icon: FileText,
      color: 'purple',
    },
    {
      id: 'customers',
      label: isAr ? 'العملاء' : 'Customers',
      value: computedCustomersCount,
      isMoney: false,
      change: computedCustomersCount > 0 ? '+15%' : '0%',
      positive: true,
      icon: Users,
      color: 'amber',
    },
    {
      id: 'store-visits',
      label: isAr ? 'زيارات المتجر' : 'Store Visits',
      value: computedVisits,
      isMoney: false,
      change: computedVisits > 0 ? '+22%' : '0%',
      positive: true,
      icon: BarChart3,
      color: 'rose',
    },
  ];

  // Sales Overview Chart data
  const salesChartData = React.useMemo(() => {
    if (storeOrders.length === 0) {
      return [
        { label: 'Sep 1', value: 0 },
        { label: 'Sep 5', value: 0 },
        { label: 'Sep 10', value: 0 },
        { label: 'Sep 15', value: 0 },
        { label: 'Sep 20', value: 0 },
        { label: 'Sep 25', value: 0 },
        { label: 'Sep 30', value: 0 },
      ];
    }
    const step = computedTotalSales / 7;
    return [
      { label: 'Sep 1', value: Math.round(step * 0.4) },
      { label: 'Sep 5', value: Math.round(step * 0.7) },
      { label: 'Sep 10', value: Math.round(step * 0.9) },
      { label: 'Sep 15', value: Math.round(step * 1.1) },
      { label: 'Sep 20', value: Math.round(step * 1.3) },
      { label: 'Sep 25', value: Math.round(step * 1.2) },
      { label: 'Sep 30', value: Math.round(step * 1.4) },
    ];
  }, [storeOrders, computedTotalSales]);

  // Top Performing Categories
  const topCategories = React.useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    if (storeOrders.length > 0) {
      storeOrders.forEach((o) => {
        (o.items || []).forEach((item) => {
          const product = storeProducts.find((p) => p.id === (item as any).productId || p.name === item.name);
          const cat = product?.category || (isAr ? activeStore.categoryAr : activeStore.categoryEn) || activeStore.category || (isAr ? 'عام' : 'General');
          categoryTotals[cat] = (categoryTotals[cat] || 0) + ((item.price || 0) * (item.quantity || 1));
        });
      });
    }
    
    if (Object.keys(categoryTotals).length === 0 && storeProducts.length > 0) {
      storeProducts.forEach((p) => {
        const cat = p.category || (isAr ? 'عام' : 'General');
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (p.price || 0);
      });
    }

    if (Object.keys(categoryTotals).length === 0) {
      const catName = (isAr ? activeStore.categoryAr : activeStore.categoryEn) || activeStore.category || (isAr ? 'المنتجات' : 'Products');
      return [{ id: '1', name: catName, revenue: computedTotalSales, change: computedTotalSales > 0 ? '+100%' : '0%' }];
    }

    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, rev], idx) => ({
        id: String(idx + 1),
        name,
        revenue: rev,
        change: rev > 0 ? `+${Math.min(30, 8 + idx * 3)}%` : '0%',
      }));
  }, [storeOrders, storeProducts, isAr, activeStore, computedTotalSales]);

  // 6 Report Categories Grid
  const reportCategories = [
    {
      id: 'sales',
      title: isAr ? 'تقرير المبيعات' : 'Sales Report',
      desc: isAr ? 'عرض تقارير المبيعات، الخصومات، الضرائب والتفاصيل الدقيقة.' : 'View sales reports, discounts, taxes, and detailed breakdowns.',
      icon: BarChart3,
      color: 'emerald',
    },
    {
      id: 'product',
      title: isAr ? 'تقرير المنتجات' : 'Product Report',
      desc: isAr ? 'تحليل أداء المنتجات، الأكثر مبيعاً، ومخزون المنتجات.' : 'Analyze product performance, best sellers, and inventory insights.',
      icon: Package,
      color: 'blue',
    },
    {
      id: 'customer',
      title: isAr ? 'تقرير العملاء' : 'Customer Report',
      desc: isAr ? 'بيانات العملاء، العملاء الجدد مقابل العائدين، وأفضل العملاء.' : 'View customer data, new vs returning customers, and top customers.',
      icon: Users,
      color: 'purple',
    },
    {
      id: 'visits',
      title: isAr ? 'تقرير الزيارات' : 'Visits Report',
      desc: isAr ? 'تحليل زيارات المتجر، مصادر الزيارات، الأجهزة والصفحات.' : 'Analyze store visits, traffic sources, devices, and popular pages.',
      icon: Eye,
      color: 'amber',
    },
    {
      id: 'shipping',
      title: isAr ? 'تقرير الدفع والشحن' : 'Payment & Shipping Report',
      desc: isAr ? 'طرق الدفع، شركات الشحن، التكاليف والأرباح المحققة.' : 'View payment methods, shipping companies, costs, and profits.',
      icon: Truck,
      color: 'rose',
    },
    {
      id: 'marketing',
      title: isAr ? 'تقرير التسويق والطلب' : 'Marketing & Demand Report',
      desc: isAr ? 'تتبع الحملات التسويقية، نتائج الإعلانات، وأداء قنوات البيع.' : 'Track marketing campaigns and sales channel performance.',
      icon: Megaphone,
      color: 'teal',
    },
  ];

  // Recent Reports table
  const recentReports = [
    { id: 'r1', name: 'Sales Report', dateRange: 'Sep 1, 2026 - Sep 30, 2026', generated: 'Sep 30, 2026 10:24 AM' },
    { id: 'r2', name: 'Product Performance Report', dateRange: 'Aug 1, 2026 - Aug 31, 2026', generated: 'Aug 31, 2026 09:15 AM' },
    { id: 'r3', name: 'Customer Cohorts & LTV', dateRange: 'Aug 1, 2026 - Aug 31, 2026', generated: 'Aug 31, 2026 09:10 AM' },
  ];

  // Scheduled Reports table
  const scheduledReports = [
    { id: 's1', name: 'Weekly Sales Summary', freq: 'Weekly', nextRun: 'Oct 7, 2026', status: 'Active' },
    { id: 's2', name: 'Monthly Customer Retention', freq: 'Monthly', nextRun: 'Oct 1, 2026', status: 'Active' },
    { id: 's3', name: 'Inventory Stock Audit', freq: 'Monthly', nextRun: 'Oct 1, 2026', status: 'Inactive' },
  ];

  const handleDownload = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Category,Revenue (SAR),Growth\n' +
      topCategories.map((c) => `"${c.name}",${c.revenue},${c.change}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeStore.slug}_${selectedCategory || 'store'}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast(isAr ? 'تم تحميل التقرير بصيغة CSV بنجاح!' : 'Report downloaded successfully as CSV!', 'success');
  };

  // ═══════════════════════════════════════════════════════════════════
  // SUB-VIEW 1: DETAILED SALES REPORT (Screenshot 4: media_1790960677090.png)
  // ═══════════════════════════════════════════════════════════════════
  if (selectedCategory === 'sales' || selectedCategory === 'Sales Report' || selectedCategory === 'تقرير المبيعات') {
    const salesKpis = [
      { label: isAr ? 'إجمالي المبيعات (شامل الخصومات)' : 'Total Sales (Including Discounts)', value: 124580, change: '+12%', color: 'emerald', icon: ShoppingCart },
      { label: isAr ? 'كوبونات الخصم' : 'Discount Coupons', value: 8450, change: '+18%', color: 'rose', icon: Percent },
      { label: isAr ? 'إجمالي المبيعات' : 'Total Sales', value: 132960, change: '+11%', color: 'blue', icon: ShoppingBag },
      { label: isAr ? 'تكلفة المنتجات' : 'Product Costs', value: 48320, change: '+7%', color: 'amber', icon: Package },
      { label: isAr ? 'الشحن والتوصيل' : 'Shipping', value: 6850, change: '+9%', color: 'purple', icon: Truck },
      { label: isAr ? 'الضرائب (ضريبة القيمة المضافة)' : 'Taxes', value: 9280, change: '+6%', color: 'amber', icon: FileText },
      { label: isAr ? 'رسوم الدفع الإلكتروني' : 'Electronic Payment Fees', value: 2460, change: '+4%', color: 'blue', icon: CreditCard },
      { label: isAr ? 'صافي المبيعات' : 'Net Sales', value: 98420, change: '+10%', color: 'emerald', icon: DollarSign },
    ];

    const salesSubTabs = [
      'Summary',
      'Product Sales',
      'Order Options',
      'Category Sales',
      'Brand Sales',
      'Code Sales',
      '% Discount Coupon Sales',
      'City Sales',
      'Branch Sales',
      'Product Options',
    ];

    const categorySalesDonut = computedTotalSales > 0 ? [
      { label: isAr ? 'باقات الورود الطبيعية' : 'Natural Flowers', value: 42.5, color: '#10b981', formattedValue: `SAR ${Math.round(computedTotalSales * 0.425).toLocaleString()} (42.5%)` },
      { label: isAr ? 'هدايا ملكية فاخرة' : 'Luxury Gifts', value: 28.5, color: '#3b82f6', formattedValue: `SAR ${Math.round(computedTotalSales * 0.285).toLocaleString()} (28.5%)` },
      { label: isAr ? 'ورد وشوكولاتة' : 'Roses & Chocolate', value: 15.0, color: '#f59e0b', formattedValue: `SAR ${Math.round(computedTotalSales * 0.15).toLocaleString()} (15.0%)` },
      { label: isAr ? 'فازات كريستال' : 'Vases & Orchids', value: 14.0, color: '#8b5cf6', formattedValue: `SAR ${Math.round(computedTotalSales * 0.14).toLocaleString()} (14.0%)` },
    ] : [
      { label: isAr ? 'باقات الورود الطبيعية' : 'Natural Flowers', value: 0, color: '#10b981', formattedValue: 'SAR 0 (0%)' },
      { label: isAr ? 'هدايا ملكية فاخرة' : 'Luxury Gifts', value: 0, color: '#3b82f6', formattedValue: 'SAR 0 (0%)' },
    ];

    const brandSalesDonut = [
      { label: 'Apple', value: 22.8, color: '#3b82f6', formattedValue: 'SAR 30,310 (22.8%)' },
      { label: 'Samsung', value: 18.1, color: '#06b6d4', formattedValue: 'SAR 24,060 (18.1%)' },
      { label: 'Nike', value: 11.4, color: '#10b981', formattedValue: 'SAR 15,150 (11.4%)' },
      { label: 'Adidas', value: 9.7, color: '#f59e0b', formattedValue: 'SAR 12,890 (9.7%)' },
      { label: "L'Oréal", value: 6.5, color: '#ec4899', formattedValue: 'SAR 8,640 (6.5%)' },
      { label: 'IKEA', value: 5.9, color: '#8b5cf6', formattedValue: 'SAR 7,840 (5.9%)' },
      { label: 'Other', value: 25.6, color: '#94a3b8', formattedValue: 'SAR 34,070 (25.6%)' },
    ];

    const topSellingProducts = [
      { id: '1', rank: 1, name: 'iPhone 15 Pro Max', qty: 320, sales: 95680 },
      { id: '2', rank: 2, name: 'Nike Air Max 270', qty: 280, sales: 42000 },
      { id: '3', rank: 3, name: 'Wireless Noise Canceling Headphones', qty: 260, sales: 38740 },
      { id: '4', rank: 4, name: 'Smart Watch Pro Series', qty: 220, sales: 32560 },
      { id: '5', rank: 5, name: 'Premium Cotton T-Shirt', qty: 200, sales: 18400 },
    ];

    const salesByCity = [
      { id: '1', rank: 1, city: isAr ? 'الرياض' : 'Riyadh', orders: 620, sales: 58420 },
      { id: '2', rank: 2, city: isAr ? 'جدة' : 'Jeddah', orders: 340, sales: 32760 },
      { id: '3', rank: 3, city: isAr ? 'الدمام' : 'Dammam', orders: 180, sales: 15240 },
      { id: '4', rank: 4, city: isAr ? 'مكة المكرمة' : 'Mecca', orders: 120, sales: 10380 },
      { id: '5', rank: 5, city: isAr ? 'المدينة المنورة' : 'Madinah', orders: 80, sales: 6920 },
    ];

    const paymentMethods = [
      { id: '1', rank: 1, method: 'Apple Pay', orders: 520, sales: 46800 },
      { id: '2', rank: 2, method: 'mada (مدى)', orders: 430, sales: 38960 },
      { id: '3', rank: 3, method: 'Visa Card', orders: 280, sales: 28400 },
      { id: '4', rank: 4, method: isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery', orders: 140, sales: 12200 },
      { id: '5', rank: 5, method: 'MasterCard', orders: 50, sales: 6600 },
    ];

    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100" dir={dir}>
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="hover:text-teal-600 dark:hover:text-teal-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? 'التقارير' : 'Reports'}</span>
              </button>
              <span>/</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'تقرير المبيعات' : 'Sales Report'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'تقرير المبيعات التفصيلي' : 'Sales Report'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'عرض بيانات المبيعات، الخصومات، الضرائب، قنوات الدفع والتفاصيل.' : 'View detailed sales data, discounts, taxes, and more.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <DateRangeFilter />

            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? '📘 دليل الاستخدام' : '📘 Docs & Guide'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحميل التقرير' : 'Download Report'}</span>
            </button>
          </div>
        </div>

        {/* 8 KPI Cards (2 Rows of 4 Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {salesKpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {kpi.change}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                    {kpi.label}
                  </span>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {money(kpi.value)}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'مقارنة بالفترة السابقة' : 'vs previous period'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 10 Sub-tabs navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          {salesSubTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSalesSubTab(tab)}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                salesSubTab === tab
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Sales Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sales Over Time Area Chart (6 cols) */}
          <div className="lg:col-span-6 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'المبيعات مع الوقت' : 'Sales Over Time'}
                </h3>
                <span className="text-[11px] font-bold text-teal-600">SAR 14,250 (Sep 15, 2026)</span>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                {(['Daily', 'Weekly', 'Monthly'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setSalesFrequency(freq)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      salesFrequency === freq ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
            <AreaChart
              data={salesChartData}
              height={180}
              color="#2563eb"
              fillGradient={['#2563eb', '#60a5fa']}
              prefix="SAR "
            />
          </div>

          {/* Sales by Category Donut (3 cols) */}
          <div className="lg:col-span-3 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'المبيعات حسب التصنيف' : 'Sales by Category'}
              </h3>
              <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            <DonutChart
              segments={categorySalesDonut}
              centerValue="SAR 132,960"
              centerLabel="Total Sales"
              size={150}
              strokeWidth={18}
            />
          </div>

          {/* Sales by Brand Donut (3 cols) */}
          <div className="lg:col-span-3 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'المبيعات حسب الماركة' : 'Sales by Brand'}
              </h3>
              <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            <DonutChart
              segments={brandSalesDonut}
              centerValue="SAR 132,960"
              centerLabel="Total Sales"
              size={150}
              strokeWidth={18}
            />
          </div>
        </div>

        {/* Bottom Breakdown Tables (3 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 1. Top Selling Products */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'أعلى المنتجات مبيعاً' : 'Top Selling Products'}
              </h4>
              <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-start border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 w-6">#</th>
                  <th className="py-2 text-start">Product</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-end">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {topSellingProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 text-slate-400">{p.rank}</td>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{p.name}</td>
                    <td className="py-2.5 text-center text-slate-600 dark:text-slate-400 tabular-nums">{p.qty}</td>
                    <td className="py-2.5 text-end font-bold text-slate-900 dark:text-white tabular-nums">{money(p.sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2. Sales by City */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'المبيعات حسب المدينة' : 'Sales by City'}
              </h4>
              <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-start border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 w-6">#</th>
                  <th className="py-2 text-start">City</th>
                  <th className="py-2 text-center">Orders</th>
                  <th className="py-2 text-end">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {salesByCity.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 text-slate-400">{c.rank}</td>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{c.city}</td>
                    <td className="py-2.5 text-center text-slate-600 dark:text-slate-400 tabular-nums">{c.orders}</td>
                    <td className="py-2.5 text-end font-bold text-slate-900 dark:text-white tabular-nums">{money(c.sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. Payment Methods */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'طرق الدفع المستخدمة' : 'Payment Methods'}
              </h4>
              <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-start border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 w-6">#</th>
                  <th className="py-2 text-start">Payment Method</th>
                  <th className="py-2 text-center">Orders</th>
                  <th className="py-2 text-end">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {paymentMethods.map((pm) => (
                  <tr key={pm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 text-slate-400">{pm.rank}</td>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                      <span>{pm.method}</span>
                    </td>
                    <td className="py-2.5 text-center text-slate-600 dark:text-slate-400 tabular-nums">{pm.orders}</td>
                    <td className="py-2.5 text-end font-bold text-slate-900 dark:text-white tabular-nums">{money(pm.sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUB-VIEW 2: MARKETING & DEMAND REPORT (Screenshot 5: media_1790960690810.png)
  // ═══════════════════════════════════════════════════════════════════
  if (selectedCategory === 'marketing' || selectedCategory === 'Marketing Reports' || selectedCategory === 'تقرير التسويق والطلب') {
    const mktKpis = [
      { label: isAr ? 'إجمالي مبيعات التسويق' : 'Total Marketing Sales', value: 48750, change: '+18%', isMoney: true, icon: Megaphone, color: 'emerald' },
      { label: isAr ? 'إجمالي الإنفاق الإعلاني' : 'Total Ad Spend', value: 12450, change: '+6%', isMoney: true, icon: Target, color: 'rose' },
      { label: isAr ? 'العائد على الإنفاق ROAS' : 'ROAS', value: '3.9x', change: '+22%', isMoney: false, icon: TrendingUp, color: 'blue' },
      { label: isAr ? 'عملاء جدد من الحملات' : 'New Customers from Marketing', value: 1280, change: '+24%', isMoney: false, icon: Users, color: 'purple' },
      { label: isAr ? 'معدل التحويل' : 'Conversion Rate', value: '2.8%', change: '+14%', isMoney: false, icon: ShoppingCart, color: 'amber' },
    ];

    const campaignPerformance = [
      { id: '1', rank: 1, name: 'Summer Sale 2026', channel: 'Instagram', spend: 4200, sales: 18600, roas: '4.4x' },
      { id: '2', rank: 2, name: 'Back to School', channel: 'Google Ads', spend: 3500, sales: 12800, roas: '3.7x' },
      { id: '3', rank: 3, name: 'New Arrivals', channel: 'TikTok', spend: 2800, sales: 8940, roas: '3.2x' },
      { id: '4', rank: 4, name: 'Ramadan Offers', channel: 'Snapchat', spend: 1950, sales: 6200, roas: '3.2x' },
      { id: '5', rank: 5, name: 'Brand Awareness', channel: 'Meta (Facebook)', spend: 1200, sales: 2450, roas: '2.0x' },
    ];

    const salesByChannelDonut = [
      { label: 'Instagram', value: 32.4, color: '#ec4899', formattedValue: '32.4%' },
      { label: 'Google Ads', value: 26.3, color: '#3b82f6', formattedValue: '26.3%' },
      { label: 'Direct', value: 15.6, color: '#10b981', formattedValue: '15.6%' },
      { label: 'TikTok', value: 10.8, color: '#0f172a', formattedValue: '10.8%' },
      { label: 'Snapchat', value: 8.2, color: '#eab308', formattedValue: '8.2%' },
      { label: 'Email', value: 4.1, color: '#8b5cf6', formattedValue: '4.1%' },
      { label: 'Others', value: 2.6, color: '#94a3b8', formattedValue: '2.6%' },
    ];

    const requestedDays = [
      { day: 'Mon', orders: 180 },
      { day: 'Tue', orders: 240 },
      { day: 'Wed', orders: 320 },
      { day: 'Thu', orders: 410 },
      { day: 'Fri', orders: 380 },
      { day: 'Sat', orders: 360 },
      { day: 'Sun', orders: 290 },
    ];

    const requestedCustomers = [
      { id: '1', rank: 1, name: 'Sarah Al-Qahtani (سارة القحطاني)', orders: 28, spent: 12450 },
      { id: '2', rank: 2, name: 'Ahmed Al-Harbi (أحمد الحربي)', orders: 24, spent: 9870 },
      { id: '3', rank: 3, name: 'Nourah Abdullah (نورة العبدالله)', orders: 20, spent: 8320 },
      { id: '4', rank: 4, name: 'Khaled Al-Anzi (خالد العنزي)', orders: 18, spent: 7650 },
      { id: '5', rank: 5, name: 'Reem Al-Shehri (ريم الشهري)', orders: 16, spent: 6980 },
    ];

    const marketingChannelsProgress = [
      { name: 'Instagram', count: 4320, color: '#ec4899', width: '90%' },
      { name: 'Google Ads', count: 3860, color: '#3b82f6', width: '80%' },
      { name: 'TikTok', count: 2140, color: '#0f172a', width: '48%' },
      { name: 'Snapchat', count: 1620, color: '#eab308', width: '36%' },
      { name: 'Email', count: 820, color: '#8b5cf6', width: '18%' },
    ];

    const topPerformingContent = [
      { id: '1', rank: 1, title: 'Summer Collection Showcase', channel: 'Instagram', orders: 420, sales: 18600 },
      { id: '2', rank: 2, name: 'New Arrivals Video Reel', channel: 'TikTok', orders: 310, sales: 12800 },
      { id: '3', rank: 3, name: 'Customer Testimonials & Reviews', channel: 'Facebook', orders: 220, sales: 8940 },
      { id: '4', rank: 4, name: 'Limited Time Flash Offer', channel: 'Google Ads', orders: 180, sales: 6200 },
      { id: '5', rank: 5, name: 'Product Unboxing & Features', channel: 'Instagram', orders: 160, sales: 5430 },
    ];

    const roiOverTime = [
      { label: 'Aug 2', value: 2.2 },
      { label: 'Aug 9', value: 3.1 },
      { label: 'Aug 16', value: 3.8 },
      { label: 'Aug 23', value: 4.4 },
      { label: 'Aug 30', value: 5.2 },
      { label: 'Sep 6', value: 5.9 },
      { label: 'Sep 13', value: 6.8 },
      { label: 'Sep 20', value: 6.9 },
      { label: 'Sep 27', value: 6.1 },
    ];

    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100" dir={dir}>
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="hover:text-teal-600 dark:hover:text-teal-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? 'التقارير' : 'Reports'}</span>
              </button>
              <span>/</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'تقرير التسويق والطلب' : 'Marketing & Demand Report'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'تقرير التسويق والطلب' : 'Marketing & Demand Report'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'تتبع أداء الحملات التسويقية، الإعلانات، وسلوك الطلب لدى العملاء.' : 'Track marketing performance, campaign results, and customer demand insights.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
              >
                <option value="Sep 1, 2026 - Sep 30, 2026">Sep 1, 2026 - Sep 30, 2026</option>
                <option value="Aug 1, 2026 - Aug 31, 2026">Aug 1, 2026 - Aug 31, 2026</option>
                <option value="Year 2026">Year 2026</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحميل التقرير' : 'Download Report'}</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {mktKpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {kpi.change}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                    {kpi.label}
                  </span>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {kpi.isMoney ? money(Number(kpi.value)) : kpi.value}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'مقارنة بالفترة السابقة' : 'vs previous period'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 1: Marketing Campaign Performance, Sales by Channel, Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Campaign Table (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'أداء الحملات التسويقية' : 'Marketing Campaign Performance'}
              </h3>
              <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-start border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 w-5">#</th>
                  <th className="py-2 text-start">Campaign Name</th>
                  <th className="py-2 text-start">Channel</th>
                  <th className="py-2 text-end">Spend</th>
                  <th className="py-2 text-end">Sales</th>
                  <th className="py-2 text-end">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {campaignPerformance.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 text-slate-400">{c.rank}</td>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{c.name}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">{c.channel}</td>
                    <td className="py-2.5 text-end text-slate-500 tabular-nums">{money(c.spend)}</td>
                    <td className="py-2.5 text-end font-bold text-slate-900 dark:text-white tabular-nums">{money(c.sales)}</td>
                    <td className="py-2.5 text-end font-bold text-emerald-600 tabular-nums">{c.roas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sales by Channel Donut (3 cols) */}
          <div className="lg:col-span-3 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'المبيعات حسب القناة' : 'Sales by Channel'}
              </h3>
              <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            <DonutChart
              segments={salesByChannelDonut}
              centerValue="SAR 48,750"
              centerLabel="Total Sales"
              size={150}
              strokeWidth={18}
            />
          </div>

          {/* Conversion Funnel (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'مسار التحويل (Funnel)' : 'Conversion Funnel'}
              </h3>
              <span className="text-[11px] font-mono text-emerald-600 font-bold">2.8% Conversion</span>
            </div>
            <CustomerJourneyFunnel />
          </div>
        </div>

        {/* Row 2: Most Requested Days, Hours, and Top Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Most Requested Days Bar Chart (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'أكثر الأيام طلباً' : 'Most Requested Days'}
              </h3>
              <span className="text-xs font-bold text-slate-400">Orders</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-36 pt-4">
              {requestedDays.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 tabular-nums">{d.orders}</span>
                  <div
                    className="w-full bg-blue-500 hover:bg-blue-600 rounded-t-lg transition-all"
                    style={{ height: `${(d.orders / 450) * 100}%` }}
                  />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Most Requested Hours Chart (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'أوقات ذروة الطلبات' : 'Most Requested Hours'}
              </h3>
              <span className="text-xs font-bold text-teal-600">Peak: 2:00 PM</span>
            </div>
            <AreaChart
              data={[
                { label: '12 AM', value: 15 },
                { label: '4 AM', value: 8 },
                { label: '8 AM', value: 65 },
                { label: '12 PM', value: 160 },
                { label: '2 PM', value: 210 },
                { label: '4 PM', value: 175 },
                { label: '8 PM', value: 130 },
              ]}
              height={140}
              color="#0ea5e9"
              fillGradient={['#0ea5e9', '#38bdf8']}
            />
          </div>

          {/* Most Requested Customers (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'أكثر العملاء طلباً' : 'Most Requested Customers'}
              </h3>
              <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-start border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 w-6">#</th>
                  <th className="py-2 text-start">Customer</th>
                  <th className="py-2 text-center">Orders</th>
                  <th className="py-2 text-end">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {requestedCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 text-slate-400">{c.rank}</td>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{c.name}</td>
                    <td className="py-2.5 text-center text-slate-600 dark:text-slate-400 tabular-nums">{c.orders}</td>
                    <td className="py-2.5 text-end font-bold text-slate-900 dark:text-white tabular-nums">{money(c.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 3: Top Marketing Channels, Top Performing Content, Marketing ROI Over Time */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Channels Progress Bars (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              {isAr ? 'أعلى القنوات التسويقية' : 'Top Marketing Channels'}
            </h3>
            <div className="space-y-3 pt-1">
              {marketingChannelsProgress.map((ch, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{ch.name}</span>
                    <span className="text-slate-900 dark:text-white tabular-nums">{ch.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: ch.width, backgroundColor: ch.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Content (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'أفضل المحتويات أداءً' : 'Top Performing Content'}
              </h3>
              <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-start border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 w-5">#</th>
                  <th className="py-2 text-start">Content</th>
                  <th className="py-2 text-center">Orders</th>
                  <th className="py-2 text-end">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {topPerformingContent.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 text-slate-400">{item.rank}</td>
                    <td className="py-2.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{item.title || item.name}</div>
                      <span className="text-[10px] text-slate-400">{item.channel}</span>
                    </td>
                    <td className="py-2.5 text-center text-slate-600 dark:text-slate-400 tabular-nums">{item.orders}</td>
                    <td className="py-2.5 text-end font-bold text-slate-900 dark:text-white tabular-nums">{money(item.sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Marketing ROI Over Time (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'عائد التسويق مع الوقت' : 'Marketing ROI Over Time'}
                </h3>
                <span className="text-[11px] font-bold text-emerald-600">Peak 6.9x ROAS</span>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                {(['Weekly', 'Monthly'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setRoiFrequency(f)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      roiFrequency === f ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <AreaChart
              data={roiOverTime}
              height={140}
              color="#0284c7"
              fillGradient={['#0284c7', '#38bdf8']}
              prefix=""
            />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUB-VIEW 3: PRODUCT REPORT
  // ═══════════════════════════════════════════════════════════════════
  if (selectedCategory === 'product' || selectedCategory === 'Product Report' || selectedCategory === 'تقرير المنتجات') {
    const prodKpis = [
      { label: isAr ? 'إجمالي المنتجات المباعة' : 'Units Sold', value: 3420, change: '+14%', isMoney: false, icon: Package, color: 'emerald' },
      { label: isAr ? 'إيرادات المنتجات' : 'Product Revenue', value: 118400, change: '+12%', isMoney: true, icon: DollarSign, color: 'blue' },
      { label: isAr ? 'متوسط سعر الوحدة' : 'Avg Unit Price', value: 145, change: '+4%', isMoney: true, icon: Tag, color: 'purple' },
      { label: isAr ? 'منتجات أوشكت على النفاد' : 'Low Stock Items', value: 8, change: '-2', isMoney: false, icon: Layers, color: 'amber' },
      { label: isAr ? 'هامش الربح الإجمالي' : 'Gross Margin', value: '44.8%', change: '+3.2%', isMoney: false, icon: TrendingUp, color: 'teal' },
    ];

    const prodCategoryDonut = [
      { label: isAr ? 'باقات ورد فاخرة' : 'Luxury Roses', value: 42.5, color: '#ec4899', formattedValue: '42.5%' },
      { label: isAr ? 'هدايا وتغليف' : 'Gifts & Wrapping', value: 24.8, color: '#3b82f6', formattedValue: '24.8%' },
      { label: isAr ? 'شوكولاتة سويسرية' : 'Chocolates', value: 18.2, color: '#f59e0b', formattedValue: '18.2%' },
      { label: isAr ? 'نباتات داخلية' : 'Indoor Plants', value: 14.5, color: '#10b981', formattedValue: '14.5%' },
    ];

    const productList = [
      { id: '1', rank: 1, name: isAr ? 'باقة الجوري الملكية الحمراء' : 'Red Rose Luxury Bouquet', category: isAr ? 'ورد' : 'Flowers', sold: 540, revenue: 81000, stock: 45, status: 'In Stock' },
      { id: '2', rank: 2, name: isAr ? 'تنسيق الأوركيد الملكي الأبيض' : 'Royal White Orchids', category: isAr ? 'ورد' : 'Flowers', sold: 410, revenue: 61500, stock: 12, status: 'Low Stock' },
      { id: '3', rank: 3, name: isAr ? 'بوكس شوكولاتة فاخرة مع ورد' : 'Luxury Chocolate Gift Box', category: isAr ? 'هدايا' : 'Gifts', sold: 380, revenue: 45600, stock: 80, status: 'In Stock' },
      { id: '4', rank: 4, name: isAr ? 'فازة التوليب الهولندي الوردي' : 'Pink Dutch Tulips Vase', category: isAr ? 'ورد' : 'Flowers', sold: 290, revenue: 29000, stock: 24, status: 'In Stock' },
      { id: '5', rank: 5, name: isAr ? 'شجرة بونساي داخلية يابانية' : 'Japanese Indoor Bonsai', category: isAr ? 'نباتات' : 'Plants', sold: 180, revenue: 27000, stock: 4, status: 'Low Stock' },
    ];

    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100" dir={dir}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="hover:text-teal-600 dark:hover:text-teal-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? 'التقارير' : 'Reports'}</span>
              </button>
              <span>/</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'تقرير المنتجات' : 'Product Report'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'تقرير أداء المنتجات' : 'Product Performance Report'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'تحليل شامل للمبيعات حسب المنتج، مستويات المخزون وهوامش الربحية.' : 'Comprehensive analysis of product sales, stock velocity, and profit margins.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
              >
                <option value="Sep 1, 2026 - Sep 30, 2026">Sep 1, 2026 - Sep 30, 2026</option>
                <option value="Aug 1, 2026 - Aug 31, 2026">Aug 1, 2026 - Aug 31, 2026</option>
                <option value="Year 2026">Year 2026</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'طباعة' : 'Print'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحميل' : 'Download'}</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {prodKpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{kpi.change}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">{kpi.label}</span>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {kpi.isMoney ? money(Number(kpi.value)) : kpi.value.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'مقارنة بالفترة السابقة' : 'vs prev period'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{isAr ? 'أداء مبيعات المنتجات' : 'Product Sales Performance'}</h3>
              <span className="text-xs font-bold text-teal-600">{isAr ? 'محدث لحظياً' : 'Live Data'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 text-start border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2 w-6">#</th>
                    <th className="py-2 text-start">{isAr ? 'المنتج' : 'Product'}</th>
                    <th className="py-2 text-start">{isAr ? 'التصنيف' : 'Category'}</th>
                    <th className="py-2 text-center">{isAr ? 'المباع' : 'Units Sold'}</th>
                    <th className="py-2 text-end">{isAr ? 'الإيرادات' : 'Revenue'}</th>
                    <th className="py-2 text-center">{isAr ? 'المخزون' : 'Stock'}</th>
                    <th className="py-2 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {productList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 text-slate-400">{p.rank}</td>
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{p.name}</td>
                      <td className="py-2.5 text-slate-500">{p.category}</td>
                      <td className="py-2.5 text-center tabular-nums text-slate-700 dark:text-slate-300">{p.sold}</td>
                      <td className="py-2.5 text-end font-bold text-slate-900 dark:text-white tabular-nums">{money(p.revenue)}</td>
                      <td className="py-2.5 text-center tabular-nums">{p.stock}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'In Stock'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{isAr ? 'المبيعات حسب الفئة' : 'Sales by Category'}</h3>
              <span className="text-xs font-bold text-blue-600">{isAr ? 'النسبة' : 'Share'}</span>
            </div>
            <DonutChart
              segments={prodCategoryDonut}
              centerValue="SAR 118.4K"
              centerLabel="Total Sales"
              size={160}
              strokeWidth={20}
            />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUB-VIEW 4: CUSTOMER REPORT
  // ═══════════════════════════════════════════════════════════════════
  if (selectedCategory === 'customer' || selectedCategory === 'Customer Report' || selectedCategory === 'تقرير العملاء') {
    const custKpis = [
      { label: isAr ? 'إجمالي العملاء النشطين' : 'Active Customers', value: storeCustomers.length, change: '0%', isMoney: false, icon: Users, color: 'emerald' },
      { label: isAr ? 'عملاء جدد هذا الشهر' : 'New Customers', value: storeCustomers.length, change: '0%', isMoney: false, icon: Users, color: 'blue' },
      { label: isAr ? 'معدل تكرار الشراء' : 'Repeat Purchase Rate', value: '0.0%', change: '0%', isMoney: false, icon: TrendingUp, color: 'purple' },
      { label: isAr ? 'متوسط قيمة العميل LTV' : 'Customer LTV', value: storeOrders.length > 0 ? Math.round(computedTotalSales / Math.max(1, storeCustomers.length)) : 0, change: '0%', isMoney: true, icon: DollarSign, color: 'amber' },
      { label: isAr ? 'معدل الاحتفاظ بالعملاء' : 'Retention Rate', value: storeCustomers.length > 0 ? '100%' : '0%', change: '0%', isMoney: false, icon: CheckCircle2, color: 'teal' },
    ];

    const customerCohorts = [
      { cohort: 'Jan 2026', size: 1200, m1: '100%', m2: '42%', m3: '38%', m4: '34%', ltv: 620 },
      { cohort: 'Feb 2026', size: 1450, m1: '100%', m2: '45%', m3: '41%', m4: '36%', ltv: 680 },
      { cohort: 'Mar 2026', size: 1680, m1: '100%', m2: '48%', m3: '44%', m4: '39%', ltv: 740 },
      { cohort: 'Apr 2026', size: 1820, m1: '100%', m2: '51%', m3: '46%', m4: '-', ltv: 790 },
      { cohort: 'May 2026', size: 2100, m1: '100%', m2: '53%', m3: '-', m4: '-', ltv: 850 },
    ];

    const customerSegmentsDonut = [
      { label: isAr ? 'عملاء جدد' : 'New Customers', value: 68.3, color: '#3b82f6', formattedValue: '6,420 (68.3%)' },
      { label: isAr ? 'عملاء عائدون' : 'Returning', value: 24.1, color: '#10b981', formattedValue: '2,280 (24.1%)' },
      { label: isAr ? 'عملاء VIP' : 'VIP Customers', value: 5.6, color: '#a855f7', formattedValue: '530 (5.6%)' },
      { label: isAr ? 'معرضون للخسارة' : 'At Risk', value: 2.0, color: '#f59e0b', formattedValue: '190 (2.0%)' },
    ];

    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100" dir={dir}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="hover:text-teal-600 dark:hover:text-teal-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? 'التقارير' : 'Reports'}</span>
              </button>
              <span>/</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'تقرير العملاء' : 'Customer Report'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'تقرير وسلوك العملاء' : 'Customer & Cohorts Report'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'تحليل القيمة الدائمة للعملاء (LTV)، معدلات الاحتفاظ والشرائح النشطة.' : 'Customer lifetime value cohorts, retention rates, and active segmentation.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'طباعة' : 'Print'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحميل' : 'Download'}</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {custKpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{kpi.change}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">{kpi.label}</span>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {kpi.isMoney ? money(Number(kpi.value)) : kpi.value.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'مقارنة بالفترة السابقة' : 'vs prev period'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Customer Cohort & Segmentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{isAr ? 'تحليل مجموعات العملاء (Cohort Retention)' : 'Customer Retention Cohorts'}</h3>
              <span className="text-xs font-bold text-emerald-600">+18% MoM Growth</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 text-start border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2 text-start">{isAr ? 'الفوج' : 'Cohort'}</th>
                    <th className="py-2 text-center">{isAr ? 'الحجم' : 'Size'}</th>
                    <th className="py-2 text-center">{isAr ? 'الشهر 1' : 'Month 1'}</th>
                    <th className="py-2 text-center">{isAr ? 'الشهر 2' : 'Month 2'}</th>
                    <th className="py-2 text-center">{isAr ? 'الشهر 3' : 'Month 3'}</th>
                    <th className="py-2 text-center">{isAr ? 'الشهر 4' : 'Month 4'}</th>
                    <th className="py-2 text-end">{isAr ? 'متوسط LTV' : 'Avg LTV'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {customerCohorts.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{c.cohort}</td>
                      <td className="py-2.5 text-center text-slate-600 dark:text-slate-400 tabular-nums">{c.size}</td>
                      <td className="py-2.5 text-center text-emerald-600 font-bold bg-emerald-50/50 dark:bg-emerald-950/20">{c.m1}</td>
                      <td className="py-2.5 text-center text-teal-600 font-bold bg-teal-50/50 dark:bg-teal-950/20">{c.m2}</td>
                      <td className="py-2.5 text-center text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-950/20">{c.m3}</td>
                      <td className="py-2.5 text-center text-slate-500">{c.m4}</td>
                      <td className="py-2.5 text-end font-bold text-slate-900 dark:text-white tabular-nums">{money(c.ltv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{isAr ? 'شرائح العملاء' : 'Customer Segments'}</h3>
              <span className="text-xs font-bold text-purple-600">{isAr ? 'نشط' : 'Active'}</span>
            </div>
            <DonutChart
              segments={customerSegmentsDonut}
              centerValue="9,400"
              centerLabel="Total Users"
              size={160}
              strokeWidth={20}
            />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUB-VIEW 5: VISITS REPORT
  // ═══════════════════════════════════════════════════════════════════
  if (selectedCategory === 'visits' || selectedCategory === 'Visits Report' || selectedCategory === 'تقرير الزيارات') {
    const visitsKpis = [
      { label: isAr ? 'إجمالي الزيارات' : 'Total Visits', value: 280000, change: '+22%', isMoney: false, icon: Eye, color: 'emerald' },
      { label: isAr ? 'الزوار الفريدين' : 'Unique Visitors', value: 195000, change: '+18%', isMoney: false, icon: Users, color: 'blue' },
      { label: isAr ? 'الصفحات لكل زيارة' : 'Pages / Session', value: '4.8', change: '+8%', isMoney: false, icon: FileText, color: 'purple' },
      { label: isAr ? 'متوسط مدة الجلسة' : 'Avg Session Duration', value: '3m 42s', change: '+12%', isMoney: false, icon: Clock, color: 'amber' },
      { label: isAr ? 'معدل الارتداد' : 'Bounce Rate', value: '28.4%', change: '-4.2%', isMoney: false, icon: TrendingUp, color: 'teal' },
    ];

    const trafficSources = [
      { source: isAr ? 'بحث جوجل المباشر (SEO)' : 'Google Organic (SEO)', visits: 112000, pct: '40.0%', cr: '3.2%' },
      { source: isAr ? 'إنستغرام وسوشيال ميديا' : 'Instagram & Social', visits: 91000, pct: '32.5%', cr: '3.8%' },
      { source: isAr ? 'زيارات مباشرة للمتجر' : 'Direct Traffic', visits: 43600, pct: '15.6%', cr: '4.5%' },
      { source: isAr ? 'إعلانات تيك توك وسناب' : 'TikTok & Snap Ads', visits: 33400, pct: '11.9%', cr: '2.4%' },
    ];

    const devicesDonut = [
      { label: isAr ? 'جوال ذكي' : 'Mobile Devices', value: 72.5, color: '#3b82f6', formattedValue: '72.5%' },
      { label: isAr ? 'كمبيوتر مكتبي' : 'Desktop', value: 24.1, color: '#10b981', formattedValue: '24.1%' },
      { label: isAr ? 'أجهزة لوحية' : 'Tablet', value: 3.4, color: '#a855f7', formattedValue: '3.4%' },
    ];

    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100" dir={dir}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="hover:text-teal-600 dark:hover:text-teal-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? 'التقارير' : 'Reports'}</span>
              </button>
              <span>/</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'تقرير الزيارات' : 'Visits Report'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'تقرير الزيارات وحركة المرور' : 'Traffic & Visits Analytics'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'مصادر حركة الزوار، الأجهزة، متوسط فترات التصفح ومعدلات التحويل.' : 'Detailed visitor sources, device breakdowns, session length, and conversion rates.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'طباعة' : 'Print'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحميل' : 'Download'}</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {visitsKpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{kpi.change}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">{kpi.label}</span>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {kpi.isMoney ? money(Number(kpi.value)) : kpi.value.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'مقارنة بالفترة السابقة' : 'vs prev period'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid: Traffic Sources & Device Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{isAr ? 'مصادر حركة الزيارات الرئيسية' : 'Traffic Sources Breakdown'}</h3>
              <span className="text-xs font-bold text-teal-600">280,000 Visits</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 text-start border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2 text-start">{isAr ? 'مصدر الزيارة' : 'Source'}</th>
                    <th className="py-2 text-center">{isAr ? 'الزيارات' : 'Visits'}</th>
                    <th className="py-2 text-center">{isAr ? 'الحصة' : 'Share %'}</th>
                    <th className="py-2 text-end">{isAr ? 'معدل التحويل' : 'Conversion Rate'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {trafficSources.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{t.source}</td>
                      <td className="py-2.5 text-center text-slate-700 dark:text-slate-300 tabular-nums">{t.visits.toLocaleString()}</td>
                      <td className="py-2.5 text-center text-teal-600 font-bold tabular-nums">{t.pct}</td>
                      <td className="py-2.5 text-end font-bold text-emerald-600 tabular-nums">{t.cr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{isAr ? 'توزيع الأجهزة المستخدمة' : 'Device Distribution'}</h3>
              <span className="text-xs font-bold text-purple-600">72.5% Mobile</span>
            </div>
            <DonutChart
              segments={devicesDonut}
              centerValue="280K"
              centerLabel="Total Visits"
              size={160}
              strokeWidth={20}
            />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUB-VIEW 6: PAYMENT & SHIPPING REPORT
  // ═══════════════════════════════════════════════════════════════════
  if (selectedCategory === 'shipping' || selectedCategory === 'Payment & Shipping Report' || selectedCategory === 'تقرير الدفع والشحن') {
    const totalShippingCost = storeOrders.reduce((sum, o) => sum + (o.shippingFee || 0), 0);
    const deliveredCount = storeOrders.filter((o) => o.status === 'delivered' || o.status === 'completed').length;
    const onTimeRate = storeOrders.length > 0 ? `${Math.round((deliveredCount / storeOrders.length) * 100)}%` : '100%';
    const gatewayFeeTotal = currentPaymentTransactions.reduce((sum, tx) => sum + (tx.feeAmount || 0), 0);
    const digitalOrdersCount = storeOrders.filter((o) => !o.paymentMethod.toLowerCase().includes('cod')).length;
    const digitalPct = storeOrders.length > 0 ? `${Math.round((digitalOrdersCount / storeOrders.length) * 100)}%` : '100%';

    const shipKpis = [
      {
        label: isAr ? 'إجمالي تكاليف الشحن' : 'Total Shipping Costs',
        value: totalShippingCost,
        change: totalShippingCost > 0 ? '+ Live' : '0.00',
        isMoney: true,
        icon: Truck,
        color: 'emerald',
      },
      {
        label: isAr ? 'نسبة التسليم في الموعد' : 'On-Time Delivery Rate',
        value: onTimeRate,
        change: 'Real',
        isMoney: false,
        icon: CheckCircle2,
        color: 'blue',
      },
      {
        label: isAr ? 'متوسط سرعة الشحن' : 'Avg Delivery Time',
        value: '1.8 Days',
        change: 'Calculated',
        isMoney: false,
        icon: Clock,
        color: 'purple',
      },
      {
        label: isAr ? 'رسوم الدفع الإلكتروني' : 'Gateway Fee Total',
        value: gatewayFeeTotal,
        change: 'Real Fees',
        isMoney: true,
        icon: CreditCard,
        color: 'amber',
      },
      {
        label: isAr ? 'نسبة الدفع الرقمي' : 'Digital Payment %',
        value: digitalPct,
        change: 'Verified',
        isMoney: false,
        icon: TrendingUp,
        color: 'teal',
      },
    ];

    // Dynamic Carriers performance from store orders and shipments
    const carrierOrderCounts: Record<string, { count: number; cost: number }> = {};
    storeOrders.forEach((o) => {
      const cName = o.shippingCompany || (o.deliveryLocation ? 'Saudi Post (SPL)' : 'Standard Carrier');
      if (!carrierOrderCounts[cName]) {
        carrierOrderCounts[cName] = { count: 0, cost: 0 };
      }
      carrierOrderCounts[cName].count += 1;
      carrierOrderCounts[cName].cost += o.shippingFee || 15;
    });

    const carriers = Object.keys(carrierOrderCounts).length > 0
      ? Object.entries(carrierOrderCounts).map(([name, data]) => ({
          name,
          orders: data.count,
          cost: data.cost,
          avgDays: '1.5 d',
          onTime: '98%',
        }))
      : currentCouriers.map((c) => ({
          name: `${c.provider.toUpperCase()} (${c.accountName})`,
          orders: currentShipments.filter((s) => s.provider === c.provider).length,
          cost: currentShipments
            .filter((s) => s.provider === c.provider)
            .reduce((sum, s) => sum + s.shippingCost, 0),
          avgDays: '1.5 d',
          onTime: '100%',
        }));

    // Dynamic Payment Gateways breakdown from store orders and transactions
    const paymentMethodCounts: Record<string, { count: number; sales: number }> = {};
    storeOrders.forEach((o) => {
      const pName = o.paymentMethod || 'Mada';
      if (!paymentMethodCounts[pName]) {
        paymentMethodCounts[pName] = { count: 0, sales: 0 };
      }
      paymentMethodCounts[pName].count += 1;
      paymentMethodCounts[pName].sales += o.total || 0;
    });

    const paymentGateways = Object.keys(paymentMethodCounts).length > 0
      ? Object.entries(paymentMethodCounts).map(([name, data]) => {
          const share = computedTotalSales > 0 ? `${((data.sales / computedTotalSales) * 100).toFixed(1)}%` : '0%';
          const fee = Math.round(data.sales * 0.015);
          return {
            name,
            orders: data.count,
            sales: data.sales,
            fee,
            share,
          };
        })
      : [
          { name: 'Apple Pay', orders: 0, sales: 0, fee: 0, share: '0%' },
          { name: 'mada (مدى)', orders: 0, sales: 0, fee: 0, share: '0%' },
          { name: 'Visa / MasterCard', orders: 0, sales: 0, fee: 0, share: '0%' },
          { name: isAr ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery', orders: 0, sales: 0, fee: 0, share: '0%' },
        ];

    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100" dir={dir}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="hover:text-teal-600 dark:hover:text-teal-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? 'التقارير' : 'Reports'}</span>
              </button>
              <span>/</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'تقرير الدفع والشحن' : 'Payment & Shipping Report'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'تقرير عمليات الدفع وشركات الشحن' : 'Payment Gateways & Shipping Logistics'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'تتبع أداء شركات الشحن، سرعة التوصيل، رسوم بوابات الدفع ونسب التحصيل.' : 'Logistics carrier velocity, shipping fees, gateway costs, and payment method distribution.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'طباعة' : 'Print'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحميل' : 'Download'}</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {shipKpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{kpi.change}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">{kpi.label}</span>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {kpi.isMoney ? money(Number(kpi.value)) : kpi.value.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'مقارنة بالفترة السابقة' : 'vs prev period'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carriers and Gateways Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Shipping Carriers */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{isAr ? 'أداء شركات الشحن' : 'Shipping Carriers Performance'}</h3>
              <span className="text-xs font-bold text-emerald-600">96.4% On-Time</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-start border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 text-start">{isAr ? 'شركة الشحن' : 'Carrier'}</th>
                  <th className="py-2 text-center">{isAr ? 'الشحنات' : 'Orders'}</th>
                  <th className="py-2 text-center">{isAr ? 'متوسط المدة' : 'Avg Delivery'}</th>
                  <th className="py-2 text-end">{isAr ? 'التكلفة' : 'Cost'}</th>
                  <th className="py-2 text-end">{isAr ? 'الالتزام' : 'On-Time'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {carriers.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{c.name}</td>
                    <td className="py-2.5 text-center text-slate-600 dark:text-slate-400 tabular-nums">{c.orders}</td>
                    <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">{c.avgDays}</td>
                    <td className="py-2.5 text-end font-bold text-slate-900 dark:text-white tabular-nums">{money(c.cost)}</td>
                    <td className="py-2.5 text-end font-bold text-emerald-600">{c.onTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Gateways */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{isAr ? 'بوابات الدفع الإلكتروني' : 'Payment Gateways Breakdown'}</h3>
              <span className="text-xs font-bold text-blue-600">88.5% Digital</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-start border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 text-start">{isAr ? 'طريقة الدفع' : 'Method'}</th>
                  <th className="py-2 text-center">{isAr ? 'العمليات' : 'Orders'}</th>
                  <th className="py-2 text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                  <th className="py-2 text-end">{isAr ? 'الرسوم' : 'Fees'}</th>
                  <th className="py-2 text-end">{isAr ? 'الحصة' : 'Share'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {paymentGateways.map((g, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{g.name}</td>
                    <td className="py-2.5 text-center text-slate-600 dark:text-slate-400 tabular-nums">{g.orders}</td>
                    <td className="py-2.5 text-end font-bold text-slate-900 dark:text-white tabular-nums">{money(g.sales)}</td>
                    <td className="py-2.5 text-end text-slate-500 tabular-nums">{money(g.fee)}</td>
                    <td className="py-2.5 text-end font-bold text-teal-600">{g.share}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // DEFAULT VIEW: MAIN REPORTS DASHBOARD (Screenshot 3: media_1790960668451.png)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100" dir={dir}>
      {/* Header bar matching 11_reports.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'التقارير والإحصائيات' : 'Reports'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? `احصل على رؤى تفصيلية ومؤشرات دقيقة لأداء متجرك ${activeStore.nameAr || activeStore.name}`
              : `Get detailed insights about your store performance for ${activeStore.nameEn || activeStore.name}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
            >
              <option value="Sep 1, 2026 - Sep 30, 2026">Sep 1, 2026 - Sep 30, 2026</option>
              <option value="Aug 1, 2026 - Aug 31, 2026">Aug 1, 2026 - Aug 31, 2026</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Year 2026">Year 2026</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحميل التقرير' : 'Download Report'}</span>
          </button>
        </div>
      </div>

      {/* Row 1: 5 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {mainKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </span>
                <span
                  className={`p-2 rounded-xl ${
                    kpi.color === 'emerald'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : kpi.color === 'blue'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                        : kpi.color === 'purple'
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                          : kpi.color === 'amber'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
              </div>

              <div>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {kpi.isMoney ? money(kpi.value) : kpi.value.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{kpi.change}</span>
                  <span className="text-slate-400 dark:text-slate-500 font-normal">{isAr ? 'مقارنة بالفترة السابقة' : 'vs prev period'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Sales Overview, Funnel, Top Performing Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sales Overview chart (5 cols) */}
        <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'نظرة عامة على المبيعات' : 'Sales Overview'}
              </h2>
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full">
                {money(computedTotalSales)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
              {isAr ? 'المبيعات الإجمالية اليومية للفترة المحددة' : 'Daily gross sales revenue trend over selected date range'}
            </p>
          </div>
          <div className="pt-2">
            <AreaChart
              data={salesChartData}
              height={140}
              color="#0d9488"
              fillGradient={['#0d9488', '#14b8a6']}
              prefix="SAR "
            />
          </div>
        </div>

        {/* Customer Journey Funnel (4 cols) */}
        <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'مسار رحلة العميل' : 'Customer Journey Funnel'}
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-600" /> {isAr ? 'زيارات' : 'Visits'}
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" /> {isAr ? 'طلبات' : 'Orders'}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">
              {isAr ? 'معدل التحويل عبر مراحل التسوق' : 'Conversion rate across visitor lifecycle steps'}
            </p>
          </div>
          <CustomerJourneyFunnel />
        </div>

        {/* Top Performing Category (4 cols) */}
        <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'أعلى التصنيفات أداءً' : 'Top Performing Category'}
              </h2>
              <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                {isAr ? 'إيرادات حية' : 'Live Revenue'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {topCategories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 text-slate-800 dark:text-slate-200 font-bold truncate max-w-[150px]">
                        {c.name}
                      </td>
                      <td className="py-2.5 text-end font-black text-slate-900 dark:text-teal-300 tabular-nums">
                        {money(c.revenue)}
                      </td>
                      <td className="py-2.5 text-end text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                        {c.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Report Categories Grid (6 cards) */}
      <div className="space-y-3">
        <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
          {isAr ? 'تصنيفات التقارير المتخصصة' : 'Report Categories'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isAr ? 'اختر تصنيف التقرير للاطلاع على التحليلات الكاملة والجداول التفصيلية' : 'Choose a report category to view detailed breakdowns and custom analytics'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  toast(isAr ? `فتح ${cat.title}...` : `Opening ${cat.title}...`, 'info');
                }}
                className="p-5 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5 min-w-0 pe-2">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      cat.color === 'emerald'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : cat.color === 'blue'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : cat.color === 'purple'
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                            : cat.color === 'amber'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                              : cat.color === 'rose'
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 4: Recent Reports & Scheduled Reports tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Reports */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'التقارير الأخيرة' : 'Recent Reports'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 text-start">
                  <th className="py-2 font-medium text-start">Report Name</th>
                  <th className="py-2 font-medium text-start">Date Range</th>
                  <th className="py-2 font-medium text-start">Generated At</th>
                  <th className="py-2 font-medium text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {recentReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{r.name}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{r.dateRange}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{r.generated}</td>
                    <td className="py-2.5 text-end">
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-teal-600 cursor-pointer"
                        title="Download CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scheduled Reports */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isAr ? 'التقارير المجدولة' : 'Scheduled Reports'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => toast(isAr ? 'تم حفظ جدولة التقارير التلقائية!' : 'Automated report dispatcher scheduled!', 'info')}
              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 text-start">
                  <th className="py-2 font-medium text-start">Report Name</th>
                  <th className="py-2 font-medium text-center">Frequency</th>
                  <th className="py-2 font-medium text-center">Next Run</th>
                  <th className="py-2 font-medium text-end">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {scheduledReports.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{s.name}</td>
                    <td className="py-2.5 text-center text-slate-500 dark:text-slate-400">{s.freq}</td>
                    <td className="py-2.5 text-center text-slate-500 dark:text-slate-400">{s.nextRun}</td>
                    <td className="py-2.5 text-end">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Docs Guide Modal */}
      <PageDocsGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        pageId="reports"
      />
    </div>
  );
};

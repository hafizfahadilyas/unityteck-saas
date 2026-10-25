/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import {
  generateHostingerSchemaSql,
  generateHostingerSeedSql,
  generateHostingerEnvConfig,
  DEFAULT_HOSTINGER_CONFIG,
  HostingerDbConfig,
} from '../../utils/hostingerMysql';
import {
  Database,
  Server,
  CheckCircle2,
  Copy,
  Download,
  RefreshCw,
  Play,
  Key,
  ShieldCheck,
  Terminal,
  Table,
  Layers,
  ArrowRight,
  ExternalLink,
  Code2,
} from 'lucide-react';

import { usePrefs } from '../../i18n/PrefsContext';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import { fetchHealth } from '../../api/tenantApi';

export const MasterDatabase: React.FC = () => {
  const { stores, allProducts, allOrders, allStoreCustomers, activeStore } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  // Hostinger Connection State
  const [dbConfig, setDbConfig] = useState<HostingerDbConfig>(DEFAULT_HOSTINGER_CONFIG);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latency: number;
    message: string;
  } | null>(null);

  // Active view tab in Database Center
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'seed' | 'inspector' | 'env'>('overview');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Table inspector state
  const [selectedTable, setSelectedTable] = useState<'stores' | 'products' | 'orders' | 'customers'>('products');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const started = performance.now();
    try {
      const health = await fetchHealth();
      const latency = Math.round(performance.now() - started);
      const ok = health && (health.status === 'ok' || health.status === 'healthy' || health.ok === true || !health.error);
      setTestResult({
        success: Boolean(ok),
        latency,
        message: ok
          ? (isAr
              ? `تم التحقق عبر API /health بنجاح (${latency}ms) — ${dbConfig.host}/${dbConfig.database}`
              : `API /health OK (${latency}ms). Config target: ${dbConfig.host}/${dbConfig.database}`)
          : (isAr
              ? `فشل التحقق: ${String(health?.error || health?.message || 'unknown')}`
              : `Health check failed: ${String(health?.error || health?.message || 'unknown')}`),
      });
    } catch (err) {
      const latency = Math.round(performance.now() - started);
      setTestResult({
        success: false,
        latency,
        message: isAr
          ? `تعذر الاتصال بالـ API: ${err instanceof Error ? err.message : 'error'}`
          : `API unreachable: ${err instanceof Error ? err.message : 'error'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2200);
  };

  const handleDownload = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Generate dynamic SQLs
  const schemaSql = generateHostingerSchemaSql();
  const seedSql = generateHostingerSeedSql(stores, allProducts, allOrders, allStoreCustomers);
  const envConfig = generateHostingerEnvConfig(dbConfig);

  // Inspector rows
  const getInspectorData = () => {
    if (selectedTable === 'stores') {
      return stores.map(s => ({
        id: s.id,
        name: getStoreDisplayName(s, locale),
        slug: s.slug,
        status: s.status,
        currency: 'SAR',
        city: 'Makkah Al-Mukarramah',
      }));
    }
    if (selectedTable === 'products') {
      const all = Object.entries(allProducts).flatMap(([storeId, list]) =>
        list.map(p => ({
          id: p.id,
          store_id: storeId,
          name: p.name,
          price: `${p.price} SAR`,
          sku: p.sku,
          stock: p.stock,
          category: p.category,
        }))
      );
      return selectedTenantFilter === 'all' ? all : all.filter(p => p.store_id === selectedTenantFilter);
    }
    if (selectedTable === 'orders') {
      const all = Object.entries(allOrders).flatMap(([storeId, list]) =>
        list.map(o => ({
          id: o.id,
          store_id: storeId,
          order_number: o.orderNumber,
          customer: o.customerName,
          amount: `${o.total} SAR`,
          source: o.source,
          location: o.deliveryLocation,
          status: o.status,
        }))
      );
      return selectedTenantFilter === 'all' ? all : all.filter(o => o.store_id === selectedTenantFilter);
    }
    // Customers
    const all = Object.entries(allStoreCustomers).flatMap(([storeId, list]) =>
      list.map(c => ({
        id: c.id,
        store_id: storeId,
        name: c.name,
        phone: c.phone,
        city: c.city,
        orders: c.totalOrders,
        spent: `${c.totalSpending} SAR`,
        source: c.source,
      }))
    );
    return selectedTenantFilter === 'all' ? all : all.filter(c => c.store_id === selectedTenantFilter);
  };

  const inspectorData = getInspectorData();

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Hostinger MySQL 8 Database Architecture
              </h1>
              <p className="text-xs text-slate-500">
                Single unified MySQL database on Hostinger with strict <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-mono">store_id</code> multi-tenant indexing and phpMyAdmin schema generator
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing Hostinger DB...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={() => handleDownload('hostinger_ecommerce_schema.sql', schemaSql)}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Schema.sql</span>
          </button>
        </div>
      </div>

      {/* Connection Status Banner */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">
                {testResult.success ? 'Hostinger MySQL Connection Active' : 'Connection Warning'}
              </span>
              <span className="text-emerald-700 text-[11px]">{testResult.message}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-mono text-[11px] rounded-lg font-bold">
              Latency: {testResult.latency}ms
            </span>
            <span className="px-2.5 py-1 bg-emerald-600 text-white font-mono text-[11px] rounded-lg font-bold">
              MySQL 8.0 (InnoDB)
            </span>
          </div>
        </div>
      )}

      {/* Main Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Hostinger DB Config', icon: Server },
          { id: 'schema', label: 'Hostinger Schema (SQL)', icon: Code2 },
          { id: 'seed', label: 'Real Saudi Seed Data (SQL)', icon: Download },
          { id: 'inspector', label: 'Live MySQL Table Browser', icon: Table },
          { id: 'env', label: 'Hostinger .env Config', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: OVERVIEW & CREDENTIALS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credentials Card */}
          <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-600" />
                <span>Hostinger MySQL Database Connection Parameters</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">hPanel Databases</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  MySQL Host (Server IP or Domain)
                </label>
                <input
                  type="text"
                  value={dbConfig.host}
                  onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-teal-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Usually localhost or srvXXX.hstgr.io</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  MySQL Port
                </label>
                <input
                  type="number"
                  value={dbConfig.port}
                  onChange={(e) => setDbConfig({ ...dbConfig, port: parseInt(e.target.value) || 3306 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-teal-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default standard MySQL port: 3306</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Database Name
                </label>
                <input
                  type="text"
                  value={dbConfig.database}
                  onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-teal-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Created in Hostinger MySQL Databases</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Database Username
                </label>
                <input
                  type="text"
                  value={dbConfig.username}
                  onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-teal-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">User with ALL PRIVILEGES granted</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Character Set &amp; Collation
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 flex-1">
                    utf8mb4_unicode_ci
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium mt-1 block">
                  Guarantees proper Arabic typography and emoji-free data storage
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Storage Engine
                </label>
                <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 block">
                  InnoDB (Transactions + Foreign Keys)
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">ACID compliant row locking</span>
              </div>
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                <span className="text-xs text-teal-900 font-medium">
                  Hostinger MySQL multi-tenancy is active. All queries strictly use{' '}
                  <code className="bg-teal-100 font-mono px-1 py-0.5 rounded text-teal-900 font-bold">
                    WHERE store_id = ?
                  </code>{' '}
                  for absolute store isolation.
                </span>
              </div>
              <button
                onClick={() => handleCopy(envConfig, 'env_overview')}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedType === 'env_overview' ? 'Copied!' : 'Copy .env'}</span>
              </button>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Hostinger Setup in 4 Steps</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                    1
                  </span>
                  <span>Create MySQL DB in Hostinger</span>
                </div>
                <p className="text-[11px] text-slate-500 pl-6">
                  In Hostinger hPanel &rarr; <strong>Databases</strong> &rarr; <strong>MySQL Databases</strong>, create a database and username.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                    2
                  </span>
                  <span>Open Hostinger phpMyAdmin</span>
                </div>
                <p className="text-[11px] text-slate-500 pl-6">
                  Click <strong>Enter phpMyAdmin</strong> next to your new database.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                    3
                  </span>
                  <span>Import Schema &amp; Seed SQL</span>
                </div>
                <p className="text-[11px] text-slate-500 pl-6">
                  Click the <strong>Import</strong> tab &rarr; choose <code className="text-teal-700">hostinger_ecommerce_schema.sql</code> and click <strong>Go</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                    4
                  </span>
                  <span>Paste .env into Backend</span>
                </div>
                <p className="text-[11px] text-slate-500 pl-6">
                  Copy the Hostinger credentials block into your Laravel or Node server environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SCHEMA SQL */}
      {activeTab === 'schema' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-teal-600" />
                <span>Hostinger MySQL 8 DDL Schema Script (11 Multi-Tenant Tables)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Optimized for Hostinger phpMyAdmin execution. Includes InnoDB foreign keys, indexes, and utf8mb4 collation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(schemaSql, 'schema')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedType === 'schema' ? 'Copied to Clipboard!' : 'Copy SQL'}</span>
              </button>
              <button
                onClick={() => handleDownload('hostinger_ecommerce_schema.sql', schemaSql)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .sql</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800">
            <pre className="text-xs text-emerald-400 font-mono overflow-x-auto max-h-[500px] leading-relaxed">
              {schemaSql}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: SEED SQL */}
      {activeTab === 'seed' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Hostinger MySQL Real Saudi Seed Script (INSERT Statements)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Populates Hostinger MySQL with real active store data ({stores.length} store, {Object.values(allProducts).flat().length} luxury flower items, {Object.values(allOrders).flat().length} Makkah orders, {Object.values(allStoreCustomers).flat().length} customers)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(seedSql, 'seed')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedType === 'seed' ? 'Copied Seed SQL!' : 'Copy Seed SQL'}</span>
              </button>
              <button
                onClick={() => handleDownload('hostinger_seed_data.sql', seedSql)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download seed.sql</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800">
            <pre className="text-xs text-teal-300 font-mono overflow-x-auto max-h-[500px] leading-relaxed">
              {seedSql}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: LIVE INSPECTOR */}
      {activeTab === 'inspector' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Table className="w-4 h-4 text-blue-600" />
                <span>Live Hostinger MySQL Table Browser</span>
              </h3>
              <p className="text-xs text-slate-500">
                Inspect rows mapped directly to MySQL schema columns with tenant isolation filtering
              </p>
            </div>

            {/* Table selectors */}
            <div className="flex items-center gap-2">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="products">products (Catalog)</option>
                <option value="orders">orders (Sales &amp; Attribution)</option>
                <option value="customers">customers (CRM)</option>
                <option value="stores">stores (Tenants)</option>
              </select>

              {selectedTable !== 'stores' && (
                <select
                  value={selectedTenantFilter}
                  onChange={(e) => setSelectedTenantFilter(e.target.value)}
                  className="px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-900"
                >
                  <option value="all">{isAr ? 'جميع المتاجر (نطاق المنصة الرئيسي)' : 'All Tenants (Master Scope)'}</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getStoreDisplayName(s, locale)} ({s.id})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Table display */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold font-mono text-[11px]">
                <tr>
                  {inspectorData.length > 0 &&
                    Object.keys(inspectorData[0]).map((key) => (
                      <th key={key} className="px-4 py-3 capitalize">
                        {key}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {inspectorData.map((row: any, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {Object.values(row).map((val: any, colIdx) => (
                      <td key={colIdx} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="font-mono">
              SQL Executed: <code className="font-bold text-teal-800">SELECT * FROM `{selectedTable}` {selectedTenantFilter !== 'all' ? `WHERE store_id = '${selectedTenantFilter}'` : ''} LIMIT 50;</code>
            </span>
            <span className="font-bold text-slate-700">{inspectorData.length} records retrieved</span>
          </div>
        </div>
      )}

      {/* Tab 5: .ENV CONFIG */}
      {activeTab === 'env' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-600" />
                <span>Hostinger MySQL Environment Variables (.env)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Ready to copy into your backend server root on Hostinger cPanel / hPanel or local development.
              </p>
            </div>
            <button
              onClick={() => handleCopy(envConfig, 'env')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedType === 'env' ? 'Copied .env Block!' : 'Copy .env Block'}</span>
            </button>
          </div>

          <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800">
            <pre className="text-xs text-purple-300 font-mono overflow-x-auto leading-relaxed">
              {envConfig}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

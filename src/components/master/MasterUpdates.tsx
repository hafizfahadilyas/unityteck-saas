import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { UpdateRelease } from '../../types';
import { 
  GitBranch, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Store, 
  AlertTriangle, 
  Zap, 
  Filter,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';

export const MasterUpdates: React.FC = () => {
  const { updates, stores, toggleStoreUpdate, approveUpdate, rollbackUpdate } = useTenant();

  const [activeUpdateId, setActiveUpdateId] = useState<string>(updates[0]?.id || '');
  const [filterType, setFilterType] = useState<string>('All');

  const selectedUpdate = updates.find(u => u.id === activeUpdateId) || updates[0];

  const filteredUpdates = updates.filter(u => 
    filterType === 'All' || u.type === filterType
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-teal-600" />
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Central Updates & Rollout Control
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Requirement #6 · Updates are managed centrally. Master Admin chooses whether updates roll out to all stores, selected stores (e.g. Fahad Store receives update while Jawad Store is withheld), or none, with instant rollback.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Release List (Col 5) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2">
            <span className="font-bold text-xs text-slate-700">Available Release Packages</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
            >
              <option value="All">All Types</option>
              <option value="core">Core Engine</option>
              <option value="theme">Themes</option>
              <option value="plugin">Plugins</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div className="space-y-2.5">
            {filteredUpdates.map((rel) => {
              const isSelected = rel.id === activeUpdateId;
              const storeCount = rel.deployedStoreIds.length;

              return (
                <div
                  key={rel.id}
                  onClick={() => setActiveUpdateId(rel.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-900 text-white border-teal-800 shadow-md'
                      : 'bg-white text-slate-800 border-slate-200/90 hover:border-teal-500/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-teal-800 text-teal-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {rel.version} · {rel.type.toUpperCase()}
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      rel.status === 'approved'
                        ? isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                        : isSelected ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {rel.status === 'approved' ? 'Approved & Live' : 'Rolled Back'}
                    </span>
                  </div>

                  <h3 className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {rel.title}
                  </h3>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-teal-100/80' : 'text-slate-500'}`}>
                    {rel.description}
                  </p>

                  <div className={`mt-3 pt-2.5 flex items-center justify-between border-t text-[11px] ${
                    isSelected ? 'border-teal-800 text-teal-200' : 'border-slate-100 text-slate-400'
                  }`}>
                    <span>Deployed to: <strong className={isSelected ? 'text-white' : 'text-slate-700'}>{storeCount} of {stores.length} stores</strong></span>
                    <span>Released: {rel.releasedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Per-Store Rollout Control Matrix (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
          {selectedUpdate ? (
            <>
              {/* Selected Update Header */}
              <div className="pb-4 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded">
                        {selectedUpdate.version}
                      </span>
                      <h2 className="text-base font-black text-slate-900">
                        {selectedUpdate.title}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedUpdate.description}
                    </p>
                  </div>

                  {/* Master Approval / Rollback Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => rollbackUpdate(selectedUpdate.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Instantly roll back this release from all stores"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rollback</span>
                    </button>

                    <button
                      onClick={() => approveUpdate(selectedUpdate.id)}
                      className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-teal-300" />
                      <span>Approve Release</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Master Control:</strong> Check or uncheck stores below to grant or withhold this update individually.
                  </span>
                </div>
              </div>

              {/* Per-Store Selective Toggle Matrix */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-xs text-slate-800">
                    Store Rollout Matrix (Toggle per store)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Active on {selectedUpdate.deployedStoreIds.length} / {stores.length} Stores
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {stores.map((store) => {
                    const isDeployed = selectedUpdate.deployedStoreIds.includes(store.id);

                    return (
                      <div
                        key={store.id}
                        className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                          isDeployed ? 'bg-teal-50/30' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-base border border-slate-200">
                            {store.logo}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900">{store.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">({store.slug})</span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              Merchant: {store.owner} · Category: {store.category}
                            </span>
                          </div>
                        </div>

                        {/* Interactive toggle switch for this store */}
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-semibold ${
                            isDeployed ? 'text-teal-700' : 'text-slate-400'
                          }`}>
                            {isDeployed ? 'Update Deployed' : 'Withheld / Staged'}
                          </span>

                          <button
                            onClick={() => toggleStoreUpdate(selectedUpdate.id, store.id)}
                            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                              isDeployed ? 'bg-teal-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                                isDeployed ? 'left-6.5' : 'left-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Requirement Example Highlight */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800">
                  Example verified from requirements:
                </span>
                <p className="text-[11px] text-slate-500">
                  "Fahad Store ko update mile, lekin Jawad Store ko nahi" is active on Core Engine v2.4. You can freely toggle Jawad Cycles on or off to inspect the immediate cache tag invalidation.
                </p>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">Select an update release to manage rollout.</div>
          )}
        </div>
      </div>
    </div>
  );
};

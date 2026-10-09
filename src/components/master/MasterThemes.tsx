import React, { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { 
  Palette, 
  Sparkles, 
  Check, 
  Star, 
  Layout, 
  Store, 
  Eye, 
  Calendar,
  Layers
} from 'lucide-react';
import { useToast } from '../common/ToastProvider';

export const MasterThemes: React.FC = () => {
  const { themes, stores, setStoreTheme, setStoreHomepageStyle, storeActiveTheme } = useTenant();
  const { toast } = useToast();

  const [selectedThemeId, setSelectedThemeId] = useState<string>(themes[0]?.id ?? '');
  const [assignStoreId, setAssignStoreId] = useState<string>(stores[0]?.id ?? '');
  const [selectedStyle, setSelectedStyle] = useState<string>(themes[0]?.homepageStyles[0] ?? 'Default Commerce');

  const selectedTheme = useMemo(
    () => themes.find((t) => t.id === selectedThemeId) || themes[0],
    [themes, selectedThemeId],
  );

  const handleApplyThemeToStore = () => {
    if (!selectedTheme || !assignStoreId) return;
    setStoreTheme(assignStoreId, selectedTheme.id);
    setStoreHomepageStyle(assignStoreId, selectedStyle);
    const storeObj = stores.find((s) => s.id === assignStoreId);
    toast(
      `Theme "${selectedTheme.name}" (${selectedStyle}) activated for ${storeObj?.name || assignStoreId}`,
      'success',
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Multi-Theme Architecture & Seasonal Catalog
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Requirement #7 · Seasonal and modern themes (Default, Ramadan, Eid, Luxury, Minimal) with multiple homepage designs.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <span>Unified Store Dashboard Across All Themes</span>
        </div>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {themes.map((theme) => {
          const isSelected = theme.id === selectedThemeId;

          return (
            <div
              key={theme.id}
              onClick={() => {
                setSelectedThemeId(theme.id);
                setSelectedStyle(theme.homepageStyles[0]);
              }}
              className={`rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-md bg-white'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div>
                {/* Visual Banner Preview */}
                <div
                  className="h-32 p-4 flex flex-col justify-between text-white relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${theme.previewColor}, #021a17)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
                      {theme.category}
                    </span>
                    {theme.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3" />
                        <span>{theme.badge}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white drop-shadow-sm" style={{ color: '#ffffff' }}>
                      {theme.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-teal-200 mt-0.5" style={{ color: '#99f6e4' }}>
                      <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                      <span>{theme.rating} rating · {theme.activeStoresCount} stores live</span>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {theme.tagline}
                  </p>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Included Homepage Styles:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {theme.homepageStyles.map((style, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom selection state */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {isSelected ? 'Currently Selected' : 'Click to Configure'}
                </span>
                {isSelected ? (
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignment Control Panel */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-sm text-slate-900">
              Activate Selected Theme on Store
            </h2>
            <p className="text-xs text-slate-500">
              Selected Theme: <strong className="text-teal-700">{selectedTheme.name}</strong> ({selectedTheme.category})
            </p>
          </div>
          <span className="text-xs text-slate-400">Zero Stale Instant Switch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Client Store</label>
            <select
              value={assignStoreId}
              onChange={(e) => setAssignStoreId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 bg-white"
            >
              {stores.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (Current: {themes.find(t => t.id === storeActiveTheme[s.id])?.name || 'Default'})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Homepage Layout Design</label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 bg-white"
            >
              {selectedTheme.homepageStyles.map((style, idx) => (
                <option key={idx} value={style}>{style}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <button
              onClick={handleApplyThemeToStore}
              className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Deploy Theme to Store</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

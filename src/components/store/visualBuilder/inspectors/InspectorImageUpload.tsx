import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  HardDrive,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  RefreshCw,
  Check,
  ExternalLink,
  Layers,
  FolderOpen,
} from 'lucide-react';
import { MediaPickerModal } from '../../../common/MediaPickerModal';
import type { MediaAsset } from '../../../../types/media';

export interface InspectorImageUploadProps {
  labelAr: string;
  labelEn: string;
  value?: string;
  onChange: (value: string) => void;
  isAr: boolean;
  helpTextAr?: string;
  helpTextEn?: string;
  aspectRatio?: 'video' | 'square' | 'banner' | 'auto';
}

const LUXURY_PRESETS = [
  {
    nameAr: 'جوري ملكي أحمر',
    nameEn: 'Royal Red Roses',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameAr: 'زنبق كازابلانكا أبيض',
    nameEn: 'Casablanca White Lily',
    url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameAr: 'فازة أوركيد فاخرة',
    nameEn: 'Grand Orchid Vase',
    url: 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameAr: 'صندوق مخملي للهدايا',
    nameEn: 'Luxury Velvet Box',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
  },
  {
    nameAr: 'بانر المناسبات الملكي',
    nameEn: 'Royal Celebration Banner',
    url: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    nameAr: 'خلفية ذهبية رخامية',
    nameEn: 'Gold Marble Texture',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },
];

export const InspectorImageUpload: React.FC<InspectorImageUploadProps> = ({
  labelAr,
  labelEn,
  value = '',
  onChange,
  isAr,
  helpTextAr,
  helpTextEn,
  aspectRatio = 'auto',
}) => {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'library' | 'upload' | 'gdrive'>('library');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModalWithTab = (tab: 'library' | 'upload' | 'gdrive') => {
    setModalInitialTab(tab);
    setIsMediaModalOpen(true);
  };

  const handleMediaModalSelect = (selected: MediaAsset | MediaAsset[]) => {
    const asset = Array.isArray(selected) ? selected[0] : selected;
    if (asset) {
      const chosenUrl = asset.optimizedUrl || asset.originalUrl || asset.thumbnailUrl || '';
      onChange(chosenUrl);
      setUrlDraft(chosenUrl);
    }
    setIsMediaModalOpen(false);
  };

  const handleProcessFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        onChange(dataUrl);
        setUrlDraft(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'video':
        return 'aspect-video';
      case 'square':
        return 'aspect-square';
      case 'banner':
        return 'aspect-[21/9]';
      default:
        return 'h-28';
    }
  };

  const isBase64 = value?.startsWith('data:image');

  return (
    <div className="space-y-2.5 border border-slate-200 rounded-2xl p-3.5 bg-white shadow-2xs">
      {/* ── Header Label ── */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? labelAr : labelEn}</span>
        </label>

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setUrlDraft('');
            }}
            className="text-[10px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-0.5 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>{isAr ? 'إزالة' : 'Remove'}</span>
          </button>
        )}
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── Card State: Has Image vs Empty ── */}
      {value ? (
        /* Image Preview Box with Elementor Pro Overlay */
        <div className="relative group border border-slate-200 rounded-xl overflow-hidden bg-slate-950">
          <div className={`w-full ${getAspectClass()} overflow-hidden flex items-center justify-center`}>
            <img
              src={value}
              alt={isAr ? labelAr : labelEn}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Elementor Pro Style Hover Actions */}
          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
            <button
              type="button"
              onClick={() => openModalWithTab('library')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{isAr ? 'تغيير من المكتبة / Drive' : 'Replace Media (Modal)'}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                title={isAr ? 'رفع ملف من الجهاز' : 'Upload from Local PC'}
              >
                <UploadCloud className="w-3 h-3 text-cyan-400" />
                <span>{isAr ? 'ملف من الجهاز' : 'Local PC'}</span>
              </button>

              <button
                type="button"
                onClick={() => openModalWithTab('gdrive')}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                title="Google Drive"
              >
                <HardDrive className="w-3 h-3 text-amber-400" />
                <span>Google Drive</span>
              </button>
            </div>
          </div>

          {/* Type Badge */}
          <span className="absolute bottom-1.5 start-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[9px] font-mono font-bold text-white pointer-events-none">
            {isBase64 ? 'Local Upload' : 'Media Asset'}
          </span>
        </div>
      ) : (
        /* Empty Drop Box with Elementor Pro Modal Trigger */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all flex flex-col items-center justify-center gap-2.5 ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
              : 'border-slate-300 bg-slate-50/60 hover:border-emerald-500 hover:bg-slate-50'
          }`}
        >
          {/* Main Primary Button: Opens Elementor-Style Media Modal */}
          <button
            type="button"
            onClick={() => openModalWithTab('library')}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <ImageIcon className="w-4 h-4 text-white" />
            <span>{isAr ? 'اختيار صورة (مكتبة الوسائط · Pop-up)' : 'Choose Image (Elementor Media Modal)'}</span>
          </button>

          <p className="text-[10px] text-slate-500 font-medium">
            {isAr
              ? 'أو اسحب وأفلت الصورة هنا مباشرة من جهاز الكمبيوتر'
              : 'Or drag & drop image file directly from your computer'}
          </p>

          {/* Quick Source Launchers Strip */}
          <div className="grid grid-cols-3 gap-1.5 w-full pt-1 border-t border-slate-200/80">
            {/* 1. Local PC */}
            <button
              type="button"
              onClick={() => openModalWithTab('upload')}
              className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'رفع ملف' : 'Local PC'}</span>
            </button>

            {/* 2. Media Library */}
            <button
              type="button"
              onClick={() => openModalWithTab('library')}
              className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isAr ? 'مكتبتنا' : 'Library'}</span>
            </button>

            {/* 3. Google Drive */}
            <button
              type="button"
              onClick={() => openModalWithTab('gdrive')}
              className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <HardDrive className="w-3.5 h-3.5 text-amber-600" />
              <span>Google Drive</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Sub Options Bar: Direct URL & Presets ── */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10px]">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className={`font-bold flex items-center gap-1 cursor-pointer transition-colors ${
            showUrlInput ? 'text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LinkIcon className="w-3 h-3" />
          <span>{isAr ? 'رابط ويب مباشر (URL)' : 'Direct Web URL'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className={`font-bold flex items-center gap-1 cursor-pointer transition-colors ${
            showPresets ? 'text-amber-700 font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>{isAr ? 'قوالب وصور جاهزة' : 'Ready Presets'}</span>
        </button>
      </div>

      {/* ── Expandable Direct URL Input ── */}
      {showUrlInput && (
        <div className="space-y-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => onChange(urlDraft.trim())}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs cursor-pointer shrink-0 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Expandable Luxury Presets ── */}
      {showPresets && (
        <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-0.5 p-1 bg-slate-50 rounded-xl border border-slate-200">
          {LUXURY_PRESETS.map((preset, idx) => {
            const isSelected = value === preset.url;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setUrlDraft(preset.url);
                }}
                className={`relative rounded-lg overflow-hidden border text-start group cursor-pointer transition-all ${
                  isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.nameEn}
                  className="w-full h-12 object-cover object-center group-hover:scale-105 transition-transform"
                />
                <div className="p-1 bg-white/95 border-t border-slate-100">
                  <span className="block text-[8px] font-bold text-slate-800 truncate">
                    {isAr ? preset.nameAr : preset.nameEn}
                  </span>
                </div>
                {isSelected && (
                  <span className="absolute top-1 end-1 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] shadow-sm">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Optional Help Text */}
      {(helpTextAr || helpTextEn) && (
        <p className="text-[10px] text-slate-500 leading-tight">
          {isAr ? helpTextAr : helpTextEn}
        </p>
      )}

      {/* ── ELEMENTOR PRO STYLE MEDIA PICKER MODAL POP-UP ── */}
      {isMediaModalOpen && (
        <MediaPickerModal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          onSelect={handleMediaModalSelect}
          multiple={false}
          initialTab={modalInitialTab}
          title={isAr ? 'مكتبة الوسائط والملفات (Elementor Media Library)' : 'Elementor Pro Media Library'}
        />
      )}
    </div>
  );
};

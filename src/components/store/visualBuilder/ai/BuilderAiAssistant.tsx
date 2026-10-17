import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Check,
  X,
  FileText,
  Search,
  Layout,
  RefreshCw,
  Languages,
  Wand2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { runAiGeneration, type AiGenerationResult, type AiGenerationRequest } from '../../../../services/aiService';

interface BuilderAiAssistantProps {
  isAr: boolean;
  storeName: string;
  selectedBlockId: string;
  selectedBlockTitle?: string;
  onApplyContent: (content: { titleAr?: string; titleEn?: string; subtitleAr?: string; subtitleEn?: string; contentAr?: string; contentEn?: string; seoTitleAr?: string; seoMetaDescAr?: string }) => void;
  onAddNewSection?: (section: { type: string; titleAr: string; titleEn: string; templateStyle: string }) => void;
}

export const BuilderAiAssistant: React.FC<BuilderAiAssistantProps> = ({
  isAr,
  storeName,
  selectedBlockId,
  selectedBlockTitle,
  onApplyContent,
  onAddNewSection,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [draftResult, setDraftResult] = useState<AiGenerationResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleRunAi = async (action: AiGenerationRequest['action'], customPrompt?: string) => {
    setIsLoading(true);
    try {
      const result = await runAiGeneration({
        action,
        input: customPrompt || promptInput,
        context: {
          storeName,
          category: 'باقات الورد والهدايا الفاخرة',
          currentSectionType: selectedBlockId,
          locale: isAr ? 'ar' : 'en',
        },
      });
      setDraftResult(result);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDraft = () => {
    if (!draftResult) return;
    onApplyContent({
      titleAr: draftResult.titleAr,
      titleEn: draftResult.titleEn,
      subtitleAr: draftResult.subtitleAr,
      subtitleEn: draftResult.subtitleEn,
      contentAr: draftResult.contentAr,
      contentEn: draftResult.contentEn,
      seoTitleAr: draftResult.seoTitleAr,
      seoMetaDescAr: draftResult.seoMetaDescAr,
    });
    setDraftResult(null);
  };

  return (
    <div
      className="border-t border-slate-700 bg-slate-900 text-slate-100 flex flex-col text-xs shrink-0 select-none transition-all"
      style={{
        background: 'linear-gradient(180deg, #051d24 0%, #021117 100%)',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 px-4 flex items-center justify-between cursor-pointer border-b border-emerald-900/40 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span className="font-extrabold text-white text-xs">
            {isAr ? 'المساعد الذكي للثيم والصفحات' : 'AI Theme Assistant'}
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-800/50">
            Gemini Pro
          </span>
        </div>
        <button type="button" className="text-slate-400 hover:text-white p-1">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-3">
          {/* Prompt Input Box */}
          <div className="relative">
            <textarea
              rows={2}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              spellCheck={false}
              placeholder={isAr ? 'أكتب طلبك هنا... (مثال: أعد صياغة العنوان بأسلوب فخم)' : 'Type your AI prompt here...'}
              style={{
                backgroundColor: '#0c232c',
                color: '#ffffff',
                border: '1px solid #1a4f61',
                caretColor: '#10b981',
              }}
              className="w-full p-3 pe-16 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none font-sans"
            />
            <button
              type="button"
              disabled={isLoading || !promptInput.trim()}
              onClick={() => handleRunAi('custom_prompt', promptInput)}
              className="absolute end-2 bottom-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-all shadow-md"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 rtl:-scale-x-100" />
                  <span>{isAr ? 'إرسال' : 'Send'}</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Suggestions Pills (Matching Screenshot 2) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {isAr ? 'اقتراحات سريعة بنقرة واحدة:' : 'QUICK PROMPTS:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { action: 'generate_hero' as const, labelAr: 'إنشاء قسم هيرو', labelEn: 'Generate Hero' },
                { action: 'improve_seo' as const, labelAr: 'تحسين نصوص المنتجات', labelEn: 'Optimize SEO' },
                { action: 'suggest_layout' as const, labelAr: 'اقتراح تصميم', labelEn: 'Suggest Layout' },
                { action: 'generate_promo_banner' as const, labelAr: 'بانر ترويجي', labelEn: 'Promo Banner' },
                { action: 'generate_faq' as const, labelAr: 'إنشاء أسئلة شائعة', labelEn: 'Generate FAQs' },
              ].map((s) => (
                <button
                  key={s.action}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRunAi(s.action)}
                  style={{
                    backgroundColor: '#0c232c',
                    border: '1px solid #1a4f61',
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-emerald-300 hover:border-emerald-500 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40 shadow-2xs"
                >
                  {isAr ? s.labelAr : s.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* AI Tools Bar */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 flex-wrap">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleRunAi('rewrite_arabic')}
              style={{ backgroundColor: '#0c232c', border: '1px solid #1a4f61' }}
              className="px-2.5 py-1.5 rounded-lg hover:border-emerald-500 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-emerald-400" />
              <span>{isAr ? 'إعادة كتابة' : 'Rewrite'}</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleRunAi('improve_seo')}
              style={{ backgroundColor: '#0c232c', border: '1px solid #1a4f61' }}
              className="px-2.5 py-1.5 rounded-lg hover:border-amber-500 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <Search className="w-3 h-3 text-amber-400" />
              <span>{isAr ? 'تحسين SEO' : 'SEO'}</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleRunAi('translate_en')}
              style={{ backgroundColor: '#0c232c', border: '1px solid #1a4f61' }}
              className="px-2.5 py-1.5 rounded-lg hover:border-indigo-500 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <Languages className="w-3 h-3 text-indigo-400" />
              <span>{isAr ? 'ترجمة EN' : 'Translate'}</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleRunAi('suggest_layout')}
              style={{ backgroundColor: '#0c232c', border: '1px solid #1a4f61' }}
              className="px-2.5 py-1.5 rounded-lg hover:border-cyan-500 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <Layout className="w-3 h-3 text-cyan-400" />
              <span>{isAr ? 'اقتراح تصميم' : 'Layout'}</span>
            </button>
          </div>

          {/* Draft Review Container (Requirement 10: User Review before applying) */}
          {draftResult && (
            <div className="mt-3 p-3 rounded-xl bg-slate-800/90 border border-emerald-500/50 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[11px] text-emerald-400 flex items-center gap-1">
                  <Wand2 className="w-3 h-3" />
                  <span>{isAr ? 'مسودة المحتوى المقترح:' : 'Proposed Draft Preview:'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDraftResult(null)}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {draftResult.titleAr && (
                <div>
                  <span className="text-[10px] text-slate-400 block">{isAr ? 'العنوان المقترح:' : 'Title:'}</span>
                  <p className="font-bold text-white text-xs">{draftResult.titleAr}</p>
                </div>
              )}

              {draftResult.subtitleAr && (
                <div>
                  <span className="text-[10px] text-slate-400 block">{isAr ? 'الوصف الفرعي:' : 'Subtitle:'}</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{draftResult.subtitleAr}</p>
                </div>
              )}

              {draftResult.contentAr && (
                <div>
                  <span className="text-[10px] text-slate-400 block">{isAr ? 'المحتوى:' : 'Content:'}</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line">{draftResult.contentAr}</p>
                </div>
              )}

              {draftResult.suggestedSections && draftResult.suggestedSections.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-slate-700">
                  <span className="text-[10px] text-slate-400 block">{isAr ? 'أقسام مقترحة للتطبيق:' : 'Suggested Sections:'}</span>
                  {draftResult.suggestedSections.map((sec, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] bg-slate-900/60 p-1.5 rounded-lg">
                      <span className="truncate">{sec.titleAr}</span>
                      {onAddNewSection && (
                        <button
                          type="button"
                          onClick={() => onAddNewSection(sec)}
                          className="px-1.5 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold"
                        >
                          {isAr ? 'إضافة' : 'Add'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons: Apply vs Discard */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setDraftResult(null)}
                  className="px-2.5 py-1 rounded-lg border border-slate-600 text-slate-300 hover:text-white text-[11px] cursor-pointer"
                >
                  {isAr ? 'تجاهل' : 'Discard'}
                </button>
                <button
                  type="button"
                  onClick={handleApplyDraft}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Check className="w-3 h-3" />
                  <span>{isAr ? 'قبول وتطبيق على القسم' : 'Accept & Apply'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

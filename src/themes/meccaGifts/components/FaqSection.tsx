import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FAQS } from '../data/mockData';
import { Plus, Minus, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Title Header matching site-wide uniform styling */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#ece7de]">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
            {isAr ? 'الأسئلة الشائعة' : 'Common Inquiries'}
          </h2>
          <p className="text-xs sm:text-sm text-[#7a7164] mt-1 font-light">
            {isAr ? 'إجابات واضحة لاستفساراتكم' : 'Frequently Asked Questions & Answers'}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#102a1c]/10 text-[#102a1c] text-xs font-semibold shrink-0">
          <HelpCircle className="w-3.5 h-3.5 text-[#102a1c]" />
          <span>{isAr ? 'مركز المساعدة' : 'Help Center'}</span>
        </div>
      </div>

      {/* Accordion list */}
      <div className="space-y-3.5">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-[#FAF9F5] border border-[#e8e4dc] rounded-2xl overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full py-4 px-5 sm:px-6 text-start flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-[#1a1f1b] hover:text-[#102a1c] transition-colors"
              >
                <span>{isAr ? faq.q : faq.qEn}</span>
                <span className="w-7 h-7 rounded-full bg-[#f0ece3] flex items-center justify-center shrink-0 text-[#102a1c]">
                  {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-[#555] leading-relaxed border-t border-[#f0ede6] bg-[#faf8f3]">
                  {isAr ? faq.a : faq.aEn}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

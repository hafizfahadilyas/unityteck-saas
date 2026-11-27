import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { isSouqCommonTenant } from '../../souqCommon/isSouqCommonTenant';
import { FAQS } from '../data/mockData';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const RETAIL_FAQS = [
  {
    q: 'ما هي مدة وتكلفة الشحن والتوصيل داخل المملكة؟',
    qEn: 'What are shipping times and costs within Saudi Arabia?',
    a: 'نوفر شحناً سريعاً لجميع مدن ومناطق المملكة خلال 2-4 أيام عمل عبر شركات شحن معتمدة. التوصيل مجاني للطلبات المؤهلة فوق 200 ريال.',
    aEn: 'We provide express delivery across all KSA cities within 2-4 business days. Free shipping applies on eligible orders over 200 SAR.',
  },
  {
    q: 'ما هي وسائل الدفع المتاحة في المتجر؟',
    qEn: 'What payment methods are supported?',
    a: 'ندعم كافة وسائل الدفع الآمنة المعتمدة في السعودية: مدى (Mada)، أبل باي (Apple Pay)، فيزا وماستركارد، وخدمات الدفع الآجل على 4 دفعات بدون فوائد عبر تابي وتمارا.',
    aEn: 'We accept Mada, Apple Pay, Visa, Mastercard, and interest-free installment plans via Tabby and Tamara.',
  },
  {
    q: 'هل جميع المنتجات أصلية وتخضع للضمان؟',
    qEn: 'Are all products authentic and covered by warranty?',
    a: 'نعم، جميع المنتجات أصلية 100% ومضمونة، وتخضع لسياسة الفحص والجودة الصارمة وضمان الوكيل المعتمد وفق الأنظمة السعودية.',
    aEn: 'Yes, 100% of our products are authentic and backed by authorized warranty and quality standards.',
  },
  {
    q: 'ما هي سياسة الاستبدال والاسترجاع؟',
    qEn: 'What is your return and exchange policy?',
    a: 'يمكنك طلب استبدال أو استرجاع المنتج خلال 14 يوماً من استلام الطلب بسهولة وبدون أي تعقيد وفق الشروط الموضحة في صفحة سياسة الاسترجاع.',
    aEn: 'You can request an exchange or return within 14 days of receiving your order according to our store policy.',
  },
];

export const FaqSection: React.FC = () => {
  const { language } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const isSouq = isSouqCommonTenant(activeStore) || (activeStore?.id && activeStore.id !== 'store-1' && activeStore.id !== 'store-coffee');

  const faqs = isSouq ? RETAIL_FAQS : FAQS;
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
            {isAr ? (isSouq ? 'الأسئلة الشائعة والأجوبة' : 'الأسئلة الشائعة') : (isSouq ? 'Frequently Asked Questions' : 'Common Inquiries')}
          </h2>
          <p className="text-xs sm:text-sm text-[#7a7164] mt-1 font-light">
            {isAr ? 'إجابات واضحة وموثوقة لاستفساراتكم' : 'Frequently Asked Questions & Answers'}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#102a1c]/10 text-[#102a1c] text-xs font-semibold shrink-0">
          <HelpCircle className="w-3.5 h-3.5 text-[#102a1c]" />
          <span>{isAr ? 'مركز المساعدة' : 'Help Center'}</span>
        </div>
      </div>

      {/* Accordion list */}
      <div className="space-y-3.5">
        {faqs.map((faq, index) => {
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

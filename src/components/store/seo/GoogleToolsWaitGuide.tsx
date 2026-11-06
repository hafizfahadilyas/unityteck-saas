import React from 'react';
import { Clock3 } from 'lucide-react';
import { googleLiveDataGuide } from './googleLiveDataGuide';

type Props = { isAr: boolean };

export const GoogleToolsWaitGuide: React.FC<Props> = ({ isAr }) => (
  <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-2xs space-y-5">
    <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
        <Clock3 className="w-4 h-4 text-emerald-600" />
        {isAr ? 'متى تظهر البيانات الحقيقية' : 'When real data appears'}
      </h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
        {isAr
          ? 'بعد أن يصبح النطاق عاماً على الاستضافة وتسجّل الدخول بالحساب الحقيقي، تكتمل كل أداة حسب ساعتها. هذه الصفحة لا تملأ الفراغ بأرقام تجريبية.'
          : 'After the domain is public on Hostinger and you sign in with the real account, each tool fills on its own clock. This page does not fill gaps with sample numbers.'}
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {googleLiveDataGuide.map((row) => (
        <article
          key={row.id}
          className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
        >
          <h4 className="font-bold text-xs text-slate-900 dark:text-white">
            {isAr ? row.titleAr : row.titleEn}
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {isAr ? row.howAr : row.howEn}
          </p>
          <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 leading-relaxed">
            {isAr ? row.waitAr : row.waitEn}
          </p>
        </article>
      ))}
    </div>
  </section>
);

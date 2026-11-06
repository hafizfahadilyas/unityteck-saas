export type GoogleLiveGuideRow = {
  id: string;
  titleEn: string;
  titleAr: string;
  howEn: string;
  howAr: string;
  waitEn: string;
  waitAr: string;
};

/** Honest waits. Empty metrics stay empty until the live tool returns them. */
export const googleLiveDataGuide: GoogleLiveGuideRow[] = [
  {
    id: 'domain',
    titleEn: 'Domain is public',
    titleAr: 'النطاق أصبح عاماً',
    howEn:
      'Point the domain at the live store on Hostinger and open the public secure address in a browser. Save tracking ids only after that address loads. A private or unfinished address does not collect shopper visits.',
    howAr:
      'وجّه النطاق إلى المتجر المباشر على الاستضافة وافتح العنوان العام الآمن في المتصفح. احفظ معرفات التتبع بعد أن يفتح ذلك العنوان. العنوان غير المنشور لا يجمع زيارات المتسوقين.',
    waitEn: 'Name records often settle within a few hours and can take up to two days.',
    waitAr: 'سجلات الاسم تستقر غالباً خلال ساعات، وقد تصل إلى يومين.',
  },
  {
    id: 'login',
    titleEn: 'Real Google sign-in',
    titleAr: 'تسجيل الدخول الحقيقي لجوجل',
    howEn:
      'Use the connect button with this store’s own Google account. A successful sign-in marks only this store connected. It does not create a measurement id, clicks, or another store’s account.',
    howAr:
      'استخدم زر الربط بحساب جوجل الخاص بهذا المتجر. نجاح الدخول يعلّم هذا المتجر وحده متصلاً. لا ينشئ معرف قياس ولا نقرات ولا حساب متجر آخر.',
    waitEn: 'The connected label appears when sign-in succeeds. Reports stay empty until data arrives.',
    waitAr: 'تظهر علامة الاتصال عند نجاح الدخول. التقارير تبقى فارغة إلى أن تصل البيانات.',
  },
  {
    id: 'analytics',
    titleEn: 'Analytics',
    titleAr: 'تحليلات جوجل',
    howEn:
      'Create a property for the live domain, paste the measurement id on this page, and publish the storefront. Open the live site once so the first real visit exists.',
    howAr:
      'أنشئ خاصية لنطاق المتجر المباشر، والصق معرف القياس في هذه الصفحة، ثم انشر واجهة المتجر. افتح الموقع مرة بنفسك حتى توجد أول زيارة حقيقية.',
    waitEn: 'A realtime visit can appear within minutes. Standard reports usually take one to two days.',
    waitAr: 'قد تظهر زيارة المتابعة خلال دقائق. التقارير العادية تأخذ عادة يوماً إلى يومين.',
  },
  {
    id: 'tags',
    titleEn: 'Tag Manager and the Google tag',
    titleAr: 'مدير العلامات وعلامة جوجل',
    howEn:
      'Publish the container in Google, paste the container id here, and load the live domain. Use preview mode to confirm the tag before you trust any report.',
    howAr:
      'انشر الحاوية في جوجل، والصق معرف الحاوية هنا، ثم افتح النطاق المباشر. استخدم وضع المعاينة لتأكيد العلامة قبل الاعتماد على أي تقرير.',
    waitEn:
      'A published container can fire on the next page load. Counts inside analytics or ads still follow those tools.',
    waitAr:
      'الحاوية المنشورة قد تعمل مع تحميل الصفحة التالي. الأعداد داخل التحليلات أو الإعلانات تبقى على توقيت تلك الأدوات.',
  },
  {
    id: 'console',
    titleEn: 'Search Console',
    titleAr: 'بحث جوجل',
    howEn:
      'Add the live domain as a property and verify it with the tag saved here or with domain records. Submit the sitemap only after the public site opens.',
    howAr:
      'أضف النطاق المباشر كخاصية وتحقق منه بالعلامة المحفوظة هنا أو بسجلات النطاق. أرسل خريطة الموقع بعد أن يفتح الموقع للعموم.',
    waitEn:
      'Verification is often minutes to one day. Clicks, impressions, and queries are commonly delayed about two days, and the first rows need real search traffic.',
    waitAr:
      'التحقق يكون غالباً من دقائق إلى يوم. النقرات ومرات الظهور والاستعلامات تتأخر عادة نحو يومين، وأول الصفوف تحتاج زيارات بحث حقيقية.',
  },
  {
    id: 'indexing',
    titleEn: 'Indexing',
    titleAr: 'الفهرسة',
    howEn:
      'Request indexing only for public pages on the live domain. A request does not mean the page is already in search results.',
    howAr:
      'اطلب الفهرسة للصفحات العامة على النطاق المباشر فقط. الطلب لا يعني أن الصفحة ظهرت في نتائج البحث.',
    waitEn: 'Inspection can update within hours. Showing in search often takes days, and sometimes weeks.',
    waitAr: 'قد يتحدث الفحص خلال ساعات. الظهور في البحث يأخذ غالباً أياماً، وأحياناً أسابيع.',
  },
  {
    id: 'meta',
    titleEn: 'Meta and ads',
    titleAr: 'ميتا والإعلانات',
    howEn:
      'Place this store’s pixel on the live domain from its own Meta account. Test with a real page view. Ad spend stays in Meta until that account returns it.',
    howAr:
      'ضع بكسل هذا المتجر على النطاق المباشر من حساب ميتا الخاص به. اختبر بزيارة صفحة حقيقية. إنفاق الإعلان يبقى في ميتا إلى أن يعيده ذلك الحساب.',
    waitEn:
      'A test event can show within minutes. Ad totals often lag from minutes up to two days. Campaign learning takes more days and real visits.',
    waitAr:
      'قد يظهر حدث الاختبار خلال دقائق. مجاميع الإعلانات تتأخر غالباً من دقائق إلى يومين. تعلم الحملة يحتاج أياماً أكثر وزيارات حقيقية.',
  },
  {
    id: 'reports',
    titleEn: 'Reports on this dashboard',
    titleAr: 'التقارير في هذه اللوحة',
    howEn:
      'Sales reports use this store’s saved orders. Search and ad charts stay empty until the connected tool returns numbers for this store alone.',
    howAr:
      'تقارير المبيعات تستخدم طلبات هذا المتجر المحفوظة. مخططات البحث والإعلانات تبقى فارغة إلى أن تعيد الأداة المتصلة أرقاماً لهذا المتجر وحده.',
    waitEn:
      'Order reports update when an order is saved. Outside tools follow the waits above. An empty chart means waiting for data.',
    waitAr:
      'تقارير الطلبات تتحدث عند حفظ الطلب. الأدوات الخارجية تتبع المدد أعلاه. المخطط الفارغ يعني انتظار البيانات.',
  },
];

const LATIN = /[A-Za-z]/;
const ARABIC = /[\u0600-\u06FF]/;

export function guideLocaleIsClean(rows: GoogleLiveGuideRow[] = googleLiveDataGuide): boolean {
  return rows.every((row) => {
    const ar = `${row.titleAr} ${row.howAr} ${row.waitAr}`;
    const en = `${row.titleEn} ${row.howEn} ${row.waitEn}`;
    return !LATIN.test(ar) && !ARABIC.test(en);
  });
}

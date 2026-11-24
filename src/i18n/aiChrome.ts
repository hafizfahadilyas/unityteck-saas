/**
 * Product Details / editor chrome for AI actions.
 * Arabic locale = Arabic only. English locale = English only.
 */
export function aiChrome(isAr: boolean) {
  return {
    short: isAr ? 'ذكاء اصطناعي' : 'AI',
    manual: isAr ? 'يدوي' : 'Manual',
    manualTitle: isAr ? 'كتابة يدوية' : 'Manual entry',
    suggestTitle: isAr
      ? 'اقتراح بالذكاء الاصطناعي من الاسم أو الصورة'
      : 'AI suggestion from name or image',
    needName: isAr ? 'اكتب اسم المنتج أولاً' : 'Type product name first',
    needNameToast: isAr
      ? 'اكتب اسم المنتج أولاً لتفعيل التعبئة بالذكاء الاصطناعي'
      : 'Type the product name first to activate AI fill',
    needApi: isAr
      ? 'اقتراح الذكاء الاصطناعي يتطلب اتصال الواجهة البرمجية'
      : 'AI suggestion needs the live API connection',
    autoFill: isAr ? 'تعبئة بالذكاء الاصطناعي' : 'AI Auto-fill',
    autoFillShort: isAr ? 'تعبئة ذكية' : 'AI Fill',
    fetching: isAr ? 'جاري الجلب...' : 'Fetching...',
    filling: isAr ? 'جاري التعبئة...' : 'Filling...',
    hintReady: isAr
      ? 'الاسم جاهز — جلب حقيقي من الاسم أو الصورة ثم عدّل'
      : 'Name ready — fetch real fields from name/image, then edit',
    hintNeedName: isAr
      ? 'اكتب اسم المنتج لتفعيل التعبئة بالذكاء الاصطناعي'
      : 'Type product name to activate AI fill',
    autoFillTitle: isAr
      ? 'جلب العلامة والتصنيف والوصف وتحسين البحث والسعر الحقيقي من الاسم أو الصورة'
      : 'Fetch real brand, categories, copy, SEO, and price from name or image',
    titlePlaceholder: isAr
      ? 'اضغط الذكاء الاصطناعي لاقتراح العنوان تلقائياً...'
      : 'Press AI to auto-suggest the title...',
    descPlaceholder: isAr
      ? 'اضغط الذكاء الاصطناعي لاقتراح الوصف تلقائياً، أو عدّل يدوياً...'
      : 'Press AI to auto-suggest the description, or edit manually...',
    appliedAll: isAr
      ? 'تم جلب البيانات الحقيقية — يمكنك التعديل ثم الحفظ'
      : 'Real details fetched — edit anything, then save',
    appliedAllWithImage: isAr
      ? 'تم جلب البيانات من الاسم والصورة — عدّل ثم احفظ'
      : 'Fetched from name + image — edit, then save',
    appliedPartial: isAr
      ? 'تم تطبيق اقتراح العنوان والوصف — احفظ المنتج عند الجاهزية'
      : 'Title and description suggestion applied — save when ready',
    fetchFailed: isAr
      ? 'تعذر الحصول على اقتراح الذكاء الاصطناعي'
      : 'Could not fetch AI suggestion',
    quota: isAr
      ? 'تم تجاوز حد استخدام الذكاء الاصطناعي لهذا المفتاح. انتظر إعادة التعيين أو حدّث مفتاح الواجهة على الخادم.'
      : 'AI quota exceeded for this key. Wait for the free-tier reset, or update GEMINI_API_KEY on the API server.',
    busy: isAr
      ? 'نموذج الذكاء الاصطناعي مشغول حالياً. حاول مرة أخرى بعد دقيقة.'
      : 'AI model is busy right now. Try again in a minute.',
    imgPromptLabel: isAr ? 'ذكاء اصطناعي · صورة من النص' : 'AI · Image from prompt',
    imgPromptSoon: isAr ? 'قريباً' : 'Coming Soon',
    imgPromptToast: isAr
      ? 'توليد صورة المنتج من النص بالذكاء الاصطناعي — قريباً'
      : 'AI product image from prompt — Coming Soon',
    imgPromptTitle: isAr
      ? 'توليد صورة بالذكاء الاصطناعي من النص — قريباً'
      : 'Generate product image from AI prompt — Coming Soon',
  };
}

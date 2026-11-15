import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Eye,
  Globe,
  Link2,
  Lock,
  Save,
  ArrowRight,
  X,
  Tag,
  FileText,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { MasterLuxePanel, MasterKpiGrid, masterGhostBtnClass } from './MasterUiKit';
import { OverviewStatCard } from '../common/OverviewStatCard';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { RichTextEditor } from '../common/RichTextEditor';
import { MediaUploadField } from '../common/MediaUploadField';
import { GlobalModal } from '../common/GlobalModal';
import {
  bulkMasterPlatformBlogPosts,
  createMasterPlatformBlogPost,
  deleteMasterPlatformBlogPost,
  fetchMasterPlatformBlogPosts,
  updateMasterPlatformBlogPost,
  type PlatformBlogPost,
  type PlatformBlogStatus,
  type PlatformBlogVisibility,
} from '../../api/tenantApi';

type LangTab = 'en' | 'ar';
type ViewMode = 'list' | 'compose';

const emptyDraft = (): Omit<PlatformBlogPost, 'id' | 'views'> & { id?: string } => ({
  slug: '',
  title_en: '',
  title_ar: '',
  excerpt_en: '',
  excerpt_ar: '',
  content_en: '',
  content_ar: '',
  labels: [],
  category: '',
  cover_image: '',
  author_name: 'Unityteck',
  status: 'draft',
  visibility: 'private',
  access_token: '',
  seo: {
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    focus_keyword: '',
  },
  published_at: null,
});

function visibilityLabel(v: PlatformBlogVisibility, isAr: boolean): string {
  if (v === 'live') return isAr ? 'مباشر' : 'Live';
  if (v === 'unlisted') return isAr ? 'غير مدرج' : 'Unlisted';
  return isAr ? 'خاص' : 'Private';
}

function statusLabel(s: PlatformBlogStatus, isAr: boolean): string {
  return s === 'published' ? (isAr ? 'منشور' : 'Published') : isAr ? 'مسودة' : 'Draft';
}

function platformBlogOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'https://mieraf-ksa.com';
}

function buildPublicPostUrl(post: Pick<PlatformBlogPost, 'slug' | 'visibility' | 'access_token' | 'status'>): string {
  if (!post.slug || post.status !== 'published') return '';
  if (post.visibility === 'private') return '';
  const base = `${platformBlogOrigin()}/platform-blog/${encodeURIComponent(post.slug)}`;
  if (post.visibility === 'unlisted' && post.access_token) {
    return `${base}?token=${encodeURIComponent(post.access_token)}`;
  }
  if (post.visibility === 'live') return base;
  return '';
}

export const MasterPlatformBlog: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [view, setView] = useState<ViewMode>('list');
  const [posts, setPosts] = useState<PlatformBlogPost[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVis, setFilterVis] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draft, setDraft] = useState(() => emptyDraft());
  const [langTab, setLangTab] = useState<LangTab>(isAr ? 'ar' : 'en');
  const [labelInput, setLabelInput] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [liveLinkBanner, setLiveLinkBanner] = useState<string>('');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetchMasterPlatformBlogPosts({
        q: search.trim() || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        visibility: filterVis !== 'all' ? filterVis : undefined,
      });
      setPosts(Array.isArray(res?.data) ? res.data : []);
      setMetrics(res?.metrics || {});
    } catch {
      toast(isAr ? 'تعذر تحميل مقالات المدونة' : 'Failed to load blog posts', 'error');
      setPosts([]);
    } finally {
      setBusy(false);
    }
  }, [filterStatus, filterVis, isAr, search, toast]);

  useEffect(() => {
    if (view === 'list') void load();
  }, [view, load]);

  const openNew = () => {
    setDraft(emptyDraft());
    setLangTab(isAr ? 'ar' : 'en');
    setLabelInput('');
    setView('compose');
  };

  const openEdit = (post: PlatformBlogPost) => {
    setDraft({
      ...post,
      labels: Array.isArray(post.labels) ? post.labels : [],
      seo: {
        title_en: post.seo?.title_en || '',
        title_ar: post.seo?.title_ar || '',
        description_en: post.seo?.description_en || '',
        description_ar: post.seo?.description_ar || '',
        focus_keyword: post.seo?.focus_keyword || '',
      },
    });
    setLangTab(isAr ? 'ar' : 'en');
    setLabelInput('');
    setView('compose');
  };

  const setField = <K extends keyof ReturnType<typeof emptyDraft>>(key: K, val: ReturnType<typeof emptyDraft>[K]) => {
    setDraft((prev) => ({ ...prev, [key]: val }));
  };

  const addLabel = () => {
    const t = labelInput.trim();
    if (!t) return;
    if (draft.labels.includes(t)) {
      setLabelInput('');
      return;
    }
    setField('labels', [...draft.labels, t]);
    setLabelInput('');
  };

  const handleSave = async (publishNow?: boolean) => {
    if (!draft.title_en.trim() && !draft.title_ar.trim()) {
      toast(isAr ? 'يرجى كتابة عنوان بالعربية أو الإنجليزية' : 'Please enter a title in Arabic or English', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title_en: draft.title_en.trim(),
        title_ar: draft.title_ar.trim(),
        excerpt_en: draft.excerpt_en.trim(),
        excerpt_ar: draft.excerpt_ar.trim(),
        content_en: draft.content_en,
        content_ar: draft.content_ar,
        labels: draft.labels,
        category: draft.category.trim(),
        cover_image: draft.cover_image.trim(),
        author_name: draft.author_name.trim() || 'Unityteck',
        slug: draft.slug.trim(),
        status: (publishNow ? 'published' : draft.status) as PlatformBlogStatus,
        visibility: draft.visibility as PlatformBlogVisibility,
        seo: draft.seo,
      };
      let saved: PlatformBlogPost;
      if (draft.id) {
        const res = await updateMasterPlatformBlogPost(draft.id, payload);
        saved = res.data;
      } else {
        const res = await createMasterPlatformBlogPost(payload);
        saved = res.data;
      }
      setDraft({
        ...saved,
        labels: Array.isArray(saved.labels) ? saved.labels : [],
        seo: saved.seo || emptyDraft().seo,
      });
      const published = publishNow || payload.status === 'published';
      const liveUrl = buildPublicPostUrl(saved);
      if (published && liveUrl) {
        setLiveLinkBanner(liveUrl);
        toast(isAr ? 'تم النشر — رابط العرض المباشر جاهز' : 'Published — live view link ready', 'success');
      } else {
        setLiveLinkBanner('');
        toast(published ? (isAr ? 'تم النشر' : 'Post published') : isAr ? 'تم حفظ المسودة' : 'Draft saved', 'success');
      }
      if (!published) {
        setView('list');
        void load();
      } else {
        void load();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast(msg || (isAr ? 'فشل حفظ المقال' : 'Failed to save post'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMasterPlatformBlogPost(id);
      toast(isAr ? 'تم حذف المقال' : 'Post deleted', 'success');
      void load();
    } catch {
      toast(isAr ? 'فشل الحذف' : 'Delete failed', 'error');
    }
  };

  const handleBulk = async (action: string) => {
    if (selectedIds.length === 0) {
      toast(isAr ? 'لم يتم تحديد مقالات' : 'No posts selected', 'warning');
      return;
    }
    try {
      await bulkMasterPlatformBlogPosts(action, selectedIds);
      setSelectedIds([]);
      toast(isAr ? 'تم تنفيذ الإجراء' : 'Bulk action done', 'success');
      void load();
    } catch {
      toast(isAr ? 'فشل الإجراء المجمع' : 'Bulk action failed', 'error');
    }
  };

  const publicViewUrl = useMemo(() => {
    if (!draft.slug) return '';
    return buildPublicPostUrl({
      slug: draft.slug,
      visibility: draft.visibility,
      access_token: draft.access_token,
      status: draft.status,
    });
  }, [draft.access_token, draft.slug, draft.status, draft.visibility]);

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast(isAr ? 'تم نسخ الرابط' : 'Link copied', 'success');
    } catch {
      toast(isAr ? 'تعذر النسخ' : 'Could not copy', 'error');
    }
  };

  const previewHtml = langTab === 'ar' ? draft.content_ar : draft.content_en;
  const previewTitle = langTab === 'ar' ? draft.title_ar || draft.title_en : draft.title_en || draft.title_ar;

  const inputStyle: React.CSSProperties = {
    borderColor: 'var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontFamily: 'var(--font-ui)',
  };

  if (view === 'compose') {
    return (
      <AdminPageShell>
        <AdminPageHeader
          title={draft.id ? (isAr ? 'تعديل المقال' : 'Edit post') : isAr ? 'مقال جديد' : 'New post'}
          subtitle={
            isAr
              ? 'محرر مدونة المنصة — مثل مدونة جوجل: عنوان، محتوى، تسميات، وظهور'
              : 'Platform blog editor — Google Blogger style: title, body, labels, visibility'
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={masterGhostBtnClass}
                onClick={() => setView('list')}
                disabled={saving}
              >
                <ArrowRight className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} />
                {isAr ? 'العودة للقائمة' : 'Back to posts'}
              </button>
              <button
                type="button"
                className={masterGhostBtnClass}
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="w-4 h-4" />
                {isAr ? 'معاينة' : 'Preview'}
              </button>
              {publicViewUrl ? (
                <a
                  href={publicViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={masterGhostBtnClass}
                >
                  <ExternalLink className="w-4 h-4" />
                  {isAr ? 'عرض مباشر' : 'Live view'}
                </a>
              ) : null}
              <button
                type="button"
                className={masterGhostBtnClass}
                onClick={() => void handleSave(false)}
                disabled={saving}
                aria-busy={saving}
              >
                <Save className="w-4 h-4" />
                {isAr ? 'حفظ المسودة' : 'Save draft'}
              </button>
              <button
                type="button"
                className="unity-btn-primary px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-1.5"
                onClick={() => {
                  setField('status', 'published');
                  void handleSave(true);
                }}
                disabled={saving}
                aria-busy={saving}
              >
                <Globe className="w-4 h-4" />
                {isAr ? 'نشر' : 'Publish'}
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-4 sm:p-6 max-w-[1400px] mx-auto w-full min-w-0">
          {/* Main editor */}
          <div className="xl:col-span-8 space-y-4 min-w-0">
            <MasterLuxePanel padding="lg" className="space-y-4">
              <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                {([
                  { id: 'en' as const, label: isAr ? 'الإنجليزية' : 'English' },
                  { id: 'ar' as const, label: isAr ? 'العربية' : 'Arabic' },
                ]).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLangTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      langTab === t.id ? 'unity-btn-primary' : masterGhostBtnClass
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {langTab === 'en' ? (
                <div className="space-y-3" dir="ltr">
                  <input
                    value={draft.title_en}
                    onChange={(e) => setField('title_en', e.target.value)}
                    placeholder="Post title (English)"
                    className="w-full text-xl sm:text-2xl font-black rounded-xl border px-3 py-2 outline-none"
                    style={inputStyle}
                  />
                  <textarea
                    value={draft.excerpt_en}
                    onChange={(e) => setField('excerpt_en', e.target.value)}
                    rows={2}
                    placeholder="Short excerpt / summary (English)"
                    className="w-full text-sm rounded-xl border px-3 py-2 outline-none"
                    style={inputStyle}
                  />
                  <RichTextEditor
                    label="Post body (English)"
                    value={draft.content_en}
                    onChange={(v) => setField('content_en', v)}
                    placeholder="Write your article with headings, lists, images, links, tables, YouTube…"
                    minHeight={320}
                    rows={14}
                    isAr={false}
                    enableHeadings
                    enableMedia
                    enableAdvanced
                    mediaFolder="marketing"
                  />
                </div>
              ) : (
                <div className="space-y-3" dir="rtl">
                  <input
                    value={draft.title_ar}
                    onChange={(e) => setField('title_ar', e.target.value)}
                    placeholder="عنوان المقال (عربي)"
                    className="w-full text-xl sm:text-2xl font-black rounded-xl border px-3 py-2 outline-none"
                    style={inputStyle}
                  />
                  <textarea
                    value={draft.excerpt_ar}
                    onChange={(e) => setField('excerpt_ar', e.target.value)}
                    rows={2}
                    placeholder="مقتطف قصير / ملخص (عربي)"
                    className="w-full text-sm rounded-xl border px-3 py-2 outline-none"
                    style={inputStyle}
                  />
                  <RichTextEditor
                    label="محتوى المقال (عربي)"
                    value={draft.content_ar}
                    onChange={(v) => setField('content_ar', v)}
                    placeholder="اكتب المقال بالعناوين والقوائم والصور والروابط والجداول ويوتيوب…"
                    minHeight={320}
                    rows={14}
                    isAr
                    enableHeadings
                    enableMedia
                    enableAdvanced
                    mediaFolder="marketing"
                  />
                </div>
              )}
            </MasterLuxePanel>

            <MasterLuxePanel padding="lg" className="space-y-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? 'تحسين محركات البحث' : 'SEO'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={draft.seo?.title_en || ''}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, seo: { ...p.seo, title_en: e.target.value } }))
                  }
                  placeholder={isAr ? 'عنوان البحث (إنجليزي)' : 'Meta title (EN)'}
                  className="rounded-xl border px-3 py-2 text-sm"
                  style={inputStyle}
                  dir="ltr"
                />
                <input
                  value={draft.seo?.title_ar || ''}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, seo: { ...p.seo, title_ar: e.target.value } }))
                  }
                  placeholder={isAr ? 'عنوان البحث (عربي)' : 'Meta title (AR)'}
                  className="rounded-xl border px-3 py-2 text-sm"
                  style={inputStyle}
                  dir="rtl"
                />
                <textarea
                  value={draft.seo?.description_en || ''}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, seo: { ...p.seo, description_en: e.target.value } }))
                  }
                  rows={2}
                  placeholder={isAr ? 'وصف البحث (إنجليزي)' : 'Meta description (EN)'}
                  className="rounded-xl border px-3 py-2 text-sm"
                  style={inputStyle}
                  dir="ltr"
                />
                <textarea
                  value={draft.seo?.description_ar || ''}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, seo: { ...p.seo, description_ar: e.target.value } }))
                  }
                  rows={2}
                  placeholder={isAr ? 'وصف البحث (عربي)' : 'Meta description (AR)'}
                  className="rounded-xl border px-3 py-2 text-sm"
                  style={inputStyle}
                  dir="rtl"
                />
                <input
                  value={draft.seo?.focus_keyword || ''}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, seo: { ...p.seo, focus_keyword: e.target.value } }))
                  }
                  placeholder={isAr ? 'الكلمة المفتاحية' : 'Focus keyword'}
                  className="rounded-xl border px-3 py-2 text-sm sm:col-span-2"
                  style={inputStyle}
                />
              </div>
            </MasterLuxePanel>
          </div>

          {/* Blogger-style settings rail */}
          <div className="xl:col-span-4 space-y-4 min-w-0">
            <MasterLuxePanel padding="lg" className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                {isAr ? 'إعدادات النشر' : 'Post settings'}
              </h3>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'الحالة' : 'Status'}
                </label>
                <select
                  value={draft.status}
                  onChange={(e) => setField('status', e.target.value as PlatformBlogStatus)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
                  <option value="published">{isAr ? 'منشور' : 'Published'}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'الظهور (مثل مدونة جوجل)' : 'Visibility (like Google Blogger)'}
                </label>
                {(
                  [
                    {
                      id: 'live' as const,
                      icon: Globe,
                      title: isAr ? 'مباشر' : 'Live',
                      desc: isAr
                        ? 'ظاهر للجميع وفي قائمة المدونة'
                        : 'Public and listed on the blog',
                    },
                    {
                      id: 'unlisted' as const,
                      icon: Link2,
                      title: isAr ? 'غير مدرج' : 'Unlisted',
                      desc: isAr
                        ? 'من لديه الرابط السري فقط — غير ظاهر في القائمة'
                        : 'Only people with the secret link — not listed',
                    },
                    {
                      id: 'private' as const,
                      icon: Lock,
                      title: isAr ? 'خاص' : 'Private',
                      desc: isAr
                        ? 'ظاهر فقط في لوحة التحكم الرئيسية'
                        : 'Visible only inside Master Admin',
                    },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = draft.visibility === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setField('visibility', opt.id)}
                      className="w-full text-start rounded-xl border p-3 transition-colors"
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--border)',
                        background: active
                          ? 'color-mix(in srgb, var(--accent) 12%, var(--surface))'
                          : 'var(--surface)',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Icon
                          className="w-4 h-4 mt-0.5 shrink-0"
                          style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                            {opt.title}
                          </div>
                          <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                            {opt.desc}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {(publicViewUrl || liveLinkBanner) && draft.status === 'published' && draft.visibility !== 'private' ? (
                <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'رابط العرض المباشر' : 'Live view link'}
                  </div>
                  <code className="text-[10px] break-all block" style={{ color: 'var(--text)' }}>
                    {liveLinkBanner || publicViewUrl}
                  </code>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={masterGhostBtnClass}
                      onClick={() => void copyLink(liveLinkBanner || publicViewUrl)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {isAr ? 'نسخ' : 'Copy'}
                    </button>
                    <a
                      href={liveLinkBanner || publicViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="unity-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {isAr ? 'فتح العرض المباشر' : 'Open live view'}
                    </a>
                  </div>
                </div>
              ) : draft.visibility === 'private' ? (
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'المقال الخاص يظهر فقط داخل لوحة التحكم — لا يوجد رابط عام.'
                    : 'Private posts stay inside Master Admin — no public link.'}
                </p>
              ) : null}
            </MasterLuxePanel>

            <MasterLuxePanel padding="lg" className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'الرابط المختصر' : 'Permalink slug'}
                </label>
                <input
                  value={draft.slug}
                  onChange={(e) => setField('slug', e.target.value)}
                  placeholder={isAr ? 'مثال: saudi-ecommerce-tips' : 'e.g. saudi-ecommerce-tips'}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  style={inputStyle}
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'التصنيف' : 'Category'}
                </label>
                <input
                  value={draft.category}
                  onChange={(e) => setField('category', e.target.value)}
                  placeholder={isAr ? 'مثال: أدلة التجار' : 'e.g. Merchant guides'}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'الكاتب' : 'Author'}
                </label>
                <input
                  value={draft.author_name}
                  onChange={(e) => setField('author_name', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                  <Tag className="w-3 h-3" />
                  {isAr ? 'التسميات' : 'Labels'}
                </label>
                <div className="flex gap-2">
                  <input
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLabel();
                      }
                    }}
                    placeholder={isAr ? 'أضف تسمية…' : 'Add a label…'}
                    className="flex-1 rounded-xl border px-3 py-2 text-sm"
                    style={inputStyle}
                  />
                  <button type="button" className={masterGhostBtnClass} onClick={addLabel}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {draft.labels.map((lb) => (
                    <span
                      key={lb}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      {lb}
                      <button
                        type="button"
                        className="opacity-60 hover:opacity-100"
                        onClick={() => setField('labels', draft.labels.filter((x) => x !== lb))}
                        aria-label={isAr ? 'إزالة' : 'Remove'}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <MediaUploadField
                label={isAr ? 'صورة الغلاف' : 'Cover image'}
                value={draft.cover_image}
                onChange={(url) => setField('cover_image', url)}
                recommendedSize={isAr ? '١٢٠٠ × ٦٣٠ بكسل' : '1200 × 630 px'}
                aspectRatio="banner"
                allowedTypes={['image', 'gif', 'svg']}
                initialFolder="marketing"
                showUrlInput
              />
            </MasterLuxePanel>
          </div>
        </div>

        <GlobalModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          dir={langTab === 'ar' ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'معاينة المقال' : 'Post preview'}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border overflow-hidden my-8 max-h-[90vh] flex flex-col"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: 'var(--border)', background: 'var(--portal-cta)', color: '#fff' }}
            >
              <span className="text-sm font-bold">{isAr ? 'معاينة' : 'Preview'}</span>
              <button type="button" onClick={() => setPreviewOpen(false)} className="p-1 rounded-lg hover:bg-white/15">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {draft.cover_image ? (
                <img src={draft.cover_image} alt="" className="w-full max-h-64 object-cover rounded-xl" />
              ) : null}
              <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>
                {previewTitle || (isAr ? 'بدون عنوان' : 'Untitled')}
              </h1>
              <div
                className="prose prose-sm max-w-none text-sm leading-relaxed"
                style={{ color: 'var(--text)' }}
                dangerouslySetInnerHTML={{
                  __html: previewHtml || `<p>${isAr ? 'لا يوجد محتوى بعد' : 'No content yet'}</p>`,
                }}
              />
            </div>
          </div>
        </GlobalModal>
      </AdminPageShell>
    );
  }

  // ── List view ──
  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'مدونة المنصة' : 'Platform Blog'}
        subtitle={
          isAr
            ? 'إنشاء مقالات المنصة مثل مدونة جوجل — خاص / غير مدرج / مباشر — عربي وإنجليزي'
            : 'Create platform articles like Google Blogger — private / unlisted / live — Arabic & English'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={masterGhostBtnClass} onClick={() => void load()} disabled={busy}>
              <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
              {isAr ? 'تحديث' : 'Refresh'}
            </button>
            <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-1.5" onClick={openNew}>
              <Plus className="w-4 h-4" />
              {isAr ? 'مقال جديد' : 'New post'}
            </button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-4 max-w-[1400px] mx-auto w-full min-w-0">
        <MasterKpiGrid cols={4}>
          <OverviewStatCard
            label={isAr ? 'الإجمالي' : 'Total'}
            value={String(metrics.total ?? posts.length)}
            icon={BookOpen}
            tone="accent"
          />
          <OverviewStatCard
            label={isAr ? 'مسودات' : 'Drafts'}
            value={String(metrics.draft ?? 0)}
            icon={FileText}
            tone="warn"
          />
          <OverviewStatCard
            label={isAr ? 'مباشر' : 'Live'}
            value={String(metrics.live ?? 0)}
            icon={Globe}
            tone="success"
          />
          <OverviewStatCard
            label={isAr ? 'المشاهدات' : 'Views'}
            value={String(metrics.views ?? 0)}
            icon={Eye}
            tone="info"
          />
        </MasterKpiGrid>

        <MasterLuxePanel padding="md" className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void load();
              }}
              placeholder={isAr ? 'ابحث بالعنوان أو التصنيف…' : 'Search title or category…'}
              className="w-full ps-8 pe-3 py-2 text-sm rounded-xl border outline-none"
              style={inputStyle}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border"
            style={inputStyle}
            aria-label={isAr ? 'الحالة' : 'Status'}
          >
            <option value="all">{isAr ? 'كل الحالات' : 'All statuses'}</option>
            <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
            <option value="published">{isAr ? 'منشور' : 'Published'}</option>
          </select>
          <select
            value={filterVis}
            onChange={(e) => setFilterVis(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border"
            style={inputStyle}
            aria-label={isAr ? 'الظهور' : 'Visibility'}
          >
            <option value="all">{isAr ? 'كل أنواع الظهور' : 'All visibility'}</option>
            <option value="live">{isAr ? 'مباشر' : 'Live'}</option>
            <option value="unlisted">{isAr ? 'غير مدرج' : 'Unlisted'}</option>
            <option value="private">{isAr ? 'خاص' : 'Private'}</option>
          </select>
          <button type="button" className={masterGhostBtnClass} onClick={() => void load()}>
            {isAr ? 'تطبيق' : 'Apply'}
          </button>
        </MasterLuxePanel>

        {selectedIds.length > 0 ? (
          <MasterLuxePanel padding="md" className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
              {selectedIds.length} {isAr ? 'محدد' : 'selected'}
            </span>
            <button type="button" className={masterGhostBtnClass} onClick={() => void handleBulk('publish')}>
              {isAr ? 'نشر' : 'Publish'}
            </button>
            <button type="button" className={masterGhostBtnClass} onClick={() => void handleBulk('draft')}>
              {isAr ? 'مسودة' : 'Draft'}
            </button>
            <button type="button" className={masterGhostBtnClass} onClick={() => void handleBulk('live')}>
              {isAr ? 'مباشر' : 'Live'}
            </button>
            <button type="button" className={masterGhostBtnClass} onClick={() => void handleBulk('unlisted')}>
              {isAr ? 'غير مدرج' : 'Unlisted'}
            </button>
            <button type="button" className={masterGhostBtnClass} onClick={() => void handleBulk('private')}>
              {isAr ? 'خاص' : 'Private'}
            </button>
            <button type="button" className={masterGhostBtnClass} onClick={() => void handleBulk('delete')}>
              <Trash2 className="w-3.5 h-3.5" />
              {isAr ? 'حذف' : 'Delete'}
            </button>
          </MasterLuxePanel>
        ) : null}

        <MasterLuxePanel padding="none" className="overflow-hidden">
          {busy && posts.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'جاري التحميل…' : 'Loading…'}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <FileText className="w-10 h-10 mx-auto opacity-40" style={{ color: 'var(--muted)' }} />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد مقالات' : 'No records found'}
              </p>
              <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-sm font-bold" onClick={openNew}>
                {isAr ? 'إنشاء أول مقال' : 'Create first post'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b text-start" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === posts.length && posts.length > 0}
                        onChange={(e) =>
                          setSelectedIds(e.target.checked ? posts.map((p) => p.id) : [])
                        }
                        aria-label={isAr ? 'تحديد الكل' : 'Select all'}
                      />
                    </th>
                    <th className="p-3 font-semibold">{isAr ? 'العنوان' : 'Title'}</th>
                    <th className="p-3 font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 font-semibold">{isAr ? 'الظهور' : 'Visibility'}</th>
                    <th className="p-3 font-semibold">{isAr ? 'المشاهدات' : 'Views'}</th>
                    <th className="p-3 font-semibold">{isAr ? 'تحديث' : 'Updated'}</th>
                    <th className="p-3 font-semibold">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => {
                    const title = isAr ? p.title_ar || p.title_en : p.title_en || p.title_ar;
                    return (
                      <tr key={p.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                              )
                            }
                            aria-label={title}
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-bold" style={{ color: 'var(--text)' }}>
                            {title || (isAr ? 'بدون عنوان' : 'Untitled')}
                          </div>
                          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                            /{p.slug}
                            {p.category ? ` · ${p.category}` : ''}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background:
                                p.status === 'published'
                                  ? 'color-mix(in srgb, #10b981 18%, transparent)'
                                  : 'color-mix(in srgb, #f59e0b 18%, transparent)',
                              color: p.status === 'published' ? '#059669' : '#b45309',
                            }}
                          >
                            {statusLabel(p.status, isAr)}
                          </span>
                        </td>
                        <td className="p-3 text-xs" style={{ color: 'var(--text)' }}>
                          {visibilityLabel(p.visibility, isAr)}
                        </td>
                        <td className="p-3 tabular-nums" style={{ color: 'var(--muted)' }}>
                          {(p.views || 0).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                        </td>
                        <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                          {p.updated_at ? String(p.updated_at).slice(0, 16).replace('T', ' ') : '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className={masterGhostBtnClass}
                              onClick={() => openEdit(p)}
                              title={isAr ? 'تعديل' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {(() => {
                              const url = buildPublicPostUrl(p);
                              return url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={masterGhostBtnClass}
                                  title={isAr ? 'عرض مباشر' : 'Live view'}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              ) : null;
                            })()}
                            <button
                              type="button"
                              className={masterGhostBtnClass}
                              onClick={() => void handleDelete(p.id)}
                              title={isAr ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </MasterLuxePanel>
      </div>
    </AdminPageShell>
  );
};

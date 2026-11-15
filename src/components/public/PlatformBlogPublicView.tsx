import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ArrowRight, Globe } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  fetchPublicPlatformBlogPost,
  fetchPublicPlatformBlogPosts,
  type PlatformBlogPost,
} from '../../api/tenantApi';
import { PRODUCT_DESCRIPTION_PROSE_CLASS } from '../common/RichTextEditor';

type Props = {
  slug?: string | null;
  token?: string | null;
  onNavigate: (path: string) => void;
};

export const PlatformBlogPublicView: React.FC<Props> = ({ slug, token, onNavigate }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PlatformBlogPost | null>(null);
  const [list, setList] = useState<PlatformBlogPost[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError(null);
      try {
        if (slug) {
          const res = await fetchPublicPlatformBlogPost(slug, token || undefined);
          if (!cancelled) setPost(res?.data || null);
        } else {
          const res = await fetchPublicPlatformBlogPosts();
          if (!cancelled) setList(Array.isArray(res?.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) {
          setError(isAr ? 'تعذر تحميل المقال' : 'Failed to load post');
          setPost(null);
          setList([]);
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, token, isAr]);

  const title = useMemo(() => {
    if (!post) return '';
    return isAr ? post.title_ar || post.title_en : post.title_en || post.title_ar;
  }, [post, isAr]);

  const body = useMemo(() => {
    if (!post) return '';
    return isAr ? post.content_ar || post.content_en : post.content_en || post.content_ar;
  }, [post, isAr]);

  const excerpt = useMemo(() => {
    if (!post) return '';
    return isAr ? post.excerpt_ar || post.excerpt_en : post.excerpt_en || post.excerpt_ar;
  }, [post, isAr]);

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <header
        className="border-b sticky top-0 z-10 backdrop-blur-md"
        style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 92%, transparent)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-bold"
            style={{ color: 'var(--accent)' }}
            onClick={() => onNavigate('/platform-blog')}
          >
            <BookOpen className="w-4 h-4" />
            {isAr ? 'مدونة المنصة' : 'Platform Blog'}
          </button>
          <button
            type="button"
            className="text-xs font-semibold inline-flex items-center gap-1"
            style={{ color: 'var(--muted)' }}
            onClick={() => onNavigate('/')}
          >
            {isAr ? 'الرئيسية' : 'Home'}
            <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        {busy ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {isAr ? 'جاري التحميل…' : 'Loading…'}
          </p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : slug ? (
          !post ? (
            <div className="text-center py-16 space-y-2">
              <Globe className="w-10 h-10 mx-auto opacity-40" style={{ color: 'var(--muted)' }} />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'المقال غير متاح' : 'Post not available'}
              </p>
            </div>
          ) : (
            <article className="space-y-5">
              {post.cover_image ? (
                <img
                  src={post.cover_image}
                  alt=""
                  className="w-full max-h-[420px] object-cover rounded-2xl border"
                  style={{ borderColor: 'var(--border)' }}
                />
              ) : null}
              {post.category ? (
                <span
                  className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                    color: 'var(--accent)',
                  }}
                >
                  {post.category}
                </span>
              ) : null}
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
              {excerpt ? (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {excerpt}
                </p>
              ) : null}
              <div className="text-[11px] flex flex-wrap gap-2" style={{ color: 'var(--muted)' }}>
                <span>{post.author_name}</span>
                {post.published_at ? <span>· {String(post.published_at).slice(0, 10)}</span> : null}
                {typeof post.views === 'number' ? (
                  <span>
                    · {post.views.toLocaleString(isAr ? 'ar-SA' : 'en-US')}{' '}
                    {isAr ? 'مشاهدة' : 'views'}
                  </span>
                ) : null}
              </div>
              <div
                className={`${PRODUCT_DESCRIPTION_PROSE_CLASS} text-sm sm:text-base`}
                dangerouslySetInnerHTML={{ __html: body || `<p>${isAr ? 'لا يوجد محتوى' : 'No content'}</p>` }}
              />
            </article>
          )
        ) : list.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد مقالات منشورة' : 'No published posts'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-xl font-black">{isAr ? 'المقالات المنشورة' : 'Published posts'}</h1>
            <div className="grid gap-4">
              {list.map((p) => {
                const t = isAr ? p.title_ar || p.title_en : p.title_en || p.title_ar;
                const ex = isAr ? p.excerpt_ar || p.excerpt_en : p.excerpt_en || p.excerpt_ar;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onNavigate(`/platform-blog/${encodeURIComponent(p.slug)}`)}
                    className="text-start rounded-2xl border p-4 hover:shadow-sm transition-shadow"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  >
                    <div className="font-bold text-sm">{t || (isAr ? 'بدون عنوان' : 'Untitled')}</div>
                    {ex ? (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>
                        {ex}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

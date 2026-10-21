/**
 * Blog Articles and Commerce Tools Type Definitions
 * Strict Zero-Dummy, Production-Ready SaaS Architecture
 */

export interface BlogAuthor {
  name: string;
  avatar: string;
  role?: string;
}

export interface BlogSeoData {
  meta_title?: string;
  meta_description?: string;
  focus_keyword?: string;
}

export interface BlogArticleItem {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: BlogAuthor;
  status: 'published' | 'draft';
  views: number;
  comments: number;
  published_at: string;
  updated_at: string;
  thumbnail: string;
  featured?: boolean;
  seo?: BlogSeoData;
}

export interface BlogPostSettings {
  layout: 'Large Image + Excerpt' | 'Grid 2-Column' | 'Grid 3-Column' | 'Compact List';
  articles_per_page: number;
  order_by: 'Latest' | 'Most Viewed' | 'Most Commented' | 'Title A-Z';
  sort_order: 'Ascending' | 'Descending';
}

export interface BlogSeoSettings {
  enabled: boolean;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
}

export interface BlogMetrics {
  total_articles: number;
  total_views: number;
  total_comments: number;
  published: number;
  drafts: number;
  weekly_articles_growth?: string;
  weekly_views_growth?: string;
  weekly_comments_growth?: string;
}

export interface BlogApiResponse {
  success: boolean;
  data: BlogArticleItem[];
  metrics: BlogMetrics;
  featured_article: BlogArticleItem | null;
  post_settings: BlogPostSettings;
  seo_settings: BlogSeoSettings;
  store_id: string;
}

/**
 * 20 Article Commerce Tools Configuration Schema (Matching Reference Image 2)
 */
export interface ArticleCommerceToolsConfig {
  article_id: string;
  product_cards: {
    enabled: boolean;
    product_name: string;
    product_image: string;
    price: number;
    rating: number;
    rating_count: number;
    show_price: boolean;
    show_rating: boolean;
    show_add_to_cart: boolean;
    show_wishlist_icon: boolean;
    card_style: string;
  };
  product_quiz: {
    enabled: boolean;
    quiz_title: string;
    options: Array<{ id: string; label: string; color: string }>;
    result_products: string;
  };
  comparison_table: {
    enabled: boolean;
    products: Array<{
      name: string;
      image: string;
      price: string;
      duration: string;
      best_for: string;
    }>;
    show_buy_button: boolean;
  };
  product_bundles: {
    enabled: boolean;
    bundle_title: string;
    images: string[];
    show_bundle_discount: boolean;
    show_original_price: boolean;
    show_savings_badge: boolean;
    original_price: number;
    bundle_price: number;
    savings_badge: string;
    bundle_button_text: string;
  };
  discount_coupon: {
    enabled: boolean;
    coupon_code: string;
    discount_value: number;
    discount_type: string;
    description: string;
    expiry_date: string;
    show_terms: boolean;
    terms_text: string;
  };
  customer_reviews: {
    enabled: boolean;
    review_source: string;
    reviewer_name: string;
    time_ago: string;
    rating: number;
    comment: string;
    photos: string[];
    show_customer_photos: boolean;
    show_verified_badge: boolean;
  };
  free_shipping_bar: {
    enabled: boolean;
    threshold: number;
    current_cart_amount: number;
    progress_text: string;
    show_progress_text: boolean;
    show_icon: boolean;
  };
  savings_calculator: {
    enabled: boolean;
    original_price: number;
    discount_percent: number;
    final_price: number;
    you_save: number;
    show_savings_amount: boolean;
    label_text: string;
  };
  sticky_add_to_cart: {
    enabled: boolean;
    product_name: string;
    product_image: string;
    price: number;
    show_on_mobile: boolean;
    button_text: string;
  };
  wishlist: {
    enabled: boolean;
    button_style: string;
    button_text: string;
    position: string;
    show_on_product_cards: boolean;
    allow_guest_users: boolean;
    show_login_prompt: boolean;
    login_message: string;
  };
  product_video: {
    enabled: boolean;
    video_type: string;
    video_url: string;
    show_autoplay_muted: boolean;
    show_video_title: boolean;
    show_thumbnail: boolean;
  };
  ai_assistant: {
    enabled: boolean;
    assistant_name: string;
    welcome_message: string;
    suggested_questions: string[];
  };
  newsletter: {
    enabled: boolean;
    title: string;
    description: string;
    email_placeholder: string;
    show_incentive_text: boolean;
    success_message: string;
  };
  social_sharing: {
    enabled: boolean;
    platforms: string[];
    button_style: string;
    button_size: string;
    show_share_count: boolean;
  };
  related_articles: {
    enabled: boolean;
    section_title: string;
    display_style: string;
    number_of_articles: number;
    category: string;
    show_view_all_link: boolean;
  };
  seo_enhancements: {
    enabled: boolean;
    seo_title: string;
    meta_description: string;
    focus_keyword: string;
    add_structured_data: boolean;
    enable_breadcrumbs: boolean;
  };
  table_of_contents: {
    enabled: boolean;
    title: string;
    headings: string[];
    show_in_sticky_sidebar: boolean;
    collapsible_sections: boolean;
  };
  stock_alert: {
    enabled: boolean;
    alert_type: string;
    product_name: string;
    product_image: string;
    notify_price_drops: boolean;
    notify_back_in_stock: boolean;
    success_message: string;
  };
  performance_analytics: {
    enabled: boolean;
    metrics_to_display: string[];
    time_range: string;
    views: number;
    product_clicks: number;
    add_to_cart: number;
    orders: number;
  };
  exit_intent: {
    enabled: boolean;
    offer_title: string;
    description: string;
    email_placeholder: string;
    display_delay_seconds: number;
    show_on_mobile: boolean;
    coupon_code: string;
  };
}

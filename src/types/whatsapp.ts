/**
 * WhatsApp Store Management & Messaging Hub Types
 * Strict typing for multi-store isolated messaging channels.
 */

export interface WhatsAppConnectionInfo {
  is_connected: boolean;
  phone_number: string;
  provider: string;
  last_synced_at: string | null;
  business_name?: string;
  business_id?: string;
  phone_number_id?: string;
  waba_id?: string;
}

export interface WhatsAppUsageInfo {
  daily_used: number;
  daily_limit: number;
  daily_remaining: number;
  resets_at: string;
  monthly_used: number;
  monthly_limit: number;
  monthly_remaining?: number;
}

export interface WhatsAppMetricsInfo {
  total_messages: number;
  total_trend: string;
  delivered: number;
  delivered_rate: number;
  delivered_trend: string;
  read: number;
  read_rate: number;
  read_trend: string;
  failed: number;
  failed_rate: number;
  failed_trend: string;
}

export interface WhatsAppCategoryCounts {
  all: number;
  order: number;
  marketing: number;
  custom: number;
}

export interface WhatsAppOverviewData {
  connection: WhatsAppConnectionInfo;
  usage: WhatsAppUsageInfo;
  metrics: WhatsAppMetricsInfo;
  categories: WhatsAppCategoryCounts;
}

export interface WhatsAppMessageItem {
  id: string;
  store_id: string;
  customer_id?: string | null;
  customer_name: string;
  phone_number: string;
  order_id?: string | null;
  order_number?: string | null;
  message_content: string;
  message_type: string;
  category: 'order' | 'marketing' | 'custom';
  template_name?: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  agent_name?: string | null;
  agent_initials?: string | null;
  direction: 'outgoing' | 'incoming';
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface WhatsAppPaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

export interface WhatsAppFilterParams {
  category?: 'all' | 'order' | 'marketing' | 'custom';
  status?: 'all' | 'sent' | 'delivered' | 'read' | 'failed';
  search?: string;
  date_from?: string;
  date_to?: string;
  message_type?: string;
  template?: string;
  agent?: string;
  page?: number;
  per_page?: number;
}

export interface WhatsAppTemplateItem {
  id: string;
  name: string;
  name_ar: string;
  category: string;
  status: 'approved' | 'pending' | 'rejected';
  description: string;
  content: string;
}

export interface SendWhatsAppPayload {
  phone_number: string;
  customer_name?: string;
  customer_id?: string;
  order_id?: string;
  order_number?: string;
  message_content: string;
  message_type?: string;
  category?: 'order' | 'marketing' | 'custom';
  template_name?: string;
  agent_name?: string;
  agent_initials?: string;
  send_mode?: 'api' | 'direct';
}

export interface MasterStoreWhatsAppQuota {
  store_id: string;
  store_name: string;
  store_name_ar?: string;
  daily_limit: number;
  daily_used: number;
  daily_remaining: number;
  monthly_limit: number;
  monthly_used: number;
  monthly_remaining: number;
  is_connected: boolean;
  sender_phone?: string;
}

export interface WhatsAppPhoneNumberItem {
  phone: string;
  display_name: string;
  quality_rating: string;
  is_primary: boolean;
  status: string;
  last_synced?: string;
}

export interface WhatsAppSettingsData {
  is_connected: boolean;
  business_name: string;
  business_id: string;
  phone_number_id: string;
  waba_id: string;
  access_token: string;
  phone_numbers: WhatsAppPhoneNumberItem[];
  webhook_url: string;
  verify_token: string;
  webhook_events: {
    messages: boolean;
    message_status: boolean;
    template_status: boolean;
    reaction_updates: boolean;
    phone_number_updates: boolean;
  };
  business_profile: {
    category: string;
    address: string;
    website: string;
    description: string;
  };
  message_settings: {
    default_window: string;
    timezone: string;
    business_display_name: string;
    default_language: string;
    fallback_number: string;
    enable_read_receipts: boolean;
    auto_retry_failed: boolean;
    notify_on_errors: boolean;
  };
}

export interface WhatsAppContactItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  total_orders?: number;
  total_spent?: number;
  last_order_at?: string;
  is_active: boolean;
  marketing_opt_in?: boolean;
  tags?: string[];
  segments?: string[];
  notes?: string;
  created_at: string;
}

export interface WhatsAppSegmentItem {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  count: number;
  revenue?: number;
}

export interface WhatsAppAutomationItem {
  id: string;
  name: string;
  name_ar: string;
  category: 'order' | 'shipping' | 'delivery' | 'cart' | 'payment';
  trigger_event: string;
  trigger_event_ar: string;
  template_id: string;
  template_name: string;
  is_active: boolean;
  delay_minutes: number;
  total_triggered: number;
  total_sent: number;
  delivery_rate: number;
  description: string;
  description_ar: string;
  updated_at?: string;
}

export interface WhatsAppCampaignItem {
  id: string;
  name: string;
  segment_id: string;
  segment_name: string;
  template_id: string;
  template_name: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  scheduled_at: string | null;
  recipients_count: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  clicked_count: number;
  created_at: string;
}


<?php

namespace App\Support;

/**
 * Central AI engine module catalog (Phase 2).
 * Text modules run via OpenAI with Master quotas. Images reuse existing gate.
 * Video / voice / developer agent stay honest BLOCKED until wired.
 */
final class SouqAiModules
{
    public const GATE_TEXT = 'text';

    public const GATE_IMAGES = 'images';

    public const GATE_AUTOMATION = 'automation';

    public const GATE_NONE = 'none';

    /**
     * @return list<array{
     *   id: string,
     *   gate: string,
     *   status: string,
     *   name_en: string,
     *   name_ar: string,
     *   description_en: string,
     *   description_ar: string,
     *   system: string|null,
     *   provider: string
     * }>
     */
    public static function catalog(): array
    {
        return [
            [
                'id' => 'store_advisor',
                'gate' => self::GATE_TEXT,
                'status' => 'available',
                'name_en' => 'AI Store Advisor',
                'name_ar' => 'مستشار المتجر بالذكاء الاصطناعي',
                'description_en' => 'Advice for THIS store only. Never invent metrics.',
                'description_ar' => 'نصائح لهذا المتجر فقط. لا تخترع أرقاماً.',
                'system' => 'You are the Souq Platform store advisor for ONE Saudi e-commerce store. Answer only about this store. Never invent sales KPIs, ROAS, or visits. If data is missing, say Waiting for Data. Arabic and English as requested. Never mention other tenants or platform secrets.',
                'provider' => 'openai',
            ],
            [
                'id' => 'developer_diagnostics',
                'gate' => self::GATE_TEXT,
                'status' => 'available',
                'name_en' => 'AI Developer Diagnostics & Bug Fixer',
                'name_ar' => 'تشخيص وإصلاح أخطاء المتجر والمطوّر',
                'description_en' => 'Analyze store bugs, checkout issues, template errors, and generate code fixes.',
                'description_ar' => 'تحليل أخطاء المتجر، مشاكل إتمام الطلب، وأخطاء القوالب وتقديم حلول برمجية فورية.',
                'system' => 'You are an expert senior fullstack software engineer and SQA lead for Souq Platform Saudi SaaS. When a merchant or developer reports a bug, error log, or storefront issue, deliver: 1) Root cause identification, 2) Step-by-step fix solution, 3) Code patch or configuration check. Be concise, technical, and accurate. Bilingual Arabic/English.',
                'provider' => 'openai',
            ],
            [
                'id' => 'voice_partner',
                'gate' => self::GATE_TEXT,
                'status' => 'available',
                'name_en' => 'AI Voice Calling & Partner',
                'name_ar' => 'مساعد المكالمات الصوتية الذكي',
                'description_en' => 'Interactive AI voice calling agent for order confirmation, delivery, and customer care.',
                'description_ar' => 'مساعد المكالمات الصوتية التفاعلي لتأكيد الطلبات وتنسيق التوصيل وخدمة العملاء.',
                'system' => 'You are an AI Voice Calling Agent for a Saudi online store. You generate natural, polite conversational voice phone call scripts in Saudi Arabic and English. Structure response as: 1) Call Scenario Objective, 2) Script (Greeting, Verification Question, Confirmation, Polite Closing), 3) Recommended voice tone.',
                'provider' => 'openai',
            ],
            [
                'id' => 'customer_support',
                'gate' => self::GATE_TEXT,
                'status' => 'available',
                'name_en' => 'AI Customer Support',
                'name_ar' => 'دعم العملاء بالذكاء الاصطناعي',
                'description_en' => 'Draft bilingual support replies. No fake order status.',
                'description_ar' => 'مسودات ردود دعم ثنائية اللغة. بلا حالة طلب وهمية.',
                'system' => 'You draft customer-support replies for a Saudi storefront. Be polite, clear, bilingual when asked. Never invent order IDs, tracking numbers, refunds, or payment status. If unknown, ask the merchant for the real fact. Never expose API keys or admin URLs.',
                'provider' => 'openai',
            ],
            [
                'id' => 'seo_assistant',
                'gate' => self::GATE_TEXT,
                'status' => 'available',
                'name_en' => 'AI SEO Assistant',
                'name_ar' => 'مساعد تحسين محركات البحث',
                'description_en' => 'Titles, meta, alt text. No fake rankings.',
                'description_ar' => 'عناوين ووصف وبديل صور. بلا ترتيب وهمي.',
                'system' => 'You are an SEO assistant for a KSA multi-store SaaS merchant. Suggest title, meta description, headings, and image alt in Arabic and/or English as requested. Never invent Google rankings, traffic, or backlinks. Prefer factual, non-spammy copy.',
                'provider' => 'openai',
            ],
            [
                'id' => 'marketing_assistant',
                'gate' => self::GATE_TEXT,
                'status' => 'available',
                'name_en' => 'AI Marketing Assistant',
                'name_ar' => 'مساعد التسويق بالذكاء الاصطناعي',
                'description_en' => 'Campaign copy and captions. No fake engagement.',
                'description_ar' => 'نصوص حملات وتعليقات. بلا تفاعل وهمي.',
                'system' => 'You write marketing copy for Saudi e-commerce (SAR, KSA cities, bilingual). Never invent engagement metrics, ROAS, or Connected social accounts. Do not claim a post was published.',
                'provider' => 'openai',
            ],
            [
                'id' => 'product_description',
                'gate' => self::GATE_TEXT,
                'status' => 'available',
                'name_en' => 'AI Product Description Generator',
                'name_ar' => 'مولّد وصف المنتج',
                'description_en' => 'Product titles and descriptions EN/AR.',
                'description_ar' => 'عناوين ووصف المنتجات عربي/إنجليزي.',
                'system' => 'You generate product titles and descriptions for a Saudi online store. Produce clear EN and AR when asked. Do not invent certifications, reviews, stock counts, or prices unless the merchant supplied them in the prompt.',
                'provider' => 'openai',
            ],
            [
                'id' => 'translation',
                'gate' => self::GATE_TEXT,
                'status' => 'available',
                'name_en' => 'AI Translation',
                'name_ar' => 'الترجمة بالذكاء الاصطناعي',
                'description_en' => 'Translate merchant copy AR ↔ EN. Keep meaning.',
                'description_ar' => 'ترجمة نصوص التاجر عربي ↔ إنجليزي مع الحفاظ على المعنى.',
                'system' => 'You translate e-commerce copy between Arabic and English. Preserve meaning, brand tone, and numbers. Do not add English words into Arabic UI chrome labels. Do not invent product facts.',
                'provider' => 'openai',
            ],
            [
                'id' => 'image_generator',
                'gate' => self::GATE_IMAGES,
                'status' => 'available',
                'name_en' => 'AI Image Generator',
                'name_ar' => 'مولّد الصور بالذكاء الاصطناعي',
                'description_en' => 'Uses Images tab (/ai-media + OpenAI images). Not a fake stub.',
                'description_ar' => 'عبر تبويب الصور (/ai-media وصور OpenAI). ليس وهمياً.',
                'system' => null,
                'provider' => 'openai_gemini',
            ],
            [
                'id' => 'video_generator',
                'gate' => self::GATE_NONE,
                'status' => 'blocked',
                'name_en' => 'AI Video Generator',
                'name_ar' => 'مولّد الفيديو بالذكاء الاصطناعي',
                'description_en' => 'Adapter not wired. Catalog price-first only until provider is connected.',
                'description_ar' => 'المحوّل غير مربوط. السعر أولاً في الكتالوج حتى يتصل المزوّد.',
                'system' => null,
                'provider' => 'none',
            ],
            [
                'id' => 'analytics_assistant',
                'gate' => self::GATE_AUTOMATION,
                'status' => 'available',
                'name_en' => 'AI Analytics Assistant',
                'name_ar' => 'مساعد التحليلات بالذكاء الاصطناعي',
                'description_en' => 'Store-scoped analytics Q&A. Never invent KPIs.',
                'description_ar' => 'أسئلة تحليلات لهذا المتجر فقط. بلا مؤشرات وهمية.',
                'system' => null,
                'provider' => 'openai',
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function find(string $id): ?array
    {
        foreach (self::catalog() as $row) {
            if (($row['id'] ?? '') === $id) {
                return $row;
            }
        }

        return null;
    }

    /**
     * @return list<string>
     */
    public static function ids(): array
    {
        return array_values(array_map(static fn ($r) => (string) $r['id'], self::catalog()));
    }
}

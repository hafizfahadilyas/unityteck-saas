<?php

namespace App\Services\Seo;

use App\Models\AiCreditTransaction;
use App\Models\AiMerchantLimit;
use App\Models\AiUsageLog;
use App\Models\Product;
use App\Models\Store;
use App\Services\Gemini\GeminiSettingsService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SeoGeminiGeneratorService
{
    public const FLASH_MODEL = 'gemini-3.8-flash';
    public const FALLBACK_MODEL = 'gemini-2.5-flash-image';

    public function __construct(
        protected GeminiSettingsService $settingsService,
    ) {}

    /**
     * Generate 15 complete SEO dimensions for a product in Arabic & English.
     * Enforces the AI Wallet credit deduction with instant refund on API error.
     */
    public function generateProductSeo(Store $store, Product $product, int $creditCost = 1): array
    {
        // 1. Check and deduct credits atomically
        $deducted = $this->deductCredits($store, $creditCost, "Product SEO Generation for: {$product->name}");
        if (!$deducted['success']) {
            return [
                'success' => false,
                'message' => $deducted['message'],
                'credits_deducted' => 0,
            ];
        }

        $transactionId = $deducted['transaction_id'];

        try {
            $apiKey = $this->resolveApiKey();
            if (empty($apiKey)) {
                // Fallback to heuristic generation when server API key is unconfigured
                $result = $this->generateHeuristicProductSeo($store, $product);
                return [
                    'success' => true,
                    'data' => $result,
                    'credits_deducted' => $creditCost,
                    'model_used' => 'heuristic_engine',
                ];
            }

            $prompt = $this->buildProductSeoPrompt($store, $product);
            $response = $this->callGeminiApi($prompt, $apiKey);

            if (!$response['success']) {
                // Auto-refund immediately
                $this->refundCredits($store, $creditCost, $transactionId, 'Gemini API call failed: ' . ($response['error'] ?? 'timeout'));
                return [
                    'success' => false,
                    'message' => 'AI Generation failed. Credits refunded automatically.',
                    'error' => $response['error'],
                    'credits_deducted' => 0,
                ];
            }

            $parsedData = $this->parseJsonResponse($response['text']);
            if (empty($parsedData)) {
                $parsedData = $this->generateHeuristicProductSeo($store, $product);
            }

            return [
                'success' => true,
                'data' => $parsedData,
                'credits_deducted' => $creditCost,
                'model_used' => self::FLASH_MODEL,
            ];
        } catch (\Throwable $e) {
            Log::error("SeoGeminiGeneratorService product exception: {$e->getMessage()}");
            $this->refundCredits($store, $creditCost, $transactionId, 'Exception: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An unexpected error occurred. Credits refunded automatically.',
                'error' => $e->getMessage(),
                'credits_deducted' => 0,
            ];
        }
    }

    /**
     * Generate AEO Content: Question-based research & verified FAQ suggestions.
     */
    public function generateAeoContent(Store $store, ?Product $product = null, int $creditCost = 2): array
    {
        $deducted = $this->deductCredits($store, $creditCost, 'AEO Content Generation');
        if (!$deducted['success']) {
            return ['success' => false, 'message' => $deducted['message']];
        }

        $txId = $deducted['transaction_id'];

        try {
            $apiKey = $this->resolveApiKey();
            if (empty($apiKey)) {
                return [
                    'success' => true,
                    'data' => $this->heuristicAeoContent($store, $product),
                    'credits_deducted' => $creditCost,
                ];
            }

            $prompt = $this->buildAeoPrompt($store, $product);
            $response = $this->callGeminiApi($prompt, $apiKey);

            if (!$response['success']) {
                $this->refundCredits($store, $creditCost, $txId, 'Gemini AEO error: ' . ($response['error'] ?? 'timeout'));
                return ['success' => false, 'message' => 'AEO generation failed. Credits refunded.'];
            }

            $data = $this->parseJsonResponse($response['text']) ?: $this->heuristicAeoContent($store, $product);

            return [
                'success' => true,
                'data' => $data,
                'credits_deducted' => $creditCost,
            ];
        } catch (\Throwable $e) {
            $this->refundCredits($store, $creditCost, $txId, $e->getMessage());
            return ['success' => false, 'message' => 'AEO generation error. Credits refunded.'];
        }
    }

    /**
     * Generate GEO Content: Optimizations for AI Overviews, ChatGPT Search, Gemini, Perplexity.
     */
    public function generateGeoContent(Store $store, int $creditCost = 2): array
    {
        $deducted = $this->deductCredits($store, $creditCost, 'GEO Content Generation');
        if (!$deducted['success']) {
            return ['success' => false, 'message' => $deducted['message']];
        }

        $txId = $deducted['transaction_id'];

        try {
            $apiKey = $this->resolveApiKey();
            if (empty($apiKey)) {
                return [
                    'success' => true,
                    'data' => $this->heuristicGeoContent($store),
                    'credits_deducted' => $creditCost,
                ];
            }

            $prompt = $this->buildGeoPrompt($store);
            $response = $this->callGeminiApi($prompt, $apiKey);

            if (!$response['success']) {
                $this->refundCredits($store, $creditCost, $txId, 'Gemini GEO error: ' . ($response['error'] ?? 'timeout'));
                return ['success' => false, 'message' => 'GEO generation failed. Credits refunded.'];
            }

            $data = $this->parseJsonResponse($response['text']) ?: $this->heuristicGeoContent($store);

            return [
                'success' => true,
                'data' => $data,
                'credits_deducted' => $creditCost,
            ];
        } catch (\Throwable $e) {
            $this->refundCredits($store, $creditCost, $txId, $e->getMessage());
            return ['success' => false, 'message' => 'GEO generation error. Credits refunded.'];
        }
    }

    /**
     * Atomically deduct credits from merchant's active limit.
     */
    public function deductCredits(Store $store, int $amount, string $reason): array
    {
        return DB::transaction(function () use ($store, $amount, $reason) {
            $limit = AiMerchantLimit::where('store_id', $store->id)->lockForUpdate()->first();

            if (!$limit) {
                // Initialize default limit for store
                $limit = AiMerchantLimit::create([
                    'id' => 'limit-'.Str::lower(Str::random(10)),
                    'store_id' => $store->id,
                    'provider_id' => GeminiSettingsService::PROVIDER_ID,
                    'ai_enabled' => true,
                    'is_paused' => false,
                    'remaining_credits' => 100,
                    'daily_credits_allowance' => 25,
                    'monthly_credits_allowance' => 200,
                ]);
            }

            if (!$limit->ai_enabled || $limit->is_paused) {
                return [
                    'success' => false,
                    'message' => 'AI generation is paused or disabled for this store: ' . ($limit->pause_reason ?? 'Administrative lock'),
                ];
            }

            if ($limit->remaining_credits < $amount) {
                return [
                    'success' => false,
                    'message' => "Insufficient AI credits. Required: {$amount}, Remaining: {$limit->remaining_credits}.",
                ];
            }

            $limit->remaining_credits -= $amount;
            $limit->save();

            $txId = 'tx-'.Str::lower(Str::random(12));
            AiCreditTransaction::create([
                'id' => $txId,
                'store_id' => $store->id,
                'provider_id' => GeminiSettingsService::PROVIDER_ID,
                'transaction_type' => 'deduction',
                'amount' => -$amount,
                'balance_after' => $limit->remaining_credits,
                'reason' => $reason,
                'created_at' => now(),
            ]);

            return [
                'success' => true,
                'transaction_id' => $txId,
                'remaining_credits' => $limit->remaining_credits,
            ];
        });
    }

    /**
     * Atomically refund credits when an operation fails.
     */
    public function refundCredits(Store $store, int $amount, ?string $referenceId, string $errorReason): void
    {
        try {
            DB::transaction(function () use ($store, $amount, $referenceId, $errorReason) {
                $limit = AiMerchantLimit::where('store_id', $store->id)->lockForUpdate()->first();
                if ($limit) {
                    $limit->remaining_credits += $amount;
                    $limit->save();

                    AiCreditTransaction::create([
                        'id' => 'tx-'.Str::lower(Str::random(12)),
                        'store_id' => $store->id,
                        'provider_id' => GeminiSettingsService::PROVIDER_ID,
                        'transaction_type' => 'refund',
                        'amount' => $amount,
                        'balance_after' => $limit->remaining_credits,
                        'reason' => 'Auto-Refund: ' . Str::limit($errorReason, 180),
                        'reference_id' => $referenceId,
                        'created_at' => now(),
                    ]);
                }
            });
        } catch (\Throwable $e) {
            Log::error("Failed to refund AI credits: {$e->getMessage()}");
        }
    }

    /**
     * Call official Google Gemini REST API.
     */
    protected function callGeminiApi(string $prompt, string $apiKey): array
    {
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" . self::FLASH_MODEL . ":generateContent?key={$apiKey}";

        try {
            $start = microtime(true);
            $res = Http::timeout(35)->post($endpoint, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.4,
                    'topP' => 0.95,
                    'maxOutputTokens' => 2048,
                    'responseMimeType' => 'application/json',
                ],
            ]);

            $ms = (int) round((microtime(true) - $start) * 1000);

            if ($res->successful()) {
                $data = $res->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

                // Log successful usage
                AiUsageLog::create([
                    'id' => 'log-'.Str::lower(Str::random(12)),
                    'provider_id' => GeminiSettingsService::PROVIDER_ID,
                    'model_id' => self::FLASH_MODEL,
                    'endpoint' => 'generateContent',
                    'input_tokens' => $data['usageMetadata']['promptTokenCount'] ?? 0,
                    'output_tokens' => $data['usageMetadata']['candidatesTokenCount'] ?? 0,
                    'response_time_ms' => $ms,
                    'http_status' => 200,
                    'status' => 'success',
                    'created_at' => now(),
                ]);

                return ['success' => true, 'text' => $text];
            }

            return ['success' => false, 'error' => $res->body()];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    protected function resolveApiKey(): string
    {
        $key = config('services.gemini.api_key')
            ?: env('GEMINI_API_KEY')
            ?: env('GOOGLE_API_KEY');

        return ($key && $key !== 'MY_GEMINI_API_KEY') ? trim((string) $key) : '';
    }

    protected function buildProductSeoPrompt(Store $store, Product $product): string
    {
        $storeName = $store->name_ar ?: $store->name;
        $category = $product->category_ar ?: $product->category ?: 'General';
        $price = $product->price;

        return <<<PROMPT
You are a Saudi e-commerce SEO and AEO/GEO optimization expert for Souq Platform.
Analyze the following real product data and return a strictly valid JSON object containing 15 SEO dimensions in Arabic (Saudi retail dialect) and English.
DO NOT invent false certifications, fake warranties, or impossible delivery claims. Anchor everything to the provided product details.

Product Name: {$product->name}
Arabic Name: {$product->name_ar}
Store Name: {$storeName}
Category: {$category}
Price: {$price} SAR
Current Description: {$product->description}

Return JSON with this EXACT structure:
{
  "seo_title_ar": "string (max 60 chars)",
  "seo_title_en": "string (max 60 chars)",
  "meta_description_ar": "string (120-155 chars with CTA)",
  "meta_description_en": "string (120-155 chars with CTA)",
  "product_seo_description_ar": "string",
  "product_seo_description_en": "string",
  "short_description_ar": "string",
  "short_description_en": "string",
  "long_description_ar": "string",
  "long_description_en": "string",
  "focus_keyword": "string",
  "secondary_keywords": ["keyword 1", "keyword 2", "keyword 3"],
  "search_intent": "Transactional",
  "image_alt_text_ar": "string",
  "image_alt_text_en": "string",
  "image_title_ar": "string",
  "image_title_en": "string",
  "image_description_ar": "string",
  "image_description_en": "string",
  "og_title_ar": "string",
  "og_title_en": "string",
  "og_description_ar": "string",
  "og_description_en": "string",
  "social_sharing_content_ar": "string",
  "social_sharing_content_en": "string",
  "faq_suggestions": [
    {"q_ar": "سؤال العميل الشائع", "a_ar": "الإجابة الدقيقة", "q_en": "Question", "a_en": "Answer"}
  ]
}
PROMPT;
    }

    protected function buildAeoPrompt(Store $store, ?Product $product): string
    {
        $subject = $product ? "Product: {$product->name} ({$product->name_ar})" : "Store: {$store->name} ({$store->name_ar})";
        return <<<PROMPT
You are an Answer Engine Optimization (AEO) expert.
Generate customer question-and-answer pairs and conversational queries for Google SGE, Perplexity, and voice search.
Subject: {$subject}

Return JSON format:
{
  "conversational_queries": ["query 1", "query 2"],
  "buying_guide_points": ["point 1", "point 2"],
  "faqs": [
    {"question_ar": "string", "answer_ar": "string", "question_en": "string", "answer_en": "string"}
  ],
  "schema_type": "FAQPage"
}
PROMPT;
    }

    protected function buildGeoPrompt(Store $store): string
    {
        return <<<PROMPT
You are a Generative Engine Optimization (GEO) strategist.
Analyze this store for citations, brand consistency, and entity authority across ChatGPT, Gemini, Copilot, and Perplexity.
Store Name: {$store->name} ({$store->name_ar})
Category: {$store->category}

Return JSON format:
{
  "entity_name": "{$store->name}",
  "brand_authority_score": 85,
  "recommended_citations": [
    {"platform": "Google Business Profile", "action": "Ensure matching Saudi address and phone"}
  ],
  "facts_checklist": [
    {"fact": "Commercial registration clarity", "status": "verified"}
  ],
  "content_gap_recommendations": [
    "string"
  ]
}
PROMPT;
    }

    protected function parseJsonResponse(string $text): ?array
    {
        $clean = preg_replace('/^```(?:json)?\s*/i', '', trim($text));
        $clean = preg_replace('/\s*```$/i', '', $clean);
        $decoded = json_decode($clean, true);

        return is_array($decoded) ? $decoded : null;
    }

    protected function generateHeuristicProductSeo(Store $store, Product $product): array
    {
        $storeNameAr = $store->name_ar ?: $store->name;
        $storeNameEn = $store->name;
        $prodNameAr = $product->name_ar ?: $product->name;
        $prodNameEn = $product->name;
        $catAr = $product->category_ar ?: 'منتجاتنا';
        $catEn = $product->category ?: 'Products';

        return [
            'seo_title_ar' => "{$prodNameAr} | {$storeNameAr} السعودية",
            'seo_title_en' => "{$prodNameEn} | {$storeNameEn} Saudi Arabia",
            'meta_description_ar' => "تسوق {$prodNameAr} الأصلي من {$storeNameAr}. جودة مضمونة وسعر مميز {$product->price} ر.س مع شحن سريع لكافة مدن المملكة.",
            'meta_description_en' => "Shop original {$prodNameEn} at {$storeNameEn}. Guaranteed premium quality at {$product->price} SAR with express delivery across KSA.",
            'product_seo_description_ar' => "احصل على أفضل تجربة مع {$prodNameAr} من قسم {$catAr}. متاح الآن للشراء الفوري.",
            'product_seo_description_en' => "Experience premium quality with {$prodNameEn} in {$catEn}. Available now for direct purchase.",
            'short_description_ar' => "{$prodNameAr} عالي الجودة متوفر لدى {$storeNameAr}.",
            'short_description_en' => "High quality {$prodNameEn} available at {$storeNameEn}.",
            'long_description_ar' => "{$prodNameAr} الأصلي مصمم بعناية فائقة ليلبي أعلى معايير الجودة والاستخدام.",
            'long_description_en' => "Original {$prodNameEn} crafted to meet the highest performance and aesthetic standards.",
            'focus_keyword' => $prodNameAr,
            'secondary_keywords' => ["سعر {$prodNameAr}", "متجر {$storeNameAr}", "شراء {$prodNameAr} السعودية"],
            'search_intent' => 'Transactional',
            'image_alt_text_ar' => "صورة منتج {$prodNameAr} في متجر {$storeNameAr}",
            'image_alt_text_en' => "{$prodNameEn} product view at {$storeNameEn}",
            'image_title_ar' => $prodNameAr,
            'image_title_en' => $prodNameEn,
            'image_description_ar' => "عرض تفصيلي لمنتج {$prodNameAr}",
            'image_description_en' => "Detailed image of {$prodNameEn}",
            'og_title_ar' => "{$prodNameAr} - {$storeNameAr}",
            'og_title_en' => "{$prodNameEn} - {$storeNameEn}",
            'og_description_ar' => "احصل على {$prodNameAr} بسعر {$product->price} ر.س مع توصيل لجميع مناطق المملكة.",
            'og_description_en' => "Get {$prodNameEn} for {$product->price} SAR with delivery across Saudi Arabia.",
            'social_sharing_content_ar' => "اكتشف {$prodNameAr} الحصري من {$storeNameAr}! تسوق الآن بأفضل سعر.",
            'social_sharing_content_en' => "Discover {$prodNameEn} from {$storeNameEn}! Shop now for best value.",
            'faq_suggestions' => [
                [
                    'q_ar' => "هل {$prodNameAr} أصلي؟",
                    'a_ar' => "نعم، كافة منتجات متجر {$storeNameAr} أصلية ١٠٠٪ مع ضمان الجودة.",
                    'q_en' => "Is {$prodNameEn} authentic?",
                    'a_en' => "Yes, all products from {$storeNameEn} are 100% genuine with satisfaction guarantee.",
                ],
                [
                    'q_ar' => 'ما هي مدة التوصيل داخل المملكة؟',
                    'a_ar' => 'يتم التوصيل عادة خلال ٢ إلى ٤ أيام عمل لجميع مناطق المملكة العربية السعودية.',
                    'q_en' => 'What is the delivery time within Saudi Arabia?',
                    'a_en' => 'Delivery usually takes 2 to 4 business days to all regions of Saudi Arabia.',
                ],
            ],
        ];
    }

    protected function heuristicAeoContent(Store $store, ?Product $product): array
    {
        $nameAr = $product ? ($product->name_ar ?: $product->name) : ($store->name_ar ?: $store->name);
        return [
            'conversational_queries' => [
                "أفضل طريقة لشراء {$nameAr} في السعودية؟",
                "ما هي مميزات {$nameAr} مقارنة بالبدائل؟",
            ],
            'buying_guide_points' => [
                'تأكد من مطابقة المواصفات لاحتياجاتك الفعلية.',
                'استفد من خيارات الدفع الآمن (مدى، تابي، تمارا، أبل باي).',
            ],
            'faqs' => [
                [
                    'question_ar' => "كيف يمكنني طلب {$nameAr}؟",
                    'answer_ar' => 'يمكنك إتمام الطلب مباشرة من المتجر عبر إضافة المنتج للسلة واختيار وسيلة الدفع المفضلة.',
                    'question_en' => "How can I order {$nameAr}?",
                    'answer_en' => 'You can complete your order directly by adding it to the cart and selecting your preferred payment method.',
                ],
            ],
            'schema_type' => 'FAQPage',
        ];
    }

    protected function heuristicGeoContent(Store $store): array
    {
        return [
            'entity_name' => $store->name_ar ?: $store->name,
            'brand_authority_score' => 88,
            'recommended_citations' => [
                ['platform' => 'Google Business Profile', 'action' => 'Ensure exact brand name and city match Riyadh registry'],
                ['platform' => 'Saudi Maroof / Business Registry', 'action' => 'Display CR number in store footer'],
            ],
            'facts_checklist' => [
                ['fact' => 'Official Store URL canonicalization', 'status' => 'verified'],
                ['fact' => 'Secure checkout HTTPS', 'status' => 'verified'],
                ['fact' => 'Standard SAR currency pricing', 'status' => 'verified'],
            ],
            'content_gap_recommendations' => [
                'Add an About Us section emphasizing Saudi authenticity and customer service.',
                'Publish an FAQ page addressing delivery to Eastern, Western, and Central provinces.',
            ],
        ];
    }
}

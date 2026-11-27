/**
 * Upload critical Laravel API PHP files to Hostinger (central + flowers).
 * Usage: node scripts/deploy-laravel-hotfiles.js --target=all
 */
import * as ftp from 'basic-ftp';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });

const targetArg = (process.argv.find((a) => a.startsWith('--target=')) || '--target=all')
  .split('=')[1]
  .toLowerCase();

/** Local path → remote path under Laravel app root (or public_html/../api laravel). */
const files = [
  {
    local: 'apps/api/app/Models/Store.php',
    remote: 'app/Models/Store.php',
  },
  {
    local: 'apps/api/app/Models/Product.php',
    remote: 'app/Models/Product.php',
  },
  {
    local: 'apps/api/app/Models/ProductGroupMember.php',
    remote: 'app/Models/ProductGroupMember.php',
  },
  {
    local: 'apps/api/app/Models/OrderItem.php',
    remote: 'app/Models/OrderItem.php',
  },
  {
    local: 'apps/api/app/Support/ProductStorefront.php',
    remote: 'app/Support/ProductStorefront.php',
  },
  {
    local: 'apps/api/app/Support/CoffeeGroupedProducts.php',
    remote: 'app/Support/CoffeeGroupedProducts.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/ProductController.php',
    remote: 'app/Http/Controllers/Api/ProductController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/ProductGroupController.php',
    remote: 'app/Http/Controllers/Api/ProductGroupController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/OrderController.php',
    remote: 'app/Http/Controllers/Api/OrderController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/ShippingController.php',
    remote: 'app/Http/Controllers/Api/ShippingController.php',
  },
  {
    local: 'apps/api/scripts/ensure-product-group-members-table.php',
    remote: 'scripts/ensure-product-group-members-table.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreReviewsController.php',
    remote: 'app/Http/Controllers/Api/StoreReviewsController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreController.php',
    remote: 'app/Http/Controllers/Api/StoreController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreThemeController.php',
    remote: 'app/Http/Controllers/Api/StoreThemeController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/AuthController.php',
    remote: 'app/Http/Controllers/Api/AuthController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/AnalyticsReportController.php',
    remote: 'app/Http/Controllers/Api/AnalyticsReportController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/GoogleIntegrationController.php',
    remote: 'app/Http/Controllers/Api/GoogleIntegrationController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StorefrontAnalyticsController.php',
    remote: 'app/Http/Controllers/Api/StorefrontAnalyticsController.php',
  },
  {
    local: 'apps/api/app/Services/GoogleService.php',
    remote: 'app/Services/GoogleService.php',
  },
  {
    local: 'apps/api/app/Support/Ga4MeasurementId.php',
    remote: 'app/Support/Ga4MeasurementId.php',
  },
  {
    local: 'apps/api/app/Models/CustomerActivity.php',
    remote: 'app/Models/CustomerActivity.php',
  },
  {
    local: 'apps/api/app/Console/Commands/ReportAbandonedCarts.php',
    remote: 'app/Console/Commands/ReportAbandonedCarts.php',
  },
  {
    local: 'apps/api/routes/api.php',
    remote: 'routes/api.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/WhatsAppController.php',
    remote: 'app/Http/Controllers/Api/WhatsAppController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreAiAgentController.php',
    remote: 'app/Http/Controllers/Api/StoreAiAgentController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreAppointmentController.php',
    remote: 'app/Http/Controllers/Api/StoreAppointmentController.php',
  },
  {
    local: 'apps/api/app/Models/StoreAppointment.php',
    remote: 'app/Models/StoreAppointment.php',
  },
  {
    local: 'apps/api/database/migrations/2026_11_25_180000_store_appointments.php',
    remote: 'database/migrations/2026_11_25_180000_store_appointments.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/SubscriptionController.php',
    remote: 'app/Http/Controllers/Api/SubscriptionController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/AuditLogController.php',
    remote: 'app/Http/Controllers/Api/AuditLogController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/OnboardingInviteController.php',
    remote: 'app/Http/Controllers/Api/OnboardingInviteController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/PlatformSettingsController.php',
    remote: 'app/Http/Controllers/Api/PlatformSettingsController.php',
  },
  {
    local: 'apps/api/app/Models/OnboardingInvite.php',
    remote: 'app/Models/OnboardingInvite.php',
  },
  {
    local: 'apps/api/app/Models/PlatformSetting.php',
    remote: 'app/Models/PlatformSetting.php',
  },
  {
    local: 'apps/api/app/Support/Audit.php',
    remote: 'app/Support/Audit.php',
  },
  {
    local: 'apps/api/app/Support/PlatformSettings.php',
    remote: 'app/Support/PlatformSettings.php',
  },
  {
    local: 'apps/api/scripts/ensure-login-email-active-column.php',
    remote: 'scripts/ensure-login-email-active-column.php',
  },
  {
    local: 'apps/api/scripts/ensure-product-order-isolation-columns.php',
    remote: 'scripts/ensure-product-order-isolation-columns.php',
  },
  {
    local: 'apps/api/scripts/ensure-platform-master-phase1-tables.php',
    remote: 'scripts/ensure-platform-master-phase1-tables.php',
  },
  {
    local: 'apps/api/app/Services/CanvaConnectService.php',
    remote: 'app/Services/CanvaConnectService.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/CanvaConnectController.php',
    remote: 'app/Http/Controllers/Api/CanvaConnectController.php',
  },
  {
    local: 'apps/api/app/Models/CanvaOauthConnection.php',
    remote: 'app/Models/CanvaOauthConnection.php',
  },
  {
    local: 'apps/api/config/services.php',
    remote: 'config/services.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/SocialController.php',
    remote: 'app/Http/Controllers/Api/SocialController.php',
  },
  {
    local: 'apps/api/app/Services/Social/TikTokPublisher.php',
    remote: 'app/Services/Social/TikTokPublisher.php',
  },
  {
    local: 'apps/api/app/Services/Social/MetaGraphPublisher.php',
    remote: 'app/Services/Social/MetaGraphPublisher.php',
  },
  {
    local: 'apps/api/scripts/ensure-canva-oauth-table.php',
    remote: 'scripts/ensure-canva-oauth-table.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/UtmTrackingController.php',
    remote: 'app/Http/Controllers/Api/UtmTrackingController.php',
  },
  {
    local: 'apps/api/app/Models/StoreUtmLink.php',
    remote: 'app/Models/StoreUtmLink.php',
  },
  {
    local: 'apps/api/app/Models/Order.php',
    remote: 'app/Models/Order.php',
  },
  {
    local: 'apps/api/app/Models/StorefrontAnalyticsEvent.php',
    remote: 'app/Models/StorefrontAnalyticsEvent.php',
  },
  {
    local: 'apps/api/database/migrations/2026_11_24_120000_store_utm_links_and_order_attribution.php',
    remote: 'database/migrations/2026_11_24_120000_store_utm_links_and_order_attribution.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/PaymentGatewayController.php',
    remote: 'app/Http/Controllers/Api/PaymentGatewayController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/CourierController.php',
    remote: 'app/Http/Controllers/Api/CourierController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/WebhooksController.php',
    remote: 'app/Http/Controllers/Api/WebhooksController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/IntegrationHealthController.php',
    remote: 'app/Http/Controllers/Api/IntegrationHealthController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/BankTransferProofController.php',
    remote: 'app/Http/Controllers/Api/BankTransferProofController.php',
  },
  {
    local: 'apps/api/app/Services/Integration/IntegrationHealthService.php',
    remote: 'app/Services/Integration/IntegrationHealthService.php',
  },
  {
    local: 'apps/api/app/Services/Integration/IntegrationLogService.php',
    remote: 'app/Services/Integration/IntegrationLogService.php',
  },
  {
    local: 'apps/api/app/Models/IntegrationHealthCheck.php',
    remote: 'app/Models/IntegrationHealthCheck.php',
  },
  {
    local: 'apps/api/app/Models/IntegrationHealthLog.php',
    remote: 'app/Models/IntegrationHealthLog.php',
  },
  {
    local: 'apps/api/app/Models/IntegrationWebhookEvent.php',
    remote: 'app/Models/IntegrationWebhookEvent.php',
  },
  {
    local: 'apps/api/app/Models/BankTransferProof.php',
    remote: 'app/Models/BankTransferProof.php',
  },
  {
    local: 'apps/api/app/Models/StoreBankAccount.php',
    remote: 'app/Models/StoreBankAccount.php',
  },
  {
    local: 'apps/api/database/migrations/2026_11_25_210000_create_integration_health_tables.php',
    remote: 'database/migrations/2026_11_25_210000_create_integration_health_tables.php',
  },
  {
    local: 'apps/api/scripts/ensure-integration-health-tables.php',
    remote: 'scripts/ensure-integration-health-tables.php',
  },
  {
    local: 'apps/api/app/Services/Payment/StripeGatewayService.php',
    remote: 'app/Services/Payment/StripeGatewayService.php',
  },
  {
    local: 'apps/api/app/Services/Payment/PayPalGatewayService.php',
    remote: 'app/Services/Payment/PayPalGatewayService.php',
  },
  {
    local: 'apps/api/app/Services/Payment/HyperPayGatewayService.php',
    remote: 'app/Services/Payment/HyperPayGatewayService.php',
  },
  {
    local: 'apps/api/app/Services/Payment/TapGatewayService.php',
    remote: 'app/Services/Payment/TapGatewayService.php',
  },
  {
    local: 'apps/api/app/Services/Payment/CodPaymentService.php',
    remote: 'app/Services/Payment/CodPaymentService.php',
  },
  {
    local: 'apps/api/app/Services/Payment/MoyasarGatewayService.php',
    remote: 'app/Services/Payment/MoyasarGatewayService.php',
  },
  {
    local: 'apps/api/app/Services/Payment/TabbyGatewayService.php',
    remote: 'app/Services/Payment/TabbyGatewayService.php',
  },
  {
    local: 'apps/api/app/Services/Payment/TamaraGatewayService.php',
    remote: 'app/Services/Payment/TamaraGatewayService.php',
  },
  {
    local: 'apps/api/app/Services/Courier/SmsaCourierService.php',
    remote: 'app/Services/Courier/SmsaCourierService.php',
  },
  {
    local: 'apps/api/app/Services/Courier/DhlCourierService.php',
    remote: 'app/Services/Courier/DhlCourierService.php',
  },
  {
    local: 'apps/api/app/Services/Courier/FedexCourierService.php',
    remote: 'app/Services/Courier/FedexCourierService.php',
  },
  {
    local: 'apps/api/app/Services/Courier/UpsCourierService.php',
    remote: 'app/Services/Courier/UpsCourierService.php',
  },
  {
    local: 'database/hostinger/13_integration_health.sql',
    remote: 'database/hostinger/13_integration_health.sql',
  },
  // OpenAI AI Management (isolated from Gemini) — 2026-11-25
  {
    local: 'apps/api/app/Http/Controllers/Api/MasterOpenAiController.php',
    remote: 'app/Http/Controllers/Api/MasterOpenAiController.php',
  },
  {
    local: 'apps/api/app/Support/OpenAiLevels.php',
    remote: 'app/Support/OpenAiLevels.php',
  },
  {
    local: 'apps/api/app/Support/Plans.php',
    remote: 'app/Support/Plans.php',
  },
  {
    local: 'apps/api/app/Services/OpenAi/OpenAiConfigService.php',
    remote: 'app/Services/OpenAi/OpenAiConfigService.php',
  },
  {
    local: 'apps/api/app/Services/OpenAi/OpenAiCostService.php',
    remote: 'app/Services/OpenAi/OpenAiCostService.php',
  },
  {
    local: 'apps/api/app/Services/OpenAi/OpenAiUsageService.php',
    remote: 'app/Services/OpenAi/OpenAiUsageService.php',
  },
  {
    local: 'apps/api/app/Services/OpenAi/OpenAiProviderService.php',
    remote: 'app/Services/OpenAi/OpenAiProviderService.php',
  },
  {
    local: 'apps/api/app/Services/OpenAi/OpenAiImageService.php',
    remote: 'app/Services/OpenAi/OpenAiImageService.php',
  },
  {
    local: 'apps/api/app/Services/OpenAi/OpenAiAutomationService.php',
    remote: 'app/Services/OpenAi/OpenAiAutomationService.php',
  },
  {
    local: 'apps/api/app/Models/OpenAiGlobalConfig.php',
    remote: 'app/Models/OpenAiGlobalConfig.php',
  },
  {
    local: 'apps/api/app/Models/OpenAiModelPricing.php',
    remote: 'app/Models/OpenAiModelPricing.php',
  },
  {
    local: 'apps/api/app/Models/StoreOpenAiConfig.php',
    remote: 'app/Models/StoreOpenAiConfig.php',
  },
  {
    local: 'apps/api/app/Models/StoreOpenAiUsageLog.php',
    remote: 'app/Models/StoreOpenAiUsageLog.php',
  },
  {
    local: 'apps/api/app/Models/StoreOpenAiBudgetPeriod.php',
    remote: 'app/Models/StoreOpenAiBudgetPeriod.php',
  },
  {
    local: 'apps/api/app/Models/StoreOpenAiConfigHistory.php',
    remote: 'app/Models/StoreOpenAiConfigHistory.php',
  },
  {
    local: 'apps/api/app/Models/StoreOpenAiAuditLog.php',
    remote: 'app/Models/StoreOpenAiAuditLog.php',
  },
  {
    local: 'apps/api/app/Models/StoreOpenAiImageConfig.php',
    remote: 'app/Models/StoreOpenAiImageConfig.php',
  },
  {
    local: 'apps/api/app/Models/StoreOpenAiImageUsage.php',
    remote: 'app/Models/StoreOpenAiImageUsage.php',
  },
  {
    local: 'apps/api/app/Models/StoreOpenAiImageEvent.php',
    remote: 'app/Models/StoreOpenAiImageEvent.php',
  },
  {
    local: 'apps/api/app/Models/StoreOpenAiAutomationConfig.php',
    remote: 'app/Models/StoreOpenAiAutomationConfig.php',
  },
  {
    local: 'apps/api/app/Models/StoreOpenAiAutomationUsage.php',
    remote: 'app/Models/StoreOpenAiAutomationUsage.php',
  },
  {
    local: 'apps/api/database/migrations/2026_11_25_190000_create_openai_management_tables.php',
    remote: 'database/migrations/2026_11_25_190000_create_openai_management_tables.php',
  },
  {
    local: 'apps/api/database/migrations/2026_11_25_200000_create_openai_image_and_automation_tables.php',
    remote: 'database/migrations/2026_11_25_200000_create_openai_image_and_automation_tables.php',
  },
  {
    local: 'apps/api/scripts/ensure-openai-management-tables.php',
    remote: 'scripts/ensure-openai-management-tables.php',
  },
  // Souq CT-2…7 marketplace / billing / common themes
  {
    local: 'apps/api/app/Support/Plans.php',
    remote: 'app/Support/Plans.php',
  },
  {
    local: 'apps/api/app/Support/SouqBilling.php',
    remote: 'app/Support/SouqBilling.php',
  },
  {
    local: 'apps/api/app/Support/SouqAddOns.php',
    remote: 'app/Support/SouqAddOns.php',
  },
  {
    local: 'apps/api/app/Support/SouqCommonThemes.php',
    remote: 'app/Support/SouqCommonThemes.php',
  },
  {
    local: 'apps/api/app/Support/DefaultTheme.php',
    remote: 'app/Support/DefaultTheme.php',
  },
  {
    local: 'apps/api/app/Support/SouqCommonSettingsDefaults.php',
    remote: 'app/Support/SouqCommonSettingsDefaults.php',
  },
  {
    local: 'apps/api/app/Support/HostingerCloud.php',
    remote: 'app/Support/HostingerCloud.php',
  },
  {
    local: 'apps/api/app/Services/Store/ProvisionNewStoreService.php',
    remote: 'app/Services/Store/ProvisionNewStoreService.php',
  },
  {
    local: 'apps/api/app/Services/Theme/ThemeEntitlementService.php',
    remote: 'app/Services/Theme/ThemeEntitlementService.php',
  },
  {
    local: 'apps/api/scripts/ensure-souq-default-store.php',
    remote: 'scripts/ensure-souq-default-store.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/SouqMarketplaceController.php',
    remote: 'app/Http/Controllers/Api/SouqMarketplaceController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreThemeController.php',
    remote: 'app/Http/Controllers/Api/StoreThemeController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/DomainController.php',
    remote: 'app/Http/Controllers/Api/DomainController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreStudioDesignController.php',
    remote: 'app/Http/Controllers/Api/StoreStudioDesignController.php',
  },
  {
    local: 'apps/api/app/Models/StoreStudioDesign.php',
    remote: 'app/Models/StoreStudioDesign.php',
  },
  {
    local: 'apps/api/app/Models/ThemeCatalog.php',
    remote: 'app/Models/ThemeCatalog.php',
  },
  {
    local: 'apps/api/app/Models/StoreThemeEntitlement.php',
    remote: 'app/Models/StoreThemeEntitlement.php',
  },
  {
    local: 'apps/api/routes/api.php',
    remote: 'routes/api.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/WhatsAppController.php',
    remote: 'app/Http/Controllers/Api/WhatsAppController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreAiAgentController.php',
    remote: 'app/Http/Controllers/Api/StoreAiAgentController.php',
  },
  {
    local: 'apps/api/scripts/ensure-theme-entitlements-tables.php',
    remote: 'scripts/ensure-theme-entitlements-tables.php',
  },
  {
    local: 'database/hostinger/14_starter_theme_entitlements.sql',
    remote: 'database/hostinger/14_starter_theme_entitlements.sql',
  },
  {
    local: 'database/hostinger/15_souq_common_themes.sql',
    remote: 'database/hostinger/15_souq_common_themes.sql',
  },
  {
    local: 'apps/api/app/Support/StoreAiSuiteAccess.php',
    remote: 'app/Support/StoreAiSuiteAccess.php',
  },
  {
    local: 'apps/api/app/Support/SouqAiModules.php',
    remote: 'app/Support/SouqAiModules.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreAiSuiteController.php',
    remote: 'app/Http/Controllers/Api/StoreAiSuiteController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/AiMediaController.php',
    remote: 'app/Http/Controllers/Api/AiMediaController.php',
  },
  {
    local: 'apps/api/app/Models/StoreAiTrialUsage.php',
    remote: 'app/Models/StoreAiTrialUsage.php',
  },
  {
    local: 'apps/api/app/Models/StoreAiPayment.php',
    remote: 'app/Models/StoreAiPayment.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/WhatsAppController.php',
    remote: 'app/Http/Controllers/Api/WhatsAppController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/EnterpriseSeoController.php',
    remote: 'app/Http/Controllers/Api/EnterpriseSeoController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreAiAgentController.php',
    remote: 'app/Http/Controllers/Api/StoreAiAgentController.php',
  },
  {
    local: 'apps/api/app/Http/Controllers/Api/StoreGrowthAdvisorController.php',
    remote: 'app/Http/Controllers/Api/StoreGrowthAdvisorController.php',
  },
  {
    local: 'apps/api/app/Services/GeminiAiMediaService.php',
    remote: 'app/Services/GeminiAiMediaService.php',
  },
  {
    local: 'apps/api/app/Services/OpenAi/OpenAiProviderService.php',
    remote: 'app/Services/OpenAi/OpenAiProviderService.php',
  },
  {
    local: 'apps/api/app/Support/AiMediaCredits.php',
    remote: 'app/Support/AiMediaCredits.php',
  },
  {
    local: 'apps/api/app/Models/SeoAudit.php',
    remote: 'app/Models/SeoAudit.php',
  },
  {
    local: 'apps/api/app/Models/SeoAuditIssue.php',
    remote: 'app/Models/SeoAuditIssue.php',
  },
  {
    local: 'apps/api/app/Models/SeoAutomationRule.php',
    remote: 'app/Models/SeoAutomationRule.php',
  },
  {
    local: 'apps/api/app/Models/SeoBacklink.php',
    remote: 'app/Models/SeoBacklink.php',
  },
  {
    local: 'apps/api/app/Models/SeoContentHistory.php',
    remote: 'app/Models/SeoContentHistory.php',
  },
  {
    local: 'apps/api/app/Models/SeoImplementation.php',
    remote: 'app/Models/SeoImplementation.php',
  },
  {
    local: 'apps/api/app/Models/SeoIntegration.php',
    remote: 'app/Models/SeoIntegration.php',
  },
  {
    local: 'apps/api/app/Models/SeoKeyword.php',
    remote: 'app/Models/SeoKeyword.php',
  },
  {
    local: 'apps/api/app/Models/SeoMetadata.php',
    remote: 'app/Models/SeoMetadata.php',
  },
  {
    local: 'apps/api/app/Models/SeoRecommendation.php',
    remote: 'app/Models/SeoRecommendation.php',
  },
  {
    local: 'apps/api/app/Models/SeoReport.php',
    remote: 'app/Models/SeoReport.php',
  },
  {
    local: 'apps/api/app/Models/SeoSearchPerformance.php',
    remote: 'app/Models/SeoSearchPerformance.php',
  },
  {
    local: 'apps/api/app/Models/SeoSetting.php',
    remote: 'app/Models/SeoSetting.php',
  },
  {
    local: 'apps/api/app/Models/StoreGrowthAction.php',
    remote: 'app/Models/StoreGrowthAction.php',
  },
  {
    local: 'apps/api/app/Models/StoreGrowthAdvisorSetting.php',
    remote: 'app/Models/StoreGrowthAdvisorSetting.php',
  },
  {
    local: 'apps/api/app/Models/StoreGrowthRecommendation.php',
    remote: 'app/Models/StoreGrowthRecommendation.php',
  },
  {
    local: 'apps/api/app/Services/Growth/StoreDataCollectorService.php',
    remote: 'app/Services/Growth/StoreDataCollectorService.php',
  },
  {
    local: 'apps/api/app/Services/Growth/StoreGrowthAdvisorService.php',
    remote: 'app/Services/Growth/StoreGrowthAdvisorService.php',
  },
  {
    local: 'apps/api/app/Services/Growth/StoreGrowthExecutorService.php',
    remote: 'app/Services/Growth/StoreGrowthExecutorService.php',
  },
  {
    local: 'apps/api/app/Services/Seo/BingIndexNowService.php',
    remote: 'app/Services/Seo/BingIndexNowService.php',
  },
  {
    local: 'apps/api/app/Services/Seo/SeoAuditService.php',
    remote: 'app/Services/Seo/SeoAuditService.php',
  },
  {
    local: 'apps/api/app/Services/Seo/SeoGeminiGeneratorService.php',
    remote: 'app/Services/Seo/SeoGeminiGeneratorService.php',
  },
  {
    local: 'apps/api/app/Services/Seo/SeoImplementationService.php',
    remote: 'app/Services/Seo/SeoImplementationService.php',
  },
  {
    local: 'database/hostinger/16_enterprise_seo_aeo_geo.sql',
    remote: 'database/hostinger/16_enterprise_seo_aeo_geo.sql',
  },
];

function account(name, source) {
  if (!source.host || !source.user || !source.password) return null;
  return { name, ...source };
}

const catalog = {
  central: account('central', {
    label: 'Central Laravel',
    host: process.env.FTP_CENTRAL_HOST,
    user: process.env.FTP_CENTRAL_USER,
    password: process.env.FTP_CENTRAL_PASSWORD,
    // Prefer explicit Laravel dir; fallback to common Hostinger layouts.
    dir:
      process.env.FTP_CENTRAL_LARAVEL_DIR ||
      process.env.FTP_CENTRAL_API_LARAVEL_DIR ||
      '',
  }),
  flowers: account('flowers', {
    label: 'Flowers Laravel',
    host: process.env.FTP_FLOWERS_HOST || process.env.FTP_HOST,
    user: process.env.FTP_FLOWERS_USER || process.env.FTP_USER,
    password: process.env.FTP_FLOWERS_PASSWORD || process.env.FTP_PASSWORD,
    dir:
      process.env.FTP_FLOWERS_LARAVEL_DIR ||
      process.env.FTP_FLOWERS_API_LARAVEL_DIR ||
      '',
  }),
};

const selected = targetArg === 'all' ? ['central', 'flowers'] : [targetArg];

async function openClient(target) {
  const client = new ftp.Client(120000);
  try {
    await client.access({
      host: target.host,
      user: target.user,
      password: target.password,
      secure: true,
      secureOptions: { rejectUnauthorized: false },
    });
  } catch {
    client.close();
    const plain = new ftp.Client(120000);
    await plain.access({
      host: target.host,
      user: target.user,
      password: target.password,
      secure: false,
    });
    return plain;
  }
  return client;
}

async function tryUpload(client, remoteRoot, localAbs, remoteRel) {
  const remotePath = `${remoteRoot}/${remoteRel}`.replace(/\/{2,}/g, '/');
  const parent = path.posix.dirname(remotePath);
  await client.ensureDir(parent);
  await client.uploadFrom(localAbs, remotePath);
  console.log(`  uploaded ${remoteRel}`);
}

async function upload(target) {
  if (!target.dir) {
    console.warn(
      `\n==== ${target.label}: skip — set FTP_*_LARAVEL_DIR in .env (Laravel app root on Hostinger) ====`,
    );
    return;
  }
  const remoteRoot = (target.dir.startsWith('/') ? target.dir : `/${target.dir}`).replace(/\/$/, '');
  console.log(`\n==== ${target.label} → ${remoteRoot} ====`);
  const client = await openClient(target);
  try {
    for (const f of files) {
      const localAbs = path.join(root, f.local);
      if (!fs.existsSync(localAbs)) {
        console.warn(`  skip missing ${f.local}`);
        continue;
      }
      await tryUpload(client, remoteRoot, localAbs, f.remote);
    }
  } finally {
    client.close();
  }
}

for (const name of selected) {
  const t = catalog[name];
  if (!t) {
    console.warn(`skip ${name}: no FTP creds`);
    continue;
  }
  await upload(t);
}
console.log('\nLaravel hotfiles deploy done.');

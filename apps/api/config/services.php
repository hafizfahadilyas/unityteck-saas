<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Clerk — email OTP for Master / Store admin. Secret never leaves the API.
    */
    'clerk' => [
        'secret' => env('CLERK_SECRET_KEY'),
        'publishable' => env('CLERK_PUBLISHABLE_KEY', env('VITE_CLERK_PUBLISHABLE_KEY')),
    ],

    /*
    | Unityteck Site Kit — one platform OAuth app; each store connects its own Google account.
    | Set on Hostinger API .env (Master once). Store owners only Sign in with Google.
    */
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID', env('VITE_GOOGLE_CLIENT_ID')),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect_uri' => env('GOOGLE_REDIRECT_URI'),
        'pagespeed_api_key' => env('GOOGLE_PAGESPEED_API_KEY'),
        'ads_developer_token' => env('GOOGLE_ADS_DEVELOPER_TOKEN'),
        // Optional MCC login-customer-id for manager (SOQU) when accessing client accounts
        'ads_login_customer_id' => env('GOOGLE_ADS_LOGIN_CUSTOMER_ID'),
    ],

    /*
    | Meta WhatsApp Cloud API (platform fallback; store WhatsApp settings override).
    */
    'whatsapp' => [
        'token' => env('META_WHATSAPP_TOKEN'),
        'phone_number_id' => env('META_WHATSAPP_PHONE_NUMBER_ID'),
        'verify_token' => env('META_WHATSAPP_VERIFY_TOKEN', 'unityteck_wa_secret_verify_token_2026'),
    ],

    /*
    | Meta Graph — Instagram Content Publishing + Facebook Page posts (per-store tokens).
    | Platform App ID/Secret optional for future OAuth; stores paste Page token like WhatsApp.
    */
    'meta' => [
        'app_id' => env('META_APP_ID'),
        'app_secret' => env('META_APP_SECRET'),
        'graph_version' => env('META_GRAPH_VERSION', 'v19.0'),
        'oauth_redirect_uri' => env('META_OAUTH_REDIRECT_URI'),
    ],

    /*
    | KSA SMS — Unifonic Cloud and/or Taqnyat (store notification settings may override sender_id).
    */
    'sms' => [
        'default_provider' => env('SMS_PROVIDER', 'unifonic'),
        'sender_id' => env('SMS_SENDER_ID', env('UNIFONIC_SENDER_ID', env('TAQNYAT_SENDER_ID'))),
        'unifonic_app_sid' => env('UNIFONIC_APP_SID'),
        'unifonic_base_url' => env('UNIFONIC_BASE_URL', 'https://el.cloud.unifonic.com'),
        'taqnyat_api_key' => env('TAQNYAT_API_KEY'),
    ],

    /*
    | Gemini / Imagen — AI image (+ optional video) generation. Key stays on API only.
    | Video stays off until GEMINI_VIDEO_ENABLED=true and a Veo model is provisioned.
    */
    'gemini' => [
        'api_key' => env('GEMINI_API_KEY', env('GOOGLE_AI_API_KEY')),
        // Retired preview id gemini-2.0-flash-preview-image-generation → gemini-2.5-flash-image
        'image_model' => env('GEMINI_IMAGE_MODEL', 'gemini-2.5-flash-image'),
        'text_model' => env('GEMINI_TEXT_MODEL', 'gemini-3.8-flash'),
        'video_enabled' => filter_var(env('GEMINI_VIDEO_ENABLED', false), FILTER_VALIDATE_BOOL),
        'video_model' => env('GEMINI_VIDEO_MODEL', 'veo-2.0-generate-001'),
    ],

];

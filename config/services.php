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

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'orange_money' => [
        'base_url' => env('ORANGE_MONEY_ENV') === 'production'
            ? env('ORANGE_MONEY_PROD_URL')
            : env('ORANGE_MONEY_TEST_URL'),
        'merchant_msisdn' => env('ORANGE_MONEY_MERCHANT_MSISDN'),
        'api_username' => env('ORANGE_MONEY_API_USERNAME'),
        'api_password' => env('ORANGE_MONEY_API_PASSWORD'),
        'provider' => env('ORANGE_MONEY_PROVIDER'),
        'payid' => env('ORANGE_MONEY_PAYID'),
        'cert_public' => env('ORANGE_MONEY_CERT_PUBLIC'),
        'cert_private' => env('ORANGE_MONEY_CERT_PRIVATE'),
    ]

];

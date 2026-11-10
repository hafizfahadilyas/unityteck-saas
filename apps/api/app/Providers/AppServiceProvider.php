<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Local Windows → Hostinger MySQL is high-latency; avoid 30s fatal mid-request.
        if ($this->app->environment('local')) {
            @ini_set('max_execution_time', '120');
            @ini_set('default_socket_timeout', '15');
            @set_time_limit(120);
        }
    }
}

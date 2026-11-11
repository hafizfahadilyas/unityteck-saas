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
        // Local Windows → Hostinger MySQL is high-latency; avoid php.ini 30s fatal mid-request.
        // Skip pure CLI (artisan commands / serve watcher). Allow cli-server HTTP workers.
        $sapi = \PHP_SAPI;
        $isHttpWorker = $sapi === 'cli-server' || ! $this->app->runningInConsole();
        if ($this->app->environment('local') && $isHttpWorker && $sapi !== 'cli' && $sapi !== 'phpdbg') {
            @ini_set('max_execution_time', '300');
            @ini_set('default_socket_timeout', '60');
            @set_time_limit(300);
        }
    }
}

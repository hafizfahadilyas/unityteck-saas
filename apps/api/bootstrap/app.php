<?php

use App\Http\Middleware\EnsurePlanFeature;
use App\Http\Middleware\EnsureRoleCan;
use App\Http\Middleware\EnsureStoreId;
use App\Http\Middleware\EnsureSubscriptionWritable;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // API SPA — never redirect to missing web route('login') (that caused HTTP 500).
        $middleware->redirectGuestsTo(fn (Request $request) => null);

        $middleware->api(append: [
            \App\Http\Middleware\PreventStaleCacheHeaders::class,
        ]);

        $middleware->alias([
            'store.id' => EnsureStoreId::class,
            'role.can' => EnsureRoleCan::class,
            'plan.feature' => EnsurePlanFeature::class,
            'subscription.writable' => EnsureSubscriptionWritable::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request, \Throwable $e) => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return null;
        });
    })->create();

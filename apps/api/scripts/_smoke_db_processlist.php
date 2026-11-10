<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = Illuminate\Support\Facades\DB::select('SHOW FULL PROCESSLIST');
$byCmd = [];
$sleep = 0;
$ours = [];
foreach ($rows as $r) {
    $cmd = (string) ($r->Command ?? $r->command ?? '');
    $byCmd[$cmd] = ($byCmd[$cmd] ?? 0) + 1;
    if (strtoupper($cmd) === 'SLEEP') {
        $sleep++;
        $host = (string) ($r->Host ?? $r->host ?? '');
        $time = (int) ($r->Time ?? $r->time ?? 0);
        if ($time >= 30) {
            $ours[] = [
                'id' => $r->Id ?? $r->id ?? null,
                'user' => $r->User ?? $r->user ?? null,
                'host' => $host,
                'time' => $time,
                'db' => $r->db ?? null,
            ];
        }
    }
}

echo json_encode([
    'total' => count($rows),
    'by_command' => $byCmd,
    'sleep_total' => $sleep,
    'sleep_ge_30s' => $ours,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;

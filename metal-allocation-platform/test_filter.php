<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$statuses = ['blocked','appealed'];
$r = App\Models\Allocation::whereIn('status', $statuses)->pluck('allocation_no');
echo 'status=blocked,appealed: ' . implode(', ', $r->toArray()) . PHP_EOL;

$statuses2 = ['pending','processing','reviewing'];
$r2 = App\Models\Allocation::whereIn('status', $statuses2)->pluck('allocation_no');
echo 'status=pending,processing,reviewing: ' . implode(', ', $r2->toArray()) . PHP_EOL;

$r3 = App\Models\Allocation::whereHas('differences', function($q) { $q->where('field_name', 'quantity'); })->pluck('allocation_no');
echo 'difference_field=quantity: ' . implode(', ', $r3->toArray()) . PHP_EOL;

$r4 = App\Models\Allocation::whereHas('differences', function($q) { $q->where('field_name', 'amount'); })->pluck('allocation_no');
echo 'difference_field=amount: ' . implode(', ', $r4->toArray()) . PHP_EOL;

<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$master = App\Models\DrumMasterRecord::with([
    'detailRecords',
    'tensionHistoryRecords' => function ($q) {
        $q->orderBy('measured_at', 'desc');
    },
    'tuningResultRecords' => function ($q) {
        $q->orderBy('created_at', 'desc');
    },
    'tensionTables',
])->find(1);

echo "1. 加载主记录: " . $master->batch_number . "\n";

$latestResult = $master->latestResult;
echo "2. latestResult: " . ($latestResult?->id ?? 'null') . "\n";

$spectrumData = $latestResult?->spectrumData()->orderBy('frequency')->get();
echo "3. spectrumData count: " . ($spectrumData?->count() ?? 'null') . "\n";

$currentTable = $master->currentTensionTable;
echo "4. currentTable: " . ($currentTable?->id ?? 'null') . "\n";

$tensionTableService = app(App\Services\TensionTableService::class);
$tableVersions = $tensionTableService->getTableVersions(
    $master,
    $currentTable?->table_name ?? 'default'
);
echo "5. tableVersions: " . implode(', ', $tableVersions) . "\n";

$controller = app(App\Http\Controllers\DrumTuningController::class);
$reflection = new ReflectionMethod($controller, 'generateTensionChartData');
$reflection->setAccessible(true);
$tensionChartData = $reflection->invoke($controller, $master);
echo "6. tensionChartData labels count: " . count($tensionChartData['labels']) . "\n";

echo "全部完成\n";

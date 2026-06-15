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

$latestResult = $master->latestResult;
$spectrumData = $latestResult?->spectrumData()->orderBy('frequency')->get();
$currentTable = $master->currentTensionTable;

$tensionTableService = app(App\Services\TensionTableService::class);
$tableVersions = $tensionTableService->getTableVersions(
    $master,
    $currentTable?->table_name ?? 'default'
);

$controller = app(App\Http\Controllers\DrumTuningController::class);
$reflection = new ReflectionMethod($controller, 'generateTensionChartData');
$reflection->setAccessible(true);
$tensionChartData = $reflection->invoke($controller, $master);

echo "准备视图数据...\n";

try {
    $view = view('drum-tuning.show', compact(
        'master',
        'latestResult',
        'spectrumData',
        'currentTable',
        'tableVersions',
        'tensionChartData'
    ));
    echo "创建视图对象成功\n";
    
    $html = $view->render();
    echo "视图渲染成功，HTML长度: " . strlen($html) . "\n";
} catch (Exception $e) {
    echo "错误: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . "\n";
    echo "行号: " . $e->getLine() . "\n";
}

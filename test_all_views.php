<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== 测试所有视图渲染 ===\n\n";

$records = App\Models\DrumMasterRecord::all();
echo "记录总数: " . $records->count() . "\n";

$tests = [
    ['name' => '首页列表', 'view' => 'drum-tuning.index', 'data' => function() {
        $records = App\Models\DrumMasterRecord::with(['detailRecords', 'latestResult'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);
        $comparisons = App\Models\TuningComparison::orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
        $stats = [
            'total_records' => App\Models\DrumMasterRecord::count(),
            'completed_records' => App\Models\DrumMasterRecord::where('status', 'completed')->count(),
            'total_comparisons' => App\Models\TuningComparison::count(),
            'anomaly_count' => App\Models\TuningResultRecord::where('spectrum_anomaly', true)->count(),
        ];
        return compact('records', 'comparisons', 'stats');
    }],
    ['name' => '创建页', 'view' => 'drum-tuning.create', 'data' => fn() => []],
];

foreach ($tests as $test) {
    try {
        $data = $test['data']();
        $html = view($test['view'], $data)->render();
        echo "✓ {$test['name']}: " . strlen($html) . " bytes\n";
    } catch (Exception $e) {
        echo "✗ {$test['name']}: " . $e->getMessage() . "\n";
        echo "  文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
    }
}

echo "\n=== 测试详情页 ===\n";
foreach ($records as $master) {
    try {
        $master->load([
            'detailRecords',
            'tensionHistoryRecords' => function ($q) {
                $q->orderBy('measured_at', 'desc');
            },
            'tuningResultRecords' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'tensionTables',
        ]);
        
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
        
        $html = view('drum-tuning.show', compact(
            'master',
            'latestResult',
            'spectrumData',
            'currentTable',
            'tableVersions',
            'tensionChartData'
        ))->render();
        
        echo "✓ 详情页 {$master->batch_number}: " . strlen($html) . " bytes\n";
    } catch (Exception $e) {
        echo "✗ 详情页 {$master->batch_number}: " . $e->getMessage() . "\n";
        echo "  文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
    }
}

echo "\n=== 测试比较页 ===\n";
$comparisons = App\Models\TuningComparison::all();
echo "比较方案总数: " . $comparisons->count() . "\n";

try {
    $records2 = App\Models\DrumMasterRecord::where('status', 'completed')->get();
    $html = view('drum-tuning.comparison-index', [
        'comparisons' => $comparisons,
        'records' => $records2,
    ])->render();
    echo "✓ 比较列表页: " . strlen($html) . " bytes\n";
} catch (Exception $e) {
    echo "✗ 比较列表页: " . $e->getMessage() . "\n";
}

$comparisonService = app(App\Services\TuningComparisonService::class);
foreach ($comparisons as $cmp) {
    try {
        $data = $comparisonService->getComparisonWithDetails($cmp);
        $html = view('drum-tuning.comparison-show', [
            'comparison' => $cmp,
            'data' => $data,
        ])->render();
        echo "✓ 比较详情页 {$cmp->comparison_name}: " . strlen($html) . " bytes\n";
    } catch (Exception $e) {
        echo "✗ 比较详情页 {$cmp->comparison_name}: " . $e->getMessage() . "\n";
        echo "  文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
    }
}

echo "\n=== 测试编辑页 ===\n";
try {
    $master = App\Models\DrumMasterRecord::with('detailRecords')->find(1);
    $html = view('drum-tuning.edit', compact('master'))->render();
    echo "✓ 编辑页: " . strlen($html) . " bytes\n";
} catch (Exception $e) {
    echo "✗ 编辑页: " . $e->getMessage() . "\n";
}

echo "\n=== 所有视图测试完成 ===\n";

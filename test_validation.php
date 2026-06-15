<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== 验证所有视图和路由 ===\n\n";

$master = App\Models\DrumMasterRecord::with(['detailRecords', 'tensionHistoryRecords', 'latestResult', 'tensionTables'])->find(1);
$comparison = App\Models\TuningComparison::find(1);

echo "1. 首页 (drum-tuning.index)... ";
try {
    $view = view('drum-tuning.index', [
        'records' => App\Models\DrumMasterRecord::all(),
        'recentComparisons' => App\Models\TuningComparison::latest()->take(5)->get(),
    ]);
    $html = $view->render();
    echo "✓ OK (" . strlen($html) . " bytes)\n";
} catch (Exception $e) {
    echo "✗ 错误: " . $e->getMessage() . "\n";
}

echo "2. 详情页 (drum-tuning.show)... ";
try {
    $spectrumService = app(App\Services\SpectrumAnalysisService::class);
    $tensionService = app(App\Services\TensionTableService::class);
    
    $spectrumData = $master->latestResult ? $master->latestResult->spectrumData : collect();
    $spectrumAnalysis = $master->latestResult ? $spectrumService->analyzeSpectrum($master->latestResult) : null;
    $tensionTables = $master->tensionTables;
    $tableVersions = $tensionService->getTableVersions($master, '标准调校表');
    
    $view = view('drum-tuning.show', compact('master', 'spectrumData', 'spectrumAnalysis', 'tensionTables', 'tableVersions'));
    $html = $view->render();
    echo "✓ OK (" . strlen($html) . " bytes)\n";
} catch (Exception $e) {
    echo "✗ 错误: " . $e->getMessage() . "\n";
}

echo "3. 比较列表页 (comparison.index)... ";
try {
    $view = view('drum-tuning.comparison-index', [
        'comparisons' => App\Models\TuningComparison::latest()->paginate(10),
        'records' => App\Models\DrumMasterRecord::all(),
    ]);
    $html = $view->render();
    echo "✓ OK (" . strlen($html) . " bytes)\n";
} catch (Exception $e) {
    echo "✗ 错误: " . $e->getMessage() . "\n";
}

echo "4. 比较详情页 (comparison.show)... ";
try {
    $comparisonService = app(App\Services\TuningComparisonService::class);
    $data = $comparisonService->getComparisonWithDetails($comparison);
    $view = view('drum-tuning.comparison-show', $data);
    $html = $view->render();
    echo "✓ OK (" . strlen($html) . " bytes)\n";
} catch (Exception $e) {
    echo "✗ 错误: " . $e->getMessage() . "\n";
}

echo "5. 创建页 (drum-tuning.create)... ";
try {
    $view = view('drum-tuning.create');
    $html = $view->render();
    echo "✓ OK (" . strlen($html) . " bytes)\n";
} catch (Exception $e) {
    echo "✗ 错误: " . $e->getMessage() . "\n";
}

echo "\n6. 验证路由名称...\n";
$routes = [
    'drum-tuning.index',
    'drum-tuning.create',
    'drum-tuning.store',
    'drum-tuning.show',
    'drum-tuning.edit',
    'drum-tuning.update',
    'drum-tuning.tension.add',
    'drum-tuning.result.add',
    'drum-tuning.tension-table.generate',
    'drum-tuning.tension-table.rollback',
    'drum-tuning.tension-table.recalculate',
    'drum-tuning.export',
    'comparison.index',
    'comparison.create',
    'comparison.show',
    'comparison.export',
];

$router = app('router');
$allRoutes = $router->getRoutes();

foreach ($routes as $routeName) {
    try {
        $url = route($routeName, ['id' => 1]);
        echo "   $routeName: ✓ ($url)\n";
    } catch (Exception $e) {
        echo "   $routeName: ✗ (路由不存在)\n";
    }
}

echo "\n7. 验证本地资源文件...\n";
$files = [
    'public/vendor/tailwind.min.js',
    'public/vendor/chart.umd.min.js',
];

foreach ($files as $file) {
    if (file_exists($file)) {
        echo "   $file: ✓ (" . filesize($file) . " bytes)\n";
    } else {
        echo "   $file: ✗ (不存在)\n";
    }
}

echo "\n8. 验证 Laravel 版本... ";
$version = app()->version();
echo "Laravel $version\n";

echo "\n=== 验证完成 ===\n";

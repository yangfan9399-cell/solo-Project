<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== 验证前端资源和图表 ===\n\n";

echo "1. 检查构建文件...\n";
$files = [
    'public/build/app.css',
    'public/build/chart.umd.min.js',
    'public/build/manifest.json',
];

foreach ($files as $file) {
    if (file_exists($file)) {
        echo "   ✓ $file (" . filesize($file) . " bytes)\n";
    } else {
        echo "   ✗ $file 不存在\n";
    }
}

echo "\n2. 检查 package.json 依赖...\n";
$packageJson = json_decode(file_get_contents('package.json'), true);
echo "   Tailwind CSS: " . ($packageJson['devDependencies']['tailwindcss'] ?? 'N/A') . "\n";
echo "   Chart.js: " . ($packageJson['dependencies']['chart.js'] ?? 'N/A') . "\n";
echo "   PostCSS: " . ($packageJson['devDependencies']['postcss'] ?? 'N/A') . "\n";
echo "   Autoprefixer: " . ($packageJson['devDependencies']['autoprefixer'] ?? 'N/A') . "\n";

echo "\n3. 检查 package-lock.json...\n";
if (file_exists('package-lock.json')) {
    echo "   ✓ package-lock.json 存在\n";
} else {
    echo "   ✗ package-lock.json 不存在\n";
}

echo "\n4. 检查 Tailwind 配置...\n";
$tailwindConfig = json_decode(file_get_contents('tailwind.config.js'), true);
$hasDrumColors = isset($tailwindConfig['theme']['extend']['colors']['drum']);
echo "   drum 主题颜色: " . ($hasDrumColors ? '✓ 已配置' : '✗ 未配置') . "\n";

echo "\n5. 测试视图渲染（含图表）...\n";

$master = App\Models\DrumMasterRecord::with(['detailRecords', 'tensionHistoryRecords', 'latestResult.spectrumData', 'tensionTables'])->find(1);
$master2 = App\Models\DrumMasterRecord::with(['detailRecords', 'tensionHistoryRecords', 'latestResult.spectrumData', 'tensionTables'])->find(2);
$master3 = App\Models\DrumMasterRecord::with(['detailRecords', 'tensionHistoryRecords', 'latestResult.spectrumData', 'tensionTables'])->find(3);
$comparison = App\Models\TuningComparison::find(1);

$views = [
    '首页' => ['view' => 'drum-tuning.index', 'data' => [
        'records' => App\Models\DrumMasterRecord::all(),
        'recentComparisons' => App\Models\TuningComparison::latest()->take(5)->get(),
        'stats' => [
            'total' => App\Models\DrumMasterRecord::count(),
            'completed' => App\Models\DrumMasterRecord::where('status', 'completed')->count(),
            'pending' => App\Models\DrumMasterRecord::where('status', 'draft')->count(),
            'comparisons' => App\Models\TuningComparison::count(),
        ],
    ]],
    '详情页1(正常)' => ['view' => 'drum-tuning.show', 'data' => function() use ($master) {
        $spectrumService = app(App\Services\SpectrumAnalysisService::class);
        $tensionService = app(App\Services\TensionTableService::class);
        return [
            'master' => $master,
            'latestResult' => $master->latestResult,
            'spectrumData' => $master->latestResult ? $master->latestResult->spectrumData : collect(),
            'spectrumAnalysis' => $master->latestResult ? $spectrumService->analyzeSpectrum($master->latestResult) : null,
            'tensionTables' => $master->tensionTables,
            'tableVersions' => $tensionService->getTableVersions($master, '标准调校表'),
            'errors' => new \Illuminate\Support\ViewErrorBag(),
        ];
    }],
    '详情页2(频谱异常)' => ['view' => 'drum-tuning.show', 'data' => function() use ($master2) {
        $spectrumService = app(App\Services\SpectrumAnalysisService::class);
        $tensionService = app(App\Services\TensionTableService::class);
        return [
            'master' => $master2,
            'latestResult' => $master2->latestResult,
            'spectrumData' => $master2->latestResult ? $master2->latestResult->spectrumData : collect(),
            'spectrumAnalysis' => $master2->latestResult ? $spectrumService->analyzeSpectrum($master2->latestResult) : null,
            'tensionTables' => $master2->tensionTables,
            'tableVersions' => $tensionService->getTableVersions($master2, '标准调校表'),
            'errors' => new \Illuminate\Support\ViewErrorBag(),
        ];
    }],
    '详情页3(版本回滚)' => ['view' => 'drum-tuning.show', 'data' => function() use ($master3) {
        $spectrumService = app(App\Services\SpectrumAnalysisService::class);
        $tensionService = app(App\Services\TensionTableService::class);
        return [
            'master' => $master3,
            'latestResult' => $master3->latestResult,
            'spectrumData' => $master3->latestResult ? $master3->latestResult->spectrumData : collect(),
            'spectrumAnalysis' => $master3->latestResult ? $spectrumService->analyzeSpectrum($master3->latestResult) : null,
            'tensionTables' => $master3->tensionTables,
            'tableVersions' => $tensionService->getTableVersions($master3, '标准调校表'),
            'errors' => new \Illuminate\Support\ViewErrorBag(),
        ];
    }],
    '比较列表页' => ['view' => 'drum-tuning.comparison-index', 'data' => [
        'comparisons' => App\Models\TuningComparison::latest()->paginate(10),
        'records' => App\Models\DrumMasterRecord::all(),
        'errors' => new \Illuminate\Support\ViewErrorBag(),
    ]],
    '比较详情页' => ['view' => 'drum-tuning.comparison-show', 'data' => function() use ($comparison) {
        $comparisonService = app(App\Services\TuningComparisonService::class);
        return $comparisonService->getComparisonWithDetails($comparison);
    }],
    '创建页' => ['view' => 'drum-tuning.create', 'data' => [
        'errors' => new \Illuminate\Support\ViewErrorBag(),
    ]],
];

foreach ($views as $name => $viewData) {
    try {
        $data = is_callable($viewData['data']) ? $viewData['data']() : $viewData['data'];
        $view = view($viewData['view'], $data);
        $html = $view->render();
        
        $hasTensionCurve = strpos($html, 'tensionChart') !== false;
        $hasSpectrumChart = strpos($html, 'spectrumChart') !== false;
        $hasComparisonChart = strpos($html, 'comparisonChart') !== false;
        $hasDrumColor = strpos($html, 'drum-') !== false;
        $hasBuildCss = strpos($html, 'build/app.css') !== false;
        $hasBuildJs = strpos($html, 'build/chart.umd.min.js') !== false;
        
        echo "   $name: ✓ OK\n";
        echo "     - 长度: " . strlen($html) . " bytes\n";
        echo "     - 张力曲线: " . ($hasTensionCurve ? '✓' : '-') . "\n";
        echo "     - 频谱图: " . ($hasSpectrumChart ? '✓' : '-') . "\n";
        echo "     - 对比图: " . ($hasComparisonChart ? '✓' : '-') . "\n";
        echo "     - drum 色系: " . ($hasDrumColor ? '✓' : '-') . "\n";
        echo "     - build CSS: " . ($hasBuildCss ? '✓' : '-') . "\n";
        echo "     - build JS: " . ($hasBuildJs ? '✓' : '-') . "\n";
        
    } catch (Exception $e) {
        echo "   $name: ✗ 错误\n";
        echo "     " . $e->getMessage() . "\n";
    }
}

echo "\n6. 检查构建的 CSS 包含 drum 颜色...\n";
$cssContent = file_get_contents('public/build/app.css');
$drumColors = ['--color-drum-50', '--color-drum-100', '--color-drum-500', '--color-drum-800', 'text-drum-', 'bg-drum-', 'border-drum-'];
$foundColors = 0;
foreach ($drumColors as $color) {
    if (strpos($cssContent, $color) !== false) {
        $foundColors++;
        echo "   ✓ 包含 $color\n";
    }
}
echo "   共找到 $foundColors/" . count($drumColors) . " 个 drum 颜色标识\n";

echo "\n7. 检查比较创建重定向路由...\n";
try {
    $url = route('comparison.show', 1);
    echo "   comparison.show 路由: $url ✓\n";
} catch (Exception $e) {
    echo "   comparison.show 路由: ✗ " . $e->getMessage() . "\n";
}

echo "\n=== 验证完成 ===\n";

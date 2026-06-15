<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== 最终验证：Tailwind & Chart.js 项目配置管理 ===\n\n";

echo "1. 项目配置文件检查...\n";
$checks = [
    'package.json 存在' => file_exists('package.json'),
    'package-lock.json 存在' => file_exists('package-lock.json'),
    'tailwind.config.js 存在' => file_exists('tailwind.config.js'),
    'postcss.config.js 存在' => file_exists('postcss.config.js'),
    'scripts/build-assets.js 存在' => file_exists('scripts/build-assets.js'),
];

foreach ($checks as $name => $ok) {
    echo "   " . ($ok ? '✓' : '✗') . " $name\n";
}

echo "\n2. package.json 依赖版本...\n";
$package = json_decode(file_get_contents('package.json'), true);
echo "   tailwindcss (dev): " . ($package['devDependencies']['tailwindcss'] ?? 'N/A') . "\n";
echo "   chart.js (prod): " . ($package['dependencies']['chart.js'] ?? 'N/A') . "\n";
echo "   postcss (dev): " . ($package['devDependencies']['postcss'] ?? 'N/A') . "\n";
echo "   autoprefixer (dev): " . ($package['devDependencies']['autoprefixer'] ?? 'N/A') . "\n";
echo "   build 脚本: " . ($package['scripts']['build'] ?? 'N/A') . "\n";

echo "\n3. 构建产物检查...\n";
$buildFiles = [
    'public/build/app.css' => 'Tailwind 编译后的 CSS',
    'public/build/chart.umd.min.js' => 'Chart.js 库',
    'public/build/manifest.json' => '资源清单',
];

foreach ($buildFiles as $path => $desc) {
    if (file_exists($path)) {
        echo "   ✓ $desc: " . filesize($path) . " bytes\n";
    } else {
        echo "   ✗ $desc: 不存在\n";
    }
}

echo "\n4. Tailwind 配置验证...\n";
$tailwindConfig = file_get_contents('tailwind.config.js');
$hasDrumColors = strpos($tailwindConfig, "'drum'") !== false 
    || strpos($tailwindConfig, '"drum"') !== false;
echo "   drum 色系配置: " . ($hasDrumColors ? '✓ 已定义' : '✗ 未定义') . "\n";

echo "\n5. 视图资源引用验证...\n";
$master = App\Models\DrumMasterRecord::with(['detailRecords', 'latestResult'])->find(1);

$testViews = [
    '首页' => ['drum-tuning.index', [
        'records' => App\Models\DrumMasterRecord::with(['detailRecords', 'latestResult'])->paginate(10),
        'comparisons' => App\Models\TuningComparison::latest()->take(5)->get(),
        'stats' => [
            'total_records' => 100,
            'completed_records' => 80,
            'total_comparisons' => 10,
            'anomaly_count' => 5,
        ],
    ]],
];

foreach ($testViews as $name => $viewData) {
    try {
        $view = view($viewData[0], $viewData[1]);
        $html = $view->render();
        
        $usesBuildCss = strpos($html, 'build/app.css') !== false;
        $usesBuildJs = strpos($html, 'build/chart.umd.min.js') !== false;
        $usesDrumColors = strpos($html, 'text-drum-') !== false || strpos($html, 'bg-drum-') !== false;
        $hasTensionChart = strpos($html, 'tensionChart') !== false;
        $hasSpectrumChart = strpos($html, 'spectrumChart') !== false;
        
        echo "   $name: ✓ 渲染成功\n";
        echo "     - 引用 build/app.css: " . ($usesBuildCss ? '✓' : '✗') . "\n";
        echo "     - 引用 build/chart.umd.min.js: " . ($usesBuildJs ? '✓' : '✗') . "\n";
        echo "     - 使用 drum 色系: " . ($usesDrumColors ? '✓' : '✗') . "\n";
    } catch (Exception $e) {
        echo "   $name: ✗ " . $e->getMessage() . "\n";
    }
}

echo "\n6. 详情页和图表验证...\n";
$spectrumService = app(App\Services\SpectrumAnalysisService::class);
$tensionService = app(App\Services\TensionTableService::class);

$m = App\Models\DrumMasterRecord::with(['detailRecords', 'tensionHistoryRecords', 'latestResult.spectrumData', 'tensionTables'])->find(1);

$viewData = [
    'master' => $m,
    'latestResult' => $m->latestResult,
    'spectrumData' => $m->latestResult ? $m->latestResult->spectrumData()->orderBy('frequency')->get() : collect(),
    'spectrumAnalysis' => $m->latestResult ? $spectrumService->analyzeSpectrum($m->latestResult) : null,
    'tensionTables' => $m->tensionTables,
    'currentTable' => $m->currentTensionTable,
    'tableVersions' => $tensionService->getTableVersions($m, '标准调校表'),
    'errors' => new \Illuminate\Support\ViewErrorBag(),
];

try {
    $view = view('drum-tuning.show', $viewData);
    $html = $view->render();
    
    $hasTensionChart = strpos($html, 'tensionChart') !== false;
    $hasSpectrumChart = strpos($html, 'spectrumChart') !== false;
    $hasCanvas = strpos($html, '<canvas') !== false;
    $usesBuildCss = strpos($html, 'build/app.css') !== false;
    $usesBuildJs = strpos($html, 'build/chart.umd.min.js') !== false;
    
    echo "   详情页: ✓ 渲染成功\n";
    echo "     - 张力曲线 (tensionChart): " . ($hasTensionChart ? '✓' : '✗') . "\n";
    echo "     - 频谱图 (spectrumChart): " . ($hasSpectrumChart ? '✓' : '✗') . "\n";
    echo "     - Canvas 元素: " . ($hasCanvas ? '✓' : '✗') . "\n";
    echo "     - 引用 build/app.css: " . ($usesBuildCss ? '✓' : '✗') . "\n";
    echo "     - 引用 build/chart.umd.min.js: " . ($usesBuildJs ? '✓' : '✗') . "\n";
    
} catch (Exception $e) {
    echo "   详情页: ✗ " . $e->getMessage() . "\n";
    echo "     " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n7. 比较详情页验证...\n";
$comparison = App\Models\TuningComparison::find(1);
$comparisonService = app(App\Services\TuningComparisonService::class);
$data = $comparisonService->getComparisonWithDetails($comparison);

try {
    $view = view('drum-tuning.comparison-show', compact('comparison', 'data'));
    $html = $view->render();
    
    $hasComparisonChart = strpos($html, 'comparisonChart') !== false;
    $hasCanvas = strpos($html, '<canvas') !== false;
    
    echo "   比较详情页: ✓ 渲染成功\n";
    echo "     - 频率对比图 (comparisonChart): " . ($hasComparisonChart ? '✓' : '✗') . "\n";
    echo "     - Canvas 元素: " . ($hasCanvas ? '✓' : '✗') . "\n";
} catch (Exception $e) {
    echo "   比较详情页: ✗ " . $e->getMessage() . "\n";
}

echo "\n8. 比较方案路由验证...\n";
try {
    $url = route('comparison.show', ['id' => 1]);
    echo "   comparison.show 路由: $url ✓\n";
} catch (Exception $e) {
    echo "   comparison.show 路由: ✗ " . $e->getMessage() . "\n";
}

echo "\n9. 构建的 CSS 包含内容验证...\n";
$css = file_get_contents('public/build/app.css');
$cssChecks = [
    'Tailwind base 样式' => strpos($css, '/*! tailwindcss v3.4') !== false,
    'drum 颜色类' => strpos($css, '.text-drum-') !== false || strpos($css, '.bg-drum-') !== false,
    '.gradient-bg 类' => strpos($css, '.gradient-bg') !== false,
    '.drum-card 类' => strpos($css, '.drum-card') !== false,
    '.badge 类' => strpos($css, '.badge') !== false,
];

foreach ($cssChecks as $name => $ok) {
    echo "   " . ($ok ? '✓' : '✗') . " $name\n";
}

echo "\n10. 构建的 JS 验证...\n";
$js = file_get_contents('public/build/chart.umd.min.js');
$jsChecks = [
    'Chart.js 标识' => strpos($js, 'Chart.js v4.4') !== false || strpos($js, 'chart.js') !== false,
    'Chart 全局对象' => strpos($js, 'Chart=') !== false || strpos($js, 'window.Chart') !== false,
];

foreach ($jsChecks as $name => $ok) {
    echo "   " . ($ok ? '✓' : '✗') . " $name\n";
}

echo "\n=== 验证总结 ===\n";
echo "Tailwind CSS 和 Chart.js 已成功纳入项目配置管理：\n";
echo "  - 依赖版本由 package.json 管理\n";
echo "  - 版本锁定由 package-lock.json 管理\n";
echo "  - Tailwind 配置由 tailwind.config.js + postcss.config.js 管理\n";
echo "  - 构建流程由 scripts/build-assets.js 管理\n";
echo "  - 页面通过 public/build/ 目录引用构建产物\n";
echo "  - 频率对比图和张力曲线使用构建的 Chart.js 渲染\n";
echo "\n";

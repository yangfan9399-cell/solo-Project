<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== 功能验证测试 ===\n\n";

$exportService = app(App\Services\ExportService::class);

echo "1. 测试导出服务...\n";
$master = App\Models\DrumMasterRecord::find(1);
$csv = $exportService->exportRecordToCsv($master);
echo "   记录导出 CSV 长度: " . strlen($csv) . " bytes\n";

$comparison = App\Models\TuningComparison::find(1);
$csv2 = $exportService->exportComparisonToCsv($comparison);
echo "   比较导出 CSV 长度: " . strlen($csv2) . " bytes\n";

echo "\n2. 测试频谱分析服务...\n";
$spectrumService = app(App\Services\SpectrumAnalysisService::class);
$result = $master->latestResult;
$analysis = $spectrumService->analyzeSpectrum($result);
echo "   基频: " . ($analysis['fundamental_freq'] ?? 'N/A') . " Hz\n";
echo "   谐波数: " . ($analysis['harmonic_count'] ?? 'N/A') . "\n";
echo "   频谱质心: " . ($analysis['spectral_centroid'] ?? 'N/A') . " Hz\n";
echo "   异常: " . ($analysis['has_anomaly'] ? '是' : '否') . "\n";

echo "\n3. 测试张力表服务...\n";
$tensionService = app(App\Services\TensionTableService::class);
$freq = $tensionService->calculateFrequency(300, 14, '牛皮');
echo "   300N 张力 / 14\" 鼓 / 牛皮 = " . $freq . " Hz\n";

$tension = $tensionService->calculateTension(220, 14, '牛皮');
echo "   220Hz 频率 / 14\" 鼓 / 牛皮 = " . $tension . " N\n";

$versions = $tensionService->getTableVersions($master, '标准调校表');
echo "   张力表版本: " . implode(', ', $versions) . "\n";

echo "\n4. 测试比较服务...\n";
$comparisonService = app(App\Services\TuningComparisonService::class);
$result2 = $comparisonService->getComparisonWithDetails($comparison);
echo "   比较方案: " . $comparison->comparison_name . "\n";
echo "   推荐方案: " . ($comparison->recommended_scheme ?? 'N/A') . "\n";
echo "   参与记录数: " . count($result2['master_records']) . "\n";

echo "\n5. 测试三个种子样本...\n";
$samples = [
    1 => 'DRUM-2024-001 (比较调校方案正常完成)',
    2 => 'DRUM-2024-002 (需要频谱触发异常)',
    3 => 'DRUM-2024-003 (张力表需要回滚或重算)',
];

foreach ($samples as $id => $name) {
    $m = App\Models\DrumMasterRecord::find($id);
    $hasAnomaly = $m->latestResult?->spectrum_anomaly ?? false;
    $tensionTableCount = $m->tensionTables()->count();
    $hasRollback = $m->tensionTables()->where('is_rollback', true)->exists();
    
    echo "   {$name}:\n";
    echo "     - 状态: {$m->status}\n";
    echo "     - 频谱异常: " . ($hasAnomaly ? '是' : '否') . "\n";
    echo "     - 张力表行数: {$tensionTableCount}\n";
    echo "     - 有回滚记录: " . ($hasRollback ? '是' : '否') . "\n";
}

echo "\n=== 所有功能验证完成 ===\n";

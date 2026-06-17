<?php
function checkPage($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $size = curl_getinfo($ch, CURLINFO_SIZE_DOWNLOAD);
    curl_close($ch);
    return [$code, $size];
}

$base = 'http://127.0.0.1:8000';
$paths = ['/', '/plates', '/plates/1', '/plates/1/edit', '/plates/create', 
          '/plates/1/versions', '/plates/1/compare', '/review', '/plates/export'];

echo "=== 全页面 HTTP 验证 ===\n";
foreach ($paths as $path) {
    list($code, $size) = checkPage($base . $path);
    echo "$code  " . str_pad($size, 7) . "  $path\n";
}

echo "\n=== 关键字检查 ===\n";
$checks = [
    ['/plates/1', '流程操作', '详情页状态流转区'],
    ['/plates/1', '提交审批', '审批按钮'],
    ['/plates/1', '申请归档', '归档按钮'],
    ['/plates/1/edit', '_lock_updated_at', '编辑页冲突锁'],
    ['/plates/1/compare', '选择两个版本', '版本对比页'],
    ['/review', '全库状态分布', '复盘聚合页'],
    ['/', '复盘聚合', '导航栏入口'],
];

foreach ($checks as $c) {
    $html = file_get_contents($base . $c[0]);
    $found = strpos($html, $c[1]) !== false ? '✓' : '✗';
    echo "$found  $c[2] ($c[0])\n";
}

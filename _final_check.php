<?php
$base = 'http://127.0.0.1:8000';
$checks = [
    ['/', '工作台', '复盘聚合'],
    ['/plates/1', '详情页', '流程操作'],
    ['/plates/1', '详情页', '提交审批'],
    ['/plates/1', '详情页', '申请归档'],
    ['/plates/1', '详情页', '版本对比'],
    ['/plates/1/edit', '编辑页', '_lock_updated_at'],
    ['/plates/1/edit', '编辑页', '版本锁定'],
    ['/plates/1/compare', '对比页', '选择两个版本'],
    ['/review', '复盘页', '全库状态分布'],
];
echo "=== 最终功能验证 ===\n\n";
$allOk = true;
foreach($checks as $c) {
    $ctx = stream_context_create(['http' => ['timeout' => 5]]);
    $r = @file_get_contents($base.$c[0], false, $ctx);
    $ok = $r !== false && strpos($r, $c[2]) !== false;
    if (!$ok) $allOk = false;
    echo ($ok ? '✅' : '❌') . "  $c[1] - $c[2]\n";
}
echo "\n=== " . ($allOk ? '所有核心功能验证通过' : '存在功能缺失') . " ===\n";

<?php
$paths = ['/', '/plates', '/plates/1', '/plates/1/edit', '/plates/create', 
          '/plates/1/versions', '/plates/1/compare', '/review', '/plates/export'];
$base = 'http://127.0.0.1:8000';

echo "=== 验证开始 ===\n\n";
foreach($paths as $p) {
    $ctx = stream_context_create(['http' => ['timeout' => 5]]);
    $r = @file_get_contents($base.$p, false, $ctx);
    $code = $r === false ? '500' : '200';
    $len = $r === false ? 0 : strlen($r);
    echo "$code  " . str_pad($len, 6) . "  $p\n";
    
    if ($r !== false && $p === '/plates/1') {
        echo "  流程操作: " . (strpos($r, '流程操作') !== false ? '✓' : '✗') . "\n";
        echo "  提交审批: " . (strpos($r, '提交审批') !== false ? '✓' : '✗') . "\n";
        echo "  申请归档: " . (strpos($r, '申请归档') !== false ? '✓' : '✗') . "\n";
        echo "  版本对比: " . (strpos($r, '版本对比') !== false ? '✓' : '✗') . "\n";
    }
    if ($r !== false && $p === '/plates/1/edit') {
        echo "  冲突锁字段: " . (strpos($r, '_lock_updated_at') !== false ? '✓' : '✗') . "\n";
        echo "  冲突警告区: " . (strpos($r, '版本冲突') !== false ? '✓' : '✗') . "\n";
    }
    if ($r !== false && $p === '/review') {
        echo "  全库状态分布: " . (strpos($r, '全库状态分布') !== false ? '✓' : '✗') . "\n";
        echo "  变更类型分布: " . (strpos($r, '变更类型分布') !== false ? '✓' : '✗') . "\n";
    }
    if ($r !== false && $p === '/') {
        echo "  导航栏复盘聚合: " . (strpos($r, '复盘聚合') !== false ? '✓' : '✗') . "\n";
    }
}
echo "\n=== 验证完成 ===\n";

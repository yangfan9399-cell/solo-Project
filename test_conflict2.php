<?php
$base = 'http://127.0.0.1:8000';

echo "=== 测试版本冲突阻断功能 ===\n\n";

echo "步骤 1: 获取编辑页，拿到 _lock_updated_at\n";
$ch = curl_init($base . '/plates/1/edit');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEJAR, '/tmp/cookies_test.txt');
curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/cookies_test.txt');
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$html = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);

if ($err) {
    die("curl 错误: $err\n");
}

if (!preg_match('/name="_token" value="([^"]+)"/', $html, $m)) {
    die("无法获取 CSRF token\n");
}
$token = $m[1];

if (!preg_match('/name="_lock_updated_at" value="([^"]+)"/', $html, $m)) {
    die("无法获取 lock_updated_at\n");
}
$lockTime = $m[1];

echo "  ✅ 锁定时间: $lockTime\n";
echo "  ✅ CSRF Token: " . substr($token, 0, 20) . "...\n\n";

echo "步骤 2: 模拟另一个用户先修改了这条记录（更新 updated_at）\n";
$pdo = new PDO('sqlite:' . __DIR__ . '/database/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $pdo->query("SELECT updated_at FROM plates WHERE id = 1");
$origUpdated = $stmt->fetchColumn();
echo "  原 updated_at: $origUpdated\n";

$newTime = date('Y-m-d H:i:s', strtotime($lockTime) + 60);
$pdo->exec("UPDATE plates SET updated_at = '$newTime' WHERE id = 1");
echo "  ✅ 模拟更新后的 updated_at: $newTime\n\n";

echo "步骤 3: 提交旧版本数据，期望触发冲突阻断\n";
$postData = [
    '_token' => $token,
    '_method' => 'PUT',
    '_lock_updated_at' => $lockTime,
    'plate_code' => 'T-TEST-001',
    'material' => '铜版',
    'size' => '100x50mm',
    'pattern' => '测试图案',
    'usage_count' => 100,
    'max_usage' => 500,
    'location' => 'A-01',
    'status' => '正常',
    'operator' => '测试冲突',
    'change_reason' => '测试版本冲突阻断',
];

$ch = curl_init($base . '/plates/1');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_COOKIEJAR, '/tmp/cookies_test.txt');
curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/cookies_test.txt');
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_HEADER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

if ($err) {
    echo "  curl 错误: $err\n";
}

echo "  HTTP 状态码: $httpCode\n";
echo "  响应长度: " . strlen($response) . "\n";

$hasConflict = strpos($response, 'conflict_warning') !== false || strpos($response, '版本冲突') !== false;
echo "  检测到冲突阻断: " . ($hasConflict ? '✅ 是' : '❌ 否') . "\n";

if ($hasConflict && preg_match('/conflict_warning.*?value=&quot;([^&]+)&quot;/', $response, $m)) {
    echo "  冲突提示: " . html_entity_decode($m[1]) . "\n";
}

if (!$hasConflict) {
    echo "\n  响应前 500 字符:\n";
    echo "  " . substr($response, 0, 500) . "\n";
}

echo "\n步骤 4: 恢复数据\n";
$pdo->exec("UPDATE plates SET updated_at = '$origUpdated' WHERE id = 1");
echo "  ✅ 已恢复 updated_at 为: $origUpdated\n\n";

echo "=== 测试完成 ===\n";

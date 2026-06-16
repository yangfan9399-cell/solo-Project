<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = App\Models\User::first();
Auth::login($user);

echo "=== 前端页面与 API 渲染测试 ===\n\n";
$allPass = true;

// 1. 测试 Dashboard 页面
echo "1. Dashboard 页面... ";
try {
    $response = app()->handle(Illuminate\Http\Request::create('/dashboard', 'GET'));
    $status = $response->getStatusCode();
    echo $status === 200 ? "PASS (HTTP $status)\n" : "FAIL (HTTP $status)\n";
    if ($status !== 200) $allPass = false;
} catch (\Exception $e) {
    echo "FAIL: " . $e->getMessage() . "\n";
    $allPass = false;
}

// 2. 启动一个凯撒关卡的游戏，然后测试游戏页面
echo "2. 游戏页面 (凯撒关卡)... ";
try {
    $caesarLevel = App\Models\Level::where('cipher_type', 'caesar')->first();
    $session = App\Models\GameSession::create([
        'user_id' => $user->id,
        'level_id' => $caesarLevel->id,
        'player_profile_id' => $user->profiles()->first()->id,
        'status' => 'in_progress',
        'rotor_positions' => null,
        'substitution_table' => [],
        'partial_solution' => '',
        'metadata' => ['caesar_shift' => 0, 'vigenere_key' => ''],
        'started_at' => now(),
    ]);
    $response = app()->handle(Illuminate\Http\Request::create("/game/{$session->id}", 'GET'));
    $status = $response->getStatusCode();
    $content = $response->getContent();
    echo $status === 200 ? "PASS (HTTP $status)\n" : "FAIL (HTTP $status)\n";
    if ($status !== 200) {
        echo "   错误片段: " . substr(strip_tags($content), 0, 200) . "\n";
        $allPass = false;
    }
    // 检查是否包含"凯撒偏移设置"文字
    if (strpos($content, '凯撒偏移设置') !== false) {
        echo "   ✅ 包含凯撒解题面板\n";
    } else {
        echo "   ⚠️  未找到凯撒解题面板（可能是布局问题）\n";
    }
} catch (\Exception $e) {
    echo "FAIL: " . $e->getMessage() . "\n";
    $allPass = false;
}

// 3. 测试自定义谜题创建页面
echo "3. 自定义谜题创建页面... ";
try {
    $response = app()->handle(Illuminate\Http\Request::create('/custom-levels/create', 'GET'));
    $status = $response->getStatusCode();
    $content = $response->getContent();
    echo $status === 200 ? "PASS (HTTP $status)\n" : "FAIL (HTTP $status)\n";
    if ($status !== 200) {
        echo "   错误: " . substr(strip_tags($content), 0, 200) . "\n";
        $allPass = false;
    }
} catch (\Exception $e) {
    echo "FAIL: " . $e->getMessage() . "\n";
    $allPass = false;
}

// 4. 测试自定义谜题加密预览 API
echo "4. 自定义谜题加密预览 API (凯撒类型)... ";
try {
    $request = Illuminate\Http\Request::create('/custom-levels/encrypt', 'POST', [], [], [], [
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
    ]);
    $request->merge([
        'cipher_type' => 'caesar',
        'plaintext' => 'HELLO WORLD',
        'caesar_shift' => 3,
    ]);
    $response = app()->handle($request);
    $status = $response->getStatusCode();
    $data = json_decode($response->getContent(), true);
    echo $status === 200 && ($data['success'] ?? false) ? "PASS (HTTP $status)\n" : "FAIL (HTTP $status)\n";
    if ($data['success'] ?? false) {
        echo "   明文: {$data['plaintext']}\n";
        echo "   密文: {$data['ciphertext']}\n";
    } else {
        echo "   响应: " . $response->getContent() . "\n";
        $allPass = false;
    }
} catch (\Exception $e) {
    echo "FAIL: " . $e->getMessage() . "\n";
    $allPass = false;
}

// 5. 测试转轮类型的自定义加密预览
echo "5. 自定义谜题加密预览 API (转轮类型)... ";
try {
    $request = Illuminate\Http\Request::create('/custom-levels/encrypt', 'POST', [], [], [], [
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
    ]);
    $request->merge([
        'cipher_type' => 'rotor',
        'plaintext' => 'TEST MESSAGE',
        'rotor_count' => 2,
        'rotor_seed' => 42,
        'rotor_target_positions' => '5,13',
    ]);
    $response = app()->handle($request);
    $status = $response->getStatusCode();
    $data = json_decode($response->getContent(), true);
    echo $status === 200 && ($data['success'] ?? false) ? "PASS (HTTP $status)\n" : "FAIL (HTTP $status)\n";
    if ($data['success'] ?? false) {
        echo "   密文: " . substr($data['ciphertext'], 0, 30) . "...\n";
        echo "   频率分析条目: " . count($data['frequency_analysis'] ?? []) . "\n";
    } else {
        echo "   响应: " . substr($response->getContent(), 0, 300) . "\n";
        $allPass = false;
    }
} catch (\Exception $e) {
    echo "FAIL: " . $e->getMessage() . "\n";
    $allPass = false;
}

echo "\n=== 综合结果 ===\n";
echo "全部通过: " . ($allPass ? 'YES ✅' : 'NO ❌') . "\n";

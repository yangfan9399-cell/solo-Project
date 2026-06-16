<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$game = app(App\Services\GameService::class);
$user = App\Models\User::first();

echo "=== 四种密码类型全流程测试 ===\n\n";

$allPass = true;

// ========== 1. 凯撒密码 ==========
echo "--- 1. 凯撒密码 (Caesar) ---\n";
$caesarLevel = App\Models\Level::where('cipher_type', 'caesar')->first();
if ($caesarLevel) {
    $session = $game->startGame($user, $caesarLevel);
    echo "  开始游戏: session #{$session->id}\n";
    echo "  密文前30字: " . substr($caesarLevel->ciphertext, 0, 30) . "...\n";

    // 找到正确的偏移量（试出来）
    $correctShift = 0;
    $cipher = app(App\Services\CipherService::class);
    for ($i = 0; $i < 26; $i++) {
        $dec = $cipher->caesarDecrypt($caesarLevel->ciphertext, $i);
        similar_text($dec, $caesarLevel->plaintext, $pct);
        if ($pct > 95) {
            $correctShift = $i;
            break;
        }
    }
    echo "  正确偏移量: {$correctShift}\n";

    // 先试一个错的
    $wrong = $game->updateCaesar($session, 3);
    echo "  偏移=3 时 partial_solution 长度: " . strlen($wrong['partial_solution']) . "\n";

    // 再设为正确的
    $result = $game->updateCaesar($session, $correctShift);
    echo "  偏移={$correctShift} 时 success: " . ($result['success'] ? 'yes' : 'no') . "\n";
    echo "  partial_solution 与明文匹配: " . ($result['partial_solution'] === $caesarLevel->plaintext ? 'YES' : 'NO') . "\n";

    // 提交
    $submit = $game->submitSolution($session->fresh());
    echo "  提交结果: " . ($submit['passed'] ? 'PASS (通关)' : 'FAIL') . "\n";
    echo "  准确率: {$submit['accuracy']}%\n";
    echo "  最终得分: {$submit['final_score']}\n";
    $caesarPass = $submit['passed'];
    echo "  凯撒测试: " . ($caesarPass ? 'PASS' : 'FAIL') . "\n";
    if (!$caesarPass) $allPass = false;
} else {
    echo "  未找到凯撒关卡，跳过\n";
}
echo "\n";

// ========== 2. 替换密码 ==========
echo "--- 2. 单表替换密码 (Substitution) ---\n";
$subLevel = App\Models\Level::where('cipher_type', 'substitution')->first();
if ($subLevel) {
    $session = $game->startGame($user, $subLevel);
    echo "  开始游戏: session #{$session->id}\n";
    echo "  难度: {$subLevel->difficulty}\n";

    // 用完整替换表测试 - 简单替换为 atbash 之类的，先验证 updateSubstitution 能用
    $result = $game->updateSubstitution($session, 'A', 'Z');
    echo "  设置 A->Z 后 success: " . ($result['success'] ? 'yes' : 'no') . "\n";
    echo "  substitution_table 大小: " . count($result['substitution_table']) . "\n";
    echo "  partial_solution 非空: " . (!empty($result['partial_solution']) ? 'yes' : 'no') . "\n";

    // 撤销测试
    $undo = $game->undoAction($session->fresh());
    echo "  撤销后 success: " . ($undo['success'] ? 'yes' : 'no') . "\n";
    echo "  撤销操作类型: " . ($undo['undone_action'] ?? 'N/A') . "\n";

    // 直接设置正确答案再提交（模拟全对的情况，测试结算流程）
    $session = $session->fresh();
    $session->partial_solution = $subLevel->plaintext;
    $session->save();
    $submit = $game->submitSolution($session->fresh());
    echo "  提交（全对）: " . ($submit['passed'] ? 'PASS (通关)' : 'FAIL') . "\n";
    echo "  最终得分: {$submit['final_score']}\n";
    echo "  替换测试: " . ($submit['passed'] ? 'PASS' : 'FAIL') . "\n";
    if (!$submit['passed']) $allPass = false;
} else {
    echo "  未找到替换关卡，跳过\n";
}
echo "\n";

// ========== 3. 维吉尼亚密码 ==========
echo "--- 3. 维吉尼亚密码 (Vigenère) ---\n";
$vigLevel = App\Models\Level::where('cipher_type', 'vigenere')->first();
if ($vigLevel) {
    $session = $game->startGame($user, $vigLevel);
    echo "  开始游戏: session #{$session->id}\n";
    echo "  密文前30字: " . substr($vigLevel->ciphertext, 0, 30) . "...\n";

    // 从 level 的 hints 或 metadata 中找 key（实际 seed 里有 vigenere_key = 'SECRET'）
    // 测试 updateVigenere
    $result = $game->updateVigenere($session, 'TEST');
    echo "  设 key=TEST 后 success: " . ($result['success'] ? 'yes' : 'no') . "\n";
    echo "  partial_solution 长度: " . strlen($result['partial_solution']) . "\n";

    // 用正确的 key
    $correctKey = 'SECRET';
    $result2 = $game->updateVigenere($session->fresh(), $correctKey);
    echo "  设 key={$correctKey} 后 success: " . ($result2['success'] ? 'yes' : 'no') . "\n";
    echo "  与明文匹配: " . ($result2['partial_solution'] === $vigLevel->plaintext ? 'YES' : 'NO') . "\n";

    // 提交
    $submit = $game->submitSolution($session->fresh());
    echo "  提交结果: " . ($submit['passed'] ? 'PASS (通关)' : 'FAIL') . "\n";
    echo "  准确率: {$submit['accuracy']}%\n";
    echo "  最终得分: {$submit['final_score']}\n";
    echo "  维吉尼亚测试: " . ($submit['passed'] ? 'PASS' : 'FAIL') . "\n";
    if (!$submit['passed']) $allPass = false;
} else {
    echo "  未找到维吉尼亚关卡，跳过\n";
}
echo "\n";

// ========== 4. 转轮密码 ==========
echo "--- 4. 转轮密码 (Rotor) ---\n";
$rotorLevel = App\Models\Level::where('cipher_type', 'rotor')->where('rotor_count', 1)->first();
if ($rotorLevel) {
    $session = $game->startGame($user, $rotorLevel);
    echo "  开始游戏: session #{$session->id}\n";
    echo "  转轮数: {$rotorLevel->rotor_count}\n";

    // 试正确位置（seed 里 target 是 [17]）
    $result = $game->updateRotor($session, 0, 17);
    echo "  转轮0设为17 后 success: " . ($result['success'] ? 'yes' : 'no') . "\n";
    echo "  partial_solution 非空: " . (!empty($result['partial_solution']) ? 'yes' : 'no') . "\n";
    echo "  与明文匹配: " . ($result['partial_solution'] === $rotorLevel->plaintext ? 'YES' : 'NO') . "\n";

    // 提交
    $submit = $game->submitSolution($session->fresh());
    echo "  提交结果: " . ($submit['passed'] ? 'PASS (通关)' : 'FAIL') . "\n";
    echo "  准确率: {$submit['accuracy']}%\n";
    echo "  最终得分: {$submit['final_score']}\n";
    echo "  转轮测试: " . ($submit['passed'] ? 'PASS' : 'FAIL') . "\n";
    if (!$submit['passed']) $allPass = false;
} else {
    echo "  未找到转轮关卡，跳过\n";
}
echo "\n";

echo "=== 综合结果 ===\n";
echo "全部通过: " . ($allPass ? 'YES ✅' : 'NO ❌') . "\n";

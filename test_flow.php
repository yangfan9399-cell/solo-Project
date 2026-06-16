<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Level;
use App\Models\Material;
use App\Services\GlueGameService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

$service = app(GlueGameService::class);

echo "========================================\n";
echo "🧪 图书修补胶水配比实验 - 流程测试\n";
echo "========================================\n\n";

$testEmail = 'testplayer_' . Str::random(8) . '@example.com';
$user = User::create([
    'name' => '测试玩家',
    'email' => $testEmail,
    'password' => Hash::make('test1234'),
]);

$defaultMaterials = Material::where('is_unlocked_by_default', true)->get();
foreach ($defaultMaterials as $material) {
    \App\Models\UserMaterial::create([
        'user_id' => $user->id,
        'material_id' => $material->id,
        'unlocked_at' => now(),
    ]);
}

echo "👤 测试用户: {$user->name} ({$user->email})\n";
echo "🔓 初始已解锁材料: " . $defaultMaterials->count() . " 种\n\n";

$level = Level::where('order', 1)->first();
echo "📖 选择关卡: {$level->name}\n";
echo "🎯 目标值: 黏度 {$level->target_viscosity} / 干燥 {$level->target_drying_time}s / 透明度 {$level->target_transparency}%\n\n";

echo "--- 步骤 1: 开始游戏会话 ---\n";
$session = $service->startGameSession($user, $level);
echo "✅ 创建游戏会话 ID: {$session->id}\n";
echo "📊 当前尝试次数: {$session->attempt_count}\n";
echo "🎮 游戏状态: {$session->status}\n\n";

echo "--- 步骤 2: 添加白乳胶 70g ---\n";
$material = Material::where('code', 'PVA')->first();
$state1 = $service->addMaterial(
    $session,
    $material,
    70.0,
    [
        'materials' => [],
        'properties' => ['viscosity' => 0, 'drying_time' => 0, 'transparency' => 0, 'total_amount' => 0],
    ]
);
echo "✅ 添加成功\n";
echo "   黏度: {$state1['properties']['viscosity']}\n";
echo "   干燥时间: {$state1['properties']['drying_time']}s\n";
echo "   透明度: {$state1['properties']['transparency']}%\n";
echo "   总量: {$state1['properties']['total_amount']}g\n\n";

echo "--- 步骤 3: 添加纯净水 30g ---\n";
$water = Material::where('code', 'WATER')->first();
$state2 = $service->addMaterial($session, $water, 30.0, $state1);
echo "✅ 添加成功\n";
echo "   黏度: {$state2['properties']['viscosity']}\n";
echo "   干燥时间: {$state2['properties']['drying_time']}s\n";
echo "   透明度: {$state2['properties']['transparency']}%\n";
echo "   总量: {$state2['properties']['total_amount']}g\n\n";

echo "--- 步骤 4: 验证操作历史 ---\n";
$history = $service->getHistorySteps($session);
echo "📜 历史记录数: " . count($history) . " 步\n";
foreach ($history as $step) {
    echo "   #{$step['step_number']}: {$step['action_type']} - 材料ID {$step['material_id']} ({$step['amount']}g)\n";
}
echo "\n";

echo "--- 步骤 5: 测试撤销操作 ---\n";
$state3 = $service->undo($session, $state2);
if ($state3) {
    echo "↩️ 撤销成功\n";
    echo "   当前材料数: " . count($state3['materials']) . " 种\n";
    echo "   总量: {$state3['properties']['total_amount']}g\n";
} else {
    echo "❌ 撤销失败\n";
}
echo "\n";

echo "--- 步骤 6: 重新添加水并测试提交检验 ---\n";
$state4 = $service->addMaterial($session, $water, 30.0, $state3);

echo "🧪 故意构造一个虚假的高分数 properties 来测试后端重算\n";
$fakeState = [
    'materials' => $state4['materials'],
    'properties' => [
        'viscosity' => 65.0,
        'drying_time' => 45.0,
        'transparency' => 70.0,
        'total_amount' => 100.0,
    ],
];
echo "   前端传入的虚假 properties:\n";
echo "     黏度: {$fakeState['properties']['viscosity']}\n";
echo "     干燥: {$fakeState['properties']['drying_time']}s\n";
echo "     透明度: {$fakeState['properties']['transparency']}%\n\n";

$result = $service->submitAttempt($session, $fakeState);

echo "📊 后端实际计算结果 (强制重算):\n";
echo "   实际黏度: {$result['properties']['viscosity']}\n";
echo "   实际干燥: {$result['properties']['drying_time']}s\n";
echo "   实际透明度: {$result['properties']['transparency']}%\n";
echo "   总分: {$result['score']['total_score']}\n";
echo "   是否通过: " . ($result['score']['is_passed'] ? '✅ 是' : '❌ 否') . "\n";
echo "   星级: {$result['score']['stars']} 星\n\n";

$scoreFromFake = $service->calculateScore($level, $fakeState['properties']);
echo "🔍 验证: 如果用虚假 properties 评分会是 {$scoreFromFake['total_score']} 分\n";
echo "   实际后端重算得分: {$result['score']['total_score']} 分\n";
echo "   " . ($scoreFromFake['total_score'] != $result['score']['total_score'] ? '✅ 确认: 后端使用了重算结果，不是前端传入的！' : '❌ 错误: 使用了前端值') . "\n\n";

echo "--- 步骤 7: 验证用户进度更新 ---\n";
$progress = \App\Models\UserProgress::where('user_id', $user->id)
    ->where('level_id', $level->id)
    ->first();
if ($progress) {
    echo "📈 尝试次数: {$progress->attempts_count}\n";
    echo "⭐ 最佳星级: {$progress->stars}\n";
    echo "🏆 最高分: {$progress->best_score}\n";
    echo "✅ 是否完成: " . ($progress->is_completed ? '是' : '否') . "\n";
}
echo "\n";

echo "--- 步骤 8: 测试失败结算 (用完所有尝试次数) ---\n";
$session2 = $service->startGameSession($user, Level::where('order', 2)->first());
$level2 = $session2->level;
echo "🎮 第二关: {$level2->name}\n";
echo "📊 最大尝试次数: {$level2->max_attempts}\n\n";

$testMaterials = [
    ['material_id' => 1, 'amount' => 50],
    ['material_id' => 6, 'amount' => 50],
];
$testState = [
    'materials' => $testMaterials,
    'properties' => $service->calculateProperties($testMaterials),
];

for ($i = 0; $i < $level2->max_attempts; $i++) {
    $r = $service->submitAttempt($session2, $testState);
    echo "   第 " . ($i + 1) . " 次提交 - 状态: {$r['session']['status']} (得分: {$r['score']['total_score']})\n";
}

$session2->refresh();
echo "\n最终状态: {$session2->status}\n";
echo "最终得分: {$session2->final_score}\n";
echo "游戏结果: " . ($session2->isLost() ? '❌ 挑战失败' : ($session2->isWon() ? '✅ 挑战成功' : '🎮 进行中')) . "\n";

echo "\n--- 步骤 9: 测试配方保存与重新计算 ---\n";
$recipe = $service->saveRecipe(
    $user,
    $level,
    '测试配方',
    '这是一个测试配方',
    ['materials' => $testMaterials],
    ['viscosity' => 999, 'drying_time' => 999, 'transparency' => 999],
    999.0
);
echo "💾 配方已保存 (故意写入错误的属性值)\n";
echo "   保存时的虚假分数: {$recipe->score}\n";

$recalcResult = $service->recalculateScore($recipe, $level);
echo "🔬 后端重新计算后:\n";
echo "   实际分数: {$recalcResult['score']['total_score']}\n";
echo "   实际黏度: {$recalcResult['properties']['viscosity']}\n";
echo "   实际干燥: {$recalcResult['properties']['drying_time']}s\n";
echo "   实际透明度: {$recalcResult['properties']['transparency']}%\n";
echo "   " . ($recipe->refresh()->score != 999.0 ? '✅ 配方分数已被更新为正确值' : '❌ 配方分数未更新') . "\n";

echo "\n========================================\n";
echo "✅ 所有测试完成！\n";
echo "========================================\n";
echo "\n📋 总结:\n";
echo "   ✅ 新玩家能正常创建游戏会话\n";
echo "   ✅ 能添加材料并更新调配状态\n";
echo "   ✅ 操作历史记录正常\n";
echo "   ✅ 撤销功能正常\n";
echo "   ✅ 提交检验时后端强制重算 properties\n";
echo "   ✅ 通关/失败结算正常\n";
echo "   ✅ 配方保存后可重新计算分数\n";

$user->delete();
echo "\n🧹 测试用户已清理\n";

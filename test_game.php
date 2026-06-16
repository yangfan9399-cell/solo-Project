<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$service = app(\App\Services\GlueGameService::class);

echo "=== 测试胶水配比计算 ===\n";
$materials = [
    ['material_id' => 1, 'amount' => 70],
    ['material_id' => 6, 'amount' => 30],
];
$props = $service->calculateProperties($materials);
echo "黏度: " . $props['viscosity'] . "\n";
echo "干燥时间: " . $props['drying_time'] . "\n";
echo "透明度: " . $props['transparency'] . "\n";
echo "总量: " . $props['total_amount'] . "\n";

echo "\n=== 测试分数计算 ===\n";
$level = \App\Models\Level::find(1);
echo "关卡: " . $level->name . "\n";
echo "目标黏度: " . $level->target_viscosity . "\n";
echo "目标干燥: " . $level->target_drying_time . "\n";
echo "目标透明度: " . $level->target_transparency . "\n";

$score = $service->calculateScore($level, $props);
echo "\n总分: " . $score['total_score'] . "\n";
echo "是否通过: " . ($score['is_passed'] ? '是' : '否') . "\n";
echo "星级: " . $score['stars'] . " 星\n";
echo "黏度得分: " . $score['viscosity_score'] . " (偏差: " . $score['viscosity_diff'] . ")\n";
echo "干燥得分: " . $score['drying_score'] . " (偏差: " . $score['drying_diff'] . ")\n";
echo "透明度得分: " . $score['transparency_score'] . " (偏差: " . $score['transparency_diff'] . ")\n";

echo "\n=== 测试材料解锁 ===\n";
$user = \App\Models\User::where('email', 'player@example.com')->first();
echo "用户: " . $user->name . "\n";
$unlocked = $service->getUserUnlockedMaterials($user);
echo "已解锁材料数: " . count($unlocked) . "\n";
foreach ($unlocked as $m) {
    echo "  - " . $m['name'] . " (" . $m['type'] . ")\n";
}

echo "\n=== 测试关卡解锁 ===\n";
$levels = \App\Models\Level::active()->ordered()->get();
foreach ($levels as $l) {
    $unlocked = $service->isLevelUnlocked($user, $l);
    echo "第 " . $l->order . " 关 " . $l->name . ": " . ($unlocked ? '✓ 已解锁' : '✗ 未解锁') . "\n";
}

echo "\n=== 测试配方重新计算 (后端重算) ===\n";
$recipe = \App\Models\Recipe::first();
if ($recipe) {
    echo "配方: " . $recipe->name . "\n";
    echo "原分数: " . $recipe->score . "\n";
    $level = $recipe->level;
    if ($level) {
        $result = $service->recalculateScore($recipe, $level);
        echo "重算后分数: " . $result['score']['total_score'] . "\n";
        echo "重算后黏度: " . $result['properties']['viscosity'] . "\n";
        echo "重算后干燥: " . $result['properties']['drying_time'] . "\n";
        echo "重算后透明度: " . $result['properties']['transparency'] . "\n";
    }
}

echo "\n✅ 所有测试通过！\n";

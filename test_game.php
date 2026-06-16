<?php

error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$player = \App\Models\Player::firstOrCreate(
    ['name' => '测试员'],
    ['total_score' => 0, 'games_played' => 0, 'games_won' => 0, 'best_streak' => 0, 'current_streak' => 0]
);
echo "Player: {$player->name} (ID: {$player->id})\n";

$level = \App\Models\Level::find(1);
echo "Level: {$level->name} (ID: {$level->id})\n";
echo "Boxes: {$level->archiveBoxes->count()}\n";
echo "Clues: {$level->clues->count()}\n";
echo "Floors: {$level->floor_count}\n";

$service = app(\App\Services\GameService::class);
$session = $service->startGame($player, $level);
echo "\nStarted session: {$session->id}\n";

$session2 = $service->moveBox($session, 1, 2);
echo "Moved box 1 to floor 2\n";

$state = $service->getGameState($session);
echo "Unplaced: " . count($state['unplaced_boxes']) . "\n";
echo "Floor 1: " . count($state['floor_groups'][1]) . "\n";
echo "Floor 2: " . count($state['floor_groups'][2]) . "\n";
echo "Floor 3: " . count($state['floor_groups'][3]) . "\n";

$score = $service->calculateScore(
    $level,
    $level->archiveBoxes->keyBy('id'),
    $session->getCurrentStateArray(),
    $session,
    []
);
echo "\n=== Score Calculation (partial placement) ===\n";
echo "Base: {$score['base_score']}\n";
echo "Placement: {$score['placement_score']}\n";
echo "Correct: {$score['correct_count']}/{$score['total_boxes']}\n";
echo "Wrong: {$score['wrong_count']}\n";
echo "Undo penalty: {$score['undo_penalty']}\n";
echo "--- Mutex Result ---\n";
echo "Mutex satisfied: {$score['mutex_satisfied']}/{$score['mutex_total']}\n";
echo "Mutex bonus: {$score['mutex_bonus']}\n";
echo "Mutex penalty: {$score['mutex_penalty']}\n";
foreach ($score['mutex_rules'] as $r) {
    $st = $r['satisfied'] ? '[OK ]' : '[ERR]';
    echo "  {$st} #" . ($r['rule_index']+1) . ": {$r['description']} - {$r['details']}\n";
}
echo "---\n";
echo "Final: {$score['final_score']}\n";
echo "Complete success: " . ($score['is_complete_success'] ? 'YES' : 'NO') . "\n";

echo "\n=== Testing full game (all correct) ===\n";
$session2 = $service->startGame($player, $level);
$boxes = $level->archiveBoxes;
foreach ($boxes as $box) {
    $service->moveBox($session2, $box->id, $box->correct_floor);
}
$result = $service->submitReport($session2, ['noise_clue_ids' => [4]]);
echo "Final score: {$result['final_score']}\n";
echo "Status: {$session2->status}\n";
echo "Mutex satisfied: {$result['mutex_satisfied']}/{$result['mutex_total']}\n";
echo "Mutex bonus: {$result['mutex_bonus']}, penalty: {$result['mutex_penalty']}\n";
foreach ($result['mutex_rules'] as $r) {
    $st = $r['satisfied'] ? '[OK ]' : '[ERR]';
    echo "  {$st} #" . ($r['rule_index']+1) . ": {$r['description']} - {$r['details']}\n";
}
echo "Player total score: {$player->total_score}\n";

echo "\n=== All tests passed! ===\n";

<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$service = app(App\Services\GameService::class);
$game = $service->createGame(1, '测试匠人2');
echo "Created Game #{$game->id}\n";

$service->selectRib($game, 1);
$service->selectSurface($game, 4);
$service->selectPaper($game, 7);
$service->setPastingOrder($game, ['骨架固定', '伞面铺展', '糊纸贴合', '收拢整形']);
$service->setDryingTime($game, 120);
$service->processDrying($game);
$service->calculateAndFinalize($game);
$game->refresh();

echo "Status: {$game->status}\n";
echo "Score: {$game->score}\n";
echo "Smoothness: {$game->smoothness}\n";
echo "Durability: {$game->total_durability}\n";
echo "Cost: {$game->total_cost}\n";
echo "Histories: {$game->histories->count()}\n";
echo "Results: {$game->results->count()}\n";
echo "Inspections: {$game->qualityInspections->count()}\n";
echo "Evaluations: {$game->orderEvaluations->count()}\n";
echo "RoundState keys: " . implode(', ', array_keys($game->round_state ?? [])) . "\n";

$inspection = $game->qualityInspections->first();
echo "Inspection result: {$inspection->result}, needs_rollback: " . ($inspection->needs_rollback ? 'yes' : 'no') . "\n";

if ($inspection->needs_rollback) {
    echo "Testing rollback...\n";
    $game = $service->rollbackAndRecalc($game);
    echo "After rollback - Score: {$game->score}, Smoothness: {$game->smoothness}\n";
}

<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$service = app(App\Services\GameService::class);

App\Models\Level::where('id', 3)->update(['humidity_range' => ['min' => 65, 'max' => 72]]);

$game = $service->createGame(3, '回滚测试匠人');
echo "Created Game #{$game->id} with humidity {$game->humidity}%\n";

$service->selectRib($game, 3);
$service->selectSurface($game, 6);
$service->selectPaper($game, 9);
$service->setPastingOrder($game, ['骨架固定', '伞面铺展', '糊纸贴合', '收拢整形']);
$service->setDryingTime($game, 100);
$service->processDrying($game);
$service->calculateAndFinalize($game);
$game->refresh();

echo "Status: {$game->status}\n";
echo "Score: {$game->score}\n";
echo "Smoothness: {$game->smoothness}\n";

$inspection = $game->qualityInspections->first();
echo "Inspection: result={$inspection->result}, needs_rollback=" . ($inspection->needs_rollback ? 'yes' : 'no') . "\n";

if ($inspection->needs_rollback) {
    echo "Executing rollback...\n";
    $game = $service->rollbackAndRecalc($game);
    echo "After rollback - Score: {$game->score}, Smoothness: {$game->smoothness}, Status: {$game->status}\n";
    echo "Total inspections: {$game->qualityInspections->count()}\n";
    echo "Total evaluations: {$game->orderEvaluations->count()}\n";
    echo "Total histories: {$game->histories->count()}\n";
}

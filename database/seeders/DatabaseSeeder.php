<?php

namespace Database\Seeders;

use App\Services\GameManager;
use App\Services\ScoreCalculator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\App;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $gameManager = App::make(GameManager::class);
        $scoreCalculator = App::make(ScoreCalculator::class);

        $this->seedNormalCompletionGame($gameManager, $scoreCalculator);
        $this->seedOxygenDepletionGame($gameManager, $scoreCalculator);
        $this->seedRollbackRequiredGame($gameManager, $scoreCalculator);
    }

    private function seedNormalCompletionGame(GameManager $gameManager, ScoreCalculator $scoreCalculator): void
    {
        $session = $gameManager->createNewSession('样本-正常完成-张探险家');
        $caveData = $session->cave_data;
        $startPos = $caveData['start_position'];
        $exitPos = $caveData['exit_position'];

        $directions = [0, 45, 90, 135, 180, 225, 270, 315];
        $frequencies = [35, 40, 45, 50];

        $probeCount = min(15, count($directions) * 2);
        for ($i = 0; $i < $probeCount; $i++) {
            $dir = $directions[$i % count($directions)];
            $freq = $frequencies[array_rand($frequencies)];
            $gameManager->executeProbe($session, $dir, $freq);
            $session = $session->fresh();
            if ($session->status !== 'playing') break;
        }

        if ($session->status === 'playing') {
            $path = $this->findPath($caveData['grid'], $startPos, $exitPos);
            foreach ($path as $step) {
                if ($session->status !== 'playing') break;
                $gameManager->movePlayer($session, $step['x'], $step['y']);
                $session = $session->fresh();
            }
        }

        if ($session->status === 'playing') {
            $session = $gameManager->endSession($session, '种子样本：正常完成探险');
        }

        $finalScore = $scoreCalculator->recalculate($session);
        $session->score = $finalScore;
        $session->save();

        $this->command->info("样本1创建完成: 正常完成游戏 #{$session->id}，得分 {$finalScore}");
    }

    private function seedOxygenDepletionGame(GameManager $gameManager, ScoreCalculator $scoreCalculator): void
    {
        $session = $gameManager->createNewSession('样本-氧气耗尽-李探险家');
        $caveData = $session->cave_data;

        $badDirections = [10, 20, 30, 350, 340, 330];
        $badFrequencies = [15, 85, 90, 10];

        for ($i = 0; $i < 40; $i++) {
            $dir = $badDirections[array_rand($badDirections)];
            $freq = $badFrequencies[array_rand($badFrequencies)];
            $gameManager->executeProbe($session, $dir, $freq);
            $session = $session->fresh();

            if ($session->status !== 'playing') {
                break;
            }

            if ($i % 3 === 0) {
                $badX = $session->player_x + rand(-8, 8);
                $badY = $session->player_y + rand(-8, 8);
                $gameManager->movePlayer($session, $badX, $badY);
                $session = $session->fresh();
            }
        }

        if ($session->status === 'playing') {
            $session->oxygen = 1;
            $session->save();
            $gameManager->executeProbe($session, 45, 80);
            $session = $session->fresh();
        }

        $finalScore = $scoreCalculator->recalculate($session);
        $session->score = $finalScore;
        $session->save();

        $this->command->info("样本2创建完成: 氧气耗尽游戏 #{$session->id}，状态 {$session->status}，得分 {$finalScore}");
    }

    private function seedRollbackRequiredGame(GameManager $gameManager, ScoreCalculator $scoreCalculator): void
    {
        $session = $gameManager->createNewSession('样本-需要回滚-王探险家');

        $probeDirections = [0, 90, 180, 270, 45, 135, 225, 315];
        $probeFrequencies = [25, 75, 40, 85];

        $historiesToRollback = [];
        for ($i = 0; $i < 10; $i++) {
            $dir = $probeDirections[$i % count($probeDirections)];
            $freq = $probeFrequencies[array_rand($probeFrequencies)];
            $result = $gameManager->executeProbe($session, $dir, $freq);
            $session = $session->fresh();

            if (isset($result['probe_history']) && ($i === 2 || $i === 5 || $i === 7)) {
                $historiesToRollback[] = $result['probe_history']->id;
            }

            if ($session->status !== 'playing') break;
        }

        foreach ($historiesToRollback as $historyId) {
            if ($session->status !== 'playing') break;
            $gameManager->rollbackProbe($session, $historyId);
            $session = $session->fresh();
        }

        if ($session->status === 'playing') {
            $gameManager->executeProbe($session, 0, 40);
            $gameManager->executeProbe($session, 90, 40);
            $session = $session->fresh();
        }

        if ($session->status === 'playing') {
            $session = $gameManager->endSession($session, '种子样本：包含多次探测回滚的探险');
        }

        $finalScore = $scoreCalculator->recalculate($session);
        $session->score = $finalScore;
        $session->save();

        $this->command->info("样本3创建完成: 含回滚游戏 #{$session->id}，回滚次数 " . count($historiesToRollback) . "，得分 {$finalScore}");
    }

    private function findPath(array $grid, array $start, array $end): array
    {
        $width = count($grid[0]);
        $height = count($grid);
        $visited = [];
        $queue = [[$start]];
        $visited[$start['y']][$start['x']] = true;

        $directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        while (!empty($queue)) {
            $path = array_shift($queue);
            $current = end($path);

            if ($current['x'] === $end['x'] && $current['y'] === $end['y']) {
                return array_slice($path, 1);
            }

            foreach ($directions as $d) {
                $nx = $current['x'] + $d[0];
                $ny = $current['y'] + $d[1];

                if ($nx >= 0 && $nx < $width && $ny >= 0 && $ny < $height
                    && $grid[$ny][$nx] === 0 && !isset($visited[$ny][$nx])) {
                    $visited[$ny][$nx] = true;
                    $newPath = $path;
                    $newPath[] = ['x' => $nx, 'y' => $ny];
                    $queue[] = $newPath;
                }
            }
        }

        return [];
    }
}

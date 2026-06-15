<?php

namespace App\Services;

use App\Models\Game;
use App\Models\GameDetail;
use App\Models\GameHistory;
use App\Models\GameResult;
use App\Models\Level;
use App\Models\Material;
use App\Models\OrderEvaluation;
use App\Models\QualityInspection;
use Illuminate\Support\Facades\DB;

class GameService
{
    public function createGame(int $levelId, string $playerName = '匠人'): Game
    {
        $level = Level::findOrFail($levelId);

        $humidityRange = $level->humidity_range ?? ['min' => 30, 'max' => 70];
        $humidity = rand($humidityRange['min'], $humidityRange['max']);

        return Game::create([
            'level_id' => $levelId,
            'player_name' => $playerName,
            'status' => 'draft',
            'humidity' => $humidity,
            'round_state' => ['created' => ['timestamp' => now()->toIso8601String()]],
        ]);
    }

    public function selectRib(Game $game, int $materialId): Game
    {
        $material = Material::where('id', $materialId)->where('type', 'rib')->firstOrFail();

        $game->rib_material_id = $materialId;
        $game->status = 'assembly';
        $game->updateRoundState('select_rib', [
            'material_id' => $materialId,
            'material_name' => $material->name,
            'is_defective' => $material->is_defective,
        ]);

        return $game;
    }

    public function selectSurface(Game $game, int $materialId): Game
    {
        $material = Material::where('id', $materialId)->where('type', 'surface')->firstOrFail();

        $game->surface_material_id = $materialId;
        $game->updateRoundState('select_surface', [
            'material_id' => $materialId,
            'material_name' => $material->name,
            'is_defective' => $material->is_defective,
        ]);

        return $game;
    }

    public function selectPaper(Game $game, int $materialId): Game
    {
        $material = Material::where('id', $materialId)->where('type', 'paper')->firstOrFail();

        $game->paper_material_id = $materialId;
        $game->updateRoundState('select_paper', [
            'material_id' => $materialId,
            'material_name' => $material->name,
            'is_defective' => $material->is_defective,
        ]);

        return $game;
    }

    public function setPastingOrder(Game $game, array $pastingOrder): Game
    {
        $optimalOrder = ['骨架固定', '伞面铺展', '糊纸贴合', '收拢整形'];

        GameDetail::updateOrCreate(
            ['game_id' => $game->id],
            ['pasting_order' => $pastingOrder]
        );

        $isOptimal = $pastingOrder === $optimalOrder;

        $game->updateRoundState('pasting', [
            'order' => $pastingOrder,
            'is_optimal' => $isOptimal,
        ]);

        if (!$isOptimal) {
            $game->updateRoundState('pasting', [
                'penalty_note' => '糊纸顺序非最优，开合顺滑度将受影响',
            ]);
        }

        return $game;
    }

    public function setDryingTime(Game $game, int $dryingTime): Game
    {
        $detail = GameDetail::updateOrCreate(
            ['game_id' => $game->id],
            ['drying_time' => $dryingTime]
        );

        $optimalMin = 90;
        $optimalMax = 150;
        $isOptimal = $dryingTime >= $optimalMin && $dryingTime <= $optimalMax;

        $game->status = 'drying';
        $game->updateRoundState('drying', [
            'time' => $dryingTime,
            'is_optimal' => $isOptimal,
            'optimal_range' => "{$optimalMin}-{$optimalMax}分钟",
        ]);

        return $game;
    }

    public function processDrying(Game $game): Game
    {
        $detail = $game->details;
        if (!$detail) {
            throw new \Exception('未找到工序详情');
        }

        $humidity = $game->humidity;
        $dryingTime = $detail->drying_time;

        $progress = $this->calculateDryingProgress($dryingTime, $humidity);
        $detail->actual_drying_progress = $progress;
        $detail->drying_step = $this->getDryingStep($progress);
        $detail->save();

        $game->updateRoundState('drying', ['progress' => $progress]);

        return $game;
    }

    public function calculateAndFinalize(Game $game): Game
    {
        return DB::transaction(function () use ($game) {
            $this->applyHumidityEffect($game);
            $this->applyMaterialComboEffect($game);
            $this->performQualityInspection($game);
            $this->generateOrderEvaluation($game);

            $score = $this->calculateFinalScore($game);
            $game->score = $score;

            $level = $game->level;
            $game->status = $score >= $level->target_score ? 'completed' : 'failed';
            $game->updateRoundState('final', ['score' => $score, 'status' => $game->status]);
            $game->save();

            return $game;
        });
    }

    public function rollbackAndRecalc(Game $game): Game
    {
        return DB::transaction(function () use ($game) {
            $lastInspection = $game->qualityInspections()->where('needs_rollback', true)->first();
            if (!$lastInspection) {
                throw new \Exception('没有需要回滚的质检记录');
            }

            $lastInspection->update(['needs_rollback' => false]);

            $smoothnessBeforeRollback = $game->smoothness;
            $correctedSmoothness = min(100, $game->smoothness + rand(5, 15));
            $game->smoothness = $correctedSmoothness;
            $game->save();

            GameHistory::create([
                'game_id' => $game->id,
                'humidity' => $game->humidity,
                'smoothness_before' => $smoothnessBeforeRollback,
                'smoothness_after' => $correctedSmoothness,
                'change_reason' => '回滚重算：修正湿度重复扣分，顺滑度从' . $smoothnessBeforeRollback . '调整为' . $correctedSmoothness,
            ]);

            $newScore = $this->calculateFinalScore($game);
            $game->score = $newScore;

            $level = $game->level;
            $game->status = $newScore >= $level->target_score ? 'completed' : 'failed';

            QualityInspection::create([
                'game_id' => $game->id,
                'inspection_type' => 'recalc',
                'result' => $newScore >= $level->target_score ? 'pass' : 'fail',
                'score' => $newScore,
                'notes' => '回滚重算完成：修正评分，最终评分' . $newScore,
                'needs_rollback' => false,
            ]);

            $lastEval = $game->orderEvaluations()->where('needs_recalc', true)->first();
            if ($lastEval) {
                $lastEval->update(['needs_recalc' => false]);
                OrderEvaluation::create([
                    'game_id' => $game->id,
                    'customer_name' => $lastEval->customer_name,
                    'satisfaction' => min(100, $lastEval->satisfaction + rand(8, 15)),
                    'review_score' => $newScore,
                    'comment' => '经回算后修正评分，重新评估',
                    'needs_recalc' => false,
                ]);
            }

            $game->updateRoundState('recalc', [
                'reason' => '质检评分异常需回滚重算',
                'original_score' => $lastInspection->score,
                'recalculated_score' => $newScore,
                'smoothness_before' => $smoothnessBeforeRollback,
                'smoothness_after' => $correctedSmoothness,
            ]);
            $game->save();

            return $game;
        });
    }

    private function applyHumidityEffect(Game $game): void
    {
        $humidity = $game->humidity;
        $smoothnessBefore = 100;

        $penalty = 0;
        $reason = '';

        if ($humidity <= 40) {
            $penalty = rand(5, 12);
            $reason = "湿度{$humidity}%偏低，竹骨微缩，开合顺滑度轻微下降";
        } elseif ($humidity <= 55) {
            $penalty = rand(3, 10);
            $reason = "湿度{$humidity}%适中，开合顺滑度轻微下降";
        } elseif ($humidity <= 70) {
            $penalty = rand(10, 25);
            $reason = "湿度{$humidity}%偏高，竹骨略有膨胀，开合顺滑度下降";
        } else {
            $penalty = rand(25, 55);
            $reason = "湿度{$humidity}%过高，竹骨膨胀明显，开合严重卡顿";
        }

        $hasDefectiveRib = $game->ribMaterial && $game->ribMaterial->is_defective;
        $hasDefectiveSurface = $game->surfaceMaterial && $game->surfaceMaterial->is_defective;

        if ($hasDefectiveRib && $humidity > 60) {
            $penalty += rand(10, 20);
            $reason .= '；缺陷竹骨在高湿度下进一步劣化';
        }
        if ($hasDefectiveSurface && $humidity > 60) {
            $penalty += rand(8, 15);
            $reason .= '；受潮伞面在高湿度下进一步劣化';
        }

        $smoothnessAfter = max(0, $smoothnessBefore - $penalty);
        $game->smoothness = $smoothnessAfter;
        $game->save();

        GameHistory::create([
            'game_id' => $game->id,
            'humidity' => $humidity,
            'smoothness_before' => $smoothnessBefore,
            'smoothness_after' => $smoothnessAfter,
            'change_reason' => $reason,
        ]);
    }

    private function applyMaterialComboEffect(Game $game): void
    {
        $rib = $game->ribMaterial;
        $surface = $game->surfaceMaterial;
        $paper = $game->paperMaterial;

        if (!$rib || !$surface || !$paper) {
            return;
        }

        $costBefore = 0;
        $costAfter = $rib->cost + $surface->cost + $paper->cost;
        $durabilityBefore = 0;
        $durabilityAfter = $rib->durability + $surface->durability + $paper->durability;

        $reason = '材料全部合格';
        $hasDefect = false;

        $ribCompatible = $rib->isCompatibleWith($surface);
        $surfaceCompatible = $surface->isCompatibleWith($paper);

        if (!$ribCompatible || !$surfaceCompatible) {
            $durabilityAfter = (int) ($durabilityAfter * 0.7);
            $reason = '部分材料兼容性不佳，耐用度降低30%';
            $hasDefect = true;
        }

        if ($rib->is_defective) {
            $durabilityAfter = (int) ($durabilityAfter * 0.6);
            $reason = '伞骨存在缺陷，耐用度大幅降低';
            $hasDefect = true;
        }
        if ($surface->is_defective) {
            $durabilityAfter = (int) ($durabilityAfter * 0.7);
            $reason = ($hasDefect ? $reason . '；' : '') . '伞面受潮，耐用度降低';
            $hasDefect = true;
        }
        if ($paper->is_defective) {
            $durabilityAfter = (int) ($durabilityAfter * 0.75);
            $reason = ($hasDefect ? $reason . '；' : '') . '纸张粗糙，耐用度降低';
            $hasDefect = true;
        }

        if (!$hasDefect && $ribCompatible && $surfaceCompatible) {
            $reason = '材料全部合格，兼容性良好，耐用度正常叠加';
        }

        $detail = $game->details;
        if ($detail && $detail->pasting_order) {
            $optimalOrder = ['骨架固定', '伞面铺展', '糊纸贴合', '收拢整形'];
            if ($detail->pasting_order !== $optimalOrder) {
                $game->smoothness = max(0, $game->smoothness - rand(10, 20));
                $game->save();
                $reason .= '；糊纸顺序非最优，顺滑度额外下降';

                GameHistory::create([
                    'game_id' => $game->id,
                    'humidity' => $game->humidity,
                    'smoothness_before' => $game->smoothness + rand(10, 20),
                    'smoothness_after' => $game->smoothness,
                    'change_reason' => '糊纸顺序非最优，二次降级',
                ]);
            }
        }

        $durabilityAfter = max(10, $durabilityAfter);

        GameResult::create([
            'game_id' => $game->id,
            'material_combo' => ['rib' => $rib->name, 'surface' => $surface->name, 'paper' => $paper->name],
            'cost_before' => $costBefore,
            'cost_after' => $costAfter,
            'durability_before' => $durabilityBefore,
            'durability_after' => $durabilityAfter,
            'change_reason' => $reason,
        ]);

        $game->total_cost = $costAfter;
        $game->total_durability = $durabilityAfter;
        $game->save();
    }

    private function performQualityInspection(Game $game): void
    {
        $smoothness = $game->smoothness;
        $durability = $game->total_durability;
        $cost = $game->total_cost;

        $baseScore = ($smoothness * 0.5) + ($durability * 0.3) + (max(0, 100 - $cost) * 0.2);

        $humidity = $game->humidity;
        $needsRollback = false;

        if ($humidity > 65 && $humidity < 75) {
            $baseScore = $baseScore * 0.85;
            $needsRollback = true;
        }

        $finalScore = (int) round(min(100, max(0, $baseScore)));

        $result = 'pass';
        $notes = '';

        if ($finalScore >= 80) {
            $result = 'pass';
            $notes = '伞骨装配规范，质量达标';
        } elseif ($finalScore >= 60) {
            $result = 'warning';
            $notes = '质量一般，部分指标未达标';
            if ($needsRollback) {
                $notes .= '；湿度影响可能被重复计算，需回滚重算';
            }
        } else {
            $result = 'fail';
            $notes = '质检不通过，多项指标未达标';
        }

        if ($needsRollback) {
            $notes .= ' [系统标记：需回滚重算]';
        }

        QualityInspection::create([
            'game_id' => $game->id,
            'inspection_type' => 'final',
            'result' => $result,
            'score' => $finalScore,
            'notes' => $notes,
            'needs_rollback' => $needsRollback,
        ]);

        $game->updateRoundState('inspection', [
            'result' => $result,
            'score' => $finalScore,
            'needs_rollback' => $needsRollback,
        ]);
    }

    private function generateOrderEvaluation(Game $game): void
    {
        $inspection = $game->qualityInspections()->latest()->first();
        $score = $inspection ? $inspection->score : 50;

        $satisfaction = min(100, max(0, $score + rand(-10, 10)));
        $needsRecalc = $inspection && $inspection->needs_rollback;

        $comment = match (true) {
            $satisfaction >= 80 => '伞做工精良，非常满意！',
            $satisfaction >= 60 => '伞还可以，但有些地方可以改进。',
            $satisfaction >= 40 => '伞的质量一般，勉强能用。',
            default => '不满意，伞的质量很差。',
        };

        $customerNames = ['李客官', '赵客官', '孙客官', '周客官', '吴客官', '郑客官'];

        OrderEvaluation::create([
            'game_id' => $game->id,
            'customer_name' => $customerNames[array_rand($customerNames)],
            'satisfaction' => $satisfaction,
            'review_score' => $score,
            'comment' => $comment,
            'needs_recalc' => $needsRecalc,
        ]);

        $game->updateRoundState('evaluation', [
            'satisfaction' => $satisfaction,
            'review_score' => $score,
            'needs_recalc' => $needsRecalc,
        ]);
    }

    public function calculateFinalScore(Game $game): int
    {
        $smoothness = $game->smoothness;
        $durability = $game->total_durability;
        $cost = $game->total_cost;

        $score = ($smoothness * 0.5) + ($durability * 0.3) + (max(0, 100 - $cost) * 0.2);

        return (int) round(min(100, max(0, $score)));
    }

    private function calculateDryingProgress(int $dryingTime, int $humidity): int
    {
        $baseProgress = min(100, ($dryingTime / 120) * 100);

        $humidityPenalty = 0;
        if ($humidity > 60) {
            $humidityPenalty = ($humidity - 60) * 0.5;
        } elseif ($humidity < 40) {
            $humidityPenalty = (40 - $humidity) * 0.3;
        }

        return (int) max(0, min(100, $baseProgress - $humidityPenalty));
    }

    private function getDryingStep(int $progress): int
    {
        return match (true) {
            $progress >= 100 => 4,
            $progress >= 75 => 3,
            $progress >= 50 => 2,
            $progress >= 25 => 1,
            default => 0,
        };
    }
}

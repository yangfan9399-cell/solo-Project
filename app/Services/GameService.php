<?php

namespace App\Services;

use App\Models\Level;
use App\Models\Player;
use App\Models\GameSession;
use App\Models\GameOperation;
use App\Models\ArchiveBox;

class GameService
{
    public function startGame(Player $player, Level $level): GameSession
    {
        $boxes = $level->archiveBoxes;
        $initialState = [];
        foreach ($boxes as $box) {
            $initialState[$box->id] = null;
        }

        $session = GameSession::create([
            'player_id' => $player->id,
            'level_id' => $level->id,
            'status' => 'playing',
            'score' => 0,
            'undo_count' => 0,
            'operation_count' => 0,
            'current_state' => json_encode($initialState),
            'started_at' => now(),
        ]);

        return $session;
    }

    public function moveBox(GameSession $session, int $boxId, ?int $toFloor): array
    {
        if ($session->status !== 'playing') {
            throw new \RuntimeException('游戏已结束，无法操作');
        }

        $state = $session->getCurrentStateArray();
        $fromFloor = $state[$boxId] ?? null;

        if ($fromFloor === $toFloor) {
            return ['state' => $state, 'changed' => false];
        }

        $stateBefore = $state;
        $state[$boxId] = $toFloor;

        $operation = new GameOperation([
            'operation_type' => 'move',
            'box_id' => $boxId,
            'from_floor' => $fromFloor,
            'to_floor' => $toFloor,
            'state_before' => json_encode($stateBefore),
            'state_after' => json_encode($state),
            'sequence_number' => $session->operation_count + 1,
        ]);
        $session->operations()->save($operation);

        $session->current_state = json_encode($state);
        $session->operation_count += 1;
        $session->save();

        return [
            'state' => $state,
            'changed' => true,
            'operation_id' => $operation->id,
        ];
    }

    public function undoLastOperation(GameSession $session): array
    {
        if ($session->status !== 'playing') {
            throw new \RuntimeException('游戏已结束，无法撤销');
        }

        $lastOperation = $session->operations()
            ->where('operation_type', 'move')
            ->orderBy('sequence_number', 'desc')
            ->first();

        if (!$lastOperation) {
            return ['state' => $session->getCurrentStateArray(), 'undone' => false];
        }

        $previousState = $lastOperation->getStateBeforeArray();

        $undoOperation = new GameOperation([
            'operation_type' => 'undo',
            'box_id' => $lastOperation->box_id,
            'from_floor' => $lastOperation->to_floor,
            'to_floor' => $lastOperation->from_floor,
            'state_before' => json_encode($session->getCurrentStateArray()),
            'state_after' => json_encode($previousState),
            'sequence_number' => $session->operation_count + 1,
        ]);
        $session->operations()->save($undoOperation);

        $session->current_state = json_encode($previousState);
        $session->operation_count += 1;
        $session->undo_count += 1;
        $session->save();

        $lastOperation->delete();

        return [
            'state' => $previousState,
            'undone' => true,
            'box_id' => $lastOperation->box_id,
        ];
    }

    public function submitReport(GameSession $session, array $playerAssessment = []): array
    {
        if ($session->status !== 'playing') {
            throw new \RuntimeException('游戏已结束');
        }

        $level = $session->level;
        $boxes = $level->archiveBoxes->keyBy('id');
        $state = $session->getCurrentStateArray();

        $result = $this->calculateScore($level, $boxes, $state, $session, $playerAssessment);

        $session->status = $result['is_complete_success'] ? 'won' : 'lost';
        $session->score = $result['final_score'];
        $session->completed_at = now();
        $session->time_taken_seconds = $session->started_at
            ? now()->diffInSeconds($session->started_at)
            : 0;
        $session->final_report = json_encode([
            'assessment' => $playerAssessment,
            'breakdown' => $result,
        ]);
        $session->save();

        $session->player->addScore($result['final_score'], $result['is_complete_success']);

        return $result;
    }

    public function calculateScore(
        Level $level,
        $boxes,
        array $state,
        GameSession $session,
        array $playerAssessment = []
    ): array {
        $baseScore = $level->base_score;
        $perBoxCorrect = 100;
        $perBoxWrong = -50;
        $undoPenaltyPer = $level->undo_penalty;
        $perfectBonus = 200;

        $correctCount = 0;
        $wrongCount = 0;
        $unplacedCount = 0;
        $boxDetails = [];

        foreach ($boxes as $box) {
            $playerFloor = $state[$box->id] ?? null;
            $isCorrect = $playerFloor !== null && $playerFloor == $box->correct_floor;
            $isUnplaced = $playerFloor === null;

            if ($isCorrect) {
                $correctCount++;
            } elseif ($isUnplaced) {
                $unplacedCount++;
            } else {
                $wrongCount++;
            }

            $boxDetails[] = [
                'box_id' => $box->id,
                'label' => $box->label,
                'era' => $box->era,
                'classification' => $box->classification,
                'correct_floor' => $box->correct_floor,
                'player_floor' => $playerFloor,
                'is_correct' => $isCorrect,
                'is_unplaced' => $isUnplaced,
            ];
        }

        $placementScore = ($correctCount * $perBoxCorrect) + ($wrongCount * $perBoxWrong);
        $undoPenalty = $session->undo_count * $undoPenaltyPer;

        $allCorrect = $correctCount == count($boxes);
        $noUndo = $session->undo_count == 0;
        $perfectBonusScore = ($allCorrect && $noUndo) ? $perfectBonus : 0;

        $timeTaken = $session->started_at
            ? now()->diffInSeconds($session->started_at)
            : 0;

        $timeBonus = 0;
        if ($allCorrect && $level->time_bonus_seconds > 0) {
            $timeBonus = max(0, $level->time_bonus_seconds - $timeTaken) * 2;
            $timeBonus = min($timeBonus, 300);
        }

        $noiseClueBonus = 0;
        $noiseClueIds = $level->clues->where('is_noise', true)->pluck('id')->toArray();
        $playerIdentifiedNoise = $playerAssessment['noise_clue_ids'] ?? [];

        $correctlyIdentifiedNoise = array_intersect($noiseClueIds, $playerIdentifiedNoise);
        $falselyIdentifiedNoise = array_diff($playerIdentifiedNoise, $noiseClueIds);

        $noiseClueBonus = (count($correctlyIdentifiedNoise) * 50)
            - (count($falselyIdentifiedNoise) * 30);

        $mutexResult = $this->checkMutualExclusions($level, $state, $boxes);
        $mutexSatisfied = $mutexResult['satisfied_count'] ?? 0;
        $mutexTotal = $mutexResult['total_count'] ?? 0;
        $mutexViolated = $mutexTotal - $mutexSatisfied;
        $mutexPenalty = $mutexViolated * 60;
        $mutexBonus = ($mutexTotal > 0 && $mutexSatisfied === $mutexTotal) ? 150 : 0;

        $finalScore = $baseScore + $placementScore - $undoPenalty + $perfectBonusScore
            + $timeBonus + $noiseClueBonus + $mutexBonus - $mutexPenalty;
        $finalScore = max(0, $finalScore);

        $allPlaced = $unplacedCount == 0;
        $allMutexOk = $mutexTotal === 0 || $mutexSatisfied === $mutexTotal;
        $isCompleteSuccess = $allCorrect && $allPlaced && $allMutexOk;

        return [
            'base_score' => $baseScore,
            'placement_score' => $placementScore,
            'correct_count' => $correctCount,
            'wrong_count' => $wrongCount,
            'unplaced_count' => $unplacedCount,
            'total_boxes' => count($boxes),
            'undo_penalty' => $undoPenalty,
            'undo_count' => $session->undo_count,
            'perfect_bonus' => $perfectBonusScore,
            'time_bonus' => $timeBonus,
            'time_taken_seconds' => $timeTaken,
            'noise_clue_bonus' => $noiseClueBonus,
            'noise_correctly_identified' => count($correctlyIdentifiedNoise),
            'noise_falsely_identified' => count($falselyIdentifiedNoise),
            'mutex_bonus' => $mutexBonus,
            'mutex_penalty' => $mutexPenalty,
            'mutex_satisfied' => $mutexSatisfied,
            'mutex_total' => $mutexTotal,
            'mutex_rules' => $mutexResult['rules'] ?? [],
            'final_score' => $finalScore,
            'is_complete_success' => $isCompleteSuccess,
            'box_details' => $boxDetails,
            'all_correct' => $allCorrect,
            'all_placed' => $allPlaced,
            'all_mutex_ok' => $allMutexOk,
        ];
    }

    public function checkMutualExclusions(Level $level, array $state, $boxes = null): array
    {
        if ($boxes === null) {
            $boxes = $level->archiveBoxes->keyBy('id');
        }

        $rules = $level->mutex_rules ?? [];
        if (empty($rules)) {
            return [
                'satisfied_count' => 0,
                'total_count' => 0,
                'violations' => [],
                'rules' => [],
            ];
        }

        $floorBoxes = [];
        foreach ($state as $boxId => $floor) {
            if ($floor !== null) {
                if (!isset($floorBoxes[$floor])) {
                    $floorBoxes[$floor] = [];
                }
                $floorBoxes[$floor][] = $boxId;
            }
        }

        $ruleResults = [];
        $satisfied = 0;

        foreach ($rules as $idx => $rule) {
            $ruleResult = $this->evaluateSingleRule($rule, $boxes, $state, $floorBoxes);
            if ($ruleResult['satisfied']) {
                $satisfied++;
            }
            $ruleResults[] = array_merge($ruleResult, ['rule_index' => $idx]);
        }

        return [
            'satisfied_count' => $satisfied,
            'total_count' => count($rules),
            'violations' => array_values(array_filter($ruleResults, fn($r) => !$r['satisfied'])),
            'rules' => $ruleResults,
        ];
    }

    private function evaluateSingleRule(array $rule, $boxes, array $state, array $floorBoxes): array
    {
        $type = $rule['type'] ?? 'unknown';
        $description = $rule['description'] ?? '未命名规则';
        $details = '';
        $satisfied = true;

        switch ($type) {
            case 'different_floor':
                $boxIds = $rule['box_ids'] ?? [];
                $floorsOfTarget = [];
                $unplaced = 0;
                foreach ($boxIds as $bid) {
                    $f = $state[$bid] ?? null;
                    if ($f === null) {
                        $unplaced++;
                    } else {
                        $floorsOfTarget[] = $f;
                    }
                }
                $uniqueFloors = array_unique($floorsOfTarget);
                if (count($uniqueFloors) < count($floorsOfTarget)) {
                    $satisfied = false;
                    $dup = array_unique(array_diff_assoc($floorsOfTarget, $uniqueFloors));
                    $details = '存在冲突：有档案盒被放在了同一层';
                } elseif ($unplaced > 0) {
                    $satisfied = true;
                    $details = "尚有 {$unplaced} 个档案盒未放置，暂未冲突";
                } else {
                    $details = '所有指定档案盒都在不同楼层';
                }
                break;

            case 'same_floor':
                $boxIds = $rule['box_ids'] ?? [];
                $targetFloors = [];
                $unplaced = 0;
                foreach ($boxIds as $bid) {
                    $f = $state[$bid] ?? null;
                    if ($f === null) {
                        $unplaced++;
                    } else {
                        $targetFloors[] = $f;
                    }
                }
                if (count(array_unique($targetFloors)) > 1) {
                    $satisfied = false;
                    $details = '指定档案盒被放在了不同楼层';
                } elseif ($unplaced > 0) {
                    $satisfied = true;
                    $details = "尚有 {$unplaced} 个档案盒未放置";
                } else {
                    $details = '所有指定档案盒在同一楼层 ✓';
                }
                break;

            case 'exclusive_floor':
                $attr = $rule['attribute'] ?? 'classification';
                $value = $rule['value'] ?? '';
                $floor = $rule['floor'] ?? null;
                $boxesOnFloor = $floorBoxes[$floor] ?? [];
                $violationCount = 0;
                $countTarget = 0;
                foreach ($boxesOnFloor as $bid) {
                    $box = $boxes[$bid] ?? null;
                    if ($box) {
                        $actual = $box->$attr ?? null;
                        if ($actual == $value) {
                            $countTarget++;
                        } else {
                            $violationCount++;
                        }
                    }
                }
                if ($violationCount > 0) {
                    $satisfied = false;
                    $details = "第 {$floor} 层有 {$violationCount} 个非【{$value}】档案盒，违反独占";
                } elseif ($countTarget === 0) {
                    $satisfied = true;
                    $details = "第 {$floor} 层尚无【{$value}】档案盒";
                } else {
                    $satisfied = true;
                    $details = "第 {$floor} 层的档案盒均为【{$value}】✓";
                }
                break;

            case 'max_on_floor':
                $attr = $rule['attribute'] ?? 'era';
                $value = $rule['value'] ?? '';
                $max = $rule['max'] ?? 1;
                $floor = $rule['floor'] ?? null;
                $boxesOnFloor = $floorBoxes[$floor] ?? [];
                $countMatch = 0;
                foreach ($boxesOnFloor as $bid) {
                    $box = $boxes[$bid] ?? null;
                    if ($box && ($box->$attr ?? null) == $value) {
                        $countMatch++;
                    }
                }
                if ($countMatch > $max) {
                    $satisfied = false;
                    $details = "第 {$floor} 层的【{$value}】档案盒有 {$countMatch} 个，超过上限 {$max}";
                } else {
                    $satisfied = true;
                    $details = "第 {$floor} 层的【{$value}】档案盒数量 ({$countMatch}/{$max}) 合规 ✓";
                }
                break;

            case 'min_on_floor':
                $attr = $rule['attribute'] ?? 'era';
                $value = $rule['value'] ?? '';
                $min = $rule['min'] ?? 1;
                $floor = $rule['floor'] ?? null;
                $boxesOnFloor = $floorBoxes[$floor] ?? [];
                $countMatch = 0;
                foreach ($boxesOnFloor as $bid) {
                    $box = $boxes[$bid] ?? null;
                    if ($box && ($box->$attr ?? null) == $value) {
                        $countMatch++;
                    }
                }
                if ($countMatch < $min) {
                    $satisfied = false;
                    $details = "第 {$floor} 层的【{$value}】档案盒有 {$countMatch} 个，未达下限 {$min}";
                } else {
                    $satisfied = true;
                    $details = "第 {$floor} 层的【{$value}】档案盒数量 ({$countMatch}/{$min}) 达标 ✓";
                }
                break;

            case 'classification_order':
                $highFloor = $rule['higher_classification_floor'] ?? null;
                $lowFloor = $rule['lower_classification_floor'] ?? null;
                $classHigh = $rule['higher_classification'] ?? '绝密';
                $classLow = $rule['lower_classification'] ?? '公开';
                $violations = 0;
                $lowBoxesOnHigh = $floorBoxes[$highFloor] ?? [];
                foreach ($lowBoxesOnHigh as $bid) {
                    $box = $boxes[$bid] ?? null;
                    if ($box && $box->classification == $classLow) {
                        $violations++;
                    }
                }
                $highBoxesOnLow = $floorBoxes[$lowFloor] ?? [];
                foreach ($highBoxesOnLow as $bid) {
                    $box = $boxes[$bid] ?? null;
                    if ($box && $box->classification == $classHigh) {
                        $violations++;
                    }
                }
                if ($violations > 0) {
                    $satisfied = false;
                    $details = "有 {$violations} 个档案盒违反了密级楼层顺序";
                } else {
                    $satisfied = true;
                    $details = "密级顺序正确（第{$highFloor}层{$classHigh} / 第{$lowFloor}层{$classLow}）✓";
                }
                break;

            default:
                $satisfied = true;
                $details = '未知规则类型';
        }

        return [
            'type' => $type,
            'description' => $description,
            'satisfied' => $satisfied,
            'details' => $details,
        ];
    }

    public function getGameState(GameSession $session): array
    {
        $level = $session->level;
        $boxes = $level->archiveBoxes->keyBy('id');
        $state = $session->getCurrentStateArray();

        $floorGroups = [];
        for ($i = 1; $i <= $level->floor_count; $i++) {
            $floorGroups[$i] = [];
        }
        $unplaced = [];

        foreach ($boxes as $box) {
            $floor = $state[$box->id] ?? null;
            $boxData = [
                'id' => $box->id,
                'label' => $box->label,
                'era' => $box->era,
                'classification' => $box->classification,
                'color' => $box->color,
            ];

            if ($floor !== null && isset($floorGroups[$floor])) {
                $floorGroups[$floor][] = $boxData;
            } else {
                $unplaced[] = $boxData;
            }
        }

        $mutexPreview = null;
        if ($session->status === 'playing') {
            $mutexPreview = $this->checkMutualExclusions($level, $state, $boxes);
        }

        return [
            'session_id' => $session->id,
            'status' => $session->status,
            'level_id' => $level->id,
            'level_name' => $level->name,
            'floor_count' => $level->floor_count,
            'floor_groups' => $floorGroups,
            'unplaced_boxes' => $unplaced,
            'operation_count' => $session->operation_count,
            'undo_count' => $session->undo_count,
            'clues' => $level->clues->map(function ($c) {
                $data = [
                    'id' => $c->id,
                    'content' => $c->content,
                    'type' => $c->type,
                ];
                return $data;
            })->values()->toArray(),
            'boxes_info' => $boxes->map(fn($b) => [
                'id' => $b->id,
                'label' => $b->label,
                'era' => $b->era,
                'classification' => $b->classification,
            ])->values()->toArray(),
            'mutex_preview' => $mutexPreview,
        ];
    }
}

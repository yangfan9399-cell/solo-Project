<?php

namespace App\Services;

use App\Models\Level;
use App\Models\Player;
use App\Models\GameSession;
use App\Models\GameOperation;
use App\Models\ArchiveBox;
use Illuminate\Support\Facades\DB;

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

        $finalScore = $baseScore + $placementScore - $undoPenalty + $perfectBonusScore
            + $timeBonus + $noiseClueBonus;
        $finalScore = max(0, $finalScore);

        $allPlaced = $unplacedCount == 0;
        $isCompleteSuccess = $allCorrect && $allPlaced;

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
            'final_score' => $finalScore,
            'is_complete_success' => $isCompleteSuccess,
            'box_details' => $boxDetails,
            'all_correct' => $allCorrect,
            'all_placed' => $allPlaced,
        ];
    }

    public function checkMutualExclusions(Level $level, array $state): array
    {
        $boxes = $level->archiveBoxes->keyBy('id');
        $violations = [];

        $floorBoxes = [];
        foreach ($state as $boxId => $floor) {
            if ($floor !== null) {
                if (!isset($floorBoxes[$floor])) {
                    $floorBoxes[$floor] = [];
                }
                $floorBoxes[$floor][] = $boxId;
            }
        }

        $clues = $level->clues->where('is_noise', false);

        return $violations;
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
            'clues' => $level->clues->map(fn($c) => [
                'id' => $c->id,
                'content' => $c->content,
                'type' => $c->type,
            ])->values()->toArray(),
            'boxes_info' => $boxes->map(fn($b) => [
                'id' => $b->id,
                'label' => $b->label,
                'era' => $b->era,
                'classification' => $b->classification,
            ])->values()->toArray(),
        ];
    }
}

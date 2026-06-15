<?php

namespace App\Services;

use App\Models\GameSession;
use App\Models\ProbeRecord;
use App\Models\ProbeHistory;
use App\Models\ProbeResult;
use App\Models\ExpeditionLog;

class GameManager
{
    private CaveGenerator $caveGenerator;
    private SonarProbeService $sonarService;
    private ScoreCalculator $scoreCalculator;

    public function __construct(
        CaveGenerator $caveGenerator,
        SonarProbeService $sonarService,
        ScoreCalculator $scoreCalculator
    ) {
        $this->caveGenerator = $caveGenerator;
        $this->sonarService = $sonarService;
        $this->scoreCalculator = $scoreCalculator;
    }

    public function createNewSession(string $playerName = '探险家'): GameSession
    {
        $caveData = $this->caveGenerator->generate();
        $revealedMap = $this->caveGenerator->createEmptyRevealedMap();

        $startPos = $caveData['start_position'];
        $this->revealArea($revealedMap, $startPos['x'], $startPos['y'], 3, $caveData);

        $session = GameSession::create([
            'player_name' => $playerName,
            'status' => 'playing',
            'oxygen' => 100,
            'max_oxygen' => 100,
            'equipment_durability' => 100,
            'max_durability' => 100,
            'score' => 0,
            'player_x' => $startPos['x'],
            'player_y' => $startPos['y'],
            'cave_data' => $caveData,
            'revealed_map' => $revealedMap,
        ]);

        ExpeditionLog::create([
            'game_session_id' => $session->id,
            'log_type' => 'system',
            'title' => '探险开始',
            'message' => "{$playerName} 进入钟乳洞，开始声波测距探险。洞穴种子: {$caveData['seed']}",
            'details' => [
                'seed' => $caveData['seed'],
                'start_position' => $startPos,
                'metadata' => $caveData['metadata'],
            ],
            'oxygen_change' => 0,
            'durability_change' => 0,
        ]);

        return $session->fresh();
    }

    public function executeProbe(
        GameSession $session,
        float $direction,
        float $frequency,
        ?int $launchX = null,
        ?int $launchY = null
    ): array {
        if ($session->status !== 'playing') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $launchX = $launchX ?? $session->player_x;
        $launchY = $launchY ?? $session->player_y;

        $width = $session->cave_data['width'];
        $height = $session->cave_data['height'];
        $grid = $session->cave_data['grid'];
        $revealedMap = $session->revealed_map;

        if ($launchX < 0 || $launchX >= $width || $launchY < 0 || $launchY >= $height) {
            return ['success' => false, 'message' => '发射点超出洞穴边界'];
        }
        if ($grid[$launchY][$launchX] === 1) {
            return ['success' => false, 'message' => '发射点必须在通道上，不能选在墙壁中'];
        }
        if (!isset($revealedMap[$launchY][$launchX]) || !$revealedMap[$launchY][$launchX]['revealed']) {
            return ['success' => false, 'message' => '发射点必须选择在已探测的区域内'];
        }

        $sequenceNumber = $session->probeRecords()->count() + 1;

        $probeRecord = ProbeRecord::create([
            'game_session_id' => $session->id,
            'launch_point_x' => $launchX,
            'launch_point_y' => $launchY,
            'probe_direction' => $direction,
            'frequency' => $frequency,
            'sequence_number' => $sequenceNumber,
        ]);

        $result = $this->sonarService->probe(
            $session->cave_data,
            $launchX,
            $launchY,
            $direction,
            $frequency
        );

        $mapBefore = $session->revealed_map;
        $revealedMap = $session->revealed_map;
        $this->applyRevealedPoints($revealedMap, $result['revealed_points'], $session->cave_data);
        $session->revealed_map = $revealedMap;

        $probeHistory = ProbeHistory::create([
            'game_session_id' => $session->id,
            'probe_record_id' => $probeRecord->id,
            'frequency_used' => $frequency,
            'direction_used' => $direction,
            'echo_curve_data' => $result['echo_curve'],
            'revealed_points' => $result['revealed_points'],
            'map_snapshot_before' => $mapBefore,
            'map_snapshot_after' => $session->revealed_map,
            'rollback_available' => true,
        ]);

        $wallTypeLabel = match ($result['wall_type']) {
            'wet' => '潮湿墙面',
            'crack' => '裂隙',
            'collapse' => '塌方',
            'normal' => '普通岩壁',
            default => '空洞',
        };

        $notes = [];
        if ($result['is_false_echo']) {
            $notes[] = "检测到假回声信号，实际距离 {$result['actual_distance']}，测量距离 {$result['measured_distance']}";
        }
        if ($result['wet_wall_detected']) $notes[] = '检测到潮湿墙面水分干扰';
        if ($result['crack_detected']) $notes[] = '检测到裂隙结构回波散射';
        if ($result['collapse_detected']) $notes[] = '检测到塌方区域强反射';

        ProbeResult::create([
            'game_session_id' => $session->id,
            'probe_history_id' => $probeHistory->id,
            'wall_type' => $result['wall_type'],
            'is_false_echo' => $result['is_false_echo'],
            'measured_distance' => $result['measured_distance'],
            'actual_distance' => $result['actual_distance'],
            'confidence' => $result['confidence'],
            'wet_wall_detected' => $result['wet_wall_detected'],
            'crack_detected' => $result['crack_detected'],
            'collapse_detected' => $result['collapse_detected'],
            'oxygen_used' => $result['oxygen_cost'],
            'durability_used' => $result['durability_cost'],
            'analysis_notes' => implode('; ', $notes) ?: null,
        ]);

        $this->consumeResources($session, $result['oxygen_cost'], $result['durability_cost']);

        $isCustomLaunch = $launchX !== $session->player_x || $launchY !== $session->player_y;
        $launchInfo = $isCustomLaunch ? "发射点 ({$launchX},{$launchY})，" : '';

        $logTitle = "声波探测 #{$sequenceNumber}";
        $logMessage = "{$launchInfo}方向 {$direction}°，频率 {$frequency}kHz，探测到{$wallTypeLabel}，距离 {$result['measured_distance']}，置信度 " . round($result['confidence'] * 100, 1) . "%";
        if ($result['is_false_echo']) {
            $logMessage .= ' [假回声警告]';
        }

        ExpeditionLog::create([
            'game_session_id' => $session->id,
            'log_type' => $result['is_false_echo'] ? 'warning' : 'probe',
            'title' => $logTitle,
            'message' => $logMessage,
            'details' => [
                'probe_record_id' => $probeRecord->id,
                'launch_point_x' => $launchX,
                'launch_point_y' => $launchY,
                'is_custom_launch' => $isCustomLaunch,
                'direction' => $direction,
                'frequency' => $frequency,
                'wall_type' => $result['wall_type'],
                'distance' => $result['measured_distance'],
                'actual_distance' => $result['actual_distance'],
                'confidence' => $result['confidence'],
                'is_false_echo' => $result['is_false_echo'],
            ],
            'oxygen_change' => -$result['oxygen_cost'],
            'durability_change' => -$result['durability_cost'],
        ]);

        $session->revealed_map = $session->revealed_map;
        $session->save();
        $this->checkGameOver($session);

        return [
            'success' => true,
            'probe_record' => $probeRecord,
            'probe_history' => $probeHistory->fresh('probeResult'),
            'result' => $result,
            'session' => $session->fresh(),
        ];
    }

    public function movePlayer(GameSession $session, int $toX, int $toY): array
    {
        if ($session->status !== 'playing') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $result = $this->sonarService->movePlayer(
            $session->cave_data,
            $session->player_x,
            $session->player_y,
            $toX,
            $toY
        );

        if (!$result['success']) {
            $this->consumeResources($session, $result['oxygen_cost'], 0);

            ExpeditionLog::create([
                'game_session_id' => $session->id,
                'log_type' => 'warning',
                'title' => '移动失败',
                'message' => "尝试移动到 ({$toX}, {$toY}) 失败：{$result['reason']}",
                'details' => ['to_x' => $toX, 'to_y' => $toY, 'reason' => $result['reason']],
                'oxygen_change' => -$result['oxygen_cost'],
                'durability_change' => 0,
            ]);

            $session->save();
            $this->checkGameOver($session);

            return [
                'success' => false,
                'message' => $result['reason'],
                'session' => $session->fresh(),
            ];
        }

        $mapBefore = $session->revealed_map;
        $revealedMap = $session->revealed_map;
        $this->applyRevealedPoints($revealedMap, $result['revealed_points'], $session->cave_data);
        $session->revealed_map = $revealedMap;

        $session->player_x = $result['new_x'];
        $session->player_y = $result['new_y'];

        $this->consumeResources($session, $result['oxygen_cost'], 0);

        $exitPos = $session->cave_data['exit_position'] ?? null;
        $reachedExit = $exitPos && abs($session->player_x - $exitPos['x']) <= 1 && abs($session->player_y - $exitPos['y']) <= 1;

        ExpeditionLog::create([
            'game_session_id' => $session->id,
            'log_type' => $reachedExit ? 'success' : 'move',
            'title' => $reachedExit ? '到达出口' : '移动',
            'message' => $reachedExit
                ? "成功移动到 ({$result['new_x']}, {$result['new_y']})，已到达洞穴出口附近！"
                : "移动到 ({$result['new_x']}, {$result['new_y']})",
            'details' => [
                'from_x' => $session->getOriginal('player_x'),
                'from_y' => $session->getOriginal('player_y'),
                'to_x' => $result['new_x'],
                'to_y' => $result['new_y'],
                'reached_exit' => $reachedExit,
            ],
            'oxygen_change' => -$result['oxygen_cost'],
            'durability_change' => 0,
        ]);

        if ($reachedExit) {
            $session->status = 'completed';
            $session->end_time = now();
            $session->final_notes = '探险家成功到达洞穴出口！';
        }

        $session->save();
        $this->checkGameOver($session);

        return [
            'success' => true,
            'reached_exit' => $reachedExit,
            'session' => $session->fresh(),
        ];
    }

    public function rollbackProbe(GameSession $session, int $probeHistoryId): array
    {
        if ($session->status !== 'playing') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $history = ProbeHistory::where('game_session_id', $session->id)
            ->where('id', $probeHistoryId)
            ->first();

        if (!$history) {
            return ['success' => false, 'message' => '探测记录不存在'];
        }

        if (!$history->rollback_available || $history->rolled_back) {
            return ['success' => false, 'message' => '该探测记录不可回滚'];
        }

        $mapBeforeRollback = $session->revealed_map;
        $session->revealed_map = $history->map_snapshot_before;

        $probeResult = $history->probeResult;
        $oxygenRefund = (int)(($probeResult?->oxygen_used ?? 0) * 0.5);
        $durabilityRefund = (int)(($probeResult?->durability_used ?? 0) * 0.3);

        $session->oxygen = min($session->max_oxygen, $session->oxygen + $oxygenRefund);
        $session->equipment_durability = min($session->max_durability, $session->equipment_durability + $durabilityRefund);

        $history->rolled_back = true;
        $history->rollback_available = false;
        $history->save();

        ExpeditionLog::create([
            'game_session_id' => $session->id,
            'log_type' => 'system',
            'title' => '回滚探测',
            'message' => "回滚探测记录 #{$history->id}，恢复地图状态。返还氧气 {$oxygenRefund}，装备耐久 {$durabilityRefund}",
            'details' => [
                'probe_history_id' => $probeHistoryId,
                'oxygen_refund' => $oxygenRefund,
                'durability_refund' => $durabilityRefund,
            ],
            'oxygen_change' => $oxygenRefund,
            'durability_change' => $durabilityRefund,
        ]);

        $session->save();

        return [
            'success' => true,
            'oxygen_refund' => $oxygenRefund,
            'durability_refund' => $durabilityRefund,
            'session' => $session->fresh(),
        ];
    }

    public function endSession(GameSession $session, string $reason = '探险家主动结束探险'): GameSession
    {
        if ($session->status === 'playing') {
            $session->status = 'abandoned';
            $session->end_time = now();
            $session->final_notes = $reason;
        }

        $finalScore = $this->scoreCalculator->recalculate($session);
        $session->score = $finalScore;
        $session->save();

        ExpeditionLog::create([
            'game_session_id' => $session->id,
            'log_type' => 'system',
            'title' => '探险结束',
            'message' => "探险结束，最终得分: {$finalScore}。{$reason}",
            'details' => [
                'final_score' => $finalScore,
                'score_breakdown' => $this->scoreCalculator->getScoreBreakdown($session),
            ],
            'oxygen_change' => 0,
            'durability_change' => 0,
        ]);

        return $session->fresh();
    }

    private function revealArea(array &$map, int $cx, int $cy, int $radius, array $caveData): void
    {
        $width = $caveData['width'];
        $height = $caveData['height'];
        $grid = $caveData['grid'];
        $walls = $caveData['walls'];

        for ($dy = -$radius; $dy <= $radius; $dy++) {
            for ($dx = -$radius; $dx <= $radius; $dx++) {
                $x = $cx + $dx;
                $y = $cy + $dy;
                $dist = sqrt($dx * $dx + $dy * $dy);

                if ($x < 0 || $x >= $width || $y < 0 || $y >= $height) continue;
                if ($dist > $radius) continue;

                $wallKey = "{$x},{$y}";
                $isWall = $grid[$y][$x] === 1;
                $wallType = $walls[$wallKey]['type'] ?? 'normal';

                $map[$y][$x] = [
                    'revealed' => true,
                    'type' => $isWall ? $wallType : 'path',
                    'confidence' => $dist <= 1 ? 1.0 : max(0.5, 1 - $dist / ($radius + 1)),
                ];
            }
        }
    }

    private function applyRevealedPoints(array &$map, array $points, array $caveData): void
    {
        $walls = $caveData['walls'];

        foreach ($points as $point) {
            $x = $point['x'];
            $y = $point['y'];

            if (!isset($map[$y][$x])) continue;

            $wallKey = "{$x},{$y}";
            $existing = $map[$y][$x];

            if (!$existing['revealed'] || $point['confidence'] > $existing['confidence']) {
                $type = 'path';
                if (!$point['is_path']) {
                    $type = $point['wall_type'] ?? ($walls[$wallKey]['type'] ?? 'normal');
                }

                $map[$y][$x] = [
                    'revealed' => true,
                    'type' => $type,
                    'confidence' => max($existing['confidence'], $point['confidence']),
                ];
            }
        }
    }

    private function consumeResources(GameSession $session, int $oxygen, int $durability): void
    {
        $session->oxygen = max(0, $session->oxygen - $oxygen);
        $session->equipment_durability = max(0, $session->equipment_durability - $durability);
    }

    private function checkGameOver(GameSession $session): void
    {
        if ($session->status !== 'playing') return;

        if ($session->oxygen <= 0) {
            $session->status = 'failed';
            $session->end_time = now();
            $session->final_notes = '氧气耗尽，探险家在洞中迷失...';

            ExpeditionLog::create([
                'game_session_id' => $session->id,
                'log_type' => 'error',
                'title' => '氧气耗尽',
                'message' => '氧气已耗尽，探险失败！',
                'oxygen_change' => 0,
                'durability_change' => 0,
            ]);
            $session->save();
        } elseif ($session->equipment_durability <= 0) {
            ExpeditionLog::create([
                'game_session_id' => $session->id,
                'log_type' => 'warning',
                'title' => '装备损坏',
                'message' => '声波探测设备已损坏，无法继续进行精确探测，但仍可移动。',
                'oxygen_change' => 0,
                'durability_change' => 0,
            ]);
            $session->save();
        }
    }
}

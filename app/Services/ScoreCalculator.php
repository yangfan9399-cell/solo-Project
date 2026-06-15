<?php

namespace App\Services;

use App\Models\GameSession;

class ScoreCalculator
{
    public function recalculate(GameSession $session): int
    {
        $score = 0;

        $revealedMap = $session->revealed_map;
        $caveData = $session->cave_data;
        $probeResults = $session->probeResults;
        $probeHistories = $session->probeHistories;
        $expeditionLogs = $session->expeditionLogs;

        $score += $this->calculateMapRevealScore($revealedMap, $caveData);
        $score += $this->calculateAccuracyScore($probeResults);
        $score += $this->calculateEfficiencyScore($session, $probeHistories);
        $score += $this->calculateSurvivalScore($session);
        $score += $this->calculateCompletionBonus($session, $caveData);
        $score += $this->calculateHazardBonus($probeResults);

        return max(0, $score);
    }

    private function calculateMapRevealScore(array $revealedMap, array $caveData): int
    {
        $score = 0;
        $grid = $caveData['grid'];
        $walls = $caveData['walls'];

        $correctReveals = 0;
        $totalRevealed = 0;
        $totalImportant = 0;

        $width = $caveData['width'];
        $height = $caveData['height'];

        for ($y = 0; $y < $height; $y++) {
            for ($x = 0; $x < $width; $x++) {
                if (!isset($revealedMap[$y][$x])) continue;

                $cell = $revealedMap[$y][$x];
                if (!$cell['revealed']) continue;

                $totalRevealed++;
                $actualIsWall = $grid[$y][$x] === 1;
                $revealedAsWall = $cell['type'] !== 'path' && $cell['type'] !== 'unknown';

                if ($actualIsWall === $revealedAsWall) {
                    $correctReveals++;
                    if (isset($walls["{$x},{$y}"])) {
                        $wallType = $walls["{$x},{$y}"]['type'];
                        if ($wallType !== 'normal') {
                            $totalImportant++;
                            if ($cell['type'] === $wallType) {
                                $score += 15;
                            }
                        }
                    }
                } else {
                    $score -= 5;
                }
            }
        }

        if ($totalRevealed > 0) {
            $accuracy = $correctReveals / $totalRevealed;
            $score += (int)($accuracy * 100);
        }

        $coverage = $totalRevealed / ($width * $height);
        $score += (int)($coverage * 200);

        return $score;
    }

    private function calculateAccuracyScore($probeResults): int
    {
        $score = 0;
        $total = 0;
        $accurate = 0;

        foreach ($probeResults as $result) {
            $total++;
            if (!$result->is_false_echo) {
                $accurate++;
                if ($result->confidence >= 0.8) {
                    $score += 10;
                } else {
                    $score += 5;
                }
            } else {
                $score -= 8;
            }

            if ($result->actual_distance !== null) {
                $errorMargin = abs($result->measured_distance - $result->actual_distance) / $result->actual_distance;
                if ($errorMargin < 0.05) {
                    $score += 15;
                } elseif ($errorMargin < 0.15) {
                    $score += 8;
                } elseif ($errorMargin < 0.3) {
                    $score += 3;
                }
            }
        }

        if ($total > 0) {
            $accuracyRate = $accurate / $total;
            $score += (int)($accuracyRate * 150);
        }

        return $score;
    }

    private function calculateEfficiencyScore(GameSession $session, $probeHistories): int
    {
        $score = 0;

        $totalProbes = count($probeHistories);
        $rolledBack = 0;
        foreach ($probeHistories as $h) {
            if ($h->rolled_back) $rolledBack++;
        }

        if ($totalProbes > 0) {
            $efficiency = 1 - ($rolledBack / $totalProbes);
            $score += (int)($efficiency * 80);
        }

        $oxygenUsed = $session->max_oxygen - $session->oxygen;
        if ($oxygenUsed > 0) {
            $oxygenEfficiency = max(0, 1 - $oxygenUsed / $session->max_oxygen);
            $score += (int)($oxygenEfficiency * 100);
        }

        $durabilityUsed = $session->max_durability - $session->equipment_durability;
        if ($durabilityUsed > 0) {
            $durabilityEfficiency = max(0, 1 - $durabilityUsed / $session->max_durability);
            $score += (int)($durabilityEfficiency * 60);
        }

        return $score;
    }

    private function calculateSurvivalScore(GameSession $session): int
    {
        $score = 0;

        if ($session->oxygen > 20) {
            $score += 50;
        }
        if ($session->oxygen > 50) {
            $score += 30;
        }

        if ($session->equipment_durability > 20) {
            $score += 30;
        }
        if ($session->equipment_durability > 50) {
            $score += 20;
        }

        if ($session->status === 'failed') {
            $score -= 100;
        }

        return $score;
    }

    private function calculateCompletionBonus(GameSession $session, array $caveData): int
    {
        $score = 0;

        if ($session->status === 'completed') {
            $score += 500;

            $exitPos = $caveData['exit_position'] ?? null;
            if ($exitPos) {
                $dist = abs($session->player_x - $exitPos['x']) + abs($session->player_y - $exitPos['y']);
                if ($dist <= 2) {
                    $score += 200;
                }
            }
        }

        return $score;
    }

    private function calculateHazardBonus($probeResults): int
    {
        $score = 0;

        $wetDetected = 0;
        $crackDetected = 0;
        $collapseDetected = 0;

        foreach ($probeResults as $result) {
            if ($result->wet_wall_detected) $wetDetected++;
            if ($result->crack_detected) $crackDetected++;
            if ($result->collapse_detected) $collapseDetected++;
        }

        $score += $wetDetected * 8;
        $score += $crackDetected * 12;
        $score += $collapseDetected * 18;

        return $score;
    }

    public function getScoreBreakdown(GameSession $session): array
    {
        $revealedMap = $session->revealed_map;
        $caveData = $session->cave_data;
        $probeResults = $session->probeResults;
        $probeHistories = $session->probeHistories;

        return [
            'map_reveal' => $this->calculateMapRevealScore($revealedMap, $caveData),
            'accuracy' => $this->calculateAccuracyScore($probeResults),
            'efficiency' => $this->calculateEfficiencyScore($session, $probeHistories),
            'survival' => $this->calculateSurvivalScore($session),
            'completion' => $this->calculateCompletionBonus($session, $caveData),
            'hazard' => $this->calculateHazardBonus($probeResults),
            'total' => $this->recalculate($session),
        ];
    }
}

<?php

namespace App\Services;

class SonarProbeService
{
    private const MAX_RANGE = 25;
    private const BASE_ACCURACY = 0.85;

    public function probe(
        array $caveData,
        int $startX,
        int $startY,
        float $direction,
        float $frequency
    ): array {
        $width = $caveData['width'];
        $height = $caveData['height'];
        $grid = $caveData['grid'];
        $walls = $caveData['walls'];

        $rad = deg2rad($direction);
        $dx = cos($rad);
        $dy = sin($rad);

        $echoCurve = [];
        $revealedPoints = [];
        $hitWall = null;
        $distance = 0;
        $isFalseEcho = false;
        $falseEchoDistance = null;
        $wallType = 'empty';
        $wetDetected = false;
        $crackDetected = false;
        $collapseDetected = false;

        $steps = self::MAX_RANGE * 2;
        for ($i = 1; $i <= $steps; $i++) {
            $t = $i * 0.5;
            $x = (int)round($startX + $dx * $t);
            $y = (int)round($startY + $dy * $t);

            if ($x < 0 || $x >= $width || $y < 0 || $y >= $height) {
                $distance = $t;
                $wallType = 'empty';
                break;
            }

            $signal = $this->calculateSignalStrength($t, $frequency);

            if ($revealedPoints || !$this->pointAlreadyRevealed($revealedPoints, $x, $y)) {
                $revealedPoints[] = [
                    'x' => $x,
                    'y' => $y,
                    'distance' => $t,
                    'is_path' => true,
                    'confidence' => min(1.0, $signal / 100 + 0.3),
                ];
            }

            $wallKey = "{$x},{$y}";
            if ($grid[$y][$x] === 1) {
                $distance = $t;

                if (isset($walls[$wallKey])) {
                    $hitWall = $walls[$wallKey];
                    $wallType = $hitWall['type'];

                    if ($wallType === 'wet') $wetDetected = true;
                    if ($wallType === 'crack') $crackDetected = true;
                    if ($wallType === 'collapse') $collapseDetected = true;

                    $isFalseEcho = $this->shouldGenerateFalseEcho($wallType, $frequency);
                    if ($isFalseEcho) {
                        $falseEchoDistance = $this->calculateFalseEchoDistance($distance, $wallType);
                    }
                }

                $revealedPoints[] = [
                    'x' => $x,
                    'y' => $y,
                    'distance' => $t,
                    'is_path' => false,
                    'wall_type' => $wallType,
                    'confidence' => $this->calculateConfidence($wallType, $frequency, $distance),
                ];
                break;
            }

            if ($t >= self::MAX_RANGE) {
                $distance = self::MAX_RANGE;
                $wallType = 'empty';
                break;
            }
        }

        $echoCurve = $this->generateEchoCurve(
            $distance,
            $isFalseEcho ? $falseEchoDistance : null,
            $frequency,
            $wallType
        );

        $displayDistance = $isFalseEcho && $falseEchoDistance !== null ? $falseEchoDistance : $distance;

        return [
            'hit_wall' => $hitWall,
            'wall_type' => $wallType,
            'actual_distance' => round($distance, 2),
            'measured_distance' => round($displayDistance, 2),
            'is_false_echo' => $isFalseEcho,
            'confidence' => $this->calculateOverallConfidence($wallType, $frequency, $distance),
            'wet_wall_detected' => $wetDetected,
            'crack_detected' => $crackDetected,
            'collapse_detected' => $collapseDetected,
            'echo_curve' => $echoCurve,
            'revealed_points' => $revealedPoints,
            'oxygen_cost' => $this->calculateOxygenCost($frequency, $distance),
            'durability_cost' => $this->calculateDurabilityCost($wallType, $frequency),
        ];
    }

    private function calculateSignalStrength(float $distance, float $frequency): float
    {
        $base = 100 * exp(-$distance * 0.08);
        $freqFactor = 1.0 - abs($frequency - 40) / 100;
        return max(5, $base * max(0.3, $freqFactor));
    }

    private function pointAlreadyRevealed(array $points, int $x, int $y): bool
    {
        foreach ($points as $p) {
            if ($p['x'] === $x && $p['y'] === $y) return true;
        }
        return false;
    }

    private function shouldGenerateFalseEcho(string $wallType, float $frequency): bool
    {
        $baseChance = match ($wallType) {
            'wet' => 0.35,
            'crack' => 0.45,
            'collapse' => 0.55,
            default => 0.05,
        };

        if ($frequency < 20 || $frequency > 80) {
            $baseChance += 0.15;
        }

        return mt_rand(0, 1000) / 1000 < $baseChance;
    }

    private function calculateFalseEchoDistance(float $realDistance, string $wallType): float
    {
        $factor = match ($wallType) {
            'wet' => 0.7 + mt_rand(0, 200) / 1000,
            'crack' => 1.15 + mt_rand(0, 300) / 1000,
            'collapse' => 0.5 + mt_rand(0, 500) / 1000,
            default => 1.0 + mt_rand(-100, 100) / 1000,
        };
        return $realDistance * $factor;
    }

    private function calculateConfidence(string $wallType, float $frequency, float $distance): float
    {
        $base = self::BASE_ACCURACY;

        if ($wallType === 'wet') $base -= 0.15;
        if ($wallType === 'crack') $base -= 0.2;
        if ($wallType === 'collapse') $base -= 0.3;

        if ($frequency >= 30 && $frequency <= 55) {
            $base += 0.08;
        } else {
            $base -= 0.1;
        }

        if ($distance > 15) $base -= 0.1;
        if ($distance > 20) $base -= 0.1;

        return max(0.2, min(0.98, $base));
    }

    private function calculateOverallConfidence(string $wallType, float $frequency, float $distance): float
    {
        return $this->calculateConfidence($wallType, $frequency, $distance);
    }

    private function generateEchoCurve(
        float $distance,
        ?float $falseDistance,
        float $frequency,
        string $wallType
    ): array {
        $curve = [];
        $maxT = max($distance, ($falseDistance ?? 0)) + 3;

        for ($t = 0; $t <= $maxT; $t += 0.2) {
            $amplitude = 0;

            $noise = sin($t * 3 + $frequency * 0.1) * 0.05 + (mt_rand(-50, 50) / 1000);
            $amplitude += $noise;

            $decay = exp(-$t * 0.12);
            $baseSignal = sin($t * ($frequency / 10)) * $decay * 0.3;
            $amplitude += $baseSignal;

            if ($t >= $distance - 0.3 && $t <= $distance + 0.3) {
                $peakWidth = 0.6;
                $peakFactor = exp(-pow(($t - $distance) / $peakWidth, 2));
                $peakAmp = match ($wallType) {
                    'wet' => 0.6,
                    'crack' => 0.4,
                    'collapse' => 0.8,
                    'normal' => 0.9,
                    default => 0.0,
                };
                $amplitude += $peakFactor * $peakAmp;
            }

            if ($falseDistance !== null && $t >= $falseDistance - 0.3 && $t <= $falseDistance + 0.3) {
                $peakWidth = 0.8;
                $peakFactor = exp(-pow(($t - $falseDistance) / $peakWidth, 2));
                $amplitude += $peakFactor * 0.5;
            }

            $curve[] = [
                't' => round($t, 1),
                'amplitude' => round($amplitude, 4),
            ];
        }

        return $curve;
    }

    private function calculateOxygenCost(float $frequency, float $distance): int
    {
        $base = 2;
        $freqCost = (int)(abs($frequency - 40) / 15);
        $distCost = (int)($distance / 8);
        return max(1, $base + $freqCost + $distCost);
    }

    private function calculateDurabilityCost(string $wallType, float $frequency): int
    {
        $base = 1;
        $wallCost = match ($wallType) {
            'collapse' => 5,
            'crack' => 3,
            'wet' => 2,
            default => 1,
        };
        $freqCost = $frequency > 60 ? 2 : 1;
        return $base + (int)(($wallCost + $freqCost) / 2);
    }

    public function movePlayer(
        array $caveData,
        int $fromX,
        int $fromY,
        int $toX,
        int $toY
    ): array {
        $width = $caveData['width'];
        $height = $caveData['height'];
        $grid = $caveData['grid'];

        if ($toX < 0 || $toX >= $width || $toY < 0 || $toY >= $height) {
            return [
                'success' => false,
                'reason' => '超出洞穴边界',
                'oxygen_cost' => 3,
            ];
        }

        if ($grid[$toY][$toX] === 1) {
            return [
                'success' => false,
                'reason' => '前方是墙壁，无法通过',
                'oxygen_cost' => 2,
            ];
        }

        $dist = abs($toX - $fromX) + abs($toY - $fromY);
        if ($dist > 5) {
            return [
                'success' => false,
                'reason' => '每次移动距离不能超过5格',
                'oxygen_cost' => 1,
            ];
        }

        $revealedPoints = [];
        for ($dy = -2; $dy <= 2; $dy++) {
            for ($dx = -2; $dx <= 2; $dx++) {
                $rx = $toX + $dx;
                $ry = $toY + $dy;
                if ($rx >= 0 && $rx < $width && $ry >= 0 && $ry < $height) {
                    $revealedPoints[] = [
                        'x' => $rx,
                        'y' => $ry,
                        'distance' => sqrt($dx * $dx + $dy * $dy),
                        'is_path' => $grid[$ry][$rx] === 0,
                        'confidence' => $grid[$ry][$rx] === 0 ? 0.95 : 0.6,
                    ];
                }
            }
        }

        return [
            'success' => true,
            'new_x' => $toX,
            'new_y' => $toY,
            'revealed_points' => $revealedPoints,
            'oxygen_cost' => max(1, (int)($dist * 0.8)),
        ];
    }
}

<?php

namespace App\Services;

class CaveGenerator
{
    private int $width;
    private int $height;
    private int $seed;

    public function __construct(int $width = 40, int $height = 40, ?int $seed = null)
    {
        $this->width = $width;
        $this->height = $height;
        $this->seed = $seed ?? random_int(1, 999999);
        mt_srand($this->seed);
    }

    public function generate(): array
    {
        $grid = $this->createBaseGrid();
        $grid = $this->applyCellularAutomata($grid, 4);
        $grid = $this->carvePassages($grid);
        $walls = $this->identifyWalls($grid);
        $hazards = $this->placeHazards($walls);
        $startPos = $this->findStartPosition($grid);
        $exitPos = $this->findExitPosition($grid, $startPos);

        return [
            'seed' => $this->seed,
            'width' => $this->width,
            'height' => $this->height,
            'grid' => $grid,
            'walls' => $hazards,
            'start_position' => $startPos,
            'exit_position' => $exitPos,
            'metadata' => [
                'total_cells' => $this->width * $this->height,
                'passable_cells' => $this->countPassable($grid),
                'wall_cells' => $this->countWalls($walls),
                'wet_walls' => $this->countHazardType($hazards, 'wet'),
                'cracks' => $this->countHazardType($hazards, 'crack'),
                'collapses' => $this->countHazardType($hazards, 'collapse'),
            ],
        ];
    }

    private function createBaseGrid(): array
    {
        $grid = [];
        for ($y = 0; $y < $this->height; $y++) {
            for ($x = 0; $x < $this->width; $x++) {
                if ($x === 0 || $x === $this->width - 1 || $y === 0 || $y === $this->height - 1) {
                    $grid[$y][$x] = 1;
                } else {
                    $grid[$y][$x] = mt_rand(0, 100) < 45 ? 1 : 0;
                }
            }
        }
        return $grid;
    }

    private function applyCellularAutomata(array $grid, int $iterations): array
    {
        for ($i = 0; $i < $iterations; $i++) {
            $newGrid = $grid;
            for ($y = 1; $y < $this->height - 1; $y++) {
                for ($x = 1; $x < $this->width - 1; $x++) {
                    $walls = $this->countWallNeighbors($grid, $x, $y);
                    if ($walls > 4) {
                        $newGrid[$y][$x] = 1;
                    } elseif ($walls < 4) {
                        $newGrid[$y][$x] = 0;
                    }
                }
            }
            $grid = $newGrid;
        }
        return $grid;
    }

    private function countWallNeighbors(array $grid, int $cx, int $cy): int
    {
        $count = 0;
        for ($dy = -1; $dy <= 1; $dy++) {
            for ($dx = -1; $dx <= 1; $dx++) {
                if ($dx === 0 && $dy === 0) continue;
                $nx = $cx + $dx;
                $ny = $cy + $dy;
                if ($nx < 0 || $nx >= $this->width || $ny < 0 || $ny >= $this->height) {
                    $count++;
                } elseif ($grid[$ny][$nx] === 1) {
                    $count++;
                }
            }
        }
        return $count;
    }

    private function carvePassages(array $grid): array
    {
        $regions = $this->findRegions($grid);
        if (count($regions) <= 1) return $grid;

        $mainRegion = $regions[0];
        for ($i = 1; $i < count($regions); $i++) {
            $this->connectRegions($grid, $mainRegion, $regions[$i]);
        }
        return $grid;
    }

    private function findRegions(array $grid): array
    {
        $visited = [];
        $regions = [];
        for ($y = 0; $y < $this->height; $y++) {
            for ($x = 0; $x < $this->width; $x++) {
                if ($grid[$y][$x] === 0 && !isset($visited[$y][$x])) {
                    $region = [];
                    $this->floodFill($grid, $x, $y, $visited, $region);
                    if (count($region) > 10) {
                        $regions[] = $region;
                    }
                }
            }
        }
        usort($regions, fn($a, $b) => count($b) - count($a));
        return $regions;
    }

    private function floodFill(array $grid, int $x, int $y, array &$visited, array &$region): void
    {
        if ($x < 0 || $x >= $this->width || $y < 0 || $y >= $this->height) return;
        if (isset($visited[$y][$x]) || $grid[$y][$x] !== 0) return;

        $visited[$y][$x] = true;
        $region[] = ['x' => $x, 'y' => $y];

        $this->floodFill($grid, $x + 1, $y, $visited, $region);
        $this->floodFill($grid, $x - 1, $y, $visited, $region);
        $this->floodFill($grid, $x, $y + 1, $visited, $region);
        $this->floodFill($grid, $x, $y - 1, $visited, $region);
    }

    private function connectRegions(array &$grid, array $regionA, array $regionB): void
    {
        $pointA = $regionA[array_rand($regionA)];
        $pointB = $regionB[array_rand($regionB)];

        $x = $pointA['x'];
        $y = $pointA['y'];

        while ($x !== $pointB['x'] || $y !== $pointB['y']) {
            $grid[$y][$x] = 0;
            if (mt_rand(0, 1) === 0) {
                if ($x < $pointB['x']) $x++;
                elseif ($x > $pointB['x']) $x--;
            } else {
                if ($y < $pointB['y']) $y++;
                elseif ($y > $pointB['y']) $y--;
            }
        }
        $grid[$y][$x] = 0;
    }

    private function identifyWalls(array $grid): array
    {
        $walls = [];
        for ($y = 0; $y < $this->height; $y++) {
            for ($x = 0; $x < $this->width; $x++) {
                if ($grid[$y][$x] === 1) {
                    $hasPassableNeighbor = false;
                    for ($dy = -1; $dy <= 1; $dy++) {
                        for ($dx = -1; $dx <= 1; $dx++) {
                            $nx = $x + $dx;
                            $ny = $y + $dy;
                            if ($nx >= 0 && $nx < $this->width && $ny >= 0 && $ny < $this->height) {
                                if ($grid[$ny][$nx] === 0) {
                                    $hasPassableNeighbor = true;
                                    break 2;
                                }
                            }
                        }
                    }
                    if ($hasPassableNeighbor) {
                        $walls["{$x},{$y}"] = [
                            'x' => $x,
                            'y' => $y,
                            'type' => 'normal',
                        ];
                    }
                }
            }
        }
        return $walls;
    }

    private function placeHazards(array $walls): array
    {
        $wallKeys = array_keys($walls);
        $totalWalls = count($wallKeys);

        $wetCount = (int)($totalWalls * 0.12);
        $crackCount = (int)($totalWalls * 0.08);
        $collapseCount = (int)($totalWalls * 0.05);

        shuffle($wallKeys);

        $idx = 0;
        for ($i = 0; $i < $wetCount && $idx < $totalWalls; $i++, $idx++) {
            $walls[$wallKeys[$idx]]['type'] = 'wet';
        }
        for ($i = 0; $i < $crackCount && $idx < $totalWalls; $i++, $idx++) {
            $walls[$wallKeys[$idx]]['type'] = 'crack';
        }
        for ($i = 0; $i < $collapseCount && $idx < $totalWalls; $i++, $idx++) {
            $walls[$wallKeys[$idx]]['type'] = 'collapse';
        }

        return $walls;
    }

    private function findStartPosition(array $grid): array
    {
        for ($y = 2; $y < $this->height - 2; $y++) {
            for ($x = 2; $x < $this->width - 2; $x++) {
                if ($grid[$y][$x] === 0) {
                    return ['x' => $x, 'y' => $y];
                }
            }
        }
        return ['x' => (int)($this->width / 2), 'y' => (int)($this->height / 2)];
    }

    private function findExitPosition(array $grid, array $startPos): array
    {
        $maxDist = 0;
        $exitPos = $startPos;

        for ($y = 2; $y < $this->height - 2; $y++) {
            for ($x = 2; $x < $this->width - 2; $x++) {
                if ($grid[$y][$x] === 0) {
                    $dist = abs($x - $startPos['x']) + abs($y - $startPos['y']);
                    if ($dist > $maxDist) {
                        $maxDist = $dist;
                        $exitPos = ['x' => $x, 'y' => $y];
                    }
                }
            }
        }
        return $exitPos;
    }

    private function countPassable(array $grid): int
    {
        $count = 0;
        for ($y = 0; $y < $this->height; $y++) {
            for ($x = 0; $x < $this->width; $x++) {
                if ($grid[$y][$x] === 0) $count++;
            }
        }
        return $count;
    }

    private function countWalls(array $walls): int
    {
        return count($walls);
    }

    private function countHazardType(array $walls, string $type): int
    {
        $count = 0;
        foreach ($walls as $wall) {
            if ($wall['type'] === $type) $count++;
        }
        return $count;
    }

    public function createEmptyRevealedMap(): array
    {
        $map = [];
        for ($y = 0; $y < $this->height; $y++) {
            for ($x = 0; $x < $this->width; $x++) {
                $map[$y][$x] = [
                    'revealed' => false,
                    'type' => 'unknown',
                    'confidence' => 0,
                ];
            }
        }
        return $map;
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\GameSession;
use App\Services\GameManager;
use App\Services\ScoreCalculator;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;

class GameController extends Controller
{
    private GameManager $gameManager;
    private ScoreCalculator $scoreCalculator;

    public function __construct(GameManager $gameManager, ScoreCalculator $scoreCalculator)
    {
        $this->gameManager = $gameManager;
        $this->scoreCalculator = $scoreCalculator;
    }

    public function index(): View
    {
        $sessions = GameSession::orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return view('game.index', compact('sessions'));
    }

    public function create(Request $request): RedirectResponse
    {
        $playerName = $request->input('player_name', '探险家');
        $session = $this->gameManager->createNewSession($playerName);

        return redirect()->route('game.show', ['session' => $session->id]);
    }

    public function show(GameSession $session): View
    {
        $session->load([
            'probeRecords' => fn($q) => $q->orderBy('sequence_number'),
            'probeHistories' => fn($q) => $q->orderBy('processed_at')->with('probeResult'),
            'expeditionLogs' => fn($q) => $q->orderBy('created_at', 'desc')->limit(50),
        ]);

        $scoreBreakdown = $this->scoreCalculator->getScoreBreakdown($session);
        $caveData = $session->cave_data;

        return view('game.show', compact('session', 'scoreBreakdown', 'caveData'));
    }

    public function probe(Request $request, GameSession $session): JsonResponse
    {
        $request->validate([
            'direction' => 'required|numeric|min:0|max:360',
            'frequency' => 'required|numeric|min:10|max:100',
            'launch_x' => 'nullable|integer|min:0',
            'launch_y' => 'nullable|integer|min:0',
        ]);

        $launchX = $request->has('launch_x') && $request->has('launch_y')
            ? (int)$request->launch_x
            : null;
        $launchY = $request->has('launch_x') && $request->has('launch_y')
            ? (int)$request->launch_y
            : null;

        $result = $this->gameManager->executeProbe(
            $session,
            (float)$request->direction,
            (float)$request->frequency,
            $launchX,
            $launchY
        );

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json([
            'success' => true,
            'probe_history_id' => $result['probe_history']->id,
            'echo_curve' => $result['result']['echo_curve'],
            'measured_distance' => $result['result']['measured_distance'],
            'actual_distance' => $result['result']['actual_distance'],
            'wall_type' => $result['result']['wall_type'],
            'confidence' => $result['result']['confidence'],
            'is_false_echo' => $result['result']['is_false_echo'],
            'revealed_count' => count($result['result']['revealed_points']),
            'launch_point_x' => $result['probe_record']->launch_point_x,
            'launch_point_y' => $result['probe_record']->launch_point_y,
            'session' => [
                'oxygen' => $result['session']->oxygen,
                'max_oxygen' => $result['session']->max_oxygen,
                'equipment_durability' => $result['session']->equipment_durability,
                'max_durability' => $result['session']->max_durability,
                'status' => $result['session']->status,
            ],
        ]);
    }

    public function move(Request $request, GameSession $session): JsonResponse
    {
        $request->validate([
            'x' => 'required|integer|min:0',
            'y' => 'required|integer|min:0',
        ]);

        $result = $this->gameManager->movePlayer(
            $session,
            (int)$request->x,
            (int)$request->y
        );

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json([
            'success' => true,
            'reached_exit' => $result['reached_exit'] ?? false,
            'player_x' => $result['session']->player_x,
            'player_y' => $result['session']->player_y,
            'session' => [
                'oxygen' => $result['session']->oxygen,
                'max_oxygen' => $result['session']->max_oxygen,
                'equipment_durability' => $result['session']->equipment_durability,
                'max_durability' => $result['session']->max_durability,
                'status' => $result['session']->status,
            ],
        ]);
    }

    public function rollback(Request $request, GameSession $session): JsonResponse
    {
        $request->validate([
            'probe_history_id' => 'required|integer',
        ]);

        $result = $this->gameManager->rollbackProbe(
            $session,
            (int)$request->probe_history_id
        );

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json([
            'success' => true,
            'oxygen_refund' => $result['oxygen_refund'],
            'durability_refund' => $result['durability_refund'],
            'session' => [
                'oxygen' => $result['session']->oxygen,
                'max_oxygen' => $result['session']->max_oxygen,
                'equipment_durability' => $result['session']->equipment_durability,
                'max_durability' => $result['session']->max_durability,
            ],
        ]);
    }

    public function end(GameSession $session): RedirectResponse
    {
        $session = $this->gameManager->endSession($session);

        return redirect()->route('game.result', ['session' => $session->id]);
    }

    public function result(GameSession $session): View
    {
        $session->load([
            'probeRecords',
            'probeHistories' => fn($q) => $q->with('probeResult'),
            'probeResults',
            'expeditionLogs' => fn($q) => $q->orderBy('created_at', 'desc'),
        ]);

        $finalScore = $this->scoreCalculator->recalculate($session);
        $scoreBreakdown = $this->scoreCalculator->getScoreBreakdown($session);

        if ($session->score !== $finalScore) {
            $session->score = $finalScore;
            $session->save();
        }

        return view('game.result', compact('session', 'scoreBreakdown', 'finalScore'));
    }

    public function getMapData(GameSession $session): JsonResponse
    {
        $caveData = $session->cave_data;
        $revealedMap = $session->revealed_map;

        $mapDiff = $this->calculateMapDifference($caveData, $revealedMap);

        return response()->json([
            'width' => $caveData['width'],
            'height' => $caveData['height'],
            'player_x' => $session->player_x,
            'player_y' => $session->player_y,
            'exit_x' => $caveData['exit_position']['x'] ?? null,
            'exit_y' => $caveData['exit_position']['y'] ?? null,
            'revealed_map' => $revealedMap,
            'actual_grid' => $caveData['grid'],
            'actual_walls' => $caveData['walls'],
            'map_diff' => $mapDiff,
            'revealed_percentage' => $mapDiff['revealed_percentage'],
            'accuracy_percentage' => $mapDiff['accuracy_percentage'],
        ]);
    }

    private function calculateMapDifference(array $caveData, array $revealedMap): array
    {
        $grid = $caveData['grid'];
        $width = $caveData['width'];
        $height = $caveData['height'];

        $totalCells = $width * $height;
        $revealedCount = 0;
        $correctCount = 0;
        $differences = [];

        for ($y = 0; $y < $height; $y++) {
            for ($x = 0; $x < $width; $x++) {
                if (!isset($revealedMap[$y][$x])) continue;

                $cell = $revealedMap[$y][$x];
                if (!$cell['revealed']) continue;

                $revealedCount++;
                $actualIsWall = $grid[$y][$x] === 1;
                $revealedAsWall = $cell['type'] !== 'path' && $cell['type'] !== 'unknown';

                if ($actualIsWall === $revealedAsWall) {
                    $correctCount++;
                } else {
                    $differences[] = [
                        'x' => $x,
                        'y' => $y,
                        'revealed_type' => $cell['type'],
                        'actual_is_wall' => $actualIsWall,
                    ];
                }
            }
        }

        return [
            'total_cells' => $totalCells,
            'revealed_count' => $revealedCount,
            'correct_count' => $correctCount,
            'revealed_percentage' => $totalCells > 0 ? round($revealedCount / $totalCells * 100, 1) : 0,
            'accuracy_percentage' => $revealedCount > 0 ? round($correctCount / $revealedCount * 100, 1) : 0,
            'differences' => $differences,
        ];
    }
}

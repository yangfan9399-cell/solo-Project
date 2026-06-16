<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\Level;
use App\Models\GameSession;
use App\Services\GameService;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\JsonResponse;

class GameController extends Controller
{
    protected GameService $gameService;

    public function __construct(GameService $gameService)
    {
        $this->gameService = $gameService;
    }

    public function index(Request $request): View
    {
        $playerId = $request->session()->get('player_id');
        $player = $playerId ? Player::find($playerId) : null;

        $levels = Level::withCount('archiveBoxes')->get();
        $players = Player::orderBy('total_score', 'desc')->take(10)->get();

        return view('game.index', compact('player', 'levels', 'players'));
    }

    public function selectPlayer(Request $request): JsonResponse
    {
        $name = trim($request->input('name', ''));

        if ($name === '__logout__') {
            $request->session()->forget('player_id');
            return response()->json(['success' => true, 'logged_out' => true]);
        }

        if (empty($name)) {
            return response()->json(['error' => '请输入玩家名称'], 400);
        }

        $player = Player::firstOrCreate(
            ['name' => $name],
            [
                'total_score' => 0,
                'games_played' => 0,
                'games_won' => 0,
                'best_streak' => 0,
                'current_streak' => 0,
            ]
        );

        $request->session()->put('player_id', $player->id);

        return response()->json([
            'success' => true,
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
                'total_score' => $player->total_score,
                'games_played' => $player->games_played,
                'games_won' => $player->games_won,
                'best_streak' => $player->best_streak,
                'current_streak' => $player->current_streak,
            ],
        ]);
    }

    public function startGame(Request $request, Level $level): JsonResponse
    {
        $player = $this->getCurrentPlayer($request);
        if (!$player) {
            return response()->json(['error' => '请先选择玩家'], 401);
        }

        $session = $this->gameService->startGame($player, $level);
        $gameState = $this->gameService->getGameState($session);

        return response()->json([
            'success' => true,
            'session_id' => $session->id,
            'game_state' => $gameState,
        ]);
    }

    public function moveBox(Request $request, GameSession $session): JsonResponse
    {
        $player = $this->getCurrentPlayer($request);
        if (!$player || $session->player_id !== $player->id) {
            return response()->json(['error' => '无权操作此游戏'], 403);
        }

        $boxId = (int) $request->input('box_id');
        $toFloor = $request->input('to_floor') !== null ? (int) $request->input('to_floor') : null;

        try {
            $result = $this->gameService->moveBox($session, $boxId, $toFloor);
            return response()->json([
                'success' => true,
                'state' => $result['state'],
                'changed' => $result['changed'],
                'operation_count' => $session->fresh()->operation_count,
                'undo_count' => $session->fresh()->undo_count,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function undo(Request $request, GameSession $session): JsonResponse
    {
        $player = $this->getCurrentPlayer($request);
        if (!$player || $session->player_id !== $player->id) {
            return response()->json(['error' => '无权操作此游戏'], 403);
        }

        try {
            $result = $this->gameService->undoLastOperation($session);
            return response()->json([
                'success' => true,
                'state' => $result['state'],
                'undone' => $result['undone'],
                'operation_count' => $session->fresh()->operation_count,
                'undo_count' => $session->fresh()->undo_count,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function submitReport(Request $request, GameSession $session): JsonResponse
    {
        $player = $this->getCurrentPlayer($request);
        if (!$player || $session->player_id !== $player->id) {
            return response()->json(['error' => '无权操作此游戏'], 403);
        }

        $playerAssessment = [
            'noise_clue_ids' => $request->input('noise_clue_ids', []),
            'notes' => $request->input('notes', ''),
        ];

        try {
            $result = $this->gameService->submitReport($session, $playerAssessment);
            $player->refresh();

            $gameState = $this->gameService->getGameState($session);
            $gameState['final_result'] = $result;
            $allClues = $session->level->clues;
            foreach ($gameState['clues'] as &$clue) {
                $actual = $allClues->firstWhere('id', $clue['id']);
                if ($actual) {
                    $clue['is_noise'] = $actual->is_noise;
                }
            }

            return response()->json([
                'success' => true,
                'result' => $result,
                'game_state' => $gameState,
                'session_status' => $session->status,
                'player' => [
                    'total_score' => $player->total_score,
                    'games_played' => $player->games_played,
                    'games_won' => $player->games_won,
                    'current_streak' => $player->current_streak,
                    'best_streak' => $player->best_streak,
                ],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function gameState(Request $request, GameSession $session): JsonResponse
    {
        $player = $this->getCurrentPlayer($request);
        if (!$player || $session->player_id !== $player->id) {
            return response()->json(['error' => '无权查看此游戏'], 403);
        }

        $gameState = $this->gameService->getGameState($session);

        if ($session->status !== 'playing') {
            $report = json_decode($session->final_report, true);
            $gameState['final_result'] = $report['breakdown'] ?? null;

            $allClues = $session->level->clues;
            foreach ($gameState['clues'] as &$clue) {
                $actual = $allClues->firstWhere('id', $clue['id']);
                if ($actual) {
                    $clue['is_noise'] = $actual->is_noise;
                }
            }
        }

        return response()->json([
            'success' => true,
            'game_state' => $gameState,
            'session_status' => $session->status,
        ]);
    }

    public function play(Request $request): View
    {
        $player = $this->getCurrentPlayer($request);
        if (!$player) {
            return redirect()->route('game.index');
        }

        return view('game.play', compact('player'));
    }

    public function resume(Request $request): View
    {
        $player = $this->getCurrentPlayer($request);
        if (!$player) {
            return redirect()->route('game.index');
        }

        $sessions = GameSession::where('player_id', $player->id)
            ->where('status', 'playing')
            ->with('level')
            ->orderBy('updated_at', 'desc')
            ->get();

        $completedSessions = GameSession::where('player_id', $player->id)
            ->whereIn('status', ['won', 'lost'])
            ->with('level')
            ->orderBy('completed_at', 'desc')
            ->take(10)
            ->get();

        return view('game.resume', compact('player', 'sessions', 'completedSessions'));
    }

    public function history(Request $request): JsonResponse
    {
        $player = $this->getCurrentPlayer($request);
        if (!$player) {
            return response()->json(['error' => '请先选择玩家'], 401);
        }

        $sessions = GameSession::where('player_id', $player->id)
            ->with('level')
            ->orderBy('updated_at', 'desc')
            ->take(20)
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'level_name' => $s->level->name,
                'status' => $s->status,
                'score' => $s->score,
                'started_at' => $s->started_at?->format('Y-m-d H:i'),
                'completed_at' => $s->completed_at?->format('Y-m-d H:i'),
            ]);

        return response()->json(['sessions' => $sessions]);
    }

    protected function getCurrentPlayer(Request $request): ?Player
    {
        $playerId = $request->session()->get('player_id');
        return $playerId ? Player::find($playerId) : null;
    }
}

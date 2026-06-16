<?php

namespace App\Http\Controllers;

use App\Services\GlueGameService;
use App\Models\Level;
use App\Models\Material;
use App\Models\GameSession;
use App\Models\Recipe;
use App\Models\UserProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GameController extends Controller
{
    protected $gameService;

    public function __construct(GlueGameService $gameService)
    {
        $this->gameService = $gameService;
    }

    public function index()
    {
        $user = Auth::user();
        $levels = Level::active()->ordered()->get();

        $levelsWithStatus = $levels->map(function ($level) use ($user) {
            $progress = UserProgress::where('user_id', $user->id)
                ->where('level_id', $level->id)
                ->first();

            $isUnlocked = $this->gameService->isLevelUnlocked($user, $level);

            return [
                ...$level->toArray(),
                'is_unlocked' => $isUnlocked,
                'is_completed' => $progress?->is_completed ?? false,
                'best_score' => $progress?->best_score ?? null,
                'stars' => $progress?->stars ?? 0,
                'attempts_count' => $progress?->attempts_count ?? 0,
            ];
        });

        $totalStars = UserProgress::where('user_id', $user->id)->sum('stars');
        $completedLevels = UserProgress::where('user_id', $user->id)
            ->where('is_completed', true)
            ->count();

        return view('game.levels', [
            'levels' => $levelsWithStatus,
            'totalStars' => $totalStars,
            'completedLevels' => $completedLevels,
            'totalLevels' => $levels->count(),
            'user' => $user,
        ]);
    }

    public function showLevel(Level $level)
    {
        $user = Auth::user();

        if (!$this->gameService->isLevelUnlocked($user, $level)) {
            return redirect()->route('levels.index')
                ->with('error', '该关卡尚未解锁。');
        }

        $unlockedMaterials = $this->gameService->getUserUnlockedMaterials($user);
        $baseMaterials = collect($unlockedMaterials)->where('type', 'base')->values();
        $additiveMaterials = collect($unlockedMaterials)->where('type', 'additive')->values();

        $existingSession = $user->gameSessions()
            ->where('level_id', $level->id)
            ->playing()
            ->with('operationHistories')
            ->latest()
            ->first();

        $currentState = [
            'materials' => [],
            'properties' => [
                'viscosity' => 0,
                'drying_time' => 0,
                'transparency' => 0,
                'total_amount' => 0,
            ],
        ];

        $sessionId = null;
        $attemptCount = 0;
        $historySteps = [];

        if ($existingSession) {
            $sessionId = $existingSession->id;
            $attemptCount = $existingSession->attempt_count;
            $lastHistory = $existingSession->operationHistories()->latest('step_number')->first();
            if ($lastHistory) {
                $currentState = $lastHistory->state_after;
            }
            $historySteps = $existingSession->operationHistories()
                ->orderBy('step_number', 'asc')
                ->get();
        }

        return view('game.play', [
            'level' => $level,
            'baseMaterials' => $baseMaterials,
            'additiveMaterials' => $additiveMaterials,
            'allMaterials' => $unlockedMaterials,
            'currentState' => $currentState,
            'sessionId' => $sessionId,
            'attemptCount' => $attemptCount,
            'historySteps' => $historySteps,
            'user' => $user,
        ]);
    }

    public function startSession(Request $request, Level $level)
    {
        $user = Auth::user();

        if (!$this->gameService->isLevelUnlocked($user, $level)) {
            return response()->json(['error' => '关卡未解锁'], 403);
        }

        $session = $this->gameService->startGameSession($user, $level);

        return response()->json([
            'success' => true,
            'session_id' => $session->id,
            'attempt_count' => $session->attempt_count,
        ]);
    }

    public function addMaterial(Request $request, GameSession $session)
    {
        $user = Auth::user();

        if ($session->user_id !== $user->id) {
            return response()->json(['error' => '无权操作此游戏'], 403);
        }

        if (!$session->isPlaying()) {
            return response()->json(['error' => '游戏已结束'], 400);
        }

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'amount' => 'required|numeric|min:0.1|max:100',
            'current_state' => 'required|array',
        ]);

        $material = Material::findOrFail($validated['material_id']);
        $currentState = $validated['current_state'];

        $newState = $this->gameService->addMaterial(
            $session,
            $material,
            $validated['amount'],
            $currentState
        );

        $historyCount = $session->operationHistories()->count();

        return response()->json([
            'success' => true,
            'new_state' => $newState,
            'history_count' => $historyCount,
        ]);
    }

    public function removeMaterial(Request $request, GameSession $session)
    {
        $user = Auth::user();

        if ($session->user_id !== $user->id) {
            return response()->json(['error' => '无权操作此游戏'], 403);
        }

        if (!$session->isPlaying()) {
            return response()->json(['error' => '游戏已结束'], 400);
        }

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'amount' => 'required|numeric|min:0.1|max:100',
            'current_state' => 'required|array',
        ]);

        $material = Material::findOrFail($validated['material_id']);
        $currentState = $validated['current_state'];

        $newState = $this->gameService->removeMaterial(
            $session,
            $material,
            $validated['amount'],
            $currentState
        );

        $historyCount = $session->operationHistories()->count();

        return response()->json([
            'success' => true,
            'new_state' => $newState,
            'history_count' => $historyCount,
        ]);
    }

    public function adjustMaterial(Request $request, GameSession $session)
    {
        $user = Auth::user();

        if ($session->user_id !== $user->id) {
            return response()->json(['error' => '无权操作此游戏'], 403);
        }

        if (!$session->isPlaying()) {
            return response()->json(['error' => '游戏已结束'], 400);
        }

        $validated = $request->validate([
            'material_id' => 'required|exists:materials,id',
            'amount' => 'required|numeric|min:0',
            'current_state' => 'required|array',
        ]);

        $material = Material::findOrFail($validated['material_id']);
        $currentState = $validated['current_state'];

        $newState = $this->gameService->adjustMaterialAmount(
            $session,
            $material,
            $validated['amount'],
            $currentState
        );

        $historyCount = $session->operationHistories()->count();

        return response()->json([
            'success' => true,
            'new_state' => $newState,
            'history_count' => $historyCount,
        ]);
    }

    public function resetRecipe(Request $request, GameSession $session)
    {
        $user = Auth::user();

        if ($session->user_id !== $user->id) {
            return response()->json(['error' => '无权操作此游戏'], 403);
        }

        if (!$session->isPlaying()) {
            return response()->json(['error' => '游戏已结束'], 400);
        }

        $currentState = $request->input('current_state', []);

        $newState = $this->gameService->resetRecipe($session, $currentState);
        $historyCount = $session->operationHistories()->count();

        return response()->json([
            'success' => true,
            'new_state' => $newState,
            'history_count' => $historyCount,
        ]);
    }

    public function undo(Request $request, GameSession $session)
    {
        $user = Auth::user();

        if ($session->user_id !== $user->id) {
            return response()->json(['error' => '无权操作此游戏'], 403);
        }

        if (!$session->isPlaying()) {
            return response()->json(['error' => '游戏已结束'], 400);
        }

        $currentState = $request->input('current_state', []);

        $previousState = $this->gameService->undo($session, $currentState);

        if ($previousState === null) {
            return response()->json([
                'success' => false,
                'message' => '没有可撤销的操作',
            ], 400);
        }

        $historyCount = $session->operationHistories()->count();

        return response()->json([
            'success' => true,
            'new_state' => $previousState,
            'history_count' => $historyCount,
        ]);
    }

    public function getHistory(GameSession $session)
    {
        $user = Auth::user();

        if ($session->user_id !== $user->id) {
            return response()->json(['error' => '无权查看此游戏历史'], 403);
        }

        $history = $this->gameService->getHistorySteps($session);

        return response()->json([
            'success' => true,
            'history' => $history,
        ]);
    }

    public function submitAttempt(Request $request, GameSession $session)
    {
        $user = Auth::user();

        if ($session->user_id !== $user->id) {
            return response()->json(['error' => '无权操作此游戏'], 403);
        }

        if (!$session->isPlaying()) {
            return response()->json(['error' => '游戏已结束'], 400);
        }

        $currentState = $request->input('current_state', []);

        $result = $this->gameService->submitAttempt($session, $currentState);

        $isNewUnlock = false;
        $unlockedMaterials = [];

        if ($result['score']['is_passed']) {
            $level = $session->level;
            $newUnlocks = Material::where('unlock_level_id', $level->id)
                ->whereNotIn('id', function ($query) use ($user) {
                    $query->select('material_id')
                        ->from('user_materials')
                        ->where('user_id', $user->id);
                })
                ->get();

            if ($newUnlocks->isNotEmpty()) {
                $isNewUnlock = true;
                $unlockedMaterials = $newUnlocks;
            }
        }

        return response()->json([
            'success' => true,
            'properties' => $result['properties'],
            'score' => $result['score'],
            'session' => $result['session'],
            'is_new_unlock' => $isNewUnlock,
            'unlocked_materials' => $unlockedMaterials,
        ]);
    }

    public function showResult(GameSession $session)
    {
        $user = Auth::user();

        if ($session->user_id !== $user->id) {
            return redirect()->route('levels.index')
                ->with('error', '无权查看此游戏结果。');
        }

        if ($session->isPlaying()) {
            return redirect()->route('game.play', ['level' => $session->level_id]);
        }

        $level = $session->level;
        $scoreResult = $this->gameService->calculateScore($level, [
            'viscosity' => $session->final_viscosity,
            'drying_time' => $session->final_drying_time,
            'transparency' => $session->final_transparency,
        ]);

        $nextLevel = Level::where('order', '>', $level->order)
            ->active()
            ->ordered()
            ->first();

        $nextLevelUnlocked = $nextLevel ? $this->gameService->isLevelUnlocked($user, $nextLevel) : false;

        return view('game.result', [
            'session' => $session,
            'level' => $level,
            'score' => $scoreResult,
            'nextLevel' => $nextLevel,
            'nextLevelUnlocked' => $nextLevelUnlocked,
            'user' => $user,
        ]);
    }

    public function recalculateScore(Recipe $recipe)
    {
        $user = Auth::user();

        if ($recipe->user_id !== $user->id) {
            return response()->json(['error' => '无权操作此配方'], 403);
        }

        $level = $recipe->level;
        if (!$level) {
            return response()->json(['error' => '配方没有关联关卡'], 400);
        }

        $result = $this->gameService->recalculateScore($recipe, $level);

        return response()->json([
            'success' => true,
            'properties' => $result['properties'],
            'score' => $result['score'],
            'recalculated_at' => now()->toDateTimeString(),
        ]);
    }
}

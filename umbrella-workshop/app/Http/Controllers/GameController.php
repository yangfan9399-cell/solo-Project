<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Level;
use App\Models\Material;
use App\Services\GameService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    public function __construct(
        private GameService $gameService
    ) {}

    public function index()
    {
        $games = Game::with(['level', 'ribMaterial', 'surfaceMaterial', 'paperMaterial', 'details', 'histories', 'results', 'qualityInspections', 'orderEvaluations'])
            ->orderBy('created_at', 'desc')
            ->get();

        return view('games.index', compact('games'));
    }

    public function create()
    {
        $levels = Level::all();
        return view('games.create', compact('levels'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'level_id' => 'required|exists:levels,id',
            'player_name' => 'nullable|string|max:50',
        ]);

        $game = $this->gameService->createGame(
            $validated['level_id'],
            $validated['player_name'] ?? '匠人'
        );

        return redirect()->route('games.workbench', $game);
    }

    public function workbench(Game $game)
    {
        $game->load(['level', 'ribMaterial', 'surfaceMaterial', 'paperMaterial', 'details']);

        $ribs = Material::where('type', 'rib')->get();
        $surfaces = Material::where('type', 'surface')->get();
        $papers = Material::where('type', 'paper')->get();

        return view('games.workbench', compact('game', 'ribs', 'surfaces', 'papers'));
    }

    public function selectRib(Request $request, Game $game)
    {
        $validated = $request->validate([
            'rib_material_id' => 'required|exists:materials,id',
        ]);

        $game = $this->gameService->selectRib($game, $validated['rib_material_id']);

        return redirect()->route('games.workbench', $game)->with('success', '伞骨已选择');
    }

    public function selectSurface(Request $request, Game $game)
    {
        $validated = $request->validate([
            'surface_material_id' => 'required|exists:materials,id',
        ]);

        $game = $this->gameService->selectSurface($game, $validated['surface_material_id']);

        return redirect()->route('games.workbench', $game)->with('success', '伞面已选择');
    }

    public function selectPaper(Request $request, Game $game)
    {
        $validated = $request->validate([
            'paper_material_id' => 'required|exists:materials,id',
        ]);

        $game = $this->gameService->selectPaper($game, $validated['paper_material_id']);

        return redirect()->route('games.workbench', $game)->with('success', '糊纸已选择');
    }

    public function setPastingOrder(Request $request, Game $game)
    {
        $validated = $request->validate([
            'pasting_order' => 'required|array|size:4',
            'pasting_order.*' => 'required|string|in:骨架固定,伞面铺展,糊纸贴合,收拢整形',
        ]);

        $game = $this->gameService->setPastingOrder($game, $validated['pasting_order']);

        return redirect()->route('games.workbench', $game)->with('success', '糊纸顺序已设定');
    }

    public function setDryingTime(Request $request, Game $game)
    {
        $validated = $request->validate([
            'drying_time' => 'required|integer|min:30|max:300',
        ]);

        $game = $this->gameService->setDryingTime($game, $validated['drying_time']);
        $game = $this->gameService->processDrying($game);

        return redirect()->route('games.workbench', $game)->with('success', '晾晒时间已设定');
    }

    public function finalize(Game $game)
    {
        $game = $this->gameService->calculateAndFinalize($game);

        return redirect()->route('games.show', $game)->with('success', '纸伞制作完成！');
    }

    public function show(Game $game)
    {
        $game->load([
            'level',
            'ribMaterial',
            'surfaceMaterial',
            'paperMaterial',
            'details',
            'histories',
            'results',
            'qualityInspections' => fn($q) => $q->orderBy('created_at', 'desc'),
            'orderEvaluations' => fn($q) => $q->orderBy('created_at', 'desc'),
        ]);

        return view('games.show', compact('game'));
    }

    public function rollback(Game $game)
    {
        $game = $this->gameService->rollbackAndRecalc($game);

        return redirect()->route('games.show', $game)->with('success', '回滚重算完成！');
    }

    public function history()
    {
        $histories = \App\Models\GameHistory::with('game.level')
            ->orderBy('created_at', 'desc')
            ->get();

        $results = \App\Models\GameResult::with('game.level')
            ->orderBy('created_at', 'desc')
            ->get();

        return view('games.history', compact('histories', 'results'));
    }

    public function inspections()
    {
        $inspections = \App\Models\QualityInspection::with('game.level')
            ->orderBy('created_at', 'desc')
            ->get();

        $evaluations = \App\Models\OrderEvaluation::with('game.level')
            ->orderBy('created_at', 'desc')
            ->get();

        return view('games.inspections', compact('inspections', 'evaluations'));
    }
}

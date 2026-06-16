<?php

namespace App\Http\Controllers;

use App\Services\GlueGameService;
use App\Models\Recipe;
use App\Models\Level;
use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class RecipeController extends Controller
{
    protected $gameService;

    public function __construct(GlueGameService $gameService)
    {
        $this->gameService = $gameService;
    }

    public function index()
    {
        $user = Auth::user();

        $myRecipes = Recipe::where('user_id', $user->id)
            ->with('level')
            ->latest()
            ->paginate(12);

        $sharedRecipes = Recipe::shared()
            ->with(['user', 'level'])
            ->where('user_id', '!=', $user->id)
            ->inRandomOrder()
            ->limit(6)
            ->get();

        return view('recipes.index', [
            'myRecipes' => $myRecipes,
            'sharedRecipes' => $sharedRecipes,
            'user' => $user,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'level_id' => 'required|exists:levels,id',
            'recipe_data' => 'required|array',
            'properties' => 'nullable|array',
            'score' => 'nullable|numeric',
        ]);

        $level = Level::findOrFail($validated['level_id']);

        $recipe = $this->gameService->saveRecipe(
            $user,
            $level,
            $validated['name'],
            $validated['description'] ?? null,
            $validated['recipe_data'],
            $validated['properties'] ?? [],
            $validated['score'] ?? null
        );

        return response()->json([
            'success' => true,
            'recipe' => $recipe,
        ]);
    }

    public function show(Recipe $recipe)
    {
        $user = Auth::user();

        $isOwner = $recipe->user_id === $user->id;
        if (!$isOwner && !$recipe->is_shared) {
            return redirect()->route('recipes.index')
                ->with('error', '无权查看此配方。');
        }

        $materials = [];
        foreach ($recipe->recipe_data['materials'] ?? [] as $item) {
            $material = Material::find($item['material_id']);
            if ($material) {
                $materials[] = [
                    'material' => $material,
                    'amount' => $item['amount'],
                ];
            }
        }

        return view('recipes.show', [
            'recipe' => $recipe,
            'materials' => $materials,
            'isOwner' => $isOwner,
            'user' => $user,
        ]);
    }

    public function share(Recipe $recipe)
    {
        $user = Auth::user();

        if ($recipe->user_id !== $user->id) {
            return response()->json(['error' => '无权分享此配方'], 403);
        }

        $recipe = $this->gameService->shareRecipe($recipe);

        return response()->json([
            'success' => true,
            'recipe' => $recipe,
            'share_url' => route('recipes.show', $recipe),
        ]);
    }

    public function showByCode(string $code)
    {
        $recipe = Recipe::where('share_code', $code)->shared()->first();

        if (!$recipe) {
            return redirect()->route('recipes.index')
                ->with('error', '配方不存在或已取消分享。');
        }

        return redirect()->route('recipes.show', $recipe);
    }

    public function importByCode(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'share_code' => 'required|string|max:20',
        ]);

        $recipe = Recipe::where('share_code', strtoupper($validated['share_code']))
            ->shared()
            ->first();

        if (!$recipe) {
            return response()->json(['error' => '配方不存在'], 404);
        }

        $newRecipe = Recipe::create([
            'name' => $recipe->name . ' (副本)',
            'description' => '从分享码导入的配方。原作者：' . $recipe->user->name,
            'user_id' => $user->id,
            'level_id' => $recipe->level_id,
            'recipe_data' => $recipe->recipe_data,
            'viscosity' => $recipe->viscosity,
            'drying_time' => $recipe->drying_time,
            'transparency' => $recipe->transparency,
            'score' => $recipe->score,
            'is_shared' => false,
            'like_count' => 0,
        ]);

        return response()->json([
            'success' => true,
            'recipe' => $newRecipe,
            'message' => '配方已成功导入到我的配方中！',
        ]);
    }

    public function destroy(Recipe $recipe)
    {
        $user = Auth::user();

        if ($recipe->user_id !== $user->id) {
            return response()->json(['error' => '无权删除此配方'], 403);
        }

        $recipe->delete();

        return response()->json([
            'success' => true,
            'message' => '配方已删除',
        ]);
    }

    public function useRecipe(Recipe $recipe, Level $level)
    {
        $user = Auth::user();

        if ($recipe->user_id !== $user->id && !$recipe->is_shared) {
            return response()->json(['error' => '无权使用此配方'], 403);
        }

        $session = $this->gameService->startGameSession($user, $level);

        $recipeData = $recipe->recipe_data;
        $materials = $recipeData['materials'] ?? [];

        $unlockedMaterialIds = collect($this->gameService->getUserUnlockedMaterials($user))
            ->pluck('id')
            ->toArray();

        $usableMaterials = [];
        foreach ($materials as $item) {
            if (in_array($item['material_id'], $unlockedMaterialIds)) {
                $usableMaterials[] = $item;
            }
        }

        if (empty($usableMaterials)) {
            return response()->json(['error' => '你还没有解锁配方中的材料'], 400);
        }

        $state = [
            'materials' => $usableMaterials,
            'properties' => $this->gameService->calculateProperties($usableMaterials),
        ];

        return response()->json([
            'success' => true,
            'session_id' => $session->id,
            'state' => $state,
            'message' => '配方已加载，开始实验吧！',
        ]);
    }

    public function like(Recipe $recipe)
    {
        $user = Auth::user();

        if ($recipe->user_id === $user->id) {
            return response()->json(['error' => '不能给自己的配方点赞'], 400);
        }

        $recipe->increment('like_count');

        return response()->json([
            'success' => true,
            'like_count' => $recipe->like_count,
        ]);
    }
}

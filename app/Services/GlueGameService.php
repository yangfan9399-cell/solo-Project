<?php

namespace App\Services;

use App\Models\Level;
use App\Models\Material;
use App\Models\GameSession;
use App\Models\OperationHistory;
use App\Models\UserProgress;
use App\Models\UserMaterial;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class GlueGameService
{
    public function calculateProperties(array $materialsWithAmounts): array
    {
        $totalAmount = 0;
        $weightedViscosity = 0;
        $weightedDryingTime = 0;
        $weightedTransparency = 0;

        $baseMaterials = [];
        $additiveMaterials = [];

        foreach ($materialsWithAmounts as $item) {
            $material = Material::find($item['material_id']);
            if (!$material || $item['amount'] <= 0) {
                continue;
            }

            $amount = $item['amount'];
            $totalAmount += $amount;

            if ($material->type === 'base') {
                $baseMaterials[] = [
                    'material' => $material,
                    'amount' => $amount,
                ];
            } else {
                $additiveMaterials[] = [
                    'material' => $material,
                    'amount' => $amount,
                ];
            }
        }

        if ($totalAmount <= 0) {
            return [
                'viscosity' => 0,
                'drying_time' => 0,
                'transparency' => 0,
                'total_amount' => 0,
            ];
        }

        $baseViscosity = 0;
        $baseDrying = 0;
        $baseTrans = 0;
        $baseTotal = 0;

        foreach ($baseMaterials as $item) {
            $m = $item['material'];
            $amt = $item['amount'];
            $baseTotal += $amt;
            $baseViscosity += $m->base_viscosity * $amt;
            $baseDrying += $m->base_drying_time * $amt;
            $baseTrans += $m->base_transparency * $amt;
        }

        if ($baseTotal > 0) {
            $weightedViscosity = $baseViscosity / $baseTotal;
            $weightedDryingTime = $baseDrying / $baseTotal;
            $weightedTransparency = $baseTrans / $baseTotal;
        }

        foreach ($additiveMaterials as $item) {
            $m = $item['material'];
            $amt = $item['amount'];
            $ratio = $amt / $totalAmount;

            $weightedViscosity = $weightedViscosity * (1 + ($m->viscosity_factor - 1) * $ratio);
            $weightedDryingTime = $weightedDryingTime * (1 + ($m->drying_time_factor - 1) * $ratio);
            $weightedTransparency = $weightedTransparency * (1 + ($m->transparency_factor - 1) * $ratio);
        }

        return [
            'viscosity' => round($weightedViscosity, 2),
            'drying_time' => round($weightedDryingTime, 2),
            'transparency' => round($weightedTransparency, 2),
            'total_amount' => round($totalAmount, 2),
        ];
    }

    public function calculateScore(Level $level, array $properties): array
    {
        $viscosityDiff = abs($properties['viscosity'] - $level->target_viscosity);
        $dryingDiff = abs($properties['drying_time'] - $level->target_drying_time);
        $transparencyDiff = abs($properties['transparency'] - $level->target_transparency);

        $viscosityRatio = $level->target_viscosity > 0
            ? $viscosityDiff / $level->target_viscosity
            : $viscosityDiff;
        $dryingRatio = $level->target_drying_time > 0
            ? $dryingDiff / $level->target_drying_time
            : $dryingDiff;
        $transparencyRatio = $level->target_transparency > 0
            ? $transparencyDiff / $level->target_transparency
            : $transparencyDiff;

        $viscosityScore = max(0, 100 - $viscosityRatio * 100);
        $dryingScore = max(0, 100 - $dryingRatio * 100);
        $transparencyScore = max(0, 100 - $transparencyRatio * 100);

        $totalScore = ($viscosityScore * 0.35 + $dryingScore * 0.35 + $transparencyScore * 0.30);

        $viscosityPass = $viscosityDiff <= $level->viscosity_tolerance;
        $dryingPass = $dryingDiff <= $level->drying_time_tolerance;
        $transparencyPass = $transparencyDiff <= $level->transparency_tolerance;
        $isPassed = $viscosityPass && $dryingPass && $transparencyPass;

        $stars = 0;
        if ($isPassed) {
            $stars = 1;
            if ($totalScore >= 80) {
                $stars = 2;
            }
            if ($totalScore >= 95) {
                $stars = 3;
            }
        }

        return [
            'total_score' => round($totalScore, 2),
            'viscosity_score' => round($viscosityScore, 2),
            'drying_score' => round($dryingScore, 2),
            'transparency_score' => round($transparencyScore, 2),
            'viscosity_diff' => round($viscosityDiff, 2),
            'drying_diff' => round($dryingDiff, 2),
            'transparency_diff' => round($transparencyDiff, 2),
            'is_passed' => $isPassed,
            'viscosity_pass' => $viscosityPass,
            'drying_pass' => $dryingPass,
            'transparency_pass' => $transparencyPass,
            'stars' => $stars,
        ];
    }

    public function startGameSession(User $user, Level $level): GameSession
    {
        $existing = $user->gameSessions()
            ->where('level_id', $level->id)
            ->playing()
            ->first();

        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($user, $level) {
            $session = GameSession::create([
                'user_id' => $user->id,
                'level_id' => $level->id,
                'status' => 'playing',
                'attempt_count' => 0,
                'started_at' => now(),
            ]);

            $progress = UserProgress::firstOrCreate(
                ['user_id' => $user->id, 'level_id' => $level->id],
                ['attempts_count' => 0]
            );

            $progress->increment('attempts_count');
            $progress->update(['last_played_at' => now()]);

            return $session;
        });
    }

    public function addMaterial(
        GameSession $session,
        Material $material,
        float $amount,
        array $currentState
    ): array {
        if (!$session->isPlaying()) {
            throw new \Exception('游戏已结束');
        }

        $stepNumber = $session->operationHistories()->max('step_number') + 1;

        $newState = $currentState;
        $found = false;

        foreach ($newState['materials'] as &$item) {
            if ($item['material_id'] == $material->id) {
                $item['amount'] += $amount;
                $found = true;
                break;
            }
        }

        if (!$found) {
            $newState['materials'][] = [
                'material_id' => $material->id,
                'amount' => $amount,
            ];
        }

        $properties = $this->calculateProperties($newState['materials']);
        $newState['properties'] = $properties;

        OperationHistory::create([
            'game_session_id' => $session->id,
            'step_number' => $stepNumber,
            'action_type' => 'add_material',
            'material_id' => $material->id,
            'amount' => $amount,
            'state_before' => $currentState,
            'state_after' => $newState,
        ]);

        return $newState;
    }

    public function removeMaterial(
        GameSession $session,
        Material $material,
        float $amount,
        array $currentState
    ): array {
        if (!$session->isPlaying()) {
            throw new \Exception('游戏已结束');
        }

        $stepNumber = $session->operationHistories()->max('step_number') + 1;

        $newState = $currentState;

        foreach ($newState['materials'] as $index => &$item) {
            if ($item['material_id'] == $material->id) {
                $item['amount'] -= $amount;
                if ($item['amount'] <= 0) {
                    unset($newState['materials'][$index]);
                }
                break;
            }
        }

        $newState['materials'] = array_values($newState['materials']);

        $properties = $this->calculateProperties($newState['materials']);
        $newState['properties'] = $properties;

        OperationHistory::create([
            'game_session_id' => $session->id,
            'step_number' => $stepNumber,
            'action_type' => 'remove_material',
            'material_id' => $material->id,
            'amount' => $amount,
            'state_before' => $currentState,
            'state_after' => $newState,
        ]);

        return $newState;
    }

    public function adjustMaterialAmount(
        GameSession $session,
        Material $material,
        float $newAmount,
        array $currentState
    ): array {
        if (!$session->isPlaying()) {
            throw new \Exception('游戏已结束');
        }

        $stepNumber = $session->operationHistories()->max('step_number') + 1;

        $newState = $currentState;
        $oldAmount = 0;

        foreach ($newState['materials'] as &$item) {
            if ($item['material_id'] == $material->id) {
                $oldAmount = $item['amount'];
                $item['amount'] = max(0, $newAmount);
                break;
            }
        }

        $newState['materials'] = array_filter(
            $newState['materials'],
            fn($m) => $m['amount'] > 0
        );
        $newState['materials'] = array_values($newState['materials']);

        $properties = $this->calculateProperties($newState['materials']);
        $newState['properties'] = $properties;

        OperationHistory::create([
            'game_session_id' => $session->id,
            'step_number' => $stepNumber,
            'action_type' => 'adjust_amount',
            'material_id' => $material->id,
            'amount' => $newAmount - $oldAmount,
            'state_before' => $currentState,
            'state_after' => $newState,
        ]);

        return $newState;
    }

    public function resetRecipe(GameSession $session, array $currentState): array
    {
        if (!$session->isPlaying()) {
            throw new \Exception('游戏已结束');
        }

        $stepNumber = $session->operationHistories()->max('step_number') + 1;

        $newState = [
            'materials' => [],
            'properties' => [
                'viscosity' => 0,
                'drying_time' => 0,
                'transparency' => 0,
                'total_amount' => 0,
            ],
        ];

        OperationHistory::create([
            'game_session_id' => $session->id,
            'step_number' => $stepNumber,
            'action_type' => 'reset',
            'state_before' => $currentState,
            'state_after' => $newState,
        ]);

        return $newState;
    }

    public function undo(GameSession $session, array $currentState): ?array
    {
        $lastStep = $session->operationHistories()->orderBy('step_number', 'desc')->first();

        if (!$lastStep) {
            return null;
        }

        $lastStep->delete();

        return $lastStep->state_before;
    }

    public function getHistorySteps(GameSession $session): array
    {
        return $session->operationHistories()
            ->orderBy('step_number', 'asc')
            ->get()
            ->toArray();
    }

    public function submitAttempt(GameSession $session, array $currentState): array
    {
        if (!$session->isPlaying()) {
            throw new \Exception('游戏已结束');
        }

        $level = $session->level;
        $properties = $currentState['properties'] ?? $this->calculateProperties($currentState['materials'] ?? []);
        $scoreResult = $this->calculateScore($level, $properties);

        $session->increment('attempt_count');

        if ($scoreResult['is_passed']) {
            $session->update([
                'status' => 'won',
                'final_score' => $scoreResult['total_score'],
                'final_viscosity' => $properties['viscosity'],
                'final_drying_time' => $properties['drying_time'],
                'final_transparency' => $properties['transparency'],
                'ended_at' => now(),
            ]);

            $this->handleWin($session, $scoreResult);
        } elseif ($session->attempt_count >= $level->max_attempts) {
            $session->update([
                'status' => 'lost',
                'final_score' => $scoreResult['total_score'],
                'final_viscosity' => $properties['viscosity'],
                'final_drying_time' => $properties['drying_time'],
                'final_transparency' => $properties['transparency'],
                'ended_at' => now(),
            ]);

            $this->handleLose($session, $scoreResult);
        }

        return [
            'properties' => $properties,
            'score' => $scoreResult,
            'session' => $session->fresh(),
        ];
    }

    protected function handleWin(GameSession $session, array $scoreResult): void
    {
        $user = $session->user;
        $level = $session->level;

        $progress = UserProgress::firstOrNew(
            ['user_id' => $user->id, 'level_id' => $level->id]
        );

        $isFirstComplete = !$progress->is_completed;

        if ($scoreResult['total_score'] > ($progress->best_score ?? 0)) {
            $progress->best_score = $scoreResult['total_score'];
        }

        if ($scoreResult['stars'] > $progress->stars) {
            $progress->stars = $scoreResult['stars'];
        }

        $progress->is_completed = true;

        if ($isFirstComplete) {
            $progress->first_completed_at = now();
        }

        $progress->save();

        $this->unlockMaterialsForLevel($user, $level);
    }

    protected function handleLose(GameSession $session, array $scoreResult): void
    {
    }

    protected function unlockMaterialsForLevel(User $user, Level $level): void
    {
        $materials = Material::where('unlock_level_id', $level->id)->get();

        foreach ($materials as $material) {
            UserMaterial::firstOrCreate(
                ['user_id' => $user->id, 'material_id' => $material->id],
                ['unlocked_at' => now(), 'unlock_level_id' => $level->id]
            );
        }
    }

    public function getUserUnlockedMaterials(User $user): array
    {
        $defaultMaterials = Material::where('is_unlocked_by_default', true)
            ->active()
            ->ordered()
            ->get();

        $userMaterials = $user->materials()
            ->where('materials.is_active', true)
            ->orderBy('materials.order', 'asc')
            ->get();

        $allMaterials = $defaultMaterials->merge($userMaterials)->unique('id');

        return $allMaterials->values()->all();
    }

    public function isLevelUnlocked(User $user, Level $level): bool
    {
        if ($level->unlock_level_id === null && $level->order == 0) {
            return true;
        }

        if ($level->unlock_level_id) {
            $unlockLevel = Level::find($level->unlock_level_id);
            if ($unlockLevel && !$user->hasCompletedLevel($unlockLevel->id)) {
                return false;
            }
        }

        if ($level->unlock_score > 0) {
            $totalStars = UserProgress::where('user_id', $user->id)
                ->sum('stars');
            if ($totalStars < $level->unlock_score) {
                return false;
            }
        }

        return true;
    }

    public function saveRecipe(
        User $user,
        Level $level,
        string $name,
        ?string $description,
        array $recipeData,
        array $properties,
        ?float $score
    ): Recipe {
        return Recipe::create([
            'name' => $name,
            'description' => $description,
            'user_id' => $user->id,
            'level_id' => $level->id,
            'recipe_data' => $recipeData,
            'viscosity' => $properties['viscosity'] ?? null,
            'drying_time' => $properties['drying_time'] ?? null,
            'transparency' => $properties['transparency'] ?? null,
            'score' => $score,
            'is_shared' => false,
            'like_count' => 0,
        ]);
    }

    public function shareRecipe(Recipe $recipe): Recipe
    {
        $recipe->update(['is_shared' => true]);
        return $recipe;
    }

    public function getRecipeByShareCode(string $code): ?Recipe
    {
        return Recipe::where('share_code', $code)->shared()->first();
    }

    public function recalculateScore(Recipe $recipe, Level $level): array
    {
        $recipeData = $recipe->recipe_data;
        $materials = $recipeData['materials'] ?? [];
        $properties = $this->calculateProperties($materials);
        $scoreResult = $this->calculateScore($level, $properties);

        $recipe->update([
            'viscosity' => $properties['viscosity'],
            'drying_time' => $properties['drying_time'],
            'transparency' => $properties['transparency'],
            'score' => $scoreResult['total_score'],
        ]);

        return [
            'properties' => $properties,
            'score' => $scoreResult,
        ];
    }
}

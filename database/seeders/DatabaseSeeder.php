<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserMaterial;
use App\Models\Material;
use App\Models\GameSession;
use App\Models\OperationHistory;
use App\Models\Recipe;
use App\Models\UserProgress;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            LevelSeeder::class,
            MaterialSeeder::class,
        ]);

        $user = User::firstOrCreate(
            ['email' => 'player@example.com'],
            [
                'name' => '修补学徒',
                'password' => Hash::make('password123'),
            ]
        );

        $defaultMaterials = Material::where('is_unlocked_by_default', true)->get();
        foreach ($defaultMaterials as $material) {
            UserMaterial::firstOrCreate(
                ['user_id' => $user->id, 'material_id' => $material->id],
                ['unlocked_at' => now()]
            );
        }

        UserProgress::firstOrCreate(
            ['user_id' => $user->id, 'level_id' => 1],
            [
                'best_score' => 72.5,
                'stars' => 2,
                'attempts_count' => 3,
                'is_completed' => true,
                'first_completed_at' => now()->subDays(5),
                'last_played_at' => now()->subDay(),
            ]
        );

        Recipe::firstOrCreate(
            ['name' => '新手基础胶', 'user_id' => $user->id],
            [
                'description' => '第一次成功的胶水配方，纪念一下',
                'level_id' => 1,
                'recipe_data' => [
                    'materials' => [
                        ['material_id' => 1, 'amount' => 70],
                        ['material_id' => 6, 'amount' => 30],
                    ],
                ],
                'viscosity' => 63.5,
                'drying_time' => 44.0,
                'transparency' => 72.5,
                'score' => 72.5,
                'is_shared' => false,
                'like_count' => 0,
            ]
        );

        $gameSession = GameSession::firstOrCreate(
            ['user_id' => $user->id, 'level_id' => 2, 'status' => 'playing'],
            [
                'attempt_count' => 2,
                'started_at' => now()->subHours(2),
            ]
        );

        if ($gameSession->wasRecentlyCreated) {
            OperationHistory::create([
                'game_session_id' => $gameSession->id,
                'step_number' => 1,
                'action_type' => 'add_material',
                'material_id' => 2,
                'amount' => 50,
                'state_before' => [
                    'materials' => [],
                    'properties' => ['viscosity' => 0, 'drying_time' => 0, 'transparency' => 0, 'total_amount' => 0],
                ],
                'state_after' => [
                    'materials' => [['material_id' => 2, 'amount' => 50]],
                    'properties' => ['viscosity' => 95.0, 'drying_time' => 70.0, 'transparency' => 40.0, 'total_amount' => 50],
                ],
            ]);

            OperationHistory::create([
                'game_session_id' => $gameSession->id,
                'step_number' => 2,
                'action_type' => 'add_material',
                'material_id' => 6,
                'amount' => 20,
                'state_before' => [
                    'materials' => [['material_id' => 2, 'amount' => 50]],
                    'properties' => ['viscosity' => 95.0, 'drying_time' => 70.0, 'transparency' => 40.0, 'total_amount' => 50],
                ],
                'state_after' => [
                    'materials' => [
                        ['material_id' => 2, 'amount' => 50],
                        ['material_id' => 6, 'amount' => 20],
                    ],
                    'properties' => ['viscosity' => 77.5, 'drying_time' => 55.0, 'transparency' => 45.7, 'total_amount' => 70],
                ],
            ]);
        }
    }
}

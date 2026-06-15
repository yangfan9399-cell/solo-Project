<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\GameDetail;
use App\Models\GameHistory;
use App\Models\GameResult;
use App\Models\Level;
use App\Models\Material;
use App\Models\OrderEvaluation;
use App\Models\QualityInspection;
use Illuminate\Database\Seeder;

class MaterialBatchExceptionSeeder extends Seeder
{
    public function run(): void
    {
        $level = Level::where('name', '匠人考验')->first();

        $rib = Material::where('batch_code', 'RIB-002')->first();
        $surface = Material::where('batch_code', 'SUR-002')->first();
        $paper = Material::where('batch_code', 'PAP-002')->first();

        $baseCost = $rib->cost + $surface->cost + $paper->cost;
        $baseDurability = $rib->durability + $surface->durability + $paper->durability;

        $game = Game::create([
            'level_id' => $level->id,
            'player_name' => '王匠人',
            'status' => 'failed',
            'rib_material_id' => $rib->id,
            'surface_material_id' => $surface->id,
            'paper_material_id' => $paper->id,
            'humidity' => 78,
            'total_cost' => $baseCost,
            'total_durability' => max(10, $baseDurability - 40),
            'smoothness' => 35,
            'score' => 28,
            'round_state' => [
                'select_rib' => ['material_id' => $rib->id, 'material_name' => $rib->name, 'timestamp' => now()->subHours(5)->toIso8601String()],
                'select_surface' => ['material_id' => $surface->id, 'material_name' => $surface->name, 'timestamp' => now()->subHours(4)->toIso8601String()],
                'select_paper' => ['material_id' => $paper->id, 'material_name' => $paper->name, 'timestamp' => now()->subHours(4)->toIso8601String()],
                'pasting' => ['order' => ['糊纸贴合', '骨架固定', '伞面铺展', '收拢整形'], 'timestamp' => now()->subHours(3)->toIso8601String()],
                'drying' => ['time' => 60, 'progress' => 45, 'timestamp' => now()->subHours(2)->toIso8601String()],
                'inspection' => ['result' => 'fail', 'timestamp' => now()->subHours(1)->toIso8601String()],
                'exception' => ['type' => 'material_batch_defect', 'description' => '伞骨批次RIB-002存在裂纹缺陷，伞面批次SUR-002受潮', 'timestamp' => now()->subHours(1)->toIso8601String()],
            ],
        ]);

        GameDetail::create([
            'game_id' => $game->id,
            'pasting_order' => ['糊纸贴合', '骨架固定', '伞面铺展', '收拢整形'],
            'drying_time' => 60,
            'drying_step' => 2,
            'actual_drying_progress' => 45,
        ]);

        GameHistory::create([
            'game_id' => $game->id,
            'humidity' => 78,
            'smoothness_before' => 100,
            'smoothness_after' => 35,
            'change_reason' => '湿度78%过高，伞面受潮膨胀，叠加材料缺陷导致开合严重卡顿',
        ]);

        GameHistory::create([
            'game_id' => $game->id,
            'humidity' => 78,
            'smoothness_before' => 55,
            'smoothness_after' => 35,
            'change_reason' => '受潮伞面叠加糊纸顺序错误，二次降级',
        ]);

        GameResult::create([
            'game_id' => $game->id,
            'material_combo' => ['rib' => $rib->name, 'surface' => $surface->name, 'paper' => $paper->name],
            'cost_before' => $baseCost,
            'cost_after' => $baseCost,
            'durability_before' => $baseDurability,
            'durability_after' => max(10, $baseDurability - 40),
            'change_reason' => '伞骨裂纹(RIB-002缺陷)和受潮伞面(SUR-002)导致耐用度大幅下降',
        ]);

        QualityInspection::create([
            'game_id' => $game->id,
            'inspection_type' => 'final',
            'result' => 'fail',
            'score' => 28,
            'notes' => '伞骨裂纹，伞面受潮，糊纸顺序不当导致开合卡顿严重，质检不通过',
            'needs_rollback' => false,
        ]);

        OrderEvaluation::create([
            'game_id' => $game->id,
            'customer_name' => '赵客官',
            'satisfaction' => 15,
            'review_score' => 20,
            'comment' => '伞有裂纹，开合很费力，不满意',
            'needs_recalc' => false,
        ]);
    }
}

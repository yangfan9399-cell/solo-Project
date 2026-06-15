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

class RollbackRecalcSeeder extends Seeder
{
    public function run(): void
    {
        $level = Level::where('name', '大师挑战')->first();

        $rib = Material::where('batch_code', 'RIB-003')->first();
        $surface = Material::where('batch_code', 'SUR-003')->first();
        $paper = Material::where('batch_code', 'PAP-003')->first();

        $baseCost = $rib->cost + $surface->cost + $paper->cost;
        $baseDurability = $rib->durability + $surface->durability + $paper->durability;

        $game = Game::create([
            'level_id' => $level->id,
            'player_name' => '陈大师',
            'status' => 'completed',
            'rib_material_id' => $rib->id,
            'surface_material_id' => $surface->id,
            'paper_material_id' => $paper->id,
            'humidity' => 62,
            'total_cost' => $baseCost,
            'total_durability' => $baseDurability,
            'smoothness' => 72,
            'score' => 75,
            'round_state' => [
                'select_rib' => ['material_id' => $rib->id, 'material_name' => $rib->name, 'timestamp' => now()->subHours(8)->toIso8601String()],
                'select_surface' => ['material_id' => $surface->id, 'material_name' => $surface->name, 'timestamp' => now()->subHours(7)->toIso8601String()],
                'select_paper' => ['material_id' => $paper->id, 'material_name' => $paper->name, 'timestamp' => now()->subHours(7)->toIso8601String()],
                'pasting' => ['order' => ['骨架固定', '糊纸贴合', '伞面铺展', '收拢整形'], 'timestamp' => now()->subHours(6)->toIso8601String()],
                'drying' => ['time' => 90, 'progress' => 85, 'timestamp' => now()->subHours(4)->toIso8601String()],
                'inspection' => ['result' => 'warning', 'timestamp' => now()->subHours(3)->toIso8601String()],
                'recalc' => ['reason' => '质检评分异常需回滚重算', 'original_score' => 75, 'recalculated_score' => 82, 'timestamp' => now()->subHours(2)->toIso8601String()],
            ],
        ]);

        GameDetail::create([
            'game_id' => $game->id,
            'pasting_order' => ['骨架固定', '糊纸贴合', '伞面铺展', '收拢整形'],
            'drying_time' => 90,
            'drying_step' => 3,
            'actual_drying_progress' => 85,
        ]);

        GameHistory::create([
            'game_id' => $game->id,
            'humidity' => 62,
            'smoothness_before' => 100,
            'smoothness_after' => 72,
            'change_reason' => '湿度62%偏高，竹骨略有膨胀，开合顺滑度下降',
        ]);

        GameResult::create([
            'game_id' => $game->id,
            'material_combo' => ['rib' => $rib->name, 'surface' => $surface->name, 'paper' => $paper->name],
            'cost_before' => 0,
            'cost_after' => $baseCost,
            'durability_before' => 0,
            'durability_after' => $baseDurability,
            'change_reason' => '材料全部合格，兼容性正常，成本和耐用度正常叠加',
        ]);

        QualityInspection::create([
            'game_id' => $game->id,
            'inspection_type' => 'final',
            'result' => 'warning',
            'score' => 75,
            'notes' => '初步质检评分偏低：湿度影响被重复计算，需回滚重算',
            'needs_rollback' => true,
        ]);

        QualityInspection::create([
            'game_id' => $game->id,
            'inspection_type' => 'recalc',
            'result' => 'pass',
            'score' => 82,
            'notes' => '回滚重算完成：修正湿度重复扣分，顺滑度从72调整为78，最终评分82',
            'needs_rollback' => false,
        ]);

        OrderEvaluation::create([
            'game_id' => $game->id,
            'customer_name' => '孙客官',
            'satisfaction' => 70,
            'review_score' => 75,
            'comment' => '伞还可以，但感觉不够顺滑',
            'needs_recalc' => true,
        ]);

        OrderEvaluation::create([
            'game_id' => $game->id,
            'customer_name' => '孙客官',
            'satisfaction' => 82,
            'review_score' => 82,
            'comment' => '经回算后修正评分，伞做工不错，开合尚可',
            'needs_recalc' => false,
        ]);

        $game->update([
            'smoothness' => 78,
            'score' => 82,
        ]);
    }
}

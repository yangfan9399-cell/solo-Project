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

class NormalCompletionSeeder extends Seeder
{
    public function run(): void
    {
        $level = Level::where('name', '学徒试炼')->first();

        $rib = Material::where('batch_code', 'RIB-001')->first();
        $surface = Material::where('batch_code', 'SUR-001')->first();
        $paper = Material::where('batch_code', 'PAP-001')->first();

        $game = Game::create([
            'level_id' => $level->id,
            'player_name' => '张师傅',
            'status' => 'completed',
            'rib_material_id' => $rib->id,
            'surface_material_id' => $surface->id,
            'paper_material_id' => $paper->id,
            'humidity' => 45,
            'total_cost' => $rib->cost + $surface->cost + $paper->cost,
            'total_durability' => $rib->durability + $surface->durability + $paper->durability,
            'smoothness' => 88,
            'score' => 92,
            'round_state' => [
                'select_rib' => ['material_id' => $rib->id, 'material_name' => $rib->name, 'timestamp' => now()->subHours(3)->toIso8601String()],
                'select_surface' => ['material_id' => $surface->id, 'material_name' => $surface->name, 'timestamp' => now()->subHours(2)->toIso8601String()],
                'select_paper' => ['material_id' => $paper->id, 'material_name' => $paper->name, 'timestamp' => now()->subHours(2)->toIso8601String()],
                'pasting' => ['order' => ['骨架固定', '伞面铺展', '糊纸贴合', '收拢整形'], 'timestamp' => now()->subHours(1)->toIso8601String()],
                'drying' => ['time' => 120, 'progress' => 100, 'timestamp' => now()->subMinutes(30)->toIso8601String()],
                'inspection' => ['result' => 'pass', 'timestamp' => now()->subMinutes(15)->toIso8601String()],
            ],
        ]);

        GameDetail::create([
            'game_id' => $game->id,
            'pasting_order' => ['骨架固定', '伞面铺展', '糊纸贴合', '收拢整形'],
            'drying_time' => 120,
            'drying_step' => 4,
            'actual_drying_progress' => 100,
        ]);

        GameHistory::create([
            'game_id' => $game->id,
            'humidity' => 45,
            'smoothness_before' => 100,
            'smoothness_after' => 88,
            'change_reason' => '湿度45%适中，开合顺滑度轻微下降',
        ]);

        GameResult::create([
            'game_id' => $game->id,
            'material_combo' => ['rib' => $rib->name, 'surface' => $surface->name, 'paper' => $paper->name],
            'cost_before' => 0,
            'cost_after' => $rib->cost + $surface->cost + $paper->cost,
            'durability_before' => 0,
            'durability_after' => $rib->durability + $surface->durability + $paper->durability,
            'change_reason' => '材料全部合格，兼容性良好，耐用度正常叠加',
        ]);

        QualityInspection::create([
            'game_id' => $game->id,
            'inspection_type' => 'final',
            'result' => 'pass',
            'score' => 92,
            'notes' => '伞骨装配规范，糊纸平整，开合顺滑，质量达标',
            'needs_rollback' => false,
        ]);

        OrderEvaluation::create([
            'game_id' => $game->id,
            'customer_name' => '李客官',
            'satisfaction' => 90,
            'review_score' => 92,
            'comment' => '伞做工精细，开合顺畅，值得推荐',
            'needs_recalc' => false,
        ]);
    }
}

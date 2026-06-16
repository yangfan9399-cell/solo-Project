<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            [
                'name' => '初出茅庐·平装书修复',
                'description' => '你是一名图书修补学徒。第一份工作是修复一本普通平装书的书脊。纸张是常见的胶版纸，需要调配一款黏度适中、干燥较快的基础胶水。',
                'paper_type' => '胶版纸',
                'paper_description' => '普通胶版纸，表面光滑，厚度中等。是最常见的书籍用纸。',
                'target_viscosity' => 65.0,
                'target_drying_time' => 45.0,
                'target_transparency' => 70.0,
                'viscosity_tolerance' => 10.0,
                'drying_time_tolerance' => 10.0,
                'transparency_tolerance' => 10.0,
                'max_attempts' => 10,
                'unlock_level_id' => null,
                'unlock_score' => 0,
                'order' => 1,
                'is_active' => true,
            ],
            [
                'name' => '旧书新生·新闻纸加固',
                'description' => '图书馆送来一批旧报纸需要加固。新闻纸纸质疏松、易吸潮，需要黏度较高的胶水来渗透纤维，但干燥不能太慢，否则纸张会起皱。',
                'paper_type' => '新闻纸',
                'paper_description' => '质地疏松的新闻纸，吸水性强，容易起皱。常见于旧报纸和廉价书籍。',
                'target_viscosity' => 80.0,
                'target_drying_time' => 35.0,
                'target_transparency' => 60.0,
                'viscosity_tolerance' => 8.0,
                'drying_time_tolerance' => 8.0,
                'transparency_tolerance' => 10.0,
                'max_attempts' => 8,
                'unlock_level_id' => 1,
                'unlock_score' => 0,
                'order' => 2,
                'is_active' => true,
            ],
            [
                'name' => '古卷修复·宣纸装裱',
                'description' => '博物馆送来一幅古画需要重新装裱。宣纸薄如蝉翼，对胶水要求极高——透明度要好，黏度要适中，干燥时间必须精确控制。',
                'paper_type' => '宣纸',
                'paper_description' => '手工制作的宣纸，极薄且具有韧性。是中国传统书画的首选纸张。',
                'target_viscosity' => 50.0,
                'target_drying_time' => 60.0,
                'target_transparency' => 85.0,
                'viscosity_tolerance' => 6.0,
                'drying_time_tolerance' => 6.0,
                'transparency_tolerance' => 5.0,
                'max_attempts' => 6,
                'unlock_level_id' => 2,
                'unlock_score' => 0,
                'order' => 3,
                'is_active' => true,
            ],
            [
                'name' => '照片重现·相纸修复',
                'description' => '一位顾客带来了珍贵的老照片，边缘已经脱落。相纸表面有涂层，不能使用太强的胶水，透明度必须极高，不能影响照片观感。',
                'paper_type' => '光面相纸',
                'paper_description' => '表面有光敏涂层的光面相纸，对胶水的腐蚀性和透明度要求很高。',
                'target_viscosity' => 40.0,
                'target_drying_time' => 50.0,
                'target_transparency' => 92.0,
                'viscosity_tolerance' => 5.0,
                'drying_time_tolerance' => 5.0,
                'transparency_tolerance' => 3.0,
                'max_attempts' => 5,
                'unlock_level_id' => 3,
                'unlock_score' => 0,
                'order' => 4,
                'is_active' => true,
            ],
            [
                'name' => '典藏级·羊皮卷装帧',
                'description' => '最终挑战：修复一本 18 世纪的羊皮卷书。皮革与纸张的混合装订需要一款全能型胶水——黏度高、干燥适中、透明度好，还要有一定的防腐性。',
                'paper_type' => '羊皮纸与皮革',
                'paper_description' => '珍贵的羊皮纸和皮革装订，材质特殊，需要胶水具有多种优良特性。',
                'target_viscosity' => 90.0,
                'target_drying_time' => 40.0,
                'target_transparency' => 80.0,
                'viscosity_tolerance' => 4.0,
                'drying_time_tolerance' => 4.0,
                'transparency_tolerance' => 4.0,
                'max_attempts' => 4,
                'unlock_level_id' => 4,
                'unlock_score' => 0,
                'order' => 5,
                'is_active' => true,
            ],
        ];

        foreach ($levels as $level) {
            DB::table('levels')->updateOrInsert(
                ['order' => $level['order']],
                $level
            );
        }
    }
}

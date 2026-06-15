<?php

namespace Database\Seeders;

use App\Models\Level;
use App\Models\Material;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->seedLevels();
        $this->seedMaterials();

        $this->call([
            NormalCompletionSeeder::class,
            MaterialBatchExceptionSeeder::class,
            RollbackRecalcSeeder::class,
        ]);
    }

    private function seedLevels(): void
    {
        Level::create([
            'name' => '学徒试炼',
            'description' => '初入作坊，学习纸伞骨架装配的基本工序，选择优质材料即可完成',
            'difficulty' => 1,
            'target_score' => 80,
            'humidity_range' => ['min' => 30, 'max' => 55],
        ]);

        Level::create([
            'name' => '匠人考验',
            'description' => '面对材料批次异常和复杂湿度环境，需要在困境中做出正确选择',
            'difficulty' => 2,
            'target_score' => 70,
            'humidity_range' => ['min' => 40, 'max' => 80],
        ]);

        Level::create([
            'name' => '大师挑战',
            'description' => '高难度关卡，质检评分可能需要回滚重算，每一步都影响最终结果',
            'difficulty' => 3,
            'target_score' => 90,
            'humidity_range' => ['min' => 50, 'max' => 90],
        ]);
    }

    private function seedMaterials(): void
    {
        Material::create([
            'type' => 'rib',
            'name' => '精选竹骨',
            'cost' => 30,
            'durability' => 80,
            'compatibility' => [4, 7],
            'batch_code' => 'RIB-001',
            'is_defective' => false,
        ]);

        Material::create([
            'type' => 'rib',
            'name' => '普通竹骨(有裂纹)',
            'cost' => 15,
            'durability' => 35,
            'compatibility' => [5, 8],
            'batch_code' => 'RIB-002',
            'is_defective' => true,
            'defect_description' => '竹骨存在细微裂纹，受力后容易断裂，开合时可能卡顿',
        ]);

        Material::create([
            'type' => 'rib',
            'name' => '老竹弹性骨',
            'cost' => 50,
            'durability' => 95,
            'compatibility' => [6, 9],
            'batch_code' => 'RIB-003',
            'is_defective' => false,
        ]);

        Material::create([
            'type' => 'surface',
            'name' => '桐油棉布面',
            'cost' => 25,
            'durability' => 70,
            'compatibility' => [1, 7],
            'batch_code' => 'SUR-001',
            'is_defective' => false,
        ]);

        Material::create([
            'type' => 'surface',
            'name' => '受潮绢面',
            'cost' => 20,
            'durability' => 30,
            'compatibility' => [2, 8],
            'batch_code' => 'SUR-002',
            'is_defective' => true,
            'defect_description' => '绢面受潮发软，贴合后容易起皱，影响开合顺滑度',
        ]);

        Material::create([
            'type' => 'surface',
            'name' => '高级丝绸面',
            'cost' => 45,
            'durability' => 85,
            'compatibility' => [3, 9],
            'batch_code' => 'SUR-003',
            'is_defective' => false,
        ]);

        Material::create([
            'type' => 'paper',
            'name' => '皮纸(标准)',
            'cost' => 10,
            'durability' => 60,
            'compatibility' => [1, 4],
            'batch_code' => 'PAP-001',
            'is_defective' => false,
        ]);

        Material::create([
            'type' => 'paper',
            'name' => '劣质草纸',
            'cost' => 5,
            'durability' => 20,
            'compatibility' => [2, 5],
            'batch_code' => 'PAP-002',
            'is_defective' => true,
            'defect_description' => '草纸纤维粗糙，糊纸后容易撕裂，贴合不牢固',
        ]);

        Material::create([
            'type' => 'paper',
            'name' => '桑皮纸(特级)',
            'cost' => 35,
            'durability' => 90,
            'compatibility' => [3, 6],
            'batch_code' => 'PAP-003',
            'is_defective' => false,
        ]);
    }
}

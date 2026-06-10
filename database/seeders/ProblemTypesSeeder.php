<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ProblemType;

class ProblemTypesSeeder extends Seeder
{
    public function run(): void
    {
        ProblemType::create(['name' => '环境卫生', 'description' => '门店卫生清洁问题']);
        ProblemType::create(['name' => '商品陈列', 'description' => '商品摆放和展示问题']);
        ProblemType::create(['name' => '设备维护', 'description' => '设备故障或维护问题']);
        ProblemType::create(['name' => '服务质量', 'description' => '服务态度和流程问题']);
        ProblemType::create(['name' => '安全隐患', 'description' => '安全相关问题']);
        ProblemType::create(['name' => '库存管理', 'description' => '库存管理问题']);
    }
}
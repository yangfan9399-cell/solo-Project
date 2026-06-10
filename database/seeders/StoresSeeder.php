<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Store;
use App\Models\User;

class StoresSeeder extends Seeder
{
    public function run(): void
    {
        $storeManager = User::whereHas('roles', function($q) { $q->where('role', 'store_manager'); })->first();
        $regionManager = User::whereHas('roles', function($q) { $q->where('role', 'region_manager'); })->first();

        Store::create([
            'name' => '北京王府井店',
            'code' => 'BJ-WFJ-001',
            'region' => '华北区',
            'address' => '北京市东城区王府井大街100号',
            'level' => 'A级',
            'manager_id' => $storeManager->id,
            'region_manager_id' => $regionManager->id,
        ]);

        Store::create([
            'name' => '北京西单店',
            'code' => 'BJ-XD-002',
            'region' => '华北区',
            'address' => '北京市西城区西单北大街120号',
            'level' => 'B级',
            'manager_id' => $storeManager->id,
            'region_manager_id' => $regionManager->id,
        ]);

        Store::create([
            'name' => '上海南京东路店',
            'code' => 'SH-NJDL-001',
            'region' => '华东区',
            'address' => '上海市黄浦区南京东路200号',
            'level' => 'A级',
            'manager_id' => $storeManager->id,
            'region_manager_id' => $regionManager->id,
        ]);

        Store::create([
            'name' => '上海淮海中路店',
            'code' => 'SH-HHZL-002',
            'region' => '华东区',
            'address' => '上海市徐汇区淮海中路999号',
            'level' => 'B级',
            'manager_id' => $storeManager->id,
            'region_manager_id' => $regionManager->id,
        ]);

        Store::create([
            'name' => '广州天河城店',
            'code' => 'GZ-THE-001',
            'region' => '华南区',
            'address' => '广州市天河区天河路200号',
            'level' => 'A级',
            'manager_id' => $storeManager->id,
            'region_manager_id' => $regionManager->id,
        ]);

        Store::create([
            'name' => '深圳万象城店',
            'code' => 'SZ-WXC-001',
            'region' => '华南区',
            'address' => '深圳市罗湖区宝安南路1881号',
            'level' => 'A级',
            'manager_id' => $storeManager->id,
            'region_manager_id' => $regionManager->id,
        ]);
    }
}
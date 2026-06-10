<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserRole;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $supervisor = User::create([
            'name' => '张三',
            'email' => 'supervisor@example.com',
            'password' => bcrypt('123456'),
        ]);
        UserRole::create(['user_id' => $supervisor->id, 'role' => 'supervisor']);

        $storeManager = User::create([
            'name' => '李四',
            'email' => 'store_manager@example.com',
            'password' => bcrypt('123456'),
        ]);
        UserRole::create(['user_id' => $storeManager->id, 'role' => 'store_manager']);

        $regionManager = User::create([
            'name' => '王五',
            'email' => 'region_manager@example.com',
            'password' => bcrypt('123456'),
        ]);
        UserRole::create(['user_id' => $regionManager->id, 'role' => 'region_manager']);

        $operation = User::create([
            'name' => '赵六',
            'email' => 'operation@example.com',
            'password' => bcrypt('123456'),
        ]);
        UserRole::create(['user_id' => $operation->id, 'role' => 'operation']);

        $rectifier = User::create([
            'name' => '孙七',
            'email' => 'rectifier@example.com',
            'password' => bcrypt('123456'),
        ]);

        $this->command->info('用户和角色已创建');
        $this->command->info('督导: supervisor@example.com / 123456');
        $this->command->info('店长: store_manager@example.com / 123456');
        $this->command->info('区域经理: region_manager@example.com / 123456');
        $this->command->info('运营负责人: operation@example.com / 123456');
        $this->command->info('整改人员: rectifier@example.com / 123456');
    }
}
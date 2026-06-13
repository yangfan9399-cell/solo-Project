<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $businessRole = Role::where('name', 'business_specialist')->first();
        $approvalRole = Role::where('name', 'approval_officer')->first();
        $adminRole = Role::where('name', 'admin')->first();

        User::firstOrCreate(
            ['email' => 'business@example.com'],
            [
                'name' => '张专员',
                'password' => Hash::make('password123'),
                'role_id' => $businessRole->id,
                'employee_no' => 'EMP001',
                'department' => '学生工作部',
                'phone' => '13800138001',
            ]
        );

        User::firstOrCreate(
            ['email' => 'approval@example.com'],
            [
                'name' => '李主任',
                'password' => Hash::make('password123'),
                'role_id' => $approvalRole->id,
                'employee_no' => 'EMP002',
                'department' => '教务处',
                'phone' => '13800138002',
            ]
        );

        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => '王管理员',
                'password' => Hash::make('password123'),
                'role_id' => $adminRole->id,
                'employee_no' => 'EMP003',
                'department' => '信息中心',
                'phone' => '13800138003',
            ]
        );
    }
}

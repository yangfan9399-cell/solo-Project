<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(
            ['name' => 'business_specialist'],
            [
                'display_name' => '业务专员',
                'description' => '负责补充业务记录、现场说明和证据附件',
                'permissions' => [
                    'record.view',
                    'record.create',
                    'record.process',
                    'attachment.upload',
                ],
            ]
        );

        Role::firstOrCreate(
            ['name' => 'approval_officer'],
            [
                'display_name' => '审批负责人',
                'description' => '负责确认结论、退回补证或只读归档',
                'permissions' => [
                    '*',
                ],
            ]
        );

        Role::firstOrCreate(
            ['name' => 'admin'],
            [
                'display_name' => '系统管理员',
                'description' => '系统管理员',
                'permissions' => [
                    '*',
                ],
            ]
        );
    }
}

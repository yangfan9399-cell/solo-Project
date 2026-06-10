<?php

namespace Database\Seeders;

use App\Models\Decoration;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Decoration::create([
            'merchant_name' => '星巴克',
            'merchant_type' => '餐饮',
            'floor' => '1',
            'shop_number' => '101',
            'start_date' => '2024-01-15',
            'end_date' => '2024-02-15',
            'construction_scope' => '店铺整体装修，包括吊顶、墙面、地面、吧台改造',
            'hoarding_type' => '广告围挡',
            'hoarding_width' => 8.5,
            'hoarding_height' => 2.5,
            'hoarding_description' => '使用品牌标准广告围挡，包含品牌logo和宣传画面',
            'fire_materials' => '1. 阻燃吊顶材料\n2. 消防喷淋系统\n3. 灭火器4具\n4. 烟雾报警器',
            'fire_materials_complete' => true,
            'restricted_time' => '施工时间：09:00-22:00，禁止夜间施工',
            'time_conflict' => false,
            'hoarding_dimension_ok' => true,
            'status' => 'approved',
            'engineer_comment' => '图纸审核通过，符合商场装修规范',
            'engineer_reviewed_at' => '2024-01-10 09:00:00',
            'fire_comment' => '消防材料齐全，符合消防安全要求',
            'fire_reviewed_at' => '2024-01-11 14:00:00',
            'manager_comment' => '同意开工，请注意施工安全',
            'manager_approved_at' => '2024-01-12 10:00:00',
        ]);

        Decoration::create([
            'merchant_name' => '优衣库',
            'merchant_type' => '零售',
            'floor' => '2',
            'shop_number' => '205',
            'start_date' => '2024-02-01',
            'end_date' => '2024-02-28',
            'construction_scope' => '店铺装修升级，货架更换，灯光改造',
            'hoarding_type' => '标准围挡',
            'hoarding_width' => 12.0,
            'hoarding_height' => 2.2,
            'hoarding_description' => '使用商场标准白色围挡',
            'fire_materials' => '',
            'fire_materials_complete' => false,
            'restricted_time' => '施工时间：10:00-21:00',
            'time_conflict' => false,
            'hoarding_dimension_ok' => true,
            'status' => 'fire_approved',
            'engineer_comment' => '图纸审核通过',
            'engineer_reviewed_at' => '2024-01-20 11:00:00',
            'fire_comment' => '消防材料清单待补充',
            'fire_reviewed_at' => '2024-01-22 15:00:00',
        ]);

        Decoration::create([
            'merchant_name' => '万达影城',
            'merchant_type' => '娱乐',
            'floor' => '5',
            'shop_number' => '501',
            'start_date' => '2024-03-01',
            'end_date' => '2024-04-15',
            'construction_scope' => '影厅改造升级，新增4DX影厅',
            'hoarding_type' => '标准围挡',
            'hoarding_width' => 15.0,
            'hoarding_height' => 2.8,
            'hoarding_description' => '大面积施工围挡，需注意行人通道',
            'fire_materials' => '1. 防火隔音材料\n2. 消防栓系统升级\n3. 灭火器补充',
            'fire_materials_complete' => true,
            'restricted_time' => '夜间22:00-06:00噪音施工时段与商场规定冲突',
            'time_conflict' => true,
            'hoarding_dimension_ok' => true,
            'status' => 'submitted',
        ]);

        Decoration::create([
            'merchant_name' => '华为体验店',
            'merchant_type' => '零售',
            'floor' => '1',
            'shop_number' => '118',
            'start_date' => '2024-01-20',
            'end_date' => '2024-02-10',
            'construction_scope' => '全新装修，智能体验区打造',
            'hoarding_type' => '广告围挡',
            'hoarding_width' => 6.0,
            'hoarding_height' => 3.0,
            'hoarding_description' => '围挡高度超出规定标准（标准2.5m）',
            'fire_materials' => '1. 阻燃板材\n2. 消防喷淋\n3. 应急照明',
            'fire_materials_complete' => true,
            'restricted_time' => '施工时间：09:00-21:00',
            'time_conflict' => false,
            'hoarding_dimension_ok' => false,
            'status' => 'rejected',
            'engineer_comment' => '围挡高度不符合商场规定，请调整',
            'engineer_reviewed_at' => '2024-01-18 10:00:00',
            'reject_reason' => '围挡高度超出规定标准（标准2.5m）',
        ]);

        Decoration::create([
            'merchant_name' => '海底捞',
            'merchant_type' => '餐饮',
            'floor' => 'B1',
            'shop_number' => 'B101',
            'start_date' => '2024-02-10',
            'end_date' => '2024-03-20',
            'construction_scope' => '新店装修，厨房设备安装',
            'hoarding_type' => '标准围挡',
            'hoarding_width' => 10.0,
            'hoarding_height' => 2.5,
            'hoarding_description' => '标准围挡，预留送餐通道',
            'fire_materials' => '1. 厨房专用防火材料\n2. 油烟净化系统\n3. 灭火器6具\n4. 燃气报警系统',
            'fire_materials_complete' => true,
            'restricted_time' => '施工时间：09:00-22:00',
            'time_conflict' => false,
            'hoarding_dimension_ok' => true,
            'status' => 'engineer_approved',
            'engineer_comment' => '图纸审核通过，厨房布局合理',
            'engineer_reviewed_at' => '2024-02-05 14:00:00',
        ]);

        Decoration::create([
            'merchant_name' => '周大福',
            'merchant_type' => '零售',
            'floor' => '1',
            'shop_number' => '125',
            'start_date' => '2024-01-25',
            'end_date' => '2024-02-15',
            'construction_scope' => '店铺翻新，珠宝展示柜升级',
            'hoarding_type' => '广告围挡',
            'hoarding_width' => 5.0,
            'hoarding_height' => 2.5,
            'hoarding_description' => '品牌形象围挡',
            'fire_materials' => '1. 防火玻璃\n2. 防盗报警系统\n3. 灭火器2具',
            'fire_materials_complete' => true,
            'restricted_time' => '施工时间：10:00-20:00',
            'time_conflict' => false,
            'hoarding_dimension_ok' => true,
            'status' => 'completed',
            'engineer_comment' => '审核通过',
            'engineer_reviewed_at' => '2024-01-22 09:00:00',
            'fire_comment' => '复核通过',
            'fire_reviewed_at' => '2024-01-23 11:00:00',
            'manager_comment' => '批准开工',
            'manager_approved_at' => '2024-01-24 10:00:00',
        ]);
    }
}

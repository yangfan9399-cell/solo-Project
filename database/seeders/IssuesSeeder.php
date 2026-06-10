<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\InspectionIssue;
use App\Models\IssueHistory;
use App\Models\User;
use App\Models\Store;
use App\Models\ProblemType;

class IssuesSeeder extends Seeder
{
    public function run(): void
    {
        $supervisor = User::whereHas('roles', function($q) { $q->where('role', 'supervisor'); })->first();
        $storeManager = User::whereHas('roles', function($q) { $q->where('role', 'store_manager'); })->first();
        $regionManager = User::whereHas('roles', function($q) { $q->where('role', 'region_manager'); })->first();
        $operation = User::whereHas('roles', function($q) { $q->where('role', 'operation'); })->first();
        $rectifier = User::where('email', 'rectifier@example.com')->first();

        $store = Store::first();
        $problemType = ProblemType::first();

        $issue1 = InspectionIssue::create([
            'store_id' => $store->id,
            'problem_type_id' => $problemType->id,
            'description' => '收银台区域地面有污渍，需要清洁',
            'status' => 'closed',
            'reporter_id' => $supervisor->id,
            'rectifier_id' => $rectifier->id,
            'reviewer_id' => $regionManager->id,
            'closer_id' => $operation->id,
            'deadline' => now()->subDay(),
            'rectify_note' => '已安排保洁人员进行清洁，地面已恢复干净',
            'review_note' => '复查通过，清洁效果良好',
            'close_note' => '问题已闭环',
            'photos' => ['photo1.jpg', 'photo2.jpg'],
        ]);

        IssueHistory::create(['issue_id' => $issue1->id, 'action' => 'report', 'operator_id' => $supervisor->id, 'note' => '问题已上报']);
        IssueHistory::create(['issue_id' => $issue1->id, 'action' => 'assign', 'operator_id' => $storeManager->id, 'note' => '已分配整改人']);
        IssueHistory::create(['issue_id' => $issue1->id, 'action' => 'rectify', 'operator_id' => $rectifier->id, 'note' => '整改已提交']);
        IssueHistory::create(['issue_id' => $issue1->id, 'action' => 'review', 'operator_id' => $regionManager->id, 'note' => '复查通过']);
        IssueHistory::create(['issue_id' => $issue1->id, 'action' => 'close', 'operator_id' => $operation->id, 'note' => '已闭环']);

        $issue2 = InspectionIssue::create([
            'store_id' => $store->id,
            'problem_type_id' => ProblemType::find(2)->id,
            'description' => '货架商品陈列不整齐，部分商品标签缺失',
            'status' => 'rectifying',
            'reporter_id' => $supervisor->id,
            'rectifier_id' => $rectifier->id,
            'deadline' => now()->addDay(),
        ]);

        IssueHistory::create(['issue_id' => $issue2->id, 'action' => 'report', 'operator_id' => $supervisor->id, 'note' => '问题已上报']);
        IssueHistory::create(['issue_id' => $issue2->id, 'action' => 'assign', 'operator_id' => $storeManager->id, 'note' => '已分配整改人']);

        $issue3 = InspectionIssue::create([
            'store_id' => $store->id,
            'problem_type_id' => ProblemType::find(3)->id,
            'description' => '空调设备运行异常，制冷效果不佳',
            'status' => 'pending',
            'reporter_id' => $supervisor->id,
            'deadline' => now()->subDays(2),
        ]);

        IssueHistory::create(['issue_id' => $issue3->id, 'action' => 'report', 'operator_id' => $supervisor->id, 'note' => '问题已上报']);

        $issue4 = InspectionIssue::create([
            'store_id' => $store->id,
            'problem_type_id' => ProblemType::find(4)->id,
            'description' => '顾客反馈服务态度较差',
            'status' => 'rejected',
            'reporter_id' => $supervisor->id,
            'rectifier_id' => $rectifier->id,
            'reviewer_id' => $regionManager->id,
            'deadline' => now()->subDay(),
            'rectify_note' => '已对员工进行培训',
            'review_note' => '整改不彻底，需要重新整改',
        ]);

        IssueHistory::create(['issue_id' => $issue4->id, 'action' => 'report', 'operator_id' => $supervisor->id, 'note' => '问题已上报']);
        IssueHistory::create(['issue_id' => $issue4->id, 'action' => 'assign', 'operator_id' => $storeManager->id, 'note' => '已分配整改人']);
        IssueHistory::create(['issue_id' => $issue4->id, 'action' => 'rectify', 'operator_id' => $rectifier->id, 'note' => '整改已提交']);
        IssueHistory::create(['issue_id' => $issue4->id, 'action' => 'reject', 'operator_id' => $regionManager->id, 'note' => '复查不通过']);

        $issue5 = InspectionIssue::create([
            'store_id' => Store::find(2)->id,
            'problem_type_id' => ProblemType::find(5)->id,
            'description' => '消防通道有杂物堆放',
            'status' => 'reviewed',
            'reporter_id' => $supervisor->id,
            'rectifier_id' => $rectifier->id,
            'reviewer_id' => $regionManager->id,
            'deadline' => now()->addDays(2),
            'rectify_note' => '已清理消防通道杂物',
            'review_note' => '复查通过',
            'photos' => ['fire_exit.jpg'],
        ]);

        IssueHistory::create(['issue_id' => $issue5->id, 'action' => 'report', 'operator_id' => $supervisor->id, 'note' => '问题已上报']);
        IssueHistory::create(['issue_id' => $issue5->id, 'action' => 'assign', 'operator_id' => $storeManager->id, 'note' => '已分配整改人']);
        IssueHistory::create(['issue_id' => $issue5->id, 'action' => 'rectify', 'operator_id' => $rectifier->id, 'note' => '整改已提交']);
        IssueHistory::create(['issue_id' => $issue5->id, 'action' => 'review', 'operator_id' => $regionManager->id, 'note' => '复查通过']);
    }
}
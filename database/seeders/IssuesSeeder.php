<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\InspectionIssue;
use App\Models\IssueHistory;
use App\Models\User;
use App\Models\Store;
use App\Models\ProblemType;
use Carbon\Carbon;

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

        // 样本1：正常闭环 - 24小时内整改完成
        $reportTime1 = Carbon::now()->subHours(20);
        $assignTime1 = Carbon::now()->subHours(18);
        $rectifyTime1 = Carbon::now()->subHours(12);  // 整改完成时间：上报后8小时
        $reviewTime1 = Carbon::now()->subHours(6);
        $closeTime1 = Carbon::now()->subHours(2);

        $issue1 = InspectionIssue::create([
            'store_id' => $store->id,
            'problem_type_id' => $problemType->id,
            'description' => '收银台区域地面有污渍，需要清洁',
            'status' => 'closed',
            'reporter_id' => $supervisor->id,
            'rectifier_id' => $rectifier->id,
            'reviewer_id' => $regionManager->id,
            'closer_id' => $operation->id,
            'deadline' => Carbon::now()->subDay(),
            'rectify_note' => '已安排保洁人员进行清洁，地面已恢复干净',
            'review_note' => '复查通过，清洁效果良好',
            'close_note' => '问题已闭环',
            'photos' => ['photo1.jpg', 'photo2.jpg'],
            'created_at' => $reportTime1,
        ]);

        IssueHistory::create(['issue_id' => $issue1->id, 'action' => 'report', 'operator_id' => $supervisor->id, 'note' => '问题已上报', 'created_at' => $reportTime1]);
        IssueHistory::create(['issue_id' => $issue1->id, 'action' => 'assign', 'operator_id' => $storeManager->id, 'note' => '已分配整改人', 'created_at' => $assignTime1]);
        IssueHistory::create(['issue_id' => $issue1->id, 'action' => 'rectify', 'operator_id' => $rectifier->id, 'note' => '整改已提交', 'created_at' => $rectifyTime1]);
        IssueHistory::create(['issue_id' => $issue1->id, 'action' => 'review', 'operator_id' => $regionManager->id, 'note' => '复查通过', 'created_at' => $reviewTime1]);
        IssueHistory::create(['issue_id' => $issue1->id, 'action' => 'close', 'operator_id' => $operation->id, 'note' => '已闭环', 'created_at' => $closeTime1]);

        // 样本2：照片缺失 - rectifying 状态，未整改完成
        $reportTime2 = Carbon::now()->subHours(5);
        $assignTime2 = Carbon::now()->subHours(4);

        $issue2 = InspectionIssue::create([
            'store_id' => $store->id,
            'problem_type_id' => ProblemType::find(2)->id,
            'description' => '货架商品陈列不整齐，部分商品标签缺失',
            'status' => 'rectifying',
            'reporter_id' => $supervisor->id,
            'rectifier_id' => $rectifier->id,
            'deadline' => Carbon::now()->addDay(),
            'created_at' => $reportTime2,
        ]);

        IssueHistory::create(['issue_id' => $issue2->id, 'action' => 'report', 'operator_id' => $supervisor->id, 'note' => '问题已上报', 'created_at' => $reportTime2]);
        IssueHistory::create(['issue_id' => $issue2->id, 'action' => 'assign', 'operator_id' => $storeManager->id, 'note' => '已分配整改人', 'created_at' => $assignTime2]);

        // 样本3：整改超期 - pending 状态，截止日期已过
        $reportTime3 = Carbon::now()->subDays(5);

        $issue3 = InspectionIssue::create([
            'store_id' => $store->id,
            'problem_type_id' => ProblemType::find(3)->id,
            'description' => '空调设备运行异常，制冷效果不佳',
            'status' => 'pending',
            'reporter_id' => $supervisor->id,
            'deadline' => Carbon::now()->subDays(2),  // 截止日期已过
            'created_at' => $reportTime3,
        ]);

        IssueHistory::create(['issue_id' => $issue3->id, 'action' => 'report', 'operator_id' => $supervisor->id, 'note' => '问题已上报', 'created_at' => $reportTime3]);

        // 样本4：复查不通过 - rejected 状态，整改周期超过14天
        $reportTime4 = Carbon::now()->subDays(20);
        $assignTime4 = Carbon::now()->subDays(18);
        $rectifyTime4 = Carbon::now()->subDays(10);  // 整改完成时间：上报后10天（属于3-7天区间）
        $rejectTime4 = Carbon::now()->subDays(8);

        $issue4 = InspectionIssue::create([
            'store_id' => $store->id,
            'problem_type_id' => ProblemType::find(4)->id,
            'description' => '顾客反馈服务态度较差',
            'status' => 'rejected',
            'reporter_id' => $supervisor->id,
            'rectifier_id' => $rectifier->id,
            'reviewer_id' => $regionManager->id,
            'deadline' => Carbon::now()->subDay(),
            'rectify_note' => '已对员工进行培训',
            'review_note' => '整改不彻底，需要重新整改',
            'created_at' => $reportTime4,
        ]);

        IssueHistory::create(['issue_id' => $issue4->id, 'action' => 'report', 'operator_id' => $supervisor->id, 'note' => '问题已上报', 'created_at' => $reportTime4]);
        IssueHistory::create(['issue_id' => $issue4->id, 'action' => 'assign', 'operator_id' => $storeManager->id, 'note' => '已分配整改人', 'created_at' => $assignTime4]);
        IssueHistory::create(['issue_id' => $issue4->id, 'action' => 'rectify', 'operator_id' => $rectifier->id, 'note' => '整改已提交', 'created_at' => $rectifyTime4]);
        IssueHistory::create(['issue_id' => $issue4->id, 'action' => 'reject', 'operator_id' => $regionManager->id, 'note' => '复查不通过', 'created_at' => $rejectTime4]);

        // 样本5：待闭环 - reviewed 状态，整改周期1-3天
        $reportTime5 = Carbon::now()->subDays(4);
        $assignTime5 = Carbon::now()->subDays(3);
        $rectifyTime5 = Carbon::now()->subDays(2);  // 整改完成时间：上报后2天（属于1-3天区间）
        $reviewTime5 = Carbon::now()->subDays(1);

        $issue5 = InspectionIssue::create([
            'store_id' => Store::find(2)->id,
            'problem_type_id' => ProblemType::find(5)->id,
            'description' => '消防通道有杂物堆放',
            'status' => 'reviewed',
            'reporter_id' => $supervisor->id,
            'rectifier_id' => $rectifier->id,
            'reviewer_id' => $regionManager->id,
            'deadline' => Carbon::now()->addDays(2),
            'rectify_note' => '已清理消防通道杂物',
            'review_note' => '复查通过',
            'photos' => ['fire_exit.jpg'],
            'created_at' => $reportTime5,
        ]);

        IssueHistory::create(['issue_id' => $issue5->id, 'action' => 'report', 'operator_id' => $supervisor->id, 'note' => '问题已上报', 'created_at' => $reportTime5]);
        IssueHistory::create(['issue_id' => $issue5->id, 'action' => 'assign', 'operator_id' => $storeManager->id, 'note' => '已分配整改人', 'created_at' => $assignTime5]);
        IssueHistory::create(['issue_id' => $issue5->id, 'action' => 'rectify', 'operator_id' => $rectifier->id, 'note' => '整改已提交', 'created_at' => $rectifyTime5]);
        IssueHistory::create(['issue_id' => $issue5->id, 'action' => 'review', 'operator_id' => $regionManager->id, 'note' => '复查通过', 'created_at' => $reviewTime5]);
    }
}
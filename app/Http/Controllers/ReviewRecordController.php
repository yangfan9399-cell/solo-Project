<?php

namespace App\Http\Controllers;

use App\Models\ReviewRecord;
use App\Services\ReviewService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewRecordController extends Controller
{
    protected $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    public function index(Request $request)
    {
        $filters = $request->only([
            'status', 'anomaly_type', 'is_archived', 'search', 'owner_id', 'per_page', 'page'
        ]);

        $listData = $this->reviewService->getList($filters);
        $statistics = $this->reviewService->getStatistics();

        return Inertia::render('Review/Index', [
            'listData' => $listData,
            'statistics' => $statistics,
            'filters' => $filters,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        
        if (!$user->isBusinessSpecialist() && !$user->isApprovalOfficer()) {
            return back()->with('error', '无权限执行此操作');
        }

        try {
            $data = $request->validate([
                'title' => 'required|string|max:200',
                'source' => 'required|string|max:100',
                'student_name' => 'required|string|max:100',
                'student_id' => 'required|string|max:50',
                'college' => 'required|string|max:100',
                'major' => 'nullable|string|max:100',
                'grade' => 'nullable|string|max:50',
                'scholarship_type' => 'required|string|max:100',
                'scholarship_level' => 'nullable|string|max:50',
                'apply_amount' => 'required|numeric|min:0',
                'apply_count' => 'nullable|integer|min:1',
                'business_note' => 'nullable|string',
            ]);

            $record = $this->reviewService->createRecord($data, $user);

            return back()->with('success', '创建成功');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function show(Request $request, ReviewRecord $record)
    {
        $detail = $this->reviewService->getDetail($record);

        return Inertia::render('Review/Show', [
            'detail' => $detail,
            'tab' => $request->input('tab', 'overview'),
        ]);
    }

    public function process(ReviewRecord $record, Request $request)
    {
        $user = auth()->user();
        
        if (!$user->isBusinessSpecialist() && !$user->isApprovalOfficer()) {
            return back()->with('error', '无权限执行此操作');
        }

        if ($record->is_archived) {
            return back()->with('error', '已归档的记录不能修改');
        }

        try {
            $data = $request->validate([
                'approved_amount' => 'nullable|numeric|min:0',
                'approved_count' => 'nullable|integer|min:1',
                'basis' => 'nullable|string',
                'conclusion' => 'nullable|string',
                'business_note' => 'nullable|string',
                'on_site_note' => 'nullable|string',
                'evidence_note' => 'nullable|string',
                'anomaly_type' => 'nullable|string',
                'block_reason' => 'nullable|string',
                'remedy_path' => 'nullable|string',
                'remark' => 'nullable|string',
            ]);

            $record = $this->reviewService->processRecord($record, $data, $user);

            return back()->with('success', '处理成功');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function review(ReviewRecord $record, Request $request)
    {
        $user = auth()->user();
        
        if (!$user->isApprovalOfficer()) {
            return back()->with('error', '只有审批负责人可以执行此操作');
        }

        if ($record->is_archived) {
            return back()->with('error', '已归档的记录不能修改');
        }

        try {
            $data = $request->validate([
                'action' => 'required|in:confirm,return,archive',
                'approved_amount' => 'nullable|numeric|min:0',
                'basis' => 'nullable|string',
                'conclusion' => 'nullable|string',
                'return_reason' => 'nullable|string',
                'archive_note' => 'nullable|string',
                'remark' => 'nullable|string',
            ]);

            $data['review_opinion'] = $data['remark'] ?? $data['return_reason'] ?? $data['archive_note'] ?? '';

            $record = $this->reviewService->reviewRecord(
                $record, 
                $data['action'], 
                $data, 
                $user
            );

            return back()->with('success', '操作成功');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function reopen(ReviewRecord $record, Request $request)
    {
        $user = auth()->user();
        
        if (!$user->isApprovalOfficer()) {
            return back()->with('error', '只有审批负责人可以执行此操作');
        }

        try {
            $data = $request->validate([
                'reason' => 'required|string|min:10',
            ]);

            $record = $this->reviewService->reopenRecord($record, $data['reason'], $user);

            return back()->with('success', '已重新处理');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function apiList(Request $request)
    {
        $filters = $request->only([
            'status', 'anomaly_type', 'is_archived', 'keyword', 'owner_id', 'per_page'
        ]);

        $listData = $this->reviewService->getList($filters);

        return response()->json($listData);
    }

    public function apiDetail(ReviewRecord $record)
    {
        $detail = $this->reviewService->getDetail($record);

        return response()->json($detail);
    }
}

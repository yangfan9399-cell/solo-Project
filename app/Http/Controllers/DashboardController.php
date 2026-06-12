<?php

namespace App\Http\Controllers;

use App\Models\InspectionRecord;
use App\Models\AbnormalRecord;
use App\Services\InspectionRecordService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected $service;

    public function __construct(InspectionRecordService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $statistics = $this->service->getStatistics();
        $trendData = $this->service->getTrendData(30);

        $abnormalRecords = AbnormalRecord::with([
            'inspectionRecord:id,record_no,status,has_blocking,is_archived',
            'handledBy:id,name,role',
        ])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $latestRecords = InspectionRecord::with([
            'currentResponsible:id,name,role',
            'latestNode.operator:id,name',
        ])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Dashboard/Index', [
            'statistics' => $statistics,
            'trendData' => $trendData,
            'abnormalRecords' => $abnormalRecords,
            'latestRecords' => $latestRecords,
            'drillFilters' => $request->only([
                'status', 'sample_type', 'danger_level', 
                'is_archived', 'has_blocking', 'abnormal_type'
            ]),
        ]);
    }

    public function drilldown(Request $request)
    {
        $params = $request->all();
        $query = InspectionRecord::with([
            'currentResponsible:id,name,role',
            'createdBy:id,name',
            'latestNode',
        ]);

        if (isset($params['status']) && $params['status']) {
            $query->where('status', $params['status']);
        }

        if (isset($params['sample_type']) && $params['sample_type']) {
            $query->where('sample_type', $params['sample_type']);
        }

        if (isset($params['danger_level']) && $params['danger_level']) {
            $query->where('danger_level', $params['danger_level']);
        }

        if (isset($params['is_archived']) && $params['is_archived'] !== '') {
            $query->where('is_archived', $params['is_archived'] === '1');
        }

        if (isset($params['has_blocking']) && $params['has_blocking'] !== '') {
            $query->where('has_blocking', $params['has_blocking'] === '1');
        }

        if (isset($params['abnormal_type']) && $params['abnormal_type']) {
            $query->whereHas('abnormalRecords', function ($q) use ($params) {
                $q->where('abnormal_type', $params['abnormal_type']);
            });
        }

        $records = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        return Inertia::render('Records/Index', [
            'records' => $records,
            'filters' => $params,
            'fromDashboard' => true,
            'drillTitle' => $this->getDrillTitle($params),
        ]);
    }

    protected function getDrillTitle($params): string
    {
        $titles = [];

        if (isset($params['status']) && $params['status']) {
            $titles[] = '状态：' . (InspectionRecord::STATUS_LABELS[$params['status']] ?? $params['status']);
        }

        if (isset($params['sample_type']) && $params['sample_type']) {
            $titles[] = '类型：' . (InspectionRecord::SAMPLE_LABELS[$params['sample_type']] ?? $params['sample_type']);
        }

        if (isset($params['danger_level']) && $params['danger_level']) {
            $titles[] = '等级：' . (InspectionRecord::DANGER_LEVELS[$params['danger_level']] ?? $params['danger_level']);
        }

        if (isset($params['is_archived']) && $params['is_archived'] === '1') {
            $titles[] = '已归档';
        }

        if (isset($params['has_blocking']) && $params['has_blocking'] === '1') {
            $titles[] = '有阻断';
        }

        if (isset($params['abnormal_type']) && $params['abnormal_type']) {
            $types = [
                'number_conflict' => '编号冲突',
                'amount_difference' => '金额差异',
                'quantity_difference' => '数量差异',
                'appeal' => '当事人申诉',
            ];
            $titles[] = '异常：' . ($types[$params['abnormal_type']] ?? $params['abnormal_type']);
        }

        return empty($titles) ? '全部记录' : implode(' | ', $titles);
    }
}

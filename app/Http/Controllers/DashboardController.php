<?php

namespace App\Http\Controllers;

use App\Models\InspectionIssue;
use App\Models\Store;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    private function getIssueQuery()
    {
        $user = Auth::user();
        $query = InspectionIssue::query();

        if ($user->is_store_manager) {
            $storeIds = $user->managedStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        } elseif ($user->is_region_manager) {
            $storeIds = $user->regionStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        }

        return $query;
    }

    public function overview()
    {
        $baseQuery = $this->getIssueQuery();
        $storeIds = $baseQuery->pluck('id')->toArray();

        $stats = [
            'total' => InspectionIssue::whereIn('id', $storeIds)->count(),
            'pending' => InspectionIssue::whereIn('id', $storeIds)->where('status', 'pending')->count(),
            'rectifying' => InspectionIssue::whereIn('id', $storeIds)->where('status', 'rectifying')->count(),
            'reviewing' => InspectionIssue::whereIn('id', $storeIds)->where('status', 'reviewing')->count(),
            'reviewed' => InspectionIssue::whereIn('id', $storeIds)->where('status', 'reviewed')->count(),
            'closed' => InspectionIssue::whereIn('id', $storeIds)->where('status', 'closed')->count(),
            'rejected' => InspectionIssue::whereIn('id', $storeIds)->where('status', 'rejected')->count(),
            'overdue' => InspectionIssue::whereIn('id', $storeIds)->where('status', '<>', 'closed')->where('deadline', '<', now())->count(),
        ];

        return response()->json($stats);
    }

    public function byRegion()
    {
        $user = Auth::user();
        $query = Store::query();

        if ($user->is_store_manager) {
            $query->where('manager_id', $user->id);
        } elseif ($user->is_region_manager) {
            $query->where('region_manager_id', $user->id);
        }

        $regions = $query->select('region', \DB::raw('count(*) as count'))
            ->groupBy('region')
            ->get();

        $baseQuery = $this->getIssueQuery();
        $storeIds = $baseQuery->pluck('id')->toArray();

        $regionStats = [];
        foreach ($regions as $region) {
            $regionStoreIds = Store::where('region', $region->region)->pluck('id');
            $regionStats[] = [
                'region' => $region->region,
                'store_count' => $region->count,
                'issue_count' => InspectionIssue::whereIn('id', $storeIds)->whereIn('store_id', $regionStoreIds)->count(),
            ];
        }

        return response()->json($regionStats);
    }

    public function byLevel()
    {
        $user = Auth::user();
        $query = Store::query();

        if ($user->is_store_manager) {
            $query->where('manager_id', $user->id);
        } elseif ($user->is_region_manager) {
            $query->where('region_manager_id', $user->id);
        }

        $levels = $query->select('level', \DB::raw('count(*) as store_count'))
            ->groupBy('level')
            ->get();

        $baseQuery = $this->getIssueQuery();
        $storeIds = $baseQuery->pluck('id')->toArray();

        $levelStats = [];
        foreach ($levels as $level) {
            $levelStoreIds = Store::where('level', $level->level)->pluck('id');
            $levelStats[] = [
                'level' => $level->level,
                'store_count' => $level->store_count,
                'issue_count' => InspectionIssue::whereIn('id', $storeIds)->whereIn('store_id', $levelStoreIds)->count(),
            ];
        }

        return response()->json($levelStats);
    }

    public function byProblemType()
    {
        $baseQuery = $this->getIssueQuery();
        $storeIds = $baseQuery->pluck('id')->toArray();

        $stats = InspectionIssue::whereIn('id', $storeIds)
            ->select('problem_type_id', \DB::raw('count(*) as count'))
            ->groupBy('problem_type_id')
            ->with('problemType')
            ->get();

        return response()->json($stats);
    }

    public function byCycle()
    {
        $baseQuery = $this->getIssueQuery();
        $storeIds = $baseQuery->pluck('id')->toArray();

        // 整改周期聚合：按整改时长分布（从上报到整改完成的天数）
        // 使用 IssueHistory 表中 action='rectify' 的记录作为整改完成时间节点
        // 避免使用 updated_at，因为复查、闭环、退回会改写该时间
        
        $issues = InspectionIssue::whereIn('id', $storeIds)
            ->select('id', 'status', 'created_at', 'deadline')
            ->get();

        // 获取所有整改完成的历史记录（action = 'rectify'）
        $rectifyHistories = \App\Models\IssueHistory::whereIn('issue_id', $storeIds)
            ->where('action', 'rectify')
            ->select('issue_id', 'created_at')
            ->get()
            ->keyBy('issue_id');

        $stats = [
            'within_24h' => 0,      // 24小时内整改完成
            'within_3d' => 0,       // 1-3天整改完成
            'within_7d' => 0,       // 3-7天整改完成
            'within_14d' => 0,      // 7-14天整改完成
            'over_14d' => 0,        // 14天以上整改完成
            'not_rectified' => 0,   // 未整改完成
            'overdue_not_rectified' => 0, // 超期未整改
        ];

        foreach ($issues as $issue) {
            // 未整改完成的问题（pending 或 rectifying 状态）
            if ($issue->status === 'pending' || $issue->status === 'rectifying') {
                $stats['not_rectified']++;
                // 检查是否超期
                if ($issue->deadline && \Carbon\Carbon::parse($issue->deadline)->lt(now())) {
                    $stats['overdue_not_rectified']++;
                }
                continue;
            }

            // 已整改完成的问题（reviewing/reviewed/closed/rejected）
            // 使用 IssueHistory 中 rectify 记录的 created_at 作为整改完成时间
            $rectifyHistory = $rectifyHistories->get($issue->id);
            
            if (!$rectifyHistory) {
                // 没有整改记录，可能是种子数据，跳过或计入未整改
                continue;
            }

            $createdAt = \Carbon\Carbon::parse($issue->created_at);
            $rectifyAt = \Carbon\Carbon::parse($rectifyHistory->created_at);
            $rectifyDays = $createdAt->diffInDays($rectifyAt);

            if ($rectifyDays < 1) {
                $stats['within_24h']++;
            } elseif ($rectifyDays <= 3) {
                $stats['within_3d']++;
            } elseif ($rectifyDays <= 7) {
                $stats['within_7d']++;
            } elseif ($rectifyDays <= 14) {
                $stats['within_14d']++;
            } else {
                $stats['over_14d']++;
            }
        }

        return response()->json($stats);
    }

    public function recentIssues()
    {
        $user = Auth::user();
        $query = InspectionIssue::with(['store', 'problemType'])
            ->orderBy('created_at', 'desc')
            ->limit(10);

        if ($user->is_store_manager) {
            $storeIds = $user->managedStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        } elseif ($user->is_region_manager) {
            $storeIds = $user->regionStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        }

        return response()->json($query->get());
    }
}
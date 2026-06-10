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
        // 使用独立时间边界，避免 Carbon 对象连续修改导致失真
        
        $issues = InspectionIssue::whereIn('id', $storeIds)
            ->select('id', 'status', 'created_at', 'updated_at', 'deadline')
            ->get();

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
            // 未整改完成的问题
            if ($issue->status === 'pending' || $issue->status === 'rectifying') {
                $stats['not_rectified']++;
                // 检查是否超期
                if ($issue->deadline && \Carbon\Carbon::parse($issue->deadline)->lt(now())) {
                    $stats['overdue_not_rectified']++;
                }
                continue;
            }

            // 已整改完成的问题（reviewing/reviewed/closed/rejected）
            // 计算整改时长：从上报(created_at)到整改完成(updated_at进入reviewing状态)
            $createdAt = \Carbon\Carbon::parse($issue->created_at);
            $updatedAt = \Carbon\Carbon::parse($issue->updated_at);
            $rectifyDays = $createdAt->diffInDays($updatedAt);

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
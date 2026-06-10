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

        $now = now();
        $today = $now->startOfDay();
        $weekAgo = $now->subWeek()->startOfDay();
        $monthAgo = $now->subMonth()->startOfDay();
        $quarterAgo = $now->subQuarter()->startOfDay();

        $stats = [
            'today' => InspectionIssue::whereIn('id', $storeIds)->where('created_at', '>=', $today)->count(),
            'week' => InspectionIssue::whereIn('id', $storeIds)->where('created_at', '>=', $weekAgo)->where('created_at', '<', $today)->count(),
            'month' => InspectionIssue::whereIn('id', $storeIds)->where('created_at', '>=', $monthAgo)->where('created_at', '<', $weekAgo)->count(),
            'quarter' => InspectionIssue::whereIn('id', $storeIds)->where('created_at', '>=', $quarterAgo)->where('created_at', '<', $monthAgo)->count(),
            'older' => InspectionIssue::whereIn('id', $storeIds)->where('created_at', '<', $quarterAgo)->count(),
        ];

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
<?php

namespace App\Http\Controllers;

use App\Models\InspectionIssue;
use App\Models\Store;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function overview()
    {
        $user = Auth::user();
        $query = InspectionIssue::query();

        if ($user->isStoreManager()) {
            $storeIds = $user->managedStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        } elseif ($user->isRegionManager()) {
            $storeIds = $user->regionStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        }

        $stats = [
            'total' => $query->count(),
            'pending' => $query->where('status', 'pending')->count(),
            'rectifying' => $query->where('status', 'rectifying')->count(),
            'reviewed' => $query->where('status', 'reviewed')->count(),
            'closed' => $query->where('status', 'closed')->count(),
            'rejected' => $query->where('status', 'rejected')->count(),
            'overdue' => $query->where('status', '<>', 'closed')->where('deadline', '<', now())->count(),
        ];

        return response()->json($stats);
    }

    public function byRegion()
    {
        $user = Auth::user();
        $query = Store::query();

        if ($user->isStoreManager()) {
            $query->where('manager_id', $user->id);
        } elseif ($user->isRegionManager()) {
            $query->where('region_manager_id', $user->id);
        }

        $regions = $query->select('region', \DB::raw('count(*) as count'))
            ->groupBy('region')
            ->get();

        $regionStats = [];
        foreach ($regions as $region) {
            $regionStats[] = [
                'region' => $region->region,
                'count' => $region->count,
                'issues' => InspectionIssue::whereIn('store_id', Store::where('region', $region->region)->pluck('id'))->count(),
            ];
        }

        return response()->json($regionStats);
    }

    public function byLevel()
    {
        $user = Auth::user();
        $query = Store::query();

        if ($user->isStoreManager()) {
            $query->where('manager_id', $user->id);
        } elseif ($user->isRegionManager()) {
            $query->where('region_manager_id', $user->id);
        }

        $levels = $query->select('level', \DB::raw('count(*) as count'))
            ->groupBy('level')
            ->get();

        return response()->json($levels);
    }

    public function byProblemType()
    {
        $user = Auth::user();
        $query = InspectionIssue::query();

        if ($user->isStoreManager()) {
            $storeIds = $user->managedStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        } elseif ($user->isRegionManager()) {
            $storeIds = $user->regionStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        }

        $stats = $query->select('problem_type_id', \DB::raw('count(*) as count'))
            ->groupBy('problem_type_id')
            ->with('problemType')
            ->get();

        return response()->json($stats);
    }

    public function recentIssues()
    {
        $user = Auth::user();
        $query = InspectionIssue::with(['store', 'problemType'])
            ->orderBy('created_at', 'desc')
            ->limit(10);

        if ($user->isStoreManager()) {
            $storeIds = $user->managedStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        } elseif ($user->isRegionManager()) {
            $storeIds = $user->regionStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        }

        return response()->json($query->get());
    }
}
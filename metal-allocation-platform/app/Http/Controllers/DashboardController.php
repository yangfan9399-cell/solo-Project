<?php

namespace App\Http\Controllers;

use App\Models\Allocation;
use App\Models\AllocationDifference;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $statusCounts = Allocation::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $metalTypeStats = Allocation::selectRaw('metal_type, count(*) as count, sum(amount) as total_amount')
            ->groupBy('metal_type')
            ->get();

        $anomalies = Allocation::with('currentHandler')
            ->whereIn('status', ['blocked', 'appealed'])
            ->latest()
            ->get();

        $differenceStats = AllocationDifference::selectRaw('field_name, count(*) as count')
            ->groupBy('field_name')
            ->get();

        $monthlyTrend = Allocation::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, count(*) as count")
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month');

        return Inertia::render('Dashboard/Index', [
            'statusCounts' => $statusCounts,
            'metalTypeStats' => $metalTypeStats,
            'anomalies' => $anomalies,
            'differenceStats' => $differenceStats,
            'monthlyTrend' => $monthlyTrend,
        ]);
    }

    public function drillDown(Request $request)
    {
        $query = Allocation::with('currentHandler');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('metal_type')) {
            $query->where('metal_type', $request->metal_type);
        }

        $allocations = $query->latest()->paginate(15);

        return Inertia::render('Dashboard/DrillDown', [
            'allocations' => $allocations,
            'filters' => $request->only(['status', 'metal_type']),
        ]);
    }
}

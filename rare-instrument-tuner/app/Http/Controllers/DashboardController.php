<?php

namespace App\Http\Controllers;

use App\Models\TuningSession;
use App\Models\Instrument;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __invoke(Request $request): View
    {
        $totalSessions = TuningSession::count();
        $anomalyCount = TuningSession::where('has_anomaly', true)->count();
        $completedCount = TuningSession::where('status', 'completed')->count();
        $inProgressCount = TuningSession::where('status', 'in_progress')->count();
        $instrumentCount = Instrument::count();

        $recentSessions = TuningSession::with('instrument')
            ->orderByDesc('updated_at')
            ->take(5)
            ->get();

        $anomalySessions = TuningSession::with('instrument')
            ->where('has_anomaly', true)
            ->orderByDesc('updated_at')
            ->take(5)
            ->get();

        return view('dashboard', compact(
            'totalSessions',
            'anomalyCount',
            'completedCount',
            'inProgressCount',
            'instrumentCount',
            'recentSessions',
            'anomalySessions'
        ));
    }
}

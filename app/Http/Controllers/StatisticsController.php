<?php

namespace App\Http\Controllers;

use App\Models\AbnormalRecord;
use App\Models\FollowUp;
use App\Models\Implant;
use App\Models\Surgery;
use Inertia\Inertia;

class StatisticsController extends Controller
{
    public function index()
    {
        $byDoctor = Surgery::selectRaw('doctor_id, count(*) as count')
            ->groupBy('doctor_id')
            ->with('doctor')
            ->get();

        $byBrand = Implant::selectRaw('brand, sum(used_quantity) as count')
            ->groupBy('brand')
            ->get();

        $byAbnormalType = AbnormalRecord::selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->get();

        $followUpStats = FollowUp::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get();

        $totalSurgeries = Surgery::count();
        $totalFollowUps = FollowUp::count();
        $completedFollowUps = FollowUp::where('status', 1)->count();
        $followUpRate = $totalFollowUps > 0 ? ($completedFollowUps / $totalFollowUps) * 100 : 0;

        $stats = [
            'by_doctor' => $byDoctor,
            'by_brand' => $byBrand,
            'by_abnormal_type' => $byAbnormalType,
            'follow_up_stats' => $followUpStats,
            'total_surgeries' => $totalSurgeries,
            'total_follow_ups' => $totalFollowUps,
            'follow_up_rate' => round($followUpRate, 2),
        ];

        return Inertia::render('Statistics/Index', compact('stats'));
    }
}

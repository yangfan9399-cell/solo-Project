<?php

namespace App\Http\Controllers;

use App\Models\TransferRequest;
use App\Models\WasteBatch;
use App\Models\WasteCategory;
use App\Models\Carrier;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total_batches' => WasteBatch::count(),
            'pending_requests' => TransferRequest::whereIn('status', ['pending', 'manifest_verified'])->count(),
            'approved_requests' => TransferRequest::where('status', 'approved')->count(),
            'rejected_requests' => TransferRequest::where('status', 'rejected')->count(),
        ];

        $byCategory = WasteCategory::withCount(['wasteBatches as total_weight' => function($query) {
            $query->select(DB::raw('COALESCE(SUM(weight), 0)'));
        }])->get()->map(function($category) {
            return [
                'name' => $category->name,
                'code' => $category->code,
                'total_weight' => (float) $category->total_weight,
            ];
        });

        $byCarrier = Carrier::withCount(['transferRequests as total_requests' => function($query) {
            $query->select(DB::raw('COUNT(*)'));
        }])->get()->map(function($carrier) {
            return [
                'name' => $carrier->name,
                'total_requests' => $carrier->total_requests,
                'is_expired' => $carrier->isQualificationExpired(),
            ];
        });

        $anomalyReasons = [
            ['reason' => '重量超限', 'count' => TransferRequest::where('is_weight_over_limit', true)->count()],
            ['reason' => '联单缺失', 'count' => TransferRequest::doesntHave('manifestForm')->count()],
            ['reason' => '资质过期', 'count' => TransferRequest::whereHas('carrier', function($query) {
                $query->where('qualification_expiry_date', '<', now());
            })->count()],
        ];

        $completedRequests = TransferRequest::whereIn('status', ['approved', 'rejected', 'archived'])
            ->with('review')
            ->get()
            ->map(function($request) {
                return [
                    'request_number' => $request->request_number,
                    'processing_hours' => $request->getProcessingTimeInHours(),
                    'status' => $request->status_label,
                ];
            });

        $avgProcessingTime = $completedRequests->isNotEmpty()
            ? round($completedRequests->avg('processing_hours'), 2)
            : 0;

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'byCategory' => $byCategory,
            'byCarrier' => $byCarrier,
            'anomalyReasons' => $anomalyReasons,
            'completedRequests' => $completedRequests,
            'avgProcessingTime' => $avgProcessingTime,
        ]);
    }
}

<?php

namespace App\Services;

use App\Models\Sample;
use App\Models\InspectionResult;

class ReviewService
{
    public function searchSamples($filters = [])
    {
        $query = Sample::with([
            'sampler',
            'inspectionResult',
            'disposal',
            'conflictSample',
        ]);

        if (!empty($filters['origin'])) {
            $query->where('origin', 'like', "%{$filters['origin']}%");
        }

        if (!empty($filters['problem_type'])) {
            if ($filters['problem_type'] === 'pesticide_exceeded') {
                $query->whereHas('inspectionResult', function ($q) {
                    $q->where('result', InspectionResult::RESULT_PESTICIDE_EXCEEDED);
                });
            } elseif ($filters['problem_type'] === 'other_unqualified') {
                $query->whereHas('inspectionResult', function ($q) {
                    $q->where('result', InspectionResult::RESULT_OTHER_UNQUALIFIED);
                });
            } elseif ($filters['problem_type'] === 'qualified') {
                $query->whereHas('inspectionResult', function ($q) {
                    $q->where('result', InspectionResult::RESULT_QUALIFIED);
                });
            }
        }

        if (!empty($filters['disposal_result'])) {
            if ($filters['disposal_result'] === 'archived') {
                $query->where('status', Sample::STATUS_ARCHIVED);
            } elseif ($filters['disposal_result'] === 'returned') {
                $query->where('status', Sample::STATUS_RETURNED);
            } elseif ($filters['disposal_result'] === 'processing') {
                $query->where('status', Sample::STATUS_PROCESSING);
            }
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->paginate(15);
    }

    public function getStatistics()
    {
        $total = Sample::count();
        $qualified = Sample::where('status', Sample::STATUS_QUALIFIED)->count();
        $unqualified = Sample::where('status', Sample::STATUS_UNQUALIFIED)->count();
        $processing = Sample::where('status', Sample::STATUS_PROCESSING)->count();
        $archived = Sample::where('status', Sample::STATUS_ARCHIVED)->count();
        $hasConflict = Sample::whereNotNull('conflict_sample_id')->count();
        $reinspection = Sample::where('status', Sample::STATUS_REINSPECTION_APPLIED)->count();

        $origins = Sample::select('origin')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('origin')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();

        return [
            'total' => $total,
            'qualified' => $qualified,
            'unqualified' => $unqualified,
            'processing' => $processing,
            'archived' => $archived,
            'has_conflict' => $hasConflict,
            'reinspection' => $reinspection,
            'qualified_rate' => $total > 0 ? round($qualified / $total * 100, 2) : 0,
            'origins' => $origins,
        ];
    }

    public function getOriginList()
    {
        return Sample::distinct()->pluck('origin')->filter()->values();
    }
}

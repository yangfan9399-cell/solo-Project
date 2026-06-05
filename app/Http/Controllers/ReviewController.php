<?php

namespace App\Http\Controllers;

use App\Services\ReviewService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewController extends Controller
{
    protected $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    public function index(Request $request)
    {
        $filters = $request->only([
            'origin',
            'problem_type',
            'disposal_result',
            'status',
            'date_from',
            'date_to',
        ]);

        $samples = $this->reviewService->searchSamples($filters);

        return Inertia::render('Review/Index', [
            'samples' => $samples,
            'filters' => $filters,
            'origins' => $this->reviewService->getOriginList(),
            'problem_types' => [
                ['value' => 'qualified', 'label' => '合格'],
                ['value' => 'pesticide_exceeded', 'label' => '农残超标'],
                ['value' => 'other_unqualified', 'label' => '其他不合格'],
            ],
            'disposal_results' => [
                ['value' => 'processing', 'label' => '处置中'],
                ['value' => 'archived', 'label' => '已归档'],
                ['value' => 'returned', 'label' => '已退回'],
            ],
        ]);
    }

    public function statistics()
    {
        $statistics = $this->reviewService->getStatistics();

        return Inertia::render('Review/Statistics', [
            'statistics' => $statistics,
        ]);
    }
}

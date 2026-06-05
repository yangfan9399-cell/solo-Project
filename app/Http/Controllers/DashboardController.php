<?php

namespace App\Http\Controllers;

use App\Services\ReviewService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    public function index()
    {
        $statistics = $this->reviewService->getStatistics();
        $recentSamples = $this->reviewService->searchSamples(['limit' => 10]);

        return Inertia::render('Dashboard/Index', [
            'statistics' => $statistics,
            'recentSamples' => $recentSamples->items(),
        ]);
    }
}

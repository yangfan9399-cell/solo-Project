<?php

namespace App\Http\Controllers;

use App\Services\ReviewService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    public function index(Request $request)
    {
        $statistics = $this->reviewService->getStatistics();

        return Inertia::render('Dashboard/Index', [
            'statistics' => $statistics,
            'currentUser' => auth()->user() ? [
                'id' => auth()->user()->id,
                'name' => auth()->user()->name,
                'role' => auth()->user()->role?->name,
                'role_name' => auth()->user()->role?->display_name,
            ] : null,
        ]);
    }

    public function apiStatistics(Request $request)
    {
        $statistics = $this->reviewService->getStatistics();

        return response()->json($statistics);
    }
}

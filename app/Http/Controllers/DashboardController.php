<?php

namespace App\Http\Controllers;

use App\Services\BatchService;
use Illuminate\View\View;

class DashboardController extends Controller
{
    protected BatchService $batchService;

    public function __construct(BatchService $batchService)
    {
        $this->batchService = $batchService;
    }

    public function index(): View
    {
        $stats = $this->batchService->getDashboardStatistics();

        return view('dashboard', [
            'stats' => $stats,
            'seedTypes' => $this->batchService->getSeedTypes(),
        ]);
    }
}

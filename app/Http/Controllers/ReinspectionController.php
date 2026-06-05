<?php

namespace App\Http\Controllers;

use App\Models\ReinspectionRequest;
use App\Models\Sample;
use App\Services\ReinspectionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReinspectionController extends Controller
{
    protected $reinspectionService;

    public function __construct(ReinspectionService $reinspectionService)
    {
        $this->reinspectionService = $reinspectionService;
    }

    public function index(Request $request)
    {
        $query = ReinspectionRequest::with(['sample', 'requester', 'reviewer'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $requests = $query->paginate(15);

        return Inertia::render('Reinspections/Index', [
            'requests' => $requests,
            'filters' => $request->only(['status']),
        ]);
    }

    public function create(Sample $sample)
    {
        $sample->load(['sampler', 'inspectionResult']);

        return Inertia::render('Reinspections/Create', [
            'sample' => $sample,
        ]);
    }

    public function store(Request $request, Sample $sample)
    {
        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        $this->reinspectionService->createRequest($sample, $validated['reason'], auth()->user());

        return redirect()->route('samples.show', $sample)
            ->with('success', '复检申请已提交');
    }

    public function approve(Request $request, ReinspectionRequest $reinspectionRequest)
    {
        $this->authorizeReviewer();

        $validated = $request->validate([
            'review_note' => 'nullable|string',
        ]);

        $this->reinspectionService->approveRequest(
            $reinspectionRequest,
            $validated['review_note'] ?? null,
            auth()->user()
        );

        return redirect()->route('samples.show', $reinspectionRequest->sample)
            ->with('success', '复检申请已批准');
    }

    public function reject(Request $request, ReinspectionRequest $reinspectionRequest)
    {
        $this->authorizeReviewer();

        $validated = $request->validate([
            'review_note' => 'required|string',
        ]);

        $this->reinspectionService->rejectRequest(
            $reinspectionRequest,
            $validated['review_note'],
            auth()->user()
        );

        return redirect()->route('samples.show', $reinspectionRequest->sample)
            ->with('success', '复检申请已拒绝');
    }

    protected function authorizeReviewer()
    {
        if (!auth()->user()->isReviewer()) {
            abort(403, '无权进行此操作');
        }
    }
}

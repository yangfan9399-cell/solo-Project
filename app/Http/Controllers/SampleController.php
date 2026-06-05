<?php

namespace App\Http\Controllers;

use App\Models\Sample;
use App\Services\SampleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SampleController extends Controller
{
    protected $sampleService;

    public function __construct(SampleService $sampleService)
    {
        $this->sampleService = $sampleService;
    }

    public function index(Request $request)
    {
        $query = Sample::with(['sampler', 'conflictSample'])
            ->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('sample_number', 'like', "%{$request->search}%")
                    ->orWhere('product_name', 'like', "%{$request->search}%")
                    ->orWhere('origin', 'like', "%{$request->search}%");
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $samples = $query->paginate(15);

        return Inertia::render('Samples/Index', [
            'samples' => $samples,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        $this->authorizeSampler();

        return Inertia::render('Samples/Create');
    }

    public function store(Request $request)
    {
        $this->authorizeSampler();

        $validated = $request->validate([
            'sample_number' => 'required|string|max:50',
            'product_name' => 'required|string|max:100',
            'origin' => 'required|string|max:200',
            'batch_number' => 'required|string|max:50',
            'production_date' => 'required|date',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'sample_source' => 'nullable|string',
            'evidence_photos' => 'nullable|array',
        ]);

        $sample = $this->sampleService->createSample($validated, auth()->user());

        return redirect()->route('samples.show', $sample)
            ->with('success', '样品登记成功' . ($sample->hasConflict() ? '，但检测到编号冲突' : ''));
    }

    public function show(Sample $sample)
    {
        $sample->load([
            'sampler',
            'inspectionResults.inspector',
            'disposal.reviewer',
            'reinspectionRequests.requester',
            'reinspectionRequests.reviewer',
            'statusHistory.user',
            'conflictSample',
        ]);

        return Inertia::render('Samples/Show', [
            'sample' => $sample,
        ]);
    }

    public function updateSource(Request $request, Sample $sample)
    {
        $this->authorizeSampler();

        $validated = $request->validate([
            'sample_source' => 'required|string',
        ]);

        $this->sampleService->updateSampleSource($sample, $validated['sample_source'], auth()->user());

        return back()->with('success', '来源信息补充成功');
    }

    public function resolveConflict(Request $request, Sample $sample)
    {
        $validated = $request->validate([
            'new_sample_number' => 'required|string|max:50|unique:samples,sample_number',
        ]);

        $this->sampleService->resolveConflict($sample, $validated['new_sample_number'], auth()->user());

        return back()->with('success', '编号冲突已解决');
    }

    public function checkConflict(Request $request)
    {
        $request->validate([
            'sample_number' => 'required|string',
            'exclude_id' => 'nullable|exists:samples,id',
        ]);

        $conflict = $this->sampleService->checkSampleNumberConflict(
            $request->sample_number,
            $request->exclude_id
        );

        return response()->json([
            'has_conflict' => !is_null($conflict),
            'conflict_sample' => $conflict,
        ]);
    }

    protected function authorizeSampler()
    {
        if (!auth()->user()->isSampler() && !auth()->user()->isReviewer()) {
            abort(403, '无权进行此操作');
        }
    }
}

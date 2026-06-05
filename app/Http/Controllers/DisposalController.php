<?php

namespace App\Http\Controllers;

use App\Models\Sample;
use App\Models\Disposal;
use App\Services\DisposalService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DisposalController extends Controller
{
    protected $disposalService;

    public function __construct(DisposalService $disposalService)
    {
        $this->disposalService = $disposalService;
    }

    public function index(Request $request)
    {
        $this->authorizeReviewer();

        $query = Sample::with(['sampler', 'inspectionResult', 'disposal', 'conflictSample'])
            ->whereIn('status', [Sample::STATUS_UNQUALIFIED, Sample::STATUS_PROCESSING])
            ->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('sample_number', 'like', "%{$request->search}%")
                    ->orWhere('product_name', 'like', "%{$request->search}%");
            });
        }

        $samples = $query->paginate(15);

        return Inertia::render('Disposals/Index', [
            'samples' => $samples,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(Sample $sample)
    {
        $this->authorizeReviewer();

        if (!$sample->canBeDisposed()) {
            return back()->with('error', $sample->hasConflict() 
                ? '样品存在编号冲突，无法进行处置，请先解决冲突' 
                : '样品当前状态不允许处置');
        }

        $sample->load(['sampler', 'inspectionResult']);

        return Inertia::render('Disposals/Create', [
            'sample' => $sample,
            'actions' => [
                ['value' => 'release', 'label' => '放行'],
                ['value' => 'destroy', 'label' => '销毁'],
                ['value' => 'return_to_origin', 'label' => '退回产地'],
                ['value' => 'reinspection', 'label' => '复检'],
                ['value' => 'return_to_sampler', 'label' => '退回抽样员'],
            ],
        ]);
    }

    public function store(Request $request, Sample $sample)
    {
        $this->authorizeReviewer();

        $validated = $request->validate([
            'suggestion' => 'required|string',
            'action' => 'required|in:release,destroy,return_to_origin,reinspection,return_to_sampler',
        ]);

        try {
            $this->disposalService->createDisposal($sample, $validated, auth()->user());
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('samples.show', $sample)
            ->with('success', '处置建议创建成功');
    }

    public function approve(Request $request, Disposal $disposal)
    {
        $this->authorizeReviewer();

        $validated = $request->validate([
            'decision_note' => 'nullable|string',
        ]);

        $this->disposalService->approveDisposal($disposal, $validated['decision_note'] ?? null, auth()->user());

        return redirect()->route('samples.show', $disposal->sample)
            ->with('success', '处置已批准');
    }

    public function return(Request $request, Disposal $disposal)
    {
        $this->authorizeReviewer();

        $validated = $request->validate([
            'return_note' => 'required|string',
        ]);

        $this->disposalService->returnToSampler($disposal, $validated['return_note'], auth()->user());

        return redirect()->route('samples.show', $disposal->sample)
            ->with('success', '已退回抽样员');
    }

    public function archive(Sample $sample)
    {
        $this->authorizeReviewer();

        $this->disposalService->archiveSample($sample, auth()->user());

        return redirect()->route('samples.show', $sample)
            ->with('success', '样品已归档');
    }

    protected function authorizeReviewer()
    {
        if (!auth()->user()->isReviewer()) {
            abort(403, '无权进行此操作');
        }
    }
}

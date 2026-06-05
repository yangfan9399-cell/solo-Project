<?php

namespace App\Http\Controllers;

use App\Models\Sample;
use App\Services\InspectionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InspectionController extends Controller
{
    protected $inspectionService;

    public function __construct(InspectionService $inspectionService)
    {
        $this->inspectionService = $inspectionService;
    }

    public function index(Request $request)
    {
        $this->authorizeInspector();

        $query = Sample::with(['sampler', 'inspectionResult'])
            ->whereIn('status', [Sample::STATUS_REGISTERED, Sample::STATUS_TESTING])
            ->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('sample_number', 'like', "%{$request->search}%")
                    ->orWhere('product_name', 'like', "%{$request->search}%");
            });
        }

        $samples = $query->paginate(15);

        return Inertia::render('Inspections/Index', [
            'samples' => $samples,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(Sample $sample)
    {
        $this->authorizeInspector();

        $sample->load('sampler');

        return Inertia::render('Inspections/Create', [
            'sample' => $sample,
            'default_indicators' => $this->inspectionService->getDefaultIndicators(),
        ]);
    }

    public function store(Request $request, Sample $sample)
    {
        $this->authorizeInspector();

        $validated = $request->validate([
            'inspection_date' => 'required|date',
            'indicators' => 'required|array',
            'result' => 'required|in:qualified,pesticide_exceeded,other_unqualified',
            'conclusion' => 'required|string',
            'report_file' => 'nullable|string',
        ]);

        $this->inspectionService->submitResult($sample, $validated, auth()->user());

        return redirect()->route('samples.show', $sample)
            ->with('success', '检测结果提交成功');
    }

    public function determineResult(Request $request)
    {
        $validated = $request->validate([
            'indicators' => 'required|array',
        ]);

        $result = $this->inspectionService->determineResult($validated['indicators']);

        return response()->json([
            'result' => $result,
            'result_name' => match ($result) {
                'qualified' => '合格',
                'pesticide_exceeded' => '农残超标',
                'other_unqualified' => '其他不合格',
                default => '未知',
            },
        ]);
    }

    protected function authorizeInspector()
    {
        if (!auth()->user()->isInspector() && !auth()->user()->isReviewer()) {
            abort(403, '无权进行此操作');
        }
    }
}

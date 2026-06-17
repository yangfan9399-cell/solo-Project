<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Services\BatchService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\JsonResponse;

class BatchController extends Controller
{
    protected BatchService $batchService;

    public function __construct(BatchService $batchService)
    {
        $this->batchService = $batchService;
    }

    public function index(Request $request): View
    {
        $query = Batch::with('unresolvedAnomalies')->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('batch_code', 'like', "%{$search}%")
                  ->orWhere('trace_code', 'like', "%{$search}%")
                  ->orWhere('operator', 'like', "%{$search}%");
            });
        }

        if ($request->filled('seed_type')) {
            $query->where('seed_type', $request->seed_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('has_anomaly')) {
            if ($request->has_anomaly === 'yes') {
                $query->whereHas('unresolvedAnomalies');
            } elseif ($request->has_anomaly === 'no') {
                $query->doesntHave('unresolvedAnomalies');
            }
        }

        if ($request->filled('date_from')) {
            $query->whereDate('production_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('production_date', '<=', $request->date_to);
        }

        if ($request->filled('yield_min')) {
            $query->where('oil_yield_rate', '>=', $request->yield_min);
        }

        if ($request->filled('yield_max')) {
            $query->where('oil_yield_rate', '<=', $request->yield_max);
        }

        $batches = $query->paginate(15)->appends($request->all());

        return view('batches.index', [
            'batches' => $batches,
            'seedTypes' => $this->batchService->getSeedTypes(),
            'filters' => $request->all(),
        ]);
    }

    public function create(): View
    {
        return view('batches.create', [
            'seedTypes' => $this->batchService->getSeedTypes(),
            'defaultSeedType' => '花生',
            'defaultProductionDate' => now()->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'seed_type' => 'required|string|in:花生,菜籽,芝麻,大豆,茶籽,核桃',
            'seed_weight' => 'required|numeric|min:0',
            'moisture_content' => 'required|numeric|min:0|max:100',
            'roasting_temperature' => 'required|numeric|min:0|max:300',
            'roasting_duration' => 'required|integer|min:0',
            'pressing_pressure' => 'required|numeric|min:0|max:200',
            'pressing_duration' => 'required|integer|min:0',
            'oil_output' => 'required|numeric|min:0',
            'settling_time' => 'required|integer|min:0',
            'sediment_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'operator' => 'nullable|string|max:50',
            'production_date' => 'required|date',
        ]);

        $batchCode = $this->batchService->generateBatchCode($validated['seed_type'], $validated['production_date']);
        $traceCode = $this->batchService->generateTraceCode($batchCode);
        $oilYieldRate = $this->batchService->calculateOilYieldRate(
            (float)$validated['oil_output'],
            (float)$validated['seed_weight']
        );

        $batch = Batch::create(array_merge($validated, [
            'batch_code' => $batchCode,
            'trace_code' => $traceCode,
            'oil_yield_rate' => $oilYieldRate,
            'sediment_amount' => $validated['sediment_amount'] ?? 0,
            'version' => 1,
        ]));

        $anomalies = $this->batchService->checkAnomalies($batch);
        $this->batchService->saveAnomalies($batch, $anomalies);

        $this->batchService->createVersion($batch, '创建批次记录', $validated['operator'] ?? null);

        $anomalyCount = count($anomalies);
        return redirect()->route('batches.show', $batch)
            ->with('success', "批次 [{$batch->batch_code}] 创建成功！检测到 {$anomalyCount} 项异常。");
    }

    public function show(Batch $batch): View
    {
        $batch->load('versions', 'anomalies');
        $thresholds = $this->batchService->getThresholds($batch->seed_type);

        return view('batches.show', [
            'batch' => $batch,
            'thresholds' => $thresholds,
        ]);
    }

    public function edit(Batch $batch): View
    {
        return view('batches.edit', [
            'batch' => $batch,
            'seedTypes' => $this->batchService->getSeedTypes(),
            'thresholds' => $this->batchService->getThresholds($batch->seed_type),
        ]);
    }

    public function update(Request $request, Batch $batch): RedirectResponse
    {
        $validated = $request->validate([
            'seed_type' => 'required|string|in:花生,菜籽,芝麻,大豆,茶籽,核桃',
            'seed_weight' => 'required|numeric|min:0',
            'moisture_content' => 'required|numeric|min:0|max:100',
            'roasting_temperature' => 'required|numeric|min:0|max:300',
            'roasting_duration' => 'required|integer|min:0',
            'pressing_pressure' => 'required|numeric|min:0|max:200',
            'pressing_duration' => 'required|integer|min:0',
            'oil_output' => 'required|numeric|min:0',
            'settling_time' => 'required|integer|min:0',
            'sediment_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'operator' => 'nullable|string|max:50',
            'production_date' => 'required|date',
            'change_summary' => 'nullable|string|max:255',
        ]);

        $oilYieldRate = $this->batchService->calculateOilYieldRate(
            (float)$validated['oil_output'],
            (float)$validated['seed_weight']
        );

        $batch->version = $batch->version + 1;
        $batch->fill(array_merge($validated, [
            'oil_yield_rate' => $oilYieldRate,
            'sediment_amount' => $validated['sediment_amount'] ?? 0,
        ]));
        $batch->save();

        $anomalies = $this->batchService->checkAnomalies($batch);
        $this->batchService->saveAnomalies($batch, $anomalies);

        $this->batchService->createVersion(
            $batch,
            $validated['change_summary'] ?? '更新批次数据',
            $validated['operator'] ?? null
        );

        $version = $batch->version;
        return redirect()->route('batches.show', $batch)
            ->with('success', "批次 [{$batch->batch_code}] 更新成功！当前版本 v{$version}。");
    }

    public function destroy(Batch $batch): RedirectResponse
    {
        $batchCode = $batch->batch_code;
        $batch->delete();

        return redirect()->route('batches.index')
            ->with('success', "批次 [{$batchCode}] 已删除。");
    }

    public function checkAnomalies(Request $request, ?Batch $batch = null): JsonResponse
    {
        $data = $request->validate([
            'seed_type' => 'required|string',
            'moisture_content' => 'required|numeric',
            'roasting_temperature' => 'required|numeric',
            'roasting_duration' => 'required|integer',
            'pressing_pressure' => 'required|numeric',
            'pressing_duration' => 'required|integer',
            'oil_yield_rate' => 'required|numeric',
            'settling_time' => 'required|integer',
        ]);

        $tempBatch = new Batch($data);
        $tempBatch->seed_type = $data['seed_type'];
        $tempBatch->moisture_content = $data['moisture_content'];
        $tempBatch->roasting_temperature = $data['roasting_temperature'];
        $tempBatch->roasting_duration = $data['roasting_duration'];
        $tempBatch->pressing_pressure = $data['pressing_pressure'];
        $tempBatch->pressing_duration = $data['pressing_duration'];
        $tempBatch->oil_yield_rate = $data['oil_yield_rate'];
        $tempBatch->settling_time = $data['settling_time'];

        $anomalies = $this->batchService->checkAnomalies($tempBatch);

        $highCount = count(array_filter($anomalies, fn($a) => $a['anomaly_type'] === 'high'));
        $mediumCount = count(array_filter($anomalies, fn($a) => $a['anomaly_type'] === 'medium'));
        $lowCount = count(array_filter($anomalies, fn($a) => $a['anomaly_type'] === 'low'));

        return response()->json([
            'anomalies' => $anomalies,
            'count' => count($anomalies),
            'high_count' => $highCount,
            'medium_count' => $mediumCount,
            'low_count' => $lowCount,
        ]);
    }
}

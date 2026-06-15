<?php

namespace App\Http\Controllers;

use App\Models\DrumMasterRecord;
use App\Models\DrumDetailRecord;
use App\Models\TensionHistoryRecord;
use App\Models\TuningResultRecord;
use App\Models\TensionTable;
use App\Models\TuningComparison;
use App\Services\SpectrumAnalysisService;
use App\Services\TensionTableService;
use App\Services\TuningComparisonService;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DrumTuningController extends Controller
{
    protected $spectrumService;
    protected $tensionTableService;
    protected $comparisonService;
    protected $exportService;

    public function __construct(
        SpectrumAnalysisService $spectrumService,
        TensionTableService $tensionTableService,
        TuningComparisonService $comparisonService,
        ExportService $exportService
    ) {
        $this->spectrumService = $spectrumService;
        $this->tensionTableService = $tensionTableService;
        $this->comparisonService = $comparisonService;
        $this->exportService = $exportService;
    }

    public function index()
    {
        $records = DrumMasterRecord::with(['detailRecords', 'latestResult'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $comparisons = TuningComparison::orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $stats = [
            'total_records' => DrumMasterRecord::count(),
            'completed_records' => DrumMasterRecord::where('status', 'completed')->count(),
            'total_comparisons' => TuningComparison::count(),
            'anomaly_count' => TuningResultRecord::where('spectrum_anomaly', true)->count(),
        ];

        return view('drum-tuning.index', compact('records', 'comparisons', 'stats'));
    }

    public function create()
    {
        return view('drum-tuning.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'batch_number' => 'required|unique:drum_master_records|max:50',
            'version' => 'required|max:20',
            'drum_diameter' => 'required|numeric|min:1|max:100',
            'musician_name' => 'required|max:100',
            'record_date' => 'required|date',
            'notes' => 'nullable',
            'drumhead_material' => 'required|max:50',
            'drumhead_brand' => 'nullable|max:100',
            'drumhead_thickness' => 'nullable|numeric',
            'drum_side' => 'required|in:batter,resonant',
        ]);

        DB::transaction(function () use ($validated) {
            $master = DrumMasterRecord::create([
                'batch_number' => $validated['batch_number'],
                'version' => $validated['version'],
                'drum_diameter' => $validated['drum_diameter'],
                'musician_name' => $validated['musician_name'],
                'record_date' => $validated['record_date'],
                'notes' => $validated['notes'],
            ]);

            $master->detailRecords()->create([
                'drumhead_material' => $validated['drumhead_material'],
                'drumhead_brand' => $validated['drumhead_brand'],
                'drumhead_thickness' => $validated['drumhead_thickness'],
                'drum_side' => $validated['drum_side'],
                'sort_order' => 1,
            ]);
        });

        return redirect()->route('drum-tuning.index')
            ->with('success', '鼓皮张力调校记录创建成功');
    }

    public function show($id)
    {
        $master = DrumMasterRecord::with([
            'detailRecords',
            'tensionHistoryRecords' => function ($q) {
                $q->orderBy('measured_at', 'desc');
            },
            'tuningResultRecords' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'tensionTables',
        ])->findOrFail($id);

        $latestResult = $master->latestResult;
        $spectrumData = $latestResult?->spectrumData()->orderBy('frequency')->get();

        $currentTable = $master->currentTensionTable;
        $tableVersions = $this->tensionTableService->getTableVersions(
            $master,
            $currentTable?->table_name ?? 'default'
        );

        $tensionChartData = $this->generateTensionChartData($master);

        return view('drum-tuning.show', compact(
            'master',
            'latestResult',
            'spectrumData',
            'currentTable',
            'tableVersions',
            'tensionChartData'
        ));
    }

    public function edit($id)
    {
        $master = DrumMasterRecord::with('detailRecords')->findOrFail($id);
        return view('drum-tuning.edit', compact('master'));
    }

    public function update(Request $request, $id)
    {
        $master = DrumMasterRecord::findOrFail($id);

        $validated = $request->validate([
            'batch_number' => 'required|max:50|unique:drum_master_records,batch_number,' . $id,
            'version' => 'required|max:20',
            'drum_diameter' => 'required|numeric|min:1|max:100',
            'musician_name' => 'required|max:100',
            'record_date' => 'required|date',
            'status' => 'required|in:draft,completed,rolled_back',
            'notes' => 'nullable',
        ]);

        $master->update($validated);

        return redirect()->route('drum-tuning.show', $id)
            ->with('success', '记录更新成功');
    }

    public function addTension(Request $request, $id)
    {
        $master = DrumMasterRecord::findOrFail($id);

        $validated = $request->validate([
            'rope_tension' => 'required|numeric|min:0',
            'measurement_point' => 'required|integer|min:1',
            'tuning_key_turns' => 'nullable|numeric',
            'operator' => 'nullable|max:50',
            'adjustment_reason' => 'nullable',
            'measured_at' => 'nullable|date',
        ]);

        $master->tensionHistoryRecords()->create([
            'rope_tension' => $validated['rope_tension'],
            'measurement_point' => $validated['measurement_point'],
            'tuning_key_turns' => $validated['tuning_key_turns'] ?? 0,
            'operator' => $validated['operator'],
            'adjustment_reason' => $validated['adjustment_reason'],
            'measured_at' => $validated['measured_at'] ?? now(),
        ]);

        return back()->with('success', '张力记录添加成功');
    }

    public function addResult(Request $request, $id)
    {
        $master = DrumMasterRecord::findOrFail($id);

        $validated = $request->validate([
            'strike_frequency' => 'required|numeric|min:0',
            'target_frequency' => 'nullable|numeric|min:0',
            'performance_environment' => 'required|max:100',
            'ambient_temp' => 'nullable|numeric',
            'ambient_humidity' => 'nullable|numeric',
            'ambient_pressure' => 'nullable|numeric',
            'performance_notes' => 'nullable',
            'sound_quality_assessment' => 'nullable',
            'generate_spectrum' => 'nullable|boolean',
            'spectrum_anomaly' => 'nullable|boolean',
            'anomaly_type' => 'nullable|max:50',
        ]);

        DB::transaction(function () use ($master, $validated) {
            $result = $master->tuningResultRecords()->create([
                'strike_frequency' => $validated['strike_frequency'],
                'target_frequency' => $validated['target_frequency'],
                'performance_environment' => $validated['performance_environment'],
                'ambient_temp' => $validated['ambient_temp'],
                'ambient_humidity' => $validated['ambient_humidity'],
                'ambient_pressure' => $validated['ambient_pressure'],
                'performance_notes' => $validated['performance_notes'],
                'sound_quality_assessment' => $validated['sound_quality_assessment'],
                'spectrum_anomaly' => $validated['spectrum_anomaly'] ?? false,
                'anomaly_type' => $validated['anomaly_type'],
            ]);

            if (!empty($validated['generate_spectrum'])) {
                if ($validated['spectrum_anomaly'] ?? false) {
                    $spectrum = $this->spectrumService->generateAnomalySpectrum(
                        $validated['strike_frequency'],
                        $validated['anomaly_type'] ?? 'subharmonic'
                    );
                } else {
                    $spectrum = $this->spectrumService->generateSpectrum($result);
                }
                
                $this->spectrumService->saveSpectrum($result, $spectrum);
                
                $analysis = $this->spectrumService->analyzeSpectrum($result);
                $result->update([
                    'spectrum_anomaly' => $analysis['has_anomaly'],
                    'anomaly_type' => $analysis['anomaly_type'],
                    'anomaly_description' => $analysis['anomaly_description'],
                ]);
            }
        });

        return back()->with('success', '调校结果添加成功');
    }

    public function generateTensionTable(Request $request, $id)
    {
        $master = DrumMasterRecord::findOrFail($id);

        $validated = $request->validate([
            'table_name' => 'required|max:100',
            'min_tension' => 'required|numeric|min:0',
            'max_tension' => 'required|numeric|min:0',
            'point_count' => 'required|integer|min:2|max:50',
            'target_frequency' => 'nullable|numeric',
        ]);

        $tableData = $this->tensionTableService->generateTensionTable($master, $validated['table_name'], [
            'min_tension' => $validated['min_tension'],
            'max_tension' => $validated['max_tension'],
            'point_count' => $validated['point_count'],
            'target_frequency' => $validated['target_frequency'],
        ]);

        $this->tensionTableService->saveTensionTable($master, $validated['table_name'], $tableData, [
            'note' => '系统生成',
        ]);

        return back()->with('success', '张力表生成成功');
    }

    public function rollbackTensionTable(Request $request, $id)
    {
        $master = DrumMasterRecord::findOrFail($id);

        $validated = $request->validate([
            'table_name' => 'required|max:100',
            'target_version' => 'required|max:20',
        ]);

        $result = $this->tensionTableService->rollbackTensionTable(
            $master,
            $validated['table_name'],
            $validated['target_version']
        );

        if ($result) {
            return back()->with('success', '张力表回滚成功');
        } else {
            return back()->with('error', '张力表回滚失败，目标版本不存在');
        }
    }

    public function recalculateTensionTable(Request $request, $id)
    {
        $master = DrumMasterRecord::findOrFail($id);

        $validated = $request->validate([
            'table_name' => 'required|max:100',
            'drum_diameter' => 'nullable|numeric',
            'drumhead_material' => 'nullable|max:50',
            'target_frequency' => 'nullable|numeric',
        ]);

        $result = $this->tensionTableService->recalculateTensionTable($master, $validated['table_name'], [
            'drum_diameter' => $validated['drum_diameter'] ?? $master->drum_diameter,
            'drumhead_material' => $validated['drumhead_material'] ?? '牛皮',
            'target_frequency' => $validated['target_frequency'],
        ]);

        if ($result['success']) {
            return back()->with('success', "张力表重算成功，新版本: {$result['new_version']}");
        } else {
            return back()->with('error', $result['message']);
        }
    }

    public function comparisonIndex()
    {
        $comparisons = TuningComparison::orderBy('created_at', 'desc')->paginate(10);
        $records = DrumMasterRecord::where('status', 'completed')->get();

        return view('drum-tuning.comparison-index', compact('comparisons', 'records'));
    }

    public function comparisonCreate(Request $request)
    {
        $validated = $request->validate([
            'comparison_name' => 'required|max:150',
            'description' => 'nullable',
            'record_ids' => 'required|array|min:2',
        ]);

        $comparison = $this->comparisonService->createComparison(
            $validated['record_ids'],
            $validated['comparison_name'],
            $validated['description'] ?? ''
        );

        $result = $this->comparisonService->executeComparison($comparison);

        if ($result['success']) {
            return redirect()->route('comparison.show', $comparison->id)
                ->with('success', '比较方案创建并执行成功');
        } else {
            return back()->with('error', $result['message']);
        }
    }

    public function comparisonShow($id)
    {
        $comparison = TuningComparison::findOrFail($id);
        $data = $this->comparisonService->getComparisonWithDetails($comparison);

        return view('drum-tuning.comparison-show', compact('comparison', 'data'));
    }

    public function exportRecord($id)
    {
        $master = DrumMasterRecord::findOrFail($id);
        $csvContent = $this->exportService->exportRecordToCsv($master);
        $filename = $this->exportService->generateExportFileName("tuning_record_{$master->batch_number}");

        return response($csvContent)
            ->header('Content-Type', 'text/csv; charset=utf-8')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    public function exportComparison($id)
    {
        $comparison = TuningComparison::findOrFail($id);
        $csvContent = $this->exportService->exportComparisonToCsv($comparison);
        $filename = $this->exportService->generateExportFileName("comparison_{$comparison->id}");

        return response($csvContent)
            ->header('Content-Type', 'text/csv; charset=utf-8')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    protected function generateTensionChartData($master): array
    {
        $history = $master->tensionHistoryRecords()
            ->where('is_rollback', false)
            ->orderBy('measured_at')
            ->get();

        $labels = [];
        $data = [];

        foreach ($history as $record) {
            $labels[] = $record->measured_at?->format('m-d H:i') ?? "点{$record->measurement_point}";
            $data[] = $record->rope_tension;
        }

        return [
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => '拉绳张力(N)',
                    'data' => $data,
                    'borderColor' => 'rgb(59, 130, 246)',
                    'backgroundColor' => 'rgba(59, 130, 246, 0.1)',
                    'fill' => true,
                    'tension' => 0.3,
                ],
            ],
        ];
    }
}

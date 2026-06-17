<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\BatchVersion;
use App\Services\BatchService;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class VersionController extends Controller
{
    protected BatchService $batchService;

    public function __construct(BatchService $batchService)
    {
        $this->batchService = $batchService;
    }

    public function index(Batch $batch): View
    {
        $versions = $batch->versions()
            ->with('batch')
            ->orderBy('version_number', 'desc')
            ->paginate(10);

        return view('versions.index', [
            'batch' => $batch,
            'versions' => $versions,
        ]);
    }

    public function show(Batch $batch, BatchVersion $version): View
    {
        return view('versions.show', [
            'batch' => $batch,
            'version' => $version,
            'thresholds' => $this->batchService->getThresholds($batch->seed_type),
        ]);
    }

    public function compare(Batch $batch, BatchVersion $version): View
    {
        $currentData = $this->getComparableBatchData($batch);
        $versionData = $version->toArrayForComparison();

        $fieldLabels = [
            'seed_type' => '油料种类',
            'seed_weight' => '原料重量(kg)',
            'moisture_content' => '原料水分含量(%)',
            'roasting_temperature' => '炒籽温度(℃)',
            'roasting_duration' => '炒籽时长(分钟)',
            'pressing_pressure' => '压榨压力(MPa)',
            'pressing_duration' => '压榨时长(分钟)',
            'oil_output' => '出油量(L)',
            'oil_yield_rate' => '出油率(%)',
            'settling_time' => '沉淀时间(小时)',
            'sediment_amount' => '沉淀物量(kg)',
            'notes' => '备注',
            'operator' => '操作员',
            'production_date' => '生产日期',
        ];

        $differences = [];
        foreach ($fieldLabels as $key => $label) {
            $oldValue = $versionData[$key] ?? '';
            $newValue = $currentData[$key] ?? '';
            $differences[] = [
                'field' => $key,
                'label' => $label,
                'old_value' => $oldValue,
                'new_value' => $newValue,
                'changed' => (string)$oldValue !== (string)$newValue,
            ];
        }

        return view('versions.compare', [
            'batch' => $batch,
            'version' => $version,
            'differences' => $differences,
        ]);
    }

    public function restore(Batch $batch, BatchVersion $version): RedirectResponse
    {
        $batch->version = $batch->version + 1;
        $batch->update([
            'seed_type' => $version->seed_type,
            'seed_weight' => $version->seed_weight,
            'moisture_content' => $version->moisture_content,
            'roasting_temperature' => $version->roasting_temperature,
            'roasting_duration' => $version->roasting_duration,
            'pressing_pressure' => $version->pressing_pressure,
            'pressing_duration' => $version->pressing_duration,
            'oil_output' => $version->oil_output,
            'oil_yield_rate' => $version->oil_yield_rate,
            'settling_time' => $version->settling_time,
            'sediment_amount' => $version->sediment_amount,
            'notes' => $version->notes,
            'operator' => $version->operator,
            'production_date' => $version->production_date,
            'status' => $version->status,
        ]);

        $anomalies = $this->batchService->checkAnomalies($batch);
        $this->batchService->saveAnomalies($batch, $anomalies);

        $this->batchService->createVersion(
            $batch,
            "回滚至版本 v{$version->version_number}",
            $version->operator
        );

        return redirect()->route('batches.show', $batch)
            ->with('success', "已成功回滚至版本 v{$version->version_number}，当前版本 v{$batch->version}。");
    }

    protected function getComparableBatchData(Batch $batch): array
    {
        return [
            'seed_type' => $batch->seed_type,
            'seed_weight' => (float)$batch->seed_weight,
            'moisture_content' => (float)$batch->moisture_content,
            'roasting_temperature' => (float)$batch->roasting_temperature,
            'roasting_duration' => $batch->roasting_duration,
            'pressing_pressure' => (float)$batch->pressing_pressure,
            'pressing_duration' => $batch->pressing_duration,
            'oil_output' => (float)$batch->oil_output,
            'oil_yield_rate' => (float)$batch->oil_yield_rate,
            'settling_time' => $batch->settling_time,
            'sediment_amount' => (float)$batch->sediment_amount,
            'notes' => $batch->notes,
            'operator' => $batch->operator,
            'production_date' => $batch->production_date->toDateString(),
        ];
    }
}

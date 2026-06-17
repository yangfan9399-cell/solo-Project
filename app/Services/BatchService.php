<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\BatchVersion;
use App\Models\Anomaly;
use Illuminate\Support\Str;

class BatchService
{
    protected array $seedThresholds = [
        '花生' => [
            'moisture_min' => 5.0, 'moisture_max' => 10.0,
            'roasting_temp_min' => 120.0, 'roasting_temp_max' => 160.0,
            'roasting_duration_min' => 20, 'roasting_duration_max' => 45,
            'pressing_pressure_min' => 25.0, 'pressing_pressure_max' => 45.0,
            'pressing_duration_min' => 30, 'pressing_duration_max' => 90,
            'oil_yield_min' => 35.0, 'oil_yield_max' => 50.0,
            'settling_min' => 24, 'settling_max' => 72,
        ],
        '菜籽' => [
            'moisture_min' => 4.0, 'moisture_max' => 9.0,
            'roasting_temp_min' => 130.0, 'roasting_temp_max' => 170.0,
            'roasting_duration_min' => 25, 'roasting_duration_max' => 50,
            'pressing_pressure_min' => 30.0, 'pressing_pressure_max' => 50.0,
            'pressing_duration_min' => 40, 'pressing_duration_max' => 100,
            'oil_yield_min' => 30.0, 'oil_yield_max' => 45.0,
            'settling_min' => 36, 'settling_max' => 96,
        ],
        '芝麻' => [
            'moisture_min' => 3.0, 'moisture_max' => 7.0,
            'roasting_temp_min' => 140.0, 'roasting_temp_max' => 180.0,
            'roasting_duration_min' => 15, 'roasting_duration_max' => 35,
            'pressing_pressure_min' => 35.0, 'pressing_pressure_max' => 55.0,
            'pressing_duration_min' => 35, 'pressing_duration_max' => 80,
            'oil_yield_min' => 40.0, 'oil_yield_max' => 55.0,
            'settling_min' => 48, 'settling_max' => 120,
        ],
        '大豆' => [
            'moisture_min' => 6.0, 'moisture_max' => 12.0,
            'roasting_temp_min' => 110.0, 'roasting_temp_max' => 150.0,
            'roasting_duration_min' => 30, 'roasting_duration_max' => 60,
            'pressing_pressure_min' => 20.0, 'pressing_pressure_max' => 40.0,
            'pressing_duration_min' => 45, 'pressing_duration_max' => 120,
            'oil_yield_min' => 12.0, 'oil_yield_max' => 22.0,
            'settling_min' => 24, 'settling_max' => 72,
        ],
        '茶籽' => [
            'moisture_min' => 4.0, 'moisture_max' => 8.0,
            'roasting_temp_min' => 125.0, 'roasting_temp_max' => 165.0,
            'roasting_duration_min' => 25, 'roasting_duration_max' => 55,
            'pressing_pressure_min' => 30.0, 'pressing_pressure_max' => 50.0,
            'pressing_duration_min' => 50, 'pressing_duration_max' => 110,
            'oil_yield_min' => 20.0, 'oil_yield_max' => 35.0,
            'settling_min' => 48, 'settling_max' => 144,
        ],
        '核桃' => [
            'moisture_min' => 3.0, 'moisture_max' => 8.0,
            'roasting_temp_min' => 100.0, 'roasting_temp_max' => 140.0,
            'roasting_duration_min' => 20, 'roasting_duration_max' => 40,
            'pressing_pressure_min' => 25.0, 'pressing_pressure_max' => 45.0,
            'pressing_duration_min' => 40, 'pressing_duration_max' => 100,
            'oil_yield_min' => 45.0, 'oil_yield_max' => 65.0,
            'settling_min' => 72, 'settling_max' => 168,
        ],
    ];

    public function generateBatchCode(string $seedType, string $date): string
    {
        $prefix = match ($seedType) {
            '花生' => 'HS',
            '菜籽' => 'CZ',
            '芝麻' => 'ZM',
            '大豆' => 'DD',
            '茶籽' => 'CZ2',
            '核桃' => 'HT',
            default => 'QT',
        };
        $datePart = date('Ymd', strtotime($date));
        $count = Batch::whereDate('production_date', $date)->count() + 1;
        return sprintf('%s-%s-%04d', $prefix, $datePart, $count);
    }

    public function generateTraceCode(string $batchCode): string
    {
        $timestamp = now()->format('YmdHis');
        $random = strtoupper(Str::random(8));
        return sprintf('ZYF-%s-%s-%s', $batchCode, $timestamp, $random);
    }

    public function calculateOilYieldRate(float $oilOutput, float $seedWeight): float
    {
        if ($seedWeight <= 0) return 0;
        $oilDensity = 0.92;
        $oilWeightKg = $oilOutput * $oilDensity;
        return round(($oilWeightKg / $seedWeight) * 100, 2);
    }

    public function checkAnomalies(Batch $batch): array
    {
        $anomalies = [];
        $thresholds = $this->seedThresholds[$batch->seed_type] ?? $this->seedThresholds['花生'];

        $checks = [
            ['field' => 'moisture_content', 'name' => '原料水分含量', 'value' => (float)$batch->moisture_content,
             'min' => $thresholds['moisture_min'], 'max' => $thresholds['moisture_max'],
             'unit' => '%', 'code' => 'MOISTURE'],
            ['field' => 'roasting_temperature', 'name' => '炒籽温度', 'value' => (float)$batch->roasting_temperature,
             'min' => $thresholds['roasting_temp_min'], 'max' => $thresholds['roasting_temp_max'],
             'unit' => '℃', 'code' => 'ROAST_TEMP'],
            ['field' => 'roasting_duration', 'name' => '炒籽时长', 'value' => (int)$batch->roasting_duration,
             'min' => $thresholds['roasting_duration_min'], 'max' => $thresholds['roasting_duration_max'],
             'unit' => '分钟', 'code' => 'ROAST_TIME'],
            ['field' => 'pressing_pressure', 'name' => '压榨压力', 'value' => (float)$batch->pressing_pressure,
             'min' => $thresholds['pressing_pressure_min'], 'max' => $thresholds['pressing_pressure_max'],
             'unit' => 'MPa', 'code' => 'PRESS_PRESSURE'],
            ['field' => 'pressing_duration', 'name' => '压榨时长', 'value' => (int)$batch->pressing_duration,
             'min' => $thresholds['pressing_duration_min'], 'max' => $thresholds['pressing_duration_max'],
             'unit' => '分钟', 'code' => 'PRESS_TIME'],
            ['field' => 'oil_yield_rate', 'name' => '出油率', 'value' => (float)$batch->oil_yield_rate,
             'min' => $thresholds['oil_yield_min'], 'max' => $thresholds['oil_yield_max'],
             'unit' => '%', 'code' => 'OIL_YIELD'],
            ['field' => 'settling_time', 'name' => '沉淀时间', 'value' => (int)$batch->settling_time,
             'min' => $thresholds['settling_min'], 'max' => $thresholds['settling_max'],
             'unit' => '小时', 'code' => 'SETTLE_TIME'],
        ];

        foreach ($checks as $check) {
            $type = null;
            $description = '';
            $suggestion = '';

            if ($check['value'] < $check['min']) {
                $diff = $check['min'] - $check['value'];
                $range = $check['max'] - $check['min'];
                $type = ($diff / $range) > 0.3 ? 'high' : (($diff / $range) > 0.1 ? 'medium' : 'low');
                $description = sprintf('%s(%.2f%s)低于标准范围最小值(%.2f%s)',
                    $check['name'], $check['value'], $check['unit'], $check['min'], $check['unit']);
                $suggestion = $this->getAnomalySuggestion($check['code'], 'low', $batch->seed_type);
            } elseif ($check['value'] > $check['max']) {
                $diff = $check['value'] - $check['max'];
                $range = $check['max'] - $check['min'];
                $type = ($diff / $range) > 0.3 ? 'high' : (($diff / $range) > 0.1 ? 'medium' : 'low');
                $description = sprintf('%s(%.2f%s)超过标准范围最大值(%.2f%s)',
                    $check['name'], $check['value'], $check['unit'], $check['max'], $check['unit']);
                $suggestion = $this->getAnomalySuggestion($check['code'], 'high', $batch->seed_type);
            }

            if ($type) {
                $anomalies[] = [
                    'field_name' => $check['field'],
                    'anomaly_type' => $type,
                    'anomaly_code' => $check['code'] . '_' . strtoupper($type),
                    'description' => $description,
                    'actual_value' => $check['value'],
                    'min_threshold' => $check['min'],
                    'max_threshold' => $check['max'],
                    'suggestion' => $suggestion,
                ];
            }
        }

        return $anomalies;
    }

    protected function getAnomalySuggestion(string $code, string $level, string $seedType): string
    {
        $suggestions = [
            'MOISTURE_LOW' => '原料水分过低，建议适当喷淋加湿，避免压榨时出油率下降和油渣分离困难。',
            'MOISTURE_HIGH' => '原料水分过高，建议延长晾晒或烘干时间，水分过高会影响油品储存稳定性。',
            'ROAST_TEMP_LOW' => '炒籽温度偏低，建议提高锅温，确保油料细胞充分破裂，有利于提高出油率。',
            'ROAST_TEMP_HIGH' => '炒籽温度过高，存在焦糊风险，建议降低温度并加快翻炒速度，避免油品出现焦苦味。',
            'ROAST_TIME_LOW' => '炒籽时间不足，建议延长炒制时间，确保油料受热均匀。',
            'ROAST_TIME_HIGH' => '炒籽时间过长，油料可能过度失水，建议缩短炒制时间并检查温度控制。',
            'PRESS_PRESSURE_LOW' => '压榨压力偏低，建议逐步增加压力，确保油脂充分榨出。',
            'PRESS_PRESSURE_HIGH' => '压榨压力过高，可能导致油渣混入油中，建议降低压力并检查饼粕成型情况。',
            'PRESS_TIME_LOW' => '压榨时间不足，建议延长压榨时间，让油脂充分流出。',
            'PRESS_TIME_HIGH' => '压榨时间过长，生产效率低下，建议检查设备或适当增加压力。',
            'OIL_YIELD_LOW' => '出油率偏低，请检查原料质量、炒制工艺和压榨参数是否达标。',
            'OIL_YIELD_HIGH' => '出油率异常偏高，请核实原料重量和出油量计量是否准确。',
            'SETTLE_TIME_LOW' => '沉淀时间不足，油中杂质可能未充分沉降，建议延长沉淀时间后再分装。',
            'SETTLE_TIME_HIGH' => '沉淀时间过长，可能影响生产周转效率，可考虑使用过滤设备缩短沉淀周期。',
        ];
        return $suggestions[$code . '_' . strtoupper($level)] ?? '建议复核该批次参数，必要时联系技术人员处理。';
    }

    public function saveAnomalies(Batch $batch, array $anomalies): void
    {
        $batch->anomalies()->delete();
        foreach ($anomalies as $anomaly) {
            $batch->anomalies()->create($anomaly);
        }
    }

    public function createVersion(Batch $batch, string $changeSummary = '', string $changedBy = null): BatchVersion
    {
        $changedFields = [];
        if ($batch->version > 1) {
            $previous = $batch->versions()->where('version_number', $batch->version - 1)->first();
            if ($previous) {
                $currentData = $this->getComparableFields($batch);
                $previousData = $previous->toArrayForComparison();
                foreach ($currentData as $key => $value) {
                    if (($previousData[$key] ?? null) != $value) {
                        $changedFields[$key] = [
                            'old' => $previousData[$key] ?? null,
                            'new' => $value,
                        ];
                    }
                }
            }
        }

        return BatchVersion::create([
            'batch_id' => $batch->id,
            'version_number' => $batch->version,
            'batch_code' => $batch->batch_code,
            'trace_code' => $batch->trace_code,
            'seed_type' => $batch->seed_type,
            'seed_weight' => $batch->seed_weight,
            'moisture_content' => $batch->moisture_content,
            'roasting_temperature' => $batch->roasting_temperature,
            'roasting_duration' => $batch->roasting_duration,
            'pressing_pressure' => $batch->pressing_pressure,
            'pressing_duration' => $batch->pressing_duration,
            'oil_output' => $batch->oil_output,
            'oil_yield_rate' => $batch->oil_yield_rate,
            'settling_time' => $batch->settling_time,
            'sediment_amount' => $batch->sediment_amount,
            'notes' => $batch->notes,
            'operator' => $batch->operator,
            'production_date' => $batch->production_date,
            'status' => $batch->status ?? 'active',
            'change_summary' => $changeSummary,
            'changed_by' => $changedBy,
            'changed_fields' => !empty($changedFields) ? json_encode($changedFields) : null,
        ]);
    }

    protected function getComparableFields(Batch $batch): array
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

    public function getSeedTypes(): array
    {
        return [
            '花生' => '花生',
            '菜籽' => '菜籽',
            '芝麻' => '芝麻',
            '大豆' => '大豆',
            '茶籽' => '茶籽',
            '核桃' => '核桃',
        ];
    }

    public function getThresholds(string $seedType): array
    {
        return $this->seedThresholds[$seedType] ?? $this->seedThresholds['花生'];
    }

    public function getDashboardStatistics(): array
    {
        $totalBatches = Batch::count();
        $thisMonthBatches = Batch::whereMonth('production_date', now()->month)
            ->whereYear('production_date', now()->year)
            ->count();
        $totalOilOutput = Batch::sum('oil_output');
        $avgOilYield = Batch::avg('oil_yield_rate') ?? 0;
        $anomalyCount = Anomaly::where('resolved', false)->count();
        $anomalousBatches = Batch::whereHas('anomalies', function ($q) {
            $q->where('resolved', false)->where('anomaly_type', 'high');
        })->count();

        $recentBatches = Batch::with('unresolvedAnomalies')
            ->orderBy('production_date', 'desc')
            ->limit(5)
            ->get();

        $seedTypeStats = Batch::selectRaw('seed_type, COUNT(*) as count, AVG(oil_yield_rate) as avg_yield, SUM(oil_output) as total_oil')
            ->groupBy('seed_type')
            ->get()
            ->mapWithKeys(fn ($item) => [$item->seed_type => [
                'count' => $item->count,
                'avg_yield' => round($item->avg_yield, 2),
                'total_oil' => round($item->total_oil, 2),
            ]]);

        return [
            'total_batches' => $totalBatches,
            'this_month_batches' => $thisMonthBatches,
            'total_oil_output' => round($totalOilOutput, 2),
            'avg_oil_yield' => round($avgOilYield, 2),
            'anomaly_count' => $anomalyCount,
            'anomalous_batches' => $anomalousBatches,
            'recent_batches' => $recentBatches,
            'seed_type_stats' => $seedTypeStats,
        ];
    }
}

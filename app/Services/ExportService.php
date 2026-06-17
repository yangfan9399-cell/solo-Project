<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\BatchVersion;
use Illuminate\Support\Collection;

class ExportService
{
    protected BatchService $batchService;

    public function __construct(BatchService $batchService)
    {
        $this->batchService = $batchService;
    }

    public function generateSummaryData(): array
    {
        $stats = $this->batchService->getDashboardStatistics();
        $batches = Batch::with('anomalies')
            ->orderBy('production_date', 'desc')
            ->get();

        $summary = [
            'title' => '传统榨油坊批次压榨记录汇总报告',
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'statistics' => [
                '总批次数' => $stats['total_batches'],
                '本月批次数' => $stats['this_month_batches'],
                '总出油量(L)' => $stats['total_oil_output'],
                '平均出油率(%)' => $stats['avg_oil_yield'],
                '未处理异常数' => $stats['anomaly_count'],
                '严重异常批次数' => $stats['anomalous_batches'],
            ],
            'seed_type_breakdown' => $stats['seed_type_stats'],
            'batches' => $batches->map(function ($batch) {
                return [
                    '批次编号' => $batch->batch_code,
                    '溯源码' => $batch->trace_code,
                    '油料种类' => $batch->seed_type,
                    '生产日期' => $batch->production_date->format('Y-m-d'),
                    '原料重量(kg)' => (float)$batch->seed_weight,
                    '水分含量(%)' => (float)$batch->moisture_content,
                    '炒籽温度(℃)' => (float)$batch->roasting_temperature,
                    '炒籽时长(分钟)' => $batch->roasting_duration,
                    '压榨压力(MPa)' => (float)$batch->pressing_pressure,
                    '压榨时长(分钟)' => $batch->pressing_duration,
                    '出油量(L)' => (float)$batch->oil_output,
                    '出油率(%)' => (float)$batch->oil_yield_rate,
                    '沉淀时间(小时)' => $batch->settling_time,
                    '沉淀物量(kg)' => (float)$batch->sediment_amount,
                    '操作员' => $batch->operator,
                    '异常数' => $batch->anomalies->count(),
                    '版本号' => $batch->version,
                ];
            })->toArray(),
        ];

        return $summary;
    }

    public function generateBatchDetailData(Batch $batch): array
    {
        $anomalies = $batch->anomalies()->get();
        $versions = $batch->versions()->orderBy('version_number', 'desc')->get();
        $thresholds = $this->batchService->getThresholds($batch->seed_type);

        return [
            'title' => "批次详情报告 - {$batch->batch_code}",
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'batch' => [
                '批次编号' => $batch->batch_code,
                '溯源码' => $batch->trace_code,
                '油料种类' => $batch->seed_type,
                '生产日期' => $batch->production_date->format('Y-m-d'),
                '操作员' => $batch->operator ?? '未记录',
                '版本号' => $batch->version,
                '状态' => $batch->status === 'active' ? '活跃' : '已归档',
            ],
            'parameters' => [
                ['参数' => '原料重量', '数值' => (float)$batch->seed_weight . ' kg', '标准范围' => '-'],
                ['参数' => '原料水分含量', '数值' => (float)$batch->moisture_content . ' %', '标准范围' => $thresholds['moisture_min'] . ' - ' . $thresholds['moisture_max'] . ' %'],
                ['参数' => '炒籽温度', '数值' => (float)$batch->roasting_temperature . ' ℃', '标准范围' => $thresholds['roasting_temp_min'] . ' - ' . $thresholds['roasting_temp_max'] . ' ℃'],
                ['参数' => '炒籽时长', '数值' => $batch->roasting_duration . ' 分钟', '标准范围' => $thresholds['roasting_duration_min'] . ' - ' . $thresholds['roasting_duration_max'] . ' 分钟'],
                ['参数' => '压榨压力', '数值' => (float)$batch->pressing_pressure . ' MPa', '标准范围' => $thresholds['pressing_pressure_min'] . ' - ' . $thresholds['pressing_pressure_max'] . ' MPa'],
                ['参数' => '压榨时长', '数值' => $batch->pressing_duration . ' 分钟', '标准范围' => $thresholds['pressing_duration_min'] . ' - ' . $thresholds['pressing_duration_max'] . ' 分钟'],
                ['参数' => '出油量', '数值' => (float)$batch->oil_output . ' L', '标准范围' => '-'],
                ['参数' => '出油率', '数值' => (float)$batch->oil_yield_rate . ' %', '标准范围' => $thresholds['oil_yield_min'] . ' - ' . $thresholds['oil_yield_max'] . ' %'],
                ['参数' => '沉淀时间', '数值' => $batch->settling_time . ' 小时', '标准范围' => $thresholds['settling_min'] . ' - ' . $thresholds['settling_max'] . ' 小时'],
                ['参数' => '沉淀物量', '数值' => (float)$batch->sediment_amount . ' kg', '标准范围' => '-'],
            ],
            'anomalies' => $anomalies->map(function ($a) {
                return [
                    '异常字段' => $a->field_name,
                    '异常等级' => $a->type_label,
                    '异常描述' => $a->description,
                    '实际值' => (float)$a->actual_value,
                    '建议方案' => $a->suggestion,
                    '处理状态' => $a->resolved ? '已处理' : '待处理',
                ];
            })->toArray(),
            'versions' => $versions->map(function ($v) {
                return [
                    '版本号' => $v->version_number,
                    '修改时间' => $v->created_at->format('Y-m-d H:i:s'),
                    '修改人' => $v->changed_by ?? '系统',
                    '变更摘要' => $v->change_summary ?? '初始版本',
                ];
            })->toArray(),
            'notes' => $batch->notes ?? '无备注',
        ];
    }

    public function buildCsvContent(array $data, string $type): string
    {
        $handle = fopen('php://temp', 'r+');
        try {
            $this->writeDataToCsv($handle, $data, $type);
            rewind($handle);
            return stream_get_contents($handle);
        } finally {
            fclose($handle);
        }
    }

    protected function writeDataToCsv($handle, array $data, string $type): void
    {
        fwrite($handle, "\xEF\xBB\xBF");

        if ($type === 'summary') {
            fputcsv($handle, ['传统榨油坊批次压榨记录汇总报告']);
            fputcsv($handle, ['生成时间', $data['generated_at']]);
            fputcsv($handle, []);

            fputcsv($handle, ['统计概览']);
            foreach ($data['statistics'] as $label => $value) {
                fputcsv($handle, [$label, $value]);
            }
            fputcsv($handle, []);

            fputcsv($handle, ['油料种类分布']);
            fputcsv($handle, ['油料种类', '批次数', '平均出油率(%)', '总出油量(L)']);
            foreach ($data['seed_type_breakdown'] as $seedType => $values) {
                fputcsv($handle, [$seedType, $values['count'], $values['avg_yield'], $values['total_oil']]);
            }
            fputcsv($handle, []);

            if (!empty($data['batches'])) {
                fputcsv($handle, array_keys($data['batches'][0]));
                foreach ($data['batches'] as $row) {
                    fputcsv($handle, $row);
                }
            }
        } elseif ($type === 'batch') {
            fputcsv($handle, [$data['title']]);
            fputcsv($handle, ['生成时间', $data['generated_at']]);
            fputcsv($handle, []);

            fputcsv($handle, ['批次基本信息']);
            foreach ($data['batch'] as $label => $value) {
                fputcsv($handle, [$label, $value]);
            }
            fputcsv($handle, []);

            fputcsv($handle, ['工艺参数详情']);
            fputcsv($handle, ['参数', '数值', '标准范围']);
            foreach ($data['parameters'] as $row) {
                fputcsv($handle, [$row['参数'], $row['数值'], $row['标准范围']]);
            }
            fputcsv($handle, []);

            if (!empty($data['anomalies'])) {
                fputcsv($handle, ['异常数据记录']);
                fputcsv($handle, array_keys($data['anomalies'][0]));
                foreach ($data['anomalies'] as $row) {
                    fputcsv($handle, $row);
                }
                fputcsv($handle, []);
            }

            fputcsv($handle, ['版本历史']);
            fputcsv($handle, array_keys($data['versions'][0]));
            foreach ($data['versions'] as $row) {
                fputcsv($handle, $row);
            }
            fputcsv($handle, []);

            fputcsv($handle, ['备注']);
            fputcsv($handle, [$data['notes']]);
        }
    }
}

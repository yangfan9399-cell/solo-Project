<?php

namespace App\Services;

use App\Models\DrumMasterRecord;
use App\Models\TuningComparison;

class ExportService
{
    public function exportRecordToCsv(DrumMasterRecord $master): string
    {
        $lines = [];
        
        $lines[] = '传统鼓皮张力调校工具 - 调校记录导出';
        $lines[] = '导出时间,' . now()->format('Y-m-d H:i:s');
        $lines[] = '';
        
        $lines[] = '=== 主记录信息 ===';
        $lines[] = '批次号,' . $master->batch_number;
        $lines[] = '版本,' . $master->version;
        $lines[] = '鼓径(英寸),' . $master->drum_diameter;
        $lines[] = '乐师,' . $master->musician_name;
        $lines[] = '记录日期,' . $master->record_date->format('Y-m-d');
        $lines[] = '状态,' . $this->getStatusLabel($master->status);
        $lines[] = '备注,' . ($master->notes ?? '无');
        $lines[] = '';
        
        $lines[] = '=== 鼓皮明细 ===';
        $lines[] = '序号,鼓面,材质,品牌,厚度(mm)';
        foreach ($master->detailRecords as $idx => $detail) {
            $lines[] = implode(',', [
                $idx + 1,
                $this->getDrumSideLabel($detail->drum_side),
                $detail->drumhead_material,
                $detail->drumhead_brand ?? '-',
                $detail->drumhead_thickness ?? '-',
            ]);
        }
        $lines[] = '';
        
        $lines[] = '=== 张力历史 ===';
        $lines[] = '序号,测量点,张力(N),扳手转数,操作者,测量时间,是否回滚,调校原因';
        $tensionHistory = $master->tensionHistoryRecords()->orderBy('measured_at')->get();
        foreach ($tensionHistory as $idx => $th) {
            $lines[] = implode(',', [
                $idx + 1,
                $th->measurement_point,
                $th->rope_tension,
                $th->tuning_key_turns,
                $th->operator ?? '-',
                $th->measured_at?->format('Y-m-d H:i') ?? '-',
                $th->is_rollback ? '是' : '否',
                $th->adjustment_reason ?? '-',
            ]);
        }
        $lines[] = '';
        
        $lines[] = '=== 调校结果 ===';
        $lines[] = '序号,敲击频率(Hz),目标频率(Hz),演出环境,温度(°C),湿度(%),气压(hPa),演出备注,频谱异常';
        $results = $master->tuningResultRecords()->orderBy('created_at')->get();
        foreach ($results as $idx => $result) {
            $lines[] = implode(',', [
                $idx + 1,
                $result->strike_frequency,
                $result->target_frequency ?? '-',
                $result->performance_environment,
                $result->ambient_temp ?? '-',
                $result->ambient_humidity ?? '-',
                $result->ambient_pressure ?? '-',
                '"' . str_replace('"', '""', $result->performance_notes ?? '') . '"',
                $result->spectrum_anomaly ? '是' : '否',
            ]);
        }
        $lines[] = '';
        
        $tensionTables = $master->tensionTables()->where('is_rollback', false)->get();
        $tableNames = $tensionTables->pluck('table_name')->unique();
        foreach ($tableNames as $tableName) {
            $tableVersion = $tensionTables->where('table_name', $tableName)->pluck('table_version')->first();
            $tableData = $tensionTables->where('table_name', $tableName)->where('table_version', $tableVersion)->sortBy('measurement_point');
            
            $lines[] = "=== 张力表: {$tableName} (版本: {$tableVersion}) ===";
            $lines[] = '测量点,张力(N),频率(Hz),偏差(Hz)';
            foreach ($tableData as $row) {
                $lines[] = implode(',', [
                    $row->measurement_point,
                    $row->tension_value,
                    $row->frequency,
                    $row->deviation,
                ]);
            }
            $lines[] = '';
        }
        
        return implode("\n", $lines);
    }

    public function exportComparisonToCsv(TuningComparison $comparison): string
    {
        $lines = [];
        
        $lines[] = '传统鼓皮张力调校工具 - 调校方案比较导出';
        $lines[] = '导出时间,' . now()->format('Y-m-d H:i:s');
        $lines[] = '比较名称,' . $comparison->comparison_name;
        $lines[] = '比较说明,' . ($comparison->description ?? '无');
        $lines[] = '状态,' . $this->getStatusLabel($comparison->status);
        $lines[] = '';
        
        if ($comparison->status === 'completed') {
            $lines[] = '=== 比较结论 ===';
            $lines[] = '推荐方案,' . ($comparison->recommended_scheme ?? '无');
            $lines[] = '结论,' . ($comparison->conclusion ?? '无');
            $lines[] = '';
            
            $result = $comparison->comparison_result;
            $records = $result['records'] ?? [];
            
            $lines[] = '=== 方案对比 ===';
            $headers = ['批次号', '版本', '鼓径(英寸)', '鼓皮材质', '敲击频率(Hz)', '目标频率(Hz)', '演出环境', '频谱异常'];
            $lines[] = implode(',', $headers);
            
            foreach ($records as $rec) {
                $lines[] = implode(',', [
                    $rec['batch_number'],
                    $rec['version'],
                    $rec['drum_diameter'],
                    $rec['drumhead_material'] ?? '-',
                    $rec['strike_frequency'] ?? '-',
                    $rec['target_frequency'] ?? '-',
                    $rec['performance_environment'] ?? '-',
                    ($rec['spectrum_anomaly'] ?? false) ? '是' : '否',
                ]);
            }
            $lines[] = '';
            
            if (isset($result['analysis'])) {
                $analysis = $result['analysis'];
                $lines[] = '=== 分析数据 ===';
                
                if (isset($analysis['frequency']['average'])) {
                    $lines[] = '平均频率(Hz),' . $analysis['frequency']['average'];
                    $lines[] = '频率范围(Hz),' . $analysis['frequency']['range'];
                    $lines[] = '频率稳定性,' . $analysis['frequency']['stability'];
                }
                
                if (isset($analysis['tension']['average'])) {
                    $lines[] = '平均张力(N),' . $analysis['tension']['average'];
                    $lines[] = '张力范围(N),' . $analysis['tension']['range'];
                }
                
                $lines[] = '涉及材质数,' . ($analysis['material']['count'] ?? 0);
                $lines[] = '涉及环境数,' . ($analysis['environment']['count'] ?? 0);
            }
        }
        
        return implode("\n", $lines);
    }

    public function generateExportFileName(string $prefix, string $type = 'csv'): string
    {
        return $prefix . '_' . date('Ymd_His') . '.' . $type;
    }

    protected function getStatusLabel(string $status): string
    {
        $labels = [
            'draft' => '草稿',
            'completed' => '已完成',
            'rolled_back' => '已回滚',
            'pending' => '待处理',
            'failed' => '失败',
        ];
        return $labels[$status] ?? $status;
    }

    protected function getDrumSideLabel(string $side): string
    {
        $labels = [
            'batter' => '击打面',
            'resonant' => '共振面',
        ];
        return $labels[$side] ?? $side;
    }
}

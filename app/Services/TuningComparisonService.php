<?php

namespace App\Services;

use App\Models\TuningComparison;
use App\Models\DrumMasterRecord;

class TuningComparisonService
{
    public function createComparison(array $masterRecordIds, string $name, string $description = ''): TuningComparison
    {
        return TuningComparison::create([
            'comparison_name' => $name,
            'description' => $description,
            'master_record_ids' => $masterRecordIds,
            'status' => 'pending',
        ]);
    }

    public function executeComparison(TuningComparison $comparison): array
    {
        $masterRecords = $comparison->masterRecords;
        
        if ($masterRecords->isEmpty()) {
            $comparison->update([
                'status' => 'failed',
                'conclusion' => '无有效记录可比较',
            ]);
            return ['success' => false, 'message' => '无有效记录可比较'];
        }
        
        $results = [];
        $allFreqs = [];
        $allTensions = [];
        
        foreach ($masterRecords as $master) {
            $latestResult = $master->latestResult;
            $tensionTable = $master->currentTensionTable;
            $detail = $master->detailRecords->first();
            
            $recordData = [
                'id' => $master->id,
                'batch_number' => $master->batch_number,
                'version' => $master->version,
                'drum_diameter' => $master->drum_diameter,
                'musician_name' => $master->musician_name,
                'drumhead_material' => $detail?->drumhead_material,
                'status' => $master->status,
                'strike_frequency' => $latestResult?->strike_frequency,
                'target_frequency' => $latestResult?->target_frequency,
                'performance_environment' => $latestResult?->performance_environment,
                'performance_notes' => $latestResult?->performance_notes,
                'spectrum_anomaly' => $latestResult?->spectrum_anomaly,
                'has_tension_table' => $tensionTable !== null,
                'tension_table_version' => $tensionTable?->table_version,
            ];
            
            if ($latestResult?->strike_frequency) {
                $allFreqs[] = $latestResult->strike_frequency;
            }
            
            $latestTension = $master->tensionHistoryRecords()
                ->where('is_rollback', false)
                ->orderBy('measured_at', 'desc')
                ->first();
            
            if ($latestTension) {
                $recordData['latest_tension'] = $latestTension->rope_tension;
                $allTensions[] = $latestTension->rope_tension;
            }
            
            $results[] = $recordData;
        }
        
        $analysis = $this->analyzeDifferences($results, $allFreqs, $allTensions);
        
        $recommended = $this->recommendScheme($results);
        
        $comparison->update([
            'status' => 'completed',
            'comparison_result' => [
                'records' => $results,
                'analysis' => $analysis,
            ],
            'conclusion' => $analysis['summary'],
            'recommended_scheme' => $recommended,
            'completed_at' => now(),
        ]);
        
        return [
            'success' => true,
            'records' => $results,
            'analysis' => $analysis,
            'recommended' => $recommended,
        ];
    }

    protected function analyzeDifferences(array $records, array $freqs, array $tensions): array
    {
        $analysis = [
            'frequency' => [],
            'tension' => [],
            'material' => [],
            'environment' => [],
            'summary' => '',
        ];
        
        if (count($freqs) >= 2) {
            $minFreq = min($freqs);
            $maxFreq = max($freqs);
            $avgFreq = array_sum($freqs) / count($freqs);
            $freqRange = $maxFreq - $minFreq;
            $freqVariance = $this->calculateVariance($freqs);
            
            $analysis['frequency'] = [
                'min' => round($minFreq, 2),
                'max' => round($maxFreq, 2),
                'average' => round($avgFreq, 2),
                'range' => round($freqRange, 2),
                'variance' => round($freqVariance, 4),
                'stability' => $freqVariance < 1 ? '稳定' : ($freqVariance < 5 ? '一般' : '不稳定'),
            ];
        }
        
        if (count($tensions) >= 2) {
            $minTension = min($tensions);
            $maxTension = max($tensions);
            $avgTension = array_sum($tensions) / count($tensions);
            $tensionRange = $maxTension - $minTension;
            
            $analysis['tension'] = [
                'min' => round($minTension, 2),
                'max' => round($maxTension, 2),
                'average' => round($avgTension, 2),
                'range' => round($tensionRange, 2),
            ];
        }
        
        $materials = array_unique(array_column($records, 'drumhead_material'));
        $analysis['material'] = [
            'types' => array_values($materials),
            'count' => count($materials),
        ];
        
        $environments = array_unique(array_column($records, 'performance_environment'));
        $analysis['environment'] = [
            'types' => array_values($environments),
            'count' => count($environments),
        ];
        
        $anomalyCount = count(array_filter($records, fn($r) => $r['spectrum_anomaly'] ?? false));
        
        $summaryParts = [];
        $summaryParts[] = "共比较 " . count($records) . " 个调校方案";
        
        if (isset($analysis['frequency']['stability'])) {
            $summaryParts[] = "频率{$analysis['frequency']['stability']}";
        }
        
        if ($anomalyCount > 0) {
            $summaryParts[] = "其中 {$anomalyCount} 个存在频谱异常";
        }
        
        if (count($materials) > 1) {
            $summaryParts[] = "涉及 " . count($materials) . " 种鼓皮材质";
        }
        
        $analysis['summary'] = implode('，', $summaryParts) . '。';
        
        return $analysis;
    }

    protected function recommendScheme(array $records): string
    {
        $validRecords = array_filter($records, fn($r) => !($r['spectrum_anomaly'] ?? false));
        
        if (empty($validRecords)) {
            $validRecords = $records;
        }
        
        usort($validRecords, function ($a, $b) {
            $freqDiffA = abs(($a['strike_frequency'] ?? 0) - ($a['target_frequency'] ?? 0));
            $freqDiffB = abs(($b['strike_frequency'] ?? 0) - ($b['target_frequency'] ?? 0));
            return $freqDiffA <=> $freqDiffB;
        });
        
        $best = reset($validRecords);
        return $best['batch_number'] . ' v' . $best['version'];
    }

    protected function calculateVariance(array $values): float
    {
        if (count($values) < 2) {
            return 0;
        }
        
        $mean = array_sum($values) / count($values);
        $sumSquaredDiff = 0;
        
        foreach ($values as $value) {
            $sumSquaredDiff += pow($value - $mean, 2);
        }
        
        return $sumSquaredDiff / (count($values) - 1);
    }

    public function getComparisonWithDetails(TuningComparison $comparison): array
    {
        $result = $comparison->toArray();
        $result['master_records'] = $comparison->masterRecords;
        
        $chartData = $this->generateComparisonChartData($comparison);
        $result['chart_data'] = $chartData;
        
        return $result;
    }

    protected function generateComparisonChartData(TuningComparison $comparison): array
    {
        $records = $comparison->masterRecords;
        $chartData = [
            'labels' => [],
            'datasets' => [
                [
                    'label' => '敲击频率(Hz)',
                    'data' => [],
                    'backgroundColor' => 'rgba(59, 130, 246, 0.5)',
                    'borderColor' => 'rgb(59, 130, 246)',
                ],
                [
                    'label' => '目标频率(Hz)',
                    'data' => [],
                    'backgroundColor' => 'rgba(16, 185, 129, 0.5)',
                    'borderColor' => 'rgb(16, 185, 129)',
                ],
            ],
        ];
        
        foreach ($records as $record) {
            $chartData['labels'][] = $record->batch_number;
            $latestResult = $record->latestResult;
            
            $chartData['datasets'][0]['data'][] = $latestResult?->strike_frequency ?? 0;
            $chartData['datasets'][1]['data'][] = $latestResult?->target_frequency ?? 0;
        }
        
        return $chartData;
    }
}

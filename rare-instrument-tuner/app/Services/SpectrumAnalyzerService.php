<?php

namespace App\Services;

use App\Models\TuningSession;
use App\Models\SpectrumData;
use App\Models\TuningSuggestion;
use App\Models\ToneLibrary;

class SpectrumAnalyzerService
{
    public function analyzeFromFrequency(float $fundamentalFreq, int $harmonicCount = 8, float $anomalyThreshold = 20.0): array
    {
        $harmonics = [];
        for ($i = 1; $i <= $harmonicCount; $i++) {
            $idealFreq = $fundamentalFreq * $i;
            $noiseFactor = 1 + (mt_rand(-50, 50) / 10000);
            $actualFreq = round($idealFreq * $noiseFactor, 2);
            $deviation = $this->frequencyToCents($actualFreq, $idealFreq);
            $amplitude = round(1.0 / pow($i, 0.7), 2);

            $harmonics[] = [
                'harmonic_order' => $i,
                'frequency' => $actualFreq,
                'amplitude' => $amplitude,
                'deviation_cents' => round($deviation, 2),
                'is_anomaly' => abs($deviation) > $anomalyThreshold,
            ];
        }

        return $harmonics;
    }

    public function frequencyToCents(float $actual, float $target): float
    {
        if ($target <= 0 || $actual <= 0) {
            return 0;
        }
        return 1200 * (log($actual / $target) / log(2));
    }

    public function centsToFrequency(float $baseFreq, float $cents): float
    {
        return $baseFreq * pow(2, $cents / 1200);
    }

    public function detectAnomalies(array $harmonics): array
    {
        $anomalies = [];
        foreach ($harmonics as $h) {
            if ($h['is_anomaly']) {
                $anomalies[] = [
                    'harmonic_order' => $h['harmonic_order'],
                    'frequency' => $h['frequency'],
                    'deviation_cents' => $h['deviation_cents'],
                    'severity' => abs($h['deviation_cents']) > 35 ? 'critical' : 'warning',
                    'description' => sprintf(
                        '第%d泛音偏差%.1f音分（频率%.2fHz），%s',
                        $h['harmonic_order'],
                        $h['deviation_cents'],
                        $h['frequency'],
                        abs($h['deviation_cents']) > 35 ? '严重偏离，需立即检查' : '超出容许范围，建议关注'
                    ),
                ];
            }
        }
        return $anomalies;
    }

    public function generateSuggestions(TuningSession $session): array
    {
        $suggestions = [];
        $instrument = $session->instrument;
        $toneLibrary = $instrument->toneLibraries;

        $spectrumData = $session->spectrumData()->orderBy('harmonic_order')->get();

        if ($spectrumData->isEmpty()) {
            return $suggestions;
        }

        $fundamental = $session->fundamental_freq;

        foreach ($toneLibrary as $tone) {
            $deviation = $this->frequencyToCents($fundamental, $tone->target_freq);

            if (abs($deviation) <= $tone->tolerance_cents) {
                continue;
            }

            $action = 'adjust';
            if (abs($deviation) < 2) {
                $action = 'wait';
            } elseif ($instrument->type === '管乐器') {
                $action = 'compensate';
            }

            $suggestions[] = [
                'string_index' => 0,
                'current_freq' => $fundamental,
                'target_freq' => $tone->target_freq,
                'adjustment_cents' => round($deviation, 2),
                'action' => $action,
                'note' => $this->buildSuggestionNote($deviation, $tone, $instrument->type),
            ];
        }

        foreach ($spectrumData->filter(fn($s) => $s->is_anomaly) as $anomaly) {
            $idealFreq = $fundamental * $anomaly->harmonic_order;
            $suggestions[] = [
                'string_index' => $anomaly->harmonic_order,
                'current_freq' => $anomaly->frequency,
                'target_freq' => $idealFreq,
                'adjustment_cents' => round($anomaly->deviation_cents, 2),
                'action' => 'note',
                'note' => sprintf(
                    '第%d泛音偏差%.1f音分，建议排查%s原因',
                    $anomaly->harmonic_order,
                    $anomaly->deviation_cents,
                    $instrument->type === '管乐器' ? '管体结构或气流' : '弦张力或共鸣交互'
                ),
            ];
        }

        return $suggestions;
    }

    private function buildSuggestionNote(float $deviation, ToneLibrary $tone, string $instrumentType): string
    {
        $direction = $deviation > 0 ? '偏高' : '偏低';
        $absDev = abs($deviation);

        if ($instrumentType === '管乐器') {
            return sprintf('%s频率%s%.1f音分，可通过口风角度调整补偿', $tone->note_name, $direction, $absDev);
        }
        if ($instrumentType === '电子乐器') {
            return sprintf('%s频率%s%.1f音分，调整天线灵敏度或手部位置', $tone->note_name, $direction, $absDev);
        }
        return sprintf('%s频率%s%.1f音分，%s弦轴%.0f度', $tone->note_name, $direction, $absDev, $deviation > 0 ? '逆时针旋' : '顺时针旋', min($absDev * 1.5, 30));
    }
}

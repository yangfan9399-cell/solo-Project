<?php

namespace App\Services;

use App\Models\TuningResultRecord;
use App\Models\SpectrumDatum;

class SpectrumAnalysisService
{
    public function generateSpectrum(TuningResultRecord $result, array $options = []): array
    {
        $baseFreq = $result->strike_frequency;
        $sampleCount = $options['sample_count'] ?? 128;
        $harmonicCount = $options['harmonic_count'] ?? 8;
        $noiseLevel = $options['noise_level'] ?? 0.05;
        
        $spectrum = [];
        $freqRange = $baseFreq * 4;
        $freqStep = $freqRange / $sampleCount;
        
        for ($i = 0; $i < $sampleCount; $i++) {
            $freq = $freqStep * $i;
            $amplitude = 0;
            
            for ($h = 1; $h <= $harmonicCount; $h++) {
                $harmonicFreq = $baseFreq * $h;
                $bandwidth = $baseFreq * 0.05 * sqrt($h);
                $distance = abs($freq - $harmonicFreq);
                
                if ($distance < $bandwidth * 3) {
                    $gaussian = exp(-pow($distance / $bandwidth, 2) / 2);
                    $harmonicAmp = 1.0 / ($h * 1.2) * $gaussian;
                    $amplitude += $harmonicAmp;
                }
            }
            
            $noise = (mt_rand() / mt_getrandmax() - 0.5) * $noiseLevel;
            $amplitude += $noise;
            $amplitude = max(0, $amplitude);
            
            $isHarmonic = false;
            $harmonicOrder = null;
            
            for ($h = 1; $h <= $harmonicCount; $h++) {
                $harmonicFreq = $baseFreq * $h;
                if (abs($freq - $harmonicFreq) < $freqStep * 1.5 && $amplitude > 0.1) {
                    $isHarmonic = true;
                    $harmonicOrder = $h;
                    break;
                }
            }
            
            $spectrum[] = [
                'frequency' => round($freq, 2),
                'amplitude' => round($amplitude, 6),
                'phase' => round((mt_rand() / mt_getrandmax()) * pi() * 2 - pi(), 4),
                'is_harmonic' => $isHarmonic,
                'harmonic_order' => $harmonicOrder,
            ];
        }
        
        return $spectrum;
    }

    public function saveSpectrum(TuningResultRecord $result, array $spectrum): void
    {
        $result->spectrumData()->delete();
        
        foreach ($spectrum as $point) {
            $result->spectrumData()->create([
                'frequency' => $point['frequency'],
                'amplitude' => $point['amplitude'],
                'phase' => $point['phase'],
                'is_harmonic' => $point['is_harmonic'],
                'harmonic_order' => $point['harmonic_order'],
            ]);
        }
    }

    public function analyzeSpectrum(TuningResultRecord $result): array
    {
        $spectrum = $result->spectrumData;
        
        if ($spectrum->isEmpty()) {
            return [
                'has_anomaly' => false,
                'anomaly_type' => null,
                'anomaly_description' => '无频谱数据',
                'fundamental_freq' => null,
                'harmonic_count' => 0,
                'spectral_centroid' => null,
            ];
        }
        
        $sorted = $spectrum->sortByDesc('amplitude');
        $fundamental = $sorted->first();
        $baseFreq = $fundamental->frequency;
        
        $harmonics = $spectrum->where('is_harmonic', true);
        
        $totalAmp = $spectrum->sum('amplitude');
        $weightedFreqSum = $spectrum->sum(fn($p) => $p->frequency * $p->amplitude);
        $spectralCentroid = $totalAmp > 0 ? $weightedFreqSum / $totalAmp : 0;
        
        $anomalies = $this->detectAnomalies($spectrum, $baseFreq);
        
        return [
            'has_anomaly' => !empty($anomalies),
            'anomaly_type' => $anomalies[0]['type'] ?? null,
            'anomaly_description' => implode('; ', array_column($anomalies, 'description')),
            'fundamental_freq' => round($baseFreq, 2),
            'harmonic_count' => $harmonics->count(),
            'spectral_centroid' => round($spectralCentroid, 2),
            'anomalies' => $anomalies,
        ];
    }

    protected function detectAnomalies($spectrum, float $baseFreq): array
    {
        $anomalies = [];
        
        $subharmonics = $spectrum->filter(function ($point) use ($baseFreq) {
            return $point->frequency < $baseFreq * 0.9 && $point->amplitude > 0.15;
        });
        
        if ($subharmonics->count() > 2) {
            $anomalies[] = [
                'type' => 'subharmonic',
                'description' => "检测到 {$subharmonics->count()} 个次谐波分量，可能存在鼓皮松弛或异物共振",
                'severity' => 'medium',
            ];
        }
        
        $noiseFloor = $spectrum->filter(function ($point) use ($baseFreq) {
            return $point->frequency > $baseFreq * 0.5 && $point->frequency < $baseFreq * 1.5;
        })->avg('amplitude') * 0.3;
        
        $highFreqNoise = $spectrum->filter(function ($point) use ($baseFreq, $noiseFloor) {
            return $point->frequency > $baseFreq * 3 && $point->amplitude > $noiseFloor * 3;
        });
        
        if ($highFreqNoise->count() > 10) {
            $anomalies[] = [
                'type' => 'high_frequency_noise',
                'description' => '高频噪声过大，可能存在金属部件松动或鼓腔共振异常',
                'severity' => 'low',
            ];
        }
        
        $harmonics = $spectrum->where('is_harmonic', true)->sortBy('harmonic_order');
        $expectedRatios = range(2, 8);
        $actualRatios = [];
        
        foreach ($harmonics as $h) {
            if ($h->harmonic_order > 1) {
                $actualRatios[] = $h->frequency / $baseFreq;
            }
        }
        
        $ratioDeviation = 0;
        foreach ($actualRatios as $i => $actual) {
            if (isset($expectedRatios[$i])) {
                $ratioDeviation += abs($actual - $expectedRatios[$i]) / $expectedRatios[$i];
            }
        }
        
        if (count($actualRatios) > 0 && $ratioDeviation / count($actualRatios) > 0.08) {
            $anomalies[] = [
                'type' => 'inharmonicity',
                'description' => '谐波非谐性过大，鼓皮张力不均或鼓腔异常',
                'severity' => 'high',
            ];
        }
        
        return $anomalies;
    }

    public function generateAnomalySpectrum(float $baseFreq, string $anomalyType): array
    {
        $spectrum = [];
        $sampleCount = 128;
        $freqRange = $baseFreq * 4;
        $freqStep = $freqRange / $sampleCount;
        
        switch ($anomalyType) {
            case 'subharmonic':
                $subFreq = $baseFreq * 0.5;
                $subAmp = 0.4;
                break;
            case 'high_frequency_noise':
                $noiseAmp = 0.2;
                break;
            case 'inharmonicity':
                $inharmonicity = 0.15;
                break;
            default:
                $subFreq = $baseFreq * 0.33;
                $subAmp = 0.35;
        }
        
        for ($i = 0; $i < $sampleCount; $i++) {
            $freq = $freqStep * $i;
            $amplitude = 0;
            
            for ($h = 1; $h <= 8; $h++) {
                $harmonicFreq = $baseFreq * $h;
                
                if ($anomalyType === 'inharmonicity') {
                    $harmonicFreq = $baseFreq * $h * (1 + $inharmonicity * $h * $h / 100);
                }
                
                $bandwidth = $baseFreq * 0.05 * sqrt($h);
                $distance = abs($freq - $harmonicFreq);
                
                if ($distance < $bandwidth * 3) {
                    $gaussian = exp(-pow($distance / $bandwidth, 2) / 2);
                    $harmonicAmp = 1.0 / ($h * 1.2) * $gaussian;
                    $amplitude += $harmonicAmp;
                }
            }
            
            if ($anomalyType === 'subharmonic' && isset($subFreq)) {
                $distance = abs($freq - $subFreq);
                $bandwidth = $baseFreq * 0.03;
                if ($distance < $bandwidth * 3) {
                    $gaussian = exp(-pow($distance / $bandwidth, 2) / 2);
                    $amplitude += $subAmp * $gaussian;
                }
            }
            
            if ($anomalyType === 'high_frequency_noise' && $freq > $baseFreq * 2.5) {
                $noise = (mt_rand() / mt_getrandmax()) * $noiseAmp;
                $amplitude += $noise;
            }
            
            $noise = (mt_rand() / mt_getrandmax() - 0.5) * 0.03;
            $amplitude += $noise;
            $amplitude = max(0, $amplitude);
            
            $isHarmonic = false;
            $harmonicOrder = null;
            
            for ($h = 1; $h <= 8; $h++) {
                $checkFreq = $baseFreq * $h;
                if (abs($freq - $checkFreq) < $freqStep * 1.5 && $amplitude > 0.1) {
                    $isHarmonic = true;
                    $harmonicOrder = $h;
                    break;
                }
            }
            
            $spectrum[] = [
                'frequency' => round($freq, 2),
                'amplitude' => round($amplitude, 6),
                'phase' => round((mt_rand() / mt_getrandmax()) * pi() * 2 - pi(), 4),
                'is_harmonic' => $isHarmonic,
                'harmonic_order' => $harmonicOrder,
            ];
        }
        
        return $spectrum;
    }
}

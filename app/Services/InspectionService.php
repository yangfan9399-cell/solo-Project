<?php

namespace App\Services;

use App\Models\InspectionResult;
use App\Models\Sample;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class InspectionService
{
    protected $sampleService;

    public function __construct(SampleService $sampleService)
    {
        $this->sampleService = $sampleService;
    }

    public function submitResult(Sample $sample, array $data, User $inspector)
    {
        return DB::transaction(function () use ($sample, $data, $inspector) {
            $result = InspectionResult::create([
                'sample_id' => $sample->id,
                'inspector_id' => $inspector->id,
                'inspection_date' => $data['inspection_date'] ?? now()->toDateString(),
                'indicators' => $data['indicators'],
                'result' => $data['result'],
                'conclusion' => $data['conclusion'],
                'report_file' => $data['report_file'] ?? null,
            ]);

            $newStatus = match ($data['result']) {
                InspectionResult::RESULT_QUALIFIED => Sample::STATUS_QUALIFIED,
                InspectionResult::RESULT_PESTICIDE_EXCEEDED => Sample::STATUS_UNQUALIFIED,
                InspectionResult::RESULT_OTHER_UNQUALIFIED => Sample::STATUS_UNQUALIFIED,
                default => Sample::STATUS_TESTING,
            };

            $this->sampleService->updateSampleStatus(
                $sample,
                $newStatus,
                "检测结果: {$result->result_name} - {$data['conclusion']}",
                $inspector
            );

            return $result;
        });
    }

    public function getDefaultIndicators()
    {
        return [
            ['name' => '敌敌畏', 'limit' => 0.05, 'unit' => 'mg/kg', 'value' => null],
            ['name' => '乐果', 'limit' => 0.02, 'unit' => 'mg/kg', 'value' => null],
            ['name' => '毒死蜱', 'limit' => 0.05, 'unit' => 'mg/kg', 'value' => null],
            ['name' => '氯氰菊酯', 'limit' => 0.5, 'unit' => 'mg/kg', 'value' => null],
            ['name' => '溴氰菊酯', 'limit' => 0.2, 'unit' => 'mg/kg', 'value' => null],
            ['name' => '多菌灵', 'limit' => 0.5, 'unit' => 'mg/kg', 'value' => null],
        ];
    }

    public function determineResult(array $indicators)
    {
        $hasExceeded = false;
        
        foreach ($indicators as $indicator) {
            if (isset($indicator['value']) && $indicator['value'] > $indicator['limit']) {
                $hasExceeded = true;
                break;
            }
        }

        if ($hasExceeded) {
            return InspectionResult::RESULT_PESTICIDE_EXCEEDED;
        }

        return InspectionResult::RESULT_QUALIFIED;
    }
}

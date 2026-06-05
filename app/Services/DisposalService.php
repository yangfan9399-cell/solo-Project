<?php

namespace App\Services;

use App\Models\Disposal;
use App\Models\Sample;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DisposalService
{
    protected $sampleService;

    public function __construct(SampleService $sampleService)
    {
        $this->sampleService = $sampleService;
    }

    public function createDisposal(Sample $sample, array $data, User $reviewer)
    {
        if (!$sample->canBeDisposed()) {
            if ($sample->hasConflict()) {
                throw new \Exception("样品存在编号冲突，无法进行处置，请先解决冲突");
            }
            throw new \Exception("样品当前状态不允许处置");
        }

        return DB::transaction(function () use ($sample, $data, $reviewer) {
            $disposal = Disposal::create([
                'sample_id' => $sample->id,
                'reviewer_id' => $reviewer->id,
                'suggestion' => $data['suggestion'],
                'action' => $data['action'],
                'status' => Disposal::STATUS_PENDING,
            ]);

            $this->sampleService->updateSampleStatus(
                $sample,
                Sample::STATUS_PROCESSING,
                "创建处置建议: {$disposal->action_name}",
                $reviewer
            );

            return $disposal;
        });
    }

    public function approveDisposal(Disposal $disposal, $decisionNote = null, User $reviewer)
    {
        return DB::transaction(function () use ($disposal, $decisionNote, $reviewer) {
            $disposal->update([
                'status' => Disposal::STATUS_APPROVED,
                'decision_note' => $decisionNote,
            ]);

            $sample = $disposal->sample;

            if ($disposal->action === Disposal::ACTION_REINSPECTION) {
                $newStatus = Sample::STATUS_REINSPECTION_APPLIED;
            } elseif ($disposal->action === Disposal::ACTION_RETURN_TO_SAMPLER) {
                $newStatus = Sample::STATUS_RETURNED;
            } else {
                $newStatus = Sample::STATUS_ARCHIVED;
            }

            $this->sampleService->updateSampleStatus(
                $sample,
                $newStatus,
                "处置已批准: {$disposal->action_name}" . ($decisionNote ? " - {$decisionNote}" : ""),
                $reviewer
            );

            return $disposal;
        });
    }

    public function returnToSampler(Disposal $disposal, $returnNote, User $reviewer)
    {
        return DB::transaction(function () use ($disposal, $returnNote, $reviewer) {
            $disposal->update([
                'status' => Disposal::STATUS_RETURNED,
                'decision_note' => $returnNote,
            ]);

            $sample = $disposal->sample;
            
            $this->sampleService->updateSampleStatus(
                $sample,
                Sample::STATUS_RETURNED,
                "退回抽样员: {$returnNote}",
                $reviewer
            );

            return $disposal;
        });
    }

    public function archiveSample(Sample $sample, User $reviewer)
    {
        return DB::transaction(function () use ($sample, $reviewer) {
            $disposal = $sample->disposal;
            if ($disposal) {
                $disposal->update(['status' => Disposal::STATUS_ARCHIVED]);
            }

            $this->sampleService->updateSampleStatus(
                $sample,
                Sample::STATUS_ARCHIVED,
                '样品已归档',
                $reviewer
            );

            return $sample;
        });
    }
}

<?php

namespace App\Services;

use App\Models\ReinspectionRequest;
use App\Models\Sample;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReinspectionService
{
    protected $sampleService;

    public function __construct(SampleService $sampleService)
    {
        $this->sampleService = $sampleService;
    }

    public function createRequest(Sample $sample, $reason, User $requester)
    {
        return DB::transaction(function () use ($sample, $reason, $requester) {
            $request = ReinspectionRequest::create([
                'sample_id' => $sample->id,
                'requester_id' => $requester->id,
                'reason' => $reason,
                'status' => ReinspectionRequest::STATUS_PENDING,
            ]);

            $this->sampleService->updateSampleStatus(
                $sample,
                Sample::STATUS_REINSPECTION_APPLIED,
                "复检申请: {$reason}",
                $requester
            );

            return $request;
        });
    }

    public function approveRequest(ReinspectionRequest $request, $reviewNote = null, User $reviewer)
    {
        return DB::transaction(function () use ($request, $reviewNote, $reviewer) {
            $request->update([
                'status' => ReinspectionRequest::STATUS_APPROVED,
                'review_note' => $reviewNote,
                'reviewer_id' => $reviewer->id,
                'reviewed_at' => now(),
            ]);

            $this->sampleService->updateSampleStatus(
                $request->sample,
                Sample::STATUS_TESTING,
                "复检申请已批准" . ($reviewNote ? ": {$reviewNote}" : ""),
                $reviewer
            );

            return $request;
        });
    }

    public function rejectRequest(ReinspectionRequest $request, $reviewNote, User $reviewer)
    {
        return DB::transaction(function () use ($request, $reviewNote, $reviewer) {
            $request->update([
                'status' => ReinspectionRequest::STATUS_REJECTED,
                'review_note' => $reviewNote,
                'reviewer_id' => $reviewer->id,
                'reviewed_at' => now(),
            ]);

            $sample = $request->sample;
            
            $this->sampleService->updateSampleStatus(
                $sample,
                Sample::STATUS_UNQUALIFIED,
                "复检申请被拒绝: {$reviewNote}",
                $reviewer
            );

            return $request;
        });
    }
}

<?php

namespace App\Services;

use App\Models\Sample;
use App\Models\StatusHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SampleService
{
    public function checkSampleNumberConflict($sampleNumber, $excludeId = null)
    {
        $query = Sample::where('sample_number', $sampleNumber);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        $existingSample = $query->first();
        
        return $existingSample;
    }

    public function createSample(array $data, User $sampler)
    {
        return DB::transaction(function () use ($data, $sampler) {
            $conflictSample = $this->checkSampleNumberConflict($data['sample_number']);
            
            $sample = Sample::create([
                'sample_number' => $data['sample_number'],
                'product_name' => $data['product_name'],
                'origin' => $data['origin'],
                'batch_number' => $data['batch_number'],
                'production_date' => $data['production_date'],
                'quantity' => $data['quantity'],
                'unit' => $data['unit'] ?? 'kg',
                'sample_source' => $data['sample_source'] ?? null,
                'evidence_photos' => $data['evidence_photos'] ?? null,
                'sampler_id' => $sampler->id,
                'status' => Sample::STATUS_REGISTERED,
                'conflict_sample_id' => $conflictSample?->id,
                'conflict_note' => $conflictSample ? "与样品 {$conflictSample->sample_number} 编号冲突" : null,
            ]);

            if ($conflictSample) {
                $conflictSample->update([
                    'conflict_sample_id' => $sample->id,
                    'conflict_note' => "与样品 {$sample->sample_number} 编号冲突",
                ]);
            }

            $this->recordStatusChange($sample, null, Sample::STATUS_REGISTERED, '样品登记', $sampler->id);

            return $sample;
        });
    }

    public function updateSampleSource(Sample $sample, string $source, User $user)
    {
        $sample->update(['sample_source' => $source]);
        
        $this->recordStatusChange(
            $sample,
            $sample->status,
            $sample->status,
            "补充来源信息: {$source}",
            $user->id
        );

        return $sample;
    }

    public function recordStatusChange(Sample $sample, $oldStatus, $newStatus, $note = null, $userId = null)
    {
        return StatusHistory::create([
            'sample_id' => $sample->id,
            'user_id' => $userId ?? auth()->id(),
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'note' => $note,
        ]);
    }

    public function updateSampleStatus(Sample $sample, $newStatus, $note = null, User $user = null)
    {
        $oldStatus = $sample->status;
        $sample->update(['status' => $newStatus]);
        
        $this->recordStatusChange($sample, $oldStatus, $newStatus, $note, $user?->id);
        
        return $sample;
    }

    public function resolveConflict(Sample $sample, $newSampleNumber, User $user)
    {
        return DB::transaction(function () use ($sample, $newSampleNumber, $user) {
            $conflictSample = $sample->conflictSample;
            
            if ($conflictSample) {
                $conflictSample->update([
                    'conflict_sample_id' => null,
                    'conflict_note' => null,
                ]);
            }

            $sample->update([
                'sample_number' => $newSampleNumber,
                'conflict_sample_id' => null,
                'conflict_note' => null,
            ]);

            $this->recordStatusChange(
                $sample,
                $sample->status,
                $sample->status,
                "编号冲突已解决，新编号: {$newSampleNumber}",
                $user->id
            );

            return $sample;
        });
    }
}

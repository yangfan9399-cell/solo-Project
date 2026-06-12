<?php

namespace App\Observers;

use App\Models\InspectionRecord;
use App\Services\InspectionRecordService;

class InspectionRecordObserver
{
    protected $service;

    public function __construct(InspectionRecordService $service)
    {
        $this->service = $service;
    }

    public function creating(InspectionRecord $record): void
    {
        if (empty($record->record_no)) {
            $record->record_no = $this->service->generateRecordNo();
        }

        if (empty($record->version)) {
            $record->version = 1;
        }
    }

    public function created(InspectionRecord $record): void
    {
        $this->service->updateSummaryAndConclusion($record);
        $record->saveQuietly();

        $blockings = $this->service->checkBlocking($record);
        if (!empty($blockings)) {
            $this->service->applyBlocking($record, $blockings);
            $record->saveQuietly();
        }
    }

    public function updating(InspectionRecord $record): void
    {
        if ($record->is_archived && $record->isDirty('is_archived') === false) {
            throw new \Exception('已归档记录无法修改');
        }

        $this->service->updateSummaryAndConclusion($record);
    }

    public function updated(InspectionRecord $record): void
    {
        if ($record->isDirty(array_merge(InspectionRecordService::KEY_FIELDS, ['status']))) {
            $blockings = $this->service->checkBlocking($record);
            $this->service->applyBlocking($record, $blockings);

            if (!empty($blockings) && !$record->has_blocking) {
                $record->has_blocking = true;
                $record->blocking_reason = collect($blockings)->pluck('reason')->implode('；');
                $record->saveQuietly();
            }
        }
    }

    public function saving(InspectionRecord $record): void
    {
        $this->service->updateSummaryAndConclusion($record);
    }
}

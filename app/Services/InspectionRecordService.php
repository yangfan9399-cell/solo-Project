<?php

namespace App\Services;

use App\Models\InspectionRecord;
use App\Models\RecordNode;
use App\Models\DifferenceComparison;
use App\Models\AbnormalRecord;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InspectionRecordService
{
    public const KEY_FIELDS = [
        'inspection_time',
        'household_name',
        'household_phone',
        'address',
        'gas_meter_no',
        'current_responsible_id',
        'involve_amount',
        'involve_quantity',
        'evidence_conclusion',
    ];

    public function generateRecordNo(): string
    {
        $prefix = 'GA-' . date('Ymd');
        $latest = InspectionRecord::where('record_no', 'like', $prefix . '%')
            ->orderBy('record_no', 'desc')
            ->first();

        $sequence = $latest ? (int)substr($latest->record_no, -3) + 1 : 1;

        return $prefix . '-' . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }

    public function updateSummaryAndConclusion(InspectionRecord $record): void
    {
        $dangerLabel = InspectionRecord::DANGER_LEVELS[$record->danger_level] ?? $record->danger_level;
        $statusLabel = InspectionRecord::STATUS_LABELS[$record->status] ?? $record->status;

        $summaryParts = [
            "【{$record->record_no}】",
            "{$record->household_name}",
            "{$dangerLabel}隐患",
            "金额:¥{$record->involve_amount}",
            "状态:{$statusLabel}",
        ];

        if ($record->has_blocking) {
            $summaryParts[] = "⚠️有阻断";
        }

        if ($record->is_archived) {
            $summaryParts[] = "✅已归档";
        }

        $record->summary = implode(' | ', $summaryParts);

        $conclusionParts = [];
        if ($record->evidence_conclusion) {
            $conclusionParts[] = "证据结论：{$record->evidence_conclusion}";
        }
        if ($record->handling_basis) {
            $conclusionParts[] = "采用依据：{$record->handling_basis}";
        }
        if ($record->conclusion) {
            $conclusionParts[] = "最终结论：{$record->conclusion}";
        }

        if (!empty($conclusionParts)) {
            $record->conclusion = implode("\n", $conclusionParts);
        }
    }

    public function createNode(
        InspectionRecord $record,
        string $nodeType,
        string $action,
        User $operator,
        array $changedFields = [],
        string $description = '',
        string $remark = ''
    ): RecordNode {
        $nodeOrder = $record->nodes()->max('node_order') + 1;

        return DB::transaction(function () use (
            $record,
            $nodeType,
            $action,
            $operator,
            $changedFields,
            $description,
            $remark,
            $nodeOrder
        ) {
            $snapshot = $record->toArray();
            unset($snapshot['nodes'], $snapshot['supplements'], $snapshot['attachments']);

            $node = RecordNode::create([
                'inspection_record_id' => $record->id,
                'node_type' => $nodeType,
                'node_name' => RecordNode::NODE_NAMES[$nodeType] ?? $nodeType,
                'description' => $description,
                'remark' => $remark,
                'operator_id' => $operator->id,
                'action' => $action,
                'changed_fields' => $changedFields,
                'snapshot' => $snapshot,
                'operated_at' => now(),
                'node_order' => $nodeOrder,
            ]);

            if (!empty($changedFields)) {
                $this->createDifferenceComparisons($record, $node, $changedFields, $operator);
            }

            return $node;
        });
    }

    public function createDifferenceComparisons(
        InspectionRecord $record,
        RecordNode $toNode,
        array $changedFields,
        User $operator
    ): void {
        $previousNode = $record->nodes()
            ->where('node_order', '<', $toNode->node_order)
            ->orderBy('node_order', 'desc')
            ->first();

        foreach ($changedFields as $field => $values) {
            if (!isset($values['before']) && !isset($values['after'])) {
                continue;
            }

            $changeType = 'update';
            if ($values['before'] === null || $values['before'] === '') {
                $changeType = 'create';
            } elseif ($values['after'] === null || $values['after'] === '') {
                $changeType = 'delete';
            }

            DifferenceComparison::create([
                'inspection_record_id' => $record->id,
                'from_node_id' => $previousNode?->id,
                'to_node_id' => $toNode->id,
                'field_name' => $field,
                'field_label' => DifferenceComparison::FIELD_LABELS[$field] ?? $field,
                'before_value' => $this->formatFieldValue($field, $values['before']),
                'after_value' => $this->formatFieldValue($field, $values['after']),
                'change_type' => $changeType,
                'operator_id' => $operator->id,
                'compared_at' => now(),
            ]);
        }
    }

    protected function formatFieldValue(string $field, $value): string
    {
        if ($value === null || $value === '') {
            return '-';
        }

        if ($field === 'inspection_time' && is_string($value)) {
            return date('Y-m-d H:i', strtotime($value));
        }

        if ($field === 'current_responsible_id') {
            $user = User::find($value);
            return $user ? "{$user->name} ({$user->role_label})" : (string)$value;
        }

        if ($field === 'involve_amount') {
            return '¥' . number_format((float)$value, 2);
        }

        if ($field === 'danger_level') {
            return InspectionRecord::DANGER_LEVELS[$value] ?? $value;
        }

        if ($field === 'status') {
            return InspectionRecord::STATUS_LABELS[$value] ?? $value;
        }

        return (string)$value;
    }

    public function checkBlocking(InspectionRecord $record): array
    {
        $blockings = [];

        if ($record->sample_type === InspectionRecord::SAMPLE_NUMBER_CONFLICT) {
            $conflict = InspectionRecord::where('gas_meter_no', $record->gas_meter_no)
                ->where('id', '!=', $record->id)
                ->where('is_archived', false)
                ->first();

            if ($conflict) {
                $blockings[] = [
                    'type' => 'number_conflict',
                    'reason' => "燃气表编号[{$record->gas_meter_no}]与记录[{$conflict->record_no}]存在冲突",
                    'fields' => ['gas_meter_no', 'record_no'],
                    'remedy' => '1. 核实燃气表编号准确性；2. 与冲突记录持有人沟通确认；3. 如为重复记录则合并归档；4. 如编号有误则更正后重新提交。',
                ];
            }
        }

        if ($record->sample_type === InspectionRecord::SAMPLE_AMOUNT_DIFFERENCE) {
            if ($record->involve_amount > 10000 && $record->involve_quantity < 5) {
                $blockings[] = [
                    'type' => 'amount_difference',
                    'reason' => "涉及金额({$record->involve_amount}元)与数量({$record->involve_quantity})存在明显差异",
                    'fields' => ['involve_amount', 'involve_quantity'],
                    'remedy' => '1. 重新核对计费标准和计算过程；2. 现场复核实际数量；3. 补充金额计算依据说明；4. 如有误则调整数据后重新提交。',
                ];
            }
        }

        if ($record->sample_type === InspectionRecord::SAMPLE_APPEAL) {
            $hasAppealNode = $record->nodes()->where('node_type', RecordNode::NODE_APPEALED)->exists();
            if (!$hasAppealNode) {
                $blockings[] = [
                    'type' => 'appeal',
                    'reason' => '当事人提出申诉，需按申诉流程处理',
                    'fields' => ['status', 'evidence_conclusion'],
                    'remedy' => '1. 登记申诉内容并通知当事人；2. 组织重新核查；3. 补充核查证据；4. 召开申诉评审会；5. 出具最终结论。',
                ];
            }
        }

        return $blockings;
    }

    public function applyBlocking(InspectionRecord $record, array $blockings): void
    {
        if (empty($blockings)) {
            $record->has_blocking = false;
            $record->blocking_reason = null;
            return;
        }

        $record->has_blocking = true;
        $record->blocking_reason = collect($blockings)
            ->pluck('reason')
            ->implode('；');

        foreach ($blockings as $blocking) {
            AbnormalRecord::updateOrCreate(
                [
                    'inspection_record_id' => $record->id,
                    'abnormal_type' => $blocking['type'],
                    'resolution_status' => AbnormalRecord::STATUS_PENDING,
                ],
                [
                    'blocking_reason' => $blocking['reason'],
                    'difference_fields' => $blocking['fields'],
                    'remedy_path' => $blocking['remedy'],
                ]
            );
        }
    }

    public function processTransition(
        InspectionRecord $record,
        string $targetStatus,
        User $operator,
        string $remark = ''
    ): InspectionRecord {
        if ($record->is_archived) {
            throw new \Exception('已归档记录无法修改');
        }

        return DB::transaction(function () use ($record, $targetStatus, $operator, $remark) {
            $original = $record->getOriginal();
            $record->status = $targetStatus;

            $changedFields = [];
            foreach (self::KEY_FIELDS as $field) {
                if ($record->$field != $original[$field]) {
                    $changedFields[$field] = [
                        'before' => $original[$field],
                        'after' => $record->$field,
                    ];
                }
            }

            if ($targetStatus !== $original['status']) {
                $changedFields['status'] = [
                    'before' => $original['status'],
                    'after' => $targetStatus,
                ];
            }

            $this->updateSummaryAndConclusion($record);
            $record->save();

            $nodeType = $this->mapStatusToNodeType($targetStatus);
            $action = $this->mapStatusToAction($targetStatus);

            $this->createNode(
                $record,
                $nodeType,
                $action,
                $operator,
                $changedFields,
                RecordNode::NODE_NAMES[$nodeType] ?? $nodeType,
                $remark
            );

            $blockings = $this->checkBlocking($record);
            $this->applyBlocking($record, $blockings);

            if (!empty($blockings)) {
                $record->status = $this->mapBlockingToStatus($blockings[0]['type']);
                $this->updateSummaryAndConclusion($record);
                $record->save();
            }

            return $record->fresh();
        });
    }

    protected function mapStatusToNodeType(string $status): string
    {
        $map = [
            InspectionRecord::STATUS_ACCEPTED => RecordNode::NODE_ACCEPTED,
            InspectionRecord::STATUS_PROCESSING => RecordNode::NODE_PROCESSING,
            InspectionRecord::STATUS_REVIEWING => RecordNode::NODE_REVIEWING,
            InspectionRecord::STATUS_APPROVED => RecordNode::NODE_APPROVED,
            InspectionRecord::STATUS_ARCHIVED => RecordNode::NODE_ARCHIVED,
            InspectionRecord::STATUS_RETURNED => RecordNode::NODE_RETURNED,
            InspectionRecord::STATUS_APPEALED => RecordNode::NODE_APPEALED,
        ];

        return $map[$status] ?? RecordNode::NODE_PROCESSING;
    }

    protected function mapStatusToAction(string $status): string
    {
        $map = [
            InspectionRecord::STATUS_ACCEPTED => RecordNode::ACTION_CREATE,
            InspectionRecord::STATUS_PROCESSING => RecordNode::ACTION_UPDATE,
            InspectionRecord::STATUS_REVIEWING => RecordNode::ACTION_SUBMIT,
            InspectionRecord::STATUS_APPROVED => RecordNode::ACTION_APPROVE,
            InspectionRecord::STATUS_ARCHIVED => RecordNode::ACTION_ARCHIVE,
            InspectionRecord::STATUS_RETURNED => RecordNode::ACTION_REJECT,
            InspectionRecord::STATUS_APPEALED => RecordNode::ACTION_APPEAL,
        ];

        return $map[$status] ?? RecordNode::ACTION_UPDATE;
    }

    protected function mapBlockingToStatus(string $blockingType): string
    {
        $map = [
            'number_conflict' => InspectionRecord::STATUS_NUMBER_CONFLICT,
            'amount_difference' => InspectionRecord::STATUS_AMOUNT_DIFFERENCE,
            'quantity_difference' => InspectionRecord::STATUS_AMOUNT_DIFFERENCE,
            'appeal' => InspectionRecord::STATUS_APPEALED,
        ];

        return $map[$blockingType] ?? InspectionRecord::STATUS_PROCESSING;
    }

    public function archiveRecord(InspectionRecord $record, User $operator, string $remark = ''): InspectionRecord
    {
        if ($record->has_blocking) {
            throw new \Exception('存在未解决的阻断，无法归档');
        }

        return DB::transaction(function () use ($record, $operator, $remark) {
            $record->is_archived = true;
            $record->archived_at = now();
            $record->archived_by = $operator->id;
            $record->status = InspectionRecord::STATUS_ARCHIVED;

            $this->updateSummaryAndConclusion($record);
            $record->save();

            $this->createNode(
                $record,
                RecordNode::NODE_ARCHIVED,
                RecordNode::ACTION_ARCHIVE,
                $operator,
                ['status' => ['before' => InspectionRecord::STATUS_REVIEWING, 'after' => InspectionRecord::STATUS_ARCHIVED]],
                '记录已归档',
                $remark
            );

            return $record->fresh();
        });
    }

    public function reopenRecord(InspectionRecord $record, User $operator, string $reason): InspectionRecord
    {
        return DB::transaction(function () use ($record, $operator, $reason) {
            $newRecord = $record->replicate();
            $newRecord->record_no = $this->generateRecordNo();
            $newRecord->parent_id = $record->id;
            $newRecord->status = InspectionRecord::STATUS_PROCESSING;
            $newRecord->is_archived = false;
            $newRecord->archived_at = null;
            $newRecord->archived_by = null;
            $newRecord->has_blocking = false;
            $newRecord->blocking_reason = null;
            $newRecord->version = $record->version + 1;
            $newRecord->created_by = $operator->id;

            $this->updateSummaryAndConclusion($newRecord);
            $newRecord->save();

            $this->createNode(
                $newRecord,
                RecordNode::NODE_PROCESSING,
                RecordNode::ACTION_REOPEN,
                $operator,
                [],
                '重新处理：' . $reason,
                "基于记录 {$record->record_no} 重新处理，原因：{$reason}"
            );

            return $newRecord;
        });
    }

    public function getStatistics(): array
    {
        $total = InspectionRecord::count();
        $archived = InspectionRecord::where('is_archived', true)->count();
        $processing = InspectionRecord::where('is_archived', false)->count();
        $hasBlocking = InspectionRecord::where('has_blocking', true)->count();

        $byStatus = InspectionRecord::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $bySampleType = InspectionRecord::selectRaw('sample_type, COUNT(*) as count')
            ->groupBy('sample_type')
            ->pluck('count', 'sample_type')
            ->toArray();

        $byDangerLevel = InspectionRecord::selectRaw('danger_level, COUNT(*) as count')
            ->groupBy('danger_level')
            ->pluck('count', 'danger_level')
            ->toArray();

        $totalAmount = InspectionRecord::sum('involve_amount');
        $totalQuantity = InspectionRecord::sum('involve_quantity');

        $pendingAbnormal = AbnormalRecord::where('resolution_status', AbnormalRecord::STATUS_PENDING)->count();

        return [
            'total' => $total,
            'archived' => $archived,
            'processing' => $processing,
            'has_blocking' => $hasBlocking,
            'by_status' => $byStatus,
            'by_sample_type' => $bySampleType,
            'by_danger_level' => $byDangerLevel,
            'total_amount' => (float)$totalAmount,
            'total_quantity' => (int)$totalQuantity,
            'pending_abnormal' => $pendingAbnormal,
            'archive_rate' => $total > 0 ? round(($archived / $total) * 100, 2) : 0,
        ];
    }

    public function getTrendData(int $days = 30): array
    {
        $startDate = now()->subDays($days);

        $records = InspectionRecord::where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count, sample_type')
            ->groupBy('date', 'sample_type')
            ->orderBy('date')
            ->get();

        $trend = [];
        foreach ($records as $record) {
            if (!isset($trend[$record->date])) {
                $trend[$record->date] = [
                    'date' => $record->date,
                    'total' => 0,
                    'normal' => 0,
                    'number_conflict' => 0,
                    'amount_difference' => 0,
                    'appeal' => 0,
                ];
            }
            $trend[$record->date]['total'] += $record->count;
            $trend[$record->date][$record->sample_type] = $record->count;
        }

        return array_values($trend);
    }
}

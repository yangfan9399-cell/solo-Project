<?php

namespace App\Services;

use App\Models\ReviewRecord;
use App\Models\ReviewNode;
use App\Models\DiscrepancyRecord;
use App\Models\AppealRecord;
use App\Models\Attachment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ReviewService
{
    public function createRecord(array $data, User $operator): ReviewRecord
    {
        return DB::transaction(function () use ($data, $operator) {
            $recordNo = $this->generateRecordNo();
            
            $record = ReviewRecord::create([
                'record_no' => $recordNo,
                'title' => $data['title'],
                'source' => $data['source'],
                'source_dept' => $data['source_dept'] ?? null,
                'student_name' => $data['student_name'],
                'student_id' => $data['student_id'],
                'college' => $data['college'],
                'major' => $data['major'],
                'grade' => $data['grade'],
                'scholarship_type' => $data['scholarship_type'],
                'scholarship_level' => $data['scholarship_level'] ?? null,
                'apply_amount' => $data['apply_amount'] ?? 0,
                'apply_count' => $data['apply_count'] ?? 1,
                'status' => ReviewRecord::STATUS_PENDING,
                'anomaly_type' => $data['anomaly_type'] ?? null,
                'block_reason' => $data['block_reason'] ?? null,
                'remedy_path' => $data['remedy_path'] ?? null,
                'original_data' => [
                    'apply_amount' => $data['apply_amount'] ?? 0,
                    'apply_count' => $data['apply_count'] ?? 1,
                    'student_id' => $data['student_id'],
                    'scholarship_type' => $data['scholarship_type'],
                ],
                'received_at' => Carbon::now(),
                'created_by' => $operator->id,
            ]);

            $this->createNode($record, ReviewNode::NODE_TYPE_RECEIVE, [
                'operator_id' => $operator->id,
                'business_note' => $data['business_note'] ?? '系统自动受理',
                'snapshot' => $record->toArray(),
            ]);

            if (!empty($data['anomaly_type'])) {
                $this->createDiscrepancy($record, $data);
            }

            return $record->load(['currentOwner', 'createdBy', 'nodes.operator']);
        });
    }

    public function processRecord(ReviewRecord $record, array $data, User $operator): ReviewRecord
    {
        if ($record->is_archived) {
            throw new \Exception('已归档的记录不能修改');
        }

        return DB::transaction(function () use ($record, $data, $operator) {
            $changes = $this->detectChanges($record, $data);
            
            $updateData = [
                'processed_data' => array_merge($record->processed_data ?? [], [
                    'approved_amount' => $data['approved_amount'] ?? $record->apply_amount,
                    'approved_count' => $data['approved_count'] ?? $record->apply_count,
                ]),
                'diff_fields' => $changes,
                'basis' => $data['basis'] ?? $record->basis,
            ];

            if (isset($data['apply_amount'])) {
                $updateData['apply_amount'] = $data['apply_amount'];
            }
            if (isset($data['approved_amount'])) {
                $updateData['approved_amount'] = $data['approved_amount'];
            }
            if (isset($data['apply_count'])) {
                $updateData['apply_count'] = $data['apply_count'];
            }
            if (isset($data['approved_count'])) {
                $updateData['approved_count'] = $data['approved_count'];
            }
            if (isset($data['student_id'])) {
                $updateData['student_id'] = $data['student_id'];
            }
            if (isset($data['anomaly_type'])) {
                $updateData['anomaly_type'] = $data['anomaly_type'];
            }
            if (isset($data['block_reason'])) {
                $updateData['block_reason'] = $data['block_reason'];
            }
            if (isset($data['remedy_path'])) {
                $updateData['remedy_path'] = $data['remedy_path'];
            }

            $record->update($updateData);

            $this->createNode($record, ReviewNode::NODE_TYPE_PROCESS, [
                'operator_id' => $operator->id,
                'business_note' => $data['business_note'] ?? null,
                'site_description' => $data['on_site_note'] ?? $data['site_description'] ?? null,
                'evidence_note' => $data['evidence_note'] ?? null,
                'changes' => $changes,
                'snapshot' => $record->fresh()->toArray(),
            ]);

            $record->update([
                'status' => ReviewRecord::STATUS_REVIEWING,
                'processed_at' => Carbon::now(),
            ]);

            return $record->load(['currentOwner', 'createdBy', 'nodes.operator', 'discrepancies', 'appeals']);
        });
    }

    public function reviewRecord(ReviewRecord $record, string $action, array $data, User $operator): ReviewRecord
    {
        if ($record->is_archived) {
            throw new \Exception('已归档的记录不能修改');
        }

        if (!$operator->isApprovalOfficer()) {
            throw new \Exception('只有审批负责人可以执行此操作');
        }

        return DB::transaction(function () use ($record, $action, $data, $operator) {
            $fromStatus = $record->status;
            
            switch ($action) {
                case 'confirm':
                    $toStatus = ReviewRecord::STATUS_REVIEWING;
                    $nodeType = ReviewNode::NODE_TYPE_REVIEW;
                    $updateData = [
                        'status' => $toStatus,
                        'conclusion' => $data['conclusion'] ?? $record->conclusion,
                        'basis' => $data['basis'] ?? $record->basis,
                        'reviewed_at' => Carbon::now(),
                    ];
                    if (isset($data['approved_amount'])) {
                        $updateData['approved_amount'] = $data['approved_amount'];
                    }
                    $record->update($updateData);
                    break;
                case 'return':
                    $toStatus = ReviewRecord::STATUS_RETURNED;
                    $nodeType = ReviewNode::NODE_TYPE_RETURN;
                    $record->update([
                        'status' => $toStatus,
                        'reviewed_at' => Carbon::now(),
                        'block_reason' => $data['return_reason'] ?? $record->block_reason,
                    ]);
                    break;
                case 'archive':
                    $toStatus = ReviewRecord::STATUS_ARCHIVED;
                    $nodeType = ReviewNode::NODE_TYPE_ARCHIVE;
                    $record->update([
                        'status' => $toStatus,
                        'is_archived' => true,
                        'conclusion' => $data['conclusion'] ?? $record->conclusion,
                        'archived_at' => Carbon::now(),
                    ]);
                    break;
                default:
                    throw new \Exception('无效的操作');
            }

            $this->createNode($record, $nodeType, [
                'operator_id' => $operator->id,
                'review_opinion' => $data['review_opinion'] ?? null,
                'action' => $action,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'snapshot' => $record->fresh()->toArray(),
            ]);

            return $record->load(['currentOwner', 'createdBy', 'nodes.operator', 'discrepancies', 'appeals']);
        });
    }

    public function reopenRecord(ReviewRecord $record, string $reason, User $operator): ReviewRecord
    {
        if (!$operator->isApprovalOfficer()) {
            throw new \Exception('只有审批负责人可以重新处理');
        }

        return DB::transaction(function () use ($record, $reason, $operator) {
            $record->update([
                'is_archived' => false,
                'status' => ReviewRecord::STATUS_PROCESSING,
            ]);

            $latestNode = $record->latestNode;
            if ($latestNode) {
                $latestNode->update([
                    'is_active' => false,
                    'reopen_reason' => $reason,
                    'reopened_by' => $operator->id,
                    'reopened_at' => Carbon::now(),
                ]);
            }

            $this->createNode($record, ReviewNode::NODE_TYPE_REOPEN, [
                'operator_id' => $operator->id,
                'business_note' => $reason,
                'snapshot' => $record->fresh()->toArray(),
            ]);

            return $record->load(['currentOwner', 'createdBy', 'nodes.operator', 'discrepancies', 'appeals']);
        });
    }

    public function createNode(ReviewRecord $record, string $nodeType, array $data): ReviewNode
    {
        $maxSequence = $record->nodes()->max('sequence') ?? 0;
        
        $nodeNames = [
            ReviewNode::NODE_TYPE_RECEIVE => '受理',
            ReviewNode::NODE_TYPE_PROCESS => '业务处理',
            ReviewNode::NODE_TYPE_REVIEW => '复核审批',
            ReviewNode::NODE_TYPE_APPEAL => '申诉处理',
            ReviewNode::NODE_TYPE_ARCHIVE => '归档',
            ReviewNode::NODE_TYPE_REOPEN => '重新处理',
            ReviewNode::NODE_TYPE_RETURN => '退回补证',
        ];

        return $record->nodes()->create([
            'node_type' => $nodeType,
            'node_name' => $nodeNames[$nodeType] ?? $nodeType,
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => $maxSequence + 1,
            'operator_id' => $data['operator_id'] ?? null,
            'operated_at' => Carbon::now(),
            'business_note' => $data['business_note'] ?? null,
            'site_description' => $data['site_description'] ?? null,
            'evidence_note' => $data['evidence_note'] ?? null,
            'review_opinion' => $data['review_opinion'] ?? null,
            'action' => $data['action'] ?? null,
            'from_status' => $data['from_status'] ?? null,
            'to_status' => $data['to_status'] ?? null,
            'snapshot' => $data['snapshot'] ?? null,
            'changes' => $data['changes'] ?? null,
        ]);
    }

    public function createDiscrepancy(ReviewRecord $record, array $data): DiscrepancyRecord
    {
        $fieldMap = [
            ReviewRecord::ANOMALY_NO_CONFLICT => 'student_id',
            ReviewRecord::ANOMALY_AMOUNT_DIFF => 'apply_amount',
            ReviewRecord::ANOMALY_COUNT_DIFF => 'apply_count',
        ];

        $typeMap = [
            ReviewRecord::ANOMALY_NO_CONFLICT => DiscrepancyRecord::TYPE_NO_CONFLICT,
            ReviewRecord::ANOMALY_AMOUNT_DIFF => DiscrepancyRecord::TYPE_AMOUNT_DIFF,
            ReviewRecord::ANOMALY_COUNT_DIFF => DiscrepancyRecord::TYPE_COUNT_DIFF,
        ];

        $fieldName = $fieldMap[$data['anomaly_type']] ?? 'unknown';
        $discrepancyType = $typeMap[$data['anomaly_type']] ?? DiscrepancyRecord::TYPE_DATA_MISMATCH;

        return $record->discrepancies()->create([
            'discrepancy_type' => $discrepancyType,
            'field_name' => $fieldName,
            'expected_value' => $data['expected_value'] ?? null,
            'actual_value' => $data['actual_value'] ?? null,
            'description' => $data['description'] ?? null,
            'block_reason' => $data['block_reason'] ?? null,
            'remedy_path' => $data['remedy_path'] ?? null,
            'status' => DiscrepancyRecord::STATUS_PENDING,
        ]);
    }

    public function createAppeal(ReviewRecord $record, array $data): AppealRecord
    {
        return DB::transaction(function () use ($record, $data) {
            $appealNo = $this->generateAppealNo();
            
            $appeal = $record->appeals()->create([
                'appeal_no' => $appealNo,
                'appealer_name' => $data['appealer_name'],
                'appealer_contact' => $data['appealer_contact'] ?? null,
                'appealer_type' => $data['appealer_type'] ?? 'student',
                'appeal_reason' => $data['appeal_reason'],
                'appeal_content' => $data['appeal_content'],
                'appeal_evidence' => $data['appeal_evidence'] ?? null,
                'appealed_at' => $data['appealed_at'] ?? Carbon::now(),
                'status' => AppealRecord::STATUS_PENDING,
            ]);

            $record->update([
                'status' => ReviewRecord::STATUS_APPEALING,
                'anomaly_type' => ReviewRecord::ANOMALY_APPEAL,
            ]);

            $this->createNode($record, ReviewNode::NODE_TYPE_APPEAL, [
                'business_note' => "收到申诉：{$data['appeal_reason']}",
            ]);

            return $appeal;
        });
    }

    public function getList(array $filters = []): array
    {
        $query = ReviewRecord::with(['currentOwner', 'createdBy', 'latestNode']);

        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }
        if (!empty($filters['anomaly_type'])) {
            if ($filters['anomaly_type'] === 'has') {
                $query->whereNotNull('anomaly_type');
            } else {
                $query->where('anomaly_type', $filters['anomaly_type']);
            }
        }
        if (!empty($filters['is_archived'])) {
            if ($filters['is_archived'] === 'archived') {
                $query->archived();
            } elseif ($filters['is_archived'] === 'active') {
                $query->notArchived();
            }
        }
        if (!empty($filters['search'])) {
            $kw = "%{$filters['search']}%";
            $query->where(function ($q) use ($kw) {
                $q->where('title', 'like', $kw)
                  ->orWhere('student_name', 'like', $kw)
                  ->orWhere('student_id', 'like', $kw)
                  ->orWhere('record_no', 'like', $kw)
                  ->orWhere('college', 'like', $kw);
            });
        }
        if (!empty($filters['owner_id'])) {
            $query->where('current_owner_id', $filters['owner_id']);
        }

        $records = $query->latest()->paginate($filters['per_page'] ?? 20);
        
        return [
            'data' => $records->map(function ($record) {
                return $record->summary;
            })->toArray(),
            'pagination' => [
                'total' => $records->total(),
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
            ],
        ];
    }

    public function getDetail(ReviewRecord $record): array
    {
        $record->load([
            'currentOwner',
            'createdBy',
            'nodes.operator',
            'nodes.attachments',
            'discrepancies',
            'appeals.handledBy',
            'attachments.uploadedBy',
        ]);

        $diffFields = $this->calculateDiff($record);
        $diffCalculated = $this->calculateDiffDisplay($record);

        return [
            'id' => $record->id,
            'record_no' => $record->record_no,
            'title' => $record->title,
            'source' => $record->source,
            'source_dept' => $record->source_dept,
            'student_name' => $record->student_name,
            'student_id' => $record->student_id,
            'college' => $record->college,
            'major' => $record->major,
            'grade' => $record->grade,
            'scholarship_type' => $record->scholarship_type,
            'scholarship_level' => $record->scholarship_level,
            'apply_amount' => $record->apply_amount,
            'approved_amount' => $record->approved_amount,
            'apply_count' => $record->apply_count,
            'approved_count' => $record->approved_count,
            'status' => $record->status,
            'status_label' => $record->status_label,
            'anomaly_type' => $record->anomaly_type,
            'anomaly_label' => $record->anomaly_label,
            'block_reason' => $record->block_reason,
            'remedy_path' => $record->remedy_path,
            'is_archived' => $record->is_archived,
            'can_edit' => $record->canEdit(),
            'original_data' => $record->original_data,
            'processed_data' => $record->processed_data,
            'diff_fields' => $diffFields,
            'diff_calculated' => $diffCalculated,
            'basis' => $record->basis,
            'conclusion' => $record->conclusion,
            'received_at' => $record->received_at?->toDateTimeString(),
            'processed_at' => $record->processed_at?->toDateTimeString(),
            'reviewed_at' => $record->reviewed_at?->toDateTimeString(),
            'archived_at' => $record->archived_at?->toDateTimeString(),
            'created_at' => $record->created_at?->toDateTimeString(),
            'updated_at' => $record->updated_at?->toDateTimeString(),
            'current_owner' => $record->currentOwner ? [
                'id' => $record->currentOwner->id,
                'name' => $record->currentOwner->name,
                'department' => $record->currentOwner->department,
                'role' => $record->currentOwner->role?->display_name,
            ] : null,
            'created_by' => $record->createdBy ? [
                'id' => $record->createdBy->id,
                'name' => $record->createdBy->name,
                'department' => $record->createdBy->department,
            ] : null,
            'nodes' => $record->activeNodes->map(function ($node) {
                return [
                    'id' => $node->id,
                    'type' => $node->node_type,
                    'type_label' => $node->node_type_label,
                    'node_name' => $node->node_name,
                    'status' => $node->status,
                    'status_label' => $node->status_label,
                    'sequence' => $node->sequence,
                    'business_note' => $node->business_note,
                    'site_description' => $node->site_description,
                    'evidence_note' => $node->evidence_note,
                    'review_opinion' => $node->review_opinion,
                    'action' => $node->action,
                    'from_status' => $node->from_status,
                    'to_status' => $node->to_status,
                    'changes' => $node->changes,
                    'is_active' => $node->is_active,
                    'operated_at' => $node->operated_at?->toDateTimeString(),
                    'operator' => $node->operator ? [
                        'id' => $node->operator->id,
                        'name' => $node->operator->name,
                        'department' => $node->operator->department,
                    ] : null,
                    'attachments' => $node->attachments->map(function ($att) {
                        return [
                            'id' => $att->id,
                            'file_name' => $att->file_name,
                            'original_name' => $att->original_name,
                            'attachment_type' => $att->attachment_type,
                            'attachment_type_label' => $att->attachment_type_label,
                            'file_url' => $att->file_url,
                        ];
                    }),
                ];
            })->toArray(),
            'discrepancies' => $record->discrepancies->map(function ($d) {
                return [
                    'id' => $d->id,
                    'discrepancy_type' => $d->discrepancy_type,
                    'discrepancy_type_label' => $d->discrepancy_type_label,
                    'field_name' => $d->field_name,
                    'expected_value' => $d->expected_value,
                    'actual_value' => $d->actual_value,
                    'description' => $d->description,
                    'block_reason' => $d->block_reason,
                    'remedy_path' => $d->remedy_path,
                    'resolution' => $d->resolution,
                    'status' => $d->status,
                    'status_label' => $d->status_label,
                ];
            })->toArray(),
            'appeals' => $record->appeals->map(function ($a) {
                return [
                    'id' => $a->id,
                    'appeal_no' => $a->appeal_no,
                    'appealer_name' => $a->appealer_name,
                    'appealer_type' => $a->appealer_type,
                    'appealer_type_label' => $a->appealer_type_label,
                    'appeal_reason' => $a->appeal_reason,
                    'appeal_content' => $a->appeal_content,
                    'appealed_at' => $a->appealed_at?->toDateTimeString(),
                    'handling_opinion' => $a->handling_opinion,
                    'final_result' => $a->final_result,
                    'status' => $a->status,
                    'status_label' => $a->status_label,
                ];
            })->toArray(),
            'attachments' => $record->attachments->map(function ($att) {
                return [
                    'id' => $att->id,
                    'file_name' => $att->file_name,
                    'original_name' => $att->original_name,
                    'attachment_type' => $att->attachment_type,
                    'attachment_type_label' => $att->attachment_type_label,
                    'file_url' => $att->file_url,
                    'description' => $att->description,
                    'uploaded_by' => $att->uploadedBy ? [
                        'id' => $att->uploadedBy->id,
                        'name' => $att->uploadedBy->name,
                    ] : null,
                    'created_at' => $att->created_at?->toDateTimeString(),
                ];
            })->toArray(),
        ];
    }

    public function getStatistics(): array
    {
        $total = ReviewRecord::count();
        $archived = ReviewRecord::archived()->count();
        $pending = ReviewRecord::byStatus(ReviewRecord::STATUS_PENDING)->count();
        $processing = ReviewRecord::byStatus(ReviewRecord::STATUS_PROCESSING)->count();
        $reviewing = ReviewRecord::byStatus(ReviewRecord::STATUS_REVIEWING)->count();
        $appealing = ReviewRecord::byStatus(ReviewRecord::STATUS_APPEALING)->count();
        $returned = ReviewRecord::byStatus(ReviewRecord::STATUS_RETURNED)->count();
        
        $hasAnomaly = ReviewRecord::hasAnomaly()->count();
        $noConflict = ReviewRecord::where('anomaly_type', ReviewRecord::ANOMALY_NO_CONFLICT)->count();
        $amountDiff = ReviewRecord::where('anomaly_type', ReviewRecord::ANOMALY_AMOUNT_DIFF)->count();
        $countDiff = ReviewRecord::where('anomaly_type', ReviewRecord::ANOMALY_COUNT_DIFF)->count();
        $appealAnomaly = ReviewRecord::where('anomaly_type', ReviewRecord::ANOMALY_APPEAL)->count();

        $totalApplyAmount = ReviewRecord::sum('apply_amount');
        $totalApprovedAmount = ReviewRecord::whereNotNull('approved_amount')->sum('approved_amount');
        $totalDiffAmount = $totalApplyAmount - $totalApprovedAmount;

        $statusColors = [
            ReviewRecord::STATUS_PENDING => '#EAB308',
            ReviewRecord::STATUS_PROCESSING => '#3B82F6',
            ReviewRecord::STATUS_REVIEWING => '#8B5CF6',
            ReviewRecord::STATUS_APPEALING => '#F97316',
            ReviewRecord::STATUS_ARCHIVED => '#10B981',
            ReviewRecord::STATUS_RETURNED => '#EF4444',
        ];

        $anomalyColors = [
            ReviewRecord::ANOMALY_NO_CONFLICT => '#EF4444',
            ReviewRecord::ANOMALY_AMOUNT_DIFF => '#F97316',
            ReviewRecord::ANOMALY_COUNT_DIFF => '#EAB308',
            ReviewRecord::ANOMALY_APPEAL => '#8B5CF6',
        ];

        $statusLabels = [
            ReviewRecord::STATUS_PENDING => '待受理',
            ReviewRecord::STATUS_PROCESSING => '处理中',
            ReviewRecord::STATUS_REVIEWING => '复核中',
            ReviewRecord::STATUS_APPEALING => '申诉中',
            ReviewRecord::STATUS_ARCHIVED => '已归档',
            ReviewRecord::STATUS_RETURNED => '已退回',
        ];

        $anomalyLabels = [
            ReviewRecord::ANOMALY_NO_CONFLICT => '编号冲突',
            ReviewRecord::ANOMALY_AMOUNT_DIFF => '金额差异',
            ReviewRecord::ANOMALY_COUNT_DIFF => '数量差异',
            ReviewRecord::ANOMALY_APPEAL => '当事人申诉',
        ];

        $statusDistribution = [];
        foreach ([
            ReviewRecord::STATUS_PENDING => $pending,
            ReviewRecord::STATUS_PROCESSING => $processing,
            ReviewRecord::STATUS_REVIEWING => $reviewing,
            ReviewRecord::STATUS_APPEALING => $appealing,
            ReviewRecord::STATUS_RETURNED => $returned,
            ReviewRecord::STATUS_ARCHIVED => $archived,
        ] as $status => $count) {
            $statusDistribution[] = [
                'status' => $status,
                'label' => $statusLabels[$status] ?? $status,
                'count' => $count,
                'color' => $statusColors[$status] ?? '#6B7280',
            ];
        }

        $anomalyDistribution = [];
        $anomalyData = [
            ReviewRecord::ANOMALY_NO_CONFLICT => $noConflict,
            ReviewRecord::ANOMALY_AMOUNT_DIFF => $amountDiff,
            ReviewRecord::ANOMALY_COUNT_DIFF => $countDiff,
            ReviewRecord::ANOMALY_APPEAL => $appealAnomaly,
        ];
        foreach ($anomalyData as $type => $count) {
            if ($count > 0) {
                $anomalyDistribution[] = [
                    'type' => $type,
                    'label' => $anomalyLabels[$type] ?? $type,
                    'count' => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
                    'color' => $anomalyColors[$type] ?? '#6B7280',
                ];
            }
        }

        $scholarshipAmount = ReviewRecord::select('scholarship_type', 
            DB::raw('sum(apply_amount) as apply_amount'), 
            DB::raw('sum(COALESCE(approved_amount, apply_amount)) as approved_amount'))
            ->groupBy('scholarship_type')
            ->orderByRaw('sum(apply_amount) desc')
            ->limit(8)
            ->get()
            ->map(function ($item) {
                return [
                    'type' => $item->scholarship_type,
                    'apply_amount' => round($item->apply_amount, 2),
                    'approved_amount' => round($item->approved_amount, 2),
                ];
            })->toArray();

        $collegeDistribution = ReviewRecord::select('college', 
            DB::raw('count(*) as total'),
            DB::raw('sum(case when anomaly_type is null then 1 else 0 end) as normal'),
            DB::raw('sum(case when anomaly_type is not null then 1 else 0 end) as anomaly'))
            ->groupBy('college')
            ->orderByRaw('count(*) desc')
            ->get()
            ->map(function ($item) {
                return [
                    'college' => $item->college,
                    'total' => $item->total,
                    'normal' => $item->normal,
                    'anomaly' => $item->anomaly,
                    'anomaly_rate' => $item->total > 0 ? ($item->anomaly / $item->total) * 100 : 0,
                ];
            })->toArray();

        $trendData = $this->getDailyTrend();

        $processingTime = [];
        $statusProcessTimes = [
            ReviewRecord::STATUS_PROCESSING => ['label' => '业务处理', 'days' => $this->calculateAvgDaysByStatus(ReviewRecord::STATUS_PROCESSING)],
            ReviewRecord::STATUS_REVIEWING => ['label' => '复核审批', 'days' => $this->calculateAvgDaysByStatus(ReviewRecord::STATUS_REVIEWING)],
            ReviewRecord::STATUS_APPEALING => ['label' => '申诉处理', 'days' => $this->calculateAvgDaysByStatus(ReviewRecord::STATUS_APPEALING)],
            'total' => ['label' => '全流程', 'days' => $this->calculateAvgProcessDays()],
        ];
        foreach ($statusProcessTimes as $status => $data) {
            $processingTime[] = [
                'status' => $status,
                'label' => $data['label'],
                'avg_days' => $data['days'],
            ];
        }

        return [
            'total_count' => $total,
            'anomaly_count' => $hasAnomaly,
            'archived_count' => $archived,
            'pending_count' => $pending,
            'status_distribution' => $statusDistribution,
            'anomaly_distribution' => $anomalyDistribution,
            'amount_total' => [
                'apply' => round($totalApplyAmount, 2),
                'approved' => round($totalApprovedAmount, 2),
                'diff' => round($totalDiffAmount, 2),
            ],
            'scholarship_amount' => $scholarshipAmount,
            'trend_data' => $trendData,
            'college_distribution' => $collegeDistribution,
            'processing_time' => $processingTime,
            'updated_at' => now()->toDateTimeString(),
        ];
    }

    protected function detectChanges(ReviewRecord $record, array $data): array
    {
        $changes = [];
        $keyFields = ['student_id', 'apply_amount', 'apply_count', 'scholarship_type'];
        
        foreach ($keyFields as $field) {
            if (isset($data[$field]) && $data[$field] != $record->$field) {
                $changes[] = [
                    'field' => $field,
                    'field_label' => $this->getFieldLabel($field),
                    'old_value' => $record->$field,
                    'new_value' => $data[$field],
                    'changed_at' => Carbon::now()->toDateTimeString(),
                ];
            }
        }
        
        return $changes;
    }

    protected function calculateDiff(ReviewRecord $record): array
    {
        $diffs = [];
        $compareFields = [
            'apply_amount' => ['label' => '申请金额', 'approved' => 'approved_amount'],
            'apply_count' => ['label' => '申请数量', 'approved' => 'approved_count'],
            'student_id' => ['label' => '学号', 'approved' => 'student_id'],
        ];

        foreach ($compareFields as $origField => $cfg) {
            $approvedField = $cfg['approved'];
            $oldValue = $record->$origField;
            $newValue = $record->$approvedField;
            
            if ($newValue !== null && $oldValue != $newValue) {
                $diffs[] = [
                    'field' => $origField,
                    'field_label' => $cfg['label'],
                    'old_value' => $oldValue,
                    'new_value' => $newValue,
                    'has_diff' => true,
                ];
            }
        }

        return $diffs;
    }

    protected function calculateDiffDisplay(ReviewRecord $record): array
    {
        $diffs = [];
        $compareFields = [
            'student_name' => ['label' => '学生姓名', 'before' => $record->student_name, 'after' => $record->student_name],
            'student_id' => ['label' => '学号', 'before' => $record->original_data['student_id'] ?? $record->student_id, 'after' => $record->student_id],
            'apply_amount' => ['label' => '申请金额', 'before' => '¥' . number_format($record->apply_amount, 2), 'after' => '¥' . number_format($record->approved_amount ?? $record->apply_amount, 2)],
            'apply_count' => ['label' => '申请数量', 'before' => $record->apply_count, 'after' => $record->approved_count ?? $record->apply_count],
            'scholarship_type' => ['label' => '奖学金类型', 'before' => $record->original_data['scholarship_type'] ?? $record->scholarship_type, 'after' => $record->scholarship_type],
            'status' => ['label' => '状态', 'before' => $record->original_data['status'] ?? '待受理', 'after' => $record->status_label],
        ];

        foreach ($compareFields as $field => $cfg) {
            $before = $cfg['before'];
            $after = $cfg['after'];
            $changed = $before != $after;
            
            $diffs[] = [
                'field' => $field,
                'label' => $cfg['label'],
                'before' => $before,
                'after' => $after,
                'changed' => $changed,
            ];
        }

        return $diffs;
    }

    protected function getFieldLabel(string $field): string
    {
        $labels = [
            'student_id' => '学号',
            'apply_amount' => '申请金额',
            'apply_count' => '申请数量',
            'scholarship_type' => '奖学金类型',
            'approved_amount' => '核定金额',
            'approved_count' => '核定数量',
        ];
        return $labels[$field] ?? $field;
    }

    protected function calculateAvgProcessDays(): float
    {
        $records = ReviewRecord::archived()
            ->whereNotNull('received_at')
            ->whereNotNull('archived_at')
            ->get();
        
        if ($records->isEmpty()) {
            return 0;
        }

        $totalDays = $records->sum(function ($record) {
            return $record->received_at->diffInDays($record->archived_at);
        });

        return round($totalDays / $records->count(), 1);
    }

    protected function getDailyTrend(): array
    {
        $startDate = Carbon::now()->subDays(29)->startOfDay();
        
        $data = [];
        for ($i = 0; $i < 30; $i++) {
            $date = $startDate->copy()->addDays($i);
            $newCount = ReviewRecord::whereDate('created_at', $date)->count();
            $doneCount = ReviewRecord::whereDate('archived_at', $date)->count();
            $anomalyCount = ReviewRecord::whereDate('created_at', $date)
                ->whereNotNull('anomaly_type')
                ->count();
            
            $data[] = [
                'date' => $date->format('m-d'),
                'new_count' => $newCount,
                'done_count' => $doneCount,
                'anomaly_count' => $anomalyCount,
            ];
        }
        
        return $data;
    }

    protected function calculateAvgDaysByStatus(string $status): float
    {
        $records = ReviewRecord::archived()
            ->whereNotNull('received_at')
            ->whereNotNull('archived_at')
            ->get();
        
        if ($records->isEmpty()) {
            return 0;
        }

        $totalDays = 0;
        $count = 0;

        foreach ($records as $record) {
            $statusNode = $record->nodes()->where('node_type', $this->getNodeTypeByStatus($status))->first();
            $nextNode = $record->nodes()
                ->where('sequence', '>', $statusNode?->sequence ?? 0)
                ->orderBy('sequence', 'asc')
                ->first();
            
            if ($statusNode && $nextNode && $statusNode->operated_at && $nextNode->operated_at) {
                $totalDays += $statusNode->operated_at->diffInDays($nextNode->operated_at);
                $count++;
            }
        }

        return $count > 0 ? round($totalDays / $count, 1) : 0;
    }

    protected function getNodeTypeByStatus(string $status): string
    {
        $map = [
            ReviewRecord::STATUS_PROCESSING => ReviewNode::NODE_TYPE_PROCESS,
            ReviewRecord::STATUS_REVIEWING => ReviewNode::NODE_TYPE_REVIEW,
            ReviewRecord::STATUS_APPEALING => ReviewNode::NODE_TYPE_APPEAL,
        ];
        return $map[$status] ?? ReviewNode::NODE_TYPE_PROCESS;
    }

    protected function generateRecordNo(): string
    {
        $prefix = 'SRA-' . date('Ymd');
        $latest = ReviewRecord::where('record_no', 'like', $prefix . '%')
            ->orderBy('record_no', 'desc')
            ->first();
        
        $seq = $latest ? intval(substr($latest->record_no, -4)) + 1 : 1;
        return $prefix . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    protected function generateAppealNo(): string
    {
        $prefix = 'APA-' . date('Ymd');
        $latest = AppealRecord::where('appeal_no', 'like', $prefix . '%')
            ->orderBy('appeal_no', 'desc')
            ->first();
        
        $seq = $latest ? intval(substr($latest->appeal_no, -4)) + 1 : 1;
        return $prefix . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}

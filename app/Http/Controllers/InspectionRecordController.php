<?php

namespace App\Http\Controllers;

use App\Models\InspectionRecord;
use App\Models\RecordNode;
use App\Models\BusinessSupplement;
use App\Models\EvidenceAttachment;
use App\Models\AbnormalRecord;
use App\Models\DifferenceComparison;
use App\Models\User;
use App\Services\InspectionRecordService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InspectionRecordController extends Controller
{
    protected $service;

    public function __construct(InspectionRecordService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $query = InspectionRecord::with([
            'currentResponsible:id,name,role',
            'createdBy:id,name',
            'latestNode',
        ]);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('sample_type') && $request->sample_type) {
            $query->where('sample_type', $request->sample_type);
        }

        if ($request->has('danger_level') && $request->danger_level) {
            $query->where('danger_level', $request->danger_level);
        }

        if ($request->has('is_archived') && $request->is_archived !== '') {
            $query->where('is_archived', $request->is_archived === '1');
        }

        if ($request->has('has_blocking') && $request->has_blocking !== '') {
            $query->where('has_blocking', $request->has_blocking === '1');
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('record_no', 'like', "%{$search}%")
                    ->orWhere('household_name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('gas_meter_no', 'like', "%{$search}%")
                    ->orWhere('summary', 'like', "%{$search}%");
            });
        }

        if ($request->has('responsible_id') && $request->responsible_id) {
            $query->where('current_responsible_id', $request->responsible_id);
        }

        $records = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        $users = User::select('id', 'name', 'role')->get();

        $statistics = $this->service->getStatistics();

        return Inertia::render('Records/Index', [
            'records' => $records,
            'filters' => $request->all(),
            'users' => $users,
            'statistics' => $statistics,
        ]);
    }

    public function show(InspectionRecord $record)
    {
        $record->load([
            'currentResponsible:id,name,role,department,phone',
            'createdBy:id,name,role',
            'archivedBy:id,name',
            'parent:id,record_no',
            'children:id,record_no,status,created_at',
            'nodes' => function ($query) {
                $query->with('operator:id,name,role')->orderBy('node_order');
            },
            'supplements' => function ($query) {
                $query->with('operator:id,name,role')->orderBy('supplemented_at', 'desc');
            },
            'attachments' => function ($query) {
                $query->with('uploadedBy:id,name,role')->orderBy('uploaded_at', 'desc');
            },
            'abnormalRecords' => function ($query) {
                $query->with('handledBy:id,name,role')->orderBy('created_at', 'desc');
            },
            'differenceComparisons' => function ($query) {
                $query->with([
                    'operator:id,name,role',
                    'fromNode:id,node_name,operated_at',
                    'toNode:id,node_name,operated_at',
                ])->orderBy('compared_at', 'desc');
            },
        ]);

        return Inertia::render('Records/Show', [
            'record' => $record,
        ]);
    }

    public function handle(InspectionRecord $record)
    {
        if ($record->is_archived) {
            return redirect()->route('records.show', $record)
                ->with('error', '已归档记录无法处理');
        }

        $record->load([
            'currentResponsible:id,name,role',
            'createdBy:id,name',
            'nodes' => function ($query) {
                $query->with('operator:id,name,role')->orderBy('node_order');
            },
            'supplements' => function ($query) {
                $query->with('operator:id,name,role')->orderBy('supplemented_at', 'desc');
            },
            'attachments' => function ($query) {
                $query->with('uploadedBy:id,name,role')->orderBy('uploaded_at', 'desc');
            },
            'abnormalRecords' => function ($query) {
                $query->orderBy('created_at', 'desc');
            },
            'differenceComparisons' => function ($query) {
                $query->orderBy('compared_at', 'desc');
            },
        ]);

        $users = User::select('id', 'name', 'role')->get();

        return Inertia::render('Records/Handle', [
            'record' => $record,
            'users' => $users,
        ]);
    }

    public function update(Request $request, InspectionRecord $record)
    {
        if ($record->is_archived) {
            return back()->with('error', '已归档记录无法修改');
        }

        $user = auth()->user();

        $validated = $request->validate([
            'household_name' => 'sometimes|string|max:100',
            'household_phone' => 'sometimes|string|max:20',
            'address' => 'sometimes|string|max:255',
            'gas_meter_no' => 'sometimes|string|max:50',
            'inspection_time' => 'sometimes|date',
            'hidden_danger' => 'sometimes|string',
            'danger_level' => 'sometimes|in:general,major,serious',
            'involve_amount' => 'sometimes|numeric|min:0',
            'involve_quantity' => 'sometimes|integer|min:0',
            'evidence_conclusion' => 'sometimes|string',
            'handling_basis' => 'sometimes|string',
            'current_responsible_id' => 'sometimes|exists:users,id',
            'remark' => 'nullable|string',
        ]);

        $original = $record->getOriginal();
        $record->update($validated);

        $changedFields = [];
        foreach (InspectionRecordService::KEY_FIELDS as $field) {
            if (isset($validated[$field]) && $record->$field != $original[$field]) {
                $changedFields[$field] = [
                    'before' => $original[$field],
                    'after' => $record->$field,
                ];
            }
        }

        if (!empty($changedFields)) {
            $this->service->createNode(
                $record,
                RecordNode::NODE_PROCESSING,
                RecordNode::ACTION_UPDATE,
                $user,
                $changedFields,
                '更新记录信息',
                $request->remark ?? ''
            );
        }

        return back()->with('success', '记录已更新');
    }

    public function addSupplement(Request $request, InspectionRecord $record)
    {
        if ($record->is_archived) {
            return back()->with('error', '已归档记录无法补充');
        }

        $user = auth()->user();

        if (!$user->canSupplement()) {
            return back()->with('error', '您没有权限补充业务记录');
        }

        $validated = $request->validate([
            'supplement_type' => 'required|in:business_record,on_site_explain,other',
            'content' => 'required|string',
            'record_node_id' => 'nullable|exists:record_nodes,id',
        ]);

        $supplement = BusinessSupplement::create([
            'inspection_record_id' => $record->id,
            'record_node_id' => $validated['record_node_id'] ?? null,
            'supplement_type' => $validated['supplement_type'],
            'content' => $validated['content'],
            'operator_id' => $user->id,
            'supplemented_at' => now(),
        ]);

        return back()->with('success', '补充记录已添加');
    }

    public function addAttachment(Request $request, InspectionRecord $record)
    {
        if ($record->is_archived) {
            return back()->with('error', '已归档记录无法添加附件');
        }

        $user = auth()->user();

        $validated = $request->validate([
            'attachment_type' => 'required|in:photo,video,document,other',
            'file' => 'nullable|file',
            'file_name' => 'nullable|string|max:255',
            'file_path' => 'nullable|string|max:500',
            'file_size' => 'nullable|string|max:50',
            'file_mime' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'record_node_id' => 'nullable|exists:record_nodes,id',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $filePath = $file->store('attachments/' . $record->record_no, 'public');
            $fileSize = $this->formatFileSize($file->getSize());
            $fileMime = $file->getMimeType();
        } else {
            $fileName = $validated['file_name'] ?? 'attachment_' . time();
            $filePath = $validated['file_path'] ?? 'attachments/' . $record->record_no . '/simulated_' . time();
            $fileSize = $validated['file_size'] ?? '1.2 MB';
            $fileMime = $validated['file_mime'] ?? 'application/octet-stream';
        }

        EvidenceAttachment::create([
            'inspection_record_id' => $record->id,
            'record_node_id' => $validated['record_node_id'] ?? null,
            'attachment_type' => $validated['attachment_type'],
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'file_mime' => $fileMime,
            'description' => $validated['description'] ?? '',
            'uploaded_by' => $user->id,
            'uploaded_at' => now(),
        ]);

        return back()->with('success', '附件已上传');
    }

    public function submitReview(Request $request, InspectionRecord $record)
    {
        if ($record->is_archived) {
            return back()->with('error', '已归档记录无法提交');
        }

        $user = auth()->user();

        try {
            $record = $this->service->processTransition(
                $record,
                InspectionRecord::STATUS_REVIEWING,
                $user,
                $request->remark ?? ''
            );

            return back()->with('success', '已提交复核');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function approve(Request $request, InspectionRecord $record)
    {
        if ($record->is_archived) {
            return back()->with('error', '已归档记录无法审批');
        }

        $user = auth()->user();

        if (!$user->canApprove()) {
            return back()->with('error', '您没有审批权限');
        }

        if ($request->action === 'archive') {
            try {
                $record = $this->service->archiveRecord($record, $user, $request->remark ?? '');
                return back()->with('success', '记录已归档');
            } catch (\Exception $e) {
                return back()->with('error', $e->getMessage());
            }
        } elseif ($request->action === 'return') {
            try {
                $record = $this->service->processTransition(
                    $record,
                    InspectionRecord::STATUS_RETURNED,
                    $user,
                    $request->remark ?? ''
                );
                return back()->with('success', '已退回补证');
            } catch (\Exception $e) {
                return back()->with('error', $e->getMessage());
            }
        } elseif ($request->action === 'approve') {
            try {
                $record = $this->service->processTransition(
                    $record,
                    InspectionRecord::STATUS_APPROVED,
                    $user,
                    $request->remark ?? ''
                );
                return back()->with('success', '审批通过');
            } catch (\Exception $e) {
                return back()->with('error', $e->getMessage());
            }
        }

        return back()->with('error', '无效的操作');
    }

    public function resolveAbnormal(Request $request, InspectionRecord $record, AbnormalRecord $abnormal)
    {
        if ($record->is_archived) {
            return back()->with('error', '已归档记录无法处理');
        }

        $user = auth()->user();

        if (!$user->canApprove()) {
            return back()->with('error', '您没有权限处理异常');
        }

        $validated = $request->validate([
            'resolution_status' => 'required|in:resolved,rejected',
            'resolution_remark' => 'required|string',
        ]);

        $abnormal->update([
            'resolution_status' => $validated['resolution_status'],
            'resolution_remark' => $validated['resolution_remark'],
            'handled_by' => $user->id,
            'handled_at' => now(),
        ]);

        $pendingCount = $record->abnormalRecords()
            ->where('resolution_status', AbnormalRecord::STATUS_PENDING)
            ->count();

        if ($pendingCount === 0) {
            $record->has_blocking = false;
            $record->blocking_reason = null;
            $record->status = InspectionRecord::STATUS_PROCESSING;
            $this->service->updateSummaryAndConclusion($record);
            $record->save();

            $this->service->createNode(
                $record,
                RecordNode::NODE_PROCESSING,
                RecordNode::ACTION_UPDATE,
                $user,
                [],
                '异常已解决，阻断解除',
                $validated['resolution_remark']
            );
        }

        return back()->with('success', '异常已处理');
    }

    public function reopen(Request $request, InspectionRecord $record)
    {
        if (!$record->is_archived) {
            return back()->with('error', '只有已归档记录才能重新处理');
        }

        $user = auth()->user();

        if (!$user->canApprove()) {
            return back()->with('error', '您没有权限重新处理');
        }

        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        try {
            $newRecord = $this->service->reopenRecord($record, $user, $validated['reason']);
            return redirect()->route('records.handle', $newRecord)
                ->with('success', '已创建新的处理记录');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    protected function formatFileSize($bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, 1) . ' ' . $units[$pow];
    }
}

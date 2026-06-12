<?php

namespace App\Http\Controllers;

use App\Enums\CaseStatus;
use App\Enums\CaseType;
use App\Enums\NodeType;
use App\Enums\UserRole;
use App\Models\CaseNode;
use App\Models\Tool;
use App\Models\ToolCase;
use App\Models\ResponsiblePerson;
use App\Models\Evidence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ToolCaseController extends Controller
{
    public function index(Request $request)
    {
        $query = ToolCase::with(['tools', 'responsiblePersons', 'nodes']);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('case_number', 'like', "%{$request->search}%")
                    ->orWhere('title', 'like', "%{$request->search}%")
                    ->orWhere('current_responsible', 'like', "%{$request->search}%");
            });
        }

        $cases = $query->orderBy('created_at', 'desc')->paginate(15);

        $stats = [
            'total' => ToolCase::count(),
            'pending' => ToolCase::where('status', CaseStatus::Pending)->count(),
            'processing' => ToolCase::whereIn('status', [CaseStatus::Processing, CaseStatus::Reviewing])->count(),
            'blocked' => ToolCase::whereIn('status', [CaseStatus::Blocked, CaseStatus::Returned, CaseStatus::Appealing])->count(),
            'archived' => ToolCase::where('status', CaseStatus::Archived)->count(),
            'byType' => [
                'normal' => ToolCase::where('type', CaseType::Normal)->count(),
                'code_conflict' => ToolCase::where('type', CaseType::CodeConflict)->count(),
                'quantity_diff' => ToolCase::where('type', CaseType::QuantityDiff)->count(),
                'appeal' => ToolCase::where('type', CaseType::Appeal)->count(),
            ],
        ];

        return Inertia::render('Cases/Index', [
            'cases' => $cases,
            'filters' => $request->only(['status', 'type', 'search']),
            'stats' => $stats,
            'statusOptions' => collect(CaseStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
            'typeOptions' => collect(CaseType::cases())->map(fn ($t) => ['value' => $t->value, 'label' => $t->label()]),
        ]);
    }

    public function show(ToolCase $toolCase)
    {
        $toolCase->load(['tools', 'responsiblePersons', 'nodes', 'evidences', 'reporter', 'handler', 'reviewer']);

        return Inertia::render('Cases/Show', [
            'case' => $toolCase,
            'canEdit' => Auth::user() && $toolCase->canEdit(),
            'isApprover' => Auth::user()?->isApprover(),
            'isClerk' => Auth::user()?->isClerk(),
        ]);
    }

    public function dashboard()
    {
        $cases = ToolCase::all();

        $stats = [
            'total' => $cases->count(),
            'pending' => ToolCase::where('status', CaseStatus::Pending)->count(),
            'processing' => ToolCase::whereIn('status', [CaseStatus::Processing, CaseStatus::Reviewing])->count(),
            'blocked' => ToolCase::whereIn('status', [CaseStatus::Blocked, CaseStatus::Returned, CaseStatus::Appealing])->count(),
            'archived' => ToolCase::where('status', CaseStatus::Archived)->count(),
            'byType' => [
                ['name' => CaseType::Normal->label(), 'value' => ToolCase::where('type', CaseType::Normal)->count(), 'type' => CaseType::Normal->value],
                ['name' => CaseType::CodeConflict->label(), 'value' => ToolCase::where('type', CaseType::CodeConflict)->count(), 'type' => CaseType::CodeConflict->value],
                ['name' => CaseType::QuantityDiff->label(), 'value' => ToolCase::where('type', CaseType::QuantityDiff)->count(), 'type' => CaseType::QuantityDiff->value],
                ['name' => CaseType::Appeal->label(), 'value' => ToolCase::where('type', CaseType::Appeal)->count(), 'type' => CaseType::Appeal->value],
            ],
            'byStatus' => [
                ['name' => CaseStatus::Pending->label(), 'value' => ToolCase::where('status', CaseStatus::Pending)->count(), 'status' => CaseStatus::Pending->value],
                ['name' => CaseStatus::Processing->label(), 'value' => ToolCase::where('status', CaseStatus::Processing)->count(), 'status' => CaseStatus::Processing->value],
                ['name' => CaseStatus::Reviewing->label(), 'value' => ToolCase::where('status', CaseStatus::Reviewing)->count(), 'status' => CaseStatus::Reviewing->value],
                ['name' => CaseStatus::Returned->label(), 'value' => ToolCase::where('status', CaseStatus::Returned)->count(), 'status' => CaseStatus::Returned->value],
                ['name' => CaseStatus::Blocked->label(), 'value' => ToolCase::where('status', CaseStatus::Blocked)->count(), 'status' => CaseStatus::Blocked->value],
                ['name' => CaseStatus::Appealing->label(), 'value' => ToolCase::where('status', CaseStatus::Appealing)->count(), 'status' => CaseStatus::Appealing->value],
                ['name' => CaseStatus::Archived->label(), 'value' => ToolCase::where('status', CaseStatus::Archived)->count(), 'status' => CaseStatus::Archived->value],
            ],
            'totalAmountExpected' => Tool::sum('expected_amount'),
            'totalAmountActual' => Tool::sum('actual_amount'),
            'amountDiff' => Tool::sum('actual_amount') - Tool::sum('expected_amount'),
            'totalToolsExpected' => Tool::sum('expected_quantity'),
            'totalToolsActual' => Tool::sum('actual_quantity'),
            'toolsDiff' => Tool::sum('actual_quantity') - Tool::sum('expected_quantity'),
        ];

        $recentCases = ToolCase::with(['tools', 'responsiblePersons'])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentCases' => $recentCases,
        ]);
    }

    public function review(ToolCase $toolCase)
    {
        if (!Auth::user()?->isClerk()) {
            abort(403, '只有业务专员可以处理案件');
        }
        if ($toolCase->is_archived) {
            abort(403, '已归档案件不能修改');
        }

        $toolCase->load(['tools', 'responsiblePersons', 'nodes', 'evidences']);

        return Inertia::render('Cases/Review', [
            'case' => $toolCase,
        ]);
    }

    public function updateClerk(Request $request, ToolCase $toolCase)
    {
        if (!Auth::user()?->isClerk()) {
            abort(403, '只有业务专员可以处理案件');
        }
        if ($toolCase->is_archived) {
            abort(403, '已归档案件不能修改');
        }

        $validated = $request->validate([
            'business_record' => 'nullable|string',
            'scene_description' => 'nullable|string',
            'conclusion' => 'nullable|string',
            'basis' => 'nullable|string',
            'blocking_reason' => 'nullable|string',
            'remedy_path' => 'nullable|string',
            'diff_fields' => 'nullable|array',
            'current_responsible' => 'nullable|string',
            'incident_at' => 'nullable|date',
            'tools' => 'nullable|array',
            'tools.*.id' => 'required|integer',
            'tools.*.actual_quantity' => 'nullable|integer',
            'tools.*.actual_amount' => 'nullable|numeric',
            'tools.*.remark' => 'nullable|string',
        ]);

        $toolsData = $validated['tools'] ?? [];
        unset($validated['tools']);

        $original = $toolCase->only(array_keys($validated));
        $toolCase->update($validated);

        $toolChanges = [];
        foreach ($toolsData as $toolInput) {
            $tool = Tool::where('id', $toolInput['id'])->where('case_id', $toolCase->id)->first();
            if (!$tool) continue;

            $before = [
                'actual_quantity' => $tool->actual_quantity,
                'actual_amount' => (float) $tool->actual_amount,
            ];

            $updateData = [];
            if (array_key_exists('actual_quantity', $toolInput)) {
                $updateData['actual_quantity'] = $toolInput['actual_quantity'];
            }
            if (array_key_exists('actual_amount', $toolInput)) {
                $updateData['actual_amount'] = $toolInput['actual_amount'];
            }
            if (array_key_exists('remark', $toolInput)) {
                $updateData['remark'] = $toolInput['remark'];
            }

            if (!empty($updateData)) {
                $tool->update($updateData);
                $after = [
                    'actual_quantity' => $tool->fresh()->actual_quantity,
                    'actual_amount' => (float) $tool->fresh()->actual_amount,
                ];
                if ($before !== $after) {
                    $toolChanges[$tool->tool_code] = ['before' => $before, 'after' => $after];
                }
            }
        }

        $caseChanges = array_diff_assoc($validated, $original);
        $allChanges = array_merge($caseChanges, empty($toolChanges) ? [] : ['tools' => $toolChanges]);

        if (!empty($allChanges)) {
            $this->addNode($toolCase, NodeType::Update, $toolCase->status, '业务专员更新案件信息' . (empty($toolChanges) ? '' : '（含工具数量/金额调整）'), Auth::user(), $allChanges);
        }

        $this->recalcDiffFields($toolCase);

        if ($request->has('submit_for_review') && $request->submit_for_review) {
            $toolCase->status = CaseStatus::Processing;
            $toolCase->handled_by = Auth::id();
            $toolCase->handled_at = now();
            $toolCase->save();
            $this->addNode($toolCase, NodeType::Process, CaseStatus::Reviewing, '业务专员提交处理，进入复核阶段', Auth::user());
        }

        return redirect()->route('cases.show', $toolCase)->with('success', '案件已更新');
    }

    private function recalcDiffFields(ToolCase $case): void
    {
        $case->load('tools');
        $totalExpectedQty = $case->tools->sum('expected_quantity');
        $totalActualQty = $case->tools->sum('actual_quantity');
        $totalExpectedAmt = $case->tools->sum(fn ($t) => (float) $t->expected_amount);
        $totalActualAmt = $case->tools->sum(fn ($t) => (float) $t->actual_amount);

        $diffFields = [];
        if ($totalExpectedQty !== $totalActualQty) {
            $diffFields[] = [
                'field' => 'quantity',
                'label' => '工具数量',
                'expected' => $totalExpectedQty,
                'actual' => $totalActualQty,
                'diff' => $totalActualQty - $totalExpectedQty,
            ];
        }
        if (abs($totalExpectedAmt - $totalActualAmt) > 0.01) {
            $diffFields[] = [
                'field' => 'amount',
                'label' => '工具金额',
                'expected' => round($totalExpectedAmt, 2),
                'actual' => round($totalActualAmt, 2),
                'diff' => round($totalActualAmt - $totalExpectedAmt, 2),
            ];
        }

        $hasToolDiff = $case->tools->contains(fn ($t) =>
            $t->expected_quantity !== $t->actual_quantity ||
            abs((float) $t->expected_amount - (float) $t->actual_amount) > 0.01
        );

        if ($hasToolDiff && empty($diffFields)) {
            $diffFields[] = [
                'field' => 'tool_status',
                'label' => '工具状态',
                'expected' => '全部完好',
                'actual' => '存在差异工具',
            ];
        }

        if (!empty($diffFields) && $case->type !== CaseType::Normal) {
            $case->diff_fields = $diffFields;
            if (empty($case->blocking_reason)) {
                $case->blocking_reason = '工具数量或金额与台账不符，需核实后提交。';
            }
            if (empty($case->remedy_path)) {
                $case->remedy_path = '1. 核实工具清单实际数量与金额；2. 补充差异说明和证据；3. 确认后重新提交复核。';
            }
        } elseif (empty($diffFields) && $case->type === CaseType::Normal) {
            $case->diff_fields = null;
            $case->blocking_reason = null;
            $case->remedy_path = null;
        } else {
            $case->diff_fields = empty($diffFields) ? null : $diffFields;
        }

        $case->save();
    }

    public function approve(Request $request, ToolCase $toolCase)
    {
        if (!Auth::user()?->isApprover()) {
            abort(403, '只有审批负责人可以审批案件');
        }
        if ($toolCase->is_archived) {
            abort(403, '已归档案件不能审批');
        }

        $action = $request->action;

        if ($action === 'approve') {
            $toolCase->status = CaseStatus::Archived;
            $toolCase->reviewed_by = Auth::id();
            $toolCase->reviewed_at = now();
            $toolCase->archived_at = now();
            $toolCase->is_archived = true;
            $toolCase->save();
            $this->addNode($toolCase, NodeType::Review, CaseStatus::Archived, '审批负责人复核通过，案件归档', Auth::user());
            $this->addNode($toolCase, NodeType::Archive, CaseStatus::Archived, '系统自动归档，记录已封存', Auth::user());
        } elseif ($action === 'return') {
            $toolCase->status = CaseStatus::Returned;
            $toolCase->reviewed_by = Auth::id();
            $toolCase->reviewed_at = now();
            $toolCase->save();
            $content = '审批负责人退回补证';
            if ($request->return_reason) {
                $content .= '：' . $request->return_reason;
                if (empty($toolCase->remedy_path)) {
                    $toolCase->remedy_path = $request->return_reason;
                }
                $toolCase->save();
            }
            $this->addNode($toolCase, NodeType::Return, CaseStatus::Returned, $content, Auth::user());
        }

        return redirect()->route('cases.show', $toolCase)->with('success', '审批操作已完成');
    }

    public function reopen(ToolCase $toolCase)
    {
        if (!Auth::user()?->isApprover()) {
            abort(403, '只有审批负责人可以重新处理案件');
        }

        $toolCase->is_archived = false;
        $toolCase->status = CaseStatus::Processing;
        $toolCase->archived_at = null;
        $toolCase->save();

        $this->addNode($toolCase, NodeType::Reopen, CaseStatus::Processing, '审批负责人启动重新处理流程，生成新的处理节点', Auth::user());

        return redirect()->route('cases.show', $toolCase)->with('success', '案件已重新打开处理');
    }

    public function uploadEvidence(Request $request, ToolCase $toolCase)
    {
        if (!Auth::user()?->isClerk()) {
            abort(403, '只有业务专员可以补充证据');
        }
        if ($toolCase->is_archived) {
            abort(403, '已归档案件不能补充证据');
        }

        $validated = $request->validate([
            'description' => 'nullable|string|max:500',
            'file' => 'required|file|max:20480',
        ]);

        $file = $request->file('file');
        $path = $file->store('evidences/' . $toolCase->case_number, 'public');

        Evidence::create([
            'case_id' => $toolCase->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'description' => $validated['description'] ?? null,
            'uploaded_by' => Auth::id(),
        ]);

        $this->addNode($toolCase, NodeType::Update, $toolCase->status, '业务专员补充证据：' . $file->getClientOriginalName(), Auth::user());

        return redirect()->route('cases.show', $toolCase)->with('success', '证据已上传');
    }

    private function addNode(ToolCase $case, NodeType $type, CaseStatus $status, string $content, $operator, $changes = null): void
    {
        CaseNode::create([
            'case_id' => $case->id,
            'node_type' => $type->value,
            'status' => $status->value,
            'content' => $content,
            'snapshot' => [
                'status' => $status->value,
                'title' => $case->title,
                'type' => $case->type->value,
                'current_responsible' => $case->current_responsible,
                'conclusion' => $case->conclusion,
            ],
            'changes' => $changes,
            'operator_id' => $operator->id,
            'operator_name' => $operator->name,
            'operator_role' => $operator->role->value,
        ]);
    }
}

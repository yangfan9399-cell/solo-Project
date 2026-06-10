<?php

namespace App\Http\Controllers;

use App\Models\InspectionIssue;
use App\Models\IssueHistory;
use App\Models\ProblemType;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IssueController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = InspectionIssue::with(['store', 'problemType', 'reporter', 'rectifier', 'reviewer', 'closer']);

        if ($user->is_store_manager) {
            $storeIds = $user->managedStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        } elseif ($user->is_region_manager) {
            $storeIds = $user->regionStores()->pluck('id');
            $query->whereIn('store_id', $storeIds);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        if ($request->has('problem_type_id')) {
            $query->where('problem_type_id', $request->problem_type_id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function show($id)
    {
        $issue = InspectionIssue::with([
            'store', 'problemType', 'reporter', 'rectifier', 'reviewer', 'closer', 'histories.operator'
        ])->findOrFail($id);
        return response()->json($issue);
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'problem_type_id' => 'required|exists:problem_types,id',
            'description' => 'required|string',
            'deadline' => 'required|date|after:now',
        ]);

        $issue = InspectionIssue::create([
            'store_id' => $request->store_id,
            'problem_type_id' => $request->problem_type_id,
            'description' => $request->description,
            'status' => 'pending',
            'reporter_id' => Auth::id(),
            'deadline' => $request->deadline,
        ]);

        IssueHistory::create([
            'issue_id' => $issue->id,
            'action' => 'report',
            'operator_id' => Auth::id(),
            'note' => '问题已上报',
        ]);

        return response()->json($issue, 201);
    }

    public function assign(Request $request, $id)
    {
        $request->validate([
            'rectifier_id' => 'required|exists:users,id',
        ]);

        $issue = InspectionIssue::findOrFail($id);
        $issue->update([
            'status' => 'rectifying',
            'rectifier_id' => $request->rectifier_id,
        ]);

        IssueHistory::create([
            'issue_id' => $issue->id,
            'action' => 'assign',
            'operator_id' => Auth::id(),
            'note' => '已分配整改人: ' . $issue->rectifier->name,
        ]);

        return response()->json($issue);
    }

    public function rectify(Request $request, $id)
    {
        $request->validate([
            'rectify_note' => 'required|string',
        ]);

        $issue = InspectionIssue::findOrFail($id);
        
        if (!$issue->hasPhotos()) {
            return response()->json(['error' => '请先上传整改照片'], 400);
        }

        $issue->update([
            'status' => 'reviewing',
            'rectify_note' => $request->rectify_note,
        ]);

        IssueHistory::create([
            'issue_id' => $issue->id,
            'action' => 'rectify',
            'operator_id' => Auth::id(),
            'note' => '整改已提交',
        ]);

        return response()->json($issue);
    }

    public function uploadPhotos(Request $request, $id)
    {
        $request->validate([
            'photos' => 'required|array',
            'photos.*' => 'string',
        ]);

        $issue = InspectionIssue::findOrFail($id);
        $existingPhotos = $issue->photos ?? [];
        $newPhotos = array_merge($existingPhotos, $request->photos);
        
        $issue->update([
            'photos' => $newPhotos,
        ]);

        return response()->json($issue);
    }

    public function review(Request $request, $id)
    {
        $request->validate([
            'review_note' => 'required|string',
            'approved' => 'required|boolean',
        ]);

        $issue = InspectionIssue::findOrFail($id);
        
        if ($request->approved) {
            $issue->update([
                'status' => 'reviewed',
                'reviewer_id' => Auth::id(),
                'review_note' => $request->review_note,
            ]);
            
            IssueHistory::create([
                'issue_id' => $issue->id,
                'action' => 'review',
                'operator_id' => Auth::id(),
                'note' => '复查通过: ' . $request->review_note,
            ]);
        } else {
            $issue->update([
                'status' => 'rejected',
                'reviewer_id' => Auth::id(),
                'review_note' => $request->review_note,
            ]);
            
            IssueHistory::create([
                'issue_id' => $issue->id,
                'action' => 'reject',
                'operator_id' => Auth::id(),
                'note' => '复查不通过: ' . $request->review_note,
            ]);
        }

        return response()->json($issue);
    }

    public function close(Request $request, $id)
    {
        $request->validate([
            'close_note' => 'required|string',
        ]);

        $issue = InspectionIssue::findOrFail($id);
        $issue->update([
            'status' => 'closed',
            'closer_id' => Auth::id(),
            'close_note' => $request->close_note,
        ]);

        IssueHistory::create([
            'issue_id' => $issue->id,
            'action' => 'close',
            'operator_id' => Auth::id(),
            'note' => '已闭环: ' . $request->close_note,
        ]);

        return response()->json($issue);
    }

    public function reopen($id)
    {
        $issue = InspectionIssue::findOrFail($id);
        $issue->update([
            'status' => 'pending',
            'rectifier_id' => null,
            'reviewer_id' => null,
            'closer_id' => null,
            'rectify_note' => null,
            'review_note' => null,
            'close_note' => null,
        ]);

        IssueHistory::create([
            'issue_id' => $issue->id,
            'action' => 'reopen',
            'operator_id' => Auth::id(),
            'note' => '问题已重新打开',
        ]);

        return response()->json($issue);
    }

    public function destroy($id)
    {
        $issue = InspectionIssue::findOrFail($id);
        $issue->delete();
        return response()->json(null, 204);
    }
}
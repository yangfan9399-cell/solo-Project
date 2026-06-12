<?php

namespace App\Http\Controllers;

use App\Models\Allocation;
use App\Models\AllocationDifference;
use App\Models\AllocationNode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function confirm(Request $request, Allocation $allocation)
    {
        $user = Auth::user();

        if (!$user->isApprovalManager()) {
            abort(403, '仅审批负责人可确认结论');
        }

        if ($allocation->status !== 'reviewing') {
            return back()->withErrors(['status' => '当前状态不可确认']);
        }

        $validated = $request->validate([
            'conclusion' => 'required|string',
        ]);

        DB::transaction(function () use ($allocation, $user, $validated) {
            $lastProcessedNode = $allocation->nodes()
                ->where('node_type', 'processed')
                ->latest()
                ->first();

            if ($lastProcessedNode && $lastProcessedNode->after_data) {
                $afterData = $lastProcessedNode->after_data;
                if (isset($afterData['quantity'])) {
                    $allocation->quantity = $afterData['quantity'];
                }
                if (isset($afterData['amount'])) {
                    $allocation->amount = $afterData['amount'];
                }
            }

            $allocation->conclusion = $validated['conclusion'];
            $allocation->status = 'archived';
            $allocation->save();

            AllocationNode::create([
                'allocation_id' => $allocation->id,
                'node_type' => 'reviewed',
                'handler_id' => $user->id,
                'handler_role' => $user->role,
                'description' => '审批负责人确认结论：' . $validated['conclusion'],
            ]);

            AllocationNode::create([
                'allocation_id' => $allocation->id,
                'node_type' => 'archived',
                'handler_id' => $user->id,
                'handler_role' => $user->role,
                'description' => '记录已归档',
            ]);
        });

        return back()->with('success', '结论已确认，记录已归档');
    }

    public function returnForSupplement(Request $request, Allocation $allocation)
    {
        $user = Auth::user();

        if (!$user->isApprovalManager()) {
            abort(403, '仅审批负责人可退回');
        }

        if (!in_array($allocation->status, ['reviewing', 'blocked'])) {
            return back()->withErrors(['status' => '当前状态不可退回']);
        }

        $validated = $request->validate([
            'reason' => 'required|string',
            'remediation_path' => 'nullable|string',
        ]);

        DB::transaction(function () use ($allocation, $user, $validated) {
            $allocation->update([
                'status' => 'processing',
                'blocking_reason' => $validated['reason'],
                'remediation_path' => $validated['remediation_path'] ?? null,
                'current_handler_id' => $allocation->nodes()
                    ->where('node_type', 'accepted')
                    ->latest()
                    ->value('handler_id'),
            ]);

            AllocationNode::create([
                'allocation_id' => $allocation->id,
                'node_type' => 'returned',
                'handler_id' => $user->id,
                'handler_role' => $user->role,
                'description' => '退回补证：' . $validated['reason'],
            ]);
        });

        return back()->with('success', '已退回业务专员补充');
    }

    public function archiveReadOnly(Allocation $allocation)
    {
        $user = Auth::user();

        if (!$user->isApprovalManager()) {
            abort(403, '仅审批负责人可归档');
        }

        if ($allocation->status !== 'reviewing') {
            return back()->withErrors(['status' => '当前状态不可归档']);
        }

        DB::transaction(function () use ($allocation, $user) {
            $allocation->update(['status' => 'archived']);

            AllocationNode::create([
                'allocation_id' => $allocation->id,
                'node_type' => 'archived',
                'handler_id' => $user->id,
                'handler_role' => $user->role,
                'description' => '审批负责人确认无需修改，直接归档',
            ]);
        });

        return back()->with('success', '已归档');
    }
}

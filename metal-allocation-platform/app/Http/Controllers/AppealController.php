<?php

namespace App\Http\Controllers;

use App\Models\Allocation;
use App\Models\AllocationNode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AppealController extends Controller
{
    public function submit(Request $request, Allocation $allocation)
    {
        $user = Auth::user();

        if (!$user->isBusinessSpecialist()) {
            abort(403, '仅业务专员可提交申诉');
        }

        if ($allocation->status !== 'reviewing') {
            return back()->withErrors(['status' => '当前状态不可申诉']);
        }

        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        DB::transaction(function () use ($allocation, $user, $validated) {
            $allocation->update([
                'status' => 'appealed',
                'blocking_reason' => $validated['reason'],
            ]);

            AllocationNode::create([
                'allocation_id' => $allocation->id,
                'node_type' => 'appealed',
                'handler_id' => $user->id,
                'handler_role' => $user->role,
                'description' => '提交申诉：' . $validated['reason'],
            ]);
        });

        return back()->with('success', '申诉已提交');
    }

    public function handle(Request $request, Allocation $allocation)
    {
        $user = Auth::user();

        if (!$user->isApprovalManager()) {
            abort(403, '仅审批负责人可处理申诉');
        }

        if ($allocation->status !== 'appealed') {
            return back()->withErrors(['status' => '当前状态不可处理申诉']);
        }

        $validated = $request->validate([
            'action' => 'required|in:resolved,rejected',
            'description' => 'nullable|string',
        ]);

        DB::transaction(function () use ($allocation, $user, $validated) {
            if ($validated['action'] === 'resolved') {
                $allocation->update([
                    'status' => 'reviewing',
                    'blocking_reason' => null,
                ]);

                AllocationNode::create([
                    'allocation_id' => $allocation->id,
                    'node_type' => 'reviewing',
                    'handler_id' => $user->id,
                    'handler_role' => $user->role,
                    'description' => '申诉通过，退回复核' . ($validated['description'] ? '：' . $validated['description'] : ''),
                ]);
            } else {
                $allocation->update(['status' => 'archived']);

                AllocationNode::create([
                    'allocation_id' => $allocation->id,
                    'node_type' => 'reviewed',
                    'handler_id' => $user->id,
                    'handler_role' => $user->role,
                    'description' => '申诉驳回，维持原结论' . ($validated['description'] ? '：' . $validated['description'] : ''),
                ]);

                AllocationNode::create([
                    'allocation_id' => $allocation->id,
                    'node_type' => 'archived',
                    'handler_id' => $user->id,
                    'handler_role' => $user->role,
                    'description' => '记录已归档',
                ]);
            }
        });

        $message = $validated['action'] === 'resolved' ? '申诉已通过，退回复核' : '申诉已驳回，记录归档';
        return back()->with('success', $message);
    }
}

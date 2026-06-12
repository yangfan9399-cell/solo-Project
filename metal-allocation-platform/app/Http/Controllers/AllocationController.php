<?php

namespace App\Http\Controllers;

use App\Models\Allocation;
use App\Models\AllocationAttachment;
use App\Models\AllocationDifference;
use App\Models\AllocationNode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AllocationController extends Controller
{
    public function index(Request $request)
    {
        $query = Allocation::with('currentHandler');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('metal_type')) {
            $query->where('metal_type', $request->metal_type);
        }

        if ($request->filled('search')) {
            $query->where('allocation_no', 'like', '%' . $request->search . '%');
        }

        $allocations = $query->latest()->paginate(15)->through(function ($allocation) {
            $allocation->nodes_count = $allocation->nodes()->count();
            $allocation->differences_count = $allocation->differences()->count();
            $allocation->attachments_count = $allocation->attachments()->count();
            return $allocation;
        });

        return Inertia::render('Allocation/Index', [
            'allocations' => $allocations,
            'filters' => $request->only(['status', 'metal_type', 'search']),
            'metalTypes' => ['gold', 'silver', 'platinum', 'palladium'],
        ]);
    }

    public function show(Allocation $allocation)
    {
        $allocation->load([
            'currentHandler',
            'nodes.handler',
            'nodes.differences',
            'nodes.attachments.uploader',
            'differences',
            'attachments.uploader',
        ]);

        return Inertia::render('Allocation/Show', [
            'allocation' => $allocation,
        ]);
    }

    public function process(Allocation $allocation)
    {
        if ($allocation->status === 'archived') {
            return redirect()->route('allocations.show', $allocation);
        }

        $allocation->load([
            'currentHandler',
            'nodes.handler',
            'nodes.differences',
            'nodes.attachments.uploader',
            'differences',
            'attachments.uploader',
        ]);

        return Inertia::render('Allocation/Process', [
            'allocation' => $allocation,
        ]);
    }

    public function accept(Allocation $allocation)
    {
        $user = Auth::user();

        if (!$user->isBusinessSpecialist()) {
            abort(403, '仅业务专员可受理');
        }

        if ($allocation->status !== 'pending') {
            return back()->withErrors(['status' => '当前状态不可受理']);
        }

        DB::transaction(function () use ($allocation, $user) {
            $allocation->update([
                'status' => 'processing',
                'current_handler_id' => $user->id,
            ]);

            AllocationNode::create([
                'allocation_id' => $allocation->id,
                'node_type' => 'accepted',
                'handler_id' => $user->id,
                'handler_role' => $user->role,
                'description' => '业务专员受理',
            ]);
        });

        return back()->with('success', '受理成功');
    }

    public function completeProcess(Request $request, Allocation $allocation)
    {
        $user = Auth::user();

        if (!$user->isBusinessSpecialist()) {
            abort(403, '仅业务专员可处理');
        }

        if ($allocation->status !== 'processing') {
            return back()->withErrors(['status' => '当前状态不可处理']);
        }

        $validated = $request->validate([
            'description' => 'required|string',
            'basis' => 'nullable|string',
            'quantity' => 'nullable|numeric',
            'amount' => 'nullable|numeric',
        ]);

        DB::transaction(function () use ($allocation, $user, $validated) {
            $beforeData = [
                'quantity' => (string) $allocation->quantity,
                'amount' => (string) $allocation->amount,
            ];

            $afterData = $beforeData;
            $hasDifference = false;

            if (isset($validated['quantity']) && bccomp($validated['quantity'], $allocation->quantity, 4) !== 0) {
                $afterData['quantity'] = (string) $validated['quantity'];
                $allocation->quantity = $validated['quantity'];
                $hasDifference = true;
            }

            if (isset($validated['amount']) && bccomp($validated['amount'], $allocation->amount, 2) !== 0) {
                $afterData['amount'] = (string) $validated['amount'];
                $allocation->amount = $validated['amount'];
                $hasDifference = true;
            }

            $allocation->status = 'reviewing';
            $allocation->save();

            $node = AllocationNode::create([
                'allocation_id' => $allocation->id,
                'node_type' => 'processed',
                'handler_id' => $user->id,
                'handler_role' => $user->role,
                'description' => $validated['description'],
                'before_data' => $beforeData,
                'after_data' => $afterData,
                'basis' => $validated['basis'] ?? null,
            ]);

            if ($hasDifference) {
                foreach ($beforeData as $field => $expected) {
                    if ($expected !== $afterData[$field]) {
                        AllocationDifference::create([
                            'allocation_id' => $allocation->id,
                            'node_id' => $node->id,
                            'field_name' => $field,
                            'expected_value' => $expected,
                            'actual_value' => $afterData[$field],
                        ]);
                    }
                }
            }

            AllocationNode::create([
                'allocation_id' => $allocation->id,
                'node_type' => 'reviewing',
                'handler_id' => $user->id,
                'handler_role' => $user->role,
                'description' => '提交复核',
            ]);
        });

        return back()->with('success', '处理完成，已提交复核');
    }

    public function uploadAttachment(Request $request, Allocation $allocation)
    {
        if ($allocation->status === 'archived') {
            return back()->withErrors(['status' => '已归档记录不可操作']);
        }

        $validated = $request->validate([
            'file' => 'required|file|max:10240',
            'description' => 'nullable|string',
            'node_id' => 'nullable|exists:allocation_nodes,id',
        ]);

        $file = $validated['file'];
        $path = $file->store('attachments', 'public');

        AllocationAttachment::create([
            'allocation_id' => $allocation->id,
            'node_id' => $validated['node_id'] ?? null,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getClientMimeType(),
            'uploaded_by' => Auth::id(),
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', '附件上传成功');
    }

    public function addNote(Request $request, Allocation $allocation)
    {
        $user = Auth::user();

        if (!$user->isBusinessSpecialist()) {
            abort(403, '仅业务专员可补充说明');
        }

        if ($allocation->status === 'archived') {
            return back()->withErrors(['status' => '已归档记录不可操作']);
        }

        $validated = $request->validate([
            'description' => 'required|string',
        ]);

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'processed',
            'handler_id' => $user->id,
            'handler_role' => $user->role,
            'description' => $validated['description'],
        ]);

        return back()->with('success', '说明已补充');
    }
}

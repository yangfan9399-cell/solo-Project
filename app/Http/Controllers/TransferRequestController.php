<?php

namespace App\Http\Controllers;

use App\Models\TransferRequest;
use App\Models\WasteBatch;
use App\Models\Carrier;
use App\Models\ProcessHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class TransferRequestController extends Controller
{
    public function index(): Response
    {
        $requests = TransferRequest::with([
            'wasteBatch.wasteCategory',
            'carrier',
            'createdBy',
            'manifestForm',
        ])
            ->latest()
            ->paginate(10);

        return Inertia::render('TransferRequests/Index', [
            'requests' => $requests,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('TransferRequests/Create', [
            'batches' => WasteBatch::where('status', 'stored')
                ->with('wasteCategory')
                ->get(),
            'carriers' => Carrier::where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'waste_batch_id' => 'required|exists:waste_batches,id',
            'carrier_id' => 'required|exists:carriers,id',
            'planned_transfer_date' => 'required|date',
            'destination' => 'required|string',
            'receiver_unit' => 'required|string',
        ]);

        $wasteBatch = WasteBatch::findOrFail($validated['waste_batch_id']);
        $isOverLimit = $wasteBatch->isWeightOverLimit();

        $requestNumber = 'TR' . date('Ymd') . str_pad(TransferRequest::count() + 1, 4, '0', STR_PAD_LEFT);

        $transferRequest = TransferRequest::create([
            'request_number' => $requestNumber,
            ...$validated,
            'status' => 'pending',
            'is_weight_over_limit' => $isOverLimit,
            'weight_remark' => $isOverLimit ? '重量超过类别限制' : null,
            'created_by' => auth()->id(),
        ]);

        $wasteBatch->update(['status' => 'requested']);

        ProcessHistory::create([
            'processable_type' => TransferRequest::class,
            'processable_id' => $transferRequest->id,
            'action' => '转运申请',
            'from_status' => null,
            'to_status' => 'pending',
            'remark' => $isOverLimit ? '重量超限提醒' : '转运申请提交',
            'performed_by' => auth()->id(),
        ]);

        return redirect()->route('transfer-requests.show', $transferRequest)
            ->with('success', $isOverLimit ? '转运申请已提交，注意重量超限' : '转运申请提交成功');
    }

    public function show(TransferRequest $transferRequest): Response
    {
        $transferRequest->load([
            'wasteBatch.wasteCategory',
            'wasteBatch.storageLocation',
            'carrier',
            'createdBy',
            'manifestForm.verifiedBy',
            'review.reviewedBy',
            'processHistories.performedBy',
        ]);

        return Inertia::render('TransferRequests/Show', [
            'request' => $transferRequest,
            'canApprove' => $transferRequest->canBeApproved(),
        ]);
    }
}

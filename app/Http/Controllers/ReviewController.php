<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\TransferRequest;
use App\Models\ProcessHistory;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class ReviewController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'transfer_request_id' => 'required|exists:transfer_requests,id',
            'result' => 'required|in:approved,rejected,archived',
            'review_remark' => 'nullable|string',
        ]);

        $transferRequest = TransferRequest::findOrFail($validated['transfer_request_id']);

        if ($validated['result'] === 'approved' && !$transferRequest->canBeApproved()) {
            $error = '';
            if ($transferRequest->carrier->isQualificationExpired()) {
                $error = '承运单位资质已过期，请更换承运单位后再放行';
            } elseif (!$transferRequest->manifestForm || $transferRequest->manifestForm->status !== 'verified') {
                $error = '联单未确认，无法放行';
            }
            
            return back()->with('error', $error);
        }

        $review = Review::create([
            ...$validated,
            'reviewed_by' => auth()->id(),
        ]);

        $transferRequest->update(['status' => $validated['result']]);
        $transferRequest->wasteBatch->update(['status' => $validated['result']]);

        ProcessHistory::create([
            'processable_type' => TransferRequest::class,
            'processable_id' => $transferRequest->id,
            'action' => '复核决定',
            'from_status' => 'manifest_verified',
            'to_status' => $validated['result'],
            'remark' => $validated['review_remark'] ?? ('复核结果: ' . $review->result_label),
            'performed_by' => auth()->id(),
        ]);

        return redirect()->route('transfer-requests.show', $transferRequest)
            ->with('success', '复核完成，已' . $review->result_label);
    }
}

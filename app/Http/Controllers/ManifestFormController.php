<?php

namespace App\Http\Controllers;

use App\Models\ManifestForm;
use App\Models\TransferRequest;
use App\Models\ProcessHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ManifestFormController extends Controller
{
    public function create(TransferRequest $transferRequest): Response
    {
        return Inertia::render('ManifestForms/Create', [
            'transferRequest' => $transferRequest->load('wasteBatch'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'transfer_request_id' => 'required|exists:transfer_requests,id',
            'manifest_number' => 'required|string|unique:manifest_forms,manifest_number',
            'issue_date' => 'required|date',
            'manifest_document' => 'nullable|string',
        ]);

        $manifest = ManifestForm::create([
            ...$validated,
            'status' => 'pending',
        ]);

        return redirect()->route('transfer-requests.show', $validated['transfer_request_id'])
            ->with('success', '联单信息已提交');
    }

    public function verify(Request $request, ManifestForm $manifestForm): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:verified,rejected',
            'verification_remark' => 'nullable|string',
        ]);

        $manifestForm->update([
            ...$validated,
            'verified_by' => auth()->id(),
            'verified_at' => now(),
        ]);

        $transferRequest = $manifestForm->transferRequest;
        
        if ($validated['status'] === 'verified') {
            $transferRequest->update(['status' => 'manifest_verified']);
            $transferRequest->wasteBatch->update(['status' => 'manifest_verified']);
        }

        ProcessHistory::create([
            'processable_type' => TransferRequest::class,
            'processable_id' => $transferRequest->id,
            'action' => '联单确认',
            'from_status' => 'pending',
            'to_status' => $validated['status'] === 'verified' ? 'manifest_verified' : 'pending',
            'remark' => $validated['verification_remark'] ?? ($validated['status'] === 'verified' ? '联单确认通过' : '联单需修正'),
            'performed_by' => auth()->id(),
        ]);

        return redirect()->route('transfer-requests.show', $transferRequest)
            ->with('success', '联单' . ($validated['status'] === 'verified' ? '确认通过' : '已驳回'));
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\AbnormalRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AbnormalRecordController extends Controller
{
    public function index()
    {
        $records = AbnormalRecord::with(['followUp.surgery.patient', 'followUp.surgery.implant', 'reviewer'])->get();
        return Inertia::render('AbnormalRecords/Index', compact('records'));
    }

    public function review(AbnormalRecord $record, Request $request)
    {
        $validated = $request->validate([
            'review_status' => 'required|in:1,2',
            'review_notes' => 'nullable',
        ]);

        $record->update([
            'review_status' => $validated['review_status'],
            'review_notes' => $validated['review_notes'],
            'reviewer_id' => auth()->id(),
        ]);

        return redirect()->route('abnormal-records.index');
    }
}

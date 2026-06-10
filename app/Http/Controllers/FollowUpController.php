<?php

namespace App\Http\Controllers;

use App\Models\AbnormalRecord;
use App\Models\FollowUp;
use App\Models\Surgery;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FollowUpController extends Controller
{
    public function index()
    {
        $followUps = FollowUp::with(['surgery.patient', 'surgery.implant', 'nurse'])->get();
        return Inertia::render('FollowUps/Index', compact('followUps'));
    }

    public function create(Surgery $surgery)
    {
        return Inertia::render('FollowUps/Create', compact('surgery'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'surgery_id' => 'required|exists:surgeries,id',
            'nurse_id' => 'required|exists:users,id',
            'follow_up_date' => 'required|date',
            'type' => 'required|in:1,2,3,4,5,6',
            'notes' => 'nullable',
            'status' => 'required|in:1,2,3',
        ]);

        $followUp = FollowUp::create($validated);

        if ($validated['status'] != 1) {
            AbnormalRecord::create([
                'follow_up_id' => $followUp->id,
                'type' => $request->abnormal_type ?? 3,
                'description' => $request->abnormal_description ?? '',
            ]);
        }

        return redirect()->route('surgeries.show', $validated['surgery_id']);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Implant;
use App\Models\Patient;
use App\Models\Surgery;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurgeryController extends Controller
{
    public function index()
    {
        $surgeries = Surgery::with(['patient', 'implant', 'doctor'])->get();
        return Inertia::render('Surgeries/Index', compact('surgeries'));
    }

    public function create()
    {
        $patients = Patient::all();
        $implants = Implant::where('is_recalled', false)->whereRaw('used_quantity < quantity')->get();
        return Inertia::render('Surgeries/Create', compact('patients', 'implants'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'implant_id' => 'required|exists:implants,id',
            'doctor_id' => 'required|exists:users,id',
            'surgery_date' => 'required|date',
            'plan' => 'nullable',
            'notes' => 'nullable',
        ]);

        $implant = Implant::find($validated['implant_id']);
        if ($implant->is_recalled) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => '该批次种植体已被召回，无法使用'], 400);
            }
            return back()->withErrors(['implant_id' => '该批次种植体已被召回，无法使用']);
        }

        if ($implant->used_quantity >= $implant->quantity) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => '该批次种植体库存不足'], 400);
            }
            return back()->withErrors(['implant_id' => '该批次种植体库存不足']);
        }

        $surgery = Surgery::create($validated);
        $implant->increment('used_quantity');

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => '手术记录创建成功']);
        }
        return redirect()->route('surgeries.index');
    }

    public function show(Surgery $surgery)
    {
        $surgery->load(['patient', 'implant', 'doctor', 'followUps.nurse', 'followUps.abnormalRecords']);
        return Inertia::render('Surgeries/Show', compact('surgery'));
    }
}

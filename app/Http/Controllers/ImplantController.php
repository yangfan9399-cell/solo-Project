<?php

namespace App\Http\Controllers;

use App\Models\Implant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ImplantController extends Controller
{
    public function index()
    {
        $implants = Implant::all();
        return Inertia::render('Implants/Index', compact('implants'));
    }

    public function create()
    {
        return Inertia::render('Implants/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'batch_number' => 'required|unique:implants|max:50',
            'brand' => 'required|max:100',
            'model' => 'required|max:100',
            'production_date' => 'required|date',
            'expiry_date' => 'required|date|after:production_date',
            'quantity' => 'required|integer|min:1',
        ]);

        Implant::create($validated);
        return redirect()->route('implants.index');
    }

    public function show(Implant $implant)
    {
        return Inertia::render('Implants/Show', compact('implant'));
    }

    public function recall(Implant $implant, Request $request)
    {
        $validated = $request->validate([
            'recall_reason' => 'required',
        ]);

        $implant->update([
            'is_recalled' => true,
            'recall_reason' => $validated['recall_reason'],
            'recall_date' => now(),
        ]);

        return redirect()->route('implants.index');
    }

    public function getRecallPatients(Implant $implant)
    {
        $patients = $implant->surgeries()->with('patient')->get()->pluck('patient');
        return response()->json($patients);
    }
}

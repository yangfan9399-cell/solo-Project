<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PatientController extends Controller
{
    public function index()
    {
        $patients = Patient::all();
        return Inertia::render('Patients/Index', compact('patients'));
    }

    public function create()
    {
        return Inertia::render('Patients/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|max:50',
            'id_card' => 'required|unique:patients|max:20',
            'phone' => 'required|max:20',
            'birth_date' => 'required|date',
            'gender' => 'required|in:1,2',
            'address' => 'nullable',
        ]);

        Patient::create($validated);
        return redirect()->route('patients.index');
    }

    public function show(Patient $patient)
    {
        return Inertia::render('Patients/Show', compact('patient'));
    }
}

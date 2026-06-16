<?php

namespace App\Http\Controllers;

use App\Models\PracticeRecord;
use App\Models\Instrument;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class PracticeRecordController extends Controller
{
    public function index(Request $request): View
    {
        $query = PracticeRecord::with('instrument', 'tuningSession');

        if ($request->filled('instrument_id')) {
            $query->where('instrument_id', $request->instrument_id);
        }

        if ($request->filled('date_from')) {
            $query->where('session_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('session_date', '<=', $request->date_to);
        }

        $records = $query->orderByDesc('session_date')->paginate(20)->withQueryString();
        $instruments = Instrument::orderBy('name')->get();

        return view('practice.index', compact('records', 'instruments'));
    }

    public function create(): View
    {
        $instruments = Instrument::orderBy('name')->get();
        return view('practice.create', compact('instruments'));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'instrument_id' => 'required|exists:instruments,id',
            'tuning_session_id' => 'nullable|exists:tuning_sessions,id',
            'session_date' => 'required|date',
            'duration_minutes' => 'required|integer|min:1',
            'accuracy_score' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        PracticeRecord::create($validated);

        return redirect()->route('practice.index')
            ->with('success', '练习记录已创建');
    }

    public function edit(PracticeRecord $practiceRecord): View
    {
        $instruments = Instrument::orderBy('name')->get();
        $practiceRecord->load('instrument');
        return view('practice.edit', compact('practiceRecord', 'instruments'));
    }

    public function update(Request $request, PracticeRecord $practiceRecord): RedirectResponse
    {
        $validated = $request->validate([
            'instrument_id' => 'required|exists:instruments,id',
            'tuning_session_id' => 'nullable|exists:tuning_sessions,id',
            'session_date' => 'required|date',
            'duration_minutes' => 'required|integer|min:1',
            'accuracy_score' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        $practiceRecord->update($validated);

        return redirect()->route('practice.index')
            ->with('success', '练习记录已更新');
    }

    public function destroy(PracticeRecord $practiceRecord): RedirectResponse
    {
        $practiceRecord->delete();
        return redirect()->route('practice.index')
            ->with('success', '练习记录已删除');
    }

    public function chart(Request $request): View
    {
        $instrumentId = $request->get('instrument_id');
        $instruments = Instrument::orderBy('name')->get();

        $records = collect();
        if ($instrumentId) {
            $records = PracticeRecord::where('instrument_id', $instrumentId)
                ->orderBy('session_date')
                ->get();
        } else {
            $records = PracticeRecord::orderBy('session_date')->get();
        }

        $chartData = $records->groupBy('instrument_id')->map(function ($group) use ($instruments) {
            $instrument = $instruments->firstWhere('id', $group->first()->instrument_id);
            return [
                'instrument_name' => $instrument ? $instrument->name : '未知',
                'data' => $group->map(fn($r) => [
                    'date' => $r->session_date->format('Y-m-d'),
                    'score' => $r->accuracy_score,
                    'duration' => $r->duration_minutes,
                ])->values(),
            ];
        })->values();

        return view('practice.chart', compact('chartData', 'instruments', 'instrumentId'));
    }
}

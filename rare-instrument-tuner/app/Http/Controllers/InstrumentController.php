<?php

namespace App\Http\Controllers;

use App\Models\Instrument;
use App\Models\ToneLibrary;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class InstrumentController extends Controller
{
    public function index(Request $request): View
    {
        $query = Instrument::withCount('tuningSessions', 'toneLibraries');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('origin', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $instruments = $query->orderBy('name')->paginate(20)->withQueryString();
        $types = Instrument::select('type')->distinct()->pluck('type');

        return view('instruments.index', compact('instruments', 'types'));
    }

    public function create(): View
    {
        return view('instruments.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'origin' => 'nullable|string|max:255',
            'string_count' => 'nullable|integer|min:0',
            'tuning_notes' => 'nullable|array',
            'description' => 'nullable|string',
        ]);

        Instrument::create($validated);

        return redirect()->route('instruments.index')
            ->with('success', '乐器已创建');
    }

    public function show(Instrument $instrument): View
    {
        $instrument->load('toneLibraries', 'tuningSessions', 'practiceRecords');
        return view('instruments.show', compact('instrument'));
    }

    public function edit(Instrument $instrument): View
    {
        return view('instruments.edit', compact('instrument'));
    }

    public function update(Request $request, Instrument $instrument): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
            'origin' => 'nullable|string|max:255',
            'string_count' => 'nullable|integer|min:0',
            'tuning_notes' => 'nullable|array',
            'description' => 'nullable|string',
        ]);

        $instrument->update($validated);

        return redirect()->route('instruments.show', $instrument)
            ->with('success', '乐器信息已更新');
    }

    public function destroy(Instrument $instrument): RedirectResponse
    {
        $instrument->delete();
        return redirect()->route('instruments.index')
            ->with('success', '乐器已删除');
    }
}

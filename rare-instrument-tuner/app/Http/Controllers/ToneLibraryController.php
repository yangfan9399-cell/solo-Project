<?php

namespace App\Http\Controllers;

use App\Models\ToneLibrary;
use App\Models\Instrument;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class ToneLibraryController extends Controller
{
    public function index(Request $request): View
    {
        $query = ToneLibrary::with('instrument');

        if ($request->filled('instrument_id')) {
            $query->where('instrument_id', $request->instrument_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('note_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tones = $query->orderBy('instrument_id')->orderBy('target_freq')->paginate(30)->withQueryString();
        $instruments = Instrument::orderBy('name')->get();

        return view('tone-libraries.index', compact('tones', 'instruments'));
    }

    public function create(): View
    {
        $instruments = Instrument::orderBy('name')->get();
        return view('tone-libraries.create', compact('instruments'));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'instrument_id' => 'required|exists:instruments,id',
            'note_name' => 'required|string|max:50',
            'target_freq' => 'required|numeric|min:20|max:10000',
            'tolerance_cents' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string',
        ]);

        ToneLibrary::create($validated);

        return redirect()->route('tone-libraries.index')
            ->with('success', '音库条目已创建');
    }

    public function edit(ToneLibrary $toneLibrary): View
    {
        $instruments = Instrument::orderBy('name')->get();
        return view('tone-libraries.edit', compact('toneLibrary', 'instruments'));
    }

    public function update(Request $request, ToneLibrary $toneLibrary): RedirectResponse
    {
        $validated = $request->validate([
            'instrument_id' => 'required|exists:instruments,id',
            'note_name' => 'required|string|max:50',
            'target_freq' => 'required|numeric|min:20|max:10000',
            'tolerance_cents' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string',
        ]);

        $toneLibrary->update($validated);

        return redirect()->route('tone-libraries.index')
            ->with('success', '音库条目已更新');
    }

    public function destroy(ToneLibrary $toneLibrary): RedirectResponse
    {
        $toneLibrary->delete();
        return redirect()->route('tone-libraries.index')
            ->with('success', '音库条目已删除');
    }
}

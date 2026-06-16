<?php

namespace App\Http\Controllers;

use App\Models\SessionVersion;
use App\Models\TuningSession;
use Illuminate\View\View;

class SessionVersionController extends Controller
{
    public function index(TuningSession $session): View
    {
        $versions = $session->versions()->orderByDesc('version_number')->paginate(20);
        return view('sessions.versions', compact('session', 'versions'));
    }

    public function show(TuningSession $session, SessionVersion $version): View
    {
        $version->load('tuningSession.instrument');
        return view('sessions.version-detail', compact('session', 'version'));
    }

    public function restore(TuningSession $session, SessionVersion $version)
    {
        $snapshot = $version->snapshot_data;

        $session->update([
            'name' => $snapshot['name'],
            'fundamental_freq' => $snapshot['fundamental_freq'],
            'status' => $snapshot['status'],
            'notes' => $snapshot['notes'],
            'has_anomaly' => $snapshot['has_anomaly'],
            'anomaly_description' => $snapshot['anomaly_description'],
        ]);

        $session->spectrumData()->delete();
        foreach ($snapshot['spectrum_data'] ?? [] as $sd) {
            unset($sd['id'], $sd['tuning_session_id'], $sd['created_at'], $sd['updated_at']);
            $session->spectrumData()->create($sd);
        }

        $session->tuningSuggestions()->delete();
        foreach ($snapshot['suggestions'] ?? [] as $sg) {
            unset($sg['id'], $sg['tuning_session_id'], $sg['created_at'], $sg['updated_at']);
            $session->tuningSuggestions()->create($sg);
        }

        $session->createVersion("从版本v{$version->version_number}恢复（含频谱与建议）");

        return redirect()->route('sessions.show', $session)
            ->with('success', "已从版本v{$version->version_number}完整恢复（含{$session->spectrumData()->count()}条频谱数据、{$session->tuningSuggestions()->count()}条调弦建议）");
    }
}

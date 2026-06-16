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

        $session->createVersion("从版本v{$version->version_number}恢复");

        return redirect()->route('sessions.show', $session)
            ->with('success', "已从版本v{$version->version_number}恢复");
    }
}

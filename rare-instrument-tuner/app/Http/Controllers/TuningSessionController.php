<?php

namespace App\Http\Controllers;

use App\Models\TuningSession;
use App\Models\Instrument;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class TuningSessionController extends Controller
{
    public function index(Request $request): View
    {
        $query = TuningSession::with('instrument', 'spectrumData');

        if ($request->filled('instrument_id')) {
            $query->where('instrument_id', $request->instrument_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('has_anomaly')) {
            $query->where('has_anomaly', $request->boolean('has_anomaly'));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhere('anomaly_description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('freq_min')) {
            $query->where('fundamental_freq', '>=', $request->freq_min);
        }

        if ($request->filled('freq_max')) {
            $query->where('fundamental_freq', '<=', $request->freq_max);
        }

        $sortBy = $request->get('sort_by', 'updated_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['name', 'fundamental_freq', 'status', 'updated_at', 'created_at'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'updated_at';
        }
        $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');

        $sessions = $query->paginate(15)->withQueryString();
        $instruments = Instrument::orderBy('name')->get();

        return view('sessions.index', compact('sessions', 'instruments'));
    }

    public function create(): View
    {
        $instruments = Instrument::orderBy('name')->get();
        return view('sessions.create', compact('instruments'));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'instrument_id' => 'required|exists:instruments,id',
            'name' => 'required|string|max:255',
            'fundamental_freq' => 'nullable|numeric|min:20|max:10000',
            'status' => 'required|in:draft,in_progress,completed',
            'notes' => 'nullable|string',
        ]);

        $session = TuningSession::create($validated);
        $session->createVersion('创建调音会话');

        return redirect()->route('sessions.show', $session)
            ->with('success', '调音会话已创建');
    }

    public function show(TuningSession $session): View
    {
        $session->load('instrument', 'spectrumData', 'tuningSuggestions', 'versions', 'practiceRecords');
        return view('sessions.show', compact('session'));
    }

    public function edit(TuningSession $session): View
    {
        $instruments = Instrument::orderBy('name')->get();
        $session->load('spectrumData', 'tuningSuggestions');
        return view('sessions.edit', compact('session', 'instruments'));
    }

    public function update(Request $request, TuningSession $session): RedirectResponse
    {
        $validated = $request->validate([
            'instrument_id' => 'required|exists:instruments,id',
            'name' => 'required|string|max:255',
            'fundamental_freq' => 'nullable|numeric|min:20|max:10000',
            'status' => 'required|in:draft,in_progress,completed',
            'notes' => 'nullable|string',
        ]);

        $session->update($validated);
        $session->createVersion('更新会话信息');

        return redirect()->route('sessions.show', $session)
            ->with('success', '调音会话已更新');
    }

    public function destroy(TuningSession $session): RedirectResponse
    {
        $session->delete();
        return redirect()->route('sessions.index')
            ->with('success', '调音会话已删除');
    }

    public function uploadAudio(Request $request, TuningSession $session): RedirectResponse
    {
        $validated = $request->validate([
            'audio_file' => 'required|file|max:51200|mimes:wav,mp3,ogg,flac',
        ]);

        $path = $request->file('audio_file')->store('audio', 'public');
        $session->update(['audio_path' => $path]);
        $session->createVersion('上传音频文件');

        return redirect()->route('sessions.show', $session)
            ->with('success', '音频文件已上传');
    }

    public function analyzeSpectrum(Request $request, TuningSession $session): RedirectResponse
    {
        $validated = $request->validate([
            'fundamental_freq' => 'required|numeric|min:20|max:10000',
            'harmonic_count' => 'nullable|integer|min:1|max:32',
        ]);

        $service = app(\App\Services\SpectrumAnalyzerService::class);
        $harmonicCount = $validated['harmonic_count'] ?? 8;
        $harmonics = $service->analyzeFromFrequency($validated['fundamental_freq'], $harmonicCount);

        $session->spectrumData()->delete();
        foreach ($harmonics as $h) {
            $session->spectrumData()->create($h);
        }

        $anomalies = $service->detectAnomalies($harmonics);
        $session->update([
            'fundamental_freq' => $validated['fundamental_freq'],
            'has_anomaly' => count($anomalies) > 0,
            'anomaly_description' => count($anomalies) > 0
                ? collect($anomalies)->pluck('description')->implode('；')
                : null,
        ]);

        $session->tuningSuggestions()->delete();
        $suggestions = $service->generateSuggestions($session);
        foreach ($suggestions as $s) {
            $session->tuningSuggestions()->create($s);
        }

        $session->createVersion('频谱分析完成，' . count($harmonics) . '个泛音，' . count($anomalies) . '个异常');

        return redirect()->route('sessions.show', $session)
            ->with('success', sprintf('频谱分析完成：%d个泛音数据，%d个异常标记', count($harmonics), count($anomalies)));
    }

    public function export(TuningSession $session)
    {
        $session->load('instrument', 'spectrumData', 'tuningSuggestions', 'versions');

        $filename = sprintf('tuning_session_%d_%s.csv', $session->id, date('YmdHis'));

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($session) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($file, ['调音会话导出']);
            fputcsv($file, ['会话名称', $session->name]);
            fputcsv($file, ['乐器', $session->instrument->name]);
            fputcsv($file, ['基频(Hz)', $session->fundamental_freq]);
            fputcsv($file, ['状态', $session->status]);
            fputcsv($file, ['是否有异常', $session->has_anomaly ? '是' : '否']);
            if ($session->anomaly_description) {
                fputcsv($file, ['异常描述', $session->anomaly_description]);
            }
            fputcsv($file, ['备注', $session->notes ?? '']);
            fputcsv($file, []);

            fputcsv($file, ['频谱数据']);
            fputcsv($file, ['泛音序号', '频率(Hz)', '振幅', '偏差(音分)', '是否异常']);
            foreach ($session->spectrumData as $sd) {
                fputcsv($file, [
                    $sd->harmonic_order,
                    $sd->frequency,
                    $sd->amplitude,
                    $sd->deviation_cents,
                    $sd->is_anomaly ? '是' : '否',
                ]);
            }
            fputcsv($file, []);

            fputcsv($file, ['调弦建议']);
            fputcsv($file, ['弦/泛音索引', '当前频率(Hz)', '目标频率(Hz)', '调整量(音分)', '操作', '备注']);
            foreach ($session->tuningSuggestions as $ts) {
                fputcsv($file, [
                    $ts->string_index,
                    $ts->current_freq,
                    $ts->target_freq,
                    $ts->adjustment_cents,
                    $ts->action,
                    $ts->note,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

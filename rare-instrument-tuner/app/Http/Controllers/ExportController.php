<?php

namespace App\Http\Controllers;

use App\Models\TuningSession;
use App\Models\Instrument;
use App\Models\PracticeRecord;
use App\Models\ToneLibrary;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function sessionsSummary(Request $request): StreamedResponse
    {
        $query = TuningSession::with('instrument', 'spectrumData', 'tuningSuggestions');

        if ($request->filled('instrument_id')) {
            $query->where('instrument_id', $request->instrument_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('has_anomaly')) {
            $query->where('has_anomaly', $request->boolean('has_anomaly'));
        }

        $sessions = $query->orderByDesc('updated_at')->get();
        $filename = sprintf('sessions_summary_%s.csv', date('Ymd_His'));

        return response()->stream(function () use ($sessions) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($file, ['调音会话汇总导出', '', '', '', '', '', '', '', '']);
            fputcsv($file, ['导出时间', date('Y-m-d H:i:s')]);
            fputcsv($file, []);

            fputcsv($file, ['ID', '会话名称', '乐器', '基频(Hz)', '状态', '有异常', '异常描述', '泛音数', '建议数', '创建时间', '更新时间']);
            foreach ($sessions as $s) {
                fputcsv($file, [
                    $s->id,
                    $s->name,
                    $s->instrument->name,
                    $s->fundamental_freq,
                    $this->statusLabel($s->status),
                    $s->has_anomaly ? '是' : '否',
                    $s->anomaly_description ?? '',
                    $s->spectrumData->count(),
                    $s->tuningSuggestions->count(),
                    $s->created_at->format('Y-m-d H:i'),
                    $s->updated_at->format('Y-m-d H:i'),
                ]);
            }

            fclose($file);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function practiceSummary(Request $request): StreamedResponse
    {
        $query = PracticeRecord::with('instrument', 'tuningSession');

        if ($request->filled('instrument_id')) {
            $query->where('instrument_id', $request->instrument_id);
        }

        $records = $query->orderByDesc('session_date')->get();
        $filename = sprintf('practice_summary_%s.csv', date('Ymd_His'));

        return response()->stream(function () use ($records) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($file, ['练习记录汇总导出']);
            fputcsv($file, ['导出时间', date('Y-m-d H:i:s')]);
            fputcsv($file, []);

            fputcsv($file, ['ID', '乐器', '关联会话', '日期', '时长(分钟)', '精度分数', '备注']);
            foreach ($records as $r) {
                fputcsv($file, [
                    $r->id,
                    $r->instrument->name,
                    $r->tuningSession?->name ?? '-',
                    $r->session_date->format('Y-m-d'),
                    $r->duration_minutes,
                    $r->accuracy_score,
                    $r->notes ?? '',
                ]);
            }

            fclose($file);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function toneLibraries(Request $request): StreamedResponse
    {
        $query = ToneLibrary::with('instrument');

        if ($request->filled('instrument_id')) {
            $query->where('instrument_id', $request->instrument_id);
        }

        $tones = $query->orderBy('instrument_id')->orderBy('target_freq')->get();
        $filename = sprintf('tone_libraries_%s.csv', date('Ymd_His'));

        return response()->stream(function () use ($tones) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($file, ['目标音库导出']);
            fputcsv($file, ['导出时间', date('Y-m-d H:i:s')]);
            fputcsv($file, []);

            fputcsv($file, ['ID', '乐器', '音名', '目标频率(Hz)', '容差(音分)', '描述']);
            foreach ($tones as $t) {
                fputcsv($file, [
                    $t->id,
                    $t->instrument->name,
                    $t->note_name,
                    $t->target_freq,
                    $t->tolerance_cents,
                    $t->description ?? '',
                ]);
            }

            fclose($file);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'draft' => '草稿',
            'in_progress' => '进行中',
            'completed' => '已完成',
            default => $status,
        };
    }
}

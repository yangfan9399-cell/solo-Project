<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Services\ExportService;
use Illuminate\Http\Response;

class ExportController extends Controller
{
    protected ExportService $exportService;

    public function __construct(ExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    public function summaryExcel(): Response
    {
        $data = $this->exportService->generateSummaryData();
        $csvContent = $this->exportService->buildCsvContent($data, 'summary');
        $filename = '批次压榨汇总_' . now()->format('YmdHis') . '.csv';

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function summaryPdf(): Response
    {
        $data = $this->exportService->generateSummaryData();
        $html = view('exports.summary', compact('data'))->render();

        return $this->buildPdfResponse($html, '批次压榨汇总报告');
    }

    public function batchExcel(Batch $batch): Response
    {
        $data = $this->exportService->generateBatchDetailData($batch);
        $csvContent = $this->exportService->buildCsvContent($data, 'batch');
        $filename = "批次详情_{$batch->batch_code}_" . now()->format('YmdHis') . '.csv';

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function batchPdf(Batch $batch): Response
    {
        $data = $this->exportService->generateBatchDetailData($batch);
        $html = view('exports.batch', compact('data'))->render();

        return $this->buildPdfResponse($html, "批次详情报告_{$batch->batch_code}");
    }

    protected function buildPdfResponse(string $html, string $filename): Response
    {
        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            try {
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
                $filename = $filename . '_' . now()->format('YmdHis') . '.pdf';
                return $pdf->download($filename);
            } catch (\Exception $e) {
            }
        }

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'inline; filename="' . $filename . '.html"',
        ]);
    }
}

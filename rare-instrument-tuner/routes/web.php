<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TuningSessionController;
use App\Http\Controllers\InstrumentController;
use App\Http\Controllers\ToneLibraryController;
use App\Http\Controllers\SessionVersionController;
use App\Http\Controllers\PracticeRecordController;
use App\Http\Controllers\ExportController;
use Illuminate\Support\Facades\Route;

Route::get('/', DashboardController::class)->name('dashboard');

Route::resource('sessions', TuningSessionController::class);
Route::post('sessions/{session}/upload-audio', [TuningSessionController::class, 'uploadAudio'])->name('sessions.upload-audio');
Route::post('sessions/{session}/analyze', [TuningSessionController::class, 'analyzeSpectrum'])->name('sessions.analyze');
Route::get('sessions/{session}/export', [TuningSessionController::class, 'export'])->name('sessions.export');

Route::get('sessions/{session}/versions', [SessionVersionController::class, 'index'])->name('sessions.versions');
Route::get('sessions/{session}/versions/{version}', [SessionVersionController::class, 'show'])->name('sessions.versions.show');
Route::post('sessions/{session}/versions/{version}/restore', [SessionVersionController::class, 'restore'])->name('sessions.versions.restore');

Route::resource('instruments', InstrumentController::class);

Route::resource('tone-libraries', ToneLibraryController::class)->except(['show']);

Route::resource('practice', PracticeRecordController::class);
Route::get('practice-chart', [PracticeRecordController::class, 'chart'])->name('practice.chart');

Route::get('export', [ExportController::class, 'index'])->name('export.index');
Route::get('export/sessions', [ExportController::class, 'sessionsSummary'])->name('export.sessions');
Route::get('export/practice', [ExportController::class, 'practiceSummary'])->name('export.practice');
Route::get('export/tones', [ExportController::class, 'toneLibraries'])->name('export.tones');

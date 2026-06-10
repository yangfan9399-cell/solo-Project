<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ImplantController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\SurgeryController;
use App\Http\Controllers\FollowUpController;
use App\Http\Controllers\AbnormalRecordController;
use App\Http\Controllers\StatisticsController;

Route::get('/', function () {
    return redirect()->route('statistics.index');
});

Route::resource('implants', ImplantController::class);
Route::post('implants/{implant}/recall', [ImplantController::class, 'recall'])->name('implants.recall');
Route::get('implants/{implant}/patients', [ImplantController::class, 'getRecallPatients'])->name('implants.patients');

Route::resource('patients', PatientController::class);
Route::resource('surgeries', SurgeryController::class);
Route::resource('follow-ups', FollowUpController::class);
Route::resource('abnormal-records', AbnormalRecordController::class);
Route::post('abnormal-records/{record}/review', [AbnormalRecordController::class, 'review'])->name('abnormal-records.review');

Route::get('statistics', [StatisticsController::class, 'index'])->name('statistics.index');

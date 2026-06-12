<?php

namespace App\Providers;

use App\Models\InspectionRecord;
use App\Observers\InspectionRecordObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        InspectionRecord::observe(InspectionRecordObserver::class);
    }
}

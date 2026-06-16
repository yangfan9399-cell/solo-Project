<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spectrum_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tuning_session_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('harmonic_order');
            $table->float('frequency');
            $table->float('amplitude');
            $table->float('deviation_cents')->default(0);
            $table->boolean('is_anomaly')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spectrum_data');
    }
};

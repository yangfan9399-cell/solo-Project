<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tuning_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instrument_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('audio_path')->nullable();
            $table->float('fundamental_freq')->nullable();
            $table->string('status')->default('draft');
            $table->text('notes')->nullable();
            $table->boolean('has_anomaly')->default(false);
            $table->text('anomaly_description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tuning_sessions');
    }
};

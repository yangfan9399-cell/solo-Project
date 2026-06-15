<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('probe_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('probe_record_id')->constrained()->cascadeOnDelete();
            $table->decimal('frequency_used', 8, 2);
            $table->decimal('direction_used', 8, 4);
            $table->json('echo_curve_data');
            $table->json('revealed_points');
            $table->json('map_snapshot_before');
            $table->json('map_snapshot_after');
            $table->boolean('rollback_available')->default(true);
            $table->boolean('rolled_back')->default(false);
            $table->timestamp('processed_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('probe_histories');
    }
};

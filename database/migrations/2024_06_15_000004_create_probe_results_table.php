<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('probe_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('probe_history_id')->constrained()->cascadeOnDelete();
            $table->enum('wall_type', ['normal', 'wet', 'crack', 'collapse', 'empty']);
            $table->boolean('is_false_echo')->default(false);
            $table->decimal('measured_distance', 8, 2);
            $table->decimal('actual_distance', 8, 2)->nullable();
            $table->decimal('confidence', 5, 2);
            $table->boolean('wet_wall_detected')->default(false);
            $table->boolean('crack_detected')->default(false);
            $table->boolean('collapse_detected')->default(false);
            $table->integer('oxygen_used')->default(0);
            $table->integer('durability_used')->default(0);
            $table->text('analysis_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('probe_results');
    }
};

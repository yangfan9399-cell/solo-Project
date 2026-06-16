<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('level_id')->constrained();
            $table->enum('status', ['playing', 'won', 'lost', 'abandoned'])->default('playing');
            $table->integer('attempt_count')->default(0);
            $table->decimal('final_score', 8, 2)->nullable();
            $table->decimal('final_viscosity', 8, 2)->nullable();
            $table->decimal('final_drying_time', 8, 2)->nullable();
            $table->decimal('final_transparency', 8, 2)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};

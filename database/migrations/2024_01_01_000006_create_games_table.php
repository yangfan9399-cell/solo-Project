<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained()->onDelete('cascade');
            $table->foreignId('level_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['playing', 'won', 'lost', 'abandoned'])->default('playing');
            $table->integer('score')->default(0);
            $table->integer('current_round')->default(1);
            $table->integer('questions_asked')->default(0);
            $table->integer('clues_distributed')->default(0);
            $table->integer('spoiler_risk_accumulated')->default(0);
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->text('final_analysis')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};

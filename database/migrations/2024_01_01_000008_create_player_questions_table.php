<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->text('question');
            $table->text('host_response');
            $table->integer('round_number');
            $table->boolean('is_relevant')->default(false);
            $table->boolean('triggers_clue')->default(false);
            $table->foreignId('related_clue_id')->nullable()->constrained('clue_cards')->onDelete('set null');
            $table->integer('relevance_score')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_questions');
    }
};

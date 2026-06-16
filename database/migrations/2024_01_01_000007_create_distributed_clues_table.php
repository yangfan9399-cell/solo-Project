<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('distributed_clues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->foreignId('clue_card_id')->constrained()->onDelete('cascade');
            $table->integer('distributed_at_round');
            $table->timestamp('distributed_at');
            $table->string('distributed_reason')->nullable();
            $table->boolean('was_asked_about')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('distributed_clues');
    }
};

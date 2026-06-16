<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->integer('total_score')->default(0);
            $table->integer('games_played')->default(0);
            $table->integer('games_won')->default(0);
            $table->integer('best_streak')->default(0);
            $table->integer('current_streak')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};

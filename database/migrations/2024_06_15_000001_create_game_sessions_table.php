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
            $table->string('player_name')->default('探险家');
            $table->timestamp('start_time')->useCurrent();
            $table->timestamp('end_time')->nullable();
            $table->enum('status', ['playing', 'completed', 'failed', 'abandoned'])->default('playing');
            $table->integer('oxygen')->default(100);
            $table->integer('max_oxygen')->default(100);
            $table->integer('equipment_durability')->default(100);
            $table->integer('max_durability')->default(100);
            $table->integer('score')->default(0);
            $table->integer('player_x')->default(0);
            $table->integer('player_y')->default(0);
            $table->json('cave_data');
            $table->json('revealed_map');
            $table->text('final_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};

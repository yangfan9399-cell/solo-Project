<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expedition_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')->constrained()->cascadeOnDelete();
            $table->enum('log_type', ['probe', 'move', 'warning', 'error', 'system', 'success']);
            $table->string('title');
            $table->text('message');
            $table->json('details')->nullable();
            $table->integer('oxygen_change')->default(0);
            $table->integer('durability_change')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expedition_logs');
    }
};

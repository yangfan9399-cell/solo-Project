<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_operations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')->constrained()->cascadeOnDelete();
            $table->string('operation_type', 30);
            $table->integer('box_id');
            $table->integer('from_floor')->nullable();
            $table->integer('to_floor')->nullable();
            $table->text('state_before')->nullable();
            $table->text('state_after')->nullable();
            $table->integer('sequence_number')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_operations');
    }
};

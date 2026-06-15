<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->json('material_combo')->nullable();
            $table->integer('cost_before')->default(0);
            $table->integer('cost_after')->default(0);
            $table->integer('durability_before')->default(0);
            $table->integer('durability_after')->default(0);
            $table->string('change_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_results');
    }
};

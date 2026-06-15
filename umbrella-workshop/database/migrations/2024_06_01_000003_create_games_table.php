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
            $table->foreignId('level_id')->constrained()->cascadeOnDelete();
            $table->string('player_name')->default('匠人');
            $table->string('status')->default('draft');
            $table->foreignId('rib_material_id')->nullable()->constrained('materials')->nullOnDelete();
            $table->foreignId('surface_material_id')->nullable()->constrained('materials')->nullOnDelete();
            $table->foreignId('paper_material_id')->nullable()->constrained('materials')->nullOnDelete();
            $table->integer('humidity')->default(50);
            $table->integer('total_cost')->default(0);
            $table->integer('total_durability')->default(0);
            $table->integer('smoothness')->default(100);
            $table->integer('score')->default(0);
            $table->json('round_state')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('material_id')->constrained();
            $table->timestamp('unlocked_at')->nullable();
            $table->integer('unlock_level_id')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'material_id']);
        });

        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('level_id')->constrained();
            $table->decimal('best_score', 8, 2)->nullable();
            $table->integer('stars')->default(0);
            $table->integer('attempts_count')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->timestamp('first_completed_at')->nullable();
            $table->timestamp('last_played_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'level_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_progress');
        Schema::dropIfExists('user_materials');
    }
};

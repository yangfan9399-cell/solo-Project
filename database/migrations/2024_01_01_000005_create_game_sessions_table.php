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
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->constrained()->cascadeOnDelete();
            $table->foreignId('player_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['in_progress', 'completed', 'abandoned', 'failed'])->default('in_progress');
            $table->integer('current_score')->default(0);
            $table->integer('penalty_score')->default(0);
            $table->integer('hints_used')->default(0);
            $table->json('rotor_positions')->nullable(); // 当前转轮位置
            $table->json('substitution_table')->nullable(); // 用户的替换表
            $table->text('partial_solution')->nullable(); // 部分解密结果
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('abandoned_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->boolean('solution_verified')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};

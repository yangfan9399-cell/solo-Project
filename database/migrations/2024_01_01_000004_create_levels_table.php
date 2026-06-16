<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('levels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('difficulty'); // easy, medium, hard, expert
            $table->integer('base_score');
            $table->integer('hint_penalty'); // 每次提示扣分
            $table->integer('time_bonus_threshold')->nullable(); // 秒数，完成时间低于此值获得额外奖励
            $table->integer('rotor_count'); // 转轮数量
            $table->string('cipher_type'); // substitution, rotor, vigenere, caesar
            $table->text('plaintext');
            $table->text('ciphertext');
            $table->json('rotor_config')->nullable(); // 初始转轮配置
            $table->json('solution_hints')->nullable(); // 可用提示
            $table->json('frequency_data')->nullable(); // 预计算的频率数据
            $table->boolean('is_custom')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('levels');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->string('customer_name')->default('顾客');
            $table->integer('satisfaction')->default(50);
            $table->integer('review_score')->default(0);
            $table->text('comment')->nullable();
            $table->boolean('needs_recalc')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_evaluations');
    }
};

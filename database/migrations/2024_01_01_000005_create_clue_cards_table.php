<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clue_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('level_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('content');
            $table->string('category')->default('physical');
            $table->integer('importance_score')->default(50);
            $table->integer('spoiler_risk')->default(0);
            $table->integer('reveal_order')->default(0);
            $table->boolean('is_required')->default(false);
            $table->json('related_clue_ids')->nullable();
            $table->string('icon')->default('🔍');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clue_cards');
    }
};

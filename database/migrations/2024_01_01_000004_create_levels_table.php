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
            $table->string('title');
            $table->text('description');
            $table->text('story_intro');
            $table->text('truth_reveal');
            $table->integer('difficulty')->default(1);
            $table->integer('max_score')->default(100);
            $table->integer('time_limit_minutes')->default(30);
            $table->integer('required_clues_to_solve')->default(5);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('levels');
    }
};

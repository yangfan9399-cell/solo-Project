<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quality_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->string('inspection_type')->default('final');
            $table->string('result')->default('pending');
            $table->integer('score')->default(0);
            $table->text('notes')->nullable();
            $table->boolean('needs_rollback')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quality_inspections');
    }
};

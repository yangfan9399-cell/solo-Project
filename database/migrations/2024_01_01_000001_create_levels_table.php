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
            $table->string('paper_type');
            $table->text('paper_description');
            $table->decimal('target_viscosity', 8, 2);
            $table->decimal('target_drying_time', 8, 2);
            $table->decimal('target_transparency', 8, 2);
            $table->decimal('viscosity_tolerance', 8, 2)->default(5.0);
            $table->decimal('drying_time_tolerance', 8, 2)->default(5.0);
            $table->decimal('transparency_tolerance', 8, 2)->default(5.0);
            $table->integer('max_attempts')->default(10);
            $table->integer('unlock_level_id')->nullable();
            $table->integer('unlock_score')->default(0);
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('levels');
    }
};

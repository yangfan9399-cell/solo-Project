<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code');
            $table->text('description');
            $table->enum('type', ['base', 'additive']);
            $table->string('color')->default('#ffffff');
            $table->decimal('viscosity_factor', 8, 2);
            $table->decimal('drying_time_factor', 8, 2);
            $table->decimal('transparency_factor', 8, 2);
            $table->decimal('base_viscosity', 8, 2)->default(0);
            $table->decimal('base_drying_time', 8, 2)->default(0);
            $table->decimal('base_transparency', 8, 2)->default(0);
            $table->boolean('is_unlocked_by_default')->default(false);
            $table->integer('unlock_level_id')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materials');
    }
};

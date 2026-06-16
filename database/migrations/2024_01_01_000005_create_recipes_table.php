<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('level_id')->nullable()->constrained();
            $table->text('recipe_data');
            $table->decimal('viscosity', 8, 2)->nullable();
            $table->decimal('drying_time', 8, 2)->nullable();
            $table->decimal('transparency', 8, 2)->nullable();
            $table->decimal('score', 8, 2)->nullable();
            $table->boolean('is_shared')->default(false);
            $table->string('share_code')->nullable()->unique();
            $table->integer('like_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipes');
    }
};

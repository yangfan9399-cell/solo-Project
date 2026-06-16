<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operation_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')->constrained()->onDelete('cascade');
            $table->integer('step_number')->default(0);
            $table->enum('action_type', ['add_material', 'remove_material', 'adjust_amount', 'reset']);
            $table->foreignId('material_id')->nullable()->constrained();
            $table->decimal('amount', 8, 2)->nullable();
            $table->text('state_before')->nullable();
            $table->text('state_after')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_histories');
    }
};

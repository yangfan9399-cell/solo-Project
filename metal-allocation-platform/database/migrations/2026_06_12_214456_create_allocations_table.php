<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('allocations', function (Blueprint $table) {
            $table->id();
            $table->string('allocation_no')->unique();
            $table->string('source_vault');
            $table->string('target_vault');
            $table->enum('metal_type', ['gold', 'silver', 'platinum', 'palladium']);
            $table->decimal('quantity', 18, 4);
            $table->enum('unit', ['g', 'kg', 'oz']);
            $table->decimal('amount', 18, 2);
            $table->enum('status', ['pending', 'processing', 'reviewing', 'archived', 'blocked', 'appealed'])->default('pending');
            $table->string('blocking_reason')->nullable();
            $table->string('remediation_path')->nullable();
            $table->foreignId('current_handler_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source_info')->nullable();
            $table->text('conclusion')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('allocations');
    }
};

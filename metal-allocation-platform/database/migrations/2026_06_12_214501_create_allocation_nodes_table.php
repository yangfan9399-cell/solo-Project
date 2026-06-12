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
        Schema::create('allocation_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('allocation_id')->constrained('allocations')->cascadeOnDelete();
            $table->enum('node_type', ['created', 'accepted', 'processed', 'reviewing', 'reviewed', 'archived', 'blocked', 'returned', 'appealed', 'reprocessed']);
            $table->foreignId('handler_id')->constrained('users');
            $table->enum('handler_role', ['business_specialist', 'approval_manager']);
            $table->text('description');
            $table->json('before_data')->nullable();
            $table->json('after_data')->nullable();
            $table->string('basis')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('allocation_nodes');
    }
};

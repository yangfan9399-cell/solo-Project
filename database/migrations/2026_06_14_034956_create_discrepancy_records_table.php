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
        Schema::create('discrepancy_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_record_id')->constrained()->onDelete('cascade');
            $table->foreignId('review_node_id')->nullable()->constrained()->onDelete('set null');
            
            $table->string('discrepancy_type', 50);
            $table->string('field_name', 100);
            $table->text('expected_value')->nullable();
            $table->text('actual_value')->nullable();
            
            $table->text('description')->nullable();
            $table->text('block_reason')->nullable();
            $table->text('remedy_path')->nullable();
            $table->text('resolution')->nullable();
            
            $table->string('status', 30)->default('pending');
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            
            $table->json('metadata')->nullable();
            
            $table->index(['review_record_id', 'discrepancy_type']);
            $table->index(['status', 'field_name']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discrepancy_records');
    }
};

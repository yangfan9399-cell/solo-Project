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
        Schema::create('review_records', function (Blueprint $table) {
            $table->id();
            $table->string('record_no', 50)->unique();
            $table->string('title', 200);
            $table->string('source', 100);
            $table->string('source_dept', 100)->nullable();
            
            $table->string('student_name', 100);
            $table->string('student_id', 50);
            $table->string('college', 100);
            $table->string('major', 100);
            $table->string('grade', 20);
            
            $table->string('scholarship_type', 100);
            $table->string('scholarship_level', 50)->nullable();
            $table->decimal('apply_amount', 12, 2)->default(0);
            $table->decimal('approved_amount', 12, 2)->nullable();
            $table->integer('apply_count')->default(1);
            $table->integer('approved_count')->nullable();
            
            $table->string('status', 30)->default('pending');
            $table->string('anomaly_type', 30)->nullable();
            $table->text('block_reason')->nullable();
            $table->text('remedy_path')->nullable();
            
            $table->foreignId('current_owner_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->json('original_data')->nullable();
            $table->json('processed_data')->nullable();
            $table->json('diff_fields')->nullable();
            $table->text('basis')->nullable();
            $table->text('conclusion')->nullable();
            
            $table->boolean('is_archived')->default(false);
            $table->timestamp('received_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->index(['status', 'anomaly_type']);
            $table->index(['student_id', 'record_no']);
            $table->index(['current_owner_id', 'is_archived']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_records');
    }
};

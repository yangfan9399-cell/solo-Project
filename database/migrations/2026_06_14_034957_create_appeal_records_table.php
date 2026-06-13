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
        Schema::create('appeal_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_record_id')->constrained()->onDelete('cascade');
            $table->foreignId('review_node_id')->nullable()->constrained()->onDelete('set null');
            
            $table->string('appeal_no', 50)->unique();
            $table->string('appealer_name', 100);
            $table->string('appealer_contact', 50)->nullable();
            $table->string('appealer_type', 30)->default('student');
            
            $table->text('appeal_reason');
            $table->text('appeal_content');
            $table->json('appeal_evidence')->nullable();
            
            $table->timestamp('appealed_at');
            
            $table->text('handling_opinion')->nullable();
            $table->text('final_result')->nullable();
            
            $table->string('status', 30)->default('pending');
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('handled_at')->nullable();
            
            $table->text('reject_reason')->nullable();
            $table->boolean('is_verified')->default(false);
            
            $table->json('metadata')->nullable();
            
            $table->index(['review_record_id', 'status']);
            $table->index(['appealer_name', 'appealed_at']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appeal_records');
    }
};

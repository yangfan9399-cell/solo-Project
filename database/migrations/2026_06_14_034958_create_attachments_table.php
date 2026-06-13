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
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_record_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('review_node_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('appeal_record_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('discrepancy_record_id')->nullable()->constrained()->onDelete('cascade');
            
            $table->string('file_name', 255);
            $table->string('original_name', 255);
            $table->string('file_path', 500);
            $table->string('file_type', 100);
            $table->string('file_size', 50)->nullable();
            $table->string('mime_type', 100)->nullable();
            
            $table->string('attachment_type', 50)->default('evidence');
            $table->text('description')->nullable();
            
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->index(['review_record_id', 'attachment_type']);
            $table->index(['review_node_id', 'attachment_type']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};

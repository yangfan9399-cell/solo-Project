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
        Schema::create('review_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_record_id')->constrained()->onDelete('cascade');
            $table->string('node_type', 50);
            $table->string('node_name', 100);
            $table->string('status', 30)->default('pending');
            $table->integer('sequence')->default(0);
            
            $table->foreignId('operator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('operated_at')->nullable();
            
            $table->text('business_note')->nullable();
            $table->text('site_description')->nullable();
            $table->text('evidence_note')->nullable();
            $table->text('review_opinion')->nullable();
            
            $table->string('action', 50)->nullable();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30)->nullable();
            
            $table->json('snapshot')->nullable();
            $table->json('changes')->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->text('reopen_reason')->nullable();
            $table->foreignId('reopened_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reopened_at')->nullable();
            
            $table->index(['review_record_id', 'sequence']);
            $table->index(['node_type', 'status']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_nodes');
    }
};

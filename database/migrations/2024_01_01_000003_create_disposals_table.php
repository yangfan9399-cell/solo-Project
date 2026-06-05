<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sample_id')->constrained('samples')->onDelete('cascade');
            $table->foreignId('reviewer_id')->constrained('users');
            $table->text('suggestion')->comment('处置建议');
            $table->enum('action', [
                'release',
                'destroy',
                'return_to_origin',
                'reinspection',
                'return_to_sampler'
            ])->comment('处置动作');
            $table->text('decision_note')->nullable()->comment('复核决定备注');
            $table->enum('status', ['pending', 'approved', 'returned', 'archived'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disposals');
    }
};

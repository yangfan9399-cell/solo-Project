<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number')->unique();
            $table->foreignId('waste_batch_id')->constrained();
            $table->foreignId('carrier_id')->constrained();
            $table->date('planned_transfer_date');
            $table->text('destination');
            $table->string('receiver_unit');
            $table->string('status')->default('pending');
            $table->boolean('is_weight_over_limit')->default(false);
            $table->text('weight_remark')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_requests');
    }
};

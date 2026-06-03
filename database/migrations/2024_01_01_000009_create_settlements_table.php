<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settlements', function (Blueprint $table) {
            $table->id();
            $table->string('settlement_no')->unique();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('operator_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('work_amount', 10, 2);
            $table->decimal('fuel_subsidy_amount', 10, 2);
            $table->decimal('total_deduction', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2);
            $table->enum('status', ['pending', 'approved', 'paid']);
            $table->foreignId('settled_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->dateTime('settled_at')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settlements');
    }
};

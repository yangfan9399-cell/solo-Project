<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fuel_subsidies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained('schedules')->cascadeOnDelete();
            $table->decimal('fuel_amount', 8, 2);
            $table->decimal('unit_price', 8, 2);
            $table->decimal('subsidy_rate', 5, 4);
            $table->decimal('total_subsidy', 10, 2);
            $table->dateTime('calculated_at');
            $table->enum('status', ['pending', 'approved', 'paid']);
            $table->foreignId('approved_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fuel_subsidies');
    }
};

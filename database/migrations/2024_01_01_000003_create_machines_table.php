<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('machines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('operator_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['tractor', 'harvester', 'planter', 'sprayer', 'other']);
            $table->string('model');
            $table->string('license_plate');
            $table->decimal('fuel_consumption_rate', 8, 2);
            $table->date('purchase_date')->nullable();
            $table->enum('status', ['available', 'in_use', 'maintenance', 'retired']);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('machines');
    }
};

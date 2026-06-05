<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waste_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number')->unique();
            $table->foreignId('waste_category_id')->constrained();
            $table->foreignId('storage_location_id')->constrained();
            $table->decimal('weight', 10, 2)->comment('重量(kg)');
            $table->text('description')->nullable();
            $table->date('production_date');
            $table->string('status')->default('stored');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waste_batches');
    }
};

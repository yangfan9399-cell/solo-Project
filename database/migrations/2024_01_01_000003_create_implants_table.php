<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('implants', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number', 50)->unique();
            $table->string('brand', 100);
            $table->string('model', 100);
            $table->date('production_date');
            $table->date('expiry_date');
            $table->integer('quantity');
            $table->integer('used_quantity')->default(0);
            $table->boolean('is_recalled')->default(false);
            $table->text('recall_reason')->nullable();
            $table->date('recall_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('implants');
    }
};

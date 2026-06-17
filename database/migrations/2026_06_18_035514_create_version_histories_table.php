<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('version_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plate_id')->constrained('plates')->onDelete('cascade');
            $table->string('version_code', 50);
            $table->string('batch_number', 50)->nullable();
            $table->string('change_type', 30);
            $table->text('change_description')->nullable();
            $table->string('operator', 100)->nullable();
            $table->dateTime('changed_at');
            $table->decimal('plate_width', 8, 2)->nullable();
            $table->decimal('plate_height', 8, 2)->nullable();
            $table->string('material', 30)->nullable();
            $table->text('snapshot_data')->nullable();
            $table->timestamps();

            $table->index(['plate_id']);
            $table->index(['version_code']);
            $table->index(['changed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('version_histories');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spectrum_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tuning_result_record_id')->constrained()->onDelete('cascade');
            $table->decimal('frequency', 10, 2)->comment('频率点(Hz)');
            $table->decimal('amplitude', 10, 4)->comment('振幅');
            $table->decimal('phase', 8, 4)->nullable()->comment('相位');
            $table->boolean('is_harmonic')->default(false)->comment('是否为谐波');
            $table->integer('harmonic_order')->nullable()->comment('谐波阶次');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spectrum_data');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tuning_result_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drum_master_record_id')->constrained()->onDelete('cascade');
            $table->decimal('strike_frequency', 10, 2)->comment('敲击频率(Hz)');
            $table->decimal('target_frequency', 10, 2)->nullable()->comment('目标频率(Hz)');
            $table->string('performance_environment', 100)->comment('演出环境:室内/室外/剧场/露天');
            $table->decimal('ambient_temp', 5, 1)->nullable()->comment('环境温度(°C)');
            $table->decimal('ambient_humidity', 5, 1)->nullable()->comment('环境湿度(%)');
            $table->decimal('ambient_pressure', 7, 1)->nullable()->comment('气压(hPa)');
            $table->text('performance_notes')->nullable()->comment('演出备注');
            $table->text('sound_quality_assessment')->nullable()->comment('音质评价');
            $table->boolean('spectrum_anomaly')->default(false)->comment('频谱是否异常');
            $table->string('anomaly_type', 50)->nullable()->comment('异常类型');
            $table->text('anomaly_description')->nullable()->comment('异常描述');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tuning_result_records');
    }
};

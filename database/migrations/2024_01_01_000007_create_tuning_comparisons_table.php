<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tuning_comparisons', function (Blueprint $table) {
            $table->id();
            $table->string('comparison_name', 150)->comment('比较方案名称');
            $table->text('description')->nullable()->comment('比较说明');
            $table->text('master_record_ids')->comment('参与比较的主记录ID列表(JSON)');
            $table->string('status', 20)->default('pending')->comment('状态:pending/completed/failed');
            $table->text('comparison_result')->nullable()->comment('比较结果数据(JSON)');
            $table->text('conclusion')->nullable()->comment('结论');
            $table->string('recommended_scheme', 100)->nullable()->comment('推荐方案');
            $table->timestamp('completed_at')->nullable()->comment('完成时间');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tuning_comparisons');
    }
};

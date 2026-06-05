<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sample_id')->constrained('samples')->onDelete('cascade');
            $table->foreignId('inspector_id')->constrained('users');
            $table->date('inspection_date')->comment('检测日期');
            $table->text('indicators')->comment('检测指标JSON');
            $table->enum('result', ['qualified', 'pesticide_exceeded', 'other_unqualified'])->comment('检测结果');
            $table->text('conclusion')->comment('检测结论');
            $table->text('report_file')->nullable()->comment('检测报告文件');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_results');
    }
};

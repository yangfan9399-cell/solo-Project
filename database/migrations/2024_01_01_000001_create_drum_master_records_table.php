<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drum_master_records', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number', 50)->unique()->comment('批次号');
            $table->string('version', 20)->default('1.0')->comment('版本号');
            $table->decimal('drum_diameter', 8, 2)->comment('鼓径(英寸)');
            $table->string('musician_name', 100)->comment('乐师姓名');
            $table->date('record_date')->comment('记录日期');
            $table->string('status', 20)->default('draft')->comment('状态:draft/completed/rolled_back');
            $table->text('notes')->nullable()->comment('总体备注');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drum_master_records');
    }
};

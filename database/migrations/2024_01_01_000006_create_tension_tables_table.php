<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tension_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drum_master_record_id')->constrained()->onDelete('cascade');
            $table->string('table_name', 100)->comment('张力表名称');
            $table->string('table_version', 20)->default('1.0')->comment('表版本');
            $table->integer('measurement_point')->comment('测量点');
            $table->decimal('tension_value', 10, 2)->comment('张力值');
            $table->decimal('frequency', 10, 2)->comment('对应频率');
            $table->decimal('deviation', 8, 3)->default(0)->comment('偏差值');
            $table->boolean('is_rollback')->default(false)->comment('是否回滚数据');
            $table->unsignedBigInteger('rollback_from_id')->nullable()->comment('回滚来源ID');
            $table->text('calculation_note')->nullable()->comment('计算备注');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tension_tables');
    }
};

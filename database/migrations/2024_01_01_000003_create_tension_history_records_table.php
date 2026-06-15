<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tension_history_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drum_master_record_id')->constrained()->onDelete('cascade');
            $table->decimal('rope_tension', 10, 2)->comment('拉绳张力(N)');
            $table->string('tension_unit', 10)->default('N')->comment('张力单位');
            $table->integer('measurement_point')->comment('测量点编号');
            $table->decimal('tuning_key_turns', 4, 2)->default(0)->comment('调音扳手转数');
            $table->string('operator', 50)->nullable()->comment('操作者');
            $table->boolean('is_rollback')->default(false)->comment('是否回滚记录');
            $table->unsignedBigInteger('rollback_from_id')->nullable()->comment('回滚来源记录ID');
            $table->text('adjustment_reason')->nullable()->comment('调校原因');
            $table->timestamp('measured_at')->nullable()->comment('测量时间');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tension_history_records');
    }
};

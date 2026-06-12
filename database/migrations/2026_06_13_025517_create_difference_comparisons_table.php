<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('difference_comparisons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inspection_record_id')->comment('安检记录ID');
            $table->foreign('inspection_record_id')->references('id')->on('inspection_records')->onDelete('cascade');

            $table->unsignedBigInteger('from_node_id')->nullable()->comment('起始节点ID');
            $table->foreign('from_node_id')->references('id')->on('record_nodes')->onDelete('set null');

            $table->unsignedBigInteger('to_node_id')->nullable()->comment('目标节点ID');
            $table->foreign('to_node_id')->references('id')->on('record_nodes')->onDelete('set null');

            $table->string('field_name', 100)->comment('字段名');
            $table->string('field_label', 100)->comment('字段显示名');

            $table->text('before_value')->nullable()->comment('处理前值');
            $table->text('after_value')->nullable()->comment('处理后值');

            $table->string('change_type', 50)->comment('变更类型: create=新增, update=修改, delete=删除');

            $table->text('remark')->nullable()->comment('变更说明');

            $table->unsignedBigInteger('operator_id')->comment('操作人ID');
            $table->foreign('operator_id')->references('id')->on('users');

            $table->dateTime('compared_at')->comment('对比时间');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['inspection_record_id', 'field_name']);
            $table->index(['from_node_id', 'to_node_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('difference_comparisons');
    }
};

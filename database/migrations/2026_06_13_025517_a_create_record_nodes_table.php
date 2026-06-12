<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('record_nodes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inspection_record_id')->comment('安检记录ID');
            $table->foreign('inspection_record_id')->references('id')->on('inspection_records')->onDelete('cascade');

            $table->string('node_type', 50)->comment('节点类型: accepted=受理, processing=处理, reviewing=复核, archived=归档, returned=退回, appealed=申诉');
            $table->string('node_name', 50)->comment('节点名称');

            $table->text('description')->nullable()->comment('节点说明');
            $table->text('remark')->nullable()->comment('备注');

            $table->unsignedBigInteger('operator_id')->comment('操作人ID');
            $table->foreign('operator_id')->references('id')->on('users');

            $table->enum('action', [
                'create', 'update', 'submit', 'approve', 'reject', 
                'archive', 'reopen', 'supplement', 'appeal'
            ])->comment('操作动作');

            $table->text('changed_fields')->nullable()->comment('变更字段JSON');
            $table->text('snapshot')->nullable()->comment('数据快照JSON');

            $table->dateTime('operated_at')->comment('操作时间');

            $table->integer('node_order')->default(0)->comment('节点顺序');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['inspection_record_id', 'node_type']);
            $table->index(['operator_id', 'operated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('record_nodes');
    }
};

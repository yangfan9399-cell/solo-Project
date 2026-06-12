<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('abnormal_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inspection_record_id')->comment('安检记录ID');
            $table->foreign('inspection_record_id')->references('id')->on('inspection_records')->onDelete('cascade');

            $table->unsignedBigInteger('record_node_id')->nullable()->comment('关联节点ID');
            $table->foreign('record_node_id')->references('id')->on('record_nodes')->onDelete('set null');

            $table->enum('abnormal_type', [
                'number_conflict', 'amount_difference', 'quantity_difference', 'appeal'
            ])->comment('异常类型: number_conflict=编号冲突, amount_difference=金额差异, quantity_difference=数量差异, appeal=当事人申诉');

            $table->text('blocking_reason')->comment('阻断原因');
            $table->text('difference_fields')->comment('差异字段JSON');
            $table->text('remedy_path')->comment('补救路径');

            $table->enum('resolution_status', ['pending', 'resolved', 'rejected'])
                ->default('pending')->comment('解决状态: pending=待处理, resolved=已解决, rejected=已驳回');

            $table->text('resolution_remark')->nullable()->comment('解决说明');

            $table->unsignedBigInteger('handled_by')->nullable()->comment('处理人ID');
            $table->foreign('handled_by')->references('id')->on('users');

            $table->dateTime('handled_at')->nullable()->comment('处理时间');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['inspection_record_id', 'abnormal_type']);
            $table->index(['resolution_status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abnormal_records');
    }
};

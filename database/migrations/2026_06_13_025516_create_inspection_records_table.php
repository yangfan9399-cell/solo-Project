<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_records', function (Blueprint $table) {
            $table->id();
            $table->string('record_no', 50)->unique()->comment('记录编号');
            $table->string('source', 100)->comment('来源: 如日常巡检、群众举报、上级交办等');
            $table->string('source_no', 50)->nullable()->comment('来源编号');
            
            $table->unsignedBigInteger('current_responsible_id')->comment('当前责任人ID');
            $table->foreign('current_responsible_id')->references('id')->on('users');
            
            $table->string('household_name', 100)->comment('户主姓名');
            $table->string('household_phone', 20)->comment('户主电话');
            $table->string('address', 255)->comment('地址');
            $table->string('gas_meter_no', 50)->nullable()->comment('燃气表编号');
            
            $table->dateTime('inspection_time')->comment('检查时间');
            $table->string('inspector', 50)->comment('检查人员');
            
            $table->text('hidden_danger')->comment('隐患描述');
            $table->string('danger_level', 20)->comment('隐患等级: 一般/较大/重大');
            $table->string('danger_type', 50)->comment('隐患类型');
            
            $table->decimal('involve_amount', 12, 2)->default(0)->comment('涉及金额');
            $table->integer('involve_quantity')->default(0)->comment('涉及数量');
            
            $table->text('evidence_conclusion')->nullable()->comment('证据结论');
            $table->text('handling_basis')->nullable()->comment('采用依据');
            
            $table->enum('status', [
                'accepted', 'processing', 'reviewing', 'approved', 'archived', 
                'returned', 'appealed', 'number_conflict', 'amount_difference'
            ])->default('accepted')->comment('状态');
            
            $table->enum('sample_type', [
                'normal', 'number_conflict', 'amount_difference', 'appeal'
            ])->default('normal')->comment('样本类型');
            
            $table->text('summary')->nullable()->comment('列表摘要');
            $table->text('conclusion')->nullable()->comment('详情结论');
            
            $table->boolean('is_archived')->default(false)->comment('是否归档');
            $table->dateTime('archived_at')->nullable()->comment('归档时间');
            $table->unsignedBigInteger('archived_by')->nullable()->comment('归档人ID');
            
            $table->boolean('has_blocking')->default(false)->comment('是否有阻断');
            $table->text('blocking_reason')->nullable()->comment('阻断原因');
            
            $table->integer('version')->default(1)->comment('版本号');
            $table->unsignedBigInteger('parent_id')->nullable()->comment('父记录ID(重新处理时关联)');
            
            $table->unsignedBigInteger('created_by')->comment('创建人ID');
            $table->foreign('created_by')->references('id')->on('users');
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['record_no', 'status', 'is_archived']);
            $table->index(['current_responsible_id', 'created_by']);
            $table->index(['sample_type', 'danger_level']);
            $table->index(['inspection_time', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_records');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_supplements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inspection_record_id')->comment('安检记录ID');
            $table->foreign('inspection_record_id')->references('id')->on('inspection_records')->onDelete('cascade');

            $table->unsignedBigInteger('record_node_id')->nullable()->comment('关联节点ID');
            $table->foreign('record_node_id')->references('id')->on('record_nodes')->onDelete('set null');

            $table->string('supplement_type', 50)->comment('补充类型: business_record=业务记录, on_site_explain=现场说明, other=其他');
            $table->text('content')->comment('补充内容');

            $table->unsignedBigInteger('operator_id')->comment('操作人ID');
            $table->foreign('operator_id')->references('id')->on('users');

            $table->dateTime('supplemented_at')->comment('补充时间');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['inspection_record_id', 'supplement_type']);
            $table->index(['operator_id', 'supplemented_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_supplements');
    }
};

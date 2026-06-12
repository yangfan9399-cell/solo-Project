<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evidence_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inspection_record_id')->comment('安检记录ID');
            $table->foreign('inspection_record_id')->references('id')->on('inspection_records')->onDelete('cascade');

            $table->unsignedBigInteger('record_node_id')->nullable()->comment('关联节点ID');
            $table->foreign('record_node_id')->references('id')->on('record_nodes')->onDelete('set null');

            $table->string('attachment_type', 50)->comment('附件类型: photo=照片, video=视频, document=文档, other=其他');
            $table->string('file_name', 255)->comment('文件名');
            $table->string('file_path', 500)->comment('文件路径');
            $table->string('file_size', 50)->nullable()->comment('文件大小');
            $table->string('file_mime', 100)->nullable()->comment('MIME类型');

            $table->text('description')->nullable()->comment('附件说明');

            $table->unsignedBigInteger('uploaded_by')->comment('上传人ID');
            $table->foreign('uploaded_by')->references('id')->on('users');

            $table->dateTime('uploaded_at')->comment('上传时间');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['inspection_record_id', 'attachment_type']);
            $table->index(['uploaded_by', 'uploaded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evidence_attachments');
    }
};

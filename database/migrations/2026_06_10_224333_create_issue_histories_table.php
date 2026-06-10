<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('issue_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issue_id')->constrained('inspection_issues')->onDelete('cascade');
            $table->string('action')->comment('操作类型: report(上报), assign(分配整改), rectify(提交整改), review(复查), close(闭环), reject(退回)');
            $table->foreignId('operator_id')->constrained('users')->comment('操作人ID');
            $table->text('note')->nullable()->comment('备注');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issue_histories');
    }
};
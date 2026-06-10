<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->comment('门店ID');
            $table->foreignId('problem_type_id')->constrained('problem_types')->comment('问题类型ID');
            $table->text('description')->comment('问题描述');
            $table->string('status')->comment('状态: pending(待整改), rectifying(整改中), reviewed(已复查), closed(已闭环), rejected(已退回)');
            $table->foreignId('reporter_id')->constrained('users')->comment('上报人ID(督导)');
            $table->foreignId('rectifier_id')->nullable()->constrained('users')->comment('整改人ID');
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->comment('复查人ID(区域经理)');
            $table->foreignId('closer_id')->nullable()->constrained('users')->comment('闭环人ID(运营负责人)');
            $table->dateTime('deadline')->comment('整改截止时间');
            $table->text('rectify_note')->nullable()->comment('整改说明');
            $table->text('review_note')->nullable()->comment('复查意见');
            $table->text('close_note')->nullable()->comment('闭环意见');
            $table->json('photos')->nullable()->comment('整改照片JSON');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_issues');
    }
};
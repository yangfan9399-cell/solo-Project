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
            $table->foreignId('follow_up_id')->constrained()->onDelete('cascade');
            $table->tinyInteger('type')->comment('1=术后感染, 2=病历缺项, 3=其他');
            $table->text('description');
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->tinyInteger('review_status')->default(0)->comment('0=待复核, 1=已通过, 2=需处理');
            $table->text('review_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abnormal_records');
    }
};

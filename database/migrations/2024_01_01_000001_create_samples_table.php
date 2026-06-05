<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('samples', function (Blueprint $table) {
            $table->id();
            $table->string('sample_number')->unique()->comment('样品编号');
            $table->string('product_name')->comment('产品名称');
            $table->string('origin')->comment('产地');
            $table->string('batch_number')->comment('批次号');
            $table->date('production_date')->comment('生产日期');
            $table->decimal('quantity', 10, 2)->comment('抽样数量');
            $table->string('unit')->default('kg')->comment('单位');
            $table->text('sample_source')->nullable()->comment('样品来源补充');
            $table->text('evidence_photos')->nullable()->comment('取证照片JSON');
            $table->foreignId('sampler_id')->constrained('users')->comment('抽样员ID');
            $table->enum('status', [
                'registered',
                'testing',
                'qualified',
                'unqualified',
                'processing',
                'reinspection_applied',
                'returned',
                'archived'
            ])->default('registered')->comment('状态');
            $table->text('conflict_note')->nullable()->comment('编号冲突备注');
            $table->foreignId('conflict_sample_id')->nullable()->constrained('samples')->comment('冲突样品ID');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('samples');
    }
};

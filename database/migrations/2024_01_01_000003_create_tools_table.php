<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tools', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('case_id');
            $table->string('tool_code');
            $table->string('tool_name');
            $table->string('specification')->nullable();
            $table->integer('expected_quantity')->default(1);
            $table->integer('actual_quantity')->default(1);
            $table->decimal('expected_amount', 12, 2)->default(0);
            $table->decimal('actual_amount', 12, 2)->default(0);
            $table->string('status')->default('normal');
            $table->text('remark')->nullable();
            $table->timestamps();

            $table->foreign('case_id')->references('id')->on('tool_cases')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tools');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('responsible_persons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('case_id');
            $table->string('name');
            $table->string('employee_id');
            $table->string('department');
            $table->string('role_in_case');
            $table->text('appeal_content')->nullable();
            $table->dateTime('appealed_at')->nullable();
            $table->timestamps();

            $table->foreign('case_id')->references('id')->on('tool_cases')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('responsible_persons');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_nodes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('case_id');
            $table->string('node_type');
            $table->string('status');
            $table->text('content');
            $table->json('snapshot')->nullable();
            $table->json('changes')->nullable();
            $table->unsignedBigInteger('operator_id');
            $table->string('operator_name');
            $table->string('operator_role');
            $table->timestamps();

            $table->foreign('case_id')->references('id')->on('tool_cases')->onDelete('cascade');
            $table->foreign('operator_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_nodes');
    }
};

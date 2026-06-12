<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tool_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_number')->unique();
            $table->string('title');
            $table->string('type');
            $table->string('status')->default('pending');
            $table->text('source_description');
            $table->dateTime('incident_at');
            $table->string('location');
            $table->string('current_responsible');
            $table->text('business_record')->nullable();
            $table->text('scene_description')->nullable();
            $table->text('conclusion')->nullable();
            $table->text('basis')->nullable();
            $table->text('blocking_reason')->nullable();
            $table->json('diff_fields')->nullable();
            $table->text('remedy_path')->nullable();
            $table->unsignedBigInteger('reported_by');
            $table->unsignedBigInteger('handled_by')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->dateTime('handled_at')->nullable();
            $table->dateTime('reviewed_at')->nullable();
            $table->dateTime('archived_at')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->foreign('reported_by')->references('id')->on('users');
            $table->foreign('handled_by')->references('id')->on('users');
            $table->foreign('reviewed_by')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tool_cases');
    }
};

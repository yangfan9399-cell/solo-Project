<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tuning_suggestions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tuning_session_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('string_index');
            $table->float('current_freq')->nullable();
            $table->float('target_freq')->nullable();
            $table->float('adjustment_cents')->default(0);
            $table->string('action')->default('adjust');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tuning_suggestions');
    }
};

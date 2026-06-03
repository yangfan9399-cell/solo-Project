<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acceptances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained('schedules')->cascadeOnDelete();
            $table->decimal('actual_area', 10, 2);
            $table->unsignedTinyInteger('quality_score');
            $table->text('quality_notes')->nullable();
            $table->foreignId('accepted_by')->constrained('users')->cascadeOnDelete();
            $table->dateTime('accepted_at');
            $table->enum('status', ['pending', 'accepted', 'rejected']);
            $table->string('reject_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acceptances');
    }
};

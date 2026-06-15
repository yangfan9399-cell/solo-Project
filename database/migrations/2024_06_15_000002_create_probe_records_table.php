<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('probe_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')->constrained()->cascadeOnDelete();
            $table->integer('launch_point_x');
            $table->integer('launch_point_y');
            $table->decimal('probe_direction', 8, 4);
            $table->decimal('frequency', 8, 2);
            $table->integer('sequence_number');
            $table->timestamp('launched_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('probe_records');
    }
};

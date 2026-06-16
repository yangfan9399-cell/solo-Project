<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('action_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')->constrained()->cascadeOnDelete();
            $table->enum('action_type', [
                'rotor_change',
                'substitution_add',
                'substitution_remove',
                'note_add',
                'hint_use',
                'undo',
                'submit',
            ]);
            $table->json('before_state')->nullable();
            $table->json('after_state')->nullable();
            $table->text('description')->nullable();
            $table->integer('score_change')->default(0);
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('action_histories');
    }
};

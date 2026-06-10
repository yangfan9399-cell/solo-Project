<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surgery_id')->constrained()->onDelete('cascade');
            $table->foreignId('nurse_id')->constrained('users')->onDelete('cascade');
            $table->date('follow_up_date');
            $table->tinyInteger('type')->comment('1=术后1天, 2=术后7天, 3=术后1个月, 4=术后3个月, 5=术后6个月, 6=术后1年');
            $table->text('notes')->nullable();
            $table->tinyInteger('status')->comment('1=正常, 2=异常, 3=待复核');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('follow_ups');
    }
};

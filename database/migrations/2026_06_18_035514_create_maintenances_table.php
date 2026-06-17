<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plate_id')->constrained('plates')->onDelete('cascade');
            $table->string('maintenance_type', 50);
            $table->text('description')->nullable();
            $table->string('operator', 100)->nullable();
            $table->date('maintenance_date');
            $table->date('next_maintenance_date')->nullable();
            $table->decimal('cost', 10, 2)->default(0);
            $table->string('status', 20)->default('已完成');
            $table->text('remark')->nullable();
            $table->timestamps();

            $table->index(['plate_id']);
            $table->index(['maintenance_date']);
            $table->index(['maintenance_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenances');
    }
};

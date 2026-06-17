<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plates', function (Blueprint $table) {
            $table->id();
            $table->string('plate_code', 50)->unique();
            $table->string('pattern_name', 200);
            $table->text('pattern_description')->nullable();
            $table->text('applicable_books');
            $table->decimal('plate_width', 8, 2);
            $table->decimal('plate_height', 8, 2);
            $table->decimal('plate_thickness', 6, 2)->default(1.5);
            $table->string('material', 30)->default('黄铜');
            $table->unsignedInteger('usage_count')->default(0);
            $table->unsignedInteger('max_usage')->default(5000);
            $table->string('status', 20)->default('正常');
            $table->string('location', 100)->nullable();
            $table->date('manufacture_date')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->date('next_maintenance_date')->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();

            $table->index(['status']);
            $table->index(['plate_code']);
            $table->index(['pattern_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plates');
    }
};

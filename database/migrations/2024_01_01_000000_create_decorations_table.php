<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('decorations', function (Blueprint $table) {
            $table->id();
            $table->string('merchant_name');
            $table->string('merchant_type');
            $table->string('floor');
            $table->string('shop_number');
            $table->date('start_date');
            $table->date('end_date');
            $table->text('construction_scope')->nullable();
            $table->string('hoarding_type');
            $table->decimal('hoarding_width', 8, 2);
            $table->decimal('hoarding_height', 8, 2);
            $table->text('hoarding_description')->nullable();
            $table->text('fire_materials')->nullable();
            $table->boolean('fire_materials_complete')->default(false);
            $table->text('restricted_time')->nullable();
            $table->boolean('time_conflict')->default(false);
            $table->boolean('hoarding_dimension_ok')->default(true);
            $table->string('status')->default('pending');
            $table->text('engineer_comment')->nullable();
            $table->timestamp('engineer_reviewed_at')->nullable();
            $table->text('fire_comment')->nullable();
            $table->timestamp('fire_reviewed_at')->nullable();
            $table->text('manager_comment')->nullable();
            $table->timestamp('manager_approved_at')->nullable();
            $table->text('reject_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('decorations');
    }
};

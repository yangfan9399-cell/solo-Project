<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drum_detail_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drum_master_record_id')->constrained()->onDelete('cascade');
            $table->string('drumhead_material', 50)->comment('鼓皮材质:牛皮/羊皮/合成皮');
            $table->string('drumhead_brand', 100)->nullable()->comment('鼓皮品牌');
            $table->decimal('drumhead_thickness', 6, 3)->nullable()->comment('鼓皮厚度(mm)');
            $table->string('drum_side', 20)->comment('鼓面:batter(击打面)/resonant(共振面)');
            $table->integer('sort_order')->default(0)->comment('排序');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drum_detail_records');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('门店名称');
            $table->string('code')->unique()->comment('门店编号');
            $table->string('region')->comment('区域');
            $table->string('address')->comment('门店地址');
            $table->string('level')->comment('门店等级');
            $table->foreignId('manager_id')->nullable()->constrained('users')->comment('店长ID');
            $table->foreignId('region_manager_id')->nullable()->constrained('users')->comment('区域经理ID');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
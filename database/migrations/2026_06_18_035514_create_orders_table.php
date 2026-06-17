<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plate_id')->constrained('plates')->onDelete('cascade');
            $table->string('order_number', 50)->unique();
            $table->string('book_title', 200);
            $table->string('customer_name', 150)->nullable();
            $table->unsignedInteger('quantity')->default(0);
            $table->date('order_date');
            $table->date('delivery_date')->nullable();
            $table->string('status', 20)->default('进行中');
            $table->decimal('unit_price', 10, 2)->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();

            $table->index(['plate_id']);
            $table->index(['order_number']);
            $table->index(['status']);
            $table->index(['order_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

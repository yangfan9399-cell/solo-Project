<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['business_specialist', 'approval_leader'])->default('business_specialist')->comment('角色: business_specialist=业务专员, approval_leader=审批负责人');
            $table->string('department', 100)->nullable()->comment('所属部门');
            $table->string('phone', 20)->nullable()->comment('联系电话');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'department', 'phone']);
        });
    }
};

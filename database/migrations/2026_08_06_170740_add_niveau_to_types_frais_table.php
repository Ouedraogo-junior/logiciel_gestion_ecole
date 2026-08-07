<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('types_frais', function (Blueprint $table) {
            $table->string('niveau')->nullable()->after('nom');
        });
    }

    public function down(): void
    {
        Schema::table('types_frais', function (Blueprint $table) {
            $table->dropColumn('niveau');
        });
    }
};

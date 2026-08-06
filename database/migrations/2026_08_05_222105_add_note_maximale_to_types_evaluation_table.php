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
        Schema::table('types_evaluation', function (Blueprint $table) {
            $table->decimal('note_maximale', 6, 2)->default(20)->after('ponderation');
        });
    }

    public function down(): void
    {
        Schema::table('types_evaluation', function (Blueprint $table) {
            $table->dropColumn('note_maximale');
        });
    }
};

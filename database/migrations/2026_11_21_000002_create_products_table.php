<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('flavor', 4);            // kode gambar sando: st, mg, kw, mx, bb
            $table->string('tagline', 150)->nullable();
            $table->unsignedInteger('price');
            $table->string('badge', 30)->nullable();
            $table->string('emoji', 8)->nullable();
            $table->string('ingredient', 50)->nullable();
            $table->decimal('rating', 2, 1)->default(4.5);
            $table->unsignedInteger('reviews')->default(0);
            $table->integer('stock')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};

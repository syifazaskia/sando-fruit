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
            $table->string('code', 30)->unique();          // dipakai sebagai order_id di Midtrans
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('recipient', 100);
            $table->string('phone', 20);
            $table->text('address');
            $table->string('note', 200)->nullable();
            $table->string('payment_method', 40);
            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('shipping')->default(0);
            $table->unsignedInteger('total');
            $table->string('status', 20)->default('Menunggu bayar');   // status pesanan
            $table->string('payment_status', 15)->default('pending');  // pending|paid|cod|failed|expired|cancelled
            $table->string('snap_token')->nullable();
            $table->string('midtrans_transaction_id')->nullable();
            $table->string('midtrans_payment_type', 40)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->boolean('stock_restored')->default(false);
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->string('name', 100);
            $table->unsignedInteger('price');
            $table->unsignedInteger('qty');
            $table->timestamps();
        });

        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wishlists');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};

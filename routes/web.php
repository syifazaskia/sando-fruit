<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MidtransController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Middleware\EnsureAdmin;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

// Halaman utama (single page: Dashboard, Product, About, Checkout, Admin, dll.)
Route::view('/', 'app');

// Webhook dari Midtrans (server ke server, jadi tanpa CSRF)
Route::post('/midtrans/notification', [MidtransController::class, 'notification'])
    ->withoutMiddleware([ValidateCsrfToken::class]);

Route::prefix('api')->group(function () {
    Route::get('bootstrap', [ShopController::class, 'bootstrap']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);

    Route::middleware('auth')->group(function () {
        Route::post('wishlist/{product}', [ShopController::class, 'toggleWishlist']);
        Route::post('orders', [ShopController::class, 'storeOrder']);
        Route::get('orders/{code}', [ShopController::class, 'showOrder']);
        Route::post('orders/{code}/sync', [MidtransController::class, 'sync']);
    });

    Route::middleware(['auth', EnsureAdmin::class])->prefix('admin')->group(function () {
        Route::get('summary', [AdminController::class, 'summary']);
        Route::post('stock', [AdminController::class, 'stock']);
        Route::post('orders/{code}/status', [AdminController::class, 'orderStatus']);
    });
});

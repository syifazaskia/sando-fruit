<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // PENTING: id produk harus berurutan 1,2,3,... karena front-end memakai P[id - 1]
        $products = [
            ['id' => 1, 'name' => 'Strawberry Sando', 'flavor' => 'st', 'tagline' => 'Stroberi segar, whipped cream vanila', 'price' => 28000, 'badge' => 'Best Seller', 'emoji' => '🍓', 'ingredient' => 'Strawberry', 'rating' => 4.8, 'reviews' => 120, 'stock' => 25, 'description' => 'Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah stroberi segar. Rasanya manis, creamy, dan menyegarkan.'],
            ['id' => 2, 'name' => 'Sando Mangga', 'flavor' => 'mg', 'tagline' => 'Mangga harum manis, krim keju lembut', 'price' => 30000, 'badge' => null, 'emoji' => '🥭', 'ingredient' => 'Mangga', 'rating' => 4.7, 'reviews' => 86, 'stock' => 18, 'description' => 'Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah mangga harum manis. Rasanya manis legit dan lembut di mulut.'],
            ['id' => 3, 'name' => 'Sando Kiwi', 'flavor' => 'kw', 'tagline' => 'Kiwi asam segar, krim susu', 'price' => 29000, 'badge' => 'Baru', 'emoji' => '🥝', 'ingredient' => 'Kiwi', 'rating' => 4.6, 'reviews' => 54, 'stock' => 12, 'description' => 'Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah kiwi segar. Rasanya segar dengan sedikit asam yang pas.'],
            ['id' => 4, 'name' => 'Sando Mix Fruit', 'flavor' => 'mx', 'tagline' => 'Stroberi, kiwi, dan jeruk mandarin', 'price' => 35000, 'badge' => 'Favorit', 'emoji' => '🍊', 'ingredient' => 'Jeruk', 'rating' => 4.9, 'reviews' => 142, 'stock' => 20, 'description' => 'Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah stroberi, kiwi, dan jeruk mandarin. Rasanya kaya rasa dan menyegarkan.'],
            ['id' => 5, 'name' => 'Sando Blueberry', 'flavor' => 'bb', 'tagline' => 'Blueberry, krim yoghurt', 'price' => 32000, 'badge' => null, 'emoji' => '🫐', 'ingredient' => 'Blueberry', 'rating' => 4.7, 'reviews' => 68, 'stock' => 15, 'description' => 'Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah blueberry. Rasanya manis asam yang lembut.'],
        ];

        foreach ($products as $p) {
            Product::updateOrCreate(['id' => $p['id']], $p);
        }
    }
}

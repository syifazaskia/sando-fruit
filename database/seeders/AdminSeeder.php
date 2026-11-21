<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // GANTI password ini sebelum website dipakai sungguhan!
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Admin',
                'password' => '12345678',
                'phone' => '081234567890',
                'address' => 'Toko Sando Fruit',
                'role' => 'admin',
            ]
        );
    }
}

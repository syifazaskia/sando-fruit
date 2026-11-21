<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'id', 'name', 'flavor', 'tagline', 'price', 'badge', 'emoji',
        'ingredient', 'rating', 'reviews', 'stock', 'description',
    ];

    /** Bentuk data yang dipakai front-end (app.js). */
    public function toFront(): array
    {
        return [
            'id' => $this->id,
            'n' => $this->name,
            'r' => $this->tagline,
            'p' => (int) $this->price,
            'k' => $this->flavor,
            't' => $this->badge ?? '',
            'e' => $this->emoji,
            'el' => $this->ingredient,
            'rt' => (float) $this->rating,
            'rv' => (int) $this->reviews,
            's' => (int) $this->stock,
            'd' => $this->description,
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public const COD = 'Bayar di Tempat (COD)';

    public const METHODS = [
        'BCA', 'Mandiri', 'BNI', 'BRI',
        'GoPay', 'OVO', 'DANA', 'ShopeePay',
        'QRIS', self::COD, 'Kartu Kredit/Debit',
    ];

    public const STATUSES = ['Menunggu bayar', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'];

    protected $fillable = [
        'code', 'user_id', 'recipient', 'phone', 'address', 'note',
        'payment_method', 'subtotal', 'shipping', 'total',
        'status', 'payment_status', 'snap_token',
        'midtrans_transaction_id', 'midtrans_payment_type',
        'paid_at', 'stock_restored',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'stock_restored' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    /** Detail lengkap untuk halaman struk. */
    public function toFront(): array
    {
        $this->loadMissing('items.product');

        return [
            'id' => $this->code,
            'm' => $this->payment_method,
            'nama' => $this->recipient,
            'hp' => $this->phone,
            'al' => $this->address,
            'cat' => $this->note ?? '',
            'sub' => (int) $this->subtotal,
            'ong' => (int) $this->shipping,
            'tot' => (int) $this->total,
            'tgl' => $this->created_at->format('d/m/Y H.i'),
            'status' => $this->status,
            'pay' => $this->payment_status,
            // token hanya dikirim selagi pembayaran masih menunggu
            'snap' => $this->payment_status === 'pending' ? $this->snap_token : null,
            'items' => $this->items->map(fn ($i) => [
                'n' => $i->name,
                'k' => $i->product->flavor ?? 'st',
                'p' => (int) $i->price,
                'q' => (int) $i->qty,
            ])->values()->all(),
        ];
    }

    /** Ringkasan untuk riwayat di dashboard pembeli. */
    public function toHistory(): array
    {
        $this->loadMissing('items.product');
        $first = $this->items->first();

        return [
            'n' => $this->items->pluck('name')->implode(', '),
            'k' => $first?->product->flavor ?? 'st',
            'p' => (int) $this->subtotal,
            'tgl' => $this->created_at->translatedFormat('j M Y'),
            's' => $this->payment_status === 'pending' ? 'Menunggu bayar' : $this->status,
        ];
    }
}

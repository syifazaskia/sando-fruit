<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Penghubung ke Midtrans (Snap). Tanpa paket tambahan: memakai HTTP client bawaan Laravel.
 * Dokumentasi: https://docs.midtrans.com/reference/snap-api-overview
 */
class MidtransService
{
    /**
     * Metode pilihan pembeli -> channel Snap yang ditampilkan.
     * Metode yang tidak ada di daftar (OVO, DANA, QRIS) menampilkan semua channel
     * yang aktif di akun Midtrans kamu.
     */
    private const CHANNELS = [
        'BCA' => ['bca_va'],
        'Mandiri' => ['echannel'],
        'BNI' => ['bni_va'],
        'BRI' => ['bri_va'],
        'GoPay' => ['gopay'],
        'ShopeePay' => ['shopeepay'],
        'Kartu Kredit/Debit' => ['credit_card'],
    ];

    private function serverKey(): string
    {
        return (string) config('midtrans.server_key');
    }

    private function snapBase(): string
    {
        return config('midtrans.is_production') ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
    }

    private function apiBase(): string
    {
        return config('midtrans.is_production') ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
    }

    /** Buat transaksi Snap dan kembalikan token untuk snap.pay() di browser. */
    public function createSnap(Order $order, User $user): array
    {
        $items = $order->items->map(fn ($i) => [
            'id' => 'P'.$i->product_id,
            'price' => (int) $i->price,
            'quantity' => (int) $i->qty,
            'name' => Str::limit($i->name, 50, ''),
        ])->all();

        if ($order->shipping > 0) {
            $items[] = ['id' => 'ONGKIR', 'price' => (int) $order->shipping, 'quantity' => 1, 'name' => 'Ongkos kirim'];
        }

        $name = Str::limit($order->recipient, 50, '');

        $payload = [
            'transaction_details' => [
                'order_id' => $order->code,
                'gross_amount' => (int) $order->total,
            ],
            'item_details' => $items,
            'customer_details' => [
                'first_name' => $name,
                'email' => $user->email,
                'phone' => $order->phone,
                'shipping_address' => [
                    'first_name' => $name,
                    'phone' => $order->phone,
                    'address' => Str::limit($order->address, 200, ''),
                    'country_code' => 'IDN',
                ],
            ],
            'expiry' => ['unit' => 'hours', 'duration' => 24],
        ];

        if (isset(self::CHANNELS[$order->payment_method])) {
            $payload['enabled_payments'] = self::CHANNELS[$order->payment_method];
        }

        $res = Http::withBasicAuth($this->serverKey(), '')
            ->acceptJson()->asJson()->timeout(20)
            ->post($this->snapBase().'/snap/v1/transactions', $payload)
            ->throw()
            ->json();

        return ['token' => $res['token'], 'redirect_url' => $res['redirect_url'] ?? null];
    }

    /** Tanya status transaksi langsung ke Midtrans. */
    public function status(string $orderCode): array
    {
        return Http::withBasicAuth($this->serverKey(), '')
            ->acceptJson()->timeout(20)
            ->get($this->apiBase().'/v2/'.urlencode($orderCode).'/status')
            ->json() ?? [];
    }

    /** signature_key = SHA512(order_id + status_code + gross_amount + ServerKey) */
    public function validSignature(array $n): bool
    {
        $expected = hash('sha512', ($n['order_id'] ?? '').($n['status_code'] ?? '').($n['gross_amount'] ?? '').$this->serverKey());

        return hash_equals($expected, (string) ($n['signature_key'] ?? ''));
    }

    /** Terapkan status Midtrans ke pesanan (aman dipanggil berulang). */
    public function apply(Order $order, array $n): void
    {
        DB::transaction(function () use ($order, $n) {
            $o = Order::whereKey($order->id)->lockForUpdate()->first();
            $ts = $n['transaction_status'] ?? '';
            $fraud = $n['fraud_status'] ?? 'accept';

            $o->midtrans_transaction_id = $n['transaction_id'] ?? $o->midtrans_transaction_id;
            $o->midtrans_payment_type = $n['payment_type'] ?? $o->midtrans_payment_type;

            if (in_array($ts, ['capture', 'settlement'], true) && $fraud === 'accept') {
                if ($o->payment_status !== 'paid') {
                    $o->payment_status = 'paid';
                    $o->paid_at = now();
                    if ($o->status === 'Menunggu bayar') {
                        $o->status = 'Diproses';
                    }
                }
            } elseif (in_array($ts, ['deny', 'failure', 'cancel', 'expire'], true) && $o->payment_status !== 'paid') {
                $o->payment_status = ['deny' => 'failed', 'failure' => 'failed', 'cancel' => 'cancelled', 'expire' => 'expired'][$ts];
                $o->status = 'Dibatalkan';
                $this->restoreStock($o);
            }

            $o->save();
        });
    }

    /** Kembalikan stok sekali saja untuk pesanan yang batal / gagal / kedaluwarsa. */
    public function restoreStock(Order $o): void
    {
        if ($o->stock_restored) {
            return;
        }
        foreach ($o->items as $i) {
            Product::whereKey($i->product_id)->increment('stock', $i->qty);
        }
        $o->stock_restored = true;
    }
}

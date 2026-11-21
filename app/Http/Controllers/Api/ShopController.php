<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ShopException;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ShopController extends Controller
{
    /** Data awal untuk front-end: produk, stok, user, wishlist, riwayat. */
    public function bootstrap(Request $r): JsonResponse
    {
        $u = $r->user();

        return response()->json([
            'csrf' => csrf_token(),
            'user' => $u?->toFront(),
            'products' => Product::orderBy('id')->get()->map->toFront()->values(),
            'wishlist' => $u ? $u->wishlist()->pluck('products.id')->values() : [],
            'orders' => $u
                ? $u->orders()->with('items.product')->latest()->limit(20)->get()->map->toHistory()->values()
                : [],
        ]);
    }

    public function toggleWishlist(Request $r, Product $product): JsonResponse
    {
        $r->user()->wishlist()->toggle($product->id);

        return response()->json(['wishlist' => $r->user()->wishlist()->pluck('products.id')->values()]);
    }

    /** Buat pesanan: cek stok, kurangi stok, lalu minta token pembayaran ke Midtrans. */
    public function storeOrder(Request $r, MidtransService $midtrans): JsonResponse
    {
        $d = $r->validate([
            'name' => 'required|string|max:100',
            'phone' => ['required', 'regex:/^[0-9+\-\s]{8,16}$/'],
            'address' => 'required|string|min:10|max:500',
            'note' => 'nullable|string|max:200',
            'method' => ['required', Rule::in(Order::METHODS)],
            'items' => 'required|array|min:1|max:20',
            'items.*.id' => 'required|integer|exists:products,id',
            'items.*.qty' => 'required|integer|min:1|max:20',
        ]);

        $user = $r->user();
        $qtys = [];
        foreach ($d['items'] as $it) {
            $qtys[$it['id']] = ($qtys[$it['id']] ?? 0) + $it['qty'];
        }
        $cod = $d['method'] === Order::COD;

        try {
            $order = DB::transaction(function () use ($d, $qtys, $user, $cod, $midtrans) {
                // kunci baris produk supaya dua pembeli tidak bisa mengambil stok yang sama
                $products = Product::whereIn('id', array_keys($qtys))->lockForUpdate()->get()->keyBy('id');

                $subtotal = 0;
                foreach ($qtys as $id => $q) {
                    $p = $products[$id];
                    if ($p->stock < $q) {
                        throw new ShopException("Stok {$p->name} tinggal {$p->stock}. Kurangi jumlah pesananmu.");
                    }
                    $subtotal += $p->price * $q;
                }

                $shipping = (int) config('midtrans.shipping');
                $order = Order::create([
                    'code' => 'SF-'.now()->format('ymd').'-'.Str::upper(Str::random(5)),
                    'user_id' => $user->id,
                    'recipient' => $d['name'],
                    'phone' => $d['phone'],
                    'address' => $d['address'],
                    'note' => $d['note'] ?? null,
                    'payment_method' => $d['method'],
                    'subtotal' => $subtotal,
                    'shipping' => $shipping,
                    'total' => $subtotal + $shipping,
                    'status' => $cod ? 'Diproses' : 'Menunggu bayar',
                    'payment_status' => $cod ? 'cod' : 'pending',
                ]);

                foreach ($qtys as $id => $q) {
                    $p = $products[$id];
                    $order->items()->create([
                        'product_id' => $id,
                        'name' => $p->name,
                        'price' => $p->price,
                        'qty' => $q,
                    ]);
                    $p->decrement('stock', $q);
                }

                if (! $cod) {
                    $snap = $midtrans->createSnap($order->load('items'), $user);
                    $order->update(['snap_token' => $snap['token']]);
                }

                return $order;
            });
        } catch (ShopException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            report($e); // detail ada di storage/logs/laravel.log

            return response()->json([
                'message' => 'Gagal membuat pembayaran Midtrans. Cek MIDTRANS_SERVER_KEY di file .env, lalu coba lagi.',
            ], 502);
        }

        return response()->json([
            'order' => $order->fresh('items.product')->toFront(),
            'stock' => Product::pluck('stock', 'id'),
        ]);
    }

    public function showOrder(Request $r, string $code): JsonResponse
    {
        $order = Order::where('code', $code)->with('items.product')->firstOrFail();
        abort_unless($order->user_id === $r->user()->id || $r->user()->isAdmin(), 403);

        return response()->json(['order' => $order->toFront()]);
    }
}

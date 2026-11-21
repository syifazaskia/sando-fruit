<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function summary(): JsonResponse
    {
        $paid = fn () => Order::whereIn('payment_status', ['paid', 'cod']);

        $daily = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = now()->subDays($i);
            $daily[] = [
                'd' => $day->translatedFormat('j M'),
                'v' => (int) $paid()->whereDate('created_at', $day->toDateString())->sum('total'),
            ];
        }

        $orders = Order::with(['items', 'user'])->latest()->limit(100)->get()->map(fn ($o) => [
            'id' => $o->code,
            'nama' => $o->recipient,
            'email' => $o->user?->email,
            'items' => $o->items->map(fn ($i) => $i->name.' ('.$i->qty.'x)')->implode(', '),
            'tot' => (int) $o->total,
            'm' => $o->payment_method,
            'pay' => $o->payment_status,
            'status' => $o->status,
            'tgl' => $o->created_at->format('d/m/Y H.i'),
        ]);

        $customers = User::where('role', 'customer')->withCount('orders')->latest()->limit(100)->get()->map(fn ($u) => [
            'nama' => $u->name,
            'email' => $u->email,
            'hp' => $u->phone,
            'orders' => $u->orders_count,
            'tgl' => $u->created_at->translatedFormat('j M Y'),
        ]);

        return response()->json([
            'stats' => [
                'revenue' => (int) $paid()->sum('total'),
                'orders' => Order::count(),
                'sold' => (int) OrderItem::whereHas('order', fn ($q) => $q->whereIn('payment_status', ['paid', 'cod']))->sum('qty'),
                'customers' => User::where('role', 'customer')->count(),
            ],
            'daily' => $daily,
            'orders' => $orders,
            'customers' => $customers,
        ]);
    }

    /** Tambah / kurangi stok per rasa. */
    public function stock(Request $r): JsonResponse
    {
        $d = $r->validate([
            'product_id' => 'required|integer|exists:products,id',
            'delta' => 'required|integer|between:-9999,9999',
        ]);

        $p = Product::findOrFail($d['product_id']);
        $p->update(['stock' => max(0, $p->stock + $d['delta'])]);

        return response()->json(['stock' => Product::pluck('stock', 'id')]);
    }

    public function orderStatus(Request $r, string $code, MidtransService $midtrans): JsonResponse
    {
        $d = $r->validate(['status' => ['required', Rule::in(Order::STATUSES)]]);
        $order = Order::where('code', $code)->with('items')->firstOrFail();

        $order->status = $d['status'];
        if ($d['status'] === 'Dibatalkan') {
            $midtrans->restoreStock($order); // stok kembali saat pesanan dibatalkan
        }
        $order->save();

        return response()->json(['ok' => true]);
    }
}

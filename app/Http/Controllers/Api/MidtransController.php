<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MidtransController extends Controller
{
    /**
     * Webhook: Midtrans memanggil URL ini setiap status pembayaran berubah.
     * Atur di Dashboard Midtrans > Settings > Payment > Notification URL:
     *   https://domain-kamu.com/midtrans/notification
     */
    public function notification(Request $r, MidtransService $midtrans): JsonResponse
    {
        $n = $r->all();

        if (! $midtrans->validSignature($n)) {
            return response()->json(['message' => 'Signature tidak valid.'], 403);
        }

        $order = Order::where('code', $n['order_id'] ?? '')->first();
        if (! $order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan, diabaikan.']);
        }

        if ((int) round((float) ($n['gross_amount'] ?? 0)) !== (int) $order->total) {
            return response()->json(['message' => 'Nominal tidak cocok.'], 400);
        }

        $midtrans->apply($order, $n);

        return response()->json(['message' => 'OK']);
    }

    /** Dipanggil front-end setelah Snap ditutup / selesai, untuk menarik status terbaru. */
    public function sync(Request $r, string $code, MidtransService $midtrans): JsonResponse
    {
        $order = Order::where('code', $code)->with('items.product')->firstOrFail();
        abort_unless($order->user_id === $r->user()->id || $r->user()->isAdmin(), 403);

        if ($order->payment_status === 'pending') {
            try {
                $status = $midtrans->status($code);
                if (isset($status['transaction_status'])) {
                    $midtrans->apply($order, $status);
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'order' => $order->fresh('items.product')->toFront(),
            'stock' => Product::pluck('stock', 'id'),
        ]);
    }
}

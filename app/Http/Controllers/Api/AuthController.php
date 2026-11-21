<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(Request $r): JsonResponse
    {
        $d = $r->validate([
            'nama' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email',
            'hp' => ['required', 'regex:/^(\+62|62|0)8\d{7,12}$/'],
            'al' => 'required|string|min:10|max:500',
            'password' => 'required|string|min:6|confirmed',
        ], [
            'email.unique' => 'Email ini sudah terdaftar. Silakan masuk.',
            'hp.regex' => 'Nomor WhatsApp tidak valid. Contoh: 081234567890',
            'al.min' => 'Alamat terlalu singkat, tulis alamat selengkap mungkin.',
            'password.confirmed' => 'Konfirmasi password tidak sama.',
            'password.min' => 'Password minimal 6 karakter.',
        ]);

        $user = User::create([
            'name' => $d['nama'],
            'email' => strtolower($d['email']),
            'phone' => preg_replace('/[\s-]/', '', $d['hp']),
            'address' => $d['al'],
            'password' => $d['password'], // di-hash otomatis oleh cast "hashed"
        ]);

        Auth::login($user);
        $r->session()->regenerate();

        return response()->json(['user' => $user->toFront()]);
    }

    public function login(Request $r): JsonResponse
    {
        $d = $r->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'admin' => 'sometimes|boolean',
        ]);
        $adminMode = (bool) ($d['admin'] ?? false);

        $fail = fn () => response()->json([
            'message' => $adminMode
                ? 'Email atau password admin salah.'
                : 'Email atau kata sandi salah. Periksa lagi atau daftar akun baru.',
        ], 422);

        if (! Auth::attempt(['email' => strtolower($d['email']), 'password' => $d['password']])) {
            return $fail();
        }

        $user = Auth::user();
        if ($adminMode && ! $user->isAdmin()) {
            Auth::logout();

            return $fail();
        }

        $r->session()->regenerate();

        return response()->json(['user' => $user->toFront()]);
    }

    public function logout(Request $r): JsonResponse
    {
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();

        return response()->json(['csrf' => csrf_token()]);
    }
}

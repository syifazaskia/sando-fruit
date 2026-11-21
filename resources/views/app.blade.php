<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <meta name="app-url" content="{{ rtrim(url('/'), '/') }}" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
    <title>Sando Fruit</title>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="{{ asset('css/style.css') }}" />
    <link rel="stylesheet" href="{{ asset('css/laravel-extra.css') }}" />
  </head>

  <body>
    <nav id="nav"></nav>
    <main id="app"></main>

    <footer>
      <div class="soc">
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener"
          aria-label="WhatsApp"
          title="WhatsApp"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"
            />
            <path
              d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2.2-1-1 .9c-1-.4-2-1.4-2.4-2.4l.9-1-1-2.2z"
            />
          </svg>
        </a>
        <a href="mailto:halo@sandofruit.com" aria-label="Email" title="Email">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="M3.5 7l8.5 6 8.5-6" />
          </svg>
        </a>
        <a
          href="https://www.tiktok.com/"
          target="_blank"
          rel="noopener"
          aria-label="TikTok"
          title="TikTok"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M10 18.5a3.5 3.5 0 1 1 0-7v-3a6.5 6.5 0 1 0 6.5 6.5V9.5c1 .8 2.2 1.2 3.5 1.2V7.7c-2.2-.2-3.5-1.7-3.5-3.7h-3v10.5"
            />
          </svg>
        </a>
        <a
          href="https://www.instagram.com/"
          target="_blank"
          rel="noopener"
          aria-label="Instagram"
          title="Instagram"
        >
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="5.5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r=".6" />
          </svg>
        </a>
      </div>
      © 2026 Sando Fruit. Dibuat dengan cinta dan krim lembut.
    </footer>

    <div class="toast" id="toast" role="status"></div>

    <!-- Midtrans Snap (Client Key dari file .env) -->
    <script src="{{ config('midtrans.snap_url') }}" data-client-key="{{ config('midtrans.client_key') }}"></script>
    <script src="{{ asset('js/app.js') }}"></script>
    <script src="{{ asset('js/laravel-bridge.js') }}"></script>
  </body>
</html>

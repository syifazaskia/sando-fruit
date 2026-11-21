/* ============================================================
   Sando Fruit  —  jembatan ke backend Laravel (MySQL + Midtrans)
   Dimuat SETELAH app.js. Tampilan tidak berubah; yang diganti
   hanyalah penyimpanan data (localStorage -> database) dan
   pembayaran (simulasi -> Midtrans Snap).
   ============================================================ */
(function () {
  "use strict";

  const BASE = (document.querySelector('meta[name="app-url"]')?.content || "").replace(/\/$/, "");
  let CSRF = document.querySelector('meta[name="csrf-token"]')?.content || "";
  let ADMIN_DATA = null;

  // Data demo lama di browser (termasuk password teks biasa) tidak dipakai lagi
  try { localStorage.removeItem("sf_users"); localStorage.removeItem("sf_hist"); } catch (e) {}

  /* ---------- helper request ---------- */
  async function api(path, method, body) {
    const res = await fetch(BASE + "/api/" + path, {
      method: method || "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": CSRF,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      const err = new Error(data.message || "Terjadi kesalahan (" + res.status + ")");
      err.status = res.status;
      throw err;
    }
    return data;
  }
  const goTo = (h) => (location.hash === "#" + h ? route() : go(h));

  /* ---------- sinkron data dari server ---------- */
  function setStock(map) {
    Object.keys(map).forEach((id) => {
      stock[id] = map[id];
      if (P[id - 1]) P[id - 1].s = map[id];
    });
    pruneCart();
  }
  function pruneCart() {
    Object.keys(cart).forEach((i) => {
      if (!P[i - 1] || !(stock[i] > 0)) delete cart[i];
      else if (cart[i] > stock[i]) cart[i] = stock[i];
    });
    sv("sf_cart", cart);
  }
  function applyData(d) {
    CSRF = d.csrf || CSRF;
    P.length = 0;
    d.products.forEach((p) => P.push(p));
    stock = {};
    P.forEach((p) => (stock[p.id] = p.s));
    user = d.user;
    wish = d.wishlist.map(Number);
    hist = d.orders;
    if (sel >= P.length) sel = 0;
    pruneCart();
  }
  const refresh = () => api("bootstrap").then(applyData);

  async function loadAdmin(rerender) {
    try { ADMIN_DATA = await api("admin/summary"); } catch (e) { ADMIN_DATA = null; }
    if (rerender) route();
  }
  window.loadAdmin = () => loadAdmin(true);

  async function boot() {
    try {
      await refresh();
      if (user && user.admin) await loadAdmin(false);
    } catch (e) {
      toast("Server tidak bisa dihubungi: " + e.message);
    }
    route();
  }

  /* ---------- login / register / logout ---------- */
  window.doLogin = function (e) {
    e.preventDefault();
    const em = document.getElementById("e").value.trim().toLowerCase(),
      pw = document.getElementById("p").value,
      er = document.getElementById("er"),
      adminMode = document.getElementById("am").classList.contains("on");
    er.textContent = "";
    api("login", "POST", { email: em, password: pw, admin: adminMode })
      .then(refresh)
      .then(async () => {
        if (user.admin) {
          await loadAdmin(false);
          toast("Masuk sebagai admin");
          goTo("admin");
        } else {
          toast("Selamat datang kembali!");
          goTo(count() ? "checkout" : "home");
        }
      })
      .catch((err) => (er.textContent = err.message));
    return false;
  };

  window.doReg = function (e) {
    e.preventDefault();
    const g = (i) => document.getElementById(i).value.trim(),
      er = document.getElementById("er"),
      hp = g("hp").replace(/[\s-]/g, "");
    if (!/^(\+62|62|0)8\d{7,12}$/.test(hp)) { er.textContent = "Nomor WhatsApp tidak valid. Contoh: 081234567890"; return false; }
    if (g("al").length < 10) { er.textContent = "Alamat terlalu singkat, tulis alamat selengkap mungkin."; return false; }
    const pw = document.getElementById("p").value;
    if (pw !== document.getElementById("p2").value) { er.textContent = "Konfirmasi password tidak sama."; return false; }
    er.textContent = "";
    api("register", "POST", {
      nama: g("n"), email: g("e").toLowerCase(), hp, al: g("al"),
      password: pw, password_confirmation: document.getElementById("p2").value,
    })
      .then(refresh)
      .then(() => { toast("Akun berhasil dibuat"); goTo(count() ? "checkout" : "home"); })
      .catch((err) => (er.textContent = err.message));
    return false;
  };

  window.logout = function () {
    api("logout", "POST")
      .then((d) => { CSRF = d.csrf || CSRF; })
      .catch(() => {})
      .finally(() => {
        user = null; wish = []; hist = []; order = null; ADMIN_DATA = null;
        toast("Kamu sudah keluar");
        goTo("home");
      });
  };

  /* ---------- wishlist ---------- */
  window.wl = function (id) {
    if (!user) { toast("Masuk dulu untuk memakai wishlist"); go("login"); return; }
    const was = hasW(id);
    api("wishlist/" + id, "POST")
      .then((d) => { wish = d.wishlist.map(Number); toast(was ? "Dihapus dari wishlist" : "Disimpan ke wishlist"); route(); })
      .catch((err) => toast(err.message));
  };

  /* ---------- pembayaran Midtrans ---------- */
  function openSnap(o) {
    if (!window.snap) { toast("Midtrans Snap belum termuat. Cek koneksi internet dan MIDTRANS_CLIENT_KEY."); return; }
    window.snap.pay(o.snap, {
      onSuccess: () => syncOrder(o.id, true),
      onPending: () => syncOrder(o.id, true),
      onError: () => { toast("Pembayaran gagal. Coba lagi."); syncOrder(o.id, true); },
      onClose: () => toast("Jendela pembayaran ditutup. Lanjutkan lewat tombol Bayar sekarang."),
    });
  }
  function syncOrder(code, quiet) {
    return api("orders/" + encodeURIComponent(code) + "/sync", "POST")
      .then((d) => { order = d.order; setStock(d.stock); return refresh(); })
      .then(() => { route(); if (!quiet) toast("Status pembayaran diperbarui"); })
      .catch((err) => toast(err.message));
  }
  window.payNow = () => { if (order && order.snap) openSnap(order); else if (order) syncOrder(order.id); };
  window.cekStatus = () => { if (order) syncOrder(order.id); };

  window.pay = function (sub) {
    if (!user) { toast("Masuk dulu ya"); go("login"); return; }
    const er = document.getElementById("er");
    if (!sub) { er.textContent = "Keranjang masih kosong."; return; }
    const v = (i) => document.getElementById(i).value.trim();
    if (!v("cn") || !/^[0-9+\-\s]{8,16}$/.test(v("cp")) || !v("ca")) { er.textContent = "Lengkapi nama, nomor HP yang valid, dan alamat."; return; }
    if (v("ca").length < 10) { er.textContent = "Alamat terlalu singkat, tulis selengkap mungkin."; return; }
    const m = v("pm");
    if (!m) { er.textContent = "Pilih metode pembayaran."; return; }
    er.textContent = "";
    const btn = document.querySelector('button[onclick^="pay("]');
    if (btn) { btn.disabled = true; btn.textContent = "Memproses..."; }

    api("orders", "POST", {
      name: v("cn"), phone: v("cp"), address: v("ca"), method: m,
      items: Object.keys(cart).map((i) => ({ id: Number(i), qty: cart[i] })),
    })
      .then(async (d) => {
        order = d.order;
        setStock(d.stock);
        cart = {}; sv("sf_cart", cart);
        await refresh();
        route();
        scrollTo(0, 0);
        if (order.snap) openSnap(order);   // buka jendela pembayaran Midtrans
      })
      .catch((err) => {
        er.textContent = err.message;
        if (btn) { btn.disabled = false; btn.textContent = "Buat Pesanan"; }
      });
  };

  /* ---------- struk (status dari Midtrans) ---------- */
  const PAYST = {
    paid: "Pembayaran berhasil", pending: "Menunggu pembayaran", cod: "Pesanan dikonfirmasi",
    failed: "Pembayaran gagal", expired: "Pembayaran kedaluwarsa", cancelled: "Pembayaran dibatalkan",
  };
  window.receipt = function () {
    const o = order;
    let how;
    if (o.pay === "pending") how = `<div class="note">Selesaikan pembayaran ${rp(o.tot)} lewat Midtrans (${esc(o.m)}). Klik <b>Bayar sekarang</b> untuk membuka jendela pembayaran. Setelah membayar, klik <b>Cek status</b> atau tunggu status berubah otomatis.</div>`;
    else if (o.pay === "paid") how = `<div class="note">Pembayaran ${rp(o.tot)} sudah kami terima. Pesananmu sedang disiapkan.</div>`;
    else if (o.pay === "cod") how = `<div class="note">Siapkan uang tunai ${rp(o.tot)} saat kurir tiba.</div>`;
    else how = `<div class="note">Pembayaran tidak selesai dan stok sudah dikembalikan. Silakan buat pesanan baru.</div>`;
    const pend = o.pay === "pending";
    return `<div class="box" style="max-width:640px;margin:20px auto"><span class="ok">${PAYST[o.pay] || o.status}</span><h2 style="margin-top:12px">Terima kasih, ${esc(o.nama.split(" ")[0])}!</h2><p style="color:var(--muted);margin:0 0 14px">Nomor pesanan <b>${esc(o.id)}</b> · ${esc(o.tgl)}</p>
${o.items.map((i) => `<div class="item">${sando(i.k)}<div class="n">${esc(i.n)}<small>${i.q} x ${rp(i.p)}</small></div><b>${rp(i.p * i.q)}</b></div>`).join("")}
<div class="tot" style="margin-top:10px"><span>Subtotal</span><span>${rp(o.sub)}</span></div><div class="tot"><span>Ongkir</span><span>${rp(o.ong)}</span></div><div class="tot g"><span>Total</span><span>${rp(o.tot)}</span></div>
<h3 style="margin-top:22px">Pembayaran: ${esc(o.m)}</h3>${how}<h3 style="margin-top:22px">Dikirim ke</h3><p style="margin:0">${esc(o.nama)} (${esc(o.hp)})<br>${esc(o.al)}</p>
<div class="row">${pend ? `<button class="btn" onclick="payNow()">Bayar sekarang</button><button class="btn o" onclick="cekStatus()">Cek status</button>` : ""}<a class="btn${pend ? " o" : ""}" href="#produk" onclick="order=null">Belanja lagi</a><a class="btn o" href="#home" onclick="order=null">Ke dashboard</a></div></div>`;
  };

  /* ---------- halaman admin (data asli dari database) ---------- */
  window.adm = function (id, sign) {
    if (!(user && user.admin)) return;
    const n = Math.floor(Number(document.getElementById("add" + id).value));
    if (!(n > 0) || n > 9999) { toast("Isi jumlah antara 1 dan 9999"); return; }
    const lama = stock[id];
    api("admin/stock", "POST", { product_id: id, delta: sign * n })
      .then((d) => { setStock(d.stock); toast(P[id - 1].n + ": stok " + lama + " → " + stock[id]); route(); })
      .catch((err) => toast(err.message));
  };
  window.admStatus = function (code, val) {
    api("admin/orders/" + encodeURIComponent(code) + "/status", "POST", { status: val })
      .then(refresh)
      .then(() => { toast("Status pesanan diperbarui"); return loadAdmin(true); })
      .catch((err) => toast(err.message));
  };
  const PAYLBL = { paid: "Lunas", pending: "Menunggu", cod: "COD", failed: "Gagal", expired: "Kedaluwarsa", cancelled: "Dibatalkan" };
  const STS = ["Menunggu bayar", "Diproses", "Dikirim", "Selesai", "Dibatalkan"];
  const sm = (t) => `<small style="display:block;font-weight:400">${t}</small>`;

  V.admin = function () {
    const a = ADMIN_DATA;
    if (!a) return `<p>Memuat data admin... <button class="btn s" onclick="loadAdmin()">Muat ulang</button></p>`;
    const s = a.stats, max = Math.max(1, ...a.daily.map((x) => x.v));
    const st = (e, t, n, sub) => `<div class="s"><span class="di" aria-hidden="true">${e}</span><h3>${t}</h3><b>${n}</b><small>${sub}</small></div>`;
    const bars = a.daily.map((x) => `<div style="flex:1;text-align:center;font-size:.75rem"><div style="height:120px;display:flex;align-items:flex-end;justify-content:center"><div title="${rp(x.v)}" style="width:70%;max-width:44px;height:${Math.max(4, Math.round((x.v / max) * 120))}px;background:#edaec7;border-radius:20px 20px 0 0"></div></div>${esc(x.d)}</div>`).join("");
    const orders = a.orders.length
      ? `<div class="tw"><table style="min-width:780px"><thead><tr><th>No.pesanan</th><th>Pelanggan</th><th>Produk</th><th>Total</th><th>Pembayaran</th><th>Status</th></tr></thead><tbody>${a.orders.map((o) => `<tr><td>${esc(o.id)}${sm(esc(o.tgl))}</td><td>${esc(o.nama)}${sm(esc(o.email || ""))}</td><td>${esc(o.items)}</td><td>${rp(o.tot)}</td><td>${esc(o.m)}${sm("<b>" + (PAYLBL[o.pay] || o.pay) + "</b>")}</td><td><select class="lv-ss" aria-label="Status ${esc(o.id)}" onchange="admStatus('${esc(o.id)}',this.value)">${STS.map((x) => `<option${x === o.status ? " selected" : ""}>${x}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div>`
      : `<p style="margin:6px 0 0">Belum ada pesanan masuk.</p>`;
    const cust = a.customers.length
      ? `<div class="tw"><table style="min-width:560px"><thead><tr><th>Nama</th><th>Email</th><th>WhatsApp</th><th>Pesanan</th><th>Daftar</th></tr></thead><tbody>${a.customers.map((c) => `<tr><td>${esc(c.nama)}</td><td>${esc(c.email)}</td><td>${esc(c.hp || "-")}</td><td>${c.orders}</td><td>${esc(c.tgl)}</td></tr>`).join("")}</tbody></table></div>`
      : `<p style="margin:6px 0 0">Belum ada pelanggan.</p>`;
    return `<h1 style="font-size:clamp(1.8rem,4vw,2.4rem);margin:0 0 18px">Dashboard Admin</h1>
<section class="dbs">${st("💰", "Total Penjualan", rp(s.revenue), "pesanan lunas + COD")}${st("🛒", "Pesanan", s.orders, "semua pesanan")}${st("💗", "Sando Terjual", s.sold, "porsi")}${st("👤", "Pelanggan", s.customers, "akun terdaftar")}</section>
<section class="dc" style="margin:18px 0"><div class="dh"><span aria-hidden="true">📦</span><h3 style="font-size:1.05rem">Kelola Stok</h3><small style="margin-left:auto">Total ${P.reduce((t, p) => t + stock[p.id], 0)} pcs</small></div><div class="tw"><table><thead><tr><th>Rasa</th><th>Harga</th><th>Stok</th><th>Ubah stok</th></tr></thead><tbody>${P.map((p) => `<tr><td>${p.e} ${esc(p.n)}</td><td>${rp(p.p)}</td><td><b style="color:${stock[p.id] <= 5 ? "#c0143c" : "inherit"}">${stock[p.id]}</b></td><td style="white-space:nowrap"><input class="lv-in" id="add${p.id}" type="number" min="1" max="9999" value="10" aria-label="Jumlah"> <button class="btn o s" onclick="adm(${p.id},-1)">−</button> <button class="btn s" onclick="adm(${p.id},1)">+</button></td></tr>`).join("")}</tbody></table></div></section>
<section class="dc" style="margin:18px 0"><div class="dh"><span aria-hidden="true">📈</span><h3 style="font-size:1.05rem">Penjualan 7 Hari Terakhir</h3></div><div class="lv-bar">${bars}</div></section>
<section class="dc" style="margin:18px 0"><div class="dh"><span aria-hidden="true">🧾</span><h3 style="font-size:1.05rem">Semua Pesanan</h3><button class="btn o s" style="margin-left:auto" onclick="loadAdmin()">Muat ulang</button></div>${orders}</section>
<section class="dc" style="margin:18px 0"><div class="dh"><span aria-hidden="true">👤</span><h3 style="font-size:1.05rem">Pelanggan</h3></div>${cust}</section>`;
  };

  // buka #admin -> ambil data terbaru
  addEventListener("hashchange", () => {
    if (location.hash === "#admin" && user && user.admin) loadAdmin(true);
  });

  boot();
})();

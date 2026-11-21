// ============================================================
// DATA PRODUK & METODE PEMBAYARAN
// ============================================================
const P = [
  {
    id: 1,
    n: "Strawberry Sando",
    r: "Stroberi segar, whipped cream vanila",
    p: 28000,
    k: "st",
    t: "Best Seller",
    e: "🍓",
    el: "Strawberry",
    rt: 4.8,
    rv: 120,
    s: 25, // stok awal (pcs)
    d: "Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah stroberi segar. Rasanya manis, creamy, dan menyegarkan.",
  },
  {
    id: 2,
    n: "Sando Mangga",
    r: "Mangga harum manis, krim keju lembut",
    p: 30000,
    k: "mg",
    t: "",
    e: "🥭",
    el: "Mangga",
    rt: 4.7,
    rv: 86,
    s: 18, // stok awal (pcs)
    d: "Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah mangga harum manis. Rasanya manis legit dan lembut di mulut.",
  },
  {
    id: 3,
    n: "Sando Kiwi",
    r: "Kiwi asam segar, krim susu",
    p: 29000,
    k: "kw",
    t: "Baru",
    e: "🥝",
    el: "Kiwi",
    rt: 4.6,
    rv: 54,
    s: 12, // stok awal (pcs)
    d: "Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah kiwi segar. Rasanya segar dengan sedikit asam yang pas.",
  },
  {
    id: 4,
    n: "Sando Mix Fruit",
    r: "Stroberi, kiwi, dan jeruk mandarin",
    p: 35000,
    k: "mx",
    t: "Favorit",
    e: "🍊",
    el: "Jeruk",
    rt: 4.9,
    rv: 142,
    s: 20, // stok awal (pcs)
    d: "Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah stroberi, kiwi, dan jeruk mandarin. Rasanya kaya rasa dan menyegarkan.",
  },
  {
    id: 5,
    n: "Sando Blueberry",
    r: "Blueberry, krim yoghurt",
    p: 32000,
    k: "bb",
    t: "",
    e: "🫐",
    el: "Blueberry",
    rt: 4.7,
    rv: 68,
    s: 15, // stok awal (pcs)
    d: "Sando buah dengan roti tawar lembut, whipped cream yang creamy, dan potongan buah blueberry. Rasanya manis asam yang lembut.",
  },
];
const PAY = [
  ["Transfer Bank (Virtual Account)", ["BCA", "Mandiri", "BNI", "BRI"]],
  ["E-Wallet", ["GoPay", "OVO", "DANA", "ShopeePay"]],
  ["Lainnya", ["QRIS", "Bayar di Tempat (COD)", "Kartu Kredit/Debit"]],
];
const ONGKIR = 10000;
const ADMIN = { email: "admin@gmail.com", pw: "12345678" };
const ADMIN_EMAILS = ["admin@gmail.com", "admin@sando.com"]; // akun admin (demo, hanya di sisi browser)
// ============================================================
// UTILITAS & PENYIMPANAN (localStorage)
// ============================================================
const rp = (n) => "Rp" + n.toLocaleString("id-ID");
const mem = {};
const ld = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch (e) {
    return mem[k] ?? d;
  }
};
const sv = (k, v) => {
  mem[k] = v;
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
};
// ============================================================
// STATE APLIKASI
// ============================================================
let sel = 0; // rasa yang dipilih di halaman Product
let qty = 1; // jumlah yang dipilih
let users = ld("sf_users", []); // akun terdaftar
let user = ld("sf_user", null); // akun yang sedang login
let cart = ld("sf_cart", {}); // keranjang: {idProduk: jumlah}
let hist = ld("sf_hist", []); // riwayat pesanan
let wish = ld("sf_wish", []); // wishlist: daftar id produk
let order = null; // pesanan terakhir (untuk struk)
Object.keys(cart).forEach((i) => {
  if (!P[i - 1]) delete cart[i];
});
// ---- Stok per rasa (tersimpan di localStorage) ----
let stock = ld("sf_stock", {}); // sisa stok: {idProduk: jumlah}
P.forEach((p) => {
  if (typeof stock[p.id] !== "number") stock[p.id] = p.s;
});
sv("sf_stock", stock);
Object.keys(cart).forEach((i) => {
  cart[i] = Math.min(cart[i], stock[i]);
  if (cart[i] <= 0) delete cart[i];
});
const left = (id) => Math.max(0, stock[id] - (cart[id] || 0)); // sisa yang masih boleh dimasukkan ke keranjang
const stokTag = (id) => {
  const s = stock[id];
  return s <= 0
    ? `<span class="sk out">Stok habis</span>`
    : s <= 5
      ? `<span class="sk low">Sisa ${s}</span>`
      : `<span class="sk">Stok ${s}</span>`;
};
function resetStok() {
  P.forEach((p) => (stock[p.id] = p.s));
  sv("sf_stock", stock);
  toast("Stok dikembalikan ke awal");
  route();
}

// ============================================================
// GAMBAR SANDO (SVG)
// ============================================================
function sando(k, w) {
  const c = (x, y, r, f, i) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>` +
    (i ? `<circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="${i}"/>` : "");
  let f = "";
  if (k == "st")
    f = [58, 100, 142]
      .map((x) => c(x, 78, 19, "#f0476f", "#ffb3c4") + c(x, 78, 4, "#fff"))
      .join("");
  if (k == "mg")
    f = [55, 100, 145]
      .map(
        (x) =>
          `<rect x="${x - 20}" y="62" width="40" height="32" rx="12" fill="#ffb627"/><rect x="${x - 14}" y="68" width="28" height="20" rx="8" fill="#ffd36b"/>`,
      )
      .join("");
  if (k == "kw")
    f = [58, 100, 142]
      .map(
        (x) =>
          c(x, 78, 19, "#7fb43a", "#c5e384") +
          c(x, 78, 5, "#f4ffd6") +
          `<circle cx="${x}" cy="78" r="10" fill="none" stroke="#2c3a12" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round"/>`,
      )
      .join("");
  if (k == "mx")
    f =
      c(52, 78, 17, "#f0476f", "#ffb3c4") +
      c(52, 78, 3, "#fff") +
      c(100, 78, 18, "#7fb43a", "#c5e384") +
      c(100, 78, 4, "#f4ffd6") +
      c(148, 78, 17, "#ff9a3c", "#ffc17a") +
      `<path d="M148 62v32M132 78h32" stroke="#fff3" stroke-width="2"/>`;
  if (k == "bb")
    f = [
      [50, 80],
      [72, 70],
      [95, 84],
      [118, 70],
      [140, 82],
      [158, 72],
      [84, 96],
      [128, 96],
    ]
      .map(
        ([x, y]) =>
          c(x, y, 10, "#4b4aa8") +
          `<circle cx="${x}" cy="${y}" r="3" fill="#8f8ee0"/>`,
      )
      .join("");
  if (k == "pc")
    f =
      [58, 100, 142]
        .map(
          (x) =>
            `<ellipse cx="${x}" cy="78" rx="19" ry="17" fill="#ffe28a"/><ellipse cx="${x}" cy="78" rx="12" ry="10" fill="#fff1bd"/>`,
        )
        .join("") +
      `<path d="M30 60q20 18 40 0t40 0 40 0 20 6" fill="none" stroke="#6b3a24" stroke-width="5" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 200 150" ${w ? 'width="' + w + '"' : ""} role="img" aria-label="Gambar ${k}"><ellipse cx="100" cy="138" rx="80" ry="7" fill="#c93d6b" opacity=".15"/><rect x="20" y="92" width="160" height="38" rx="19" fill="#fff6e6" stroke="#efd6b3" stroke-width="2"/><rect x="24" y="52" width="152" height="52" rx="14" fill="#fffafc"/>${f}<rect x="20" y="22" width="160" height="40" rx="20" fill="#fff6e6" stroke="#efd6b3" stroke-width="2"/><path d="M42 36q58-10 116 0" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`;
}
// ============================================================
// HELPER UI
// ============================================================
const toast = (m) => {
  const t = document.getElementById("toast");
  t.textContent = m;
  t.classList.add("show");
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove("show"), 1800);
};
const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
const go = (h) => {
  location.hash = h;
};
// ============================================================
// KERANJANG & PILIH RASA
// ============================================================
function chg(id, d) {
  if (d > 0 && left(id) <= 0) {
    toast("Stok " + P[id - 1].n + " tidak cukup");
    return;
  }
  cart[id] = (cart[id] || 0) + d;
  if (cart[id] <= 0) delete cart[id];
  sv("sf_cart", cart);
  route();
}
function pk(i) {
  sel = i;
  qty = 1;
  route();
}
// ---- Wishlist ----
const hasW = (id) => wish.includes(id);
function wl(id) {
  wish = hasW(id) ? wish.filter((x) => x != id) : [...wish, id];
  sv("sf_wish", wish);
  toast(hasW(id) ? "Disimpan ke wishlist" : "Dihapus dari wishlist");
  route();
}
function wAdd(id) {
  if (left(id) <= 0) {
    toast(stock[id] <= 0 ? "Stok habis" : "Stok di keranjang sudah penuh");
    return;
  }
  cart[id] = (cart[id] || 0) + 1;
  sv("sf_cart", cart);
  toast("Ditambahkan ke keranjang");
  route();
}
function wSee(i) {
  sel = i;
  qty = 1;
  go("produk");
}

function qd(d) {
  const mx = Math.max(1, Math.min(20, left(P[sel].id)));
  if (d > 0 && qty >= mx) {
    toast(
      mx >= 20 ? "Maksimal 20 per pesanan" : "Stok tinggal " + left(P[sel].id),
    );
    return;
  }
  qty = Math.max(1, Math.min(mx, qty + d));
  route();
}

function addQ(buy) {
  const id = P[sel].id;
  if (left(id) < qty) {
    toast(left(id) ? "Stok tinggal " + left(id) : "Stok habis");
    qty = Math.max(1, left(id));
    route();
    return;
  }
  cart[id] = (cart[id] || 0) + qty;
  sv("sf_cart", cart);
  qty = 1;
  buy ? go("checkout") : (toast("Ditambahkan ke keranjang"), route());
}
// ============================================================
// NAVIGASI
// ============================================================
function nav() {
  const r = (location.hash || "#home").slice(1);
  const l = (h, t) =>
    `<a class="l ${r == h ? "on" : ""}" href="#${h}">${t}</a>`;
  document.getElementById("nav").innerHTML =
    `<a class="logo" href="#home"><span class="mk">🍓</span>Sando Fruit</a>${l("home", "Dashboard")}${user && user.admin ? l("admin", "Admin") : ""}${l("tentang", "About")}${l("wishlist", "Wishlist (" + wish.length + ")")}${l("produk", "Product")}${l("checkout", "Checkout (" + count() + ")")}` +
    (user
      ? `<span style="font-weight:700">Hai, ${esc(user.nama.split(" ")[0])}</span><button class="btn o s" onclick="logout()">Keluar</button>`
      : `<a class="btn o s" href="#login">Masuk</a><a class="btn s" href="#register">Daftar</a>`);
}
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function logout() {
  user = null;
  sv("sf_user", null);
  toast("Kamu sudah keluar");
  go("home");
}

// ============================================================
// ASET GAMBAR
// ============================================================
const FOTO_STRAWBERRY = "assets/strawberry-sando.jpg";
const FOTO_ABOUT = "assets/about.jpg";
// ============================================================
// KERANGKA HALAMAN LOGIN / REGISTER
// ============================================================
const auth = (f) =>
  `<section class="auth"><div class="side"><svg viewBox="0 0 360 120" style="overflow:visible" role="img" aria-label="Sando Fruit"><path id="arc" d="M10 95Q180 5 350 95" fill="none"/><text font-family="'Be Vietnam Pro',system-ui,sans-serif" font-size="34" font-weight="800" fill="#fff" letter-spacing="1"><textPath href="#arc" startOffset="50%" text-anchor="middle">SANDO FRUIT</textPath></text></svg><p>Fresh • Sweet • Delicious</p></div>${f}</section>`;
// ============================================================
// HALAMAN  (satu halaman = satu fungsi yang mengembalikan HTML)
// ============================================================
const V = {
  // ---- Halaman About ----
  tentang:
    () => `<section class="ab"><div class="tx"><span class="chip">Tentang kami</span><h1>Fresh, Sweet &amp; Delicious dalam setiap gigitan.</h1><p>Sando Fruit hadir untuk membawa sandwich buah yang segar, lembut, dan cantik ke meja kamu.</p><div class="row" style="margin-top:10px"><a class="btn" href="#produk">Lihat Produk</a><a class="btn w" href="https://wa.me/6281234567890" target="_blank" rel="noopener">Hubungi Kami</a></div><div class="soc" style="justify-content:flex-start;margin:18px 0 0">       <a href="https://wa.me/6281234567890" target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp"><svg viewBox="0 0 24 24"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2.2-1-1 .9c-1-.4-2-1.4-2.4-2.4l.9-1-1-2.2z"/></svg></a>       <a href="mailto:halo@sandofruit.com" aria-label="Email" title="Email"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/></svg></a>       <a href="https://www.tiktok.com/" target="_blank" rel="noopener" aria-label="TikTok" title="TikTok"><svg viewBox="0 0 24 24"><path d="M10 18.5a3.5 3.5 0 1 1 0-7v-3a6.5 6.5 0 1 0 6.5 6.5V9.5c1 .8 2.2 1.2 3.5 1.2V7.7c-2.2-.2-3.5-1.7-3.5-3.7h-3v10.5"/></svg></a>       <a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></a>     </div></div><img class="ph" src="${FOTO_ABOUT}" alt="Sandwich buah dengan stroberi, kiwi, dan jeruk"></section>
<section class="stats"><div><b>1021</b>Pelanggan Puas</div><div><b>5</b>Varian Produk</div><div><b>631</b>Pesanan Terkirim</div><div><b>9.5/10</b>Rating Rata-Rata</div></section>
<h2 class="vt">Nilai yang Kami Pegang</h2>
<section class="vals"><div><span class="ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M5 19C5 9 11 5 19 5c0 8-4 14-14 14zM5 19l8-8"/></svg></span><h3>Fresh</h3><p>Buah dipilih setiap hari agar rasa dan teksturnya tetap terbaik.</p></div><div><span class="ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg></span><h3>Sweet</h3><p>Manis yang seimbang, dibuat dengan perhatian untuk setiap pelanggan.</p></div><div><span class="ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/></svg></span><h3>Delicious</h3><p>Resep yang konsisten supaya setiap gigitan terasa seperti yang pertama.</p></div></section>`,

  // ---- Halaman Product ----
  produk: () => {
    const p = P[sel];
    const main =
      p.k == "st"
        ? `<img src="${FOTO_STRAWBERRY}" alt="${p.n}">`
        : `<div class="sv">${sando(p.k)}</div>`;
    return `<section class="pd"><div><div class="main">${main}</div><p class="pl">Pilih rasa:</p><div class="th">${P.map((x, i) => `<button aria-pressed="${i == sel}" onclick="pk(${i})"${stock[x.id] <= 0 ? ' class="soldout"' : ""}><span class="tp">${sando(x.k)}</span>${x.n.replace(/ ?Sando ?/, "")}<br>${stokTag(x.id)}</button>`).join("")}</div><button class="rst" onclick="resetStok()">Isi ulang stok (demo)</button></div>
 <div class="info"><span class="chip" style="background:#f9d3e0">${p.t || "Sando Fruit"}</span><h1>${p.n}</h1><div class="pr">${rp(p.p)} /pcs</div><div class="rt"><span class="st" aria-label="Rating ${p.rt} dari 5">★★★★★</span> ${p.rt} (${p.rv} reviews)</div><p class="ds">${p.d}</p>
 <div class="stok ${stock[p.id] <= 0 ? "out" : stock[p.id] <= 5 ? "low" : ""}"><b>${stock[p.id] <= 0 ? "Stok habis" : "Stok tersedia: " + stock[p.id] + " pcs"}</b>${stock[p.id] > 0 && stock[p.id] <= 5 ? " · segera habis" : ""}${cart[p.id] ? ` · ${cart[p.id]} di keranjangmu` : ""}</div>
 <div class="jm"><b>Jumlah</b><span class="stp"><button aria-label="Kurangi" onclick="qd(-1)"${qty <= 1 || !left(p.id) ? " disabled" : ""}>−</button><span>${left(p.id) ? qty : 0}</span><button aria-label="Tambah" onclick="qd(1)"${qty >= Math.min(20, left(p.id)) ? " disabled" : ""}>+</button></span><span style="margin-left:auto;color:var(--muted)">Total <b style="color:var(--btn)">${rp(left(p.id) ? p.p * qty : 0)}</b></span></div>
 <div class="cta"><button class="btn" onclick="addQ()"${left(p.id) ? "" : " disabled"}>${stock[p.id] <= 0 ? "Stok Habis" : left(p.id) ? "Add to Cart" : "Stok di Keranjang Penuh"}</button><button class="btn o" onclick="addQ(1)"${left(p.id) ? "" : " disabled"}>Buy Now</button></div>
 <button class="wlb${hasW(p.id) ? " on" : ""}" aria-pressed="${hasW(p.id)}" onclick="wl(${p.id})"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" fill="${hasW(p.id) ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>${hasW(p.id) ? "Tersimpan di Wishlist" : "Simpan ke Wishlist"}</button>
 <div class="feat"><div><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19C5 9 11 5 19 5c0 8-4 14-14 14zM5 19l8-8"/></svg><span>Bahan Fresh Berkualitas</span></div><div><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/></svg><span>Disimpan dalam Suhu Dingin</span></div><div><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6zM9 12l2 2 4-4"/></svg><span>Tanpa Pengawet</span></div><div><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 6h11v10H2zM13 9h4l3 3v4h-7M6 19.5h.01M17 19.5h.01"/></svg><span>Pengiriman Cepat</span></div></div></div></section>
 <section class="dt"><div><h3>Detail Produk</h3><p>Sando buah adalah sandwich khas Jepang yang terbuat dari roti tawar lembut, whipped cream yang creamy, dan buah segar pilihan. Cocok untuk kamu yang ingin cemilan manis, sehat, dan menyegarkan.</p></div><div><h3>Bahan &amp; Isi</h3><div class="ing"><div><span>${p.e}</span>${p.el}</div><div><span>🍞</span>Roti Tawar</div><div><span>🍦</span>Whipped Cream</div></div></div><div><h3>Kenapa Harus Sando?</h3><ul><li>Menggunakan buah yang segar</li><li>Rasanya manis</li><li>Lembut di mulut</li><li>Cocok untuk segala suasana</li></ul></div></section>`;
  },

  // ---- Halaman Dashboard (Home) ----
  home: () => {
    const nm = user ? esc(user.nama.split(" ")[0]) : "everyone";
    const ico = (d) =>
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    const arr = `<svg class="ar" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`;
    const bag = `<svg class="bg" viewBox="6 28 112 88" aria-hidden="true"><g transform="rotate(8 80 70)"><path d="M62 38h44v68H62z" fill="#fff"/><path d="M62 38h44l-6 12H68z" fill="#f6d0dd"/><text x="84" y="80" text-anchor="middle" font-family="'Be Vietnam Pro',sans-serif" font-size="11" font-weight="800" fill="#c8245a">Sando</text><circle cx="72" cy="94" r="3" fill="#edaec7"/><circle cx="84" cy="97" r="3" fill="#edaec7"/><circle cx="96" cy="94" r="3" fill="#edaec7"/></g><g transform="rotate(-6 40 80)"><path d="M16 56h46v52H16z" fill="#fff"/><path d="M16 56h46l-5 10H21z" fill="#f6d0dd"/><text x="39" y="88" text-anchor="middle" font-family="'Be Vietnam Pro',sans-serif" font-size="10" font-weight="800" fill="#c8245a">Sando</text></g></svg>`;
    const heart = `<svg class="hr" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" fill="#f48fb1"/></svg>`;
    const rows = hist.length
      ? hist.slice(0, 3)
      : [
          {
            n: "Strawberry Sando",
            k: "st",
            p: 28000,
            tgl: "12 Sep 2026",
            s: "Delivered",
          },
        ];
    const pic = (k) =>
      k == "st" ? `<img src="${FOTO_STRAWBERRY}" alt="">` : sando(k);
    const go2 = `document.getElementById('ro').scrollIntoView({behavior:'smooth'});return false`;
    const qa = (i, t, a, hf) =>
      `<a class="qa" href="${hf || "#home"}" ${a}><span class="qi">${i}</span>${t}${arr}</a>`;
    return `<section class="hd"><h1>Hello, ${nm}!</h1><p class="wb"><span>Welcome back to Sando</span>${heart}</p>
 <div class="h1r"><div class="h3">
  <a class="hs" href="#home" onclick="${go2}"><span class="hi">${ico('<rect x="4" y="6" width="16" height="13" rx="3"/><path d="M4 11h16"/>')}</span><span class="hl"><small>My Orders</small><b>${12 + hist.length}</b><em>View Orders ${arr}</em></span></a>
  <a class="hs" href="#wishlist"><span class="hi">${ico('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>')}</span><span class="hl"><small>My Wishlist</small><b>${wish.length}</b><em>View Wishlist ${arr}</em></span></a>
  <a class="hs" href="#home" onclick="toast('Top up belum tersedia');return false"><span class="hi">${ico('<path d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/>')}</span><span class="hl"><small>My Balance</small><b>Rp 0</b><em>Top Up ${arr}</em></span></a>
 </div>
 <a class="bn" href="#produk"><span><b>Choose Your<br>Favorite Taste !</b><em>Enjoy Your Day ${heart}</em></span>${bag}</a></div>
 <div class="h2r"><div class="pn" id="ro"><div class="ph2"><span class="hi2">${ico('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>')}</span><h2>Your Recent Orders</h2><a href="#checkout">View All ${arr}</a></div>
  ${rows.map((r) => `<div class="or"><span class="th2">${pic(r.k)}</span><span class="odn"><b>${r.n}</b><small>${rp(r.p)} · ${r.tgl}</small></span><span class="bd2">${r.s}</span>${arr}</div>`).join("")}</div>
  <div class="pn"><div class="ph2"><span class="star" aria-hidden="true">★</span><h2>Quick Access</h2></div>
  ${qa(ico('<path d="M2 6h11v10H2zM13 9h4l3 3v4h-7"/><circle cx="6" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>'), "Track My Order", `onclick="${go2}"`)}
  ${qa(ico('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'), "My Wishlist", "", "#wishlist")}
  <a class="qa" href="https://wa.me/6281234567890" target="_blank" rel="noopener"><span class="qi">${ico('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>')}</span>Contact Us${arr}</a></div></div>
 <div class="tk"><svg class="mp" viewBox="0 0 80 80" aria-hidden="true"><path d="M10 34l40-18v48L10 46z" fill="#ec4f8c"/><rect x="6" y="32" width="10" height="16" rx="3" fill="#f48fb1"/><path d="M18 48l6 16h8l-5-14z" fill="#d4457a"/><path d="M58 28l10-6M60 40h12M58 52l10 6" stroke="#ec4f8c" stroke-width="3" stroke-linecap="round"/></svg><span><b>Thank You For Choosing Sando For Your Sweet Sandwich!</b><em>Keep enjoying our sweet Sandwich ${heart}</em></span>${bag}</div></section>`;
  },

  // ---- Halaman Admin (khusus admin) ----
  admin: () => {
    const v = [0.55, 0.8, 0.65, 1, 1.1, 1.6, 1.2],
      d = [21, 22, 23, 24, 25, 26, 27],
      Y = [0, 0.5, 1, 1.5, 2];
    const ch = `<svg class="chart" viewBox="0 0 600 260" role="img" aria-label="Grafik penjualan 7 hari terakhir"><defs><clipPath id="cb"><rect x="0" y="0" width="600" height="220"/></clipPath></defs>${Y.map((y) => `<line x1="62" x2="590" y1="${220 - y * 100}" y2="${220 - y * 100}" stroke="currentColor" stroke-opacity=".5"/><text x="54" y="${224 - y * 100}" text-anchor="end" fill="currentColor">${y == 0 ? "0" : (y + " M").replace(".", ",")}</text>`).join("")}<g clip-path="url(#cb)">${v.map((h, i) => `<rect x="${90 + i * 72}" y="${220 - h * 100}" width="40" height="${h * 100 + 20}" rx="20" fill="#edaec7"/>`).join("")}</g>${d.map((x, i) => `<text x="${110 + i * 72}" y="240" text-anchor="middle" fill="currentColor">${x} Sep</text>`).join("")}</svg>`;
    const st = (e, t, n, sub) =>
      `<div class="s"><span class="di" aria-hidden="true">${e}</span><h3>${t}</h3><b>${n}</b><small>${sub}</small></div>`;
    const tp = [
      ["st", "Strawberry Sando", 50],
      ["kw", "Kiwi Sando", 42],
      ["mg", "Mango Sando", 35],
    ];
    const od = [
      [
        "#SND00128",
        "Nurul",
        "Strawberry Sando (2x)",
        "Rp 30.000",
        "Diproses",
        "#fde68a",
      ],
      [
        "#SND00127",
        "Syifa",
        "Kiwi Sando (1x)",
        "Rp 15.000",
        "Dikirim",
        "#a7f0c0",
      ],
      [
        "#SND00126",
        "Latifah",
        "Mango Sando (3x)",
        "Rp 45.000",
        "Selesai",
        "#ff9db3",
      ],
    ];
    const rs = [
      ["💗", "Ringkasan Hari Ini", "27 Sep 2026"],
      ["📈", "Penjualan Hari ini", "Rp 1.250.000"],
      ["🛒", "Pesanan Hari Ini", "24"],
      ["💗", "Produk Terjual", "36"],
      ["👤", "Pelanggan Baru", "7"],
    ];
    return `<h1 style="font-size:clamp(1.8rem,4vw,2.4rem);margin:0 0 18px">Dashboard</h1><section class="dbs">${st("👛", "Total Penjualan", "RP 8.450.000", "<i>12%</i> dari kemarin")}${st("🛒", "Pesanan", "128", "<i>8%</i> dari kemarin")}${st("💗", "Produk Aktif", "5", "Total Produk")}${st("👤", "Pelanggan", "96", "<i>15%</i> dari kemarin")}</section>
 <section class="dc" style="margin:18px 0"><div class="dh"><span aria-hidden="true">📦</span><h3 style="font-size:1.05rem">Kelola Stok</h3><small style="margin-left:auto">Total ${P.reduce((a, p) => a + stock[p.id], 0)} pcs</small></div><div class="tw"><table class="stk"><thead><tr><th>Rasa</th><th>Stok</th><th>Jumlah</th><th>Aksi</th></tr></thead><tbody>${P.map((p) => `<tr><td><span class="th2" style="display:inline-block;vertical-align:middle;width:44px;height:44px;margin-right:8px">${sando(p.k)}</span>${p.n}</td><td>${stokTag(p.id)}</td><td><input class="ai" id="add${p.id}" type="number" inputmode="numeric" min="1" max="9999" value="10" aria-label="Jumlah stok ${p.n}"></td><td class="ab"><button class="btn s" onclick="adm(${p.id},1)">+ Tambah</button><button class="btn o s" onclick="adm(${p.id},-1)">Kurangi</button></td></tr>`).join("")}</tbody></table></div></section>
 <section class="db2"><div class="dc"><div class="ct"><h3>Penjualan</h3><small>7 hari terakhir</small></div>${ch}</div>
 <div class="dc"><div class="dh"><span aria-hidden="true">👑</span><h3 style="font-size:.95rem">Produk Terlaris</h3><a href="#produk">Lihat semua →</a></div>${tp.map((x) => `<div class="tp2"><div class="im">${sando(x[0])}</div><div><small>${x[1]}</small><b>${x[2]} Terjual</b></div></div>`).join("")}</div></section>
 <section class="db2"><div class="dc"><div class="dh"><span aria-hidden="true">🧾</span><h3 style="font-size:1.05rem">Pesanan Terbaru</h3><a href="#checkout">Lihat semua →</a></div><div class="tw"><table><thead><tr><th>No.pesanan</th><th>Pelanggan</th><th>Produk</th><th>Total</th><th>Status</th></tr></thead><tbody>${od.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td><span class="bd" style="background:${r[5]}">${r[4]}</span></td></tr>`).join("")}</tbody></table></div></div>
 <div class="dc">${rs.map((r) => `<div class="rs"><span aria-hidden="true">${r[0]}</span><span style="color:var(--ink)">${r[1]}</span><span>${r[2]}</span></div>`).join("")}</div></section>`;
  },

  // ---- Halaman Wishlist ----
  wishlist: () => {
    const items = wish.map((id) => P[id - 1]).filter(Boolean);
    const hs = (on) =>
      `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
    const head = `<div class="wh"><div><span class="chip" style="background:#f9d3e0;display:inline-block">Favoritmu</span><h1>My Wishlist</h1><p>${items.length ? items.length + " sando menunggu kamu bawa pulang." : "Simpan rasa yang kamu suka di sini."}</p></div>${items.length ? `<a class="btn o s" href="#produk">+ Cari rasa lain</a>` : ""}</div>`;
    if (!items.length)
      return `<section class="wl">${head}<div class="we"><span class="wh0">${hs(0)}</span><h2>Wishlist kamu masih kosong</h2><p>Tekan tombol "Simpan ke Wishlist" di halaman produk untuk menyimpan rasa favoritmu.</p><a class="btn" href="#produk">Lihat Produk</a></div></section>`;
    return `<section class="wl">${head}<div class="wg">${items
      .map((p) => {
        const i = P.indexOf(p),
          ok = left(p.id) > 0;
        return `<article class="wc"><button class="wx on" aria-label="Hapus ${p.n} dari wishlist" onclick="wl(${p.id})">${hs(1)}</button><a class="wi" href="#produk" onclick="wSee(${i});return false" aria-label="Lihat ${p.n}">${p.k == "st" ? `<img src="${FOTO_STRAWBERRY}" alt="">` : `<div class="sv">${sando(p.k)}</div>`}</a><div class="wb2"><span class="chip" style="background:#f9d3e0">${p.t || "Sando Fruit"}</span><h3>${p.n}</h3><p class="wr">${p.r}</p><div class="wp"><b>${rp(p.p)}</b>${stokTag(p.id)}</div><div class="wa"><button class="btn s2" onclick="wAdd(${p.id})"${ok ? "" : " disabled"}>${stock[p.id] <= 0 ? "Stok Habis" : ok ? "Add to Cart" : "Sudah di Keranjang"}</button><a class="btn o s2" href="#produk" onclick="wSee(${i});return false">Lihat</a></div></div></article>`;
      })
      .join("")}</div></section>`;
  },

  // ---- Halaman Login ----
  login: () =>
    auth(
      `<form class="fm" onsubmit="return doLogin(event)"><h2 id="lt">Welcome Back!</h2><p class="sub" id="ls">Login untuk melanjutkan</p><label for="e">Email</label><input id="e" type="email" required autocomplete="email" placeholder="Masukkan email"><label for="p">Password</label><input id="p" type="password" required autocomplete="current-password" placeholder="Masukkan password"><a class="lupa" href="#login" onclick="toast('Hubungi kami lewat WhatsApp untuk reset password');return false">Lupa Password?</a><p class="err" id="er" role="alert" style="margin:0 0 6px"></p><button class="go" id="lg">LOGIN</button><button type="button" class="admarrow" id="am" onclick="admMode()" aria-label="Login sebagai admin"><span id="amt">Login sebagai Admin</span><span class="ar" aria-hidden="true">&rarr;</span></button><p class="alt" id="la">Belum punya akun? <a href="#register">Daftar sekarang</a></p></form>`,
    ),

  // ---- Halaman Register ----
  register: () =>
    auth(
      `<form class="fm" onsubmit="return doReg(event)"><h2>Create Account</h2><p class="sub">Daftar untuk mulai memesan</p><label for="n">Nama lengkap</label><input id="n" required autocomplete="name" placeholder="Masukkan nama lengkap"><label for="hp">No. WhatsApp</label><input id="hp" type="tel" required autocomplete="tel" inputmode="tel" placeholder="08xxxxxxxxxx"><label for="e">Email</label><input id="e" type="email" required autocomplete="email" placeholder="Masukkan email"><label for="al">Alamat lengkap</label><textarea id="al" rows="3" required autocomplete="street-address" placeholder="Jalan, nomor rumah, kecamatan, kota"></textarea><label for="p">Password</label><input id="p" type="password" minlength="6" required autocomplete="new-password" placeholder="Minimal 6 karakter"><label for="p2">Konfirmasi password</label><input id="p2" type="password" minlength="6" required autocomplete="new-password" placeholder="Ulangi password"><p class="err" id="er" role="alert" style="margin:10px 0 0"></p><button class="go">DAFTAR</button><p class="alt">Sudah punya akun? <a href="#login">Login sekarang</a></p></form>`,
    ),

  // ---- Halaman Checkout ----
  checkout: () => {
    if (order) return receipt();
    const ids = Object.keys(cart).filter((i) => P[i - 1]),
      sub = ids.reduce((a, i) => a + P[i - 1].p * cart[i], 0),
      ong = ids.length ? ONGKIR : 0;
    const fld = (l, i, ph, v, t) =>
      `<label class="cl" for="${i}">${l}</label><input id="${i}" ${t || ""} value="${v || ""}" placeholder="${ph}">`;
    return `<p class="yo">your order</p><h1 class="ck">checkout <span aria-hidden="true">🛒</span></h1><p style="margin:0 0 18px">Periksa pesanan sebelum manusia di balik layar mengantarkannya.</p>
 <div class="cg"><div class="dc2"><h2>Data Pengiriman</h2>${fld("Nama penerima", "cn", "Nama penerima", user ? esc(user.nama) : "")}${fld("No. WhatsApp", "cp", "08xxxxxxxxxx", user && user.hp ? esc(user.hp) : "", 'type="tel"')}<label class="cl" for="ca">Alamat lengkap</label><textarea id="ca" rows="4" placeholder="Alamat Pengiriman">${user && user.al ? esc(user.al) : ""}</textarea><label class="cl" for="pm">Metode pembayaran</label><select id="pm"><option value="">Pilih Metode</option>${PAY.map(([g, a]) => `<optgroup label="${g}">${a.map((m) => `<option>${m}</option>`).join("")}</optgroup>`).join("")}</select><p class="err" id="er" role="alert" style="margin:8px 0 0"></p><button class="btn" style="width:100%;margin-top:10px" onclick="pay(${sub})">Buat Pesanan</button></div>
 <div class="dc2 rr"><h2>Ringkasan Pesanan</h2>${
   ids.length
     ? ids
         .map((i) => {
           const p = P[i - 1];
           return `<div class="item">${sando(p.k)}<div class="n">${p.n}<small>${rp(p.p)} · ${stokTag(p.id)}</small></div><div class="qty"><button aria-label="Kurangi" onclick="chg(${i},-1)">−</button><b>${cart[i]}</b><button aria-label="Tambah" onclick="chg(${i},1)"${left(p.id) ? "" : " disabled"}>+</button></div></div>`;
         })
         .join("")
     : `<p style="margin:0;font-size:.95rem">Keranjang masih kosong. Sando sedang menunggu untuk diselamatkan. <a href="#produk"><b>Pilih sando</b></a></p>`
 }${user ? "" : `<p class="note">Kamu perlu <a href="#login"><b>masuk</b></a> dulu untuk membuat pesanan.</p>`}
 <div class="tt"><div class="tot"><span>Subtotal</span><span>${rp(sub)}</span></div><div class="tot"><span>Ongkir</span><span>${rp(ong)}</span></div><div class="tot g"><span>Total</span><span>${rp(sub + ong)}</span></div></div></div></div>`;
  },
};
// ============================================================
// STRUK PEMBAYARAN
// ============================================================
function receipt() {
  const o = order,
    m = o.m,
    bank = ["BCA", "Mandiri", "BNI", "BRI"].includes(m),
    ew = ["GoPay", "OVO", "DANA", "ShopeePay"].includes(m);
  let how = "";
  if (bank)
    how = `<p style="margin:0 0 4px">Nomor Virtual Account ${m}</p><div class="va">${o.va}</div><div class="note">Buka m-banking ${m}, pilih Transfer lalu Virtual Account, masukkan nomor di atas dan bayar ${rp(o.tot)}. Bayar sebelum 24 jam.</div>`;
  else if (ew)
    how = `<div class="note">Kami mengirim tagihan ${rp(o.tot)} ke akun ${m} nomor ${esc(o.hp)}. Buka aplikasinya dan setujui pembayaran.</div>`;
  else if (m == "QRIS")
    how = `<svg viewBox="0 0 21 21" width="160" style="background:#fff;padding:8px;border-radius:14px;display:block;margin:6px 0" aria-label="Kode QRIS contoh">${qr(o.id)}</svg><div class="note">Scan dengan aplikasi bank atau e-wallet apa pun, lalu bayar ${rp(o.tot)}.</div>`;
  else if (m.startsWith("Bayar"))
    how = `<div class="note">Siapkan uang tunai ${rp(o.tot)} saat kurir tiba.</div>`;
  else
    how = `<div class="note">Pembayaran kartu sebesar ${rp(o.tot)} berhasil diterima.</div>`;
  const cod = m.startsWith("Bayar") || m.startsWith("Kartu");
  return `<div class="box" style="max-width:640px;margin:20px auto"><span class="ok">${cod ? "Pesanan dikonfirmasi" : "Menunggu pembayaran"}</span><h2 style="margin-top:12px">Terima kasih, ${esc(o.nama.split(" ")[0])}!</h2><p style="color:var(--muted);margin:0 0 14px">Nomor pesanan <b>${o.id}</b> · ${o.tgl}</p>${o.items.map((i) => `<div class="item">${sando(i.k)}<div class="n">${i.n}<small>${i.q} x ${rp(i.p)}</small></div><b>${rp(i.p * i.q)}</b></div>`).join("")}
 <div class="tot" style="margin-top:10px"><span>Subtotal</span><span>${rp(o.sub)}</span></div><div class="tot"><span>Ongkir</span><span>${rp(ONGKIR)}</span></div><div class="tot g"><span>Total</span><span>${rp(o.tot)}</span></div>
 <h3 style="margin-top:22px">Pembayaran: ${m}</h3>${how}<h3 style="margin-top:22px">Dikirim ke</h3><p style="margin:0">${esc(o.nama)} (${esc(o.hp)})<br>${esc(o.al)}${o.cat ? "<br><i>Catatan: " + esc(o.cat) + "</i>" : ""}</p><div class="row"><a class="btn" href="#produk" onclick="order=null">Belanja lagi</a><a class="btn o" href="#home" onclick="order=null">Ke beranda</a></div></div>`;
}

function qr(seed) {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  let o = "";
  const f = (x, y) => {
    const a = x < 7 && y < 7,
      b = x > 13 && y < 7,
      c = x < 7 && y > 13;
    if (a || b || c) {
      const ox = b ? x - 14 : x,
        oy = c ? y - 14 : y;
      return (
        ox == 0 ||
        ox == 6 ||
        oy == 0 ||
        oy == 6 ||
        (ox > 1 && ox < 5 && oy > 1 && oy < 5)
      );
    }
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 28) & 1;
  };
  for (let y = 0; y < 21; y++)
    for (let x = 0; x < 21; x++)
      if (f(x, y))
        o += `<rect x="${x}" y="${y}" width="1" height="1" fill="#222"/>`;
  return o;
}
// ============================================================
// PROSES CHECKOUT
// ============================================================
function pay(sub) {
  if (!user) {
    toast("Masuk dulu ya");
    go("login");
    return;
  }
  if (!sub) {
    document.getElementById("er").textContent = "Keranjang masih kosong.";
    return;
  }
  const v = (i) => document.getElementById(i).value.trim(),
    er = document.getElementById("er");
  if (!v("cn") || !/^[0-9+\-\s]{8,16}$/.test(v("cp")) || !v("ca")) {
    er.textContent = "Lengkapi nama, nomor HP yang valid, dan alamat.";
    return;
  }
  const m = v("pm");
  if (!m) {
    er.textContent = "Pilih metode pembayaran.";
    return;
  }
  const id = "SF-" + Date.now().toString().slice(-7);
  const kurang = Object.keys(cart).find((i) => cart[i] > stock[i]);
  if (kurang) {
    er.textContent =
      "Stok " +
      P[kurang - 1].n +
      " tinggal " +
      stock[kurang] +
      ". Kurangi jumlah pesananmu.";
    return;
  }
  Object.keys(cart).forEach((i) => (stock[i] -= cart[i]));
  sv("sf_stock", stock); // stok berkurang karena dibeli
  order = {
    id,
    m,
    nama: v("cn"),
    hp: v("cp"),
    al: v("ca"),
    cat: "",
    sub,
    tot: sub + ONGKIR,
    tgl: new Date().toLocaleString("id-ID"),
    va:
      ({ BCA: "11201", Mandiri: "88908", BNI: "8810", BRI: "26215" }[m] || "") +
      Math.random().toString().slice(2, 12),
    items: Object.keys(cart).map((i) => ({
      n: P[i - 1].n,
      k: P[i - 1].k,
      p: P[i - 1].p,
      q: cart[i],
    })),
  };
  hist.unshift({
    n: order.items.map((i) => i.n).join(", "),
    k: order.items[0].k,
    p: order.sub,
    tgl: new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    s: "Diproses",
  });
  hist = hist.slice(0, 20);
  sv("sf_hist", hist);
  cart = {};
  sv("sf_cart", cart);
  route();
  scrollTo(0, 0);
}
// ============================================================
// LOGIN & REGISTER
// ============================================================
function admMode() {
  const b = document.getElementById("am"),
    on = !b.classList.contains("on");
  b.classList.toggle("on", on);
  document.getElementById("lt").textContent = on
    ? "Admin Login"
    : "Welcome Back!";
  document.getElementById("ls").textContent = on
    ? "Khusus pengelola toko"
    : "Login untuk melanjutkan";
  document.getElementById("lg").textContent = on ? "LOGIN ADMIN" : "LOGIN";
  document.getElementById("amt").textContent = on
    ? "Kembali ke login biasa"
    : "Login sebagai Admin";
  document.getElementById("la").style.display = on ? "none" : "";
  document.getElementById("er").textContent = "";
  document
    .getElementById("p")
    .setAttribute("autocomplete", on ? "off" : "current-password");
  const em = document.getElementById("e");
  em.value = "";
  em.placeholder = on ? "Masukkan email admin" : "Masukkan email";
  const pw = document.getElementById("p");
  pw.value = "";
  (on ? pw : em).focus();
}
function doLogin(e) {
  e.preventDefault();
  const em = document.getElementById("e").value.trim().toLowerCase(),
    pw = document.getElementById("p").value;
  if (ADMIN_EMAILS.includes(em) && pw.trim() == ADMIN.pw) {
    user = { nama: "Admin", email: em, admin: true };
    sv("sf_user", user);
    toast("Masuk sebagai admin");
    if (location.hash == "#admin") route();
    else go("admin");
    return false;
  }
  if (document.getElementById("am").classList.contains("on")) {
    document.getElementById("er").textContent =
      "Email atau password admin salah.";
    return false;
  }
  const u = users.find((x) => x.email == em && x.pw == pw);
  if (!u) {
    document.getElementById("er").textContent =
      "Email atau kata sandi salah. Periksa lagi atau daftar akun baru.";
    return false;
  }
  user = { nama: u.nama, email: u.email, hp: u.hp, al: u.al };
  sv("sf_user", user);
  toast("Selamat datang kembali!");
  go(count() ? "checkout" : "home");
  return false;
}

function doReg(e) {
  e.preventDefault();
  const em = document.getElementById("e").value.trim().toLowerCase(),
    nama = document.getElementById("n").value.trim(),
    pw = document.getElementById("p").value,
    hp = document.getElementById("hp").value.trim().replace(/[\s-]/g, ""),
    al = document.getElementById("al").value.trim(),
    er = document.getElementById("er");
  if (!/^(\+62|62|0)8\d{7,12}$/.test(hp)) {
    er.textContent = "Nomor WhatsApp tidak valid. Contoh: 081234567890";
    return false;
  }
  if (al.length < 10) {
    er.textContent = "Alamat terlalu singkat, tulis alamat selengkap mungkin.";
    return false;
  }
  if (pw != document.getElementById("p2").value) {
    er.textContent = "Konfirmasi password tidak sama.";
    return false;
  }
  if (em == ADMIN.email || users.some((x) => x.email == em)) {
    document.getElementById("er").textContent =
      "Email ini sudah terdaftar. Silakan masuk.";
    return false;
  }
  users.push({ nama, email: em, pw, hp, al });
  sv("sf_users", users);
  user = { nama, email: em, hp, al };
  sv("sf_user", user);
  toast("Akun berhasil dibuat");
  go(count() ? "checkout" : "home");
  return false;
}
// ============================================================
// ROUTER  (pindah halaman lewat #hash)
// ============================================================
// Admin: tambah / kurangi stok per rasa
function adm(id, sign) {
  if (!(user && user.admin)) return;
  const n = Math.floor(Number(document.getElementById("add" + id).value));
  if (!(n > 0) || n > 9999) {
    toast("Isi jumlah antara 1 dan 9999");
    return;
  }
  const lama = stock[id];
  stock[id] = Math.max(0, lama + sign * n);
  sv("sf_stock", stock);
  if (cart[id] > stock[id]) {
    cart[id] = stock[id];
    if (cart[id] <= 0) delete cart[id];
    sv("sf_cart", cart);
  }
  toast(P[id - 1].n + ": stok " + lama + " → " + stock[id]);
  route();
}
function route() {
  const r = (location.hash || "#home").slice(1);
  if (r == "admin" && !(user && user.admin)) {
    toast("Halaman admin: masuk sebagai admin dulu");
    go("login");
    return;
  }
  nav();
  document.getElementById("app").innerHTML = (V[r] || V.home)();
  if (r != "checkout") order = null;
}
addEventListener("hashchange", () => {
  route();
  scrollTo(0, 0);
});
route();

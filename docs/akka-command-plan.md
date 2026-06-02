# Akka Command Plan

Rencana lengkap pengembangan command untuk platform Akka WhatsApp marketplace.

---

## Struktur Repo

| Repo | Isi |
|---|---|
| `akka-utils` | Utility umum: `.random`, `.pick`, `.convert`, `.qr` |
| `akka-info` | Info & data: `.kurs`, `.cuaca`, `.negara`, `.trivia`, `.wiki` |
| `akka-muslim` | Islami: `.quran`, `.sholat` |

> **Constraint:** Semua command tidak bisa digunakan di group (sesuai ketentuan platform).

---

## akka-utils

### `.random`

**Fungsi:** Generate angka random antara dua nilai.

**Usage:**
```
.random [min] [max]
```

**Contoh:**

| Input | Output |
|---|---|
| `.random 1 100` | 🎲 Hasilnya: 47 |
| `.random 1 6` | Simulasi dadu |
| `.random` | Default 1–100 |

**API:** Tidak diperlukan (pure logic)

**Complexity:** Rendah

**Edge Cases:**
- Min > max → tukar otomatis
- Input bukan angka → pesan error jelas
- Angka desimal → floor ke integer
- Angka terlalu besar (> `Number.MAX_SAFE_INTEGER`) → tolak

---

### `.pick`

**Fungsi:** Pilih satu item secara random dari list yang diberikan.

**Usage:**
```
.pick [item1] [item2] [item3] ...
```

**Contoh:**

| Input | Output |
|---|---|
| `.pick nasi mie lontong` | 🎯 Pilihannya: mie |
| `.pick "nasi goreng" soto bakso` | Item dengan spasi pakai tanda kutip |
| `.pick` | Minta minimal 2 item |

**API:** Tidak diperlukan (pure logic)

**Complexity:** Rendah

**Edge Cases:**
- Hanya 1 item → error, minimal 2 pilihan
- Item duplikat → valid (peluang lebih besar)
- Item dengan spasi → gunakan tanda kutip
- Lebih dari 50 item → tolak dengan pesan error

---

### `.convert`

**Fungsi:** Konversi satuan saintifik antar unit dalam satu kategori.

**Usage:**
```
.convert [nilai] [dari] [ke]
```

**Contoh:**

| Input | Output |
|---|---|
| `.convert 5 km m` | 📏 5 km = 5000 m |
| `.convert 100 c k` | 🌡️ 100°C = 373.15 K |
| `.convert 2 kg g` | ⚖️ 2 kg = 2000 g |

**API:** Tidak diperlukan (pure logic + tabel konversi)

**Complexity:** Sedang

**Satuan yang didukung:**

| Kategori | Satuan |
|---|---|
| Panjang | `pm`, `nm`, `um` (μm), `mm`, `cm`, `m`, `km` |
| Massa | `pg`, `ng`, `ug` (μg), `mg`, `g`, `kg` |
| Suhu | `C`, `F`, `K` |

> Alias `um` dan `ug` digunakan karena karakter `μ` susah diketik di WhatsApp.

**Edge Cases:**
- Satuan tidak dikenal → tampilkan daftar satuan valid
- Konversi lintas kategori (misal `km` ke `kg`) → tolak dengan pesan jelas
- Nilai negatif untuk suhu → valid (misal -10°C ke K)
- Nilai negatif untuk panjang/massa → tolak
- Input bukan angka → pesan error

---

### `.qr`

**Fungsi:** Generate QR code dari teks atau URL.

**Usage:**
```
.qr [teks atau URL]
```

**Contoh:**

| Input | Output |
|---|---|
| `.qr https://google.com` | 🔲 QR code untuk: https://google.com [gambar] |
| `.qr Halo dunia!` | 🔲 QR code untuk: "Halo dunia!" [gambar] |
| `.qr` | Minta input teks atau URL |

**API:** QR Server API — `https://api.qrserver.com/v1/create-qr-code/`

**Endpoint:**
```
GET https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={encoded_text}&format=png
```

**Complexity:** Rendah

**Edge Cases:**
- Teks kosong → minta input
- Teks terlalu panjang (>900 karakter) → QR jadi terlalu dense, beri peringatan / tolak
- URL encode teks sebelum dikirim ke API (spasi, karakter khusus)
- Cek apakah `ctx.send()` support attachment/gambar dari URL — jika tidak, kirim URL gambarnya langsung

> ⚠️ Perlu dicek dulu kemampuan SDK: apakah `ctx.send()` support image URL atau hanya plain text.

---

## akka-info

### `.kurs`

**Fungsi:** Cek kurs mata uang terkini atau konversi nilai antar mata uang.

**Usage:**
```
.kurs [mata_uang_asal] [mata_uang_tujuan]
.kurs [nilai] [mata_uang_asal] [mata_uang_tujuan]
```

**Contoh:**

| Input | Output |
|---|---|
| `.kurs USD IDR` | 💱 1 USD = 16.243 IDR (per 2 Jun 2026) |
| `.kurs 100 USD IDR` | 💱 100 USD = 1.624.300 IDR |
| `.kurs` | Kirim panduan penggunaan |

**API:** Frankfurter API — `https://api.frankfurter.dev`

**Endpoint:**
```
GET https://api.frankfurter.dev/v2/rate/{FROM}/{TO}
GET https://api.frankfurter.dev/v2/currencies   ← untuk validasi kode
```

**Complexity:** Rendah

**Edge Cases:**
- Kode mata uang tidak dikenal → tampilkan daftar kode umum (USD, IDR, EUR, SGD, dll)
- Mata uang asal = tujuan (misal USD ke USD) → jawab langsung tanpa API call
- Input nilai bukan angka → pesan error jelas
- Nilai negatif → tolak
- API down / timeout → pesan error ramah
- IDR tidak tersedia sebagai base di ECB → fetch dari EUR dulu, lalu hitung silang

> ⚠️ Data dari European Central Bank, update harian — bukan realtime tick-by-tick. IDR tersedia sebagai quote currency.

---

### `.cuaca`

**Fungsi:** Cek cuaca terkini suatu kota.

**Usage:**
```
.cuaca [nama_kota]
```

**Contoh:**

| Input | Output |
|---|---|
| `.cuaca Jakarta` | 🌤️ Jakarta — 31°C, Berawan Sebagian \| 💧 78% \| 💨 12 km/h |
| `.cuaca Bandung` | 🌧️ Bandung — 24°C, Hujan Ringan ... |
| `.cuaca` | Minta nama kota |

**API:** Open-Meteo (cuaca) + Open-Meteo Geocoding API (nama kota → koordinat)

**Endpoint (2 langkah):**
```
Step 1 — Geocoding:
GET https://geocoding-api.open-meteo.com/v1/search?name={kota}&count=1&language=id

Step 2 — Cuaca:
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code
  &timezone=auto
```

**Complexity:** Sedang (2 API call berurutan)

**Peta Weather Code:**

| Kode | Deskripsi |
|---|---|
| 0 | Cerah ☀️ |
| 1–3 | Berawan sebagian ⛅ |
| 45–48 | Berkabut 🌫️ |
| 51–67 | Gerimis / Hujan 🌧️ |
| 71–77 | Salju ❄️ |
| 80–82 | Hujan Lebat 🌧️ |
| 95–99 | Badai Petir ⛈️ |

**Edge Cases:**
- Kota tidak ditemukan di geocoding → "Kota tidak ditemukan, coba nama lain"
- Nama kota ambigu (misal "Malang") → ambil hasil pertama, tampilkan nama lengkap + negara
- Kota lebih dari satu kata → gabungkan sebagai satu query (misal `.cuaca Kuala Lumpur`)
- API timeout → pesan error ramah

> ⚠️ Butuh 2 API call berurutan — pertimbangkan cache koordinat kota-kota populer.

---

### `.negara`

**Fungsi:** Cari informasi umum tentang sebuah negara.

**Usage:**
```
.negara [nama_negara]
```

**Contoh:**

| Input | Output |
|---|---|
| `.negara Jepang` | 🇯🇵 Jepang (Japan) \| 🏙️ Tokyo \| 👥 125.7 juta \| 🗣️ Jepang \| 💴 JPY \| 📞 +81 |
| `.negara Brazil` | Info lengkap Brasil |

**API:** REST Countries v3.1 — `https://restcountries.com`

**Endpoint:**
```
GET https://restcountries.com/v3.1/name/{nama}
  ?fields=name,capital,population,languages,currencies,flags,idd,area

Fallback (nama terjemahan):
GET https://restcountries.com/v3.1/translation/{nama}
```

**Complexity:** Rendah

**Field yang ditampilkan:**
- Nama resmi + bendera emoji
- Ibu kota, populasi, luas wilayah (km²)
- Bahasa resmi, mata uang, kode telepon

**Edge Cases:**
- Nama dalam bahasa Indonesia (misal "Jerman") → gunakan endpoint `/translation/{nama}` sebagai fallback
- Nama tidak ditemukan → "Negara tidak ditemukan. Coba nama dalam bahasa Inggris."
- Beberapa hasil ditemukan (misal "Guinea") → tampilkan semua nama, minta user lebih spesifik
- Field kosong (negara tanpa ibu kota resmi) → tampilkan "-"

---

### `.trivia`

**Fungsi:** Kuis trivia dengan pilihan ganda dari berbagai kategori.

**Usage:**
```
.trivia
.trivia [kategori]
.jawab [A/B/C/D]
```

**Contoh:**

| Input | Output |
|---|---|
| `.trivia` | 🎯 Trivia: Sains — "What is the chemical symbol for gold?" A) Go  B) Ag  C) Au  D) Gd |
| `.trivia sains` | Trivia dari kategori Science |
| `.jawab C` | ✅ Benar! Jawaban: Au (Gold) |

**API:** Open Trivia DB — `https://opentdb.com`

**Endpoint:**
```
GET https://opentdb.com/api.php?amount=1&type=multiple&encode=url3986
  &category={id_kategori}   ← opsional
```

**Kategori yang didukung:**

| Alias | ID | Kategori |
|---|---|---|
| `sains` | 17 | Science & Nature |
| `komputer` | 18 | Science: Computers |
| `geografi` | 22 | Geography |
| `sejarah` | 23 | History |
| `umum` | 9 | General Knowledge |

**Complexity:** Sedang

**Flow:**
1. User kirim `.trivia` → fetch 1 soal dari API
2. Acak urutan pilihan jawaban → tampilkan sebagai A/B/C/D
3. Simpan jawaban benar sementara (encode di pesan atau via ctx.schedule)
4. User reply `.jawab [huruf]` → bandingkan, umumkan hasil

**Edge Cases:**
- Pertanyaan dalam bahasa Inggris — tidak diterjemahkan, beri disclaimer di awal
- HTML entities dari API (misal `&amp;`) → decode sebelum ditampilkan
- Kategori tidak dikenal → fallback ke kategori random
- Rate limit API (response code 5, max 1 req/5 detik per IP) → tunggu dan retry sekali
- Tidak ada state antar user karena constraint no-group SDK

> ⚠️ Perlu strategi menyimpan jawaban benar sementara — opsi: encode jawaban di format pesan tersembunyi, lalu decode saat user reply `.jawab`.

---

### `.wiki`

**Fungsi:** Cari ringkasan artikel Wikipedia tentang suatu topik.

**Usage:**
```
.wiki [topik]
```

**Contoh:**

| Input | Output |
|---|---|
| `.wiki Soekarno` | 📖 Soekarno — Presiden pertama Indonesia... (3–4 kalimat) |
| `.wiki fotosintesis` | 📖 Fotosintesis — Proses yang digunakan tumbuhan... |

**API:** Wikipedia REST API

**Endpoint:**
```
Utama (bahasa Indonesia):
GET https://id.wikipedia.org/api/rest_v1/page/summary/{topik}

Fallback (bahasa Inggris):
GET https://en.wikipedia.org/api/rest_v1/page/summary/{topik}
```

**Complexity:** Rendah

**Edge Cases:**
- Topik tidak ditemukan di Wikipedia Indonesia → fallback ke Wikipedia Inggris, beri tahu user
- Halaman disambiguasi (API return `type: "disambiguation"`) → tampilkan "Topik ambigu, coba lebih spesifik"
- Extract terlalu panjang → potong di kalimat ke-3 atau ke-4, tambahkan link artikel lengkap
- Nama topik multi-kata → encode spasi sebagai underscore (`Soekarno_Hatta`)
- Karakter khusus → URL encode

---

## akka-muslim

### `.quran`

**Fungsi:** Baca ayat Al-Quran lengkap dengan teks Arab dan terjemahan Indonesia.

**Usage:**
```
.quran [nomor_surah] [nomor_ayat]
.quran [nama_surah] [nomor_ayat]
.quran random
```

**Contoh:**

| Input | Output |
|---|---|
| `.quran 1 1` | 📖 Al-Fatihah : 1 — بِسْمِ ٱللَّهِ... + terjemahan |
| `.quran Al-Baqarah 255` | Ayat Kursi + terjemahan Indonesia |
| `.quran random` | Ayat random dari seluruh Al-Quran |

**API:** AlQuran.cloud API — `https://api.alquran.cloud`

**Endpoint:**
```
Ambil ayat (Arab + terjemahan Indonesia):
GET http://api.alquran.cloud/v1/ayah/{surah}:{ayat}/editions/quran-uthmani,id.indonesian

Daftar surah (untuk validasi nama → nomor):
GET http://api.alquran.cloud/v1/surah
```

**Complexity:** Rendah

**Edge Cases:**
- Nama surah dalam bahasa Indonesia (misal "Al-Fatihah", "Yasin") → cocokkan dengan daftar 114 surah
- Nomor surah di luar 1–114 → tolak dengan pesan jelas
- Nomor ayat melebihi jumlah ayat dalam surah → tampilkan jumlah ayat maksimal surah tersebut
- `.quran random` → generate nomor surah (1–114) dan ayat (1 – max_ayat_surah) secara random
- Tampilkan teks Arab + terjemahan Indonesia dalam satu pesan

---

### `.sholat`

**Fungsi:** Cek jadwal waktu sholat 5 waktu untuk suatu kota hari ini.

**Usage:**
```
.sholat [nama_kota]
.sholat [nama_kota], [negara]
```

**Contoh:**

| Input | Output |
|---|---|
| `.sholat Jakarta` | 🕌 Jadwal Sholat Jakarta (2 Jun 2026) — Subuh 04:35, Dzuhur 11:57, Ashar 15:18, Maghrib 17:50, Isya 19:02 |
| `.sholat London, UK` | Jadwal sholat London |

**API:** AlAdhan API — `https://api.aladhan.com`

**Endpoint:**
```
GET https://api.aladhan.com/v1/timingsByCity/{timestamp}
  ?city={kota}&country={negara}&method=11

method=11 → Kementerian Agama RI (dianjurkan untuk user Indonesia)
method=2  → ISNA (fallback umum)
```

**Complexity:** Rendah

**Waktu yang ditampilkan:** Subuh, Dzuhur, Ashar, Maghrib, Isya (filter dari response yang juga berisi Imsak, Midnight, dll)

**Edge Cases:**
- Hanya kota tanpa negara → default `country=Indonesia`, tampilkan disclaimer
- Kota tidak ditemukan → "Kota tidak dikenali. Coba format: `.sholat Kota, Negara`"
- Kota dengan nama serupa di banyak negara (misal "Cairo") → tampilkan nama lengkap kota + negara di output
- Timezone → API sudah auto-timezone berdasarkan kota

> ⚠️ Metode perhitungan sholat berbeda per mazhab/lembaga. Default ke `method=11` (Kemenag RI) untuk user Indonesia, namun hasilnya mungkin sedikit berbeda dari jadwal masjid setempat.

---

## Ringkasan Semua Command

| Command | Repo | API | Key? | Complexity |
|---|---|---|---|---|
| `.random` | akka-utils | — | ✅ No | Rendah |
| `.pick` | akka-utils | — | ✅ No | Rendah |
| `.convert` | akka-utils | — | ✅ No | Sedang |
| `.qr` | akka-utils | QR Server | ✅ No | Rendah |
| `.kurs` | akka-info | Frankfurter | ✅ No | Rendah |
| `.cuaca` | akka-info | Open-Meteo | ✅ No | Sedang |
| `.negara` | akka-info | REST Countries | ✅ No | Rendah |
| `.trivia` | akka-info | Open Trivia DB | ✅ No | Sedang |
| `.wiki` | akka-info | Wikipedia API | ✅ No | Rendah |
| `.quran` | akka-muslim | AlQuran.cloud | ✅ No | Rendah |
| `.sholat` | akka-muslim | AlAdhan | ✅ No | Rendah |

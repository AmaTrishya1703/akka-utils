# akka-utils

Kumpulan perintah (commands) utilitas untuk platform Akka WhatsApp.

## Daftar Perintah (Commands)

### 1. `.random`
Menghasilkan angka acak bulat antara rentang `min` dan `max` (inklusif).
* **Format:** `.random [min] [max]`
* **Contoh:**
  * `.random 1 6` (simulasi dadu)
  * `.random 13 50`
  * `.random` (menggunakan default 1 - 100)

### 2. `.pick`
Memilih item secara acak dari pilihan yang diberikan.
* **Format:** `.pick [item1] [item2] ...`
* **Catatan:** Masukkan minimal 2 pilihan dan maksimal 50 pilihan. Untuk pilihan yang mengandung spasi, gunakan tanda kutip (misal: `"nasi goreng"`).
* **Contoh:**
  * `.pick nasi mie lontong`
  * `.pick "nasi goreng" "mie ayam" bakso`

### 3. `.convert`
Mengonversi nilai satuan Panjang, Massa, dan Suhu.
* **Format:** `.convert [nilai] [dari] [ke]`
* **Kategori Satuan yang Didukung:**
  * **Panjang:** `pm`, `nm`, `um` (atau `μm`), `mm`, `cm`, `m`, `km`
  * **Massa:** `pg`, `ng`, `ug` (atau `μg`), `mg`, `g`, `kg`
  * **Suhu:** `c` (Celsius), `f` (Fahrenheit), `k` (Kelvin)
* **Contoh:**
  * `.convert 5 km m` -> `5 km = 5000 m`
  * `.convert 100 c k` -> `100°C = 373.15 K`
  * `.convert 2 kg g` -> `2 kg = 2000 g`

## Pengembangan Lokal

### Prasyarat
* Node.js (versi >= 18) atau Bun (versi >= 1.0)

### Instalasi Dependensi
```bash
npm install
```

### Type Checking
```bash
npm run typecheck
```

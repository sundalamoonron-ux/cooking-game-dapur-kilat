# Dapur Kilat — Game Masak Serba Cepat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/sundalamoonron-ux/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/sundalamoonron-ux/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Dapur Kilat** adalah game masak 2D berbahasa Indonesia: kamu juru masak di dapur burger yang sibuk. Pesanan pelanggan datang lewat tiket di papan atas layar — terima, olah, dan sajikan sebelum kesabaran mereka habis.

## Gameplay

- **Terima pesanan:** tiap tiket menampilkan resep burger yang diminta dan bar kesabaran yang terus berkurang. Maksimal 4 tiket aktif sekaligus.
- **Ambil bahan:** lima wadah bahan di bawah layar — Roti, Daging, Selada, Tomat, Keju. Klik wadah untuk mengambil satu bahan.
- **Potong di talenan:** Selada dan Tomat harus dipotong dulu — letakkan di talenan lalu klik 3 kali.
- **Panggang di panggangan:** Daging mentah dipanggang di salah satu dari dua slot panggangan selama 7 detik. Jangan ditinggal: lewat 14 detik daging gosong dan harus dibuang ke tempat sampah.
- **Susun di piring:** susunan selalu diawali Roti, lalu tambahkan bahan yang sudah siap (dipotong/dipanggang). Bahan yang salah susun bisa diambil kembali dari piring.
- **Sajikan:** klik tombol **SAJIKAN** atau klik langsung tiket pesanannya. Hidangan yang cocok dengan resep langsung terantar.

Ada 6 resep burger: Burger Klasik, Cheeseburger, dan Burger Tomat di hari pertama; Burger Sayur dan Double Sapi terbuka di hari kedua; Burger Spesial di hari ketiga.

## Skor & Aturan

- Satu shift berlangsung 120 detik. Selesai shift, lanjut ke hari berikutnya dengan pesanan yang datang lebih cepat dan resep baru.
- Tiap hidangan tersaji memberi 40 poin dasar + 20 poin per bahan + bonus sampai 50 poin kalau disajikan saat pelanggan masih sabar, dikali kombo (+10% per sajian beruntun tanpa gagal).
- Pesanan yang kesabarannya habis akan hangus dan mengurangi 1 hati. Kamu punya 3 hati — kalau habis, shift berakhir.
- Sajian beruntun membangun kombo; pesanan hangus memutus kombo.

## Cara Main

Klik (atau sentuh) langsung stasiun dapurnya: wadah bahan, talenan, panggangan, piring, tempat sampah, dan tombol sajikan. Bisa juga pakai keyboard:

| Tombol | Aksi |
| --- | --- |
| `1`–`5` | Ambil bahan dari wadah (Roti, Daging, Selada, Tomat, Keju) |
| `C` | Potong di talenan |
| `G` | Taruh/ambil daging di panggangan |
| `V` | Taruh/ambil bahan di piring |
| `X` / `Backspace` | Buang yang dibawa ke tempat sampah |
| `Spasi` / `Enter` | Sajikan hidangan |
| `P` / `Esc` | Jeda |
| `M` | Bisukan suara |

## Cara Menjalankan Lokal

Butuh Node 22 (hanya standard library, tanpa dependensi).

**Bangun output entry** (menyalin `game/` dan `screenshots/` ke direktori output dan menulis `dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

**Mainkan di browser** — server statis kecil yang menyajikan `game/` di `http://localhost:8080`:

```sh
node serve.ts
```

Lalu buka `http://localhost:8080` di browser. Port bisa diubah dengan `node serve.ts --port 9000`.

<sub>Entered on [make.fun](https://make.fun/?ref=az67d75r&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>

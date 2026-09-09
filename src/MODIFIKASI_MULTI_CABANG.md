# Modifikasi Kasir Pintar POS — Multi-Cabang

Perubahan pada versi ini:

- Manajemen cabang: tambah, pilih, dan hapus cabang.
- Data produk, transaksi, pengaturan, shift, dan pesanan hold dipisahkan per cabang pada browser.
- Kategori produk dibatasi menjadi `Minuman` dan `Buah-buahan`.
- Form produk mendukung foto dari kamera/galeri melalui input gambar dan preview.
- Pembayaran DANA ditambahkan sebagai metode pembayaran dengan link DANA yang dapat diatur dari Pengaturan Toko.
- Pembayaran Cash tetap mendukung input uang dan kembalian.

## Catatan penting

Versi ini adalah tahap multi-cabang lokal/offline: pemisahan data cabang masih memakai storage browser. Artinya beberapa cabang pada perangkat yang sama dapat dikelola, tetapi sinkronisasi real-time antar HP/komputer belum aktif.

Untuk penggunaan produksi beberapa cabang melalui internet, tahap berikutnya adalah mengganti storage browser dengan database online + autentikasi pengguna + role Admin/Kasir + sinkronisasi stok/transaksi.

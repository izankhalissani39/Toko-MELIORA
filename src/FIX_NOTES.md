# Perbaikan POS

- Katalog 52 produk dipertahankan.
- Semua gambar produk sekarang lokal di `src/assets/products/`, sehingga tidak bergantung pada URL gambar eksternal dan tidak tertukar antar menu.
- `App.js` menyelaraskan katalog terbaru ke localStorage sambil mempertahankan stok dan harga yang sudah diedit.
- `PaymentModal.js` diberi guard anti-double-submit dan pembayaran tidak lagi menunggu 400ms sebelum commit.

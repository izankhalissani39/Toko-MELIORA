# Toko MELIORA POS V3

Versi ini menambahkan konfigurasi build Vite agar aplikasi React dapat dibuild sebelum GitHub Pages.

## Struktur penting
- `package.json` - dependency dan script build
- `vite.config.js` - konfigurasi Vite dan base GitHub Pages
- `.github/workflows/deploy.yml` - build + deploy otomatis

## GitHub Pages
Repository: `Toko-MELIORA`
Base URL: `/Toko-MELIORA/`

Setelah file proyek di-commit ke branch `main`, workflow `Deploy POS Multi-Cabang V3` akan:
1. Menggunakan Node.js 22
2. Menjalankan `npm install`
3. Menjalankan `npm run build`
4. Meng-upload folder `dist`
5. Deploy ke GitHub Pages

## Catatan
Data POS pada versi ini masih menggunakan penyimpanan browser/localStorage. Untuk penggunaan multi-cabang secara nyata antar-perangkat, tahap berikutnya adalah menambahkan database online dan autentikasi.

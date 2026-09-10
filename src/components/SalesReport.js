import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, CreditCard, Download, PieChart, BarChart3, Package, ArrowUpRight, Calendar } from 'lucide-react';
import { formatRupiah, formatNumber } from '../utils/formatters.js';

export const SalesReport = ({ transactions, products }) => {
    const [timeFilter, setTimeFilter] = useState('today');
    // State baru untuk menampung rentang tanggal kustom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Filter transaksi berdasarkan jangka waktu terpilih atau kalender kustom
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;

        return transactions.filter((t) => {
            if (t.status !== 'completed')
                return false;

            const txTime = new Date(t.date).getTime();

            // Logika Penyaringan Berdasarkan Kalender Kustom
            if (timeFilter === 'custom') {
                if (startDate && endDate) {
                    // Set waktu mulai ke jam 00:00:00
                    const start = new Date(startDate).setHours(0, 0, 0, 0);
                    // Set waktu akhir ke jam 23:59:59 supaya hari tersebut terhitung penuh
                    const end = new Date(endDate).setHours(23, 59, 59, 999);
                    return txTime >= start && txTime <= end;
                }
                if (startDate) {
                    const start = new Date(startDate).setHours(0, 0, 0, 0);
                    return txTime >= start;
                }
                if (endDate) {
                    const end = new Date(endDate).setHours(23, 59, 59, 999);
                    return txTime <= end;
                }
                return true; // Jika tab kustom dipilih tapi tanggal belum diisi
            }

            // Logika Penyaringan Cepat (Bawaan)
            if (timeFilter === 'today')
                return txTime >= startOfToday;
            if (timeFilter === '7days')
                return txTime >= sevenDaysAgo;
            if (timeFilter === '30days')
                return txTime >= thirtyDaysAgo;
            return true;
        });
    }, [transactions, timeFilter, startDate, endDate]);

    // Ringkasan Keuangan Tingkat Tinggi
    const metrics = useMemo(() => {
        const totalSales = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const totalCost = filteredTransactions.reduce((sum, t) => sum + (t.totalCost || 0), 0);
        const totalTax = filteredTransactions.reduce((sum, t) => sum + (t.taxAmount || 0), 0);
        const netSalesBeforeTax = totalSales - totalTax;
        const grossProfit = netSalesBeforeTax - totalCost;
        const profitMargin = netSalesBeforeTax > 0 ? Math.round((grossProfit / netSalesBeforeTax) * 100) : 0;
        const totalTransactions = filteredTransactions.length;
        const avgOrderValue = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;
        const totalItemsSold = filteredTransactions.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0);
        return {
            totalSales,
            totalCost,
            grossProfit,
            profitMargin,
            totalTransactions,
            avgOrderValue,
            totalItemsSold,
        };
    }, [filteredTransactions]);

    // Penjualan berdasarkan Kategori
    const categorySales = useMemo(() => {
        const map = {};
        filteredTransactions.forEach((t) => {
            const discountFactor = t.subtotal > 0 ? Math.max(0, (t.subtotal - t.discountAmount) / t.subtotal) : 1;
            t.items.forEach((item) => {
                const prod = products.find((p) => p.id === item.productId);
                const cat = prod?.category || 'Lainnya';
                if (!map[cat]) {
                    map[cat] = { count: 0, revenue: 0 };
                }
                map[cat].count += item.quantity;
                map[cat].revenue += item.subtotal * discountFactor;
            });
        });
        return Object.entries(map)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredTransactions, products]);

    // Produk Paling Laris
    const topProducts = useMemo(() => {
        const map = {};
        filteredTransactions.forEach((t) => {
            const discountFactor = t.subtotal > 0 ? Math.max(0, (t.subtotal - t.discountAmount) / t.subtotal) : 1;
            t.items.forEach((item) => {
                if (!map[item.productId]) {
                    map[item.productId] = {
                        name: item.productName,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                map[item.productId].quantity += item.quantity;
                map[item.productId].revenue += item.subtotal * discountFactor;
            });
        });
        return Object.values(map)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 6);
    }, [filteredTransactions]);

    // Pecahan Metode Pembayaran
    const paymentMethodShare = useMemo(() => {
        const map = {
            cash: { count: 0, total: 0 },
            qris: { count: 0, total: 0 },
            transfer: { count: 0, total: 0 },
            debit: { count: 0, total: 0 },
            credit: { count: 0, total: 0 },
        };
        filteredTransactions.forEach((t) => {
            const method = t.paymentMethod || 'cash';
            if (!map[method])
                map[map] = { count: 0, total: 0 };
            map[method].count += 1;
            map[method].total += t.totalAmount;
        });
        return [
            { id: 'cash', name: 'Tunai (Cash)', ...map.cash, color: 'bg-emerald-500' },
            { id: 'qris', name: 'QRIS / E-Wallet', ...map.qris, color: 'bg-purple-500' },
            { id: 'transfer', name: 'Transfer Bank', ...map.transfer, color: 'bg-blue-500' },
            { id: 'debit', name: 'Kartu Debit', ...map.debit, color: 'bg-amber-500' },
            { id: 'credit', name: 'Kartu Kredit', ...map.credit, color: 'bg-orange-500' },
        ].filter((m) => m.count > 0 || m.total > 0);
    }, [filteredTransactions]);

    // Ekspor ke CSV
    const handleExportCSV = () => {
        if (filteredTransactions.length === 0) {
            alert('Tidak ada data untuk diekspor!');
            return;
        }
        const headers = ['No Invoice', 'Tanggal', 'Kasir', 'Pelanggan', 'Metode Pembayaran', 'Subtotal', 'Diskon', 'PPN', 'Total Tagihan', 'Total Modal', 'Status'];
        const rows = filteredTransactions.map((t) => [
            t.invoiceNumber,
            `"${t.date}"`,
            `"${t.cashierName}"`,
            `"${t.customerName || 'Umum'}"`,
            t.paymentMethod,
            t.subtotal,
            t.discountAmount,
            t.taxAmount,
            t.totalAmount,
            t.totalCost || 0,
            t.status,
        ]);
        const filenameSuffix = timeFilter === 'custom' ? `${startDate}_to_${endDate}` : timeFilter;
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Laporan_Penjualan_${filenameSuffix}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (_jsxs("div", { className: "max-w-7xl mx-auto p-4 sm:p-6 space-y-6", children: [
        _jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4", children: [
            _jsxs("div", { className: "flex items-center space-x-2 shrink-0", children: [
                _jsx(BarChart3, { className: "w-5 h-5 text-emerald-600" }), 
                _jsx("h2", { className: "font-bold text-base text-slate-800", children: "Laporan & Analitik Penjualan" })
            ] }), 
            _jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-end", children: [
                // Render form Kalender Kustom jika filter 'custom' aktif
                timeFilter === 'custom' && (_jsxs("div", { className: "flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto dynamic-fade-in", children: [
                    _jsx(Calendar, { className: "w-3.5 h-3.5 text-slate-400 ml-1" }),
                    _jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "bg-transparent text-xs text-slate-700 font-semibold focus:outline-none border-none p-0 cursor-pointer" }),
                    _jsx("span", { className: "text-xs text-slate-400 font-bold", children: "s/d" }),
                    _jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "bg-transparent text-xs text-slate-700 font-semibold focus:outline-none border-none p-0 cursor-pointer" })
                ] })),
                _jsxs("div", { className: "flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto", children: [
                    { id: 'today', label: 'Hari Ini' },
                    { id: '7days', label: '7 Hari' },
                    { id: '30days', label: '30 Hari' },
                    { id: 'all', label: 'Semua' },
                    { id: 'custom', label: 'Kustom' }, // Tab Baru untuk Kalender
             

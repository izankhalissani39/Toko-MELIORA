import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS, INITIAL_TRANSACTIONS, PRODUCT_CATALOG_VERSION } from './data/initialData.js';
import { Navbar } from './components/Navbar.js';
import { PosRegister } from './components/PosRegister.js';
import { PaymentModal } from './components/PaymentModal.js';
import { ReceiptModal } from './components/ReceiptModal.js';
import { InventoryManager } from './components/InventoryManager.js';
import { TransactionHistory } from './components/TransactionHistory.js';
import { SalesReport } from './components/SalesReport.js';
import { ShiftModal } from './components/ShiftModal.js';
import { StoreSettingsModal } from './components/StoreSettingsModal.js';
import { CameraBarcodeScanner } from './components/CameraBarcodeScanner.js';
import { MobileInstallGuideModal } from './components/MobileInstallGuideModal.js';
import { BottomMobileNav } from './components/BottomMobileNav.js';
import { ToastContainer } from './components/Toast.js';
import { BranchSwitcher } from './components/BranchSwitcher.js';
import { BranchManager } from './components/BranchManager.js';
const BRANCHES_STORAGE_KEY = 'pos_branches_v1';
const ACTIVE_BRANCH_STORAGE_KEY = 'pos_active_branch_v1';
const getBranchKey = (branchId, suffix) => `pos_branch_${branchId}_${suffix}`;
const makeBranchId = () => `branch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const DEFAULT_BRANCHES = [{ id: 'branch-main', name: 'Cabang Utama', address: '' }];
const readJson = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
const normalizeProducts = (items) => (Array.isArray(items) ? items : []).map(p => ({ ...p, category: p.category === 'Buah-buahan' ? 'Buah-buahan' : 'Minuman' }));
const readBranchData = (branchId) => ({
    products: normalizeProducts(readJson(getBranchKey(branchId, 'products'), readJson('pos_products', INITIAL_PRODUCTS))),
    transactions: readJson(getBranchKey(branchId, 'transactions'), readJson('pos_transactions', INITIAL_TRANSACTIONS)),
    storeSettings: { ...INITIAL_STORE_SETTINGS, ...readJson(getBranchKey(branchId, 'settings'), readJson('pos_store_settings', INITIAL_STORE_SETTINGS)) },
    currentShift: readJson(getBranchKey(branchId, 'current_shift'), null),
    heldOrders: readJson(getBranchKey(branchId, 'held_orders'), []),
});
export default function App() {
    // --- Toast Messages ---
    const [toasts, setToasts] = useState([]);
    const showToast = (message, type = 'info') => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    };
    const dismissToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };
    // --- Persistent States from LocalStorage ---
    const [branches, setBranches] = useState(() => readJson(BRANCHES_STORAGE_KEY, DEFAULT_BRANCHES));
    const [currentBranchId, setCurrentBranchId] = useState(() => localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY) || 'branch-main');
    const [isBranchManagerOpen, setIsBranchManagerOpen] = useState(false);
    const [products, setProducts] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_products');
            const parsed = saved ? JSON.parse(saved) : null;
            if (!Array.isArray(parsed) || parsed.length === 0) return normalizeProducts(readBranchData(localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY) || 'branch-main').products);
            const byId = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
            const merged = parsed.map((savedProduct) => {
                const catalogProduct = byId.get(savedProduct.id);
                if (!catalogProduct) return savedProduct;
                return {
                    ...catalogProduct,
                    stock: Number.isFinite(savedProduct.stock) ? savedProduct.stock : catalogProduct.stock,
                    costPrice: Number.isFinite(savedProduct.costPrice) ? savedProduct.costPrice : catalogProduct.costPrice,
                    sellingPrice: Number.isFinite(savedProduct.sellingPrice) ? savedProduct.sellingPrice : catalogProduct.sellingPrice,
                    minStockAlert: Number.isFinite(savedProduct.minStockAlert) ? savedProduct.minStockAlert : catalogProduct.minStockAlert,
                };
            });
            const existing = new Set(merged.map((p) => p.id));
            for (const product of INITIAL_PRODUCTS) if (!existing.has(product.id)) merged.push(product);
            return normalizeProducts(merged);
        }
        catch {
            return normalizeProducts(INITIAL_PRODUCTS);
        }
    });
    const [transactions, setTransactions] = useState(() => {
        try {
            const saved = localStorage.getItem(getBranchKey(localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY) || 'branch-main', 'transactions'));
            return saved ? JSON.parse(saved) : readJson('pos_transactions', INITIAL_TRANSACTIONS);
        }
        catch {
            return INITIAL_TRANSACTIONS;
        }
    });
    const [storeSettings, setStoreSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(getBranchKey(localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY) || 'branch-main', 'settings'));
            return saved ? { ...INITIAL_STORE_SETTINGS, ...JSON.parse(saved) } : { ...INITIAL_STORE_SETTINGS, ...readJson('pos_store_settings', INITIAL_STORE_SETTINGS) };
        }
        catch {
            return INITIAL_STORE_SETTINGS;
        }
    });
    const [currentShift, setCurrentShift] = useState(() => {
        try {
            const saved = localStorage.getItem(getBranchKey(localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY) || 'branch-main', 'current_shift'));
            if (saved)
                return JSON.parse(saved);
            // Auto initialize an open default shift
            const initShift = {
                id: `shift-${Date.now()}`,
                cashierName: storeSettings.defaultCashierName,
                startTime: new Date().toISOString(),
                startingCash: 200000,
                cashSales: 0,
                nonCashSales: 0,
                totalSales: 0,
                transactionCount: 0,
                status: 'open',
            };
            return initShift;
        }
        catch {
            return null;
        }
    });
    const [heldOrders, setHeldOrders] = useState(() => {
        try {
            const saved = localStorage.getItem(getBranchKey(localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY) || 'branch-main', 'held_orders'));
            return saved ? JSON.parse(saved) : [];
        }
        catch {
            return [];
        }
    });
    // --- Runtime Session States ---
    const [activeTab, setActiveTab] = useState('pos');
    const [cart, setCart] = useState([]);
    // Modals
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [activeCartSummary, setActiveCartSummary] = useState({
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        customerName: 'Pelanggan Umum',
    });
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [lastTransaction, setLastTransaction] = useState(null);
    const paymentCommitRef = useRef(null);
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
    const [isMobileGuideOpen, setIsMobileGuideOpen] = useState(false);
    // --- Persist data to LocalStorage whenever modified ---
    useEffect(() => {
        localStorage.setItem(getBranchKey(currentBranchId, 'products'), JSON.stringify(products));
        localStorage.setItem('pos_catalog_version', PRODUCT_CATALOG_VERSION);
    }, [products]);
    useEffect(() => {
        localStorage.setItem(getBranchKey(currentBranchId, 'transactions'), JSON.stringify(transactions));
    }, [transactions]);
    useEffect(() => {
        localStorage.setItem(getBranchKey(currentBranchId, 'settings'), JSON.stringify(storeSettings));
    }, [storeSettings]);
    useEffect(() => {
        if (currentShift) {
            localStorage.setItem(getBranchKey(currentBranchId, 'current_shift'), JSON.stringify(currentShift));
        }
        else {
            localStorage.removeItem(getBranchKey(currentBranchId, 'current_shift'));
        }
    }, [currentShift]);
    useEffect(() => {
        localStorage.setItem(getBranchKey(currentBranchId, 'held_orders'), JSON.stringify(heldOrders));
    }, [heldOrders]);
    // Keep product snapshots in the active cart synchronized with the latest inventory data.
    useEffect(() => {
        setCart((prevCart) => prevCart
            .map((item) => {
            const latestProduct = products.find((product) => product.id === item.product.id);
            if (!latestProduct)
                return null;
            return { ...item, product: latestProduct };
        })
            .filter((item) => item !== null));
    }, [products]);
    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // F9 -> Checkout in POS mode
            if (e.key === 'F9') {
                e.preventDefault();
                if (activeTab === 'pos' && cart.length > 0 && !isPaymentOpen) {
                    // Reuse the POS checkout button so F9 always uses the exact same
                    // customer, item-discount, global-discount, and tax calculations.
                    document.getElementById('pos-pay-button')?.click();
                }
            }
            // F2 -> POS Tab
            if (e.key === 'F2') {
                e.preventDefault();
                setActiveTab('pos');
            }
            // F3 -> Inventory Tab
            if (e.key === 'F3') {
                e.preventDefault();
                setActiveTab('inventory');
            }
            // F4 -> Transaction History Tab
            if (e.key === 'F4') {
                e.preventDefault();
                setActiveTab('transactions');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, cart, isPaymentOpen]);
    useEffect(() => { localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(branches)); }, [branches]);
    useEffect(() => { localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, currentBranchId); }, [currentBranchId]);
    const switchBranch = (branchId) => {
        if (!branchId || branchId === currentBranchId) return;
        const data = readBranchData(branchId);
        setProducts(data.products);
        setTransactions(data.transactions);
        setStoreSettings(data.storeSettings);
        setCurrentShift(data.currentShift);
        setHeldOrders(data.heldOrders);
        setCart([]);
        setActiveTab('pos');
        setCurrentBranchId(branchId);
        showToast(`Beralih ke ${branches.find(b => b.id === branchId)?.name || 'cabang'}.`, 'success');
    };
    const createBranch = ({ name, address }) => {
        const id = makeBranchId();
        const data = readBranchData(currentBranchId);
        const branchSettings = { ...data.storeSettings, storeName: name, address: address || data.storeSettings.address };
        localStorage.setItem(getBranchKey(id, 'products'), JSON.stringify(normalizeProducts(data.products)));
        localStorage.setItem(getBranchKey(id, 'transactions'), JSON.stringify([]));
        localStorage.setItem(getBranchKey(id, 'settings'), JSON.stringify(branchSettings));
        localStorage.setItem(getBranchKey(id, 'current_shift'), JSON.stringify(null));
        localStorage.setItem(getBranchKey(id, 'held_orders'), JSON.stringify([]));
        setBranches(prev => [...prev, { id, name, address: address || '' }]);
        switchBranch(id);
    };
    const deleteBranch = (branchId) => {
        if (branches.length <= 1 || branchId === currentBranchId) { showToast('Cabang aktif tidak dapat dihapus. Pindah ke cabang lain terlebih dahulu.', 'warning'); return; }
        setBranches(prev => prev.filter(b => b.id !== branchId));
        ['products','transactions','settings','current_shift','held_orders'].forEach(suffix => localStorage.removeItem(getBranchKey(branchId, suffix)));
        showToast('Cabang berhasil dihapus.', 'success');
    };

    // --- Checkout Handlers ---
    const handleOpenPayment = (cartSummary) => {
        if (!currentShift || currentShift.status !== 'open') {
            showToast('Buka shift kasir terlebih dahulu sebelum melakukan pembayaran.', 'warning');
            setIsShiftModalOpen(true);
            return;
        }
        for (const item of cart) {
            const latestProduct = products.find((product) => product.id === item.product.id);
            if (!latestProduct) {
                showToast(`Produk "${item.product.name}" sudah tidak tersedia di inventori.`, 'error');
                return;
            }
            if (item.quantity > latestProduct.stock) {
                showToast(`Stok "${latestProduct.name}" berubah. Tersedia ${latestProduct.stock} ${latestProduct.unit}, keranjang meminta ${item.quantity}.`, 'error');
                return;
            }
        }
        setActiveCartSummary(cartSummary);
        setIsPaymentOpen(true);
    };
    const handlePaymentSuccess = (newTransaction) => {
        // Idempotency guard: the same payment can only be committed once.
        if (!newTransaction?.id || paymentCommitRef.current === newTransaction.id) {
            showToast('Pembayaran sudah diproses atau transaksi tidak valid.', 'warning');
            return false;
        }
        paymentCommitRef.current = newTransaction.id;
        if (!currentShift || currentShift.status !== 'open') {
            showToast('Pembayaran dibatalkan karena shift kasir tidak aktif.', 'error');
            setIsPaymentOpen(false);
            setIsShiftModalOpen(true);
            paymentCommitRef.current = null;
            return false;
        }
        // Revalidate against the latest inventory immediately before committing the transaction.
        for (const itemSold of newTransaction.items) {
            const latestProduct = products.find((product) => product.id === itemSold.productId);
            if (!latestProduct || itemSold.quantity > latestProduct.stock) {
                showToast(latestProduct
                    ? `Pembayaran dibatalkan: stok ${latestProduct.name} tinggal ${latestProduct.stock} ${latestProduct.unit}.`
                    : `Pembayaran dibatalkan: produk ${itemSold.productName} tidak lagi tersedia.`, 'error');
                paymentCommitRef.current = null;
                return false;
            }
        }
        // 1. Deduct quantities from product inventory (never mask an oversell by clamping to zero)
        setProducts((prevProducts) => prevProducts.map((prod) => {
            const itemSold = newTransaction.items.find((i) => i.productId === prod.id);
            return itemSold ? { ...prod, stock: prod.stock - itemSold.quantity } : prod;
        }));
        // 2. Add to transaction log
        setTransactions((prev) => [newTransaction, ...prev]);
        // 3. Update current shift record
        if (currentShift && currentShift.status === 'open') {
            const isCash = newTransaction.paymentMethod === 'cash';
            setCurrentShift((prev) => {
                if (!prev)
                    return null;
                return {
                    ...prev,
                    cashSales: isCash ? prev.cashSales + newTransaction.totalAmount : prev.cashSales,
                    nonCashSales: !isCash ? prev.nonCashSales + newTransaction.totalAmount : prev.nonCashSales,
                    totalSales: prev.totalSales + newTransaction.totalAmount,
                    transactionCount: prev.transactionCount + 1,
                };
            });
        }
        // 4. Close payment modal & open receipt view
        setIsPaymentOpen(false);
        setLastTransaction(newTransaction);
        setIsReceiptOpen(true);
        setCart([]);
        return true;
    };
    const handleNewTransaction = () => {
        setIsReceiptOpen(false);
        setLastTransaction(null);
        setCart([]);
    };
    // --- Hold & Restore Orders ---
    const handleHoldOrder = (customerName, globalDiscountPercent) => {
        if (cart.length === 0)
            return;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const normalizedCustomerName = customerName.trim() || 'Pelanggan Umum';
        const newHold = {
            id: `hold-${Date.now()}`,
            name: normalizedCustomerName,
            customerName: normalizedCustomerName,
            time: timeStr,
            items: cart.map((item) => ({ ...item, product: { ...item.product } })),
            globalDiscountPercent,
        };
        setHeldOrders((prev) => [newHold, ...prev]);
    };
    const handleRestoreHeldOrder = (orderId) => {
        const target = heldOrders.find((o) => o.id === orderId);
        if (!target)
            return null;
        const refreshedItems = [];
        let adjusted = false;
        for (const item of target.items) {
            const latestProduct = products.find((product) => product.id === item.product.id);
            if (!latestProduct || latestProduct.stock <= 0) {
                adjusted = true;
                continue;
            }
            const safeQuantity = Math.min(item.quantity, latestProduct.stock);
            if (safeQuantity !== item.quantity)
                adjusted = true;
            refreshedItems.push({ ...item, product: latestProduct, quantity: safeQuantity });
        }
        setCart(refreshedItems);
        setHeldOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (adjusted) {
            showToast('Pesanan Hold disesuaikan dengan stok inventori terbaru.', 'warning');
        }
        return { ...target, items: refreshedItems };
    };
    const handleDeleteHeldOrder = (orderId) => {
        setHeldOrders((prev) => prev.filter((o) => o.id !== orderId));
    };
    // --- Inventory Handlers ---
    const handleAddProduct = (newProduct) => {
        setProducts((prev) => [newProduct, ...prev]);
    };
    const handleUpdateProduct = (updatedProduct) => {
        setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    };
    const handleDeleteProduct = (productId) => {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
    };
    const handleQuickAdjustStock = (productId, newStock) => {
        setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)));
    };
    // --- Transaction Actions ---
    const handleReprintReceipt = (tx) => {
        setLastTransaction(tx);
        setIsReceiptOpen(true);
    };
    const handleRefundTransaction = (transactionId, reason) => {
        const targetTx = transactions.find((t) => t.id === transactionId);
        if (!targetTx || targetTx.status === 'refunded')
            return;
        // 1. Return stock quantities back to products
        setProducts((prevProducts) => prevProducts.map((prod) => {
            const itemReturned = targetTx.items.find((i) => i.productId === prod.id);
            if (itemReturned) {
                return { ...prod, stock: prod.stock + itemReturned.quantity };
            }
            return prod;
        }));
        // 2. If the refunded sale belongs to the currently open shift, reverse its shift totals.
        if (currentShift?.status === 'open' && new Date(targetTx.date).getTime() >= new Date(currentShift.startTime).getTime()) {
            const isCash = targetTx.paymentMethod === 'cash';
            setCurrentShift((prev) => {
                if (!prev || prev.status !== 'open')
                    return prev;
                return {
                    ...prev,
                    cashSales: isCash ? Math.max(0, prev.cashSales - targetTx.totalAmount) : prev.cashSales,
                    nonCashSales: !isCash ? Math.max(0, prev.nonCashSales - targetTx.totalAmount) : prev.nonCashSales,
                    totalSales: Math.max(0, prev.totalSales - targetTx.totalAmount),
                    transactionCount: Math.max(0, prev.transactionCount - 1),
                };
            });
        }
        // 3. Mark transaction as refunded
        setTransactions((prev) => prev.map((t) => t.id === transactionId
            ? { ...t, status: 'refunded', refundReason: reason }
            : t));
    };
    // --- Shift Session Handlers ---
    const handleStartShift = (startingCash, cashierName) => {
        const newShift = {
            id: `shift-${Date.now()}`,
            cashierName,
            startTime: new Date().toISOString(),
            startingCash,
            cashSales: 0,
            nonCashSales: 0,
            totalSales: 0,
            transactionCount: 0,
            status: 'open',
        };
        setCurrentShift(newShift);
    };
    const handleCloseShift = (actualCash, notes) => {
        if (!currentShift)
            return;
        const closedShift = {
            ...currentShift,
            endTime: new Date().toISOString(),
            actualCashEnding: actualCash,
            cashDifference: actualCash - (currentShift.startingCash + currentShift.cashSales),
            status: 'closed',
            notes,
        };
        setCurrentShift(closedShift);
        showToast(`Shift untuk ${currentShift.cashierName} berhasil ditutup.`, 'success');
    };
    // --- Barcode Camera Scan Handler ---
    const handleScanCameraSuccess = (product) => {
        if (product.stock <= 0) {
            showToast(`Stok untuk "${product.name}" telah habis!`, 'error');
            return;
        }
        const existingIndex = cart.findIndex((item) => item.product.id === product.id);
        if (existingIndex > -1) {
            const currentQty = cart[existingIndex].quantity;
            if (currentQty >= product.stock) {
                showToast(`Jumlah melebihi stok yang tersedia (${product.stock} ${product.unit}).`, 'warning');
                return;
            }
            const updatedCart = [...cart];
            updatedCart[existingIndex].quantity += 1;
            setCart(updatedCart);
            showToast(`+1 ${product.name} ditambahkan ke keranjang`, 'success');
        }
        else {
            setCart([...cart, { product, quantity: 1, customDiscount: 0 }]);
            showToast(`${product.name} ditambahkan ke keranjang`, 'success');
        }
        // Switch to POS tab if not currently active
        if (activeTab !== 'pos') {
            setActiveTab('pos');
        }
    };
    // --- Settings & Data Handlers ---
    const handleResetToDemo = () => {
        setProducts(normalizeProducts(INITIAL_PRODUCTS));
        setTransactions(INITIAL_TRANSACTIONS);
        setStoreSettings(INITIAL_STORE_SETTINGS);
        setHeldOrders([]);
        setCart([]);
        setCurrentShift({
            id: `shift-${Date.now()}`,
            cashierName: INITIAL_STORE_SETTINGS.defaultCashierName,
            startTime: new Date().toISOString(),
            startingCash: 200000,
            cashSales: 0,
            nonCashSales: 0,
            totalSales: 0,
            transactionCount: 0,
            status: 'open',
        });
    };
    const handleImportData = (importedData) => {
        setProducts(importedData.products);
        setTransactions(importedData.transactions);
        setStoreSettings(importedData.settings);
        if ('currentShift' in importedData)
            setCurrentShift(importedData.currentShift ?? null);
        if (importedData.heldOrders)
            setHeldOrders(importedData.heldOrders);
        setCart([]);
    };
    return (_jsxs("div", { className: "min-h-screen bg-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white", children: [_jsx(Navbar, { activeTab: activeTab, setActiveTab: setActiveTab, cartCount: cart.reduce((s, i) => s + i.quantity, 0), storeSettings: storeSettings, currentShift: currentShift, onOpenShiftModal: () => setIsShiftModalOpen(true), onOpenSettings: () => setIsSettingsModalOpen(true), onOpenMobileGuide: () => setIsMobileGuideOpen(true), onOpenCameraScanner: () => setIsCameraScannerOpen(true) }), _jsx(BranchSwitcher, { branches: branches, activeBranchId: currentBranchId, onSwitch: switchBranch, onManage: () => setIsBranchManagerOpen(true) }), _jsxs("main", { className: "flex-1 pb-16 lg:pb-0", children: [activeTab === 'pos' && (_jsx(PosRegister, { products: products, cart: cart, setCart: setCart, storeSettings: storeSettings, onOpenPayment: handleOpenPayment, heldOrders: heldOrders, onHoldOrder: handleHoldOrder, onRestoreHeldOrder: handleRestoreHeldOrder, onDeleteHeldOrder: handleDeleteHeldOrder, onOpenCameraScanner: () => setIsCameraScannerOpen(true) })), activeTab === 'inventory' && (_jsx(InventoryManager, { products: products, onAddProduct: handleAddProduct, onUpdateProduct: handleUpdateProduct, onDeleteProduct: handleDeleteProduct, onQuickAdjustStock: handleQuickAdjustStock })), activeTab === 'transactions' && (_jsx(TransactionHistory, { transactions: transactions, onReprintReceipt: handleReprintReceipt, onRefundTransaction: handleRefundTransaction, storeSettings: storeSettings })), activeTab === 'reports' && (_jsx(SalesReport, { transactions: transactions, products: products })), activeTab === 'settings' && (_jsx("div", { className: "max-w-4xl mx-auto p-4 sm:p-6", children: _jsxs("div", { className: "bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center", children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 mb-2", children: "Pengaturan Sistem Kasir" }), _jsx("p", { className: "text-sm text-slate-500 max-w-md mx-auto mb-6", children: "Atur informasi toko, identitas struk kasir, persentase pajak, serta backup dan restore data." }), _jsxs("div", { className: "flex flex-wrap items-center justify-center gap-3", children: [_jsx("button", { onClick: () => setIsSettingsModalOpen(true), className: "px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/20 transition-all", children: "Buka Panel Pengaturan" }), _jsx("button", { onClick: () => setIsMobileGuideOpen(true), className: "px-6 py-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-sm rounded-xl border border-slate-700 transition-all", children: "Panduan Pasang di HP & Tablet" })] })] }) }))] }), _jsx(BottomMobileNav, { activeTab: activeTab, setActiveTab: setActiveTab, cartCount: cart.reduce((s, i) => s + i.quantity, 0), onOpenMobileGuide: () => setIsMobileGuideOpen(true) }), _jsx(PaymentModal, { isOpen: isPaymentOpen, onClose: () => setIsPaymentOpen(false), cart: cart, cartSummary: activeCartSummary, storeSettings: storeSettings, onPaymentSuccess: handlePaymentSuccess, transactionCount: transactions.length, cashierName: currentShift?.cashierName || storeSettings.defaultCashierName }), _jsx(ReceiptModal, { isOpen: isReceiptOpen, onClose: () => setIsReceiptOpen(false), transaction: lastTransaction, storeSettings: storeSettings, onNewTransaction: handleNewTransaction }), _jsx(ShiftModal, { isOpen: isShiftModalOpen, onClose: () => setIsShiftModalOpen(false), currentShift: currentShift, onStartShift: handleStartShift, onCloseShift: handleCloseShift, transactions: transactions, storeSettings: storeSettings }), _jsx(StoreSettingsModal, { isOpen: isSettingsModalOpen, onClose: () => setIsSettingsModalOpen(false), settings: storeSettings, onSaveSettings: setStoreSettings, onResetToDemo: handleResetToDemo, products: products, transactions: transactions, currentShift: currentShift, heldOrders: heldOrders, onImportData: handleImportData }), _jsx(CameraBarcodeScanner, { isOpen: isCameraScannerOpen, onClose: () => setIsCameraScannerOpen(false), products: products, onScanSuccess: handleScanCameraSuccess }), _jsx(MobileInstallGuideModal, { isOpen: isMobileGuideOpen, onClose: () => setIsMobileGuideOpen(false) }), _jsx(BranchManager, { isOpen: isBranchManagerOpen, onClose: () => setIsBranchManagerOpen(false), branches: branches, activeBranchId: currentBranchId, onSwitchBranch: (id) => { switchBranch(id); setIsBranchManagerOpen(false); }, onCreateBranch: (data) => { createBranch(data); setIsBranchManagerOpen(false); }, onDeleteBranch: deleteBranch }), _jsx(ToastContainer, { toasts: toasts, onDismiss: dismissToast })] }));
}

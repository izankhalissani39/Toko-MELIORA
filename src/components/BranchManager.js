import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Building2, Plus, Trash2, X, ShieldCheck } from 'lucide-react';

export const BranchManager = ({ isOpen, onClose, branches, activeBranchId, onSwitchBranch, onCreateBranch, onDeleteBranch }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    if (!isOpen) return null;
    const submit = (e) => {
        e.preventDefault();
        const clean = name.trim();
        if (!clean) return;
        onCreateBranch({ name: clean, address: address.trim() });
        setName('');
        setAddress('');
    };
    return _jsx('div', { className: 'fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[60] flex items-center justify-center p-3 sm:p-4 overflow-y-auto', children:
        _jsxs('div', { className: 'bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden', children: [
            _jsxs('div', { className: 'p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between', children: [
                _jsxs('div', { className: 'flex items-center space-x-2.5', children: [_jsx(Building2, { className: 'w-5 h-5 text-emerald-400' }), _jsxs('div', { children: [_jsx('h3', { className: 'font-bold text-base', children: 'Manajemen Cabang' }), _jsx('p', { className: 'text-xs text-slate-400', children: 'Data kasir dan stok dipisahkan per cabang' })] })] }),
                _jsx('button', { onClick: onClose, className: 'p-1.5 text-slate-400 hover:text-white rounded-lg', children: _jsx(X, { className: 'w-5 h-5' }) })
            ] }),
            _jsxs('div', { className: 'p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto', children: [
                _jsx('div', { className: 'space-y-2', children: branches.map((branch) => _jsxs('div', { className: `p-3 rounded-2xl border flex items-center justify-between gap-3 ${branch.id === activeBranchId ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`, children: [
                    _jsxs('div', { className: 'min-w-0', children: [_jsxs('div', { className: 'flex items-center gap-2', children: [_jsx('span', { className: 'font-bold text-sm text-slate-900 truncate', children: branch.name }), branch.id === activeBranchId && _jsx('span', { className: 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold', children: 'AKTIF' })] }), _jsx('div', { className: 'text-[11px] text-slate-500 truncate', children: branch.address || 'Alamat cabang belum diisi' })] }),
                    _jsxs('div', { className: 'flex items-center gap-2 shrink-0', children: [branch.id !== activeBranchId && _jsx('button', { onClick: () => onSwitchBranch(branch.id), className: 'px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold', children: 'Gunakan' }), branches.length > 1 && _jsx('button', { onClick: () => onDeleteBranch(branch.id), className: 'p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100', title: 'Hapus cabang', children: _jsx(Trash2, { className: 'w-4 h-4' }) })] })
                ] }, branch.id)) }),
                _jsxs('form', { onSubmit: submit, className: 'border-t border-slate-200 pt-5 space-y-3', children: [
                    _jsxs('div', { className: 'flex items-center gap-2 text-sm font-bold text-slate-800', children: [_jsx(Plus, { className: 'w-4 h-4 text-emerald-600' }), 'Tambah Cabang Baru'] }),
                    _jsxs('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3', children: [
                        _jsx('input', { value: name, onChange: e => setName(e.target.value), required: true, placeholder: 'Contoh: Cabang Bukittinggi', className: 'w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500' }),
                        _jsx('input', { value: address, onChange: e => setAddress(e.target.value), placeholder: 'Alamat cabang', className: 'w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500' })
                    ] }),
                    _jsx('button', { type: 'submit', className: 'w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2', children: [_jsx(Plus, { className: 'w-4 h-4' }), 'Buat Cabang'] })
                ] }),
                _jsxs('div', { className: 'p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex gap-2', children: [_jsx(ShieldCheck, { className: 'w-4 h-4 text-emerald-600 shrink-0' }), _jsx('span', { children: 'Versi ini memisahkan data cabang di browser. Untuk sinkronisasi antar perangkat/cabang setelah hosting, tahap berikutnya adalah menghubungkan database online dan login pengguna.' })] })
            ] })
        ] })
    });
};

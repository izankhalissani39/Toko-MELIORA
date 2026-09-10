import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Building2, ChevronDown, Settings2 } from 'lucide-react';
export const BranchSwitcher = ({ branches, activeBranchId, onSwitch, onManage }) => {
    const active = branches.find(b => b.id === activeBranchId) || branches[0];
    return _jsx('div', { className: 'bg-white border-b border-slate-200 sticky top-14 sm:top-16 z-20', children: _jsxs('div', { className: 'max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 flex items-center justify-between gap-2', children: [
        _jsxs('div', { className: 'flex items-center gap-2 min-w-0', children: [_jsx(Building2, { className: 'w-4 h-4 text-emerald-600 shrink-0' }), _jsxs('div', { className: 'min-w-0', children: [_jsx('div', { className: 'text-[10px] uppercase tracking-wider font-bold text-slate-400', children: 'Cabang Aktif' }), _jsx('div', { className: 'text-xs sm:text-sm font-bold text-slate-800 truncate', children: active?.name || 'Cabang Utama' })] })] }),
        _jsxs('div', { className: 'flex items-center gap-2', children: [
            _jsxs('div', { className: 'relative', children: [_jsx('select', { value: activeBranchId, onChange: e => onSwitch(e.target.value), className: 'appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500', children: branches.map(b => _jsx('option', { value: b.id, children: b.name }, b.id)) }), _jsx(ChevronDown, { className: 'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500' })] }),
            _jsxs('button', { onClick: onManage, className: 'px-2.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5', children: [_jsx(Settings2, { className: 'w-3.5 h-3.5' }), _jsx('span', { className: 'hidden sm:inline', children: 'Kelola Cabang' })] })
        ] })
    ] }) });
};

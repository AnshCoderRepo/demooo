import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate, exportToCSV } from '../utils/formatters';
import { 
  History, Search, Filter, Download, User, Clock, 
  ArrowRight, ShieldCheck, ShieldAlert, RotateCcw 
} from 'lucide-react';

export const ChangeHistory: React.FC = () => {
  const { changeHistory, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const isHistoryFilterActive = searchQuery !== '' || typeFilter !== 'all' || actionFilter !== 'all';

  const handleResetHistoryFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setActionFilter('all');
  };

  const filteredHistory = changeHistory.filter((h) => {
    const matchesSearch = 
      h.entityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.reason && h.reason.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || h.entityType === typeFilter;
    const matchesAction = actionFilter === 'all' || h.action === actionFilter;
    return matchesSearch && matchesType && matchesAction;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Module / Entity Type', 'Entity Title', 'Action', 'Field Changed', 'Old Value', 'New Value', 'Reason'];
    const rows = filteredHistory.map((h) => [
      h.timestamp,
      h.userName,
      h.entityType,
      h.entityTitle,
      h.action,
      h.fieldChanged || 'N/A',
      h.oldValue || 'N/A',
      h.newValue || 'N/A',
      h.reason || 'N/A',
    ]);
    exportToCSV('System_Audit_Change_History', headers, rows);
    showToast({ type: 'success', title: 'Audit Trail Register Exported' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              System Change History & Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              {filteredHistory.length} Audit Entries
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Indelible tamper-evident log capturing who edited which record, timestamps, before/after values, and operational reasons.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filters & Search Suite */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search record, operator, field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isHistoryFilterActive && (
              <button
                onClick={handleResetHistoryFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors border border-rose-200"
                title="Reset audit filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <div className="text-[11px] text-slate-500 font-medium">
              Showing <strong className="text-slate-900 font-bold">{filteredHistory.length}</strong> of {changeHistory.length} audit entries
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-500" />
            Filters:
          </span>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Modules</option>
            <option value="Charter Booking">Charter Bookings</option>
            <option value="Route Ticket">Route Tickets</option>
            <option value="Bus">Fleet Buses</option>
            <option value="Worker">Workers & Payroll</option>
            <option value="Customer">Customers</option>
            <option value="Expense">Expenses</option>
            <option value="Payment">Payments & Ledger</option>
            <option value="GST Invoice">GST Invoices</option>
            <option value="Settings">System Settings</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Actions</option>
            <option value="Created">Created Record</option>
            <option value="Edited">Edited / Field Update</option>
            <option value="Credit Note Issued">Credit Note Issued</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Operator</th>
                <th className="p-3.5">Module & Record Title</th>
                <th className="p-3.5 text-center">Action</th>
                <th className="p-3.5">Value Transition (Old → New)</th>
                <th className="p-3.5">Logged Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredHistory.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 align-top font-mono text-slate-500 text-[11px]">
                    {h.timestamp}
                  </td>

                  <td className="p-3.5 align-top">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-500" />
                      <span>{h.userName}</span>
                    </div>
                  </td>

                  <td className="p-3.5 align-top">
                    <span className="inline-block px-2 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {h.entityType}
                    </span>
                    <div className="font-bold text-slate-900 mt-1">{h.entityTitle}</div>
                  </td>

                  <td className="p-3.5 align-top text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      h.action === 'Created'
                        ? 'bg-emerald-100 text-emerald-800'
                        : h.action === 'Cancelled' || h.action === 'Credit Note Issued'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {h.action}
                    </span>
                  </td>

                  <td className="p-3.5 align-top">
                    {h.oldValue && h.newValue ? (
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-rose-500 line-through bg-rose-50 px-1 rounded">
                          {h.oldValue}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                          {h.newValue}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">—</span>
                    )}
                  </td>

                  <td className="p-3.5 align-top text-slate-600 text-[11px] leading-relaxed max-w-xs">
                    {h.reason || 'Routine system update'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

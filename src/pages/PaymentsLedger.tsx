import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentRecord } from '../types';
import { formatINR, formatDate, exportToCSV, TODAY_STR, isDateInFilter, DateFilterOption } from '../utils/formatters';
import { 
  CreditCard, Plus, Search, Filter, Download, ArrowUpRight, 
  ArrowDownLeft, Printer, CheckCircle2, History, X, User, RotateCcw, Calendar 
} from 'lucide-react';

export const PaymentsLedger: React.FC = () => {
  const { 
    payments, 
    customers, 
    charterBookings, 
    addPayment, 
    openHistory, 
    showToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<PaymentRecord | null>(null);

  const [formData, setFormData] = useState({
    date: TODAY_STR,
    amount: 15000,
    type: 'credit' as 'credit' | 'debit',
    mode: 'UPI' as 'Cash' | 'UPI' | 'Bank' | 'Card',
    referenceUtr: 'UPI/20261102/DPKRAJ',
    customerId: '',
    customerName: 'Rajesh Verma (Verma Tent House)',
    category: 'Charter Advance' as PaymentRecord['category'],
    linkedId: 'ch-1',
    linkedType: 'charter' as 'charter' | 'ticket' | 'expense' | 'payroll' | 'general',
    notes: 'Advance installment received',
  });

  const isPaymentFilterActive = 
    searchQuery !== '' || 
    typeFilter !== 'all' || 
    modeFilter !== 'all' || 
    dateFilter !== 'all' || 
    categoryFilter !== 'all';

  const handleResetPaymentFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setModeFilter('all');
    setDateFilter('all');
    setCustomStart('');
    setCustomEnd('');
    setCategoryFilter('all');
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = 
      p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.referenceUtr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesMode = modeFilter === 'all' || p.mode === modeFilter;
    return matchesSearch && matchesType && matchesMode;
  });

  const totalInflows = payments.filter((p) => p.type === 'credit').reduce((s, p) => s + p.amount, 0);
  const totalOutflows = payments.filter((p) => p.type === 'debit').reduce((s, p) => s + p.amount, 0);
  const netCashflow = totalInflows - totalOutflows;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPayment({
      date: formData.date,
      amount: Number(formData.amount),
      type: formData.type,
      mode: formData.mode,
      referenceUtr: formData.referenceUtr,
      customerId: formData.customerId,
      customerName: formData.customerName,
      category: formData.category,
      linkedId: formData.linkedId,
      linkedType: formData.linkedType,
      notes: formData.notes,
    });
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Date', 'Type', 'Party Name', 'Amount', 'Payment Mode', 'Reference / UTR', 'Category', 'Notes'];
    const rows = filteredPayments.map((p) => [
      p.receiptNumber,
      p.date,
      p.type === 'credit' ? 'Inflow (Credit)' : 'Outflow (Debit)',
      p.customerName,
      p.amount,
      p.mode,
      p.referenceUtr,
      p.category,
      p.notes || '',
    ]);
    exportToCSV('Payments_Cashbook_Ledger', headers, rows);
    showToast({ type: 'success', title: 'Cashbook Ledger CSV Exported' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Payments & Cashbook Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              Live Bank & Cash Journal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time receipt generation, UPI/NEFT tracking, and instant ledger balance synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Cashbook</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment / Receipt</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-emerald-800 block">Total Inflows (Credits)</span>
            <span className="text-xl font-black font-mono text-emerald-950">{formatINR(totalInflows)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-rose-800 block">Total Outflows (Debits)</span>
            <span className="text-xl font-black font-mono text-rose-950">{formatINR(totalOutflows)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl flex items-center justify-between shadow">
          <div>
            <span className="text-[11px] font-bold uppercase text-amber-400 block">Net Company Balance</span>
            <span className="text-xl font-black font-mono text-white">{formatINR(netCashflow)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Suite */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search receipt #, party, UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 ml-1 mr-1" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
              >
                <option value="all">All Dates</option>
                <option value="today">Today (02 Nov)</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">Nov 2026</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 focus:outline-none"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 focus:outline-none"
                />
              </div>
            )}

            {isPaymentFilterActive && (
              <button
                onClick={handleResetPaymentFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors border border-rose-200"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-500" />
            Filters:
          </span>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Flows (Credits & Debits)</option>
            <option value="credit">Credits (Money In)</option>
            <option value="debit">Debits (Money Out)</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Payment Modes</option>
            <option value="UPI">UPI (PhonePe, GPay, Paytm)</option>
            <option value="Bank">Bank Transfer (NEFT/RTGS/IMPS)</option>
            <option value="Cash">Cash Receipt</option>
            <option value="Card">Debit / Credit Card</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Payment Categories</option>
            <option value="Charter Advance">Charter Advance</option>
            <option value="Charter Balance">Charter Balance</option>
            <option value="Route Ticket">Route Ticket Sale</option>
            <option value="Expense Payment">Fleet Operating Payment</option>
            <option value="Salary Disbursed">Worker Salary Disbursement</option>
            <option value="General">General Inflow/Outflow</option>
          </select>

          <div className="ml-auto text-[11px] text-slate-500 font-medium">
            Showing <strong className="text-slate-900 font-bold">{filteredPayments.length}</strong> of {payments.length} transactions
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Receipt No</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Party / Beneficiary</th>
                <th className="p-3.5">Category & Purpose</th>
                <th className="p-3.5">Mode & Reference / UTR</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 align-top">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {p.receiptNumber}
                    </span>
                  </td>

                  <td className="p-3.5 align-top text-slate-700 font-medium">
                    {formatDate(p.date)}
                  </td>

                  <td className="p-3.5 align-top">
                    <div className="font-bold text-slate-900">{p.customerName}</div>
                    {p.notes && <div className="text-[11px] text-slate-500 italic mt-0.5">{p.notes}</div>}
                  </td>

                  <td className="p-3.5 align-top">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                      {p.category}
                    </span>
                  </td>

                  <td className="p-3.5 align-top font-mono">
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      p.mode === 'UPI' ? 'bg-purple-100 text-purple-800' : p.mode === 'Cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {p.mode}
                    </span>
                    <div className="text-[11px] text-slate-500 truncate max-w-[170px] mt-0.5">
                      {p.referenceUtr}
                    </div>
                  </td>

                  <td className="p-3.5 align-top text-right font-mono font-black text-sm">
                    <span className={p.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}>
                      {p.type === 'credit' ? '+' : '-'}{formatINR(p.amount)}
                    </span>
                  </td>

                  <td className="p-3.5 align-top text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setPreviewReceipt(p)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Print Official Voucher Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openHistory('Payment', p.id, `${p.receiptNumber} (${p.customerName})`)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Audit History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Record Payment / Receipt</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Transaction Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="credit">Money In (Credit Receipt)</option>
                    <option value="debit">Money Out (Debit Payment)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Party / Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g. Rajesh Verma"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Payment Mode</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="UPI">UPI (GPay/Paytm)</option>
                    <option value="Bank">Bank NEFT/RTGS</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Card">POS Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Charter Advance">Charter Advance</option>
                    <option value="Charter Balance">Charter Balance</option>
                    <option value="Route Ticket">Route Ticket</option>
                    <option value="Salary Payment">Salary Payment</option>
                    <option value="Expense Payment">Expense Payment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">UTR / Cheque / Bank Ref No *</label>
                <input
                  type="text"
                  required
                  value={formData.referenceUtr}
                  onChange={(e) => setFormData({ ...formData, referenceUtr: e.target.value })}
                  placeholder="e.g. UPI/39102910481"
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Notes / Ledger Remarks</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. 50% advance for wedding charter"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Record & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Voucher Preview */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Official Payment Voucher Receipt
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs">
                  Print
                </button>
                <button onClick={() => setPreviewReceipt(null)} className="p-1 rounded text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="text-center border-b pb-3">
                <h3 className="font-black text-lg uppercase text-slate-950">Deepak Raj Travels</h3>
                <p className="text-slate-600 text-[11px]">Shop 14, Kashmere Gate ISBT, Delhi</p>
                <p className="font-mono font-bold text-xs mt-1">RECEIPT #{previewReceipt.receiptNumber}</p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Received From:</span>
                  <span className="font-bold text-slate-900">{previewReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Date:</span>
                  <span className="font-medium">{formatDate(previewReceipt.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Mode & Ref:</span>
                  <span className="font-mono font-medium">{previewReceipt.mode} ({previewReceipt.referenceUtr})</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-emerald-950 pt-1.5 border-t border-emerald-200">
                  <span>Amount Received:</span>
                  <span className="font-mono text-base">{formatINR(previewReceipt.amount)}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600">
                Purpose: <strong>{previewReceipt.category}</strong> - {previewReceipt.notes}
              </p>

              <div className="mt-4 pt-3 border-t flex justify-between text-[11px] text-slate-500">
                <span>Subject to realization</span>
                <span className="font-bold italic">Authorised Cashier</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

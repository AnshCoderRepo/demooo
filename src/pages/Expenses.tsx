import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory } from '../types';
import { formatINR, formatDate, exportToCSV, TODAY_STR, isDateInFilter, DateFilterOption } from '../utils/formatters';
import { 
  Receipt, Plus, Search, Filter, Download, ArrowUpRight, 
  TrendingDown, FileImage, History, Eye, X, CheckCircle, RotateCcw, Calendar 
} from 'lucide-react';

export const Expenses: React.FC = () => {
  const { 
    expenses, 
    buses, 
    charterBookings, 
    addExpense, 
    openHistory, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'expenses' | 'tripPnL'>('expenses');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [busFilter, setBusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [paidByFilter, setPaidByFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewBillUrl, setPreviewBillUrl] = useState<string | null>(null);

  const initialForm = {
    date: TODAY_STR,
    category: 'Diesel' as ExpenseCategory,
    amount: 14500,
    busId: 'bus-1',
    busNumber: 'DL 01 AB 4090',
    tripTitle: 'Delhi ↔ Ghaziabad Shadi',
    paidBy: 'Driver Surender',
    billPhotoUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
    gstPaid: 0,
    notes: '160 Litres Diesel @ Indian Oil',
  };

  const [formData, setFormData] = useState(initialForm);

  const isExpenseFilterActive = 
    searchQuery !== '' || 
    categoryFilter !== 'all' || 
    busFilter !== 'all' || 
    dateFilter !== 'all' || 
    paidByFilter !== 'all';

  const handleResetExpenseFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setBusFilter('all');
    setDateFilter('all');
    setCustomStart('');
    setCustomEnd('');
    setPaidByFilter('all');
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = 
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.busNumber && e.busNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.paidBy && e.paidBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesBus = busFilter === 'all' || e.busId === busFilter;
    return matchesSearch && matchesCat && matchesBus;
  });

  const totalExpenseAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalInputGst = filteredExpenses.reduce((s, e) => s + e.gstPaid, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBus = buses.find((b) => b.id === formData.busId);
    addExpense({
      date: formData.date,
      category: formData.category,
      amount: Number(formData.amount),
      busId: selectedBus?.id,
      busNumber: selectedBus?.plateNumber,
      tripTitle: formData.tripTitle,
      paidBy: formData.paidBy,
      billPhotoUrl: formData.billPhotoUrl,
      gstPaid: Number(formData.gstPaid),
      notes: formData.notes,
    });
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Category', 'Bus Number', 'Amount', 'GST Paid (Input)', 'Paid By', 'Trip', 'Notes'];
    const rows = filteredExpenses.map((e) => [
      e.date,
      e.category,
      e.busNumber || 'General Fleet',
      e.amount,
      e.gstPaid,
      e.paidBy,
      e.tripTitle || 'N/A',
      e.notes,
    ]);
    exportToCSV('Fleet_Expenses_Report', headers, rows);
    showToast({ type: 'success', title: 'Fleet Expenses CSV Exported' });
  };

  // Per-Trip Profit and Loss Calculation
  const tripPnLData = charterBookings.map((b) => {
    const tripExpenses = expenses.filter(
      (e) => e.tripId === b.id || (e.tripTitle && e.tripTitle.toLowerCase().includes(b.bookingType.toLowerCase()))
    );
    const totalExp = tripExpenses.reduce((s, e) => s + e.amount, 0);
    const grossIncome = b.quote.grandTotal;
    const netProfit = grossIncome - totalExp;
    const margin = grossIncome > 0 ? Math.round((netProfit / grossIncome) * 100) : 0;
    return {
      booking: b,
      income: grossIncome,
      expenses: totalExp,
      netProfit,
      margin,
      expensesCount: tripExpenses.length,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Expenses & Per-Trip Profit/Loss
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 border border-rose-500/20">
              {filteredExpenses.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track diesel bills, expressway FASTag tolls, tyre replacements, driver salaries, and per-trip net margin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'expenses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Expense Journal
            </button>
            <button
              onClick={() => setActiveTab('tripPnL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'tripPnL' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Per-Trip P&L (Margin)
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-rose-800 block">Total Fleet Expenses</span>
            <span className="text-2xl font-black font-mono text-rose-950">{formatINR(totalExpenseAmount)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-blue-800 block">Input Tax Credit (GST Paid)</span>
            <span className="text-2xl font-black font-mono text-blue-950">{formatINR(totalInputGst)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-emerald-800 block">Top Cost Center</span>
            <span className="text-xl font-black text-emerald-950">High Speed Diesel (62%)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TAB 1: EXPENSE JOURNAL */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters & Search Suite */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search expense, bus, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-rose-600 ml-1 mr-1" />
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

                {isExpenseFilterActive && (
                  <button
                    onClick={handleResetExpenseFilters}
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
                <Filter className="w-3 h-3 text-rose-500" />
                Filters:
              </span>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Expense Categories (11)</option>
                <option value="Diesel">Diesel</option>
                <option value="Toll">Toll & FASTag</option>
                <option value="Driver Salary">Driver Salary</option>
                <option value="Driver Food">Driver Food / Bhatta</option>
                <option value="Maintenance">Maintenance & Spares</option>
                <option value="Tyres">Tyres</option>
                <option value="Insurance">Insurance</option>
                <option value="Permit Fees">Permit Fees</option>
                <option value="Parking">Parking</option>
                <option value="Challan/Fine">Challan / Fine</option>
                <option value="Salary">Salary (Auto Payroll)</option>
              </select>

              <select
                value={busFilter}
                onChange={(e) => setBusFilter(e.target.value)}
                className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Buses ({buses.length})</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.plateNumber}
                  </option>
                ))}
              </select>

              <select
                value={paidByFilter}
                onChange={(e) => setPaidByFilter(e.target.value)}
                className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Payers</option>
                <option value="Driver">Paid by Drivers (En-route)</option>
                <option value="Deepak Raj">Paid by Owner (Deepak Raj)</option>
                <option value="Company">Company Account</option>
              </select>

              <div className="ml-auto text-[11px] text-slate-500 font-medium">
                Showing <strong className="text-slate-900 font-bold">{filteredExpenses.length}</strong> of {expenses.length} bills
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Fleet Bus / Trip</th>
                    <th className="p-3.5">Paid By & Remarks</th>
                    <th className="p-3.5 text-center">Bill Attachment</th>
                    <th className="p-3.5 text-right">Amount (₹)</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 align-top font-semibold text-slate-800">
                        {formatDate(exp.date)}
                      </td>

                      <td className="p-3.5 align-top">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          exp.category === 'Diesel'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : exp.category === 'Maintenance' || exp.category === 'Tyres'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : exp.category === 'Challan/Fine'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {exp.category}
                        </span>
                        {exp.gstPaid > 0 && (
                          <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                            ITC: {formatINR(exp.gstPaid)}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 align-top">
                        <div className="font-mono font-bold text-slate-900">
                          {exp.busNumber || 'Office Fleet'}
                        </div>
                        {exp.tripTitle && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                            {exp.tripTitle}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 align-top">
                        <div className="text-slate-900 font-medium">{exp.paidBy}</div>
                        <div className="text-[11px] text-slate-500 italic max-w-xs">{exp.notes}</div>
                      </td>

                      <td className="p-3.5 align-top text-center">
                        {exp.billPhotoUrl ? (
                          <button
                            onClick={() => setPreviewBillUrl(exp.billPhotoUrl || null)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                          >
                            <FileImage className="w-3.5 h-3.5 text-amber-600" />
                            <span>View Bill</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">No Photo</span>
                        )}
                      </td>

                      <td className="p-3.5 align-top text-right font-mono font-black text-sm text-slate-900">
                        {formatINR(exp.amount)}
                      </td>

                      <td className="p-3.5 align-top text-right">
                        <button
                          onClick={() => openHistory('Expense', exp.id, `${exp.category} (₹${exp.amount})`)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Audit Trail"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PER-TRIP PROFIT AND LOSS (MARGIN VIEW) */}
      {activeTab === 'tripPnL' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Per-Trip Profit & Loss Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Real-time trip economics: gross agreed quotation minus recorded fuel, driver bhatta, toll, and en-route expenses.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Booking #</th>
                  <th className="p-3">Trip Description</th>
                  <th className="p-3">Bus Number</th>
                  <th className="p-3 text-right">Gross Income (A)</th>
                  <th className="p-3 text-right">Trip Costs (B)</th>
                  <th className="p-3 text-right">Net Profit (A - B)</th>
                  <th className="p-3 text-center">Net Margin (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tripPnLData.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {t.booking.bookingNumber}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{t.booking.bookingType}</div>
                      <div className="text-[11px] text-slate-500">{t.booking.pickup} → {t.booking.drop}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {t.booking.assignedBuses[0]?.busNumber || 'Fleet Bus'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      {formatINR(t.income)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700">
                      {formatINR(t.expenses)}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-sm text-slate-900">
                      {formatINR(t.netProfit)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        t.margin >= 40 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Log Fleet Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Expense Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Toll">Toll & FASTag</option>
                    <option value="Driver Food">Driver Food / Bhatta</option>
                    <option value="Maintenance">Maintenance & Spares</option>
                    <option value="Tyres">Tyres</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Permit Fees">Permit Fees</option>
                    <option value="Parking">Parking</option>
                    <option value="Challan/Fine">Challan / Fine</option>
                    <option value="Office">Office General</option>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Fleet Vehicle</label>
                  <select
                    value={formData.busId}
                    onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                  >
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>{b.plateNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Paid By</label>
                  <input
                    type="text"
                    value={formData.paidBy}
                    onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                    placeholder="e.g. Driver Surender"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Linked Trip Title</label>
                <input
                  type="text"
                  value={formData.tripTitle}
                  onChange={(e) => setFormData({ ...formData, tripTitle: e.target.value })}
                  placeholder="e.g. Shadi Charter #DR-CH-1021"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">GST Paid (Input Tax Credit) ₹</label>
                <input
                  type="number"
                  value={formData.gstPaid}
                  onChange={(e) => setFormData({ ...formData, gstPaid: Number(e.target.value) })}
                  placeholder="e.g. 18% on spare parts"
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Expense Remarks / Fuel Litres</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. 160 Ltrs Diesel @ Indian Oil Kashmere Gate"
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
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Photo Preview Modal */}
      {previewBillUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-3 bg-slate-900 text-white flex justify-between items-center text-xs font-bold">
              <span>Attached Bill Receipt Photo</span>
              <button onClick={() => setPreviewBillUrl(null)} className="p-1 rounded hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-100">
              <img
                src={previewBillUrl}
                alt="Bill Receipt"
                className="max-h-96 object-contain rounded-lg border shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

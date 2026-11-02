import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LoanEMI } from '../types';
import { formatINR, formatDate, exportToCSV } from '../utils/formatters';
import { 
  Landmark, AlertTriangle, CheckCircle2, Clock, 
  CreditCard, Download, History, X, Bus, Plus, Search, Filter, RotateCcw,
  Edit, Calendar, ArrowRight, ShieldCheck, FileText, DollarSign, Trash2
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';

export const EmiLoans: React.FC = () => {
  const { emis, buses, markEmiPaid, 
    updateLoanEmi, 
    addLoanEmi, 
    deleteLoanEmi,
    openHistory, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'loans' | 'purchaseRecords'>('loans');
  const [payModalEmi, setPayModalEmi] = useState<LoanEMI | null>(null);
  const [payReference, setPayReference] = useState('ACH/SBI/20261102/DPKRAJ');
  const [searchQuery, setSearchQuery] = useState('');
  const [financierFilter, setFinancierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');
  const [deleteModalEmi, setDeleteModalEmi] = useState<LoanEMI | null>(null);

  // History modal for past paid instalments
  const [historyModalEmi, setHistoryModalEmi] = useState<LoanEMI | null>(null);

  // Edit EMI loan state
  const [editModalEmi, setEditModalEmi] = useState<LoanEMI | null>(null);
  const [editEmiAmount, setEditEmiAmount] = useState(0);
  const [editDueDay, setEditDueDay] = useState(5);
  const [editRemaining, setEditRemaining] = useState(36);
  const [editFinancier, setEditFinancier] = useState('');

  // Add new vehicle loan modal state
  const [newLoanModalOpen, setNewLoanModalOpen] = useState(false);
  const [newBusNumber, setNewBusNumber] = useState('DL 01 AB 9090');
  const [newFinancier, setNewFinancier] = useState('Tata Capital Commercial Vehicle Finance');
  const [newLoanAmount, setNewLoanAmount] = useState(4500000);
  const [newEmiAmount, setNewEmiAmount] = useState(88500);
  const [newDueDay, setNewDueDay] = useState(10);
  const [newTenure, setNewTenure] = useState(60);

  // Purchase/Sale Asset state
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetBusNumber, setAssetBusNumber] = useState('DL 01 CD 5050');
  const [assetType, setAssetType] = useState<'Purchase' | 'Sale'>('Purchase');
  const [assetPrice, setAssetPrice] = useState(6500000);
  const [assetFinancier, setAssetFinancier] = useState('HDFC Bank');
  const [assetDate, setAssetDate] = useState('2026-11-02');

  // Find EMIs due within 5 days (5 Nov is in 3 days!)
  const emiDueSoon = emis.filter((e) => e.status === 'active' && e.dueDayOfMonth >= 1 && e.dueDayOfMonth <= 7);

  const handleConfirmPayment = () => {
    if (!payModalEmi) return;
    markEmiPaid(payModalEmi.id, payReference);
    setPayModalEmi(null);
  };

  const handleOpenEdit = (emi: LoanEMI) => {
    setEditModalEmi(emi);
    setEditEmiAmount(emi.emiAmount);
    setEditDueDay(emi.dueDayOfMonth);
    setEditRemaining(emi.remainingInstalments);
    setEditFinancier(emi.financeCompany);
  };

  const handleSaveEmiEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalEmi) return;
    updateLoanEmi(editModalEmi.id, {
      emiAmount: Number(editEmiAmount),
      dueDayOfMonth: Number(editDueDay),
      remainingInstalments: Number(editRemaining),
      financeCompany: editFinancier,
    }, `Updated loan terms: ₹${editEmiAmount}/mo, due day ${editDueDay}`);
    setEditModalEmi(null);
  };

  const handleCreateNewLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const matchingBus = buses.find(b => b.plateNumber === newBusNumber) || buses[0];
    const newEmi: LoanEMI = {
      id: `emi-${Date.now()}`,
      busId: matchingBus.id,
      busNumber: newBusNumber,
      financeCompany: newFinancier,
      loanAmount: Number(newLoanAmount),
      emiAmount: Number(newEmiAmount),
      dueDayOfMonth: Number(newDueDay),
      tenureMonths: Number(newTenure),
      remainingInstalments: Number(newTenure),
      status: 'active',
      purchasePrice: Number(newLoanAmount) * 1.25,
      purchaseDate: '2026-11-02',
      paymentHistory: [],
    };
    addLoanEmi(newEmi);
    setNewLoanModalOpen(false);
  };

    const handleConfirmDelete = () => {
    if (!deleteModalEmi) return;
    deleteLoanEmi(deleteModalEmi.id);
    setDeleteModalEmi(null);
  };

  const handleRecordAsset = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: 'success',
      title: `Asset ${assetType} Recorded`,
      message: `${assetBusNumber} ${assetType} transaction of ${formatINR(assetPrice)} logged in fleet asset capital ledger.`,
    });
    setAssetModalOpen(false);
  };

  // Filtered EMIs
  const filteredEmis = emis.filter((e) => {
    const matchesSearch = 
      e.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.financeCompany.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFinancier = financierFilter === 'all' || e.financeCompany === financierFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesUrgency = 
      urgencyFilter === 'all' ? true :
      urgencyFilter === 'dueSoon' ? (e.status === 'active' && e.dueDayOfMonth <= 7) :
      (e.status === 'active' && e.dueDayOfMonth > 7);
    const matchesBus = busFilter === 'all' || e.busNumber === busFilter || e.busId === busFilter;
    return matchesSearch && matchesFinancier && matchesStatus && matchesUrgency && matchesBus;
  });

  const isEmiFilterActive = 
    searchQuery !== '' || 
    financierFilter !== 'all' || 
    statusFilter !== 'all' || 
    urgencyFilter !== 'all' ||
    busFilter !== 'all';

  const handleResetEmiFilters = () => {
    setSearchQuery('');
    setFinancierFilter('all');
    setStatusFilter('all');
    setUrgencyFilter('all');
    setBusFilter('all');
  };

  const handleExportCSV = () => {
    const headers = ['Bus Number', 'Finance Company', 'Loan Amount', 'Monthly EMI', 'Due Day', 'Tenure Months', 'Remaining Months', 'Status'];
    const rows = filteredEmis.map((e) => [
      e.busNumber,
      e.financeCompany,
      e.loanAmount,
      e.emiAmount,
      `Day ${e.dueDayOfMonth} of month`,
      e.tenureMonths,
      e.remainingInstalments,
      e.status,
    ]);
    exportToCSV('Fleet_EMI_Loans_Schedule', headers, rows);
    showToast({ type: 'success', title: 'EMI Loans Schedule Exported' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              EMI & Commercial Vehicle Loans
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-700 border border-purple-500/20">
              Fleet Financing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track monthly bank auto-debit dates, tenure completion progress, and commercial asset purchase ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'loans' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active Bus Loans ({emis.length})
            </button>
            <button
              onClick={() => setActiveTab('purchaseRecords')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'purchaseRecords' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Asset Purchase / Sale Records
            </button>
          </div>

          {activeTab === 'loans' && (
            <button
              onClick={() => setNewLoanModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Vehicle Loan</span>
            </button>
          )}

          {activeTab === 'purchaseRecords' && (
            <button
              onClick={() => setAssetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Purchase / Sale</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Due Within 5 Days Warning Banner */}
      {emiDueSoon.length > 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl text-amber-950 shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">Upcoming Auto-Debit Alert: EMI Due within 3 Days!</h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                05 Nov 2026
              </span>
            </div>
            <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
              Bus <strong>DL 01 AB 4090</strong> EMI of <strong>₹76,500</strong> to <strong>Tata Capital</strong> will be auto-debited on 05 November. Ensure adequate balance in State Bank of India A/C 30491029384 to avoid ECS bouncing charges.
            </p>
          </div>
          <button
            onClick={() => setPayModalEmi(emiDueSoon[0])}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 shadow"
          >
            Mark Paid Now
          </button>
        </div>
      )}

      {/* Filters & Search Suite */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search bus plate #, financier (Tata Capital, HDFC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isEmiFilterActive && (
              <button
                onClick={handleResetEmiFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors border border-rose-200"
                title="Reset EMI filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <div className="text-[11px] text-slate-500 font-medium">
              Showing <strong className="text-slate-900 font-bold">{filteredEmis.length}</strong> of {emis.length} loans
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-purple-500" />
            Filters:
          </span>

          <select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium font-mono"
          >
            <option value="all">All Fleet Buses</option>
            {buses.map((b) => (
              <option key={b.id} value={b.plateNumber}>{b.plateNumber} ({b.model})</option>
            ))}
          </select>

          <select
            value={financierFilter}
            onChange={(e) => setFinancierFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Finance Companies</option>
            <option value="Tata Capital Commercial Vehicle Finance">Tata Capital</option>
            <option value="HDFC Bank Commercial Transport">HDFC Bank</option>
            <option value="Cholamandalam Vehicle Finance">Cholamandalam</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Loan Statuses</option>
            <option value="active">Active Running Loans</option>
            <option value="closed">Closed / Fully Repaid (NOC)</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Due Timelines</option>
            <option value="dueSoon">Upcoming Auto-Debit (Due in ≤5 Days)</option>
            <option value="dueLater">Due Later This Month</option>
          </select>
        </div>
      </div>

      {/* TAB 1: ACTIVE LOANS */}
      {activeTab === 'loans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredEmis.map((emi) => {
            const completedMonths = emi.tenureMonths - emi.remainingInstalments;
            const progressPercent = Math.round((completedMonths / emi.tenureMonths) * 100);

            return (
              <div
                key={emi.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-purple-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between border-b pb-3 mb-3">
                    <div>
                      <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {emi.busNumber}
                      </span>
                      <div className="text-xs text-slate-500 font-medium mt-1">{emi.financeCompany}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                      {emi.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monthly EMI:</span>
                      <span className="font-mono font-black text-slate-900 text-sm">{formatINR(emi.emiAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sanctioned Loan:</span>
                      <span className="font-mono font-bold text-slate-700">{formatINR(emi.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between text-amber-700 font-semibold">
                      <span>Due Day Every Month:</span>
                      <span>Day {emi.dueDayOfMonth} of month</span>
                    </div>
                  </div>

                  {/* Tenure Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-600">
                      <span>Tenure Progress: {completedMonths} / {emi.tenureMonths} Months</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 text-right">
                      {emi.remainingInstalments} instalments remaining
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {/* Audit History */}
                    <button
                      onClick={() => openHistory('EMI Loan', emi.id, `${emi.busNumber} (${emi.financeCompany})`)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500"
                      title="Audit History"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Loan Terms */}
                    <button
                      onClick={() => handleOpenEdit(emi)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-amber-600 hover:text-amber-700"
                      title="Edit Loan Terms"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteModalEmi(emi)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                      title="Delete Loan Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Payment History Log */}
                    <button
                      onClick={() => setHistoryModalEmi(emi)}
                      className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1"
                      title="View Past Payment Ledger"
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Ledger</span>
                    </button>
                  </div>

                  {/* Mark as Paid Action */}
                  <button
                    onClick={() => setPayModalEmi(emi)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Paid</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: ASSET PURCHASE RECORDS */}
      {activeTab === 'purchaseRecords' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Commercial Fleet Asset Register (Capital Expenditure)
              </h3>
              <p className="text-xs text-slate-500">
                Original vehicle purchase invoice values, finance split, chassis numbers, and depreciation records.
              </p>
            </div>
            <button
              onClick={() => setAssetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record Asset Transaction</span>
            </button>
          </div>

          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 border-b text-slate-700 font-bold uppercase">
              <tr>
                <th className="p-3">Bus Registration</th>
                <th className="p-3">Purchase Date</th>
                <th className="p-3 text-right">Purchase Invoice Price</th>
                <th className="p-3 text-right">Financed Loan</th>
                <th className="p-3 text-right">Margin Money (Self Equity)</th>
                <th className="p-3">Financier</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {emis.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-mono font-bold text-slate-900">{e.busNumber}</td>
                  <td className="p-3 text-slate-600">{formatDate(e.purchaseDate)}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">{formatINR(e.purchasePrice)}</td>
                  <td className="p-3 text-right font-mono text-purple-700">{formatINR(e.loanAmount)}</td>
                  <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                    {formatINR(e.purchasePrice - e.loanAmount)}
                  </td>
                  <td className="p-3 text-slate-700">{e.financeCompany}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Hypothecated
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment History Modal */}
      {historyModalEmi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    EMI Payment Ledger • {historyModalEmi.busNumber}
                  </h3>
                  <p className="text-xs text-slate-500">{historyModalEmi.financeCompany}</p>
                </div>
              </div>
              <button onClick={() => setHistoryModalEmi(null)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs border border-slate-100 mb-4">
              <div>
                <span className="text-slate-400 text-[10px] block">Sanctioned Amount</span>
                <strong className="font-mono text-slate-900">{formatINR(historyModalEmi.loanAmount)}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Monthly Debit</span>
                <strong className="font-mono text-purple-700">{formatINR(historyModalEmi.emiAmount)} / mo</strong>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Paid Instalments History
            </h4>

            {historyModalEmi.paymentHistory && historyModalEmi.paymentHistory.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5 text-right">Amount</th>
                      <th className="p-2.5">Bank Reference / UTR</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {historyModalEmi.paymentHistory.map((h, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono">{formatDate(h.date)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{formatINR(h.amount)}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">{h.reference}</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            Debited ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-500" />
                <p>No past payment entries recorded yet. Click "Mark as Paid" to register the next instalment.</p>
              </div>
            )}

            <div className="flex justify-end pt-4 mt-4 border-t">
              <button
                onClick={() => setHistoryModalEmi(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit EMI Loan Modal */}
      {editModalEmi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Edit Loan Terms • {editModalEmi.busNumber}
              </h3>
              <button onClick={() => setEditModalEmi(null)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmiEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Finance Company</label>
                <input
                  type="text"
                  value={editFinancier}
                  onChange={(e) => setEditFinancier(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    value={editEmiAmount}
                    onChange={(e) => setEditEmiAmount(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Monthly Due Day (1-31)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={editDueDay}
                    onChange={(e) => setEditDueDay(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Remaining Instalments (Months)</label>
                <input
                  type="number"
                  value={editRemaining}
                  onChange={(e) => setEditRemaining(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalEmi(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow"
                >
                  Save Loan Terms
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark EMI as Paid Modal */}
      {payModalEmi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Mark EMI Paid • {payModalEmi.busNumber}
              </h3>
              <button onClick={() => setPayModalEmi(null)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Financier:</span>
                <span className="font-bold text-purple-900">{payModalEmi.financeCompany}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">EMI Instalment:</span>
                <span className="font-mono font-black text-slate-900 text-sm">{formatINR(payModalEmi.emiAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Remaining Tenure:</span>
                <span>{payModalEmi.remainingInstalments} Months</span>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="block text-slate-600 mb-1">Bank Auto-Debit / UTR Reference</label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPayModalEmi(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
              >
                Confirm Payment & Decrement Tenure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Vehicle Loan Modal */}
      {newLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                + Register New Commercial Vehicle Loan
              </h3>
              <button onClick={() => setNewLoanModalOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewLoan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Fleet Bus Registration</label>
                <select
                  value={newBusNumber}
                  onChange={(e) => setNewBusNumber(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-bold bg-white"
                >
                  {buses.map((b) => (
                    <option key={b.id} value={b.plateNumber}>{b.plateNumber} ({b.model})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Financier / Bank</label>
                <select
                  value={newFinancier}
                  onChange={(e) => setNewFinancier(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-medium bg-white"
                >
                  <option value="Tata Capital Commercial Vehicle Finance">Tata Capital Commercial Vehicle Finance</option>
                  <option value="HDFC Bank Commercial Transport">HDFC Bank Commercial Transport</option>
                  <option value="Cholamandalam Vehicle Finance">Cholamandalam Vehicle Finance</option>
                  <option value="ICICI Bank Commercial Vehicle Loans">ICICI Bank Commercial Loans</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Sanctioned Loan (₹)</label>
                  <input
                    type="number"
                    value={newLoanAmount}
                    onChange={(e) => setNewLoanAmount(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    value={newEmiAmount}
                    onChange={(e) => setNewEmiAmount(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Due Day of Month</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={newDueDay}
                    onChange={(e) => setNewDueDay(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Total Tenure (Months)</label>
                  <input
                    type="number"
                    value={newTenure}
                    onChange={(e) => setNewTenure(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setNewLoanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow"
                >
                  Register Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Purchase / Sale Modal */}
      {assetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                + Record Fleet Capital Transaction
              </h3>
              <button onClick={() => setAssetModalOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordAsset} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Transaction Type</label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="Purchase">Vehicle Purchase (Capex)</option>
                    <option value="Sale">Vehicle Sale / Scrapped</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Bus Registration</label>
                  <input
                    type="text"
                    value={assetBusNumber}
                    onChange={(e) => setAssetBusNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Invoice Value (₹)</label>
                  <input
                    type="number"
                    value={assetPrice}
                    onChange={(e) => setAssetPrice(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={assetDate}
                    onChange={(e) => setAssetDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Financier / Counterparty Dealer</label>
                <input
                  type="text"
                  value={assetFinancier}
                  onChange={(e) => setAssetFinancier(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAssetModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

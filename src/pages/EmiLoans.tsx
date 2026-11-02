import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LoanEMI } from '../types';
import { formatINR, formatDate, exportToCSV } from '../utils/formatters';
import { 
  Landmark, AlertTriangle, CheckCircle2, Clock, 
  CreditCard, Download, History, X, Bus, Plus 
} from 'lucide-react';

export const EmiLoans: React.FC = () => {
  const { emis, buses, markEmiPaid, openHistory, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'loans' | 'purchaseRecords'>('loans');
  const [payModalEmi, setPayModalEmi] = useState<LoanEMI | null>(null);
  const [payReference, setPayReference] = useState('ACH/SBI/20261102/BALAJI');

  // Find EMIs due within 5 days (5 Nov is in 3 days!)
  const emiDueSoon = emis.filter((e) => e.status === 'active' && e.dueDayOfMonth >= 1 && e.dueDayOfMonth <= 7);

  const handleConfirmPayment = () => {
    if (!payModalEmi) return;
    markEmiPaid(payModalEmi.id, payReference);
    setPayModalEmi(null);
  };

  const handleExportCSV = () => {
    const headers = ['Bus Number', 'Finance Company', 'Loan Amount', 'Monthly EMI', 'Due Day', 'Tenure Months', 'Remaining Months', 'Status'];
    const rows = emis.map((e) => [
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

        <div className="flex items-center gap-2">
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

      {/* TAB 1: ACTIVE LOANS */}
      {activeTab === 'loans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {emis.map((emi) => {
            const completedMonths = emi.tenureMonths - emi.remainingInstalments;
            const progressPercent = Math.round((completedMonths / emi.tenureMonths) * 100);

            return (
              <div
                key={emi.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-amber-400 transition-all flex flex-col justify-between"
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
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 text-right">
                      {emi.remainingInstalments} instalments remaining
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => openHistory('EMI Loan', emi.id, `${emi.busNumber} (${emi.financeCompany})`)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500"
                    title="Audit History"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setPayModalEmi(emi)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark as Paid</span>
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
          <div className="border-b pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Commercial Fleet Asset Register (Capital Expenditure)
            </h3>
            <p className="text-xs text-slate-500">
              Original vehicle purchase invoice values, finance split, chassis numbers, and depreciation records.
            </p>
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
                </tr>
              ))}
            </tbody>
          </table>
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

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5 mb-4">
              <div className="flex justify-between font-bold text-emerald-950">
                <span>Monthly Installment:</span>
                <span className="font-mono text-base">{formatINR(payModalEmi.emiAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Financier:</span>
                <span>{payModalEmi.financeCompany}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Instalments Remaining:</span>
                <span>{payModalEmi.remainingInstalments} → {payModalEmi.remainingInstalments - 1}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Bank Clearing Reference / NACH UTR No *
                </label>
                <input
                  type="text"
                  required
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPayModalEmi(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
              >
                Confirm Clearance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Worker, WorkerType, AttendanceRecord, WorkerAdvance } from '../types';
import { formatINR, formatDate, exportToCSV } from '../utils/formatters';
import { 
  UserCheck, Plus, Search, Filter, Download, Calendar, 
  CreditCard, Printer, Share2, History, CheckCircle2, 
  X, AlertCircle, ArrowRight, User, DollarSign, Wallet
} from 'lucide-react';

export const WorkersSalary: React.FC = () => {
  const { 
    workers, 
    attendance, 
    advances, 
    updateWorker, 
    updateAttendance, 
    addWorkerAdvance, 
    payWorkerSalary, 
    openSalarySlipModal, 
    openHistory, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'workers' | 'attendance' | 'payroll' | 'advances'>('payroll');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Advance modal state
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    workerId: 'worker-1',
    amount: 5000,
    reason: 'Family medical expense',
    recoveryPerMonth: 1500,
  });

  // Payroll adjustments override state per worker
  const [payrollOverrides, setPayrollOverrides] = useState<Record<string, {
    bonus: number;
    allowance: number;
    advanceDeduction: number;
  }>>({});

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch = 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.phone.includes(searchQuery) ||
      (w.licenceNo && w.licenceNo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || w.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Attendance matrix days in November (days 1 & 2 for demo)
  const attendanceDays = ['2026-11-01', '2026-11-02'];

  const getAttendanceStatus = (workerId: string, date: string): 'P' | 'A' | 'HD' | 'L' => {
    const rec = attendance.find((a) => a.workerId === workerId && a.date === date);
    return rec ? rec.status : 'P';
  };

  const cycleAttendance = (workerId: string, date: string) => {
    const current = getAttendanceStatus(workerId, date);
    const nextMap: Record<string, 'P' | 'A' | 'HD' | 'L'> = {
      P: 'HD',
      HD: 'A',
      A: 'L',
      L: 'P',
    };
    const next = nextMap[current] || 'P';
    updateAttendance(workerId, date, next);
  };

  // Payroll calculation helper
  const calculateWorkerPayroll = (worker: Worker) => {
    // 2 days recorded in demo November: assume 30 days total
    const overrides = payrollOverrides[worker.id] || { bonus: 0, allowance: 0, advanceDeduction: 0 };
    
    // Count absences in recorded days
    const recordedAtt = attendance.filter((a) => a.workerId === worker.id);
    const absences = recordedAtt.filter((a) => a.status === 'A').length;
    const halfDays = recordedAtt.filter((a) => a.status === 'HD').length;

    // Proration: (base / 30) * (30 - absences - halfDays*0.5)
    const baseProrated = Math.round((worker.baseSalary / 30) * (30 - absences - (halfDays * 0.5)));
    
    // Trip allowances: defaults + manual overrides
    const defaultAllowance = worker.type === 'driver' ? 4800 : (worker.type === 'conductor' ? 1600 : 0);
    const totalAllowance = defaultAllowance + overrides.allowance;

    // Advance recovery from active advance
    const activeAdv = advances.find((a) => a.workerId === worker.id && a.status === 'active');
    const autoAdvanceDeduction = activeAdv ? Math.min(activeAdv.recoveryPerMonth, activeAdv.remainingBalance) : 0;
    const actualAdvanceDeduction = overrides.advanceDeduction > 0 ? overrides.advanceDeduction : autoAdvanceDeduction;

    const netPayable = Math.max(0, baseProrated + totalAllowance + overrides.bonus - actualAdvanceDeduction);

    return {
      worker,
      baseSalary: worker.baseSalary,
      baseProrated,
      allowance: totalAllowance,
      bonus: overrides.bonus,
      advanceDeduction: actualAdvanceDeduction,
      netPayable,
      hasActiveAdvance: Boolean(activeAdv),
      advanceBalance: activeAdv?.remainingBalance || 0,
    };
  };

  const handleDisburseSalary = (worker: Worker) => {
    const p = calculateWorkerPayroll(worker);
    payWorkerSalary(worker.id, 'October 2026', p.netPayable, 'Bank');
  };

  const handleOpenSlip = (worker: Worker) => {
    const p = calculateWorkerPayroll(worker);
    openSalarySlipModal({
      worker,
      month: 'October 2026',
      netPayable: p.netPayable,
      base: p.baseProrated,
      allowance: p.allowance,
      advanceDeduction: p.advanceDeduction,
    });
  };

  const handleAddAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const worker = workers.find((w) => w.id === advanceForm.workerId);
    if (!worker) return;
    addWorkerAdvance({
      workerId: worker.id,
      workerName: worker.name,
      date: '2026-11-02',
      amount: Number(advanceForm.amount),
      reason: advanceForm.reason,
      recoveryPerMonth: Number(advanceForm.recoveryPerMonth),
      remainingBalance: Number(advanceForm.amount),
      status: 'active',
    });
    setIsAdvanceModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Worker Name', 'Role', 'Salary Type', 'Base Salary', 'Prorated Base', 'Trip Allowance', 'Advance Deducted', 'Net Payable'];
    const rows = filteredWorkers.map((w) => {
      const p = calculateWorkerPayroll(w);
      return [w.name, w.type, w.salaryType, w.baseSalary, p.baseProrated, p.allowance, p.advanceDeduction, p.netPayable];
    });
    exportToCSV('Monthly_Payroll_Register', headers, rows);
    showToast({ type: 'success', title: 'Monthly Payroll Register CSV Exported' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Workers & Monthly Payroll
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              10 Crew Members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Drivers, conductors, helpers, and office staff: attendance tracking, trip bhatta, advance deductions, and automated expense-linked salary slips.
          </p>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'payroll' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly Payroll
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Attendance Grid
            </button>
            <button
              onClick={() => setActiveTab('workers')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'workers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Crew Directory
            </button>
            <button
              onClick={() => setActiveTab('advances')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'advances' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Advances & Loans
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

      {/* TAB 1: MONTHLY PAYROLL SCREEN */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900">
            <div>
              <span className="font-bold text-sm block">Payroll Month: October / November 2026</span>
              <p className="mt-0.5 opacity-90">
                Formula: Base Prorated (Attendance) + Trip Bhatta + Bonus − Advance Recovery = Net Disbursable. Paying salary auto-posts to Expenses & sends SMS.
              </p>
            </div>
            <button
              onClick={() => setIsAdvanceModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow shrink-0"
            >
              + Issue Salary Advance
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Employee Name & Role</th>
                    <th className="p-3.5 text-right">Fixed Base</th>
                    <th className="p-3.5 text-right">Prorated Base</th>
                    <th className="p-3.5 text-right">Trip Allowances</th>
                    <th className="p-3.5 text-right">Advance Recovery</th>
                    <th className="p-3.5 text-right">Net Payable</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredWorkers.map((w) => {
                    const p = calculateWorkerPayroll(w);

                    return (
                      <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 align-top">
                          <div className="font-bold text-slate-900 text-sm">{w.name}</div>
                          <div className="text-[11px] text-slate-500 capitalize">{w.type} • {w.bankUpi}</div>
                          {w.licenceNo && (
                            <div className="text-[10px] text-amber-800 font-mono mt-0.5">
                              DL: {w.licenceNo} (Exp: {formatDate(w.licenceExpiry)})
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 align-top text-right font-mono text-slate-500">
                          {formatINR(p.baseSalary)}
                        </td>

                        <td className="p-3.5 align-top text-right font-mono font-semibold text-slate-800">
                          {formatINR(p.baseProrated)}
                        </td>

                        <td className="p-3.5 align-top text-right font-mono font-semibold text-emerald-700">
                          +{formatINR(p.allowance)}
                        </td>

                        <td className="p-3.5 align-top text-right font-mono font-semibold text-rose-600">
                          {p.advanceDeduction > 0 ? `-${formatINR(p.advanceDeduction)}` : '₹0'}
                          {p.hasActiveAdvance && (
                            <div className="text-[10px] text-slate-400">
                              Bal: {formatINR(p.advanceBalance)}
                            </div>
                          )}
                        </td>

                        {/* Net Payable Editable Field */}
                        <td className="p-3.5 align-top text-right">
                          <div className="font-black text-slate-900 font-mono text-sm bg-amber-50 text-amber-950 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            {formatINR(p.netPayable)}
                          </div>
                        </td>

                        <td className="p-3.5 align-top text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Ready to Pay
                          </span>
                        </td>

                        <td className="p-3.5 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Salary Slip Preview */}
                            <button
                              onClick={() => handleOpenSlip(w)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                              title="Generate Payslip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Disburse Salary Button */}
                            <button
                              onClick={() => handleDisburseSalary(w)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Disburse</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE ATTENDANCE GRID */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Crew Attendance Log (November 2026)
              </h3>
              <p className="text-xs text-slate-500">
                Click any cell to cycle status: <strong>P (Present) → HD (Half Day) → A (Absent) → L (Leave)</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">P = Present</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">HD = Half Day</span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">A = Absent</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">L = Leave</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="p-3 w-56">Worker Name & Role</th>
                  <th className="p-3 text-center">01 Nov (Yesterday)</th>
                  <th className="p-3 text-center bg-amber-50 text-amber-950 font-black">
                    02 Nov (Today)
                  </th>
                  <th className="p-3 text-center">Month Total (P)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {workers.map((w) => {
                  const day1 = getAttendanceStatus(w.id, '2026-11-01');
                  const day2 = getAttendanceStatus(w.id, '2026-11-02');

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{w.name}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{w.type}</div>
                      </td>

                      {/* Day 1 */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => cycleAttendance(w.id, '2026-11-01')}
                          className={`w-9 h-8 rounded-lg font-bold text-xs shadow-sm transition-transform active:scale-90 ${
                            day1 === 'P'
                              ? 'bg-emerald-600 text-white'
                              : day1 === 'HD'
                              ? 'bg-amber-500 text-slate-950'
                              : day1 === 'A'
                              ? 'bg-rose-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {day1}
                        </button>
                      </td>

                      {/* Day 2 (Today) */}
                      <td className="p-3 text-center bg-amber-50/30">
                        <button
                          onClick={() => cycleAttendance(w.id, '2026-11-02')}
                          className={`w-9 h-8 rounded-lg font-bold text-xs shadow-sm transition-transform active:scale-90 ${
                            day2 === 'P'
                              ? 'bg-emerald-600 text-white'
                              : day2 === 'HD'
                              ? 'bg-amber-500 text-slate-950'
                              : day2 === 'A'
                              ? 'bg-rose-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {day2}
                        </button>
                      </td>

                      <td className="p-3 text-center font-bold text-slate-900 font-mono">
                        {(day1 === 'P' ? 1 : (day1 === 'HD' ? 0.5 : 0)) + (day2 === 'P' ? 1 : (day2 === 'HD' ? 0.5 : 0))} / 2 Days
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CREW DIRECTORY */}
      {activeTab === 'workers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((w) => (
            <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={w.photoUrl}
                  alt={w.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{w.name}</h4>
                  <span className="inline-block px-2 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {w.type}
                  </span>
                  <div className="text-slate-500 text-[11px] font-mono mt-0.5">{w.phone}</div>
                </div>
              </div>

              <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p>Address: <span className="text-slate-600">{w.address}</span></p>
                <p>Payment: <strong className="font-mono text-slate-900">{w.bankUpi}</strong></p>
                <p>Emergency: <span className="text-slate-600">{w.emergencyContact}</span></p>
                {w.licenceNo && (
                  <p className="text-amber-800 font-mono font-medium">
                    DL: {w.licenceNo} (Exp: {formatDate(w.licenceExpiry)})
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-slate-900">
                  Base: {formatINR(w.baseSalary)}
                </span>
                <button
                  onClick={() => openHistory('Worker', w.id, w.name)}
                  className="p-1 rounded text-slate-400 hover:bg-slate-100"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: ADVANCES & LOANS */}
      {activeTab === 'advances' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Worker Salary Advances & Recovery Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Running ledger of advances issued with monthly payroll deduction tracking
              </p>
            </div>
            <button
              onClick={() => setIsAdvanceModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              + Issue New Advance
            </button>
          </div>

          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
              <tr>
                <th className="p-3">Worker Name</th>
                <th className="p-3">Date Disbursed</th>
                <th className="p-3">Reason / Purpose</th>
                <th className="p-3 text-right">Original Amount</th>
                <th className="p-3 text-right">Recovery / Month</th>
                <th className="p-3 text-right">Remaining Balance</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {advances.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-900">{a.workerName}</td>
                  <td className="p-3 text-slate-600">{formatDate(a.date)}</td>
                  <td className="p-3 text-slate-600">{a.reason}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">{formatINR(a.amount)}</td>
                  <td className="p-3 text-right font-mono text-rose-600">-{formatINR(a.recoveryPerMonth)}/mo</td>
                  <td className="p-3 text-right font-mono font-black text-rose-700">{formatINR(a.remainingBalance)}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                      {a.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Issue Advance */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Issue Worker Salary Advance</h3>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdvance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Select Worker *</label>
                <select
                  value={advanceForm.workerId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, workerId: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Advance Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Monthly Payroll Recovery Cut (₹) *</label>
                <input
                  type="number"
                  required
                  value={advanceForm.recoveryPerMonth}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, recoveryPerMonth: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Reason for Advance</label>
                <input
                  type="text"
                  required
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="e.g. Festival travel to village / Medical"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Confirm Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

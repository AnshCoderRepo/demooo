import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Worker, WorkerType, AttendanceRecord, WorkerAdvance } from '../types';
import { formatINR, formatDate, exportToCSV } from '../utils/formatters';
import { 
  UserCheck, Plus, Search, Filter, Download, Calendar, 
  CreditCard, Printer, Share2, History, CheckCircle2, 
  X, AlertCircle, ArrowRight, User, DollarSign, Wallet, RotateCcw,
  Edit, ShieldCheck, Trash2
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';

export const WorkersSalary: React.FC = () => {
  const { 
    workers, 
    attendance, 
    advances, 
    addWorker,
    updateWorker,
    deleteWorker,
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
  const [advanceFilter, setAdvanceFilter] = useState<'all' | 'hasAdvance' | 'noAdvance'>('all');

  // Advance modal state
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    workerId: 'worker-1',
    amount: 5000,
    reason: 'Family medical expense',
    recoveryPerMonth: 1500,
  });

  // Edit worker state
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deleteModalWorker, setDeleteModalWorker] = useState<Worker | null>(null);
  const [editWorkerName, setEditWorkerName] = useState('');
  const [editWorkerPhone, setEditWorkerPhone] = useState('');
  const [editWorkerRole, setEditWorkerRole] = useState<WorkerType>('driver');
  const [editWorkerSalary, setEditWorkerSalary] = useState(25000);
  const [editWorkerDl, setEditWorkerDl] = useState('');
  const [editWorkerUpi, setEditWorkerUpi] = useState('');

  // Add worker state
  const [addWorkerOpen, setAddWorkerOpen] = useState(false);
  const [newName, setNewName] = useState('Dharmendra Yadav');
  const [newPhone, setNewPhone] = useState('+91 98711 55667');
  const [newRole, setNewRole] = useState<WorkerType>('driver');
  const [newSalary, setNewSalary] = useState(24000);
  const [newDl, setNewDl] = useState('DL-04-2018-091823');
  const [newDlExp, setNewDlExp] = useState('2028-06-30');
  const [newUpi, setNewUpi] = useState('dharmendra@sbi');
  const [newAddress, setNewAddress] = useState('Gali 4, Mahipalpur Extension, New Delhi');

  // Payroll adjustments override state per worker
  const [payrollOverrides, setPayrollOverrides] = useState<Record<string, {
    bonus: number;
    allowance: number;
    advanceDeduction: number;
  }>>({});

  const isWorkerFilterActive = searchQuery !== '' || typeFilter !== 'all' || advanceFilter !== 'all';

  const handleResetWorkerFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setAdvanceFilter('all');
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch = 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.phone.includes(searchQuery) ||
      (w.licenceNo && w.licenceNo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || w.type === typeFilter;
    const workerAdvances = advances.filter(a => a.workerId === w.id && a.remainingBalance > 0);
    const matchesAdvance = 
      advanceFilter === 'all' ? true :
      advanceFilter === 'hasAdvance' ? workerAdvances.length > 0 :
      workerAdvances.length === 0;
    return matchesSearch && matchesType && matchesAdvance;
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
    const activeAdv = advances.find((a) => a.workerId === worker.id && a.remainingBalance > 0);
    const advanceDeduction = activeAdv ? Math.min(activeAdv.recoveryPerMonth, activeAdv.remainingBalance) : 0;
    const actualAdvanceDeduction = overrides.advanceDeduction > 0 ? overrides.advanceDeduction : advanceDeduction;

    const netPayable = Math.max(0, baseProrated + totalAllowance + overrides.bonus - actualAdvanceDeduction);

    return {
      baseProrated,
      totalAllowance,
      bonus: overrides.bonus,
      advanceDeduction: actualAdvanceDeduction,
      netPayable,
      absences,
      halfDays,
    };
  };

  const handleAddAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const worker = workers.find((w) => w.id === advanceForm.workerId);
    if (!worker) return;

    addWorkerAdvance({
      workerId: worker.id,
      workerName: worker.name,
      amount: Number(advanceForm.amount),
      date: '2026-11-02',
      reason: advanceForm.reason,
      recoveryPerMonth: Number(advanceForm.recoveryPerMonth),
      remainingBalance: Number(advanceForm.amount),
      status: 'active',
    });

    setIsAdvanceModalOpen(false);
  };

  const handleOpenEditWorker = (w: Worker) => {
    setEditingWorker(w);
    setEditWorkerName(w.name);
    setEditWorkerPhone(w.phone);
    setEditWorkerRole(w.type);
    setEditWorkerSalary(w.baseSalary);
    setEditWorkerDl(w.licenceNo || '');
    setEditWorkerUpi(w.bankUpi);
  };

  const handleSaveWorkerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    updateWorker(editingWorker.id, {
      name: editWorkerName,
      phone: editWorkerPhone,
      type: editWorkerRole,
      baseSalary: Number(editWorkerSalary),
      licenceNo: editWorkerDl || undefined,
      bankUpi: editWorkerUpi,
    }, `Updated worker profile: ${editWorkerName} (${editWorkerRole})`);
    setEditingWorker(null);
  };

  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const newWorker: Worker = {
      id: `worker-${Date.now()}`,
      name: newName,
      phone: newPhone,
      address: newAddress,
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      idProof: 'Aadhaar Card',
      type: newRole,
      joiningDate: '2026-11-02',
      status: 'active',
      emergencyContact: '+91 98110 00099 (Family)',
      bankUpi: newUpi,
      licenceNo: newRole === 'driver' ? newDl : undefined,
      licenceExpiry: newRole === 'driver' ? newDlExp : undefined,
      salaryType: 'monthly_fixed',
      baseSalary: Number(newSalary),
      tripAllowanceRate: 400,
    };
    addWorker(newWorker);
    setAddWorkerOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Role', 'Phone', 'Base Salary', 'Prorated Base', 'Allowance', 'Bonus', 'Advance Cut', 'Net Disbursable'];
    const rows = filteredWorkers.map((w) => {
      const calc = calculateWorkerPayroll(w);
      return [
        w.name,
        w.type,
        w.phone,
        w.baseSalary,
        calc.baseProrated,
        calc.totalAllowance,
        calc.bonus,
        calc.advanceDeduction,
        calc.netPayable,
      ];
    });
    exportToCSV('Crew_Payroll_November_2026', headers, rows);
    showToast({ type: 'success', title: 'Payroll Sheet Downloaded' });
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
              Operations Crew ({workers.length})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Driver & conductor roster, interactive attendance grid (P/HD/A/L), advance recovery ledger, and 1-click salary disbursement.
          </p>
        </div>

        {/* Tab Switcher & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'payroll' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Payroll (Nov)
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
            onClick={() => setAddWorkerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Worker</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Suite */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search worker name, licence #, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isWorkerFilterActive && (
              <button
                onClick={handleResetWorkerFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors border border-rose-200"
                title="Reset worker filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <div className="text-[11px] text-slate-500 font-medium">
              Showing <strong className="text-slate-900 font-bold">{filteredWorkers.length}</strong> of {workers.length} crew members
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
            <option value="all">All Worker Roles (Crew & Staff)</option>
            <option value="driver">Heavy Vehicle Drivers (Commercial HMV)</option>
            <option value="conductor">Conductors / Crew Managers</option>
            <option value="helper">Trip Helpers & Cleaners</option>
            <option value="office">Office Booking Staff & Accounts</option>
            <option value="mechanic">Workshop Mechanics & Maintenance</option>
          </select>

          <select
            value={advanceFilter}
            onChange={(e) => setAdvanceFilter(e.target.value as any)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Advance States</option>
            <option value="hasAdvance">Has Active Advance / Loan Balance</option>
            <option value="noAdvance">Zero Outstanding Advances</option>
          </select>
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
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Worker Name</th>
                    <th className="p-3.5">Designation</th>
                    <th className="p-3.5 text-right">Base Salary</th>
                    <th className="p-3.5 text-right">Attendance Prorated</th>
                    <th className="p-3.5 text-right">Trip Bhatta</th>
                    <th className="p-3.5 text-right">Advance Cut</th>
                    <th className="p-3.5 text-right font-black">Net Disbursable</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredWorkers.map((w) => {
                    const payroll = calculateWorkerPayroll(w);

                    return (
                      <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{w.name}</div>
                          <div className="text-slate-400 font-mono text-[10px]">{w.phone}</div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {w.type}
                          </span>
                        </td>

                        <td className="p-3.5 text-right font-mono text-slate-600">
                          {formatINR(w.baseSalary)}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          {formatINR(payroll.baseProrated)}
                          {payroll.absences > 0 && (
                            <span className="text-[10px] text-rose-600 block">(-{payroll.absences} absent)</span>
                          )}
                        </td>

                        <td className="p-3.5 text-right font-mono text-emerald-700 font-bold">
                          +{formatINR(payroll.totalAllowance)}
                        </td>

                        <td className="p-3.5 text-right font-mono text-rose-600">
                          {payroll.advanceDeduction > 0 ? `-${formatINR(payroll.advanceDeduction)}` : '₹0'}
                        </td>

                        <td className="p-3.5 text-right font-mono font-black text-slate-900 text-sm">
                          {formatINR(payroll.netPayable)}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openSalarySlipModal({
                                worker: w,
                                month: 'November 2026',
                                base: payroll.baseProrated,
                                allowance: payroll.totalAllowance,
                                advanceDeduction: payroll.advanceDeduction,
                                netPayable: payroll.netPayable,
                              })}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                              title="Preview Payslip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => payWorkerSalary(w.id, 'November 2026', payroll.netPayable, 'Bank')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                              title="Disburse Net Salary"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
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

      {/* TAB 2: ATTENDANCE GRID */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Monthly Attendance Roster (Interactive Click-to-Cycle)
              </h3>
              <p className="text-xs text-slate-500">
                Click any status chip to cycle: <strong>P</strong> (Present) → <strong>HD</strong> (Half Day) → <strong>A</strong> (Absent) → <strong>L</strong> (Paid Leave). Prorates payroll automatically.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                <tr>
                  <th className="p-3 w-56">Crew Member</th>
                  <th className="p-3">Role</th>
                  {attendanceDays.map((d) => (
                    <th key={d} className="p-3 text-center min-w-[90px]">
                      {formatDate(d).slice(0, 6)}
                    </th>
                  ))}
                  <th className="p-3 text-right">Summary Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredWorkers.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900">{w.name}</td>
                    <td className="p-3 text-slate-500 uppercase text-[10px]">{w.type}</td>
                    {attendanceDays.map((d) => {
                      const st = getAttendanceStatus(w.id, d);
                      const bg = 
                        st === 'P' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        st === 'HD' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        st === 'A' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                        'bg-blue-100 text-blue-800 border-blue-300';

                      return (
                        <td key={d} className="p-3 text-center">
                          <button
                            onClick={() => cycleAttendance(w.id, d)}
                            className={`w-12 py-1 rounded-lg text-xs font-black border transition-transform hover:scale-110 shadow-sm ${bg}`}
                            title="Click to cycle attendance"
                          >
                            {st}
                          </button>
                        </td>
                      );
                    })}
                    <td className="p-3 text-right text-emerald-700 font-bold">
                      Fully Present (100%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CREW DIRECTORY */}
      {activeTab === 'workers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map((w) => (
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openHistory('Worker', w.id, w.name)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500"
                    title="Audit History"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditWorker(w)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-amber-600 hover:text-amber-700"
                    title="Edit Worker Profile"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
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

      {/* Modal: Edit Worker Profile */}
      {editingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Edit Crew Profile • {editingWorker.name}
              </h3>
              <button onClick={() => setEditingWorker(null)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkerEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editWorkerName}
                    onChange={(e) => setEditWorkerName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Designation</label>
                  <select
                    value={editWorkerRole}
                    onChange={(e) => setEditWorkerRole(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="driver">Driver (Heavy Commercial)</option>
                    <option value="conductor">Conductor</option>
                    <option value="helper">Helper / Cleaner</option>
                    <option value="office">Office Booking Staff</option>
                    <option value="mechanic">Workshop Mechanic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={editWorkerPhone}
                    onChange={(e) => setEditWorkerPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Base Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={editWorkerSalary}
                    onChange={(e) => setEditWorkerSalary(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {editWorkerRole === 'driver' && (
                <div>
                  <label className="block text-slate-600 mb-1">Driving Licence Number</label>
                  <input
                    type="text"
                    value={editWorkerDl}
                    onChange={(e) => setEditWorkerDl(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-600 mb-1">Bank Account / UPI ID</label>
                <input
                  type="text"
                  value={editWorkerUpi}
                  onChange={(e) => setEditWorkerUpi(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Worker */}
      {addWorkerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">+ Onboard New Crew Member</h3>
              <button onClick={() => setAddWorkerOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Designation</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="driver">Driver (Heavy Commercial)</option>
                    <option value="conductor">Conductor</option>
                    <option value="helper">Helper / Cleaner</option>
                    <option value="office">Office Booking Staff</option>
                    <option value="mechanic">Workshop Mechanic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Base Monthly Salary (₹) *</label>
                  <input
                    type="number"
                    value={newSalary}
                    onChange={(e) => setNewSalary(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {newRole === 'driver' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">HMV Licence Number</label>
                    <input
                      type="text"
                      value={newDl}
                      onChange={(e) => setNewDl(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Licence Expiry</label>
                    <input
                      type="date"
                      value={newDlExp}
                      onChange={(e) => setNewDlExp(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-600 mb-1">Current Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Bank UPI / Account Details</label>
                <input
                  type="text"
                  value={newUpi}
                  onChange={(e) => setNewUpi(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAddWorkerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
                >
                  Register Crew
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

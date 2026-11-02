import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { formatINR, formatDate } from '../utils/formatters';
import { 
  BusFront, TrendingUp, TrendingDown, Clock, ShieldAlert, 
  CreditCard, PlusCircle, Ticket, Receipt, UserCheck, 
  Sparkles, ArrowUpRight, ArrowRight, AlertTriangle, 
  Calendar, CheckCircle2, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid, AreaChart, Area 
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { 
    charterBookings, 
    payments, 
    expenses, 
    reminders, 
    emis, 
    customers, 
    buses, 
    startTour, 
    t 
  } = useApp();

  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<'today' | 'thisWeek' | 'thisMonth'>('thisMonth');

  // Operational metrics
  const todayTrips = charterBookings.filter(
    (b) => b.status === 'In Progress' || b.pickupDateTime.startsWith('2026-11-02')
  );

  const totalIncomeMonth = payments
    .filter((p) => p.type === 'credit' && p.date.startsWith('2026-10') || p.date.startsWith('2026-11'))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalExpenseMonth = expenses
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPendingDues = customers
    .reduce((sum, c) => sum + c.pendingBalance, 0);

  // Expiring/expired docs
  const docExpiriesCount = buses.reduce((acc, bus) => {
    return acc + bus.documents.filter((d) => d.status === 'expiring' || d.status === 'expired').length;
  }, 0);

  const emiDueSoon = emis.filter((e) => e.status === 'active' && e.dueDayOfMonth <= 7);

  // Chart Data: Last 7 Days income vs expense
  const chartData = [
    { day: '27 Oct', income: 42000, expense: 18000 },
    { day: '28 Oct', income: 65000, expense: 48000 },
    { day: '29 Oct', income: 84000, expense: 32000 },
    { day: '30 Oct', income: 55000, expense: 22000 },
    { day: '31 Oct', income: 98000, expense: 64000 },
    { day: '01 Nov', income: 72000, expense: 28000 },
    { day: '02 Nov (Today)', income: 48500, expense: 21650 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Operations Cockpit
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live: 2 Nov 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fleet, charter bookings, ticketing, and compliance snapshot for Delhi HQ.
          </p>
        </div>

        {/* Date Filter & Guided Tour Banner Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-1 flex items-center text-xs font-medium">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                dateFilter === 'today' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('thisWeek')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                dateFilter === 'thisWeek' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateFilter('thisMonth')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                dateFilter === 'thisMonth' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Nov 2026
            </button>
          </div>

          <button
            onClick={startTour}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/10 transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Start Guided Demo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (All Clickable to deep-link filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Today's Trips */}
        <div
          onClick={() => navigate('/charter-bookings')}
          className="bg-white border border-slate-200 hover:border-amber-400 p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t('todayTrips')}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BusFront className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{todayTrips.length} Trips</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            2 On Road Right Now
          </p>
        </div>

        {/* Income (Month) */}
        <div
          onClick={() => navigate('/payments')}
          className="bg-white border border-slate-200 hover:border-emerald-400 p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t('incomeMonth')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatINR(totalIncomeMonth)}</div>
          <p className="text-[11px] text-slate-500 mt-1">30 Verified Receipts</p>
        </div>

        {/* Expenses (Month) */}
        <div
          onClick={() => navigate('/expenses')}
          className="bg-white border border-slate-200 hover:border-rose-400 p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t('expensesMonth')}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatINR(totalExpenseMonth)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Diesel, Toll & Spares</p>
        </div>

        {/* Pending Dues */}
        <div
          onClick={() => navigate('/customers')}
          className="bg-white border border-slate-200 hover:border-amber-400 p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t('pendingDues')}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">{formatINR(totalPendingDues)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Across 7 Customers</p>
        </div>

        {/* Document Expiries */}
        <div
          onClick={() => navigate('/fleet')}
          className="bg-white border border-slate-200 hover:border-rose-400 p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t('docExpiries')}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{docExpiriesCount} Alerts</div>
          <p className="text-[11px] text-rose-500 font-semibold mt-1">1 Expired • 1 Expiring</p>
        </div>

        {/* EMI Due */}
        <div
          onClick={() => navigate('/emi-loans')}
          className="bg-white border border-slate-200 hover:border-amber-400 p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t('emiDue')}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">₹76,500</div>
          <p className="text-[11px] text-amber-600 font-bold mt-1">Due in 3 Days (05 Nov)</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
          {t('quickActions')}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => navigate('/charter-bookings')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-left border border-slate-700/60 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">{t('newBooking')}</div>
              <div className="text-[10px] text-slate-400">Shadi, Tirth, Govt</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/route-tickets')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-left border border-slate-700/60 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">{t('sellTicket')}</div>
              <div className="text-[10px] text-slate-400">Delhi-Siliguri/Patna</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-left border border-slate-700/60 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-105">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">{t('addExpense')}</div>
              <div className="text-[10px] text-slate-400">Diesel, Toll, Repairs</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/workers')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-left border border-slate-700/60 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">{t('markSalaryPaid')}</div>
              <div className="text-[10px] text-slate-400">Attendance & Slips</div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid: Revenue Chart vs Needs Attention Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Recharts (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Income vs Expenses (Last 7 Days)</h3>
              <p className="text-xs text-slate-500">Comparison of daily passenger ticket/advance receipts vs fleet operating costs</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Net Profit Margin: 44.2%
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip
                  formatter={(val: number | undefined) => [formatINR(val ?? 0), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Receipts / Inflows" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Fleet Costs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Needs Attention Alert Stack (1 col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">{t('needsAttention')}</h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {reminders.filter(r => r.status === 'pending').length} Actions
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Items requiring administrative action before today's evening departures.
            </p>

            <div className="space-y-3">
              {/* Alert 1: Fitness expired */}
              <div 
                onClick={() => navigate('/reminders')}
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 cursor-pointer hover:bg-rose-100/70 transition-colors"
              >
                <div className="flex items-center justify-between text-rose-900 font-bold text-xs">
                  <span>DL 01 AB 8810: Fitness EXPIRED</span>
                  <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-mono">28 Oct</span>
                </div>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Bus is scheduled for Patna tonight. RTO fitness expired 5 days ago!
                </p>
              </div>

              {/* Alert 2: EMI due in 3 days */}
              <div 
                onClick={() => navigate('/emi-loans')}
                className="p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition-colors"
              >
                <div className="flex items-center justify-between text-amber-900 font-bold text-xs">
                  <span>Tata Capital EMI Due (₹76,500)</span>
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded font-mono">05 Nov</span>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Maintain ₹76,500 in SBI Kashmere Gate A/C for auto-clearing.
                </p>
              </div>

              {/* Alert 3: Tomorrow's charter trip */}
              <div 
                onClick={() => navigate('/charter-bookings')}
                className="p-3 rounded-xl bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100/70 transition-colors"
              >
                <div className="flex items-center justify-between text-blue-900 font-bold text-xs">
                  <span>Tomorrow: DAV School Charter</span>
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono">07:30 AM</span>
                </div>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Bus DL 04 EF 7812 assigned to driver Balwant Gurjar.
                </p>
              </div>

              {/* Alert 4: Customer Overdue */}
              <div 
                onClick={() => navigate('/customers')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
                  <span>Verma Tent House: ₹35,000 Overdue</span>
                  <span className="text-[10px] text-slate-500 font-mono">20+ Days</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Previous Shadi balance still outstanding. Reminder SMS sent.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/reminders')}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            <span>Open All Reminders Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

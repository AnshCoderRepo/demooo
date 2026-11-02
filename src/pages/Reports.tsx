import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate, exportToCSV } from '../utils/formatters';
import { 
  BarChart3, Download, TrendingUp, TrendingDown, 
  Fuel, Users, Truck, Calendar, FileText 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';

export const Reports: React.FC = () => {
  const { 
    buses, 
    charterBookings, 
    tickets, 
    payments, 
    expenses, 
    customers,
    workers,
    advances,
    showToast 
  } = useApp();

  const [reportTab, setReportTab] = useState<'fleetProfit' | 'occupancy' | 'fuelEfficiency' | 'payroll'>('fleetProfit');

  // Profit per bus calculation
  const busProfitData = buses.map((b) => {
    const charterRev = charterBookings
      .filter((cb) => cb.assignedBuses.some((ab) => ab.busId === b.id) && cb.status !== 'Cancelled')
      .reduce((s, cb) => s + cb.quote.grandTotal, 0);

    const ticketRev = tickets
      .filter((tk) => tk.busId === b.id && tk.status === 'Confirmed')
      .reduce((s, tk) => s + tk.grandTotal, 0);

    const totalRev = charterRev + ticketRev;

    const busExp = expenses
      .filter((e) => e.busId === b.id)
      .reduce((s, e) => s + e.amount, 0);

    const netProfit = totalRev - busExp;
    const margin = totalRev > 0 ? Math.round((netProfit / totalRev) * 100) : 0;

    return {
      plateNumber: b.plateNumber,
      model: b.model,
      revenue: totalRev,
      expense: busExp,
      netProfit,
      margin,
    };
  });

  // Route occupancy demo
  const routeOccupancyData = [
    { route: 'Delhi ↔ Siliguri (Sleeper)', capacity: 38, booked: 32, occupancy: 84 },
    { route: 'Delhi ↔ Patna / Gaya', capacity: 40, booked: 36, occupancy: 90 },
    { route: 'Delhi ↔ Gorakhpur', capacity: 45, booked: 38, occupancy: 84 },
    { route: 'Delhi ↔ Muzaffarpur', capacity: 40, booked: 35, occupancy: 87.5 },
  ];

  // Fuel efficiency demo
  const fuelData = buses.map((b) => {
    const dieselExpenses = expenses.filter((e) => e.busId === b.id && e.category === 'Diesel');
    const totalDieselCost = dieselExpenses.reduce((s, e) => s + e.amount, 0);
    const approxKm = dieselExpenses.length * 750 + 200;
    const kmPerLitre = b.type === 'Mini Bus' ? 6.8 : (b.type === 'Non-AC Seater' ? 4.5 : 3.8);

    return {
      plateNumber: b.plateNumber,
      type: b.type,
      totalFuelCost: totalDieselCost,
      approxKm,
      kmPerLitre,
      costPerKm: Math.round(92 / kmPerLitre), // Diesel @ ~₹92/Ltr
    };
  });

  const handleExportCSV = () => {
    const headers = ['Bus Plate', 'Model', 'Total Revenue', 'Operating Costs', 'Net Profit', 'Profit Margin (%)'];
    const rows = busProfitData.map((d) => [
      d.plateNumber,
      d.model,
      d.revenue,
      d.expense,
      d.netProfit,
      `${d.margin}%`,
    ]);
    exportToCSV('Fleet_Profitability_Audit_Report', headers, rows);
    showToast({ type: 'success', title: 'Analytics Report Exported' });
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Business Intelligence & Fleet Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              Executive Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bus profitability rankings, route load factors, diesel mileage metrics, and payroll overhead analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setReportTab('fleetProfit')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                reportTab === 'fleetProfit' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Bus Profitability
            </button>
            <button
              onClick={() => setReportTab('occupancy')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                reportTab === 'occupancy' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Route Occupancy
            </button>
            <button
              onClick={() => setReportTab('fuelEfficiency')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                reportTab === 'fuelEfficiency' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Fuel Mileage
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

      {/* TAB 1: FLEET PROFITABILITY */}
      {reportTab === 'fleetProfit' && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Net Profit Per Bus Vehicle (Agreed Inflows vs Highway Operating Costs)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Values in ₹ INR for the active operating period</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={busProfitData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="plateNumber" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip
                    formatter={(val: number | undefined) => [formatINR(val ?? 0), '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Total Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Operating Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netProfit" name="Net Bottom Line" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Bus Number</th>
                  <th className="p-3.5">Make & Model</th>
                  <th className="p-3.5 text-right">Total Revenue</th>
                  <th className="p-3.5 text-right">Operating Costs</th>
                  <th className="p-3.5 text-right">Net Profit</th>
                  <th className="p-3.5 text-center">Profit Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {busProfitData.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{d.plateNumber}</td>
                    <td className="p-3.5 text-slate-600">{d.model}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">{formatINR(d.revenue)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-600">{formatINR(d.expense)}</td>
                    <td className="p-3.5 text-right font-mono font-black text-sm text-slate-900">{formatINR(d.netProfit)}</td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                        d.margin >= 40 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTE OCCUPANCY */}
      {reportTab === 'occupancy' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Inter-State Route Occupancy & Load Factors
            </h3>
            <p className="text-xs text-slate-500">
              Average seat booking fill rate across scheduled daily services
            </p>
          </div>

          <div className="space-y-4">
            {routeOccupancyData.map((r, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-900 text-sm">{r.route}</span>
                  <span className="font-mono text-emerald-800 text-sm">{r.occupancy}% Load Factor</span>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${r.occupancy}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Seats Booked: <strong>{r.booked} / {r.capacity} Seats</strong></span>
                  <span>Break-even Threshold: <strong>55%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FUEL EFFICIENCY */}
      {reportTab === 'fuelEfficiency' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Diesel Consumption & Cost Per Kilometre
            </h3>
            <p className="text-xs text-slate-500">
              Benchmarking fuel efficiency across multi-axle Volvos, BharatBenz sleepers, and Mini buses
            </p>
          </div>

          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 border-b text-slate-700 font-bold uppercase">
              <tr>
                <th className="p-3">Bus Plate</th>
                <th className="p-3">Vehicle Type</th>
                <th className="p-3 text-right">Total Diesel Spent</th>
                <th className="p-3 text-center">Avg Mileage (km/L)</th>
                <th className="p-3 text-right">Fuel Cost / km</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {fuelData.map((f, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="p-3 font-mono font-bold text-slate-900">{f.plateNumber}</td>
                  <td className="p-3 text-slate-600">{f.type}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">{formatINR(f.totalFuelCost)}</td>
                  <td className="p-3 text-center font-mono font-bold text-amber-700">{f.kmPerLitre} km/L</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-800">₹{f.costPerKm} / km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

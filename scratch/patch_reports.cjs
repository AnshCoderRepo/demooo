const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/Reports.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add workers and advances to useApp destructuring
content = content.replace(
  /customers,\s*showToast\s*\} = useApp\(\);/,
  `customers,
    workers,
    advances,
    showToast 
  } = useApp();`
);

// 2. Add Payroll tab button in the top tab switcher
const tabButtonTarget = `<button
              onClick={() => setReportTab('fuelEfficiency')}
              className={\`px-3 py-1.5 rounded-lg transition-colors \${
                reportTab === 'fuelEfficiency' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }\`}
            >
              Fuel Mileage
            </button>
          </div>`;

const tabButtonReplacement = `<button
              onClick={() => setReportTab('fuelEfficiency')}
              className={\`px-3 py-1.5 rounded-lg transition-colors \${
                reportTab === 'fuelEfficiency' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }\`}
            >
              Fuel Mileage
            </button>
            <button
              onClick={() => setReportTab('payroll')}
              className={\`px-3 py-1.5 rounded-lg transition-colors \${
                reportTab === 'payroll' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }\`}
            >
              Payroll & Crew Cost
            </button>
          </div>`;

content = content.replace(tabButtonTarget, tabButtonReplacement);

// 3. Update tab active style for each button
content = content.replace(
  "reportTab === 'fleetProfit' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'",
  "reportTab === 'fleetProfit' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'"
);
content = content.replace(
  "reportTab === 'occupancy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'",
  "reportTab === 'occupancy' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'"
);
content = content.replace(
  "reportTab === 'fuelEfficiency' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'",
  "reportTab === 'fuelEfficiency' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'"
);
content = content.replace(
  "reportTab === 'payroll' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'",
  "reportTab === 'payroll' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'"
);

// 4. Add the Payroll Tab View
const payrollViewSnippet = `
      {/* TAB 4: PAYROLL & CREW COST ANALYSIS */}
      {reportTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Crew Payroll & Driver Cost Analysis (October / November 2026)
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly wage liabilities, per-trip crew allowances (bhatta), night halts, and active salary advance recoveries.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {workers.length} Onboarded Crew Members
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Monthly Base Payroll</span>
                <span className="text-lg font-bold font-mono text-slate-900">
                  {formatINR(workers.reduce((s, w) => s + w.baseSalary, 0))}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Drivers, Conductors, Helpers</span>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs">
                <span className="text-[10px] text-blue-800 uppercase font-bold block">Charter Trip Bhatta Budget</span>
                <span className="text-lg font-bold font-mono text-blue-950">₹38,500</span>
                <span className="text-[10px] text-blue-600 mt-0.5 block">₹800/day driver allowance</span>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs">
                <span className="text-[10px] text-amber-800 uppercase font-bold block">Active Salary Advances</span>
                <span className="text-lg font-bold font-mono text-amber-950">
                  {formatINR(advances.filter(a => a.remainingAmount > 0).reduce((s, a) => s + a.remainingAmount, 0))}
                </span>
                <span className="text-[10px] text-amber-700 mt-0.5 block">Pending monthly deduction</span>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Avg Crew Cost / Trip</span>
                <span className="text-lg font-bold font-mono text-emerald-950">₹4,200</span>
                <span className="text-[10px] text-emerald-700 mt-0.5 block">Driver + Conductor crew</span>
              </div>
            </div>

            {/* Workers Payroll Ledger Table */}
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden mt-4">
              <thead className="bg-slate-50 border-b text-slate-700 font-bold uppercase">
                <tr>
                  <th className="p-3">Worker Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Compensation Scheme</th>
                  <th className="p-3 text-right">Base Wage</th>
                  <th className="p-3 text-right">Est. Monthly Bhatta</th>
                  <th className="p-3 text-right">Advance Balance</th>
                  <th className="p-3 text-right">Net Est. Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {workers.map((w) => {
                  const workerAdvances = advances.filter((a) => a.workerId === w.id && a.remainingAmount > 0);
                  const advBal = workerAdvances.reduce((s, a) => s + a.remainingAmount, 0);
                  const estBhatta = w.type === 'driver' ? 4500 : w.type === 'conductor' ? 2500 : 1500;
                  const netPay = Math.max(0, w.baseSalary + estBhatta - (advBal > 0 ? 1500 : 0));

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{w.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {w.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 capitalize">{w.salaryType.replace('_', ' ')}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{formatINR(w.baseSalary)}</td>
                      <td className="p-3 text-right font-mono text-blue-700">+{formatINR(estBhatta)}</td>
                      <td className="p-3 text-right font-mono text-amber-700">
                        {advBal > 0 ? formatINR(advBal) : '₹0'}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">
                        {formatINR(netPay)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
`;

content = content.replace(/<\/div>\s*;\s*\}\s*;\s*$/, `${payrollViewSnippet}\n    </div>\n  );\n};\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched Reports.tsx!');


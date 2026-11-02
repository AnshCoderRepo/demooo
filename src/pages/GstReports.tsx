import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate, exportToCSV } from '../utils/formatters';
import { 
  PieChart, Download, FileSpreadsheet, ArrowUpRight, 
  TrendingDown, CheckCircle2, ShieldCheck, Building2, User 
} from 'lucide-react';

export const GstReports: React.FC = () => {
  const { gstInvoices, expenses, showToast } = useApp();

  const [dateRange, setDateRange] = useState('2026-10-to-11');

  // Sales calculations
  const totalTaxable = gstInvoices.reduce((s, inv) => s + inv.subtotalTaxable, 0);
  const totalCgst = gstInvoices.reduce((s, inv) => s + inv.totalCgst, 0);
  const totalSgst = gstInvoices.reduce((s, inv) => s + inv.totalSgst, 0);
  const totalIgst = gstInvoices.reduce((s, inv) => s + inv.totalIgst, 0);
  const totalOutputTax = totalCgst + totalSgst + totalIgst;

  // Input Tax Credit (ITC) from expenses
  const totalInputTaxCredit = expenses.reduce((s, e) => s + e.gstPaid, 0);

  // Net GST payable to Govt = Output Tax minus ITC
  const netGstPayable = Math.max(0, totalOutputTax - totalInputTaxCredit);

  // Split B2B vs B2C
  const b2bInvoices = gstInvoices.filter((inv) => Boolean(inv.customerGstin));
  const b2cInvoices = gstInvoices.filter((inv) => !inv.customerGstin);

  const b2bTaxable = b2bInvoices.reduce((s, inv) => s + inv.subtotalTaxable, 0);
  const b2bTax = b2bInvoices.reduce((s, inv) => s + inv.totalTax, 0);

  const b2cTaxable = b2cInvoices.reduce((s, inv) => s + inv.subtotalTaxable, 0);
  const b2cTax = b2cInvoices.reduce((s, inv) => s + inv.totalTax, 0);

  const handleExportCAFile = () => {
    const headers = [
      'Doc Type', 'Invoice No', 'Date', 'Customer Name', 'Customer GSTIN', 
      'Place of Supply', 'Taxable Value', 'CGST Amount', 'SGST Amount', 
      'IGST Amount', 'Total Tax', 'Invoice Grand Total'
    ];
    const rows = gstInvoices.map((inv) => [
      inv.type,
      inv.invoiceNumber,
      inv.date,
      inv.customerName,
      inv.customerGstin || 'URP (Unregistered / B2C)',
      inv.customerState,
      inv.subtotalTaxable,
      inv.totalCgst,
      inv.totalSgst,
      inv.totalIgst,
      inv.totalTax,
      inv.grandTotal,
    ]);
    exportToCSV('GSTR_1_CA_Filing_Report', headers, rows);
    showToast({
      type: 'success',
      title: 'GSTR-1 CA Return Exported',
      message: 'Excel/CSV file with B2B/B2C split ready for Chartered Accountant upload.',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              GST Tax Audit & CA Filing Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20">
              GSTR-1 & GSTR-3B Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated monthly reconciliation of output passenger tax liability against input tax credit (ITC) on bus repairs & spares.
          </p>
        </div>

        <button
          onClick={handleExportCAFile}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-bold shadow transition-all active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel / CSV for CA</span>
        </button>
      </div>

      {/* 4 Tax Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Taxable Turnover
          </span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">
            {formatINR(totalTaxable)}
          </span>
          <span className="text-[10px] text-amber-400 mt-1 block">SAC 9964 Passenger Services</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Output Tax Liability
          </span>
          <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
            {formatINR(totalOutputTax)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            CGST {formatINR(totalCgst)} + SGST {formatINR(totalSgst)} + IGST {formatINR(totalIgst)}
          </span>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
            Input Tax Credit (ITC)
          </span>
          <span className="text-2xl font-black font-mono text-emerald-950 mt-1 block">
            {formatINR(totalInputTaxCredit)}
          </span>
          <span className="text-[10px] text-emerald-700 mt-1 block">From Workshop Bills & Tyres</span>
        </div>

        <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
            Net Tax Payable to Govt
          </span>
          <span className="text-2xl font-black font-mono text-amber-950 mt-1 block">
            {formatINR(netGstPayable)}
          </span>
          <span className="text-[10px] text-amber-800 mt-1 block">After Setting Off Input Credit</span>
        </div>
      </div>

      {/* B2B vs B2C Split Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* B2B Register */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">B2B Registered Sales (Table 4A)</h3>
                <p className="text-[11px] text-slate-500">Corporate, Schools & Govt entities with valid GSTIN</p>
              </div>
            </div>
            <span className="font-mono font-bold text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
              {b2bInvoices.length} Invoices
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Taxable Value:</span>
              <strong className="font-mono text-slate-900 text-sm">{formatINR(b2bTaxable)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Tax Collected:</span>
              <strong className="font-mono text-blue-700 text-sm">{formatINR(b2bTax)}</strong>
            </div>
          </div>

          <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
            {b2bInvoices.map((inv) => (
              <div key={inv.id} className="p-2.5 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{inv.customerName}</div>
                  <div className="font-mono text-[10px] text-slate-500">{inv.customerGstin} • {inv.customerState}</div>
                </div>
                <div className="text-right font-mono font-bold text-slate-900">
                  {formatINR(inv.grandTotal)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* B2C Register */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">B2C Retail & Ticket Sales (Table 7)</h3>
                <p className="text-[11px] text-slate-500">Individual passengers & un-registered wedding parties</p>
              </div>
            </div>
            <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              {b2cInvoices.length} Invoices
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Taxable Value:</span>
              <strong className="font-mono text-slate-900 text-sm">{formatINR(b2cTaxable)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Tax Collected:</span>
              <strong className="font-mono text-emerald-700 text-sm">{formatINR(b2cTax)}</strong>
            </div>
          </div>

          <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
            {b2cInvoices.map((inv) => (
              <div key={inv.id} className="p-2.5 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">{inv.customerName}</div>
                  <div className="text-[10px] text-slate-500">{inv.type} • {inv.customerState}</div>
                </div>
                <div className="text-right font-mono font-bold text-slate-900">
                  {formatINR(inv.grandTotal)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

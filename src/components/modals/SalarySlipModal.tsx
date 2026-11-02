import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/formatters';
import { Printer, Share2, X, UserCheck, CheckCircle2 } from 'lucide-react';

export const SalarySlipModal: React.FC = () => {
  const { salarySlipModalData, closeSalarySlipModal, settings, sendMockSms, showToast } = useApp();

  if (!salarySlipModalData) return null;

  const { worker, month, netPayable, base, allowance, advanceDeduction } = salarySlipModalData;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    sendMockSms(
      worker.name,
      worker.phone,
      'Salary Slip Dispatched',
      `Dear ${worker.name}, your salary slip for ${month} has been finalized. Net Payable: ${formatINR(netPayable)}. Paid via bank/cash. - Shree Balaji Travels.`,
      'Salary Slip Send'
    );
    showToast({
      type: 'success',
      title: 'Payslip Sent to Worker',
      message: `Direct link messaged to ${worker.name} (${worker.phone}).`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto no-print">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-w-xl w-full border border-slate-200">
        {/* Top Control Bar */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Employee Salary Slip • {month}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-bold shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={closeSalarySlipModal}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Payslip Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh] print-shadow-none text-slate-900">
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-950 uppercase">
                {settings.businessName}
              </h2>
              <p className="text-xs text-slate-600">{settings.address}</p>
              <p className="text-[11px] text-slate-500">Contact: {settings.phone1}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-bold border border-slate-300">
                PAYSLIP: {month.toUpperCase()}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Date: 02 Nov 2026</p>
            </div>
          </div>

          {/* Worker Info */}
          <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Employee Name</span>
              <p className="font-bold text-slate-900">{worker.name}</p>
              <p className="text-slate-600 capitalize">Role: {worker.type}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Details</span>
              <p className="font-mono text-slate-900">{worker.bankUpi}</p>
              <p className="text-slate-600">{worker.idProof}</p>
            </div>
          </div>

          {/* Earnings vs Deductions Breakdown */}
          <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Earnings */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs">
              <h4 className="font-bold text-emerald-900 mb-2 uppercase text-[11px]">Earnings</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Salary (Prorated):</span>
                  <span className="font-mono font-semibold">{formatINR(base)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Trip Allowances / OT:</span>
                  <span className="font-mono font-semibold">{formatINR(allowance)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-200 font-bold text-emerald-950">
                  <span>Gross Earnings:</span>
                  <span className="font-mono">{formatINR(base + allowance)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80 text-xs">
              <h4 className="font-bold text-rose-900 mb-2 uppercase text-[11px]">Deductions</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Advance Salary Recovery:</span>
                  <span className="font-mono font-semibold text-rose-700">-{formatINR(advanceDeduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Fines / Challan:</span>
                  <span className="font-mono font-semibold">₹0</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-rose-200 font-bold text-rose-950">
                  <span>Total Deductions:</span>
                  <span className="font-mono text-rose-700">-{formatINR(advanceDeduction)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay Box */}
          <div className="my-4 p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Net Disbursed Amount</span>
              <span className="text-[11px] text-amber-400">Credited to registered account</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-amber-400">{formatINR(netPayable)}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="text-left">
              <p className="font-semibold text-slate-700">Employee Signature</p>
              <p className="text-[10px] text-slate-400">Acknowledged receipt</p>
            </div>
            <div className="text-right">
              <p className="font-serif italic text-slate-800 font-bold">For Shree Balaji Travels</p>
              <p className="text-[10px] uppercase text-slate-400">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


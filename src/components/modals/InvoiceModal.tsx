import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDate } from '../../utils/formatters';
import { Printer, Share2, X, FileText, CheckCircle2 } from 'lucide-react';

export const InvoiceModal: React.FC = () => {
  const { invoiceModalData, closeInvoiceModal, settings, sendMockSms, showToast } = useApp();

  if (!invoiceModalData) return null;

  const inv = invoiceModalData;
  const isCreditNote = inv.type === 'Credit Note';

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    sendMockSms(
      inv.customerName,
      inv.customerPhone,
      'Invoice Shared',
      `Deepak Raj Travels: ${inv.type} #${inv.invoiceNumber} for ${formatINR(Math.abs(inv.grandTotal))} dated ${formatDate(inv.date)} is ready. Download link sent to your registered contact.`,
      'Invoice Modal'
    );
    showToast({
      type: 'success',
      title: `${inv.type} Sent via WhatsApp/SMS`,
      message: `Direct link messaged to ${inv.customerPhone}.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto no-print">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-w-2xl w-full border border-slate-200">
        {/* Top Control Bar */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isCreditNote ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {inv.type} Preview • {inv.isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp / SMS</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-bold shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={closeInvoiceModal}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-6 overflow-y-auto max-h-[80vh] print-shadow-none text-slate-900">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase">
                  {settings.businessName}
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">{settings.address}</p>
              <p className="text-xs text-slate-600">
                Email: {settings.email} | Phone: {settings.phone1}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-900">GSTIN:</span>
                <span className="font-mono bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                  {inv.businessGstin}
                </span>
                <span className="text-slate-500">State: <strong>{inv.businessState}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                isCreditNote ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-900 text-white'
              }`}>
                {inv.type}
              </span>
              <div className="text-sm font-mono font-bold text-slate-900 mt-1">
                {inv.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Date: <strong>{formatDate(inv.date)}</strong>
              </div>
              {inv.originalInvoiceNumber && (
                <div className="text-[11px] text-amber-700 mt-1 font-medium">
                  Ref Inv: #{inv.originalInvoiceNumber}
                </div>
              )}
            </div>
          </div>

          {/* Billed To */}
          <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Billed To (Customer)</span>
              <p className="font-bold text-sm text-slate-950">{inv.customerName}</p>
              <p className="text-slate-600">{inv.customerPhone}</p>
              {inv.customerGstin ? (
                <p className="font-mono text-[11px] text-slate-700 mt-0.5">
                  GSTIN: <strong>{inv.customerGstin}</strong> (B2B)
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-0.5">Type: Consumer (B2C)</p>
              )}
            </div>

            <div className="sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Place of Supply</span>
              <p className="font-bold text-slate-900">{inv.customerState}</p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                <span>{inv.isInterState ? '🌐 Interstate (IGST 5%)' : '📍 Intra-State (CGST 2.5% + SGST 2.5%)'}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="my-4">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2">Description</th>
                  <th className="p-2">SAC/HSN</th>
                  <th className="p-2 text-right">Taxable</th>
                  <th className="p-2 text-right">Rate</th>
                  {inv.isInterState ? (
                    <th className="p-2 text-right">IGST</th>
                  ) : (
                    <>
                      <th className="p-2 text-right">CGST</th>
                      <th className="p-2 text-right">SGST</th>
                    </>
                  )}
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {inv.items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-2 font-semibold text-slate-900">{item.description}</td>
                    <td className="p-2 font-mono text-slate-600">{item.sacHsn}</td>
                    <td className="p-2 text-right font-mono">{formatINR(item.taxableAmount)}</td>
                    <td className="p-2 text-right">{item.gstRate}%</td>
                    {inv.isInterState ? (
                      <td className="p-2 text-right font-mono text-slate-700">{formatINR(item.igstAmount)}</td>
                    ) : (
                      <>
                        <td className="p-2 text-right font-mono text-slate-700">{formatINR(item.cgstAmount)}</td>
                        <td className="p-2 text-right font-mono text-slate-700">{formatINR(item.sgstAmount)}</td>
                      </>
                    )}
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown Card */}
          <div className="my-4 flex flex-col sm:flex-row items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1 text-slate-600">
              <p><strong>Bank:</strong> {settings.bankDetails.bankName}</p>
              <p><strong>A/C No:</strong> {settings.bankDetails.accNo} (IFSC: {settings.bankDetails.ifsc})</p>
              <p><strong>UPI ID:</strong> {settings.bankDetails.upiId}</p>
            </div>

            <div className="w-full sm:w-64 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span>
                <span className="font-mono">{formatINR(inv.subtotalTaxable)}</span>
              </div>
              {inv.isInterState ? (
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST (5%):</span>
                  <span className="font-mono">{formatINR(inv.totalIgst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Central GST (2.5%):</span>
                    <span className="font-mono">{formatINR(inv.totalCgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State GST (2.5%):</span>
                    <span className="font-mono">{formatINR(inv.totalSgst)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-200 pt-1">
                <span>Total Tax:</span>
                <span className="font-mono">{formatINR(inv.totalTax)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-950 pt-1 border-t-2 border-slate-900">
                <span>Net Invoice Value:</span>
                <span className="font-mono text-base text-slate-950">{formatINR(inv.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Signatory Footer */}
          <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Valid GST Compliant Invoice</span>
            </div>
            <div className="text-right">
              <p className="font-serif italic text-slate-800 font-bold">For Deepak Raj Travels</p>
              <p className="text-[10px] uppercase text-slate-400">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


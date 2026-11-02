import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GSTInvoice } from '../types';
import { formatINR, formatDate, exportToCSV, INDIAN_STATES } from '../utils/formatters';
import { 
  FileText, Plus, Search, Filter, Download, Printer, 
  Share2, ShieldAlert, ArrowRight, CheckCircle2, History, X 
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';

export const GstInvoices: React.FC = () => {
  const { 
    gstInvoices, 
    settings, 
    openInvoiceModal, 
    addGstInvoice, 
    openHistory, 
    showToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [gstWarningModalOpen, setGstWarningModalOpen] = useState(false);
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<GSTInvoice | null>(null);

  // New Invoice Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: `SB-INV-2026-${Math.floor(100 + Math.random() * 900)}`,
    date: '2026-11-02',
    customerName: 'Pradeep Goyal (Goyal Steel)',
    customerPhone: '+91 98100 44321',
    customerGstin: '09AAACG4432K1ZP',
    customerState: 'Uttar Pradesh (09)', // Inter-state => IGST!
    description: 'Passenger Tourist Bus Transport (Shadi Tour)',
    sacHsn: '9964',
    taxableAmount: 50000,
    gstRate: 5,
    type: 'Tax Invoice' as 'Tax Invoice' | 'Credit Note' | 'Debit Note',
  });

  // Calculate CGST+SGST vs IGST
  const isInterState = formData.customerState !== settings.state;
  const taxable = Number(formData.taxableAmount);
  const tax = taxable * (formData.gstRate / 100);

  const cgst = isInterState ? 0 : Math.round(tax / 2);
  const sgst = isInterState ? 0 : Math.round(tax / 2);
  const igst = isInterState ? Math.round(tax) : 0;
  const grandTotal = taxable + tax;

  const filteredInvoices = gstInvoices.filter((inv) => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerGstin && inv.customerGstin.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || inv.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleEditClick = (inv: GSTInvoice) => {
    setSelectedInvoiceForEdit(inv);
    setGstWarningModalOpen(true);
  };

  const handleIssueCreditNoteAlternative = () => {
    if (!selectedInvoiceForEdit) return;
    setGstWarningModalOpen(false);

    // Auto prepopulate Credit Note
    setFormData({
      invoiceNumber: `SB-CR-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: '2026-11-02',
      customerName: selectedInvoiceForEdit.customerName,
      customerPhone: selectedInvoiceForEdit.customerPhone,
      customerGstin: selectedInvoiceForEdit.customerGstin || '',
      customerState: selectedInvoiceForEdit.customerState,
      description: `Credit Note against ${selectedInvoiceForEdit.invoiceNumber}`,
      sacHsn: '9964',
      taxableAmount: selectedInvoiceForEdit.subtotalTaxable,
      gstRate: 5,
      type: 'Credit Note',
    });
    setIsNewModalOpen(true);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    addGstInvoice({
      invoiceNumber: formData.invoiceNumber,
      date: formData.date,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerGstin: formData.customerGstin,
      customerState: formData.customerState,
      businessGstin: settings.gstin,
      businessState: settings.state,
      isInterState,
      type: formData.type,
      items: [
        {
          description: formData.description,
          sacHsn: formData.sacHsn,
          taxableAmount: taxable,
          gstRate: formData.gstRate,
          cgstAmount: cgst,
          sgstAmount: sgst,
          igstAmount: igst,
          totalAmount: grandTotal,
        },
      ],
      subtotalTaxable: taxable,
      totalCgst: cgst,
      totalSgst: sgst,
      totalIgst: igst,
      totalTax: tax,
      grandTotal,
    });

    setIsNewModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Date', 'Type', 'Customer', 'GSTIN', 'Place of Supply', 'Tax Type', 'Taxable Amount', 'Tax Total', 'Invoice Total'];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.date,
      inv.type,
      inv.customerName,
      inv.customerGstin || 'B2C',
      inv.customerState,
      inv.isInterState ? 'IGST (5%)' : 'CGST+SGST (2.5%+2.5%)',
      inv.subtotalTaxable,
      inv.totalTax,
      inv.grandTotal,
    ]);
    exportToCSV('GST_Sales_Register', headers, rows);
    showToast({ type: 'success', title: 'GST Sales Register CSV Exported' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              GST Invoices & Credit Notes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              SAC Code 9964 (5%)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compliant B2B & B2C tax invoices. Automated intra-state (CGST+SGST) vs inter-state (IGST) tax apportionment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Register</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create GST Invoice</span>
          </button>
        </div>
      </div>

      {/* Place of Supply Rule Demonstration Card */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="font-bold uppercase tracking-wider text-[11px] block text-blue-950 mb-1">
            📍 Intra-State Rules (Customer in Delhi)
          </span>
          <p className="leading-relaxed text-blue-800">
            When customer place of supply is <strong>Delhi (07)</strong>, the engine splits tax equally into <strong>CGST (2.5%) + SGST (2.5%)</strong>.
          </p>
        </div>
        <div>
          <span className="font-bold uppercase tracking-wider text-[11px] block text-blue-950 mb-1">
            🌐 Inter-State Rules (Customer in UP / Bihar / Bengal)
          </span>
          <p className="leading-relaxed text-blue-800">
            When customer is from outside Delhi, the engine automatically levies integrated tax <strong>IGST (5%)</strong> without CGST/SGST.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium"
        >
          <option value="all">All Document Types</option>
          <option value="Tax Invoice">Tax Invoices Only</option>
          <option value="Credit Note">Credit Notes Only</option>
          <option value="Debit Note">Debit Notes Only</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Invoice No</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer & GSTIN</th>
                <th className="p-3.5">Place of Supply</th>
                <th className="p-3.5 text-center">Tax Split Applied</th>
                <th className="p-3.5 text-right">Taxable (₹)</th>
                <th className="p-3.5 text-right">Invoice Total (₹)</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 align-top">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {inv.invoiceNumber}
                    </span>
                    <span className={`block text-[10px] font-bold uppercase mt-1 ${
                      inv.type === 'Credit Note' ? 'text-amber-700' : 'text-slate-500'
                    }`}>
                      {inv.type}
                    </span>
                  </td>

                  <td className="p-3.5 align-top text-slate-700 font-medium">
                    {formatDate(inv.date)}
                  </td>

                  <td className="p-3.5 align-top">
                    <div className="font-bold text-slate-900">{inv.customerName}</div>
                    {inv.customerGstin ? (
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 rounded border border-blue-200 font-bold">
                        {inv.customerGstin} (B2B)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">B2C Retail</span>
                    )}
                  </td>

                  <td className="p-3.5 align-top">
                    <div className="font-semibold text-slate-800">{inv.customerState}</div>
                  </td>

                  <td className="p-3.5 align-top text-center">
                    {inv.isInterState ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        IGST 5% ({formatINR(inv.totalIgst)})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        CGST 2.5% + SGST 2.5% ({formatINR(inv.totalCgst + inv.totalSgst)})
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 align-top text-right font-mono font-semibold text-slate-700">
                    {formatINR(inv.subtotalTaxable)}
                  </td>

                  <td className="p-3.5 align-top text-right font-mono font-black text-sm text-slate-900">
                    {formatINR(inv.grandTotal)}
                  </td>

                  <td className="p-3.5 align-top text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View & Print PDF Invoice */}
                      <button
                        onClick={() => openInvoiceModal(inv)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Printable Tax Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit click triggers strict GST rule warning */}
                      <button
                        onClick={() => handleEditClick(inv)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                        title="Edit / Issue Credit Note"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => openHistory('GST Invoice', inv.id, inv.invoiceNumber)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Audit Log"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GST Rules Warning Modal (Intercepts direct edits) */}
      <WarningModal
        isOpen={gstWarningModalOpen}
        type="gst_invoice"
        title="Direct Edit Prohibited by GST Rules"
        message="Under Indian GST Law, finalized tax invoices cannot be edited or modified directly once issued. To adjust values, amend tax rates, or process a cancellation, you must issue a registered Credit Note or Debit Note referencing this original invoice series."
        cancelLabel="Keep As Is"
        alternativeLabel="Issue Credit Note Instead"
        onConfirm={() => {}}
        onCancel={() => setGstWarningModalOpen(false)}
        onActionAlternative={handleIssueCreditNoteAlternative}
      />

      {/* Create New GST Invoice Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Generate {formData.type}
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Document Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="Tax Invoice">Tax Invoice</option>
                    <option value="Credit Note">Credit Note</option>
                    <option value="Debit Note">Debit Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Customer / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Customer Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Customer GSTIN (B2B)</label>
                  <input
                    type="text"
                    value={formData.customerGstin}
                    onChange={(e) => setFormData({ ...formData, customerGstin: e.target.value.toUpperCase() })}
                    placeholder="Optional for B2C"
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Place of Supply (Customer State) *
                </label>
                <select
                  value={formData.customerState}
                  onChange={(e) => setFormData({ ...formData, customerState: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Business Location:</span>
                  <strong>{settings.state}</strong>
                </div>
                <div className="flex justify-between text-slate-700 mt-1">
                  <span>Tax Apportionment:</span>
                  <strong className="text-amber-900">
                    {isInterState ? 'IGST 5% (Inter-State)' : 'CGST 2.5% + SGST 2.5% (Intra-State)'}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Taxable Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.taxableAmount}
                    onChange={(e) => setFormData({ ...formData, taxableAmount: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    disabled
                    value={formData.gstRate}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Tax Amount:</span>
                  <span className="font-mono">{formatINR(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800">
                  <span>Grand Total:</span>
                  <span className="font-mono text-amber-400 text-base">{formatINR(grandTotal)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
                >
                  Issue Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

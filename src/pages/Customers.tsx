import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import { formatINR, formatDate, exportToCSV, INDIAN_STATES } from '../utils/formatters';
import { 
  Users, Search, Plus, Download, Edit, Phone, MapPin, 
  Clock, ArrowRight, Eye, History, X, CheckCircle, AlertCircle, Filter, RotateCcw,
  Trash2, CreditCard, ArrowDownLeft, Receipt
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';

export const Customers: React.FC = () => {
  const { 
    customers, 
    charterBookings, 
    payments, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer,
    addPayment,
    openHistory, 
    showToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  // Delete Customer state
  const [deleteTargetCustomer, setDeleteTargetCustomer] = useState<Customer | null>(null);

  // Quick Payment modal state from Customer Ledger
  const [quickPayOpen, setQuickPayOpen] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState(15000);
  const [quickPayMode, setQuickPayMode] = useState<'UPI' | 'Bank' | 'Cash' | 'Card'>('UPI');
  const [quickPayRef, setQuickPayRef] = useState('UPI/20261102/DPKRAJ');
  const [quickPayNotes, setQuickPayNotes] = useState('Balance clearance payment');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [taxTypeFilter, setTaxTypeFilter] = useState<'all' | 'b2b' | 'b2c'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'hasDue' | 'zeroDue'>('all');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    altPhone: '',
    address: '',
    gstin: '',
    state: 'Delhi (07)',
    notes: '',
  });

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesState = stateFilter === 'all' || c.state === stateFilter;
    const matchesTax = 
      taxTypeFilter === 'all' ? true :
      taxTypeFilter === 'b2b' ? Boolean(c.gstin) :
      !c.gstin;
    const matchesBalance = 
      balanceFilter === 'all' ? true :
      balanceFilter === 'hasDue' ? c.pendingBalance > 0 :
      c.pendingBalance === 0;

    return matchesSearch && matchesState && matchesTax && matchesBalance;
  });

  const isCustFilterActive = 
    searchQuery !== '' || 
    stateFilter !== 'all' || 
    taxTypeFilter !== 'all' || 
    balanceFilter !== 'all';

  const handleResetCustFilters = () => {
    setSearchQuery('');
    setStateFilter('all');
    setTaxTypeFilter('all');
    setBalanceFilter('all');
  };

  const handleOpenAdd = () => {
    setEditingCust(null);
    setFormData({
      name: '',
      phone: '+91 ',
      altPhone: '',
      address: '',
      gstin: '',
      state: 'Delhi (07)',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCust(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      altPhone: c.altPhone || '',
      address: c.address,
      gstin: c.gstin || '',
      state: c.state,
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCust) {
      updateCustomer(editingCust.id, formData, 'Updated customer contact & tax profile');
    } else {
      addCustomer(formData);
    }
    setIsModalOpen(false);
    setEditingCust(null);
  };

    const handleConfirmDelete = () => {
    if (!deleteTargetCustomer) return;
    deleteCustomer(deleteTargetCustomer.id);
    if (selectedCustomer?.id === deleteTargetCustomer.id) {
      setSelectedCustomer(null);
    }
    setDeleteTargetCustomer(null);
  };

  const handleQuickPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    addPayment({
      date: '2026-11-02',
      amount: Number(quickPayAmount),
      type: 'credit',
      mode: quickPayMode,
      referenceUtr: quickPayRef,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      category: 'Charter Balance',
      linkedId: '',
      linkedType: 'charter',
      notes: quickPayNotes,
    });
    setQuickPayOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'State', 'GSTIN', 'Total Bookings', 'Total Spent', 'Pending Balance'];
    const rows = filteredCustomers.map((c) => [
      c.name,
      c.phone,
      c.state,
      c.gstin || 'B2C (Consumer)',
      c.totalBookings,
      c.totalSpent,
      c.pendingBalance,
    ]);
    exportToCSV('Customers_Ledger_Report', headers, rows);
    showToast({ type: 'success', title: 'Customers Ledger CSV Exported' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Customer Directory & Ledgers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              {filteredCustomers.length} Parties
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track B2B event organizers, schools, government bodies and retail party ledgers with pending dues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Ledger</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
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
              placeholder="Search customer name, phone, GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isCustFilterActive && (
              <button
                onClick={handleResetCustFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors border border-rose-200"
                title="Reset customer filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <div className="text-[11px] text-slate-500 font-medium">
              Showing <strong className="text-slate-900 font-bold">{filteredCustomers.length}</strong> of {customers.length} accounts
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-500" />
            Filters:
          </span>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All States & Territories</option>
            {INDIAN_STATES.slice(0, 6).map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <select
            value={taxTypeFilter}
            onChange={(e) => setTaxTypeFilter(e.target.value as any)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Customer Types</option>
            <option value="b2b">B2B Commercial (GSTIN Registered)</option>
            <option value="b2c">B2C Retail (Individual Consumers)</option>
          </select>

          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value as any)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Ledger Balances</option>
            <option value="hasDue">Pending Payment Dues (Highlighted in Red)</option>
            <option value="zeroDue">Settled Accounts (₹0 Balance)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Customer Name & Notes</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">State & GSTIN</th>
                <th className="p-3.5 text-center">Bookings</th>
                <th className="p-3.5 text-right">Lifetime Business</th>
                <th className="p-3.5 text-right">Ledger Balance</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 align-top">
                    <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                    {c.notes && (
                      <div className="text-[11px] text-slate-500 italic mt-0.5 max-w-xs line-clamp-1">
                        "{c.notes}"
                      </div>
                    )}
                  </td>

                  <td className="p-3.5 align-top">
                    <div className="text-slate-800 font-mono font-medium">{c.phone}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{c.address}</div>
                  </td>

                  <td className="p-3.5 align-top">
                    <div className="text-slate-800 font-semibold">{c.state}</div>
                    {c.gstin ? (
                      <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200">
                        {c.gstin}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">B2C Party</span>
                    )}
                  </td>

                  <td className="p-3.5 align-top text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                      {c.totalBookings}
                    </span>
                  </td>

                  <td className="p-3.5 align-top text-right font-mono font-semibold text-slate-900">
                    {formatINR(c.totalSpent)}
                  </td>

                  {/* Ledger Balance (Pending in RED) */}
                  <td className="p-3.5 align-top text-right">
                    {c.pendingBalance > 0 ? (
                      <div>
                        <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
                          {formatINR(c.pendingBalance)}
                        </span>
                        <div className="text-[10px] text-rose-500 font-bold uppercase mt-1">
                          Payment Due
                        </div>
                      </div>
                    ) : (
                      <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                        Settled (₹0)
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 align-top text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="View Ledger Statement"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openHistory('Customer', c.id, c.name)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Change Audit"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-slate-600 hover:text-amber-700"
                        title="Edit Customer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Statement / Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-lg w-full h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500">Party Ledger & Booking History</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile specs */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 mb-4">
              <p>Phone: <strong>{selectedCustomer.phone}</strong></p>
              <p>Address: <strong>{selectedCustomer.address}</strong></p>
              <p>State: <strong>{selectedCustomer.state}</strong></p>
              {selectedCustomer.gstin && <p>GSTIN: <strong className="font-mono">{selectedCustomer.gstin}</strong></p>}
            </div>

            {/* Ledger Balances */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Lifetime Volume</span>
                <span className="text-lg font-bold font-mono text-emerald-900">{formatINR(selectedCustomer.totalSpent)}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Outstanding Balance</span>
                <span className="text-lg font-bold font-mono text-rose-600">{formatINR(selectedCustomer.pendingBalance)}</span>
              </div>
            </div>

            {/* Past Bookings for this customer */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Charter Reservation History
            </h4>
            <div className="space-y-2 mb-6">
              {charterBookings
                .filter((b) => b.customerId === selectedCustomer.id || b.customerName.includes(selectedCustomer.name.split(' ')[0]))
                .map((b) => (
                  <div key={b.id} className="p-3 rounded-xl border border-slate-200 text-xs hover:border-amber-400 transition-colors">
                    <div className="flex justify-between font-bold">
                      <span className="font-mono">{b.bookingNumber}</span>
                      <span className="font-mono text-slate-900">{formatINR(b.quote.grandTotal)}</span>
                    </div>
                    <div className="text-slate-600 mt-1">
                      {b.bookingType} • {b.pickup} → {b.drop}
                    </div>
                    <div className="flex justify-between text-[11px] mt-1 pt-1 border-t border-slate-100">
                      <span className="text-slate-400">{formatDate(b.pickupDateTime)}</span>
                      <span className={b.balanceDue > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {b.balanceDue > 0 ? `Pending: ${formatINR(b.balanceDue)}` : 'Cleared'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="mt-auto w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close Ledger
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingCust ? 'Edit Customer Details' : 'Add New Customer Party'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Customer / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Verma Tent House"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98111 22334"
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">State (for GST CGST vs IGST) *</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">GSTIN (Optional for B2B Invoices)</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="e.g. 07AAACV4910K1Z2"
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Billing Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="City, Area"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Party Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Regular charter client for wedding seasons"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

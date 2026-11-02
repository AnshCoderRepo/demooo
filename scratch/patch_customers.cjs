const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/Customers.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
content = content.replace(
  /Clock, ArrowRight, Eye, History, X, CheckCircle, AlertCircle, Filter, RotateCcw\s*\} from 'lucide-react';/,
  `Clock, ArrowRight, Eye, History, X, CheckCircle, AlertCircle, Filter, RotateCcw,
  Trash2, CreditCard, ArrowDownLeft, Receipt
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';`
);

// 2. Add deleteCustomer, addPayment to useApp
content = content.replace(
  /addCustomer,\s*updateCustomer,\s*openHistory,\s*showToast\s*\} = useApp\(\);/,
  `addCustomer, 
    updateCustomer, 
    deleteCustomer,
    addPayment,
    openHistory, 
    showToast 
  } = useApp();`
);

// 3. Add states for delete customer & quick payment
const stateSnippet = `  // Delete Customer state
  const [deleteTargetCustomer, setDeleteTargetCustomer] = useState<Customer | null>(null);

  // Quick Payment modal state from Customer Ledger
  const [quickPayOpen, setQuickPayOpen] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState(15000);
  const [quickPayMode, setQuickPayMode] = useState<'UPI' | 'Bank' | 'Cash' | 'Card'>('UPI');
  const [quickPayRef, setQuickPayRef] = useState('UPI/20261102/DPKRAJ');
  const [quickPayNotes, setQuickPayNotes] = useState('Balance clearance payment');`;

content = content.replace(
  /const \[editingCust, setEditingCust\] = useState<Customer \| null>\(null\);/,
  `const [editingCust, setEditingCust] = useState<Customer | null>(null);\n${stateSnippet}`
);

// 4. Add handlers for quick payment and delete
const handlersSnippet = `  const handleConfirmDelete = () => {
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
  };`;

content = content.replace(
  /const handleExportCSV = \(\) => \{/,
  `${handlersSnippet}\n\n  const handleExportCSV = () => {`
);

// 5. Add Delete button to customer row actions
const rowButtonsTarget = `<button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-slate-600 hover:text-amber-700"
                        title="Edit Customer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>`;

content = content.replace(
  rowButtonsTarget,
  `<button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-slate-600 hover:text-amber-700"
                        title="Edit Customer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetCustomer(c)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>`
);

// 6. Add "Record Payment" button inside the customer drawer
const drawerBalanceTarget = `<div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Outstanding Balance</span>
                <span className="text-lg font-bold font-mono text-rose-600">{formatINR(selectedCustomer.pendingBalance)}</span>
              </div>
            </div>`;

content = content.replace(
  drawerBalanceTarget,
  `<div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Outstanding Balance</span>
                  <span className="text-lg font-bold font-mono text-rose-600">{formatINR(selectedCustomer.pendingBalance)}</span>
                </div>
                {selectedCustomer.pendingBalance > 0 && (
                  <button
                    onClick={() => {
                      setQuickPayAmount(selectedCustomer.pendingBalance);
                      setQuickPayOpen(true);
                    }}
                    className="mt-2 w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm"
                  >
                    <ArrowDownLeft className="w-3 h-3" />
                    <span>+ Receive Payment</span>
                  </button>
                )}
              </div>
            </div>`
);

// 7. Add Payments History list in drawer as well
const drawerBookingsTarget = `{/* Past Bookings for this customer */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Charter Reservation History
            </h4>`;

content = content.replace(
  drawerBookingsTarget,
  `{/* Payment Receipts History */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
              <span>Receipts & Payments Log</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {payments.filter(p => p.customerId === selectedCustomer.id || p.customerName.includes(selectedCustomer.name.split(' ')[0])).length} Vouchers
              </span>
            </h4>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {payments
                .filter((p) => p.customerId === selectedCustomer.id || p.customerName.includes(selectedCustomer.name.split(' ')[0]))
                .map((p) => (
                  <div key={p.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-slate-900">{p.receiptNumber}</div>
                      <div className="text-[10px] text-slate-500">{formatDate(p.date)} • {p.mode} ({p.referenceUtr})</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-700">+{formatINR(p.amount)}</div>
                      <span className="text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">Cleared</span>
                    </div>
                  </div>
                ))}
              {payments.filter(p => p.customerId === selectedCustomer.id || p.customerName.includes(selectedCustomer.name.split(' ')[0])).length === 0 && (
                <p className="text-[11px] text-slate-400 italic py-1">No payment transactions recorded yet.</p>
              )}
            </div>

            {/* Past Bookings for this customer */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Charter Reservation History
            </h4>`
);

// 8. Add Modals before closing tag
const modalsSnippet = `
      {/* Delete Confirmation Modal */}
      {deleteTargetCustomer && (
        <WarningModal
          isOpen={Boolean(deleteTargetCustomer)}
          type="delete_confirmation"
          title="Delete Customer Account"
          message={\`Are you sure you want to remove \${deleteTargetCustomer.name}? Their past booking logs and receipts will remain in the financial ledger, but they will be removed from the active party list.\`}
          confirmLabel="Delete Customer"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTargetCustomer(null)}
        />
      )}

      {/* Quick Payment Modal */}
      {quickPayOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Party Payment</h3>
                <p className="text-xs text-slate-500">{selectedCustomer.name}</p>
              </div>
              <button onClick={() => setQuickPayOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Amount to Receive (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedCustomer.pendingBalance || 999999}
                  value={quickPayAmount}
                  onChange={(e) => setQuickPayAmount(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-emerald-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Payment Mode</label>
                <select
                  value={quickPayMode}
                  onChange={(e) => setQuickPayMode(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Bank">Bank NEFT / RTGS / IMPS</option>
                  <option value="Cash">Cash at Booking Office</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Bank Reference / UTR Number</label>
                <input
                  type="text"
                  required
                  value={quickPayRef}
                  onChange={(e) => setQuickPayRef(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Remarks</label>
                <input
                  type="text"
                  value={quickPayNotes}
                  onChange={(e) => setQuickPayNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setQuickPayOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                >
                  Clear Dues & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

content = content.replace(/<\/div>\s*;\s*\}\s*;\s*$/, `${modalsSnippet}\n    </div>\n  );\n};\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched Customers.tsx!');


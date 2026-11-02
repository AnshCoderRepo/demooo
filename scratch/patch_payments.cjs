const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/PaymentsLedger.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
content = content.replace(
  "import { \r\n  CreditCard, Plus, Search, Filter, Download, ArrowUpRight, \r\n  ArrowDownLeft, Printer, CheckCircle2, History, X, User, RotateCcw, Calendar \r\n} from 'lucide-react';",
  `import { 
  CreditCard, Plus, Search, Filter, Download, ArrowUpRight, 
  ArrowDownLeft, Printer, CheckCircle2, History, X, User, RotateCcw, Calendar,
  Edit, Trash2, AlertTriangle
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';`
);

// If CRLF didn't match:
if (!content.includes('WarningModal')) {
  content = content.replace(
    /import \{[^}]+RotateCcw, Calendar\s*\} from 'lucide-react';/,
    `import { 
  CreditCard, Plus, Search, Filter, Download, ArrowUpRight, 
  ArrowDownLeft, Printer, CheckCircle2, History, X, User, RotateCcw, Calendar,
  Edit, Trash2, AlertTriangle
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';`
  );
}

// 2. Add methods from useApp
content = content.replace(
  /addPayment,\s*openHistory,\s*showToast\s*\} = useApp\(\);/,
  `addPayment,
    updatePayment,
    deletePayment,
    openHistory, 
    showToast 
  } = useApp();`
);

// 3. Add states
const stateSnippet = `  // Edit & Warning Modal states
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingEditPayment, setPendingEditPayment] = useState<PaymentRecord | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalPayment, setDeleteModalPayment] = useState<PaymentRecord | null>(null);

  const [editFormData, setEditFormData] = useState({
    amount: 0,
    mode: 'UPI' as PaymentRecord['mode'],
    referenceUtr: '',
    category: 'Charter Advance' as PaymentRecord['category'],
    notes: '',
    auditReason: 'Adjustment of payment mode / reference',
  });`;

content = content.replace(
  /const \[previewReceipt, setPreviewReceipt\] = useState<PaymentRecord \| null>\(null\);/,
  `const [previewReceipt, setPreviewReceipt] = useState<PaymentRecord | null>(null);\n\n${stateSnippet}`
);

// 4. Update filteredPayments logic to wire up dateFilter & categoryFilter
content = content.replace(
  /const matchesMode = modeFilter === 'all' \|\| p\.mode === modeFilter;\s*return matchesSearch && matchesType && matchesMode;\s*\}\);/,
  `const matchesMode = modeFilter === 'all' || p.mode === modeFilter;
    const matchesDate = isDateInFilter(p.date, dateFilter, customStart, customEnd);
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesType && matchesMode && matchesDate && matchesCategory;
  });`
);

// 5. Add handlers for edit & delete
const handlersSnippet = `  const handleEditClick = (pay: PaymentRecord) => {
    setPendingEditPayment(pay);
    setEditFormData({
      amount: pay.amount,
      mode: pay.mode,
      referenceUtr: pay.referenceUtr,
      category: pay.category,
      notes: pay.notes || '',
      auditReason: 'Corrected voucher details',
    });
    setWarningModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEditPayment) return;
    updatePayment(pendingEditPayment.id, {
      amount: Number(editFormData.amount),
      mode: editFormData.mode,
      referenceUtr: editFormData.referenceUtr,
      category: editFormData.category,
      notes: editFormData.notes,
    }, editFormData.auditReason);
    setEditModalOpen(false);
    setPendingEditPayment(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalPayment) return;
    deletePayment(deleteModalPayment.id);
    setDeleteModalPayment(null);
  };`;

content = content.replace(
  /const handleExportCSV = \(\) => \{/,
  `${handlersSnippet}\n\n  const handleExportCSV = () => {`
);

// 6. Add Edit & Delete buttons to the table row actions
const rowButtonsTarget = `<button
                        onClick={() => openHistory('Payment', p.id, \`\${p.receiptNumber} (\${p.customerName})\`)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Audit History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>`;

content = content.replace(
  rowButtonsTarget,
  `<button
                        onClick={() => openHistory('Payment', p.id, \`\${p.receiptNumber} (\${p.customerName})\`)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Audit History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditClick(p)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-slate-600 hover:text-amber-700"
                        title="Edit Payment (Warning modal)"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteModalPayment(p)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>`
);

// 7. Append Modals before closing tag
const modalsSnippet = `
      {/* Warning Modal when editing financial payment */}
      {warningModalOpen && (
        <WarningModal
          isOpen={warningModalOpen}
          type="confirmed_record"
          title="Security Check: Edit Financial Payment"
          message="This is a recorded payment voucher. Editing financial transactions will alter cashbook balances and leave an immutable entry in the Change History audit ledger."
          confirmLabel="Proceed to Edit"
          cancelLabel="Cancel"
          onConfirm={() => {
            setWarningModalOpen(false);
            setEditModalOpen(true);
          }}
          onClose={() => {
            setWarningModalOpen(false);
            setPendingEditPayment(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalPayment && (
        <WarningModal
          isOpen={Boolean(deleteModalPayment)}
          type="delete_confirmation"
          title="Delete Payment Record"
          message={\`Are you sure you want to permanently delete Receipt #\${deleteModalPayment.receiptNumber} of ₹\${deleteModalPayment.amount.toLocaleString('en-IN')} (\${deleteModalPayment.customerName})? This action cannot be undone.\`}
          confirmLabel="Delete Payment"
          cancelLabel="Keep Record"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModalPayment(null)}
        />
      )}

      {/* Edit Payment Modal */}
      {editModalOpen && pendingEditPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Voucher • {pendingEditPayment.receiptNumber}
                </h3>
                <p className="text-xs text-slate-500">{pendingEditPayment.customerName}</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Payment Mode</label>
                  <select
                    value={editFormData.mode}
                    onChange={(e) => setEditFormData({ ...editFormData, mode: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank (NEFT/RTGS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Reference / UTR / Cheque Number</label>
                <input
                  type="text"
                  required
                  value={editFormData.referenceUtr}
                  onChange={(e) => setEditFormData({ ...editFormData, referenceUtr: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Payment Category</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as any })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Charter Advance">Charter Advance</option>
                  <option value="Charter Balance">Charter Balance</option>
                  <option value="Route Ticket">Route Ticket Sale</option>
                  <option value="Expense Payment">Fleet Operating Payment</option>
                  <option value="Salary Disbursed">Salary Disbursed</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Reason for Modification (Audit Trail Log) *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.auditReason}
                  onChange={(e) => setEditFormData({ ...editFormData, auditReason: e.target.value })}
                  placeholder="e.g. Bank UTR number corrected"
                  className="w-full p-2 rounded-lg border border-amber-300 bg-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

content = content.replace(/<\/div>\s*;\s*\}\s*;\s*$/, `${modalsSnippet}\n    </div>\n  );\n};\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched PaymentsLedger.tsx!');


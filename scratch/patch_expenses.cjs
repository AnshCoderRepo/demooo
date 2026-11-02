const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/Expenses.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add icons & WarningModal import
content = content.replace(
  /TrendingDown, FileImage, History, Eye, X, CheckCircle, RotateCcw, Calendar\s*\} from 'lucide-react';/,
  `TrendingDown, FileImage, History, Eye, X, CheckCircle, RotateCcw, Calendar,
  Edit, Trash2, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';`
);

// 2. Add updateExpense, deleteExpense from useApp
content = content.replace(
  /addExpense,\s*openHistory,\s*showToast\s*\} = useApp\(\);/,
  `addExpense,
    updateExpense,
    deleteExpense,
    openHistory, 
    showToast 
  } = useApp();`
);

// 3. Add states for edit & delete
const stateSnippet = `  // Edit & Delete modal states
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteModalExpense, setDeleteModalExpense] = useState<Expense | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: TODAY_STR,
    category: 'Diesel' as ExpenseCategory,
    amount: 0,
    busId: 'bus-1',
    busNumber: 'DL 01 AB 4090',
    tripTitle: '',
    paidBy: '',
    billPhotoUrl: '',
    gstPaid: 0,
    notes: '',
    auditReason: 'Adjusted bill amount and GST ITC',
  });`;

content = content.replace(
  /const \[previewBillUrl, setPreviewBillUrl\] = useState<string \| null>\(null\);/,
  `const [previewBillUrl, setPreviewBillUrl] = useState<string | null>(null);\n\n${stateSnippet}`
);

// 4. Fix filteredExpenses logic
content = content.replace(
  /const matchesBus = busFilter === 'all' \|\| e\.busId === busFilter;\s*return matchesSearch && matchesCat && matchesBus;\s*\}\);/,
  `const matchesBus = busFilter === 'all' || e.busId === busFilter;
    const matchesDate = isDateInFilter(e.date, dateFilter, customStart, customEnd);
    const matchesPaidBy = paidByFilter === 'all' || e.paidBy === paidByFilter;
    return matchesSearch && matchesCat && matchesBus && matchesDate && matchesPaidBy;
  });`
);

// 5. Add handlers for edit & delete
const handlersSnippet = `  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setEditFormData({
      date: exp.date,
      category: exp.category,
      amount: exp.amount,
      busId: exp.busId || 'bus-1',
      busNumber: exp.busNumber || 'Office Fleet',
      tripTitle: exp.tripTitle || '',
      paidBy: exp.paidBy,
      billPhotoUrl: exp.billPhotoUrl || '',
      gstPaid: exp.gstPaid || 0,
      notes: exp.notes || '',
      auditReason: 'Updated invoice / maintenance specs',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const selBus = buses.find((b) => b.id === editFormData.busId);
    updateExpense(editingExpense.id, {
      date: editFormData.date,
      category: editFormData.category,
      amount: Number(editFormData.amount),
      busId: selBus?.id,
      busNumber: selBus?.plateNumber,
      tripTitle: editFormData.tripTitle,
      paidBy: editFormData.paidBy,
      billPhotoUrl: editFormData.billPhotoUrl,
      gstPaid: Number(editFormData.gstPaid),
      notes: editFormData.notes,
    }, editFormData.auditReason);
    setEditingExpense(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalExpense) return;
    deleteExpense(deleteModalExpense.id);
    setDeleteModalExpense(null);
  };`;

content = content.replace(
  /const handleExportCSV = \(\) => \{/,
  `${handlersSnippet}\n\n  const handleExportCSV = () => {`
);

// 6. Add Edit & Delete buttons to the table row
const rowButtonsTarget = `<button
                          onClick={() => openHistory('Expense', exp.id, \`\${exp.category} (₹\${exp.amount})\`)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Audit Trail"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>`;

content = content.replace(
  rowButtonsTarget,
  `<div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openHistory('Expense', exp.id, \`\${exp.category} (₹\${exp.amount})\`)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                            title="Audit Trail"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-slate-600 hover:text-amber-700"
                            title="Edit Expense"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModalExpense(exp)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>`
);

// 7. Append Modals
const modalsSnippet = `
      {/* Delete Confirmation Modal */}
      {deleteModalExpense && (
        <WarningModal
          isOpen={Boolean(deleteModalExpense)}
          type="delete_confirmation"
          title="Delete Fleet Expense Record"
          message={\`Are you sure you want to permanently delete the \${deleteModalExpense.category} expense of ₹\${deleteModalExpense.amount.toLocaleString('en-IN')} (\${deleteModalExpense.busNumber || 'Fleet'})? This will recompute P&L margins and GST input tax credit.\`}
          confirmLabel="Delete Expense"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModalExpense(null)}
        />
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Expense Record • {editingExpense.category}
                </h3>
                <p className="text-xs text-slate-500">{editingExpense.busNumber || 'Fleet'}</p>
              </div>
              <button onClick={() => setEditingExpense(null)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Toll">Toll Tax</option>
                    <option value="Maintenance">Maintenance & Spares</option>
                    <option value="Tyres">Tyres</option>
                    <option value="Driver Salary">Driver Allowance / Food</option>
                    <option value="Permit Fees">State Border Tax / Permit</option>
                    <option value="Challan/Fine">Traffic Challan / Fine</option>
                    <option value="Office">Office & Admin</option>
                    <option value="Insurance">Insurance Renewal</option>
                    <option value="Salary">Salary Payout</option>
                  </select>
                </div>
              </div>

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
                  <label className="block text-slate-600 mb-1">GST Paid (Input Tax Credit)</label>
                  <input
                    type="number"
                    min={0}
                    value={editFormData.gstPaid}
                    onChange={(e) => setEditFormData({ ...editFormData, gstPaid: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Fleet Bus</label>
                  <select
                    value={editFormData.busId}
                    onChange={(e) => setEditFormData({ ...editFormData, busId: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                  >
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>{b.plateNumber} ({b.model})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Paid By (Driver / Manager)</label>
                  <input
                    type="text"
                    required
                    value={editFormData.paidBy}
                    onChange={(e) => setEditFormData({ ...editFormData, paidBy: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Linked Charter Trip Title / Corridor</label>
                <input
                  type="text"
                  value={editFormData.tripTitle}
                  onChange={(e) => setEditFormData({ ...editFormData, tripTitle: e.target.value })}
                  placeholder="e.g. Delhi ↔ Muzaffarpur Route"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Remarks / Spares Description</label>
                <input
                  type="text"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Reason for Edit (Audit History) *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.auditReason}
                  onChange={(e) => setEditFormData({ ...editFormData, auditReason: e.target.value })}
                  className="w-full p-2 rounded-lg border border-amber-300 bg-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

content = content.replace(/<\/div>\s*;\s*\}\s*;\s*$/, `${modalsSnippet}\n    </div>\n  );\n};\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched Expenses.tsx!');


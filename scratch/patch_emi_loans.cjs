const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/EmiLoans.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Trash2 icon and WarningModal import
content = content.replace(
  /Edit, Calendar, ArrowRight, ShieldCheck, FileText, DollarSign\s*\} from 'lucide-react';/,
  `Edit, Calendar, ArrowRight, ShieldCheck, FileText, DollarSign, Trash2
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';`
);

// 2. Add deleteLoanEmi from useApp
content = content.replace(
  /markEmiPaid,\s*updateLoanEmi,\s*addLoanEmi,\s*openHistory,\s*showToast\s*\} = useApp\(\);/,
  `markEmiPaid, 
    updateLoanEmi, 
    addLoanEmi, 
    deleteLoanEmi,
    openHistory, 
    showToast 
  } = useApp();`
);

// 3. Add busFilter state & deleteModalEmi state
content = content.replace(
  /const \[urgencyFilter, setUrgencyFilter\] = useState\('all'\);/,
  `const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');
  const [deleteModalEmi, setDeleteModalEmi] = useState<LoanEMI | null>(null);`
);

// 4. Update filteredEmis to check busFilter
content = content.replace(
  /const matchesUrgency = \s*urgencyFilter === 'all' \? true :\s*urgencyFilter === 'dueSoon' \? \(e\.status === 'active' && e\.dueDayOfMonth <= 7\) :\s*\(e\.status === 'active' && e\.dueDayOfMonth > 7\);\s*return matchesSearch && matchesFinancier && matchesStatus && matchesUrgency;\s*\}\);/,
  `const matchesUrgency = 
      urgencyFilter === 'all' ? true :
      urgencyFilter === 'dueSoon' ? (e.status === 'active' && e.dueDayOfMonth <= 7) :
      (e.status === 'active' && e.dueDayOfMonth > 7);
    const matchesBus = busFilter === 'all' || e.busNumber === busFilter || e.busId === busFilter;
    return matchesSearch && matchesFinancier && matchesStatus && matchesUrgency && matchesBus;
  });`
);

// 5. Update isEmiFilterActive & handleResetEmiFilters
content = content.replace(
  /const isEmiFilterActive = \s*searchQuery !== '' \|\|\s*financierFilter !== 'all' \|\|\s*statusFilter !== 'all' \|\|\s*urgencyFilter !== 'all';/,
  `const isEmiFilterActive = 
    searchQuery !== '' || 
    financierFilter !== 'all' || 
    statusFilter !== 'all' || 
    urgencyFilter !== 'all' ||
    busFilter !== 'all';`
);

content = content.replace(
  /setUrgencyFilter\('all'\);\s*\}\s*;/m,
  `setUrgencyFilter('all');
    setBusFilter('all');
  };`
);

// 6. Fix handleExportCSV to export filteredEmis
content = content.replace(
  /const rows = emis\.map\(\(e\) => \[/,
  'const rows = filteredEmis.map((e) => ['
);

// 7. Add delete handler
const deleteHandler = `  const handleConfirmDelete = () => {
    if (!deleteModalEmi) return;
    deleteLoanEmi(deleteModalEmi.id);
    setDeleteModalEmi(null);
  };`;

content = content.replace(
  /const handleRecordAsset = \(e: React\.FormEvent\) => \{/,
  `${deleteHandler}\n\n  const handleRecordAsset = (e: React.FormEvent) => {`
);

// 8. Add bus filter dropdown into the filters UI
const filterUiTarget = `<select
            value={financierFilter}
            onChange={(e) => setFinancierFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium"
          >`;

const filterUiReplacement = `<select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium font-mono"
          >
            <option value="all">All Fleet Buses</option>
            {buses.map((b) => (
              <option key={b.id} value={b.plateNumber}>{b.plateNumber} ({b.model})</option>
            ))}
          </select>

          <select
            value={financierFilter}
            onChange={(e) => setFinancierFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium"
          >`;

content = content.replace(filterUiTarget, filterUiReplacement);

// 9. Add Delete button to each loan card
const cardButtonsTarget = `<button
                      onClick={() => handleOpenEdit(emi)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-amber-600 hover:text-amber-700"
                      title="Edit Loan Terms"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>`;

const cardButtonsReplacement = `<button
                      onClick={() => handleOpenEdit(emi)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-amber-600 hover:text-amber-700"
                      title="Edit Loan Terms"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteModalEmi(emi)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                      title="Delete Loan Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>`;

content = content.replace(cardButtonsTarget, cardButtonsReplacement);

// 10. Append Delete Modal before closing
const modalSnippet = `
      {/* Delete Loan Confirmation Modal */}
      {deleteModalEmi && (
        <WarningModal
          isOpen={Boolean(deleteModalEmi)}
          type="delete_confirmation"
          title="Delete Vehicle Loan Hypothecation"
          message={\`Are you sure you want to permanently delete the loan record for \${deleteModalEmi.busNumber} with \${deleteModalEmi.financeCompany} (₹\${deleteModalEmi.emiAmount.toLocaleString('en-IN')}/month)? This will remove it from monthly EMI projections.\`}
          confirmLabel="Delete Loan"
          cancelLabel="Keep Record"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModalEmi(null)}
        />
      )}
`;

content = content.replace(/<\/div>\s*;\s*\}\s*;\s*$/, `${modalSnippet}\n    </div>\n  );\n};\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched EmiLoans.tsx!');


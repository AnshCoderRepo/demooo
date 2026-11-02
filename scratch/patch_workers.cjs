const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/WorkersSalary.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Trash2 icon and WarningModal
content = content.replace(
  /Edit, ShieldCheck\s*\} from 'lucide-react';/,
  `Edit, ShieldCheck, Trash2
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';`
);

// 2. Add deleteWorker to useApp
content = content.replace(
  /updateWorker,\s*updateAttendance,/m,
  `updateWorker,
    deleteWorker,
    updateAttendance,`
);

// 3. Add deleteModalWorker state
content = content.replace(
  /const \[editingWorker, setEditingWorker\] = useState<Worker \| null>\(null\);/,
  `const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deleteModalWorker, setDeleteModalWorker] = useState<Worker | null>(null);`
);

// 4. Add delete handler
const deleteHandler = `  const handleConfirmDelete = () => {
    if (!deleteModalWorker) return;
    deleteWorker(deleteModalWorker.id);
    setDeleteModalWorker(null);
  };`;

content = content.replace(
  /const handleOpenEdit = \(w: Worker\) => \{/,
  `${deleteHandler}\n\n  const handleOpenEdit = (w: Worker) => {`
);

// 5. Add Delete button in Workers tab row actions
const rowButtonsTarget = `<button
                        onClick={() => handleOpenEdit(w)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Edit Worker Profile"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>`;

const rowButtonsReplacement = `<button
                        onClick={() => handleOpenEdit(w)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Edit Worker Profile"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteModalWorker(w)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                        title="Delete Worker Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>`;

content = content.replace(rowButtonsTarget, rowButtonsReplacement);

// 6. Append Delete Modal before closing
const modalSnippet = `
      {/* Delete Worker Confirmation Modal */}
      {deleteModalWorker && (
        <WarningModal
          isOpen={Boolean(deleteModalWorker)}
          type="delete_confirmation"
          title="Remove Crew Member Record"
          message={\`Are you sure you want to remove \${deleteModalWorker.name} (\${deleteModalWorker.type.toUpperCase()}) from the staff registry? Past salary payouts and attendance records will remain in historical logs.\`}
          confirmLabel="Remove Crew Member"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModalWorker(null)}
        />
      )}
`;

content = content.replace(/<\/div>\s*;\s*\}\s*;\s*$/, `${modalSnippet}\n    </div>\n  );\n};\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched WorkersSalary.tsx!');


const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/Fleet.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Trash2 icon and WarningModal
content = content.replace(
  /CheckCircle2, Clock, Wrench, AlertTriangle, Eye, History, X, Filter, RotateCcw\s*\} from 'lucide-react';/,
  `CheckCircle2, Clock, Wrench, AlertTriangle, Eye, History, X, Filter, RotateCcw, Trash2
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';`
);

// 2. Add deleteBus from useApp
content = content.replace(
  /const \{ buses, updateBus, openHistory, showToast \} = useApp\(\);/,
  'const { buses, updateBus, deleteBus, openHistory, showToast } = useApp();'
);

// 3. Add deleteModalBus state
content = content.replace(
  /const \[isEditModalOpen, setIsEditModalOpen\] = useState\(false\);/,
  `const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteModalBus, setDeleteModalBus] = useState<Bus | null>(null);`
);

// 4. Fix filteredBuses logic to check busTypeFilter and complianceFilter
content = content.replace(
  /const matchesStatus = statusFilter === 'all' \|\| b\.status === statusFilter;\s*return matchesSearch && matchesStatus;\s*\}\);/,
  `const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesType = busTypeFilter === 'all' || b.type === busTypeFilter;
    const matchesCompliance = 
      complianceFilter === 'all' ? true :
      complianceFilter === 'expired' ? b.documents.some((d) => d.status === 'expired') :
      complianceFilter === 'expiring' ? b.documents.some((d) => d.status === 'expiring') :
      b.documents.every((d) => d.status === 'valid');
    return matchesSearch && matchesStatus && matchesType && matchesCompliance;
  });`
);

// 5. Add delete handler
const deleteHandler = `  const handleConfirmDelete = () => {
    if (!deleteModalBus) return;
    deleteBus(deleteModalBus.id);
    if (selectedBus?.id === deleteModalBus.id) {
      setSelectedBus(null);
    }
    setDeleteModalBus(null);
  };`;

content = content.replace(
  /const handleOpenEdit = \(bus: Bus\) => \{/,
  `${deleteHandler}\n\n  const handleOpenEdit = (bus: Bus) => {`
);

// 6. Add Delete button on each bus card
const cardButtonsTarget = `<button
                    onClick={() => handleOpenEdit(bus)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="Edit Bus"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>`;

const cardButtonsReplacement = `<button
                    onClick={() => handleOpenEdit(bus)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="Edit Bus"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteModalBus(bus)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                    title="Decommission / Delete Bus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>`;

content = content.replace(cardButtonsTarget, cardButtonsReplacement);

// 7. Append Delete Modal before closing
const modalSnippet = `
      {/* Delete Bus Confirmation Modal */}
      {deleteModalBus && (
        <WarningModal
          isOpen={Boolean(deleteModalBus)}
          type="delete_confirmation"
          title="Decommission Coach from Fleet"
          message={\`Are you sure you want to remove \${deleteModalBus.plateNumber} (\${deleteModalBus.model}) from the active fleet directory? All linked past expense logs and ticket manifests will remain in historical ledgers.\`}
          confirmLabel="Remove Bus"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModalBus(null)}
        />
      )}
`;

content = content.replace(/<\/div>\s*;\s*\}\s*;\s*$/, `${modalSnippet}\n    </div>\n  );\n};\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched Fleet.tsx!');


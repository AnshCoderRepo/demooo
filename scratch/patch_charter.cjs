const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/CharterBookings.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Trash2 icon
content = content.replace(
  /MessageSquare, User, Calendar, MapPin, X, Edit, Eye, History, RotateCcw\s*\} from 'lucide-react';/,
  `MessageSquare, User, Calendar, MapPin, X, Edit, Eye, History, RotateCcw, Trash2
} from 'lucide-react';`
);

// 2. Add deleteCharterBooking to useApp
content = content.replace(
  /cancelCharterBooking,\s*openHistory,\s*sendMockSms,\s*showToast\s*\} = useApp\(\);/,
  `cancelCharterBooking,
    deleteCharterBooking,
    openHistory, 
    sendMockSms, 
    showToast 
  } = useApp();`
);

// 3. Add deleteModalBooking state
content = content.replace(
  /const \[previewBooking, setPreviewBooking\] = useState<CharterBooking \| null>\(null\);/,
  `const [previewBooking, setPreviewBooking] = useState<CharterBooking | null>(null);
  const [deleteModalBooking, setDeleteModalBooking] = useState<CharterBooking | null>(null);`
);

// 4. Add delete handler
const deleteHandler = `  const handleConfirmDelete = () => {
    if (!deleteModalBooking) return;
    deleteCharterBooking(deleteModalBooking.id);
    setDeleteModalBooking(null);
  };`;

content = content.replace(
  /const handleResetFilters = \(\) => \{/,
  `${deleteHandler}\n\n  const handleResetFilters = () => {`
);

// 5. Add Delete button in table rows
const rowButtonsTarget = `<button
                        onClick={() => handleEditClick(b)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-slate-600 hover:text-amber-700"
                        title="Edit Booking"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>`;

const rowButtonsReplacement = `<button
                        onClick={() => handleEditClick(b)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-slate-600 hover:text-amber-700"
                        title="Edit Booking"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteModalBooking(b)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                        title="Delete Booking Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>`;

content = content.replace(rowButtonsTarget, rowButtonsReplacement);

// 6. Append Delete Modal before closing
const modalSnippet = `
      {/* Delete Charter Booking Confirmation */}
      {deleteModalBooking && (
        <WarningModal
          isOpen={Boolean(deleteModalBooking)}
          type="delete_confirmation"
          title="Delete Charter Booking Record"
          message={\`Are you sure you want to permanently delete Charter Booking #\${deleteModalBooking.bookingNumber} (\${deleteModalBooking.customerName} - \${deleteModalBooking.bookingType})? To retain audit history without deleting, you can click Cancel Trip instead.\`}
          confirmLabel="Delete Booking"
          cancelLabel="Keep Record"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModalBooking(null)}
        />
      )}
`;

content = content.replace(/<\/div>\s*;\s*\}\s*;\s*$/, `${modalSnippet}\n    </div>\n  );\n};\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched CharterBookings.tsx!');


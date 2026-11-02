const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/Reminders.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Trash2 icon
content = content.replace(
  /Calendar, RotateCcw, Settings, Plus, X\s*\} from 'lucide-react';/,
  `Calendar, RotateCcw, Settings, Plus, X, Trash2
} from 'lucide-react';`
);

// 2. Add addReminder, deleteReminder, updateSettings to useApp
content = content.replace(
  /reminders,\s*snoozeReminder,\s*markReminderDone,\s*sendMockSms,\s*showToast\s*\} = useApp\(\);/,
  `reminders,
    addReminder,
    deleteReminder,
    snoozeReminder, 
    markReminderDone, 
    updateSettings,
    sendMockSms, 
    showToast 
  } = useApp();`
);

// 3. Connect handleSaveCustomReminder
content = content.replace(
  /const handleSaveCustomReminder = \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*showToast\(\{[^}]+\}\);\s*setAddReminderOpen\(false\);\s*\};/m,
  `const handleSaveCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    addReminder({
      type: newType,
      title: newTitle,
      description: newDesc,
      dueDate: newDueDate,
      status: 'pending',
      deliveryChannel: newChannel,
    });
    setAddReminderOpen(false);
  };`
);

// 4. Connect handleSaveSettings
content = content.replace(
  /const handleSaveSettings = \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*showToast\(\{[^}]+\}\);\s*setSettingsModalOpen\(false\);\s*\};/m,
  `const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ reminderDaysBefore: Number(ruleDocExpiryDays) });
    showToast({
      type: 'success',
      title: 'Reminder Rules Saved',
      message: \`Proactive alerts threshold saved: RTO Docs (\${ruleDocExpiryDays}d), EMI (\${ruleEmiDays}d), Trips (\${ruleTripDays}d), Salary (\${ruleSalaryDays}d).\`,
    });
    setSettingsModalOpen(false);
  };`
);

// 5. Add Delete button in reminder card actions
const cardActionTarget = `<button
                    onClick={() => markReminderDone(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>`;

const cardActionReplacement = `<button
                    onClick={() => markReminderDone(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                  <button
                    onClick={() => deleteReminder(r.id)}
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Dismiss / Delete Alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>`;

content = content.replace(cardActionTarget, cardActionReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched Reminders.tsx!');


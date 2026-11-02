const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/context/AppContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add addReminder to AppContextType interface
content = content.replace(
  /deleteReminder: \(remId: string\) => void;/,
  `addReminder: (reminder: Omit<Reminder, 'id'>) => Reminder;
  deleteReminder: (remId: string) => void;`
);

// 2. Add implementation for addReminder
const addReminderImpl = `  const addReminder = (remData: Omit<Reminder, 'id'>): Reminder => {
    const newRem: Reminder = {
      ...remData,
      id: \`rem-\${Date.now()}\`,
    };
    setData((prev: any) => ({
      ...prev,
      reminders: [newRem, ...prev.reminders],
    }));
    recordAudit('Reminder', newRem.id, newRem.title, 'Created', 'reminder', '', \`Due: \${newRem.dueDate}\`, newRem.description);
    showToast({ type: 'success', title: 'Reminder Scheduled', message: \`\${newRem.title} scheduled for \${newRem.dueDate}.\` });
    return newRem;
  };`;

content = content.replace(
  /const deleteReminder = \(remId: string\) => \{/,
  `${addReminderImpl}\n\n  const deleteReminder = (remId: string) => {`
);

// 3. Expose addReminder in Provider value
content = content.replace(
  /deleteReminder,\s*updateSmsTemplate,/m,
  `addReminder,
        deleteReminder,
        updateSmsTemplate,`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched AppContext with addReminder!');


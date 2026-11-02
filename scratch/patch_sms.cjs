const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/pages/SmsAlerts.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add exportToCSV to imports
content = content.replace(
  "import { formatDate } from '../utils/formatters';",
  "import { formatDate, exportToCSV } from '../utils/formatters';"
);

// 2. Add updateSmsTemplate to useApp
content = content.replace(
  /const \{ smsTemplates, smsLogs, sendMockSms, showToast \} = useApp\(\);/,
  'const { smsTemplates, smsLogs, updateSmsTemplate, sendMockSms, showToast } = useApp();'
);

// 3. Connect handleSaveTemplate to updateSmsTemplate
content = content.replace(
  /const handleSaveTemplate = \(\) => \{\s*showToast\(\{[^}]+\}\);\s*\};/m,
  `const handleSaveTemplate = () => {
    updateSmsTemplate(selectedTemplate.id, templateBody);
  };`
);

// 4. Add handleExportCSV
const csvHandler = `  const handleExportCSV = () => {
    const headers = ['Recipient Name', 'Phone', 'Template', 'Trigger Event', 'Message', 'Status', 'Sent At'];
    const rows = filteredSmsLogs.map((l) => [
      l.recipientName,
      l.recipientPhone,
      l.templateName,
      l.triggerEvent,
      l.message,
      l.status,
      l.sentAt,
    ]);
    exportToCSV('DLT_SMS_Delivery_Registry', headers, rows);
    showToast({ type: 'success', title: 'SMS Delivery Logs Exported' });
  };`;

content = content.replace(
  /const handleTestSend = \(\) => \{/,
  `${csvHandler}\n\n  const handleTestSend = () => {`
);

// 5. Add Export CSV button in Delivery Log tab header
const logHeaderTarget = `<div className="flex items-center gap-2 w-full sm:w-auto">
              {isSmsFilterActive && (
                <button
                  onClick={handleResetSmsFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors border border-rose-200"
                  title="Reset SMS filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
              <div className="text-[11px] text-slate-500 font-medium">
                Showing <strong className="text-slate-900 font-bold">{filteredSmsLogs.length}</strong> of {smsLogs.length} messages
              </div>
            </div>`;

const logHeaderReplacement = `<div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Log</span>
              </button>
              {isSmsFilterActive && (
                <button
                  onClick={handleResetSmsFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors border border-rose-200"
                  title="Reset SMS filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
              <div className="text-[11px] text-slate-500 font-medium">
                Showing <strong className="text-slate-900 font-bold">{filteredSmsLogs.length}</strong> of {smsLogs.length} messages
              </div>
            </div>`;

content = content.replace(logHeaderTarget, logHeaderReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched SmsAlerts.tsx!');


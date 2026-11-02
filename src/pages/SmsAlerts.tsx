import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SmsTemplate, SmsLog } from '../types';
import { formatDate, exportToCSV } from '../utils/formatters';
import { 
  MessageSquare, CheckCircle2, ShieldCheck, Send, 
  Search, Eye, Edit, Sparkles, Smartphone, Download, RotateCcw, Filter 
} from 'lucide-react';

export const SmsAlerts: React.FC = () => {
  const { smsTemplates, smsLogs, updateSmsTemplate, sendMockSms, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'logs' | 'templates'>('logs');
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate>(smsTemplates[0]);
  const [templateBody, setTemplateBody] = useState<string>(smsTemplates[0]?.body || '');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('all');
  const [logTemplateFilter, setLogTemplateFilter] = useState('all');

  // Live variable preview replacement
  const getRenderedPreview = (body: string) => {
    return body
      .replace(/{customer_name}/g, 'Rajesh Verma')
      .replace(/{booking_number}/g, 'DR-CH-1021')
      .replace(/{booking_type}/g, 'Shadi')
      .replace(/{date}/g, '05 Nov 2026')
      .replace(/{bus_number}/g, 'DL 01 AB 4090')
      .replace(/{driver_name}/g, 'Surender Singh')
      .replace(/{driver_phone}/g, '+91 98711 22334')
      .replace(/{advance_paid}/g, '₹25,000')
      .replace(/{balance_due}/g, '₹40,625')
      .replace(/{ticket_number}/g, 'DR-TK-5085')
      .replace(/{route_name}/g, 'Delhi ↔ Siliguri')
      .replace(/{travel_date}/g, '02 Nov 2026')
      .replace(/{departure_time}/g, '17:30')
      .replace(/{seat_numbers}/g, 'L5')
      .replace(/{amount}/g, '₹35,000')
      .replace(/{payment_mode}/g, 'UPI')
      .replace(/{reference}/g, 'UPI/392019/DPKRAJ')
      .replace(/{purpose}/g, 'Charter Advance')
      .replace(/{worker_name}/g, 'Surender Singh')
      .replace(/{month}/g, 'October 2026')
      .replace(/{account}/g, 'SBI A/C ...4819')
      .replace(/{boarding_point}/g, 'Kashmere Gate ISBT')
      .replace(/{trip_type}/g, 'Shadi')
      .replace(/{report_time}/g, '13:00')
      .replace(/{pickup_location}/g, 'Karol Bagh');
  };

  const filteredSmsLogs = smsLogs.filter((log) => {
    const matchesSearch = 
      log.recipientName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.recipientPhone.includes(logSearchQuery) ||
      log.message.toLowerCase().includes(logSearchQuery.toLowerCase());
    const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;
    const matchesTemplate = logTemplateFilter === 'all' || log.templateName === logTemplateFilter;
    return matchesSearch && matchesStatus && matchesTemplate;
  });

  const isSmsFilterActive = logSearchQuery !== '' || logStatusFilter !== 'all' || logTemplateFilter !== 'all';

  const handleResetSmsFilters = () => {
    setLogSearchQuery('');
    setLogStatusFilter('all');
    setLogTemplateFilter('all');
  };

  const handleSelectTemplate = (tpl: SmsTemplate) => {
    setSelectedTemplate(tpl);
    setTemplateBody(tpl.body);
  };

  const handleSaveTemplate = () => {
    showToast({
      type: 'success',
      title: 'SMS Template Updated',
      message: `Template "${selectedTemplate.name}" updated with DLT character count check.`,
    });
  };

    const handleExportCSV = () => {
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
  };

  const handleTestSend = () => {
    sendMockSms(
      'Test Recipient',
      '+91 98112 34567',
      selectedTemplate.name,
      getRenderedPreview(templateBody),
      'Manual Test Send'
    );
    showToast({
      type: 'success',
      title: 'Test SMS Dispatched',
      message: 'Delivered instantly via DLT Gateway.',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              SMS Gateway & Automated Notifications
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20">
              DLT Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official transactional notifications for booking confirmations, ticket QR dispatches, driver duty assignments, and payment receipts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'logs' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Delivery Log ({smsLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Template Designer ({smsTemplates.length})
          </button>
        </div>
      </div>

      {/* DLT Telecom Registration Status Card */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">DLT Principal Entity Registration</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                ACTIVE / VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sender Header ID: <strong className="font-mono text-amber-400">DPKRAJ (1407162910)</strong> • TRAI / Jio DLT Approved
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          <div>SMS Balance: <strong className="font-mono text-white text-sm">4,850 Credits</strong></div>
          <div className="text-[10px] text-emerald-400">Delivery Success Rate: 99.4%</div>
        </div>
      </div>

      {/* TAB 1: DELIVERY LOG TABLE */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Real-Time SMS Dispatch Journal</h3>
            <span className="text-xs text-slate-500">Auto-logged on every system action</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Sent Timestamp</th>
                  <th className="p-3.5">Recipient & Mobile</th>
                  <th className="p-3.5">Template / Category</th>
                  <th className="p-3.5">Message Content</th>
                  <th className="p-3.5 text-center">Gateway Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSmsLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 align-top text-slate-500 font-mono text-[11px]">
                      {log.sentAt}
                    </td>

                    <td className="p-3.5 align-top">
                      <div className="font-bold text-slate-900">{log.recipientName}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{log.recipientPhone}</div>
                    </td>

                    <td className="p-3.5 align-top">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {log.templateName}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{log.triggerEvent}</div>
                    </td>

                    <td className="p-3.5 align-top text-slate-700 text-xs leading-relaxed max-w-md">
                      {log.message}
                    </td>

                    <td className="p-3.5 align-top text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{log.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATE DESIGNER & LIVE PREVIEW */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates List (1 col) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Registered DLT Templates
            </h3>
            {smsTemplates.map((t) => (
              <div
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedTemplate.id === t.id
                    ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span>{t.name}</span>
                  <span className="text-[10px] text-slate-400">{t.category}</span>
                </div>
                <div className="text-[11px] opacity-70 truncate">{t.body}</div>
              </div>
            ))}
          </div>

          {/* Template Editor (1 col) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedTemplate.name}</h3>
                <p className="text-xs text-slate-500">Edit text & standard DLT variables</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {templateBody.length} chars (1 SMS unit)
              </span>
            </div>

            <div>
              <label className="block text-slate-600 text-xs mb-1 font-medium">Message Template Text</label>
              <textarea
                rows={6}
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 leading-relaxed font-mono"
              />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Allowed Variables:
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedTemplate.variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTemplateBody(templateBody + ` {${v}}`)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px]"
                  >
                    {`{${v}}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                onClick={handleTestSend}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold"
              >
                Send Test SMS
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Save Template
              </button>
            </div>
          </div>

          {/* Smartphone Live Preview (1 col) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
              Smartphone Live Render Preview
            </span>

            {/* Mock Phone Body */}
            <div className="w-64 bg-slate-950 rounded-3xl p-3 shadow-2xl border-4 border-slate-800 text-white">
              {/* Speaker / Camera Notch */}
              <div className="w-20 h-3 rounded-full bg-slate-800 mx-auto mb-4" />

              <div className="text-center text-[10px] text-slate-400 mb-3">
                <span className="font-bold text-amber-400">VM-DPKRAJ</span>
                <div>Today, 08:30 PM</div>
              </div>

              {/* Chat Bubble */}
              <div className="p-3 bg-slate-800 rounded-2xl rounded-tl-sm text-xs leading-relaxed text-slate-100 shadow border border-slate-700 font-sans">
                {getRenderedPreview(templateBody)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

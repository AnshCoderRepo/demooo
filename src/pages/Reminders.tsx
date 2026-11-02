import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Reminder } from '../types';
import { formatDate } from '../utils/formatters';
import { 
  BellRing, CheckCircle2, Clock, MessageSquare, Share2, 
  AlertTriangle, Filter, ShieldAlert, Truck, CreditCard, 
  Users, BusFront, Calendar, RotateCcw, Settings, Plus, X, Trash2
} from 'lucide-react';

export const Reminders: React.FC = () => {
  const { 
    reminders,
    addReminder,
    deleteReminder,
    snoozeReminder, 
    markReminderDone, 
    updateSettings,
    sendMockSms, 
    showToast 
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'snoozed' | 'done'>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // Reminder Rule Settings modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [ruleDocExpiryDays, setRuleDocExpiryDays] = useState(15);
  const [ruleEmiDays, setRuleEmiDays] = useState(5);
  const [ruleTripDays, setRuleTripDays] = useState(1);
  const [ruleCustDueDays, setRuleCustDueDays] = useState(3);
  const [ruleSalaryDays, setRuleSalaryDays] = useState(3);

  // Add Custom Reminder modal
  const [addReminderOpen, setAddReminderOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('Renew National Permit (All India)');
  const [newDesc, setNewDesc] = useState('Payment of consolidated road tax authorization for coach DL 01 AB 4090');
  const [newDueDate, setNewDueDate] = useState('2026-11-06');
  const [newType, setNewType] = useState<Reminder['type']>('document_expiry');
  const [newChannel, setNewChannel] = useState<'SMS' | 'WhatsApp' | 'In-App'>('WhatsApp');

  const isReminderFilterActive = statusFilter !== 'pending' || typeFilter !== 'all' || channelFilter !== 'all';

  const handleResetReminderFilters = () => {
    setStatusFilter('pending');
    setTypeFilter('all');
    setChannelFilter('all');
  };

  const filteredReminders = reminders.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (channelFilter !== 'all' && r.deliveryChannel !== channelFilter) return false;
    return true;
  });

  const getReminderIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'document_expiry': return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'emi_due': return <CreditCard className="w-5 h-5 text-purple-500" />;
      case 'tomorrow_trip': return <BusFront className="w-5 h-5 text-blue-500" />;
      case 'pending_payment': return <Users className="w-5 h-5 text-amber-500" />;
      case 'salary_day': return <Calendar className="w-5 h-5 text-emerald-500" />;
      default: return <BellRing className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleSendReminderAlert = (r: Reminder) => {
    sendMockSms(
      'Primary Operations Alert',
      '+91 98112 34567',
      'System Reminder Alert',
      `Alert [${r.title}]: ${r.description}. Due Date: ${formatDate(r.dueDate)}. - Deepak Raj Travels Admin.`,
      `Reminder: ${r.type}`
    );
    showToast({
      type: 'success',
      title: `Reminder Sent via ${r.deliveryChannel}`,
      message: `Notification broadcast sent to authorized recipient.`,
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: 'success',
      title: 'Reminder Rules Saved',
      message: `Updated proactive alerts: Docs (${ruleDocExpiryDays}d), EMI (${ruleEmiDays}d), Trips (${ruleTripDays}d), Salary (${ruleSalaryDays}d).`,
    });
    setSettingsModalOpen(false);
  };

  const handleSaveCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: 'success',
      title: 'Custom Reminder Created',
      message: `${newTitle} scheduled for ${formatDate(newDueDate)}.`,
    });
    setAddReminderOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reminders & Compliance Feed
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              {reminders.filter(r => r.status === 'pending').length} Action Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Proactive unified notification hub for document renewals, upcoming trips, customer payment dues, and loan repayments.
          </p>
        </div>

        {/* Action Controls & Settings */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Reminder Rules</span>
          </button>

          <button
            onClick={() => setAddReminderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Reminder</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'pending' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('snoozed')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'snoozed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Snoozed
            </button>
            <button
              onClick={() => setStatusFilter('done')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'done' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Resolved (Done)
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Alert Categories</option>
            <option value="document_expiry">RTO Document Expiry</option>
            <option value="emi_due">Vehicle EMI Auto-Debit</option>
            <option value="tomorrow_trip">Tomorrow's Trip Duty</option>
            <option value="pending_payment">Customer Payment Overdue</option>
            <option value="salary_day">Worker Salary Payout Day</option>
          </select>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">All Delivery Channels</option>
            <option value="SMS">SMS Dispatch</option>
            <option value="WhatsApp">WhatsApp Alert</option>
            <option value="in-app">In-App Notification</option>
          </select>
        </div>

        {isReminderFilterActive && (
          <button
            onClick={handleResetReminderFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors border border-rose-200"
            title="Reset reminder filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Reminders Feed */}
      <div className="space-y-3">
        {filteredReminders.map((r) => {
          const isHigh = r.urgency === 'high';

          return (
            <div
              key={r.id}
              className={`p-4 rounded-2xl border transition-all bg-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isHigh ? 'border-l-4 border-l-rose-500 border-slate-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isHigh ? 'bg-rose-50 border border-rose-200' : 'bg-slate-100 border border-slate-200'
                }`}>
                  {getReminderIcon(r.type)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{r.title}</h3>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                      r.deliveryChannel === 'WhatsApp' ? 'bg-emerald-100 text-emerald-800' : r.deliveryChannel === 'SMS' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {r.deliveryChannel}
                    </span>
                    {isHigh && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 uppercase">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                    {r.description}
                  </p>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Due Target: <strong>{formatDate(r.dueDate)}</strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {r.status !== 'done' && (
                  <>
                    <button
                      onClick={() => handleSendReminderAlert(r)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors"
                      title="Dispatch SMS / WhatsApp reminder"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send Alert</span>
                    </button>

                    <button
                      onClick={() => snoozeReminder(r.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs"
                      title="Snooze for 24 hours"
                    >
                      Snooze 24h
                    </button>

                    <button
                      onClick={() => markReminderDone(r.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
                      title="Mark as resolved"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </button>
                  </>
                )}

                {r.status === 'done' && (
                  <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    Resolved ✓
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reminder Advance Days Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Reminder Advance Days Configuration
                </h3>
              </div>
              <button onClick={() => setSettingsModalOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Configure how many days in advance the system generates automated SMS, WhatsApp, and in-app alerts before due dates.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="block text-slate-800">RTO Document Expiry</strong>
                  <span className="text-[11px] text-slate-500">Insurance, Fitness, Permit, PUC</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={ruleDocExpiryDays}
                    onChange={(e) => setRuleDocExpiryDays(Number(e.target.value))}
                    className="w-14 p-1.5 rounded border border-slate-300 font-mono text-center font-bold"
                  />
                  <span className="text-slate-500 font-medium">days</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="block text-slate-800">Bus EMI Auto-Debit</strong>
                  <span className="text-[11px] text-slate-500">Tata Capital, HDFC, Chola</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={ruleEmiDays}
                    onChange={(e) => setRuleEmiDays(Number(e.target.value))}
                    className="w-14 p-1.5 rounded border border-slate-300 font-mono text-center font-bold"
                  />
                  <span className="text-slate-500 font-medium">days</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="block text-slate-800">Tomorrow's Trip Duties</strong>
                  <span className="text-[11px] text-slate-500">Driver assignments & passenger alerts</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={ruleTripDays}
                    onChange={(e) => setRuleTripDays(Number(e.target.value))}
                    className="w-14 p-1.5 rounded border border-slate-300 font-mono text-center font-bold"
                  />
                  <span className="text-slate-500 font-medium">days</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="block text-slate-800">Customer Pending Dues</strong>
                  <span className="text-[11px] text-slate-500">Unsettled charter & corporate balances</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={ruleCustDueDays}
                    onChange={(e) => setRuleCustDueDays(Number(e.target.value))}
                    className="w-14 p-1.5 rounded border border-slate-300 font-mono text-center font-bold"
                  />
                  <span className="text-slate-500 font-medium">days</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="block text-slate-800">Monthly Salary Payout Day</strong>
                  <span className="text-[11px] text-slate-500">Staff attendance & payroll finalization</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={ruleSalaryDays}
                    onChange={(e) => setRuleSalaryDays(Number(e.target.value))}
                    className="w-14 p-1.5 rounded border border-slate-300 font-mono text-center font-bold"
                  />
                  <span className="text-slate-500 font-medium">days</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow"
                >
                  Save Alert Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Reminder Modal */}
      {addReminderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                + Add Operational Reminder
              </h3>
              <button onClick={() => setAddReminderOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomReminder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Reminder Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Description / Notes</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Delivery Channel</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="SMS">SMS Dispatch</option>
                    <option value="In-App">In-App Notification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Category</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="document_expiry">RTO Document Expiry</option>
                  <option value="emi_due">Vehicle Loan EMI</option>
                  <option value="tomorrow_trip">Upcoming Trip</option>
                  <option value="pending_payment">Customer Payment</option>
                  <option value="salary_day">Staff Payroll</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAddReminderOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow"
                >
                  Schedule Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

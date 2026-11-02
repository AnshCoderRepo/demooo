import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Reminder } from '../types';
import { formatDate } from '../utils/formatters';
import { 
  BellRing, CheckCircle2, Clock, MessageSquare, Share2, 
  AlertTriangle, Filter, ShieldAlert, Truck, CreditCard, 
  Users, BusFront, Calendar
} from 'lucide-react';

export const Reminders: React.FC = () => {
  const { 
    reminders, 
    snoozeReminder, 
    markReminderDone, 
    sendMockSms, 
    showToast 
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'snoozed' | 'done'>('pending');

  const filteredReminders = reminders.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
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

        {/* Filter */}
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
    </div>
  );
};

import React from 'react';
import { useApp } from '../../context/AppContext';
import { History, X, Clock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export const HistoryDrawer: React.FC = () => {
  const { activeHistory, closeHistory, changeHistory } = useApp();

  if (!activeHistory) return null;

  // Filter history for this specific entity
  const relevantHistory = changeHistory.filter(
    (h) => h.entityType === activeHistory.entityType && h.entityId === activeHistory.entityId
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Audit Change History</h3>
              <p className="text-xs text-amber-400 font-medium truncate max-w-[220px]">
                {activeHistory.entityTitle}
              </p>
            </div>
          </div>
          <button
            onClick={closeHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Badge */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Type: <strong className="text-slate-200">{activeHistory.entityType}</strong></span>
          <span>ID: <code className="text-amber-400 font-mono text-[11px]">{activeHistory.entityId}</code></span>
        </div>

        {/* Timeline Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {relevantHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No recorded modifications yet.</p>
              <p className="text-xs text-slate-600 mt-1">This record is in its initial created state.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-800 ml-3 space-y-6">
              {relevantHistory.map((item) => (
                <div key={item.id} className="relative pl-6">
                  {/* Timeline bullet */}
                  <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900" />
                  
                  <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-xs shadow-sm">
                    <div className="flex items-center justify-between gap-2 text-slate-400 mb-1.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-300">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>{item.userName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" />
                        <span>{item.timestamp}</span>
                      </div>
                    </div>

                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 bg-slate-700 text-amber-300">
                      {item.action} {item.fieldChanged ? `• ${item.fieldChanged}` : ''}
                    </div>

                    {item.oldValue && item.newValue && (
                      <div className="bg-slate-900/80 rounded-lg p-2 my-1.5 border border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-rose-400 line-through truncate max-w-[120px] font-mono">
                          {item.oldValue}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-emerald-400 font-semibold truncate max-w-[120px] font-mono">
                          {item.newValue}
                        </span>
                      </div>
                    )}

                    {item.reason && (
                      <p className="text-slate-400 mt-1 italic text-[11px] leading-relaxed">
                        "{item.reason}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tamper-evident system audit log</span>
        </div>
      </div>
    </div>
  );
};


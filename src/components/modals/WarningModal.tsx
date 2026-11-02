import React from 'react';
import { AlertTriangle, ShieldAlert, FileText, ArrowRight } from 'lucide-react';

interface WarningModalProps {
  isOpen: boolean;
  type: 'confirmed_record' | 'gst_invoice' | 'delete_confirmation';
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  onActionAlternative?: () => void;
  alternativeLabel?: string;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Proceed to Edit',
  cancelLabel = 'Go Back',
  onActionAlternative,
  alternativeLabel = 'Issue Credit Note',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            type === 'gst_invoice' 
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' 
              : type === 'delete_confirmation'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
          }`}>
            {type === 'gst_invoice' ? (
              <FileText className="w-6 h-6" />
            ) : type === 'delete_confirmation' ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400">Compliance & Security Check</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
          {message}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            {cancelLabel}
          </button>

          {type === 'gst_invoice' ? (
            onActionAlternative && (
              <button
                onClick={onActionAlternative}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-colors"
              >
                <span>{alternativeLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          ) : (
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-xl font-bold text-xs shadow transition-colors ${
                type === 'delete_confirmation'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


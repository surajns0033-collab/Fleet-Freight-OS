import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface WorkspaceConfirmModalProps {
  isOpen: boolean;
  title: string;
  actionDescription: string;
  targetService: 'Gmail' | 'Google Calendar' | 'Google Sheets' | 'Google Contacts';
  detailsList?: string[];
  confirmLabel?: string;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WorkspaceConfirmModal: React.FC<WorkspaceConfirmModalProps> = ({
  isOpen,
  title,
  actionDescription,
  targetService,
  detailsList,
  confirmLabel = 'Confirm & Execute',
  isProcessing = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const serviceColors = {
    Gmail: 'border-red-500/40 text-red-400 bg-red-500/10',
    'Google Calendar': 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    'Google Sheets': 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    'Google Contacts': 'border-amber-500/40 text-amber-400 bg-amber-500/10',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        id="workspace-confirm-dialog"
        className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 text-zinc-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mb-1 ${serviceColors[targetService]}`}>
                {targetService} API Mutation
              </div>
              <h3 id="confirm-modal-title" className="text-lg font-bold text-white tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            id="close-confirm-modal-btn"
            onClick={onCancel}
            disabled={isProcessing}
            className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-zinc-300 leading-relaxed mb-4 p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
          <p className="font-medium text-zinc-100 mb-1">{actionDescription}</p>
          <p className="text-xs text-zinc-400">
            This action will modify or create records in your real Google account via official authorized Workspace APIs.
          </p>
        </div>

        {detailsList && detailsList.length > 0 && (
          <div className="mb-5 bg-zinc-950/60 rounded-xl p-3 border border-zinc-800 text-xs">
            <div className="text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">Payload Summary:</div>
            <ul className="space-y-1 text-zinc-300">
              {detailsList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="cancel-workspace-action-btn"
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-workspace-action-btn"
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-900/30 transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing API Call...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

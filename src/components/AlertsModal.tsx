import React, { useState, useMemo } from 'react';
import { 
  AlertOctagon, AlertTriangle, Info, X, 
  CheckCircle2, ArrowRight, Filter, ShieldAlert,
  Bell, Check
} from 'lucide-react';
import { OperationalAlert } from '../types';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: OperationalAlert[];
  onTriageAlert: (alertId: string) => void;
  onNavigate: (tab: string) => void;
}

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info';

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onTriageAlert,
  onNavigate
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityFilter>('all');

  const counts = useMemo(() => {
    return {
      all: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
    };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    if (selectedSeverity === 'all') return alerts;
    return alerts.filter(a => a.severity === selectedSeverity);
  }, [alerts, selectedSeverity]);

  if (!isOpen) return null;

  // Severity-specific styling and icon configuration
  const getSeverityConfig = (severity: OperationalAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <AlertOctagon className="w-5 h-5" />,
          iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          borderClass: 'border-rose-900/70 hover:border-rose-700 bg-rose-950/25',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          accentText: 'text-rose-400',
          pulse: true,
          label: 'CRITICAL'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          borderClass: 'border-amber-900/60 hover:border-amber-700 bg-amber-950/25',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          accentText: 'text-amber-400',
          pulse: false,
          label: 'WARNING'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          iconBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
          borderClass: 'border-sky-900/60 hover:border-sky-700 bg-sky-950/20',
          badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          accentText: 'text-sky-400',
          pulse: false,
          label: 'INFO'
        };
    }
  };

  const handleResolveAction = (alert: OperationalAlert) => {
    onTriageAlert(alert.id);
    const cat = alert.category?.toUpperCase();
    if (cat === 'TELEMATICS' || cat === 'MECHANICAL') {
      onNavigate('telematics');
    } else if (cat === 'COLD_CHAIN' || cat === 'REEFER') {
      onNavigate('reefer');
    } else if (cat === 'HOS') {
      onNavigate('hos');
    } else if (cat === 'CUSTOMS' || cat === 'BORDER') {
      onNavigate('map');
    } else if (cat === 'DISPATCH') {
      onNavigate('dispatch');
    } else {
      onNavigate('overview');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[88vh] flex flex-col">
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Fleet Alert Triage Center
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {alerts.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time CAN-bus telematics, HOS clocks, customs, and cold-chain triage
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close triage modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Severity Summary & Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedSeverity('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedSeverity === 'all'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>All Alerts</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-300">
                {counts.all}
              </span>
            </button>

            {/* Critical Filter Tab */}
            <button
              onClick={() => setSelectedSeverity('critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedSeverity === 'critical'
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow-sm'
                  : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Critical</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-900/80">
                {counts.critical}
              </span>
            </button>

            {/* Warning Filter Tab */}
            <button
              onClick={() => setSelectedSeverity('warning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedSeverity === 'warning'
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Warning</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-900/80">
                {counts.warning}
              </span>
            </button>

            {/* Info Filter Tab */}
            <button
              onClick={() => setSelectedSeverity('info')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedSeverity === 'info'
                  ? 'bg-sky-500/30 text-sky-300 border border-sky-500/50 shadow-sm'
                  : 'text-sky-400/80 hover:text-sky-300 hover:bg-sky-500/10'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Info</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-900/80">
                {counts.info}
              </span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline px-2">
            Priority Triage View
          </span>
        </div>

        {/* Scrollable Alerts List */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="font-bold text-slate-200">
                {selectedSeverity === 'all' 
                  ? 'All fleet alerts resolved. Operational parameters are nominal.' 
                  : `No active ${selectedSeverity} alerts pending triage.`}
              </div>
              <p className="text-slate-500 text-[11px]">
                Engine ECMs, HOS driving clocks, and trailer microclimates operating within factory tolerance.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const config = getSeverityConfig(alert.severity);

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border space-y-3 transition-all ${config.borderClass}`}
                >
                  {/* Top Row: Severity Icon, Category, Timestamp, Unit ID */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {/* Color-Coded Severity Icon */}
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${config.iconBg} ${config.pulse ? 'animate-pulse' : ''}`}>
                        {config.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${config.badgeClass}`}>
                            {config.label}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {alert.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {alert.relatedUnitId && (
                        <span className="text-xs font-mono font-bold text-amber-300 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
                          {alert.relatedUnitId}
                        </span>
                      )}
                      {alert.relatedDriverId && (
                        <span className="text-xs font-mono text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                          {alert.relatedDriverId}
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-400">
                        {alert.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Title & Message Description */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white leading-snug">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>

                  {/* Action & Resolution CTA Bar */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <span className="font-bold text-amber-400">Action:</span>
                      <span className="italic">{alert.actionRequired}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => onTriageAlert(alert.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                        title="Dismiss alert without navigating"
                      >
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                        <span>Dismiss</span>
                      </button>

                      <button
                        onClick={() => handleResolveAction(alert)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ${
                          alert.severity === 'critical'
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                            : alert.severity === 'warning'
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                            : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
                        }`}
                      >
                        <span>Resolve &amp; Jump</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

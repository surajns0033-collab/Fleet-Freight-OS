import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, AlertTriangle, ShieldAlert, ChevronDown, 
  ArrowRight, X, User, Truck, Bell, AlertOctagon, CheckCircle2
} from 'lucide-react';
import { Driver } from '../types';

interface HOSLimitAlertBadgeProps {
  drivers?: Driver[];
  onNavigateToHOS?: () => void;
  theme?: 'dark' | 'day';
}

export interface AtRiskDriverHOS {
  driver: Driver;
  limitingFactor: 'Drive Time (11h Limit)' | 'Shift Time (14h Limit)' | 'Cycle Time (70h Limit)';
  minutesRemaining: number;
  urgency: 'Violation Risk (<30m)' | 'Approaching (<60m)';
}

export const HOSLimitAlertBadge: React.FC<HOSLimitAlertBadgeProps> = ({
  drivers = [],
  onNavigateToHOS,
  theme = 'dark'
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAutoToast, setShowAutoToast] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Identify drivers within 60 minutes of reaching max legal limit
  const atRiskDrivers: AtRiskDriverHOS[] = useMemo(() => {
    const list: AtRiskDriverHOS[] = [];

    drivers.forEach(d => {
      // Only active on-duty or driving operators
      if (d.duty_status !== 'Driving' && d.duty_status !== 'On-Duty') return;

      const driveMins = Math.round(d.drive_time_remaining_hours * 60);
      const shiftMins = Math.round(d.shift_time_remaining_hours * 60);
      const cycleMins = Math.round(d.cycle_time_remaining_hours * 60);

      let lowestMins = Math.min(driveMins, shiftMins);
      let factor: AtRiskDriverHOS['limitingFactor'] = driveMins <= shiftMins 
        ? 'Drive Time (11h Limit)' 
        : 'Shift Time (14h Limit)';

      if (cycleMins <= 60 && cycleMins < lowestMins) {
        lowestMins = cycleMins;
        factor = 'Cycle Time (70h Limit)';
      }

      if (lowestMins <= 60 && lowestMins > 0) {
        list.push({
          driver: d,
          limitingFactor: factor,
          minutesRemaining: lowestMins,
          urgency: lowestMins <= 30 ? 'Violation Risk (<30m)' : 'Approaching (<60m)'
        });
      }
    });

    return list.sort((a, b) => a.minutesRemaining - b.minutesRemaining);
  }, [drivers]);

  // Trigger automatic warning alert toast when at-risk drivers are detected
  useEffect(() => {
    if (atRiskDrivers.length > 0 && !toastDismissed) {
      setShowAutoToast(true);
    }
  }, [atRiskDrivers, toastDismissed]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleMousedown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleMousedown);
    return () => document.removeEventListener('mousedown', handleMousedown);
  }, []);

  if (atRiskDrivers.length === 0) {
    return null; // Silent if all drivers have >60 mins remaining
  }

  const primaryAtRisk = atRiskDrivers[0];

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Navbar Alert Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        id="hos-limit-alert-btn"
        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300 ring-2 ring-amber-500/30 flex items-center gap-1.5 transition-all animate-pulse"
        title={`HOS Limit Warning: ${atRiskDrivers.length} driver(s) within 60 minutes of legal limit`}
      >
        <div className="relative flex items-center justify-center">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        </div>

        <span className="text-xs font-bold font-mono">
          <span className="hidden lg:inline">HOS Warning: </span>
          {primaryAtRisk.driver.name.split(' ')[0]} ({primaryAtRisk.minutesRemaining}m left)
        </span>

        {atRiskDrivers.length > 1 && (
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black font-mono">
            +{atRiskDrivers.length - 1}
          </span>
        )}

        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Automatic HOS Alert Toast (Fired automatically when driver is within 60m) */}
      {showAutoToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-slideDown">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>HOS Regulatory Limit Alert</span>
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                    &lt;60 MINS
                  </span>
                </div>

                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Driver <strong className="text-white font-bold">{primaryAtRisk.driver.name}</strong> ({primaryAtRisk.driver.current_truck_id || 'Class-8'}) is within <strong className="text-amber-400 font-mono font-black">{primaryAtRisk.minutesRemaining} minutes</strong> of reaching the maximum legal {primaryAtRisk.limitingFactor}.
                </p>

                <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1 font-mono">
                  <span>Duty: {primaryAtRisk.driver.duty_status}</span>
                  <span>&bull;</span>
                  <span>Terminal: {primaryAtRisk.driver.home_terminal}</span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowAutoToast(false);
                      onNavigateToHOS?.();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition-colors"
                  >
                    <span>Open HOS Clocks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setShowAutoToast(false);
                      setToastDismissed(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Acknowledge &amp; Dismiss
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowAutoToast(false);
                  setToastDismissed(true);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Menu of At-Risk Drivers */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl p-4 z-50 text-left animate-fadeIn space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">HOS Compliance Triage</h4>
                <div className="text-[10px] text-slate-400 font-mono">
                  Drivers approaching mandatory rest limits
                </div>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {atRiskDrivers.length} At-Risk
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {atRiskDrivers.map(({ driver, limitingFactor, minutesRemaining, urgency }) => (
              <div 
                key={driver.driver_id}
                className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">{driver.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({driver.driver_id})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Truck className="w-3 h-3 text-amber-400" />
                      <span>{driver.current_truck_id || 'Tractor N/A'}</span>
                      <span>&bull;</span>
                      <span className="text-slate-300">{driver.current_location}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-amber-400">
                      {minutesRemaining}m left
                    </div>
                    <span className="text-[9px] font-mono text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/30">
                      {urgency}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-300 font-mono">
                    <span className="text-slate-400">Limiting Constraint:</span>
                    <strong className="text-amber-300">{limitingFactor}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>Drive Remaining: {(driver.drive_time_remaining_hours * 60).toFixed(0)}m</span>
                    <span>Shift Window: {(driver.shift_time_remaining_hours * 60).toFixed(0)}m</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 italic">
                  Dispatch Recommendation: Route to nearest truck stop or cross-dock terminal for mandatory 10h rest reset.
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setShowDropdown(false);
                onNavigateToHOS?.();
              }}
              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
            >
              <span>Manage Fleet in Driver HOS Clocks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

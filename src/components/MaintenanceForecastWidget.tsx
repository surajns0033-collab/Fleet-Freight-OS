import React, { useState, useMemo } from 'react';
import { 
  Wrench, AlertTriangle, CheckCircle2, ShieldAlert, 
  Calendar, Gauge, ArrowRight, Filter, ChevronRight,
  TrendingDown, Zap, Clock, Info, Check
} from 'lucide-react';
import { Equipment, FaultCode } from '../types';

interface MaintenanceForecastWidgetProps {
  equipment: Equipment[];
  onScheduleService: (unitId: string) => void;
  onSelectUnit?: (unitId: string) => void;
}

export interface TruckMaintenanceForecast {
  unitId: string;
  makeModel: string;
  year: number;
  currentOdometer: number;
  nominalDueMiles: number;
  baselineRemainingMiles: number;
  estimatedRemainingMiles: number;
  urgency: 'Critical' | 'Urgent' | 'Guarded' | 'Nominal';
  faultCodeDeductions: number;
  activeFaults: FaultCode[];
  recommendation: string;
  componentRisk: string;
  estimatedDaysRemaining: number;
}

export const MaintenanceForecastWidget: React.FC<MaintenanceForecastWidgetProps> = ({
  equipment,
  onScheduleService,
  onSelectUnit
}) => {
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'Critical' | 'Urgent' | 'Guarded' | 'Nominal'>('ALL');
  const [scheduledUnits, setScheduledUnits] = useState<Record<string, boolean>>({});

  // Compute predictive maintenance forecast for every truck
  const forecasts: TruckMaintenanceForecast[] = useMemo(() => {
    return equipment.map(truck => {
      const currentOdo = truck.current_odometer || 100000;
      const nominalDue = truck.next_service_due_miles || currentOdo + 10000;
      const baselineRemaining = Math.max(0, nominalDue - currentOdo);
      
      const faults = truck.telematics?.faultCodes || [];
      const criticalFaults = faults.filter(f => f.severity === 'Critical');
      const warningFaults = faults.filter(f => f.severity === 'Warning');
      const advisoryFaults = faults.filter(f => f.severity === 'Advisory');

      // Calculate fault derate deduction
      let deduction = 0;
      let primaryRisk = 'Engine & Drivetrain Standard PM';

      if (criticalFaults.length > 0) {
        // Critical faults severely accelerate maintenance urgency
        const fault = criticalFaults[0];
        deduction += Math.min(baselineRemaining * 0.85, 4500);
        deduction += fault.occurrenceCount * 150;
        primaryRisk = `${fault.description.split('—')[0].trim()} (SPN ${fault.spn})`;
      } else if (warningFaults.length > 0) {
        const fault = warningFaults[0];
        deduction += Math.min(baselineRemaining * 0.45, 2000);
        deduction += fault.occurrenceCount * 80;
        primaryRisk = `${fault.description.split('—')[0].trim()} (SPN ${fault.spn})`;
      } else if (advisoryFaults.length > 0) {
        deduction += 500;
        primaryRisk = 'Sensory Calibration & Minor Diagnostics';
      }

      // Check fluids & mechanical telematics triggers
      const tel = truck.telematics;
      if (tel) {
        if (tel.defLevelPct < 25) deduction += 300;
        if (tel.oilPressurePsi < 35 && tel.oilPressurePsi > 0) deduction += 800;
        if (tel.coolantTempF > 205) deduction += 600;
      }

      // Final remaining mileage before preventative or corrective maintenance
      let estimatedMiles = Math.max(120, Math.round(baselineRemaining - deduction));
      
      // If critical fault exists, cap safe operating range to prevent roadside derate
      if (criticalFaults.length > 0) {
        estimatedMiles = Math.min(estimatedMiles, 350);
      }

      // Determine Urgency Category
      let urgency: 'Critical' | 'Urgent' | 'Guarded' | 'Nominal';
      let recommendation = '';
      if (estimatedMiles <= 400 || criticalFaults.length > 0) {
        urgency = 'Critical';
        recommendation = 'Immediate Shop Routing: CAN-bus derate imminent within 48 hours.';
      } else if (estimatedMiles <= 1200) {
        urgency = 'Urgent';
        recommendation = 'Schedule Bay Service: Address active diagnostic warnings before next dispatch.';
      } else if (estimatedMiles <= 2500) {
        urgency = 'Guarded';
        recommendation = 'Standard PM Window: Schedule A/B PM service at next hub arrival.';
      } else {
        urgency = 'Nominal';
        recommendation = 'Healthy Fleet Profile: Telemetry within optimal operating thresholds.';
      }

      // Approximate days based on 450 miles/day average commercial freight run
      const estimatedDaysRemaining = Math.max(1, Math.round(estimatedMiles / 450));

      return {
        unitId: truck.unit_id,
        makeModel: truck.make_model,
        year: truck.year,
        currentOdometer: currentOdo,
        nominalDueMiles: nominalDue,
        baselineRemainingMiles: baselineRemaining,
        estimatedRemainingMiles: estimatedMiles,
        urgency,
        faultCodeDeductions: Math.round(deduction),
        activeFaults: faults,
        recommendation,
        componentRisk: primaryRisk,
        estimatedDaysRemaining
      };
    }).sort((a, b) => a.estimatedRemainingMiles - b.estimatedRemainingMiles);
  }, [equipment]);

  const filteredForecasts = useMemo(() => {
    if (filterUrgency === 'ALL') return forecasts;
    return forecasts.filter(f => f.urgency === filterUrgency);
  }, [forecasts, filterUrgency]);

  const handleBookService = (unitId: string) => {
    onScheduleService(unitId);
    setScheduledUnits(prev => ({ ...prev, [unitId]: true }));
  };

  const getUrgencyBadge = (urgency: TruckMaintenanceForecast['urgency']) => {
    switch (urgency) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            CRITICAL SERVICE (&lt;400 mi)
          </span>
        );
      case 'Urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            URGENT PM (&lt;1,200 mi)
          </span>
        );
      case 'Guarded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            GUARDED PM (&lt;2,500 mi)
          </span>
        );
      case 'Nominal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            OPTIMAL PM
          </span>
        );
    }
  };

  const criticalCount = forecasts.filter(f => f.urgency === 'Critical').length;
  const urgentCount = forecasts.filter(f => f.urgency === 'Urgent').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Predictive Maintenance Forecasting
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              J1939 Fault Code Wear Modeling
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1">
            Remaining Service Mileage Estimator
          </h3>
          <p className="text-slate-400 text-xs mt-0.5 max-w-2xl">
            Correlates active electronic control module (ECM) fault codes, SPN severity penalties, and live engine diagnostics to forecast remaining operational miles before preventative or roadside-preventive maintenance.
          </p>
        </div>

        {/* Triage Summary Badges */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {criticalCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-1.5 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              {criticalCount} Critical Derate Risk
            </div>
          )}
          {urgentCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5 text-xs font-bold font-mono">
              {urgentCount} PM Due Soon
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['ALL', 'Critical', 'Urgent', 'Guarded', 'Nominal'] as const).map(tier => {
            const count = tier === 'ALL' ? forecasts.length : forecasts.filter(f => f.urgency === tier).length;
            const isSelected = filterUrgency === tier;
            return (
              <button
                key={tier}
                onClick={() => setFilterUrgency(tier)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                <span>{tier === 'ALL' ? 'All Power Units' : tier}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Average Fleet Duty: ~450 mi/day</span>
        </div>
      </div>

      {/* Truck Forecast Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredForecasts.map(truck => {
          const isScheduled = scheduledUnits[truck.unitId];
          const hasFaults = truck.activeFaults.length > 0;
          const progressPct = Math.min(100, Math.max(5, (truck.estimatedRemainingMiles / 5000) * 100));

          return (
            <div 
              key={truck.unitId}
              className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                truck.urgency === 'Critical'
                  ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70 shadow-lg shadow-rose-950/10'
                  : truck.urgency === 'Urgent'
                  ? 'bg-amber-950/15 border-amber-500/40 hover:border-amber-500/60'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Truck Title & Urgency Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span 
                        onClick={() => onSelectUnit?.(truck.unitId)}
                        className="text-sm font-black text-white hover:text-amber-400 cursor-pointer transition-colors font-mono"
                      >
                        {truck.unitId}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {truck.year}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium truncate max-w-[180px]" title={truck.makeModel}>
                      {truck.makeModel}
                    </div>
                  </div>

                  {getUrgencyBadge(truck.urgency)}
                </div>

                {/* Remaining Miles Highlight Display */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                      Estimated Safe Remaining
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ~{truck.estimatedDaysRemaining} days operational
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-black font-mono tracking-tight ${
                      truck.urgency === 'Critical'
                        ? 'text-rose-400'
                        : truck.urgency === 'Urgent'
                        ? 'text-amber-400'
                        : truck.urgency === 'Guarded'
                        ? 'text-blue-400'
                        : 'text-emerald-400'
                    }`}>
                      {truck.estimatedRemainingMiles.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">MILES</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        truck.urgency === 'Critical'
                          ? 'bg-rose-500'
                          : truck.urgency === 'Urgent'
                          ? 'bg-amber-400'
                          : truck.urgency === 'Guarded'
                          ? 'bg-blue-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5">
                    <span>Odometer: {truck.currentOdometer.toLocaleString()} mi</span>
                    <span>Nominal PM: {truck.nominalDueMiles.toLocaleString()} mi</span>
                  </div>
                </div>

                {/* Fault Impact Breakdown */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Baseline Target:</span>
                    <span className="text-slate-200 font-mono font-medium">
                      +{truck.baselineRemainingMiles.toLocaleString()} mi
                    </span>
                  </div>

                  {truck.faultCodeDeductions > 0 ? (
                    <div className="flex items-center justify-between text-[11px] text-rose-400">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Fault Code Derate Penalty:
                      </span>
                      <span className="font-mono font-bold">
                        -{truck.faultCodeDeductions.toLocaleString()} mi
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        CAN-bus Diagnostic State:
                      </span>
                      <span className="font-mono">Clean (0 Codes)</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-300 font-medium pt-1 border-t border-slate-800/60 truncate" title={truck.componentRisk}>
                    <span className="text-slate-500 font-mono">Risk Profile:</span> {truck.componentRisk}
                  </div>
                </div>

                {/* Active Fault Code Badges */}
                {hasFaults && (
                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/20 text-[10px] space-y-1">
                    <div className="font-bold text-rose-300 font-mono uppercase">
                      Triggering J1939 Codes ({truck.activeFaults.length}):
                    </div>
                    {truck.activeFaults.map(fc => (
                      <div key={fc.spn} className="flex items-center justify-between text-rose-200">
                        <span className="font-mono font-bold">SPN {fc.spn} (FMI {fc.fmi})</span>
                        <span className="text-[9px] text-rose-400">{fc.occurrenceCount}x occurrences</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 mt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleBookService(truck.unitId)}
                  disabled={isScheduled}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isScheduled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                      : truck.urgency === 'Critical'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isScheduled ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>PM Bay Service Scheduled</span>
                    </>
                  ) : (
                    <>
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{truck.urgency === 'Critical' ? 'Schedule Emergency PM Work Order' : 'Queue Preventative Service'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

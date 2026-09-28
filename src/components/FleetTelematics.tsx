import React, { useState } from 'react';
import { 
  Activity, Wrench, AlertTriangle, CheckCircle2, 
  Gauge, Battery, Droplets, Zap, ShieldAlert, 
  TrendingUp, Clock, Calendar, Check, Play, RefreshCw, Layers
} from 'lucide-react';
import { Equipment, Driver } from '../types';
import { Tractor3DViewer } from './Tractor3DViewer';
import { FleetFuelHistoricalChart } from './FleetFuelHistoricalChart';
import { MaintenanceForecastWidget } from './MaintenanceForecastWidget';

interface FleetTelematicsProps {
  equipment: Equipment[];
  drivers?: Driver[];
  onClearFaultCode: (unitId: string, spn: number) => void;
  onScheduleService: (unitId: string) => void;
}

export const FleetTelematics: React.FC<FleetTelematicsProps> = ({
  equipment,
  drivers = [],
  onClearFaultCode,
  onScheduleService
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    equipment.find(e => e.status === 'Diagnostic Alert')?.unit_id || equipment[0].unit_id
  );
  const [telemetrySyncing, setTelemetrySyncing] = useState(false);
  const [ticketCreated, setTicketCreated] = useState<string | null>(null);

  const selectedTruck = equipment.find(e => e.unit_id === selectedUnitId) || equipment[0];

  const handleSimulateSync = () => {
    setTelemetrySyncing(true);
    setTimeout(() => {
      setTelemetrySyncing(false);
    }, 1200);
  };

  const handleCreateBayTicket = (unitId: string) => {
    onScheduleService(unitId);
    setTicketCreated(`Shop Work Order #WO-2026-441 queued for Bay 2 (Mechanic assigned) for ${unitId}!`);
    setTimeout(() => setTicketCreated(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              J1939 CAN-Bus Telematics &amp; Diagnostics
            </span>
            <span className="text-xs text-slate-400">| 100+ Class-8 Power Units</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Fleet Telematics &amp; Predictive Maintenance
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Live telemetry stream from Detroit DD15, Cummins X15, and PACCAR MX-13 electronic control modules (ECM). Real-time SPN fault code triage.
          </p>
        </div>

        <button
          onClick={handleSimulateSync}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors self-start sm:self-center shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${telemetrySyncing ? 'animate-spin' : ''}`} />
          <span>{telemetrySyncing ? 'Polling CAN-Bus...' : 'Ping Telematics'}</span>
        </button>
      </div>

      {ticketCreated && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{ticketCreated}</span>
        </div>
      )}

      {/* 30-Day Historical Fuel Consumption Recharts Visualization */}
      <FleetFuelHistoricalChart />

      {/* J1939 Fault-Based Predictive Maintenance Forecast Widget */}
      <MaintenanceForecastWidget
        equipment={equipment}
        onScheduleService={handleCreateBayTicket}
        onSelectUnit={(unitId) => setSelectedUnitId(unitId)}
      />

      {/* Grid: Unit Selector on Left, Deep ECM Telematics on Right */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Col: Unit List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Fleet Asset Registry
          </h3>

          <div className="space-y-2.5">
            {equipment.map((truck) => {
              const isSelected = truck.unit_id === selectedUnitId;
              const hasAlert = truck.status === 'Diagnostic Alert' || truck.telematics.faultCodes.length > 0;
              const assignedDriver = drivers.find(d => d.current_truck_id === truck.unit_id);
              return (
                <div
                  key={truck.unit_id}
                  onClick={() => setSelectedUnitId(truck.unit_id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">
                          {truck.unit_id}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({truck.year})
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium mt-0.5">
                        {truck.make_model}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <span>Driver:</span>
                        <strong className="text-amber-300 font-semibold">
                          {assignedDriver ? assignedDriver.name : 'Yard Standby (Unassigned)'}
                        </strong>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        hasAlert
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : truck.status === 'In-Transit'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {truck.status}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Odo: {truck.current_odometer.toLocaleString()} mi</span>
                    <span className={truck.next_service_due_miles - truck.current_odometer < 3000 ? 'text-amber-400 font-bold' : ''}>
                      PM Due: {(truck.next_service_due_miles - truck.current_odometer).toLocaleString()} mi
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Deep CAN-bus Telemetry Display (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Interactive 3D Tractor Digital Twin Hologram */}
          <Tractor3DViewer 
            equipment={selectedTruck}
            onOpenBayTicket={handleCreateBayTicket}
          />

          {/* Header of Selected Tractor */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                    ECM Telemetry Stream &bull; J1939 CAN-Bus 250kbps
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    ONLINE
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {selectedTruck.unit_id} &mdash; {selectedTruck.make_model}
                </h2>
                {(() => {
                  const driverForSelected = drivers.find(d => d.current_truck_id === selectedTruck.unit_id);
                  return (
                    <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
                      <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        Assigned Driver: <strong className="text-white font-bold">{driverForSelected ? driverForSelected.name : 'Unassigned (Yard Standby)'}</strong> {driverForSelected ? `(${driverForSelected.driver_id})` : ''}
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-400">Engine: {selectedTruck.engine_spec}</span>
                      <span>&bull;</span>
                      <span className="text-slate-400">Terminal: {selectedTruck.location}</span>
                    </div>
                  );
                })()}
              </div>

              {selectedTruck.telematics.faultCodes.length > 0 && (
                <button
                  onClick={() => handleCreateBayTicket(selectedTruck.unit_id)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all shrink-0 self-start sm:self-center"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Assign Bay Maintenance</span>
                </button>
              )}
            </div>

            {/* Live Engine Diagnostic Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Engine RPM */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Engine Speed</span>
                <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
                  {selectedTruck.telematics.engineRpm} <span className="text-xs font-normal text-slate-400">RPM</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (selectedTruck.telematics.engineRpm / 2100) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Oil Pressure */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Oil Pressure</span>
                <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
                  {selectedTruck.telematics.oilPressurePsi} <span className="text-xs font-normal text-slate-400">PSI</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (selectedTruck.telematics.oilPressurePsi / 60) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Coolant Temp */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Coolant Temp</span>
                <div className={`text-xl font-mono font-bold flex items-baseline gap-1 ${
                  selectedTruck.telematics.coolantTempF > 205 ? 'text-rose-400' : 'text-white'
                }`}>
                  {selectedTruck.telematics.coolantTempF}&deg; <span className="text-xs font-normal text-slate-400">F</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedTruck.telematics.coolantTempF > 205 ? 'bg-rose-400' : 'bg-sky-400'
                    }`}
                    style={{ width: `${Math.min(100, (selectedTruck.telematics.coolantTempF / 230) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* DEF Level */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">DEF Fluid Tank</span>
                <div className={`text-xl font-mono font-bold flex items-baseline gap-1 ${
                  selectedTruck.telematics.defLevelPct < 30 ? 'text-rose-400' : 'text-white'
                }`}>
                  {selectedTruck.telematics.defLevelPct}%
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedTruck.telematics.defLevelPct < 30 ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${selectedTruck.telematics.defLevelPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Battery Voltage */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Alternator/Battery</span>
                <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
                  {selectedTruck.telematics.batteryVolts} <span className="text-xs font-normal text-slate-400">V</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Normal 13.8V-14.4V</span>
              </div>

              {/* Fuel Burn Rate */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Burn Rate</span>
                <div className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
                  {selectedTruck.telematics.fuelBurnRateGalHr} <span className="text-xs font-normal text-slate-400">gal/hr</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {selectedTruck.telematics.speedMph > 0 ? `Speed: ${selectedTruck.telematics.speedMph} mph` : 'Idling at dock'}
                </span>
              </div>
            </div>
          </div>

          {/* Active SPN Fault Code Triage Box */}
          {selectedTruck.telematics.faultCodes.length > 0 ? (
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Active Diagnostic Trouble Code (DTC)
                    </h3>
                    <p className="text-xs text-rose-300">
                      Standard SAE J1939 Broadcast from Engine ECM
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  SEVERITY: CRITICAL
                </span>
              </div>

              {selectedTruck.telematics.faultCodes.map((code) => (
                <div key={code.spn} className="p-4 rounded-xl bg-slate-900/80 border border-rose-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-amber-400">
                      SPN: {code.spn} &bull; FMI: {code.fmi}
                    </span>
                    <span className="text-slate-400">Occurrences: {code.occurrenceCount}</span>
                  </div>

                  <div className="text-sm font-bold text-white">
                    {code.description}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <strong className="text-amber-400 font-mono">Recommended Action: </strong>
                    {code.recommendedAction}
                  </p>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onClearFaultCode(selectedTruck.unit_id, code.spn)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      Clear Code (Mechanic Verification)
                    </button>
                    <button
                      onClick={() => handleCreateBayTicket(selectedTruck.unit_id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-colors"
                    >
                      Issue Maintenance Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    No Active Fault Codes
                  </div>
                  <div className="text-xs text-slate-400">
                    ECM emission system, DEF pressure, and turbo sensors operating within factory tolerance.
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
                100% HEALTHY
              </span>
            </div>
          )}

          {/* Idle-Buster Analytics Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Idle-Buster &amp; Fuel Savings Telemetry
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Fleet Target: &lt; 1.2 hrs/day
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Corey &amp; Joe&rsquo;s Fleet Rule: &ldquo;A heavy-duty diesel engine burns 0.8 &ndash; 1.2 gallons per hour of idle time. Cutting 2 hours of unnecessary dock idling saves each truck over $14 CAD per day in wasted diesel.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

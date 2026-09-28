import React, { useState } from 'react';
import { 
  ThermometerSnowflake, ShieldAlert, AlertTriangle, CheckCircle2, 
  ArrowRight, ShieldCheck, MapPin, Clock, RefreshCw, Send, Radio
} from 'lucide-react';
import { FreightItem } from '../types';

interface ReeferColdChainProps {
  freight: FreightItem[];
  onDefrostOverride: (sku: string) => void;
  onRerouteBorder: (borderTarget: string) => void;
}

export const ReeferColdChain: React.FC<ReeferColdChainProps> = ({
  freight,
  onDefrostOverride,
  onRerouteBorder
}) => {
  const [activeFreight, setActiveFreight] = useState<FreightItem[]>(freight);
  const [rerouteBroadcasted, setRerouteBroadcasted] = useState<string | null>(null);

  const handleFixReefer = (sku: string) => {
    onDefrostOverride(sku);
    setActiveFreight(prev => prev.map(item => {
      if (item.freight_sku === sku) {
        return {
          ...item,
          current_temp_c: item.target_temp_c,
          spoilage_status: 'Optimal',
          estimatedHoursToCritical: 48.0
        };
      }
      return item;
    }));
  };

  const handleBroadcastReroute = () => {
    onRerouteBorder('Blue Water Bridge (Sarnia)');
    setRerouteBroadcasted('Automated route update sent to all Westbound units: Diverted via Hwy 402 / Blue Water Bridge. Estimated 36 minutes saved per truck!');
    setTimeout(() => setRerouteBroadcasted(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
              High-Value Cold Chain Telematics
            </span>
            <span className="text-xs text-slate-400">| Thermo King &amp; Carrier Transicold</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Cold Chain Spoilage Guard &amp; Border Customs
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Predictive temperature drift analysis alerting dispatch hours before refrigerated cargo breaches critical food safety thresholds. Dynamic Canada &ndash; US border wait time re-routing.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1 self-start sm:self-center shrink-0">
          <span className="text-xs text-slate-400 block uppercase font-bold">Cargo At Risk Today</span>
          <span className="text-xl font-extrabold text-amber-400 font-mono">$120,000 CAD</span>
        </div>
      </div>

      {rerouteBroadcasted && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{rerouteBroadcasted}</span>
        </div>
      )}

      {/* Reefer Cargo Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ThermometerSnowflake className="w-4 h-4 text-sky-400" />
          Active Refrigerated &amp; Sensitive Cargo Shipments
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {activeFreight.map((item) => {
            const isCritical = item.spoilage_status === 'Imminent Risk';
            const driftDelta = (item.current_temp_c - item.target_temp_c).toFixed(1);
            return (
              <div
                key={item.freight_sku}
                className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                  isCritical
                    ? 'bg-rose-950/20 border-rose-900/80 shadow-xl ring-1 ring-rose-500/30'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {item.freight_sku}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        {item.commodity}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {item.spoilage_status}
                    </span>
                  </div>

                  {/* Temperature Displays */}
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 grid grid-cols-2 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Target Temp</span>
                      <span className="text-lg font-mono font-bold text-white">
                        {item.target_temp_c}&deg;C
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Sensor Temp</span>
                      <span className={`text-lg font-mono font-bold ${
                        isCritical ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {item.current_temp_c}&deg;C
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Max Drift Allowed:</span>
                      <span className="font-mono text-white">&plusmn;{item.max_temp_drift_c}&deg;C</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Observed Drift:</span>
                      <span className={`font-mono font-bold ${isCritical ? 'text-rose-400' : 'text-slate-300'}`}>
                        +{driftDelta}&deg;C
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Spoilage Buffer:</span>
                      <span className={`font-mono font-bold ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.estimatedHoursToCritical.toFixed(1)} hours left
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between font-mono">
                    <span>Trailer: {item.associated_truck_id}</span>
                    <span>{item.handling_type}</span>
                  </div>
                </div>

                {isCritical ? (
                  <button
                    onClick={() => handleFixReefer(item.freight_sku)}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Trigger High-Capacity Cooling Cycle</span>
                  </button>
                ) : (
                  <div className="text-center text-[11px] text-emerald-400 font-medium py-1.5 bg-emerald-950/40 rounded-lg border border-emerald-900/60">
                    Microclimate Within Spec
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-Border Customs Waiting Times (Windsor vs Sarnia) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Live US &ndash; Canada Border Bridge Congestion
            </h3>
            <p className="text-xs text-slate-400">
              Commercial customs processing delays for FAST and Standard freight
            </p>
          </div>

          <button
            onClick={handleBroadcastReroute}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all self-start sm:self-center"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Broadcast Sarnia Reroute to Active Trucks</span>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Ambassador Bridge */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Ambassador Bridge (Windsor &rarr; Detroit)
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  I-75 / Highway 401 Crossing
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                HEAVY DELAY
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-400 font-mono">48</span>
              <span className="text-xs text-slate-400">minutes commercial wait</span>
            </div>

            <p className="text-xs text-slate-300">
              Lane 3 secondary inspection open. 1.8 mile truck backup onto Huron Church Road.
            </p>
          </div>

          {/* Blue Water Bridge */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/50 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Blue Water Bridge (Sarnia &rarr; Port Huron)
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  I-94 / Highway 402 Crossing
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                EXPEDIENT
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">12</span>
              <span className="text-xs text-slate-400">minutes commercial wait</span>
            </div>

            <p className="text-xs text-emerald-300">
              Recommended corridor! All 6 commercial FAST inspection booths active. Saves 36 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

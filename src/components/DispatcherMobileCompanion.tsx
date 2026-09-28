import React, { useState } from 'react';
import { 
  Smartphone, Bell, Send, CheckCircle2, AlertTriangle, Phone, 
  MapPin, ShieldAlert, ArrowRight, RefreshCw, Radio, UserCheck, 
  DollarSign, Check, X, Truck, Clock
} from 'lucide-react';
import { Driver, Equipment, Order, OperationalAlert } from '../types';

interface DispatcherMobileCompanionProps {
  drivers: Driver[];
  equipment: Equipment[];
  orders: Order[];
  alerts: OperationalAlert[];
  onDispatchOrder?: (orderId: string, truckId: string, driverId: string) => void;
}

export const DispatcherMobileCompanion: React.FC<DispatcherMobileCompanionProps> = ({
  drivers,
  equipment,
  orders,
  alerts,
  onDispatchOrder
}) => {
  const [mobileTab, setMobileTab] = useState<'triage' | 'quickdispatch' | 'checkcalls' | 'border'>('triage');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [triagedAlerts, setTriagedAlerts] = useState<Record<string, boolean>>({});

  const showFeedback = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const pendingOrders = orders.filter(o => o.status === 'Pending Dispatch');
  const activeDrivers = drivers.filter(d => d.duty_status === 'Driving' || d.duty_status === 'On-Duty');

  return (
    <div className="max-w-md mx-auto bg-slate-950 border-4 border-slate-800 rounded-[40px] shadow-2xl overflow-hidden text-slate-100 font-sans relative">
      {/* Smartphone Speaker & Notch Bar */}
      <div className="bg-slate-900 pt-3 pb-2 px-6 flex items-center justify-between border-b border-slate-800">
        <span className="text-[11px] font-mono font-bold text-slate-400">09:41</span>
        <div className="w-20 h-4 bg-slate-950 rounded-full mx-auto" />
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
          <span>5G</span>
          <span>100%</span>
        </div>
      </div>

      {/* App Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-amber-500/30">
            FO
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono font-bold text-amber-400">
              Fleet Dispatcher Pocket
            </div>
            <div className="text-xs font-black text-white">
              Mobile Dispatch Companion
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="relative p-1.5 rounded-lg bg-slate-800 text-amber-400">
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Floating Action Notice */}
      {actionNotice && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center animate-fadeIn shadow-md">
          {actionNotice}
        </div>
      )}

      {/* Mobile Nav Tabs */}
      <div className="grid grid-cols-4 bg-slate-900/90 border-b border-slate-800 p-1 text-[11px] font-bold text-center">
        <button
          onClick={() => setMobileTab('triage')}
          className={`py-2 rounded-lg transition-colors ${
            mobileTab === 'triage' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setMobileTab('quickdispatch')}
          className={`py-2 rounded-lg transition-colors ${
            mobileTab === 'quickdispatch' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Dispatch ({pendingOrders.length})
        </button>
        <button
          onClick={() => setMobileTab('checkcalls')}
          className={`py-2 rounded-lg transition-colors ${
            mobileTab === 'checkcalls' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Drivers
        </button>
        <button
          onClick={() => setMobileTab('border')}
          className={`py-2 rounded-lg transition-colors ${
            mobileTab === 'border' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Borders
        </button>
      </div>

      {/* Content Body */}
      <div className="p-4 space-y-4 min-h-[460px] max-h-[500px] overflow-y-auto">
        {/* 1. TRIAGE ALERTS */}
        {mobileTab === 'triage' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center justify-between">
              <span>Push Notification Queue</span>
              <span>{alerts.length} Active</span>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No active operational alerts. Fleet nominal.
              </div>
            ) : (
              alerts.map((al) => {
                const isResolved = triagedAlerts[al.alert_id];
                return (
                  <div
                    key={al.alert_id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isResolved
                        ? 'bg-slate-950 border-slate-900 opacity-50'
                        : al.severity === 'Critical'
                        ? 'bg-rose-950/40 border-rose-800/80'
                        : 'bg-amber-950/30 border-amber-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${al.severity === 'Critical' ? 'text-rose-400' : 'text-amber-400'}`} />
                        <span className="text-xs font-bold text-white leading-tight">
                          {al.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">
                        {al.source_unit}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
                      {al.message}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                      <span className="text-[10px] text-amber-400 font-mono">
                        {al.action_required}
                      </span>
                      {!isResolved ? (
                        <button
                          onClick={() => {
                            setTriagedAlerts(prev => ({ ...prev, [al.alert_id]: true }));
                            showFeedback(`Alert ${al.alert_id} triaged & acknowledged!`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Acknowledge</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Acknowledged
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2. QUICK DISPATCH */}
        {mobileTab === 'quickdispatch' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
              Orders Awaiting Dispatch
            </div>

            {pendingOrders.map(ord => (
              <div
                key={ord.order_id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {ord.order_id}
                  </span>
                  <span className="text-xs font-bold text-white">
                    ${ord.rate_cad.toLocaleString()} CAD
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-white">
                    {ord.shipper_name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-indigo-400" />
                    <span>{ord.origin} &rarr; {ord.destination}</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between">
                  <span>Reefer Spec: <strong>{ord.reefer_required ? `${ord.temp_setpoint_f}°F` : 'Dry Van'}</strong></span>
                  <span className="text-slate-400 font-mono">{ord.weight_lbs.toLocaleString()} lbs</span>
                </div>

                <button
                  onClick={() => {
                    const availableTruck = equipment.find(e => e.status === 'Online' || e.status === 'Idle');
                    const availableDriver = drivers.find(d => d.duty_status === 'On-Duty' || d.duty_status === 'Off-Duty');
                    if (availableTruck && availableDriver && onDispatchOrder) {
                      onDispatchOrder(ord.order_id, availableTruck.unit_id, availableDriver.driver_id);
                      showFeedback(`1-Tap Dispatched to Driver ${availableDriver.name} on ${availableTruck.unit_id}!`);
                    } else {
                      showFeedback(`Dispatched order ${ord.order_id} via mobile push!`);
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>1-Tap Instant Dispatch</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. DRIVER CHECK CALLS */}
        {mobileTab === 'checkcalls' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
              Driver Roster &amp; Check Calls
            </div>

            {drivers.map(drv => (
              <div
                key={drv.driver_id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{drv.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">({drv.driver_id})</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Location: <span className="text-slate-200">{drv.current_location}</span>
                  </div>
                  <div className="text-[10px] font-mono text-amber-400">
                    Drive Time Left: {drv.drive_time_remaining_hours}h / 11h
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => showFeedback(`Calling ${drv.name} at ${drv.phone}...`)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                    title="Call Driver"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => showFeedback(`Push check-call sent to ${drv.name} in-cab tablet!`)}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold"
                  >
                    Ping Cab
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. LIVE BORDERS */}
        {mobileTab === 'border' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
              Live Cross-Border Delays
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Ambassador Bridge (Windsor)</span>
                <span className="text-xs font-mono font-bold text-rose-400">42m Delay</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Commercial non-FAST lanes backed up onto Huron Church Rd.
              </p>
              <button
                onClick={() => showFeedback('Push advisory broadcasted to all outbound trucks to divert via Hwy 402!')}
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold"
              >
                Push Divert Alert to Fleet
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Blue Water Bridge (Sarnia)</span>
                <span className="text-xs font-mono font-bold text-emerald-400">14m (Normal)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Smooth processing on Highway 402 corridor.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Smartphone Bottom Home Bar */}
      <div className="bg-slate-900 p-3 border-t border-slate-800 flex justify-center">
        <div className="w-32 h-1 bg-slate-700 rounded-full" />
      </div>
    </div>
  );
};

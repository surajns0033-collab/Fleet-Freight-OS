import React, { useState } from 'react';
import { 
  Send, Plus, Filter, CheckCircle2, AlertTriangle, 
  Truck, User, Calendar, MapPin, Scale, DollarSign, 
  Clock, ShieldCheck, FileText, ArrowRight, X, Sparkles,
  Radio, MessageSquare
} from 'lucide-react';
import { Order, Equipment, Driver, EquipmentType, OperatorProfile } from '../types';
import { DispatchQuickMessagePanel } from './DispatchQuickMessagePanel';

interface DispatchConsoleProps {
  orders: Order[];
  equipment: Equipment[];
  drivers: Driver[];
  activeOperator?: OperatorProfile;
  onDispatchOrder: (orderId: string, truckId: string, driverId: string) => void;
  onAddNewOrder: (newOrder: Order) => void;
}

export const DispatchConsole: React.FC<DispatchConsoleProps> = ({
  orders,
  equipment,
  drivers,
  activeOperator,
  onDispatchOrder,
  onAddNewOrder
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders.find(o => o.status === 'Tendered')?.order_id || orders[0].order_id
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewOrderModal, setShowNewOrderModal] = useState<boolean>(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Quick Message state
  const [showQuickMessageModal, setShowQuickMessageModal] = useState<boolean>(false);
  const [quickMessageDriverId, setQuickMessageDriverId] = useState<string | undefined>(undefined);
  const [showInlineQuickMessage, setShowInlineQuickMessage] = useState<boolean>(false);

  // New Order Form state
  const [shipperName, setShipperName] = useState('Magna International');
  const [originCity, setOriginCity] = useState('Newmarket');
  const [originState, setOriginState] = useState('ON');
  const [destCity, setDestCity] = useState('Detroit');
  const [destState, setDestState] = useState('MI');
  const [distanceMiles, setDistanceMiles] = useState(245);
  const [weightLbs, setWeightLbs] = useState(38000);
  const [pallets, setPallets] = useState(24);
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('Dry Van 53ft');
  const [rateCad, setRateCad] = useState(1950.00);

  const selectedOrder = orders.find(o => o.order_id === selectedOrderId) || orders[0];

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'all') return true;
    return o.status.toLowerCase() === filterStatus.toLowerCase();
  });

  // Calculate Match Score for each Available Driver + Truck pair
  const matchCandidates = drivers.map(driver => {
    // find assigned or online truck for driver
    const truck = equipment.find(t => t.unit_id === driver.current_truck_id) || equipment[0];
    
    // Scoring criteria
    let score = 100;
    const reasons: string[] = [];

    // Equipment match
    const isReeferRequired = selectedOrder.equipment_required.includes('Reefer');
    const isReeferTruck = truck.make_model.toLowerCase().includes('reefer') || truck.unit_id.startsWith('TRL');
    if (isReeferRequired && !isReeferTruck) {
      score -= 35;
      reasons.push('Requires Reefer trailer unit');
    } else {
      reasons.push('Equipment spec verified');
    }

    // HOS Drive Clock Check (assuming 50 mph avg speed)
    const hoursNeeded = selectedOrder.distance_miles / 50;
    if (driver.drive_time_remaining_hours < hoursNeeded) {
      score -= 40;
      reasons.push(`HOS clock insufficient (${driver.drive_time_remaining_hours}h left vs ~${hoursNeeded.toFixed(1)}h needed)`);
    } else {
      reasons.push(`HOS clock compliant (${driver.drive_time_remaining_hours}h available)`);
    }

    // Cross border check
    const isCrossBorder = selectedOrder.origin_state_prov !== selectedOrder.dest_state_prov && 
      (selectedOrder.dest_state_prov === 'MI' || selectedOrder.dest_state_prov === 'IL' || selectedOrder.dest_state_prov === 'OH' || selectedOrder.dest_state_prov === 'PA');
    if (isCrossBorder && !driver.fast_card_approved) {
      score -= 20;
      reasons.push('Non-FAST card: Customs line delays expected');
    } else if (isCrossBorder && driver.fast_card_approved) {
      reasons.push('FAST-Card approved for express customs lane');
    }

    // Equipment diagnostic alerts
    if (truck.status === 'Diagnostic Alert') {
      score -= 50;
      reasons.push(`Mechanical fault alert: ${truck.unit_id} has open SPN fault`);
    }

    return {
      driver,
      truck,
      score: Math.max(0, score),
      reasons,
      isFeasible: score >= 60 && truck.status !== 'Diagnostic Alert'
    };
  }).sort((a, b) => b.score - a.score);

  const handleExecuteDispatch = (truckId: string, driverId: string) => {
    onDispatchOrder(selectedOrder.order_id, truckId, driverId);
    const assignedDriver = drivers.find(d => d.driver_id === driverId);
    const assignedTruck = equipment.find(e => e.unit_id === truckId);
    const operatorName = activeOperator?.name || 'Corey Barron (Lead Dispatcher)';
    setDispatchSuccessMsg(`Order ${selectedOrder.order_id} (${selectedOrder.shipper_name}) successfully dispatched to Driver ${assignedDriver ? assignedDriver.name : driverId} (Unit ${truckId} ${assignedTruck ? `• ${assignedTruck.make_model}` : ''}) by ${operatorName}!`);
    setTimeout(() => setDispatchSuccessMsg(null), 5000);
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `ORD-2026-${Math.floor(9048 + Math.random() * 50)}`;
    const newOrder: Order = {
      order_id: newId,
      shipper_name: shipperName,
      origin_city: originCity,
      origin_state_prov: originState,
      dest_city: destCity,
      dest_state_prov: destState,
      distance_miles: Number(distanceMiles),
      weight_lbs: Number(weightLbs),
      pallets: Number(pallets),
      equipment_required: equipmentType,
      rate_cad: Number(rateCad),
      pickup_window: '2026-09-13 08:00 EDT',
      status: 'Tendered'
    };
    onAddNewOrder(newOrder);
    setSelectedOrderId(newId);
    setShowNewOrderModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
              Autonomous Capacity Matching
            </span>
            <span className="text-xs text-slate-400">| Sub-Second Broker Tenders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Load Matching &amp; Dispatch Console
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Evaluate incoming freight tenders against live power unit locations, HOS 11-hour driving clocks, and trailer specifications. Dispatch in one click.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
          <button
            onClick={() => {
              setQuickMessageDriverId(undefined);
              setShowInlineQuickMessage(prev => !prev);
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${
              showInlineQuickMessage
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-sky-500/30'
            }`}
            title="Toggle Dispatcher Quick-Message Terminal to broadcast status alerts to active drivers"
          >
            <Radio className="w-4 h-4" />
            <span>Driver Quick-Message</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900/80 text-sky-300 border border-sky-500/40">
              {drivers.length} Active
            </span>
          </button>

          <button
            onClick={() => setShowNewOrderModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Ingest New Load Tender</span>
          </button>
        </div>
      </div>

      {dispatchSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{dispatchSuccessMsg}</span>
        </div>
      )}

      {/* Inline Quick-Message Notification Terminal */}
      {showInlineQuickMessage && (
        <DispatchQuickMessagePanel
          drivers={drivers}
          equipment={equipment}
          activeOperator={activeOperator}
          initialDriverId={quickMessageDriverId}
          isModal={false}
        />
      )}

      {/* Main 2-Column Split: Orders Table on Left, Live Matching Engine on Right */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Orders List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['all', 'tendered', 'dispatched', 'in-transit'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  filterStatus === f
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Orders Card List */}
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isSelected = order.order_id === selectedOrderId;
              return (
                <div
                  key={order.order_id}
                  onClick={() => setSelectedOrderId(order.order_id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {order.order_id}
                      </span>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {order.shipper_name}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        order.status === 'Tendered'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : order.status === 'Dispatched'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Route & Distance */}
                  <div className="mt-2 text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {order.origin_city}, {order.origin_state_prov} &rarr; {order.dest_city}, {order.dest_state_prov}
                    </span>
                    <span className="text-slate-500 font-mono">({order.distance_miles} mi)</span>
                  </div>

                  {/* Weight, Pallets, Equipment */}
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{order.equipment_required}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ${order.rate_cad.toLocaleString()} CAD
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Order Details & Capacity Smart Matcher (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Selected Order Detail Header */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Selected Freight Tender</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  <span>{selectedOrder.order_id}</span>
                  <span className="text-sm font-normal text-slate-400">&bull; {selectedOrder.shipper_name}</span>
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono">Tendered Gross Rate</span>
                <div className="text-xl font-extrabold text-emerald-400 font-mono">
                  ${selectedOrder.rate_cad.toLocaleString()} CAD
                </div>
              </div>
            </div>

            {/* Quick Spec Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Equipment</span>
                <span className="font-semibold text-white truncate block">{selectedOrder.equipment_required}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Weight / Skids</span>
                <span className="font-semibold text-white">{selectedOrder.weight_lbs.toLocaleString()} lbs &bull; {selectedOrder.pallets} Pallets</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pickup Window</span>
                <span className="font-semibold text-white font-mono text-[11px]">{selectedOrder.pickup_window}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Revenue/Mile</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  ${(selectedOrder.rate_cad / selectedOrder.distance_miles).toFixed(2)} / mi
                </span>
              </div>
            </div>

            {selectedOrder.notes && (
              <p className="text-xs text-slate-300 italic bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                &ldquo;{selectedOrder.notes}&rdquo;
              </p>
            )}

            {/* Already Dispatched State */}
            {selectedOrder.status !== 'Tendered' && (
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>
                    Dispatched to <strong className="text-white">{selectedOrder.assigned_truck_id}</strong> &bull; Driver: <strong className="text-white">{selectedOrder.assigned_driver_id}</strong>
                  </span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-200">
                  {selectedOrder.status}
                </span>
              </div>
            )}
          </div>

          {/* Smart Match Recommendations Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Smart Capacity Match Candidates (Automated Scoring)
                </h3>
                <p className="text-xs text-slate-400">
                  Ranked by HOS drive clock viability, equipment compatibility, and terminal proximity
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {matchCandidates.map(({ driver, truck, score, reasons, isFeasible }) => (
                <div
                  key={driver.driver_id}
                  className={`p-4 rounded-xl border transition-all ${
                    isFeasible
                      ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/60 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            Driver: {driver.name}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            ({driver.driver_id})
                          </span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                            Tractor: {truck.unit_id} ({truck.make_model})
                          </span>
                          {driver.fast_card_approved && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              FAST CARD
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
                          <span>Home Terminal: <strong className="text-white">{driver.home_terminal}</strong></span>
                          <span>&bull;</span>
                          <span className={driver.drive_time_remaining_hours < 3 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            Drive Clock: {driver.drive_time_remaining_hours}h left
                          </span>
                          <span>&bull;</span>
                          <span>Shift: {driver.shift_time_remaining_hours}h</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score & 1-Click Dispatch Button */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-mono">Match Score</div>
                        <div className={`text-base font-extrabold font-mono ${
                          score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {score}%
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setQuickMessageDriverId(driver.driver_id);
                          setShowQuickMessageModal(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        title={`Send quick status notification to driver ${driver.name}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                        <span>Quick Msg</span>
                      </button>

                      <button
                        onClick={() => handleExecuteDispatch(truck.unit_id, driver.driver_id)}
                        disabled={selectedOrder.status !== 'Tendered' || !isFeasible}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          selectedOrder.status !== 'Tendered' || !isFeasible
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 hover:scale-[1.02]'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch</span>
                      </button>
                    </div>
                  </div>

                  {/* Rationales Breakdown */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-2">
                    {reasons.map((r, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 border border-slate-700/60"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ingest Tender Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Ingest New Shipper Load Tender
              </h3>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold uppercase">Shipper Company Name</label>
                <input
                  type="text"
                  value={shipperName}
                  onChange={(e) => setShipperName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold uppercase">Origin City, Prov/State</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                      placeholder="City"
                      required
                    />
                    <input
                      type="text"
                      value={originState}
                      onChange={(e) => setOriginState(e.target.value)}
                      className="w-16 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      placeholder="State"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold uppercase">Destination City, Prov/State</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={destCity}
                      onChange={(e) => setDestCity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                      placeholder="City"
                      required
                    />
                    <input
                      type="text"
                      value={destState}
                      onChange={(e) => setDestState(e.target.value)}
                      className="w-16 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      placeholder="State"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold uppercase">Distance (Miles)</label>
                  <input
                    type="number"
                    value={distanceMiles}
                    onChange={(e) => setDistanceMiles(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold uppercase">Weight (Lbs)</label>
                  <input
                    type="number"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold uppercase">Pallets</label>
                  <input
                    type="number"
                    value={pallets}
                    onChange={(e) => setPallets(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold uppercase">Equipment Required</label>
                  <select
                    value={equipmentType}
                    onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Dry Van 53ft">Dry Van 53ft</option>
                    <option value="Reefer (-18C)">Reefer (-18C Frozen)</option>
                    <option value="Reefer (+4C)">Reefer (+4C Chill)</option>
                    <option value="Reefer (+2C)">Reefer (+2C Produce)</option>
                    <option value="Flatbed">Flatbed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold uppercase">Contract Rate (CAD)</label>
                  <input
                    type="number"
                    value={rateCad}
                    onChange={(e) => setRateCad(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  Ingest &amp; Match Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Quick-Message Notification Interface */}
      {showQuickMessageModal && (
        <DispatchQuickMessagePanel
          drivers={drivers}
          equipment={equipment}
          activeOperator={activeOperator}
          initialDriverId={quickMessageDriverId}
          isModal={true}
          onCloseModal={() => setShowQuickMessageModal(false)}
        />
      )}
    </div>
  );
};

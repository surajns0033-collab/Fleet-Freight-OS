import React, { useState, useRef } from 'react';
import { 
  Truck, MapPin, CheckCircle2, Clock, Camera, 
  FileText, Sun, Moon, Check, AlertCircle, RefreshCw, PenTool, 
  ShieldCheck, Scan, Eye, ChevronDown, ChevronUp, History, Sparkles, X
} from 'lucide-react';
import { Driver, Order, ProofOfDeliveryDocument } from '../types';
import { ProofOfDeliveryScanner } from './ProofOfDeliveryScanner';
import { WeatherHazardBanner } from './WeatherHazardBanner';
import { DriverCabChat } from './DriverCabChat';

interface DriverCabPilotProps {
  driver: Driver;
  activeOrder?: Order;
  allOrders?: Order[];
  onConfirmDelivery: (orderId: string, podDoc?: ProofOfDeliveryDocument) => void;
  onOpenOrderHistoryTab?: () => void;
}

export const DriverCabPilot: React.FC<DriverCabPilotProps> = ({
  driver,
  activeOrder,
  allOrders = [],
  onConfirmDelivery,
  onOpenOrderHistoryTab
}) => {
  const driverName = driver?.name || 'Wayne MacLeod';
  const driverId = driver?.driver_id || 'DRV-742';
  const driverTruck = driver?.current_truck_id || 'TRK-104';
  const driverTerminal = driver?.home_terminal || 'Windsor Terminal, ON';
  const driverFastApproved = driver?.fast_card_approved ?? true;
  const initials = driverName.split(' ').map(n => n[0]).filter(Boolean).join('') || 'WM';

  const [highContrastNight, setHighContrastNight] = useState(true);
  const [dockArrived, setDockArrived] = useState(false);
  const [detentionMinutes, setDetentionMinutes] = useState(0);
  const [detentionInterval, setDetentionInterval] = useState<any>(null);
  
  // PoD and OCR states
  const [showPoDScanner, setShowPoDScanner] = useState(false);
  const [localPoD, setLocalPoD] = useState<ProofOfDeliveryDocument | null>(activeOrder?.pod_document || null);
  const [viewingDocModal, setViewingDocModal] = useState<ProofOfDeliveryDocument | null>(null);
  const [showHistorySection, setShowHistorySection] = useState(false);

  const [signatureSaved, setSignatureSaved] = useState(false);
  const [signedName, setSignedName] = useState('Receiver: J. Martinez');
  const [completedSuccess, setCompletedSuccess] = useState(activeOrder?.status === 'Delivered');

  // Canvas for signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleStartDetentionTimer = () => {
    setDockArrived(true);
    if (!detentionInterval) {
      const interval = setInterval(() => {
        setDetentionMinutes(prev => prev + 1);
      }, 1000); // 1 sec = 1 min simulation for fast UX
      setDetentionInterval(interval);
    }
  };

  const handleClearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setSignatureSaved(false);
  };

  const handleSaveSignature = () => {
    setSignatureSaved(true);
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = highContrastNight ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleProcessPoD = (orderId: string, podDoc: ProofOfDeliveryDocument) => {
    setLocalPoD(podDoc);
    onConfirmDelivery(orderId, podDoc);
    setCompletedSuccess(true);
    if (detentionInterval) clearInterval(detentionInterval);
  };

  const handleCompleteTrip = () => {
    if (activeOrder) {
      onConfirmDelivery(activeOrder.order_id, localPoD || undefined);
      setCompletedSuccess(true);
      if (detentionInterval) clearInterval(detentionInterval);
    }
  };

  const effectivePoD = localPoD || activeOrder?.pod_document;

  return (
    <div className={`rounded-3xl border transition-colors max-w-4xl mx-auto overflow-hidden shadow-2xl ${
      highContrastNight
        ? 'bg-black border-slate-800 text-white'
        : 'bg-slate-100 border-slate-300 text-slate-900'
    }`}>
      {/* Tablet Top Bar */}
      <div className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 ${
        highContrastNight ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-base shadow-md shadow-amber-500/20">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold text-amber-400">
                In-Cab Driver Operating Console
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-400 font-bold">
                CONNECTED
              </span>
            </div>
            <div className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
              <span>Driver: {driverName}</span>
              <span className="text-xs font-mono font-bold text-slate-400">({driverId})</span>
            </div>
            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
              <span>Power Unit: <strong className="text-amber-300 font-mono">{driverTruck}</strong></span>
              <span>&bull;</span>
              <span>Home Base: <span className="text-slate-300">{driverTerminal}</span></span>
              {driverFastApproved && (
                <>
                  <span>&bull;</span>
                  <span className="text-emerald-400 font-bold text-[11px]">FAST Express Customs</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Day/Night toggle for sunlight glare */}
          <button
            onClick={() => setHighContrastNight(!highContrastNight)}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-colors ${
              highContrastNight ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-850' : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'
            }`}
          >
            {highContrastNight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{highContrastNight ? 'Day Glare Mode' : 'Night Cab Mode'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Live Driver Weather Hazard Banner with Geolocation */}
        <WeatherHazardBanner 
          defaultLocationName={activeOrder ? `${activeOrder.origin_city} Corridor` : `${driverTerminal}`} 
        />

        {/* Active Route Header */}
        {activeOrder ? (
          <div className={`p-6 rounded-2xl border space-y-4 ${
            highContrastNight ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-800/80">
              <div>
                <span className="text-xs font-mono font-bold text-amber-500 uppercase">
                  Current Assigned Load Tender
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-0.5">
                  {activeOrder.order_id} &bull; {activeOrder.shipper_name}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono">Delivery Window</span>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {activeOrder.delivery_window || 'Today 14:00 EDT'}
                </div>
              </div>
            </div>

            {/* Highway Corridors */}
            <div className="flex items-center gap-3 text-base sm:text-lg font-bold">
              <MapPin className="w-5 h-5 text-sky-400 shrink-0" />
              <span>{activeOrder.origin_city}, {activeOrder.origin_state_prov}</span>
              <span className="text-amber-500">&rarr;</span>
              <span>{activeOrder.dest_city}, {activeOrder.dest_state_prov}</span>
              <span className="text-sm font-mono text-slate-400">({activeOrder.distance_miles} miles)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Equipment</span>
                <span className="font-semibold">{activeOrder.equipment_required}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Weight / Skids</span>
                <span className="font-semibold">{activeOrder.weight_lbs.toLocaleString()} lbs &bull; {activeOrder.pallets} Pallets</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">11h Drive Clock</span>
                <span className="font-semibold text-emerald-400 font-mono">{driver.drive_time_remaining_hours}h Remaining</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">14h Shift Clock</span>
                <span className="font-semibold text-sky-400 font-mono">{driver.shift_time_remaining_hours}h Remaining</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800">
            <h3 className="text-lg font-bold">No Active Load Currently Dispatched</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select or dispatch a load in the Dispatch Console to view live in-cab telemetry.
            </p>
          </div>
        )}

        {/* Ergonomic Big 64dp In-Cab Touch Action Buttons */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Dock Arrival Geofence Button */}
          <button
            onClick={handleStartDetentionTimer}
            className={`min-h-[72px] p-4 rounded-2xl font-black text-sm flex items-center justify-between border transition-all ${
              dockArrived
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-xl shadow-amber-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div>{dockArrived ? 'Dock Geofence Triggered' : '1-Tap Arrived at Dock'}</div>
                <div className="text-[11px] font-normal opacity-80">
                  {dockArrived ? 'Detention Clock Running' : 'Starts automated detention timer'}
                </div>
              </div>
            </div>
            {dockArrived && (
              <span className="text-xs font-mono font-bold bg-emerald-950 px-2 py-1 rounded">
                +{detentionMinutes}m Wait
              </span>
            )}
          </button>

          {/* Proof of Delivery Document & Simulated OCR Trigger Button */}
          {effectivePoD ? (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/60 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => setViewingDocModal(effectivePoD)}
                  className="w-12 h-12 rounded-xl bg-slate-900 border border-emerald-500/40 overflow-hidden cursor-pointer hover:scale-105 transition-transform shrink-0"
                >
                  <img src={effectivePoD.image_url} alt="BoL Thumb" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>PoD Captured &bull; OCR Verified ({effectivePoD.ocr_confidence_pct}%)</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">
                    {effectivePoD.consignee_name} &bull; {effectivePoD.received_pallets} Pallets
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    BoL: {effectivePoD.bol_number} &bull; Seal #{effectivePoD.seal_number} {effectivePoD.seal_intact ? 'Intact' : 'Broken'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingDocModal(effectivePoD)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                  title="View Document"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Inspect</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPoDScanner(true)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                  title="Rescan"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Rescan</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              id="capture-pod-btn"
              onClick={() => setShowPoDScanner(true)}
              className="min-h-[72px] p-4 rounded-2xl font-black text-sm flex items-center justify-between border transition-all bg-gradient-to-r from-slate-800 via-slate-800 to-indigo-950/60 hover:from-slate-750 hover:to-indigo-900/80 text-white border-slate-700 shadow-xl group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span>Capture Proof of Delivery (PoD)</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      OCR TRIGGER
                    </span>
                  </div>
                  <div className="text-[11px] font-normal text-slate-400">
                    Snap or upload BoL document &bull; Simulated AI extraction &bull; Auto-logs to Order History
                  </div>
                </div>
              </div>
              <Scan className="w-5 h-5 text-amber-400 shrink-0 group-hover:rotate-12 transition-transform" />
            </button>
          )}
        </div>

        {/* Real-Time Dispatcher-to-Driver In-Cab Comms & Quick Updates */}
        <DriverCabChat
          driver={driver}
          dispatcherName="Corey Barron"
          dispatcherTerminal="Waterloo HQ Hub"
          themeMode={highContrastNight ? 'dark' : 'day'}
        />

        {/* Digital Bill of Lading (BoL) & E-Signature Pad */}
        <div className={`p-6 rounded-2xl border space-y-4 ${
          highContrastNight ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-300'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-800">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold">
                Consignee Delivery Proof &amp; E-Signature Pad
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Legally Binding FMCSA e-BoL
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Receiver sign with finger or mouse:</span>
              <button
                type="button"
                onClick={handleClearSignature}
                className="text-amber-500 hover:underline font-semibold"
              >
                Clear Pad
              </button>
            </div>

            {/* Canvas */}
            <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-950/80">
              <canvas
                ref={canvasRef}
                width={650}
                height={140}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-32 touch-none cursor-crosshair"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <input
              type="text"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white sm:w-64"
              placeholder="Signer Full Name & Title"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveSignature}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700"
              >
                {signatureSaved ? 'Signature Stored' : 'Lock Signature'}
              </button>

              <button
                id="driver-confirm-delivery-btn"
                onClick={handleCompleteTrip}
                disabled={!activeOrder}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirm Delivery Complete</span>
              </button>
            </div>
          </div>

          {completedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Delivery confirmed! BoL Proof and OCR audit log processed into Order History.</span>
              </div>
              {onOpenOrderHistoryTab && (
                <button
                  type="button"
                  onClick={onOpenOrderHistoryTab}
                  className="text-xs text-emerald-400 hover:underline font-bold shrink-0"
                >
                  View in Order Archive &rarr;
                </button>
              )}
            </div>
          )}
        </div>

        {/* In-Cab Order History & Event Log Accordion */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistorySection(!showHistorySection)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-sky-400" />
              <div>
                <span className="text-xs font-bold text-white block">
                  In-Cab Order History &amp; Delivery Audit Trail
                </span>
                <span className="text-[11px] text-slate-400">
                  {activeOrder?.history?.length || 0} Registered timeline events for {activeOrder?.order_id || 'Active Load'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-xs font-semibold">{showHistorySection ? 'Hide' : 'Expand'}</span>
              {showHistorySection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showHistorySection && (
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 space-y-3">
              {activeOrder?.history && activeOrder.history.length > 0 ? (
                <div className="space-y-2.5">
                  {activeOrder.history.map((h, i) => (
                    <div key={h.id || i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            h.event_type === 'Delivered' ? 'bg-emerald-500/20 text-emerald-300' :
                            h.event_type === 'OCR Processed' ? 'bg-amber-500/20 text-amber-300' :
                            h.event_type === 'PoD Captured' ? 'bg-sky-500/20 text-sky-300' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {h.event_type}
                          </span>
                          <span className="text-[11px] text-slate-400">{h.actor}</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{h.description}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{h.timestamp}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No previous events recorded yet for this shipment. Capture a PoD or confirm delivery to register events into order history.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Proof of Delivery Scanner Modal */}
      {activeOrder && (
        <ProofOfDeliveryScanner
          order={activeOrder}
          driver={driver}
          isOpen={showPoDScanner}
          onClose={() => setShowPoDScanner(false)}
          onProcessPoD={handleProcessPoD}
        />
      )}

      {/* High-Res Document Viewer Modal */}
      {viewingDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">
                  Proof of Delivery BoL &bull; {viewingDocModal.bol_number}
                </span>
              </div>
              <button
                onClick={() => setViewingDocModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-950 flex items-center justify-center">
              <img
                src={viewingDocModal.image_url}
                alt="Full Bill of Lading"
                className="max-h-[70vh] w-auto object-contain rounded-lg border border-slate-800 shadow-2xl"
              />
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs">
              <div className="text-slate-400">
                Consignee: <strong className="text-white">{viewingDocModal.consignee_name}</strong> &bull; OCR Match: <strong className="text-emerald-400">{viewingDocModal.ocr_confidence_pct}%</strong>
              </div>
              <button
                onClick={() => setViewingDocModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

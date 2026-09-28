import React, { useState } from 'react';
import { 
  Send, Radio, MessageSquare, AlertTriangle, ShieldCheck, 
  CheckCircle2, Clock, User, Truck, Volume2, Sparkles, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { Driver, Equipment, OperatorProfile } from '../types';

export interface PredefinedStatusTemplate {
  id: string;
  title: string;
  category: string;
  message: string;
  suggestedPriority: 'normal' | 'urgent';
  iconColor: string;
}

export interface QuickMessageRecord {
  id: string;
  timestamp: string;
  driverId: string;
  driverName: string;
  truckId: string;
  templateCategory: string;
  messageText: string;
  priority: 'normal' | 'urgent';
  status: 'Transmitted' | 'Delivered' | 'Read by Driver';
  sender: string;
}

const PREDEFINED_TEMPLATES: PredefinedStatusTemplate[] = [
  {
    id: 'tmpl-customs',
    title: 'Customs Pre-Arrival Cleared',
    category: 'Customs',
    message: 'Customs Clearance Verified — Pre-Arrival Processing (PAPS/PARS) Accepted. Proceed directly to FAST commercial lane at crossing.',
    suggestedPriority: 'normal',
    iconColor: 'text-emerald-400'
  },
  {
    id: 'tmpl-dock',
    title: 'Consignee Dock Door Assigned',
    category: 'Dock & Receiving',
    message: 'Consignee Dock Door #18 Assigned at receiver facility. Check in with receiving clerk using electronic BoL barcode.',
    suggestedPriority: 'normal',
    iconColor: 'text-sky-400'
  },
  {
    id: 'tmpl-weather',
    title: 'Corridor Severe Weather Alert',
    category: 'Safety & Weather',
    message: 'Severe Weather Warning on Corridor: Crosswinds exceeding 45 mph and localized squalls. Reduce highway speed to 50 MPH and increase following distance.',
    suggestedPriority: 'urgent',
    iconColor: 'text-amber-400'
  },
  {
    id: 'tmpl-hos',
    title: 'Mandatory HOS Rest Break',
    category: 'HOS Compliance',
    message: 'Mandatory 30-Minute Rest Break Required within next 40 miles. Authorized truck parking available at ONroute Woodstock / Ingersoll.',
    suggestedPriority: 'urgent',
    iconColor: 'text-rose-400'
  },
  {
    id: 'tmpl-priority',
    title: 'Expedited Priority Freight Notice',
    category: 'Priority Freight',
    message: 'High-Priority JIT Automotive Freight — Maintain transit schedule. Consignee production line waiting; ETA tracking live.',
    suggestedPriority: 'normal',
    iconColor: 'text-indigo-400'
  },
  {
    id: 'tmpl-fuel',
    title: 'Contract Fueling Stop Routing',
    category: 'Fuel Optimization',
    message: 'Optimal Bulk Fuel Routing: Pilot Flying J Exit 142 authorized on Fleet One card ($5.85 CAD/gal). Fill main and auxiliary tanks.',
    suggestedPriority: 'normal',
    iconColor: 'text-emerald-400'
  },
  {
    id: 'tmpl-detention',
    title: 'Detention Pay Activated (>2h)',
    category: 'Detention & Pay',
    message: 'Consignee dock detention approved at $95 CAD/hr. Log arrived time in In-Cab tablet and secure signed gate pass from guard.',
    suggestedPriority: 'normal',
    iconColor: 'text-amber-400'
  },
  {
    id: 'tmpl-maintenance',
    title: 'ECM Diagnostic Service Flag',
    category: 'Maintenance',
    message: 'CAN-Bus Telematics Warning: Engine ECM logged sensor threshold flag. Pull into Cambridge Yard Bay 2 for inspection at end of leg.',
    suggestedPriority: 'urgent',
    iconColor: 'text-rose-400'
  }
];

const INITIAL_QUICK_MESSAGES: QuickMessageRecord[] = [
  {
    id: 'qm-101',
    timestamp: '11:35 EDT',
    driverId: 'DRV-742',
    driverName: 'Wayne MacLeod',
    truckId: 'TRK-104',
    templateCategory: 'Customs',
    messageText: 'Customs Clearance Verified — Pre-Arrival Processing (PAPS/PARS) Accepted. Proceed directly to FAST commercial lane at crossing.',
    priority: 'normal',
    status: 'Delivered',
    sender: 'Corey Barron (Waterloo Dispatch)'
  },
  {
    id: 'qm-102',
    timestamp: '11:10 EDT',
    driverId: 'DRV-931',
    driverName: 'Marc Beaulieu',
    truckId: 'TRK-145',
    templateCategory: 'Safety & Weather',
    messageText: 'Severe Weather Warning on Corridor: Crosswinds exceeding 45 mph. Reduce highway speed to 50 MPH.',
    priority: 'urgent',
    status: 'Read by Driver',
    sender: 'Corey Barron (Waterloo Dispatch)'
  }
];

interface DispatchQuickMessagePanelProps {
  drivers: Driver[];
  equipment: Equipment[];
  activeOperator?: OperatorProfile;
  initialDriverId?: string;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const DispatchQuickMessagePanel: React.FC<DispatchQuickMessagePanelProps> = ({
  drivers,
  equipment,
  activeOperator,
  initialDriverId,
  isModal = false,
  onCloseModal
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    initialDriverId || drivers[0]?.driver_id || 'DRV-742'
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-customs');
  const [customMessage, setCustomMessage] = useState<string>(PREDEFINED_TEMPLATES[0].message);
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [messagesLog, setMessagesLog] = useState<QuickMessageRecord[]>(INITIAL_QUICK_MESSAGES);
  const [isSending, setIsSending] = useState(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState<string | null>(null);
  const [showRecentFeed, setShowRecentFeed] = useState(true);

  const selectedDriver = drivers.find(d => d.driver_id === selectedDriverId) || drivers[0];
  const assignedTruck = equipment.find(e => e.unit_id === selectedDriver?.current_truck_id) || equipment[0];

  const handleSelectTemplate = (tmpl: PredefinedStatusTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setCustomMessage(tmpl.message);
    setPriority(tmpl.suggestedPriority);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim() || !selectedDriver) return;

    setIsSending(true);
    setTransmissionSuccess(null);

    setTimeout(() => {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' EDT';
      const tmpl = PREDEFINED_TEMPLATES.find(t => t.id === selectedTemplateId);

      const newRecord: QuickMessageRecord = {
        id: `qm-${Date.now()}`,
        timestamp: nowStr,
        driverId: selectedDriver.driver_id,
        driverName: selectedDriver.name,
        truckId: assignedTruck.unit_id,
        templateCategory: tmpl?.category || 'General Dispatch',
        messageText: customMessage,
        priority,
        status: 'Delivered',
        sender: activeOperator ? `${activeOperator.name} (${activeOperator.terminal})` : 'Waterloo Dispatch Console'
      };

      setMessagesLog(prev => [newRecord, ...prev]);
      setIsSending(false);
      setTransmissionSuccess(
        `Instant Status Alert successfully transmitted to Driver ${selectedDriver.name} (${assignedTruck.unit_id}) via In-Cab Tablet / Omnitracs CAN-Bus stream.`
      );

      setTimeout(() => {
        setTransmissionSuccess(null);
      }, 5000);
    }, 600);
  };

  const content = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Driver In-Cab Quick-Message Interface
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Omnitracs Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Transmit standardized operational status alerts directly to driver ELD in-cab screens
            </p>
          </div>
        </div>

        {isModal && onCloseModal && (
          <button 
            onClick={onCloseModal} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors self-start sm:self-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Success Banner */}
      {transmissionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{transmissionSuccess}</span>
        </div>
      )}

      {/* Driver & Tractor Target Selector */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            Select Recipient Driver &amp; Active Power Unit
          </span>
          <span className="text-[11px] font-mono text-slate-400 font-normal">
            {drivers.length} Active Fleet Drivers
          </span>
        </label>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {drivers.slice(0, 4).map((d) => {
            const isSelected = d.driver_id === selectedDriverId;
            const truck = equipment.find(e => e.unit_id === d.current_truck_id);

            return (
              <div
                key={d.driver_id}
                onClick={() => setSelectedDriverId(d.driver_id)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{d.name}</span>
                  <span className="text-[10px] font-mono text-amber-400">{d.driver_id}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                  <span>{truck ? truck.unit_id : 'Yard Standby'}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    d.duty_status === 'Driving' ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-400'
                  }`}>
                    {d.duty_status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pre-Defined Status Templates Carousel / Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Pre-Defined Status Update Templates
          </span>
          <span className="text-[11px] text-slate-400">
            Click template to load into transmission buffer
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PREDEFINED_TEMPLATES.map((tmpl) => {
            const isSelected = tmpl.id === selectedTemplateId;
            return (
              <button
                type="button"
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs space-y-1 ${
                  isSelected
                    ? 'bg-slate-800 border-amber-500 text-white shadow-md ring-1 ring-amber-500/40'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                    {tmpl.category}
                  </span>
                  {tmpl.suggestedPriority === 'urgent' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold">
                      URGENT
                    </span>
                  )}
                </div>
                <div className="font-bold text-white text-[11px] truncate">
                  {tmpl.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compose & Transmit Box */}
      <form onSubmit={handleSendMessage} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            Message Payload for Driver {selectedDriver?.name} ({assignedTruck?.unit_id})
          </label>

          {/* Priority Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setPriority('normal')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                priority === 'normal'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Normal Notification</span>
            </button>
            <button
              type="button"
              onClick={() => setPriority('urgent')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                priority === 'urgent'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3 h-3" />
              <span>Urgent In-Cab Chime</span>
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 leading-relaxed font-mono"
          placeholder="Enter custom dispatcher instructions or review template payload..."
          required
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400 font-mono">
            Carrier Link: Omnitracs Satellite/LTE &bull; AES-256 Encrypted
          </span>

          <button
            type="submit"
            disabled={isSending || !customMessage.trim()}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
              isSending || !customMessage.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 hover:scale-[1.02]'
            }`}
          >
            <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
            <span>{isSending ? 'Transmitting to Cab...' : 'Transmit Status Alert'}</span>
          </button>
        </div>
      </form>

      {/* Transmission History & Audit Feed */}
      <div className="space-y-2">
        <div 
          onClick={() => setShowRecentFeed(prev => !prev)}
          className="flex items-center justify-between cursor-pointer py-1 text-xs text-slate-400 hover:text-white"
        >
          <span className="font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Recent Dispatched Quick-Messages ({messagesLog.length})
          </span>
          <div className="flex items-center gap-1">
            <span>{showRecentFeed ? 'Collapse Feed' : 'Expand Feed'}</span>
            {showRecentFeed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>

        {showRecentFeed && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {messagesLog.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{log.driverName}</span>
                    <span className="font-mono text-amber-400 text-[11px]">({log.truckId})</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                      {log.templateCategory}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      log.priority === 'urgent'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}>
                      {log.priority.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{log.timestamp}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  &ldquo;{log.messageText}&rdquo;
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                  <span>Sent by: {log.sender}</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{log.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
      {content}
    </div>
  );
};

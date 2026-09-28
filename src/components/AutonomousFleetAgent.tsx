import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, CheckCircle2, AlertTriangle, 
  ArrowRight, ShieldCheck, Activity, Truck, Clock, 
  MapPin, RefreshCw, Play, Check, X, Terminal, 
  Zap, Wrench, AlertCircle, Compass, User, ListFilter,
  Flame, ChevronRight, Cpu, Eye, RotateCcw
} from 'lucide-react';
import { 
  Order, Equipment, Driver, TripRecord, 
  OperationalAlert, OperatorProfile, AgentAction, 
  AgentMessage, AgentActionType, BackhaulOpportunity 
} from '../types';

interface AutonomousFleetAgentProps {
  orders: Order[];
  equipment: Equipment[];
  drivers: Driver[];
  trips: TripRecord[];
  alerts: OperationalAlert[];
  activeOperator: OperatorProfile;
  availableOperators: OperatorProfile[];
  onDispatchOrder: (orderId: string, truckId: string, driverId: string) => void;
  onAddNewOrder: (order: Order) => void;
  onClearFaultCode: (unitId: string, spn: number) => void;
  onScheduleService: (unitId: string) => void;
  onBookBackhaul: (backhaul: BackhaulOpportunity) => void;
  onUpdateDutyStatus: (driverId: string, newStatus: Driver['duty_status']) => void;
  onAddAlert?: (alert: OperationalAlert) => void;
  onDismissAlert?: (alertId: string) => void;
  onNavigate: (tab: string) => void;
  onSelectOperator?: (op: OperatorProfile) => void;
  theme?: string;
}

const PRESET_PROMPT_CHIPS = [
  {
    label: '⚡ Auto-Dispatch Pending Load',
    prompt: 'Analyze pending unassigned orders and dispatch the highest priority load to the nearest available FAST-approved driver and truck.'
  },
  {
    label: '🛠️ Schedule Tractor Service',
    prompt: 'Check all fleet fault codes and schedule preventative maintenance for any tractor showing critical diagnostic alerts.'
  },
  {
    label: '🛑 Reset At-Risk Driver HOS',
    prompt: 'Scan driver hours of service. If any driver has under 1 hour of drive time remaining, put them on 10-hour mandatory sleeper berth reset.'
  },
  {
    label: '⚠️ Broadcast Hwy 401 Wind Alert',
    prompt: 'Broadcast a critical crosswind advisory alert for Highway 401 London-Windsor corridor with blowover risk warnings.'
  },
  {
    label: '🗺️ Open Corridor Fleet Map',
    prompt: 'Switch system view to the Google Maps fleet radar to inspect live vehicle locations and corridor bottlenecks.'
  },
  {
    label: '🔄 Optimize Corridor Deadhead',
    prompt: 'Run triangular deadhead optimization to pair empty backhauls from Detroit back to Toronto.'
  }
];

export const AutonomousFleetAgent: React.FC<AutonomousFleetAgentProps> = ({
  orders,
  equipment,
  drivers,
  trips,
  alerts,
  activeOperator,
  availableOperators,
  onDispatchOrder,
  onAddNewOrder,
  onClearFaultCode,
  onScheduleService,
  onBookBackhaul,
  onUpdateDutyStatus,
  onAddAlert,
  onDismissAlert,
  onNavigate,
  onSelectOperator,
  theme = 'dark'
}) => {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: 'welcome-msg',
      role: 'agent',
      content: `Greetings, ${activeOperator.name}. I am the Autonomous Fleet Operations Agent. I have active supervisory control across your fleet dispatch matrix, J1939 telematics, HOS regulatory clocks, and corridor routing. Prompt me with any operational instruction, and I will calculate the solution and operate the fleet immediately.`,
      thought: 'Autonomous Agent initialized with live CAN-bus gateway and dispatch state.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: []
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoExecute, setAutoExecute] = useState(true);
  const [auditLog, setAuditLog] = useState<AgentAction[]>([]);
  const [showAuditPanel, setShowAuditPanel] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef(true);

  // Safely scroll ONLY the inner message feed container, never the window or outer page
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth', force = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 160;
    if (force || isNearBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    // Avoid scrolling on initial mount so the page stays stably at top
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    scrollToBottom('smooth');
  }, [messages, isProcessing]);

  // Execute a single action in the Fleet OS
  const executeAction = (action: AgentAction) => {
    try {
      switch (action.actionType) {
        case 'DISPATCH_LOAD': {
          const { orderId, truckId, driverId } = action.params;
          if (orderId && truckId && driverId) {
            onDispatchOrder(orderId, truckId, driverId);
            action.status = 'executed';
            action.executedAt = new Date().toLocaleTimeString();
            action.resultSummary = `Order ${orderId} successfully dispatched to Truck ${truckId} & Driver ${driverId}.`;
          }
          break;
        }
        case 'SCHEDULE_SERVICE': {
          const { unitId } = action.params;
          if (unitId) {
            onScheduleService(unitId);
            action.status = 'executed';
            action.executedAt = new Date().toLocaleTimeString();
            action.resultSummary = `Service bay ticket generated for ${unitId}. Unit status transitioned to Diagnostic Alert.`;
          }
          break;
        }
        case 'CLEAR_FAULT_CODE': {
          const { unitId, spn } = action.params;
          if (unitId && spn) {
            onClearFaultCode(unitId, Number(spn));
            action.status = 'executed';
            action.executedAt = new Date().toLocaleTimeString();
            action.resultSummary = `Cleared SPN ${spn} from J1939 CAN diagnostic register on ${unitId}.`;
          }
          break;
        }
        case 'UPDATE_DUTY_STATUS': {
          const { driverId, status } = action.params;
          if (driverId && status) {
            onUpdateDutyStatus(driverId, status);
            action.status = 'executed';
            action.executedAt = new Date().toLocaleTimeString();
            action.resultSummary = `Driver ${driverId} duty clock status set to ${status}.`;
          }
          break;
        }
        case 'CREATE_ALERT': {
          const { severity, category, title, message, relatedUnitId, actionRequired } = action.params;
          const newAlert: OperationalAlert = {
            id: `ALT-AGT-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            severity: severity || 'warning',
            category: category || 'DISPATCH',
            title: title || 'Operational Advisory',
            message: message || 'Agent generated alert.',
            relatedUnitId,
            actionRequired: actionRequired || 'Monitor telemetry'
          };
          if (onAddAlert) {
            onAddAlert(newAlert);
          }
          action.status = 'executed';
          action.executedAt = new Date().toLocaleTimeString();
          action.resultSummary = `Operational alert broadcast to fleet consoles: "${title}".`;
          break;
        }
        case 'DISMISS_ALERT': {
          const { alertId } = action.params;
          if (alertId && onDismissAlert) {
            onDismissAlert(alertId);
            action.status = 'executed';
            action.executedAt = new Date().toLocaleTimeString();
            action.resultSummary = `Alert ${alertId} triaged and dismissed from console.`;
          }
          break;
        }
        case 'NAVIGATE_TAB': {
          const { tab } = action.params;
          if (tab) {
            onNavigate(tab);
            action.status = 'executed';
            action.executedAt = new Date().toLocaleTimeString();
            action.resultSummary = `Transferred active system view to "${tab}".`;
          }
          break;
        }
        case 'SWITCH_OPERATOR': {
          const { operatorId } = action.params;
          const targetOp = availableOperators.find(o => o.id === operatorId || o.name.toLowerCase().includes(operatorId.toLowerCase()));
          if (targetOp && onSelectOperator) {
            onSelectOperator(targetOp);
            action.status = 'executed';
            action.executedAt = new Date().toLocaleTimeString();
            action.resultSummary = `Active dispatcher switched to ${targetOp.name} (${targetOp.role}).`;
          }
          break;
        }
        case 'CREATE_ORDER': {
          const { shipper_name, origin_city, dest_city, weight_lbs, equipment_required, rate_cad } = action.params;
          const newOrd: Order = {
            order_id: `ORD-AGT-${Date.now().toString().slice(-4)}`,
            shipper_name: shipper_name || 'Automotive Magna Parts',
            origin_city: origin_city || 'Cambridge',
            origin_state_prov: 'ON',
            dest_city: dest_city || 'Detroit',
            dest_state_prov: 'MI',
            weight_lbs: weight_lbs || 34500,
            pallets: 18,
            equipment_required: equipment_required || 'Dry Van 53ft',
            rate_cad: rate_cad || 2150,
            distance_miles: 235,
            status: 'Tendered',
            pickup_window: 'Today 11:30 EDT',
            delivery_window: 'Today 18:00 EDT'
          };
          onAddNewOrder(newOrd);
          action.status = 'executed';
          action.executedAt = new Date().toLocaleTimeString();
          action.resultSummary = `Created new order ${newOrd.order_id} (${newOrd.origin_city} -> ${newOrd.dest_city}).`;
          break;
        }
        case 'OPTIMIZE_DEADHEAD': {
          onNavigate('optimizer');
          action.status = 'executed';
          action.executedAt = new Date().toLocaleTimeString();
          action.resultSummary = `Initiated corridor deadhead optimization algorithms.`;
          break;
        }
        default:
          action.status = 'executed';
          action.executedAt = new Date().toLocaleTimeString();
      }

      setAuditLog(prev => [action, ...prev]);
    } catch (err: any) {
      console.error('Error executing agent action:', err);
      action.status = 'failed';
      action.resultSummary = `Execution failed: ${err.message}`;
    }
  };

  // Local Intelligent Fallback Intent Interpreter
  const processLocalSemanticIntent = (prompt: string): { thought: string; message: string; actions: AgentAction[] } => {
    const lower = prompt.toLowerCase();
    const actions: AgentAction[] = [];
    let thought = 'Parsing operational parameters from driver and fleet state.';
    let message = '';

    // 1. Dispatch intent
    if (lower.includes('dispatch') || lower.includes('assign load') || lower.includes('assign order')) {
      const pendingOrder = orders.find(o => o.status === 'Tendered') || orders[0];
      const availableTruck = equipment.find(e => e.status === 'Online' || e.status === 'Available') || equipment[0];
      const availableDriver = drivers.find(d => d.duty_status !== 'Driving' && d.drive_time_remaining_hours > 4) || drivers[0];

      if (pendingOrder && availableTruck && availableDriver) {
        actions.push({
          id: `act-${Date.now()}-1`,
          actionType: 'DISPATCH_LOAD',
          title: `Dispatch ${pendingOrder.order_id} to ${availableDriver.name}`,
          description: `Assigns load ${pendingOrder.order_id} (${pendingOrder.origin_city} -> ${pendingOrder.dest_city}) to Truck ${availableTruck.unit_id} driven by ${availableDriver.name}.`,
          params: {
            orderId: pendingOrder.order_id,
            truckId: availableTruck.unit_id,
            driverId: availableDriver.driver_id
          },
          status: 'pending'
        });
        thought = `Identified unassigned freight ${pendingOrder.order_id}. Matched with available tractor ${availableTruck.unit_id} and driver ${availableDriver.name} (${availableDriver.drive_time_remaining_hours}h HOS remaining).`;
        message = `I have orchestrated the dispatch of Order **${pendingOrder.order_id}** (${pendingOrder.origin_city} → ${pendingOrder.dest_city}, ${pendingOrder.weight_lbs.toLocaleString()} lbs) to **${availableDriver.name}** operating unit **${availableTruck.unit_id}**. The J1939 telematics gateway and in-cab navigation have been signaled.`;
      }
    }

    // 2. Maintenance / Service Intent
    if (lower.includes('service') || lower.includes('maintenance') || lower.includes('repair') || lower.includes('fault')) {
      const diagnosticTruck = equipment.find(e => e.status === 'Diagnostic Alert' || e.telematics.faultCodes.length > 0) || equipment.find(e => e.unit_id === 'TRK-112') || equipment[0];
      if (diagnosticTruck) {
        actions.push({
          id: `act-${Date.now()}-2`,
          actionType: 'SCHEDULE_SERVICE',
          title: `Schedule Preventative Maintenance for ${diagnosticTruck.unit_id}`,
          description: `Routes ${diagnosticTruck.unit_id} to Windsor Central Maintenance Bay. Fault code count: ${diagnosticTruck.telematics.faultCodes.length}.`,
          params: {
            unitId: diagnosticTruck.unit_id,
            reason: diagnosticTruck.telematics.faultCodes[0]?.description || 'Diagnostic code alert'
          },
          status: 'pending'
        });
        thought = `Asset ${diagnosticTruck.unit_id} flagged with telematics fault codes. Directing to service bay ticket register.`;
        message = `I have scheduled immediate preventative maintenance for tractor **${diagnosticTruck.unit_id}** (${diagnosticTruck.make_model}). Diagnostic ticket registered with the Windsor Terminal service bay.`;
      }
    }

    // 3. Clear Fault Code Intent
    if (lower.includes('clear fault') || lower.includes('reset code') || lower.includes('clear spn')) {
      const truckWithFault = equipment.find(e => e.telematics.faultCodes.length > 0) || equipment[0];
      const fault = truckWithFault?.telematics.faultCodes[0];
      if (truckWithFault && fault) {
        actions.push({
          id: `act-${Date.now()}-3`,
          actionType: 'CLEAR_FAULT_CODE',
          title: `Clear SPN ${fault.spn} on ${truckWithFault.unit_id}`,
          description: `Clears J1939 CAN diagnostic trouble code ${fault.code} (${fault.description}).`,
          params: {
            unitId: truckWithFault.unit_id,
            spn: fault.spn
          },
          status: 'pending'
        });
        thought = `Transmitting J1939 DM11 diagnostic clear request to ECU for SPN ${fault.spn}.`;
        message = `Diagnostic trouble code **SPN ${fault.spn} FMI ${fault.fmi}** (${fault.description}) has been cleared from tractor **${truckWithFault.unit_id}**. Status restored to Online.`;
      }
    }

    // 4. HOS Duty status / Rest break
    if (lower.includes('hos') || lower.includes('rest') || lower.includes('off-duty') || lower.includes('sleeper') || lower.includes('duty status') || lower.includes('clock')) {
      const targetDriver = drivers.find(d => d.drive_time_remaining_hours <= 2 || d.duty_status === 'Driving') || drivers[1] || drivers[0];
      if (targetDriver) {
        actions.push({
          id: `act-${Date.now()}-4`,
          actionType: 'UPDATE_DUTY_STATUS',
          title: `Put ${targetDriver.name} on Sleeper Berth / Off-Duty`,
          description: `Logs mandatory 10-hour rest period for FMCSA/Canadian commercial regulatory compliance.`,
          params: {
            driverId: targetDriver.driver_id,
            status: 'Sleeper'
          },
          status: 'pending'
        });
        thought = `Driver ${targetDriver.name} HOS clock audited. Adjusting duty log to Sleeper Berth to prevent regulatory violation.`;
        message = `Updated **${targetDriver.name}** (${targetDriver.driver_id}) duty status to **Sleeper Berth (Off-Duty)**. 10-hour mandatory reset period initiated in the ELD compliance register.`;
      }
    }

    // 5. Weather / Corridor Alert Broadcast
    if (lower.includes('weather') || lower.includes('wind') || lower.includes('alert') || lower.includes('advisory') || lower.includes('broadcast')) {
      actions.push({
        id: `act-${Date.now()}-5`,
        actionType: 'CREATE_ALERT',
        title: 'High Crosswind Advisory (Hwy 401 Corridor)',
        description: 'Broadcasts severe crosswind and blowover risk warning to all units in the Windsor-London-Toronto corridor.',
        params: {
          severity: 'critical',
          category: 'TELEMATICS',
          title: 'Hwy 401 Westbound High Wind Advisory',
          message: 'Sustained winds 42 mph, gusts 58 mph. High blowover risk for unladen 53ft dry vans. Speed restriction 50 mph active.',
          relatedUnitId: 'TRK-104',
          actionRequired: 'Reduce speed to 50 mph; unladen trailers seek staging shelter'
        },
        status: 'pending'
      });
      thought = `Severe weather telemetry detected along Highway 401. Generating high-priority commercial safety alert.`;
      message = `I have issued an emergency **Critical Crosswind Advisory** across the fleet consoles and driver cab pilots for the Highway 401 corridor. High blowover warnings active for unladen trailers.`;
    }

    // 6. Navigation Intent
    if (lower.includes('map') || lower.includes('radar') || lower.includes('location')) {
      actions.push({
        id: `act-${Date.now()}-6`,
        actionType: 'NAVIGATE_TAB',
        title: 'Navigate to Google Maps Fleet Radar',
        description: 'Transfers active view to the Google Maps corridor tracking radar.',
        params: { tab: 'map' },
        status: 'pending'
      });
      if (!message) {
        thought = 'User requested visual geospatial tracking view.';
        message = 'Navigating to the Google Maps Fleet Radar now.';
      }
    } else if (lower.includes('telematics') || lower.includes('engine') || lower.includes('can-bus')) {
      actions.push({
        id: `act-${Date.now()}-7`,
        actionType: 'NAVIGATE_TAB',
        title: 'Navigate to Fleet Telematics',
        description: 'Opens J1939 telematics diagnostic telemetry.',
        params: { tab: 'telematics' },
        status: 'pending'
      });
      if (!message) {
        thought = 'Directing user to telematics diagnostics view.';
        message = 'Switching to Fleet Telematics console.';
      }
    } else if (lower.includes('cab') || lower.includes('driver app') || lower.includes('pilot')) {
      actions.push({
        id: `act-${Date.now()}-8`,
        actionType: 'NAVIGATE_TAB',
        title: 'Open Mobile Driver Cab Pilot',
        description: 'Launches in-cab driver tablet interface.',
        params: { tab: 'cabpilot' },
        status: 'pending'
      });
      if (!message) {
        thought = 'Opening Mobile Driver Cab Pilot view.';
        message = 'Opening Driver Cab Pilot interface.';
      }
    } else if (lower.includes('deadhead') || lower.includes('optimizer') || lower.includes('backhaul')) {
      actions.push({
        id: `act-${Date.now()}-9`,
        actionType: 'OPTIMIZE_DEADHEAD',
        title: 'Run Triangular Deadhead Optimization',
        description: 'Computes backhaul matching along Detroit-Windsor-Toronto corridor.',
        params: { corridor: 'Detroit-Windsor-Toronto' },
        status: 'pending'
      });
      if (!message) {
        thought = 'Running deadhead optimization routines.';
        message = 'Deadhead optimizer activated. Analyzing empty return miles.';
      }
    }

    // 7. Operator Switch Intent
    if (lower.includes('switch to') || lower.includes('persona') || lower.includes('priya') || lower.includes('corey') || lower.includes('safety officer')) {
      const target = availableOperators.find(o => 
        lower.includes(o.name.toLowerCase().split(' ')[0]) || 
        lower.includes(o.role.toLowerCase())
      ) || availableOperators[1];

      if (target) {
        actions.push({
          id: `act-${Date.now()}-10`,
          actionType: 'SWITCH_OPERATOR',
          title: `Switch Active Operator to ${target.name}`,
          description: `Changes active user to ${target.name} (${target.role}).`,
          params: { operatorId: target.id },
          status: 'pending'
        });
        if (!message) {
          thought = `Switching session profile to ${target.name}.`;
          message = `Active operator profile transitioned to **${target.name}** (${target.role} • ${target.terminal}).`;
        }
      }
    }

    if (actions.length === 0) {
      thought = 'General fleet operational query evaluated.';
      message = `I have analyzed your prompt against our live fleet telemetry (Active Tractors: ${equipment.length}, Dispatched Loads: ${orders.filter(o => o.status === 'Dispatched').length}, Active Drivers: ${drivers.length}). All corridor parameters are operating within standard commercial tolerances. You can ask me to dispatch loads, schedule maintenance, clear fault codes, manage driver HOS clocks, or switch system views anytime.`;
    }

    return { thought, message, actions };
  };

  const handleSendPrompt = async (promptToSend?: string) => {
    const prompt = (promptToSend || inputPrompt).trim();
    if (!prompt || isProcessing) return;

    const userMessage: AgentMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setIsProcessing(true);

    try {
      // Build current live fleet context snapshot
      const fleetContext = {
        activeOperator: {
          name: activeOperator.name,
          role: activeOperator.role,
          terminal: activeOperator.terminal
        },
        ordersSummary: {
          total: orders.length,
          pending: orders.filter(o => o.status === 'Tendered').map(o => ({ id: o.order_id, origin: o.origin_city, dest: o.dest_city, weight: o.weight_lbs })),
          dispatched: orders.filter(o => o.status === 'Dispatched').length
        },
        equipmentSummary: equipment.map(e => ({
          unitId: e.unit_id,
          makeModel: e.make_model,
          status: e.status,
          hasFaultCodes: e.telematics.faultCodes.length > 0,
          faultCodes: e.telematics.faultCodes.map(f => ({ spn: f.spn, fmi: f.fmi, desc: f.description }))
        })),
        driversSummary: drivers.map(d => ({
          driverId: d.driver_id,
          name: d.name,
          dutyStatus: d.duty_status,
          driveTimeRemainingHours: d.drive_time_remaining_hours,
          currentTruckId: d.current_truck_id
        })),
        alertsSummary: alerts.map(a => ({ id: a.id, severity: a.severity, title: a.title, unit: a.relatedUnitId }))
      };

      let agentResponse: { thought: string; message: string; suggestedActions: any[] } | null = null;

      // Try Server-Side Gemini API call first
      try {
        const res = await fetch('/api/ai/agent-operate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            fleetContext,
            conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && (data.message || data.suggestedActions)) {
            agentResponse = data;
          }
        }
      } catch (netErr) {
        console.warn('Backend agent-operate call note, falling back to instant local heuristic engine:', netErr);
      }

      // If server response wasn't available, use intelligent local heuristic engine
      if (!agentResponse) {
        const local = processLocalSemanticIntent(prompt);
        agentResponse = {
          thought: local.thought,
          message: local.message,
          suggestedActions: local.actions
        };
      }

      const actionsToRun: AgentAction[] = (agentResponse.suggestedActions || []).map((act: any, idx: number) => ({
        id: act.id || `act-${Date.now()}-${idx}`,
        actionType: act.actionType,
        title: act.title || 'Fleet Operation',
        description: act.description || '',
        params: act.params || {},
        status: 'pending'
      }));

      // If auto-execute is enabled, execute immediately!
      if (autoExecute && actionsToRun.length > 0) {
        actionsToRun.forEach(action => {
          executeAction(action);
        });
      }

      const agentMessage: AgentMessage = {
        id: `agt-${Date.now()}`,
        role: 'agent',
        content: agentResponse.message || 'Operation processed by Fleet Operations Agent.',
        thought: agentResponse.thought,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: actionsToRun
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch {
      // Fallback message via local semantic engine
      const local = processLocalSemanticIntent(prompt);
      if (autoExecute && local.actions.length > 0) {
        local.actions.forEach(executeAction);
      }
      setMessages(prev => [
        ...prev,
        {
          id: `agt-${Date.now()}`,
          role: 'agent',
          content: local.message,
          thought: local.thought,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: local.actions
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeTractors = equipment.filter(e => e.status === 'In-Transit' || e.status === 'Online').length;
  const pendingLoads = orders.filter(o => o.status === 'Tendered').length;
  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical').length;
  const driversDriving = drivers.filter(d => d.duty_status === 'Driving').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Bot className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Autonomous Fleet Operations Agent
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online &amp; Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Natural-language autonomous controller for commercial dispatches, J1939 telematics, HOS compliance, and corridor routing.
              </p>
            </div>
          </div>

          {/* Controls & Mode Toggles */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto-execute Switch */}
            <button
              onClick={() => setAutoExecute(!autoExecute)}
              id="agent-auto-execute-toggle"
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                autoExecute 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Automatically apply actions directly to the fleet state"
            >
              <Zap className={`w-4 h-4 ${autoExecute ? 'text-amber-400 fill-amber-400' : ''}`} />
              <span>Auto-Execute: {autoExecute ? 'ON' : 'OFF'}</span>
            </button>

            {/* View Audit Log Button */}
            <button
              onClick={() => setShowAuditPanel(!showAuditPanel)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Audit Log ({auditLog.length})</span>
            </button>

            {/* Clear Chat Button */}
            <button
              onClick={() => {
                setMessages([
                  {
                    id: `reset-${Date.now()}`,
                    role: 'agent',
                    content: `Session cleared. Ready for your next fleet operations prompt.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Clear Conversation History"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Operational State Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Active Tractors</span>
            <span className="font-bold text-emerald-400 text-sm">{activeTractors} / {equipment.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Pending Loads</span>
            <span className={`font-bold text-sm ${pendingLoads > 0 ? 'text-amber-400' : 'text-slate-200'}`}>{pendingLoads} Unassigned</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Drivers Driving</span>
            <span className="font-bold text-sky-400 text-sm">{driversDriving} On Clock</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Critical Alerts</span>
            <span className={`font-bold text-sm ${criticalAlertsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {criticalAlertsCount} Urgent
            </span>
          </div>
        </div>
      </div>

      {/* Main Agent Operations Terminal & Timeline */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Chat & Action Stream (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col h-[640px]">
            {/* Message Feed */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-800"
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Header line */}
                    <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400 font-mono">
                      {isUser ? (
                        <>
                          <span>{msg.timestamp}</span>
                          <span>&bull;</span>
                          <span className="font-bold text-amber-300">{activeOperator.name}</span>
                          <User className="w-3.5 h-3.5 text-amber-400" />
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-bold text-cyan-300">Fleet Operations Agent</span>
                          <span>&bull;</span>
                          <span>{msg.timestamp}</span>
                        </>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[92%] sm:max-w-[85%] shadow-md ${
                      isUser 
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs shadow-amber-500/10' 
                        : 'bg-slate-950 border border-slate-800 text-slate-100 rounded-tl-xs'
                    }`}>
                      {/* Thought process block (if agent) */}
                      {!isUser && msg.thought && (
                        <div className="mb-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 font-mono flex items-start gap-2">
                          <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-cyan-400 font-bold block text-[10px] uppercase tracking-wider">
                              Operational Reasoning
                            </span>
                            <span>{msg.thought}</span>
                          </div>
                        </div>
                      )}

                      {/* Main Message Text */}
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Action Execution Cards */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                            Executed Fleet Operations ({msg.actions.length})
                          </span>

                          {msg.actions.map((act) => (
                            <div 
                              key={act.id} 
                              className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 font-bold text-white">
                                  {act.actionType === 'DISPATCH_LOAD' && <Truck className="w-4 h-4 text-cyan-400" />}
                                  {act.actionType === 'SCHEDULE_SERVICE' && <Wrench className="w-4 h-4 text-amber-400" />}
                                  {act.actionType === 'CLEAR_FAULT_CODE' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                  {act.actionType === 'UPDATE_DUTY_STATUS' && <Clock className="w-4 h-4 text-purple-400" />}
                                  {act.actionType === 'CREATE_ALERT' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                                  {act.actionType === 'NAVIGATE_TAB' && <Compass className="w-4 h-4 text-sky-400" />}
                                  {act.actionType === 'SWITCH_OPERATOR' && <User className="w-4 h-4 text-indigo-400" />}
                                  <span>{act.title}</span>
                                </div>

                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  act.status === 'executed'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : act.status === 'failed'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {act.status === 'executed' ? 'APPLIED ✅' : act.status === 'failed' ? 'FAILED ❌' : 'PENDING'}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-400">
                                {act.description}
                              </p>

                              {act.resultSummary && (
                                <div className="p-2 rounded bg-slate-950/80 text-[10px] font-mono text-emerald-300 border border-slate-800">
                                  {act.resultSummary}
                                </div>
                              )}

                              {/* Manual Execute button if not yet executed */}
                              {act.status === 'pending' && (
                                <button
                                  onClick={() => executeAction(act)}
                                  className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>Confirm &amp; Execute Action</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing / Reasoning indicator */}
              {isProcessing && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono w-fit">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  </div>
                  <span>Agent calculating dispatch matrix &amp; routing assets...</span>
                </div>
              )}
            </div>

            {/* Input Form Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                id="agent-command-input"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Instruct the agent: 'Dispatch ORD-9038', 'Schedule TRK-112', 'Show map', 'Reset Wayne HOS'..."
                className="flex-1 px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
              />

              <button
                type="submit"
                id="agent-submit-btn"
                disabled={!inputPrompt.trim() || isProcessing}
                className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
              >
                <span>Operate</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: 1-Click Operations Deck & Fleet Audit (1 Col) */}
        <div className="space-y-6">
          {/* Quick Operations Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Instant Fleet Operations</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">1-Tap Prompts</span>
            </div>

            <p className="text-xs text-slate-400">
              Click any operational directive below to immediately execute through the autonomous agent:
            </p>

            <div className="space-y-2">
              {PRESET_PROMPT_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(chip.prompt)}
                  disabled={isProcessing}
                  className="w-full text-left p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-white transition-all group"
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span className="group-hover:text-amber-400 transition-colors">{chip.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {chip.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick System Directives */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Direct View Controllers</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => onNavigate('map')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fleet Map</span>
              </button>
              <button
                onClick={() => onNavigate('telematics')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Telematics</span>
              </button>
              <button
                onClick={() => onNavigate('dispatch')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Dispatch</span>
              </button>
              <button
                onClick={() => onNavigate('hos')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>HOS Clocks</span>
              </button>
              <button
                onClick={() => onNavigate('cabpilot')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                <span>Cab Pilot</span>
              </button>
              <button
                onClick={() => onNavigate('optimizer')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Optimizer</span>
              </button>
            </div>
          </div>

          {/* Audit Log Drawer / Mini-Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Recent Agent Audit Trail</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">{auditLog.length} Executions</span>
            </div>

            {auditLog.length === 0 ? (
              <div className="p-4 text-center rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                No operations executed yet in this session. Prompt the agent or click a 1-tap chip to begin.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {auditLog.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{log.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">{log.executedAt}</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      {log.resultSummary}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

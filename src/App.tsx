/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppNavbar } from './components/AppNavbar';
import { DashboardOverview } from './components/DashboardOverview';
import { DispatchConsole } from './components/DispatchConsole';
import { FleetTelematics } from './components/FleetTelematics';
import { FreightOptimizer } from './components/FreightOptimizer';
import { DriverHOSCompliance } from './components/DriverHOSCompliance';
import { ReeferColdChain } from './components/ReeferColdChain';
import { EDIIntegrationHub } from './components/EDIIntegrationHub';
import { DriverCabPilot } from './components/DriverCabPilot';
import { AlertsModal } from './components/AlertsModal';
import { AIPredictiveAnalytics } from './components/AIPredictiveAnalytics';
import { MobileAppsSuite } from './components/MobileAppsSuite';
import { FleetGoogleMapView } from './components/FleetGoogleMapView';
import { WorkspaceHub } from './components/WorkspaceHub';
import { AppStartupLoader } from './components/AppStartupLoader';
import { AutonomousFleetAgent } from './components/AutonomousFleetAgent';

import { 
  INITIAL_ORDERS, 
  INITIAL_EQUIPMENT, 
  INITIAL_DRIVERS, 
  INITIAL_TRIPS, 
  INITIAL_ALERTS, 
  INITIAL_FREIGHT,
  INITIAL_OPERATOR_PROFILES
} from './data/fleetData';
import { Order, Equipment, Driver, TripRecord, OperationalAlert, FreightItem, DriverDutyStatus, BackhaulOpportunity, DriverPerformanceMetrics, OperatorProfile, ProofOfDeliveryDocument, OrderHistoryEntry } from './types';
import { Truck, ShieldCheck, MapPin } from 'lucide-react';
import { auth, onAuthStateChanged } from './services/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isCabMode, setIsCabMode] = useState<boolean>(false);
  const [showAlertsModal, setShowAlertsModal] = useState<boolean>(false);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'day'>(() => {
    try {
      const saved = localStorage.getItem('fleet_theme');
      return saved === 'day' ? 'day' : 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'day' : 'dark';
      try {
        localStorage.setItem('fleet_theme', next);
      } catch (e) {
        // ignore storage errors
      }
      return next;
    });
  };

  // Operator user profile state
  const [operators] = useState<OperatorProfile[]>(INITIAL_OPERATOR_PROFILES);
  const [activeOperator, setActiveOperator] = useState<OperatorProfile>(INITIAL_OPERATOR_PROFILES[0]);

  // Synchronize active operator with live Firebase user session
  React.useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      if (user) {
        const initials = (user.displayName || user.email || 'OP')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        setActiveOperator({
          id: user.uid,
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'Dispatcher'),
          role: user.isAnonymous ? 'Guest Dispatcher' : 'Authenticated Dispatcher',
          title: user.email || 'Commercial Fleet Terminal',
          terminal: 'Fleet Operations Center',
          avatarInitials: initials || 'DS'
        });
      } else {
        setActiveOperator(INITIAL_OPERATOR_PROFILES[0]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Core operational fleet state
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [trips, setTrips] = useState<TripRecord[]>(INITIAL_TRIPS);
  const [alerts, setAlerts] = useState<OperationalAlert[]>(INITIAL_ALERTS);
  const [freight, setFreight] = useState<FreightItem[]>(INITIAL_FREIGHT);

  // Active driver for CabPilot mode
  const activeCabDriver = drivers[0] || INITIAL_DRIVERS[0];
  const activeCabOrder = orders.find(o => o.assigned_driver_id === activeCabDriver?.driver_id) || orders[0];

  // Actions
  const handleDispatchOrder = (orderId: string, truckId: string, driverId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.order_id === orderId) {
        return {
          ...o,
          status: 'Dispatched',
          assigned_truck_id: truckId,
          assigned_driver_id: driverId
        };
      }
      return o;
    }));

    // Update equipment status
    setEquipment(prev => prev.map(eq => {
      if (eq.unit_id === truckId) {
        return { ...eq, status: 'In-Transit' };
      }
      return eq;
    }));

    // Deduct drive hours from driver and update truck assignment
    setDrivers(prev => prev.map(d => {
      if (d.driver_id === driverId) {
        const order = orders.find(o => o.order_id === orderId);
        const hoursSpent = order ? order.distance_miles / 52 : 3.5;
        return {
          ...d,
          current_truck_id: truckId,
          duty_status: 'Driving',
          drive_time_remaining_hours: Math.max(0.5, Number((d.drive_time_remaining_hours - hoursSpent).toFixed(2)))
        };
      }
      return d;
    }));
  };

  const handleAddNewOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  const handleClearFaultCode = (unitId: string, spn: number) => {
    setEquipment(prev => prev.map(eq => {
      if (eq.unit_id === unitId) {
        const updatedCodes = eq.telematics.faultCodes.filter(c => c.spn !== spn);
        return {
          ...eq,
          status: updatedCodes.length === 0 ? 'Online' : eq.status,
          telematics: {
            ...eq.telematics,
            faultCodes: updatedCodes
          }
        };
      }
      return eq;
    }));

    // remove matching alert
    setAlerts(prev => prev.filter(a => !(a.relatedUnitId === unitId && a.category === 'Mechanical')));
  };

  const handleScheduleService = (unitId: string) => {
    setEquipment(prev => prev.map(eq => {
      if (eq.unit_id === unitId) {
        return { ...eq, status: 'Diagnostic Alert' };
      }
      return eq;
    }));
  };

  const handleBookBackhaul = (backhaul: BackhaulOpportunity) => {
    // Convert backhaul into order
    const newOrder: Order = {
      order_id: `ORD-BKH-${backhaul.id.replace('BKH-', '')}`,
      shipper_name: backhaul.shipper,
      origin_city: backhaul.origin_city,
      origin_state_prov: 'MI',
      dest_city: backhaul.dest_city,
      dest_state_prov: 'ON',
      distance_miles: backhaul.distance_miles,
      weight_lbs: backhaul.weight_lbs,
      pallets: backhaul.pallets,
      equipment_required: backhaul.equipment,
      rate_cad: backhaul.rate_cad,
      pickup_window: '2026-09-13 14:00 EDT',
      status: 'Dispatched',
      assigned_truck_id: 'TRK-104',
      assigned_driver_id: 'DRV-742',
      notes: `Continuous return loop saving ${backhaul.deadhead_saved_miles} deadhead miles`
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const handleUpdateDutyStatus = (driverId: string, newStatus: DriverDutyStatus) => {
    setDrivers(prev => prev.map(d => {
      if (d.driver_id === driverId) {
        return { ...d, duty_status: newStatus };
      }
      return d;
    }));
  };

  const handleUpdateDriverPerformance = (driverId: string, updatedMetrics: DriverPerformanceMetrics) => {
    setDrivers(prev => prev.map(d => {
      if (d.driver_id === driverId) {
        return { ...d, performance: updatedMetrics };
      }
      return d;
    }));
  };

  const handleDefrostOverride = (sku: string) => {
    setFreight(prev => prev.map(f => {
      if (f.freight_sku === sku) {
        return {
          ...f,
          current_temp_c: f.target_temp_c,
          spoilage_status: 'Optimal',
          estimatedHoursToCritical: 48.0
        };
      }
      return f;
    }));

    // dismiss reefer alert
    setAlerts(prev => prev.filter(a => a.category !== 'ColdChain'));
  };

  const handleRerouteBorder = (borderTarget: string) => {
    setTrips(prev => prev.map(t => ({
      ...t,
      customs_delay_mins: 12,
      origin: t.origin,
      destination: `${t.destination} (via Sarnia 402)`
    })));

    setAlerts(prev => prev.filter(a => a.category !== 'Border'));
  };

  const handleTriageAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const handleAddNewAlert = (newAlert: OperationalAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleConfirmDelivery = (orderId: string, podDoc?: ProofOfDeliveryDocument) => {
    setOrders(prev => prev.map(o => {
      if (o.order_id === orderId) {
        const historyEntries: OrderHistoryEntry[] = o.history ? [...o.history] : [];
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' EDT';

        if (podDoc) {
          historyEntries.push({
            id: `hist-${Date.now()}-1`,
            timestamp: nowStr,
            event_type: 'PoD Captured',
            description: `Driver ${podDoc.driver_name} captured physical Proof-of-Delivery photo via In-Cab Tablet.`,
            actor: `In-Cab Pilot (${podDoc.driver_id})`,
            metadata: {
              bol_number: podDoc.bol_number,
              has_photo: true
            }
          });

          historyEntries.push({
            id: `hist-${Date.now()}-2`,
            timestamp: nowStr,
            event_type: 'OCR Processed',
            description: `Simulated OCR parsed BoL #${podDoc.bol_number}. Consignee: ${podDoc.consignee_name}. Pieces verified: ${podDoc.received_pallets}/${podDoc.manifest_pallets} pallets. Seal #${podDoc.seal_number} intact (${podDoc.ocr_confidence_pct}% confidence).`,
            actor: 'Fleet OCR AI Engine',
            metadata: {
              bol_number: podDoc.bol_number,
              consignee: podDoc.consignee_name,
              pallets: podDoc.received_pallets,
              seal_number: podDoc.seal_number,
              ocr_confidence: podDoc.ocr_confidence_pct,
              dock_number: podDoc.dock_number
            }
          });
        }

        historyEntries.push({
          id: `hist-${Date.now()}-3`,
          timestamp: nowStr,
          event_type: 'Delivered',
          description: `Consignment marked Delivered. Formal electronic proof logged into order history archive.`,
          actor: podDoc?.receiver_name ? `Receiver: ${podDoc.receiver_name}` : 'Driver Wayne MacLeod'
        });

        return { 
          ...o, 
          status: 'Delivered',
          pod_document: podDoc || o.pod_document,
          history: historyEntries
        };
      }
      return o;
    }));
  };

  return (
    <div className={`min-h-screen ${theme === 'day' ? 'bg-slate-100 text-slate-900 day-mode' : 'bg-slate-950 text-slate-100'} flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200`}>
      {/* Application Startup Loader (shows simple truck icon during loading, then unmounts) */}
      {isAppLoading && (
        <AppStartupLoader onLoaded={() => setIsAppLoading(false)} />
      )}

      {/* Top Navigation */}
      <AppNavbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'cabpilot') {
            setIsCabMode(true);
          } else {
            setIsCabMode(false);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        alertCount={alerts.length}
        isCabMode={isCabMode}
        setIsCabMode={setIsCabMode}
        onOpenAlertsModal={() => setShowAlertsModal(true)}
        activeOperator={activeOperator}
        availableOperators={operators}
        onSelectOperator={setActiveOperator}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        drivers={drivers}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fleet Alert Modal */}
        <AlertsModal
          isOpen={showAlertsModal}
          onClose={() => setShowAlertsModal(false)}
          alerts={alerts}
          onTriageAlert={handleTriageAlert}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setIsCabMode(tab === 'cabpilot');
            setShowAlertsModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Dynamic Route View */}
        {activeTab === 'overview' && (
          <DashboardOverview
            orders={orders}
            equipment={equipment}
            drivers={drivers}
            trips={trips}
            alerts={alerts}
            freight={freight}
            activeOperator={activeOperator}
            onNavigate={(tab) => {
              setActiveTab(tab);
              if (tab === 'cabpilot') setIsCabMode(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onTriageAlert={handleTriageAlert}
          />
        )}

        {/* Autonomous Fleet Operations Agent View (Directly Next to Command Center) */}
        {activeTab === 'agent' && (
          <AutonomousFleetAgent
            orders={orders}
            equipment={equipment}
            drivers={drivers}
            trips={trips}
            alerts={alerts}
            activeOperator={activeOperator}
            availableOperators={operators}
            onDispatchOrder={handleDispatchOrder}
            onAddNewOrder={handleAddNewOrder}
            onClearFaultCode={handleClearFaultCode}
            onScheduleService={handleScheduleService}
            onBookBackhaul={handleBookBackhaul}
            onUpdateDutyStatus={handleUpdateDutyStatus}
            onAddAlert={handleAddNewAlert}
            onDismissAlert={handleTriageAlert}
            onNavigate={(tab) => {
              setActiveTab(tab);
              if (tab === 'cabpilot') setIsCabMode(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectOperator={setActiveOperator}
            theme={theme}
          />
        )}

        {activeTab === 'map' && (
          <FleetGoogleMapView
            equipment={equipment}
            orders={orders}
            drivers={drivers}
            onOpenDriverCab={() => {
              setIsCabMode(true);
              setActiveTab('cabpilot');
            }}
          />
        )}

        {activeTab === 'workspace' && (
          <WorkspaceHub
            orders={orders}
            equipment={equipment}
            drivers={drivers}
          />
        )}

        {activeTab === 'dispatch' && (
          <DispatchConsole
            orders={orders}
            equipment={equipment}
            drivers={drivers}
            activeOperator={activeOperator}
            onDispatchOrder={handleDispatchOrder}
            onAddNewOrder={handleAddNewOrder}
          />
        )}

        {activeTab === 'telematics' && (
          <FleetTelematics
            equipment={equipment}
            drivers={drivers}
            onClearFaultCode={handleClearFaultCode}
            onScheduleService={handleScheduleService}
          />
        )}

        {activeTab === 'optimizer' && (
          <FreightOptimizer
            trips={trips}
            orders={orders}
            onBookBackhaul={handleBookBackhaul}
          />
        )}

        {activeTab === 'hos' && (
          <DriverHOSCompliance
            drivers={drivers}
            onUpdateDutyStatus={handleUpdateDutyStatus}
            onUpdateDriverPerformance={handleUpdateDriverPerformance}
          />
        )}

        {activeTab === 'reefer' && (
          <ReeferColdChain
            freight={freight}
            onDefrostOverride={handleDefrostOverride}
            onRerouteBorder={handleRerouteBorder}
          />
        )}

        {activeTab === 'predictive' && (
          <AIPredictiveAnalytics
            equipment={equipment}
            orders={orders}
            drivers={drivers}
            trips={trips}
          />
        )}

        {activeTab === 'edi' && (
          <EDIIntegrationHub orders={orders} />
        )}

        {activeTab === 'cabpilot' && (
          <MobileAppsSuite
            drivers={drivers}
            equipment={equipment}
            orders={orders}
            alerts={alerts}
            onConfirmDelivery={handleConfirmDelivery}
            onDispatchOrder={handleDispatchOrder}
          />
        )}
      </main>

      {/* Industrial Fleet Operations Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-900/90 text-slate-400 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white">Commercial Fleet &amp; Freight OS</span>
              <span className="text-slate-500 text-[11px] block">
                Cross-Border Logistics &bull; J1939 Telematics &bull; Triangular Backhauls
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Waterloo &bull; Cambridge &bull; Windsor Corridor
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              FMCSA / CBSA Compliant
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

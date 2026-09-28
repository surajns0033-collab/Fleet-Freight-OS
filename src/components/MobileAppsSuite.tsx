import React, { useState } from 'react';
import { Tablet, Smartphone, Truck, ShieldCheck, ArrowRight, Radio, FileText, Scan } from 'lucide-react';
import { DriverCabPilot } from './DriverCabPilot';
import { DispatcherMobileCompanion } from './DispatcherMobileCompanion';
import { OrderHistoryPoDArchive } from './OrderHistoryPoDArchive';
import { ProofOfDeliveryScanner } from './ProofOfDeliveryScanner';
import { Driver, Order, Equipment, OperationalAlert, ProofOfDeliveryDocument } from '../types';

interface MobileAppsSuiteProps {
  drivers: Driver[];
  equipment: Equipment[];
  orders: Order[];
  alerts: OperationalAlert[];
  onConfirmDelivery: (orderId: string, podDoc?: ProofOfDeliveryDocument) => void;
  onDispatchOrder: (orderId: string, truckId: string, driverId: string) => void;
}

export const MobileAppsSuite: React.FC<MobileAppsSuiteProps> = ({
  drivers,
  equipment,
  orders,
  alerts,
  onConfirmDelivery,
  onDispatchOrder
}) => {
  const [selectedMobileView, setSelectedMobileView] = useState<'driver' | 'dispatcher' | 'archive'>('driver');
  const [scannerOrder, setScannerOrder] = useState<Order | null>(null);

  const activeCabDriver = drivers[0];
  const activeCabOrder = orders.find(o => o.assigned_driver_id === activeCabDriver?.driver_id) || orders[0];
  const deliveredOrdersCount = orders.filter(o => o.status === 'Delivered' || o.pod_document).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Selector Header Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Smartphone className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              Mobile Applications Suite &bull; Drivers &amp; Dispatchers
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Field Mobile Apps &bull; Proof of Delivery (PoD)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            In-cab driver tablet with photo document capture, simulated OCR pipeline, and synchronized order history archives.
          </p>
        </div>

        {/* Device Switcher Toggle */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            id="tab-driver-cab-btn"
            onClick={() => setSelectedMobileView('driver')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedMobileView === 'driver'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-4 h-4" />
            <span>Driver In-Cab Tablet</span>
          </button>

          <button
            id="tab-dispatcher-pocket-btn"
            onClick={() => setSelectedMobileView('dispatcher')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedMobileView === 'dispatcher'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Dispatcher Pocket</span>
          </button>

          <button
            id="tab-order-history-archive-btn"
            onClick={() => setSelectedMobileView('archive')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedMobileView === 'archive'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Order History &amp; PoD ({deliveredOrdersCount})</span>
          </button>
        </div>
      </div>

      {/* Render Selected View */}
      {selectedMobileView === 'driver' ? (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2 px-2">
            <span>DEVICE: Samsung Galaxy Tab Active4 Pro (Rugged In-Cab Mount)</span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ELD J1939 Bluetooth Linked
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-sky-400 font-bold">PoD Document OCR Active</span>
            </div>
          </div>
          <DriverCabPilot
            driver={activeCabDriver}
            activeOrder={activeCabOrder}
            allOrders={orders}
            onConfirmDelivery={onConfirmDelivery}
            onOpenOrderHistoryTab={() => setSelectedMobileView('archive')}
          />
        </div>
      ) : selectedMobileView === 'dispatcher' ? (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between px-2 max-w-md mx-auto">
            <span>DEVICE: Handheld Smartphone (iOS / Android)</span>
            <span className="text-indigo-400 font-bold">&bull; Cloud Dispatch Webhook Active</span>
          </div>
          <DispatcherMobileCompanion
            drivers={drivers}
            equipment={equipment}
            orders={orders}
            alerts={alerts}
            onDispatchOrder={onDispatchOrder}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <OrderHistoryPoDArchive
            orders={orders}
            onOpenPoDScanner={(order) => setScannerOrder(order)}
          />
        </div>
      )}

      {/* External PoD Scanner Modal if opened from Archive */}
      {scannerOrder && (
        <ProofOfDeliveryScanner
          order={scannerOrder}
          driver={activeCabDriver}
          isOpen={Boolean(scannerOrder)}
          onClose={() => setScannerOrder(null)}
          onProcessPoD={(orderId, podDoc) => {
            onConfirmDelivery(orderId, podDoc);
            setScannerOrder(null);
          }}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Order, ProofOfDeliveryDocument, OrderHistoryEntry 
} from '../types';
import { 
  FileText, CheckCircle2, Clock, Search, Filter, 
  MapPin, ShieldCheck, Eye, Download, Truck, 
  ChevronRight, ArrowRight, CornerDownRight, X, ExternalLink
} from 'lucide-react';

interface OrderHistoryPoDArchiveProps {
  orders: Order[];
  onSelectOrder?: (orderId: string) => void;
  onOpenPoDScanner?: (order: Order) => void;
}

export const OrderHistoryPoDArchive: React.FC<OrderHistoryPoDArchiveProps> = ({
  orders,
  onOpenPoDScanner
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'delivered' | 'intransit'>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders.find(o => o.pod_document || o.status === 'Delivered')?.order_id || orders[0]?.order_id || ''
  );
  const [viewingDocModal, setViewingDocModal] = useState<ProofOfDeliveryDocument | null>(null);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shipper_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.dest_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.pod_document?.bol_number && o.pod_document.bol_number.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === 'delivered') return o.status === 'Delivered' || Boolean(o.pod_document);
    if (filterStatus === 'intransit') return o.status === 'In-Transit' || o.status === 'Dispatched';
    return true;
  });

  const selectedOrder = orders.find(o => o.order_id === selectedOrderId) || filteredOrders[0] || orders[0];

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Order History &amp; Proof-of-Delivery Archive
            </h2>
            <p className="text-xs text-slate-400">
              Audit trail of shipments, scanned BoLs, and automatic OCR delivery records.
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Order, Shipper, BoL..."
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('delivered')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Delivered ({orders.filter(o => o.status === 'Delivered' || o.pod_document).length})
            </button>
            <button
              onClick={() => setFilterStatus('intransit')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'intransit' ? 'bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active ({orders.filter(o => o.status === 'In-Transit' || o.status === 'Dispatched').length})
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Layout: Left Order List, Right Order Details & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Orders List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Orders ({filteredOrders.length})</span>
            <span>Status</span>
          </div>

          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No matching orders found.</p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const isSelected = order.order_id === selectedOrderId;
                const hasPoD = Boolean(order.pod_document);

                return (
                  <div
                    key={order.order_id}
                    onClick={() => setSelectedOrderId(order.order_id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-slate-850 border-amber-500/80 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black font-mono text-white">
                            {order.order_id}
                          </span>
                          {hasPoD && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              PoD OCR
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-300 truncate max-w-[220px]">
                          {order.shipper_name}
                        </h4>
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        order.status === 'In-Transit' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                        order.status === 'Dispatched' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>{order.origin_city} &rarr; {order.dest_city}</span>
                      </div>
                      <span className="font-mono text-slate-300 shrink-0">
                        {order.pallets} Pallets
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Order Details & Full History Trail (7 cols) */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="space-y-4">
              
              {/* Order Header Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        SHIPMENT AUDIT LOG
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedOrder.status === 'Delivered' 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                          : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-0.5">
                      {selectedOrder.order_id} &bull; {selectedOrder.shipper_name}
                    </h3>
                  </div>

                  {onOpenPoDScanner && (
                    <button
                      onClick={() => onOpenPoDScanner(selectedOrder)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{selectedOrder.pod_document ? 'Rescan / Update PoD' : 'Capture PoD Photo'}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Route</span>
                    <span className="font-semibold text-slate-200">{selectedOrder.origin_city} &rarr; {selectedOrder.dest_city}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Freight</span>
                    <span className="font-semibold text-slate-200">{selectedOrder.pallets} Pallets &bull; {selectedOrder.weight_lbs?.toLocaleString()} lbs</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Equipment</span>
                    <span className="font-semibold text-slate-200">{selectedOrder.equipment_required}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Revenue</span>
                    <span className="font-mono font-bold text-emerald-400">${selectedOrder.rate_cad.toLocaleString()} CAD</span>
                  </div>
                </div>
              </div>

              {/* Proof-of-Delivery Scanned Document Section */}
              {selectedOrder.pod_document ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-emerald-500/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Verified Proof-of-Delivery (PoD)</span>
                          <span className="text-xs font-mono text-emerald-400">
                            {selectedOrder.pod_document.ocr_confidence_pct}% OCR Confidence
                          </span>
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Captured {selectedOrder.pod_document.captured_at} by Driver {selectedOrder.pod_document.driver_name}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setViewingDocModal(selectedOrder.pod_document || null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      <span>Inspect High-Res BoL</span>
                    </button>
                  </div>

                  {/* Scanned Image Preview and Extracted Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* Thumbnail */}
                    <div 
                      onClick={() => setViewingDocModal(selectedOrder.pod_document || null)}
                      className="sm:col-span-4 relative rounded-xl border border-slate-700 overflow-hidden bg-slate-950 cursor-pointer group shadow-md"
                    >
                      <img
                        src={selectedOrder.pod_document.image_url}
                        alt="PoD Bill of Lading"
                        className="w-full h-36 object-contain group-hover:scale-105 transition-transform p-1"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-bold text-white flex items-center gap-1 bg-black/70 px-2.5 py-1 rounded-lg">
                          <Eye className="w-3.5 h-3.5" /> Full Size
                        </span>
                      </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="sm:col-span-8 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">CONSIGNEE</span>
                          <span className="font-bold text-slate-200 truncate block">
                            {selectedOrder.pod_document.consignee_name}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">RECEIVER / DOCK</span>
                          <span className="font-bold text-slate-200 truncate block">
                            {selectedOrder.pod_document.receiver_name} ({selectedOrder.pod_document.dock_number || 'Dock'})
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">PIECES RECEIVED</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {selectedOrder.pod_document.received_pallets} / {selectedOrder.pod_document.manifest_pallets} pkgs
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">SEAL STATUS</span>
                          <span className="font-mono font-bold text-amber-400">
                            #{selectedOrder.pod_document.seal_number} {selectedOrder.pod_document.seal_intact ? '✓' : '✖'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">OS&amp;D STATUS</span>
                          <span className="font-bold text-emerald-400 truncate block">
                            {selectedOrder.pod_document.os_d_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-2">
                  <div className="text-xs font-semibold text-slate-400">
                    No Proof-of-Delivery document captured yet for this shipment.
                  </div>
                  {onOpenPoDScanner && (
                    <button
                      onClick={() => onOpenPoDScanner(selectedOrder)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Launch PoD Scanner &amp; Run Simulated OCR</span>
                    </button>
                  )}
                </div>
              )}

              {/* Order History Timeline */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5 border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <h4 className="text-sm font-bold text-white">
                      Chronological Order History &amp; Event Trail
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {selectedOrder.history?.length || 1} Registered Events
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {selectedOrder.history && selectedOrder.history.length > 0 ? (
                    selectedOrder.history.map((entry, idx) => (
                      <div key={entry.id || idx} className="relative group text-xs space-y-1">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 ${
                          entry.event_type === 'Delivered' ? 'bg-emerald-500 border-emerald-300' :
                          entry.event_type === 'OCR Processed' ? 'bg-amber-500 border-amber-300' :
                          entry.event_type === 'PoD Captured' ? 'bg-sky-500 border-sky-300' :
                          entry.event_type === 'Dock Arrival' ? 'bg-indigo-500 border-indigo-300' :
                          'bg-slate-700 border-slate-500'
                        }`} />

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              entry.event_type === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              entry.event_type === 'OCR Processed' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              entry.event_type === 'PoD Captured' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                              entry.event_type === 'Dock Arrival' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {entry.event_type}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              by {entry.actor}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {entry.timestamp}
                          </span>
                        </div>

                        <p className="text-slate-300 leading-relaxed pl-0.5">
                          {entry.description}
                        </p>

                        {/* Metadata Tag Preview */}
                        {entry.metadata && (
                          <div className="flex flex-wrap gap-1.5 pt-1 pl-0.5">
                            {entry.metadata.bol_number && (
                              <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-amber-400 border border-slate-800">
                                BoL: {entry.metadata.bol_number}
                              </span>
                            )}
                            {entry.metadata.consignee && (
                              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-300 border border-slate-800">
                                {entry.metadata.consignee}
                              </span>
                            )}
                            {entry.metadata.ocr_confidence && (
                              <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-emerald-400 border border-slate-800">
                                OCR: {entry.metadata.ocr_confidence}% Match
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    // Default fallback event when order has not yet accumulated history
                    <div className="relative text-xs space-y-1">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-500" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          Order Tendered
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {selectedOrder.pickup_window}
                        </span>
                      </div>
                      <p className="text-slate-400">
                        Shipment tendered by {selectedOrder.shipper_name} for freight transit.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-300">Select an Order to Inspect History</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Choose any order from the list on the left to review its physical Proof-of-Delivery photos, OCR extractions, and chronological event trail.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full Size Document Modal Viewer */}
      {viewingDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">
                  Official Bill of Lading &bull; {viewingDocModal.bol_number}
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
                Consignee: <strong className="text-white">{viewingDocModal.consignee_name}</strong> &bull; Signed by: <strong className="text-white">{viewingDocModal.receiver_name}</strong>
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

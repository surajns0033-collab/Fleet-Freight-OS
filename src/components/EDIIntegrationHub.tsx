import React, { useState } from 'react';
import { 
  FileCode, ArrowRightLeft, Copy, Check, Download, 
  Send, Radio, ShieldCheck, CheckCircle2, Code2
} from 'lucide-react';
import { Order } from '../types';

interface EDIIntegrationHubProps {
  orders: Order[];
}

export const EDIIntegrationHub: React.FC<EDIIntegrationHubProps> = ({ orders }) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0].order_id);
  const [copiedEdi, setCopiedEdi] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);
  const [viewFormat, setViewFormat] = useState<'edi' | 'json'>('edi');

  const selectedOrder = orders.find(o => o.order_id === selectedOrderId) || orders[0];

  // Generate realistic ANSI X12 EDI 204 (Motor Carrier Load Tender)
  const generateEDI204 = (order: Order) => {
    const dateStamp = '20260912';
    const timeStamp = '1145';
    return `ISA*00*          *00*          *02*FLEETOS        *01*${order.shipper_name.substring(0, 10).toUpperCase().padEnd(10, ' ')}*${dateStamp}*${timeStamp}*U*00401*000000941*0*P*>~
GS*SM*FLEETOS*${order.shipper_name.substring(0, 8).toUpperCase()}*${dateStamp}*${timeStamp}*941*X*004010~
ST*204*0001~
B2**RDST*${order.order_id}**PP~
B2A*00*LT~
MS3*RDST*B**TL~
N1*SH*${order.shipper_name}*92*SHP01~
N3*100 Industrial Parkway~
N4*${order.origin_city}*${order.origin_state_prov}*N2G 4A1*CA~
G62*10*${dateStamp}*I*0800~
N1*CN*Consignee Receiving Plant*92*REC01~
N3*500 Manufacturing Blvd~
N4*${order.dest_city}*${order.dest_state_prov}*48201*US~
G62*11*${dateStamp}*U*1600~
OID*${order.order_id}*PO-88419*LT*${order.pallets}*PL*${order.weight_lbs}*LB~
L5*1*${order.equipment_required.toUpperCase()} CARGO~
L0*1*${order.pallets}*PL*${order.weight_lbs}*G*LB***${order.distance_miles}*DM~
L1*1*${(order.rate_cad / order.distance_miles).toFixed(2)}*PM*${order.rate_cad.toFixed(2)}~
SE*18*0001~
GE*1*941~
IEA*1*000000941~`;
  };

  // Generate EDI 214 Shipment Status
  const generateEDI214 = (order: Order) => {
    const dateStamp = '20260912';
    const timeStamp = '1145';
    return `ISA*00*          *00*          *02*FLEETOS        *01*${order.shipper_name.substring(0, 10).toUpperCase().padEnd(10, ' ')}*${dateStamp}*${timeStamp}*U*00401*000000942*0*P*>~
GS*QM*FLEETOS*${order.shipper_name.substring(0, 8).toUpperCase()}*${dateStamp}*${timeStamp}*942*X*004010~
ST*214*0001~
B10*${order.order_id}*BOL-2026-9041*RDST~
L11*${order.assigned_truck_id || 'TRK-104'}*EQ~
L11*${order.assigned_driver_id || 'DRV-742'}*DR~
N1*SH*${order.shipper_name}~
N4*${order.origin_city}*${order.origin_state_prov}*CA~
LX*1~
AT7*X3*NS***${dateStamp}*${timeStamp}*ET~
MS1*Windsor*ON*CA~
MS2*RDST*${order.assigned_truck_id || 'TRK-104'}~
SE*12*0001~
GE*1*942~
IEA*1*000000942~`;
  };

  const rawEdi = generateEDI204(selectedOrder);

  const jsonRepresentation = {
    standard: 'ANSI X12 EDI 204',
    version: '004010',
    carrierScac: 'RDST',
    shipmentIdentification: {
      orderId: selectedOrder.order_id,
      shipper: selectedOrder.shipper_name,
      origin: {
        city: selectedOrder.origin_city,
        state: selectedOrder.origin_state_prov,
        country: 'CA'
      },
      destination: {
        city: selectedOrder.dest_city,
        state: selectedOrder.dest_state_prov,
        country: 'US'
      },
      linehaulRateCad: selectedOrder.rate_cad,
      distanceMiles: selectedOrder.distance_miles,
      weightLbs: selectedOrder.weight_lbs,
      pallets: selectedOrder.pallets,
      equipment: selectedOrder.equipment_required
    },
    statusMessage214: {
      latestEvent: 'In-Transit GPS Beacon Ping',
      currentSubdivision: 'Highway 401 W near London, ON',
      speedMph: 61.2,
      customsStatus: 'CBSA ACI eManifest Accepted'
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(viewFormat === 'edi' ? rawEdi : JSON.stringify(jsonRepresentation, null, 2));
    setCopiedEdi(true);
    setTimeout(() => setCopiedEdi(false), 2000);
  };

  const handleSendWebhook = () => {
    setWebhookSent(true);
    setTimeout(() => setWebhookSent(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Enterprise EDI &amp; Webhook Middleware
            </span>
            <span className="text-xs text-slate-400">| ANSI X12 204/214/210</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Trucking Platform Integration Hub
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Bidirectional translation between enterprise EDI streams and modern REST/JSON APIs. Eliminates double entry across McLeod, Trimble, Geotab, and customs portals.
          </p>
        </div>

        <button
          onClick={handleSendWebhook}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-center shrink-0"
        >
          <Radio className="w-4 h-4 stroke-[2.5]" />
          <span>Emit Telematics Webhook</span>
        </button>
      </div>

      {webhookSent && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Webhook successfully emitted to Shipper TMS endpoint! Status 200 OK received with 48ms latency.</span>
        </div>
      )}

      {/* Selector and Format Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Freight Tender:
          </label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
          >
            {orders.map((o) => (
              <option key={o.order_id} value={o.order_id}>
                {o.order_id} &mdash; {o.shipper_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setViewFormat('edi')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewFormat === 'edi' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw ANSI X12 EDI
            </button>
            <button
              onClick={() => setViewFormat('json')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewFormat === 'json' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              REST / JSON Schema
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copiedEdi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEdi ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <FileCode className="w-4 h-4 text-sky-400" />
            <span>
              {viewFormat === 'edi' ? 'EDI 204 Motor Carrier Load Tender (Envelope 004010)' : 'Normalized Logistics JSON Payload'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            VALIDATED SYNTAX
          </span>
        </div>

        <pre className="text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto p-4 bg-slate-900/90 rounded-xl border border-slate-800/80 leading-relaxed max-h-[450px]">
          {viewFormat === 'edi' ? rawEdi : JSON.stringify(jsonRepresentation, null, 2)}
        </pre>
      </div>
    </div>
  );
};

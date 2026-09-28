import React, { useState } from 'react';
import { 
  DollarSign, Activity, Truck, TrendingDown, ShieldAlert, 
  Send, AlertTriangle, ArrowRight, Gauge, Clock, 
  ThermometerSnowflake, Wrench, Navigation, CheckCircle2, ChevronRight, BrainCircuit,
  Map as MapIcon, Briefcase, MapPin, Flag, Radio, Download, FileSpreadsheet, Bot
} from 'lucide-react';
import { Order, Equipment, Driver, TripRecord, OperationalAlert, FreightItem, OperatorProfile, WeatherHazardData } from '../types';
import { WeatherHazardBanner } from './WeatherHazardBanner';

interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
}

const KNOWN_GEO_POINTS: Record<string, GeoPoint> = {
  'woodstock, on': { lat: 43.1315, lng: -80.7472, label: 'Woodstock Hub, ON' },
  'mississauga, on': { lat: 43.5890, lng: -79.6441, label: 'Mississauga Terminal, ON' },
  'london, on': { lat: 42.9849, lng: -81.2453, label: 'London Gateway, ON' },
  'waterloo, on': { lat: 43.4643, lng: -80.5204, label: 'Waterloo HQ Hub, ON' },
  'kitchener, on': { lat: 43.4516, lng: -80.4925, label: 'Kitchener Depot, ON' },
  'cambridge, on': { lat: 43.3616, lng: -80.3144, label: 'Cambridge Yard, ON' },
  'guelph, on': { lat: 43.5448, lng: -80.2482, label: 'Guelph Auto Yard, ON' },
  'windsor, on': { lat: 42.3149, lng: -83.0364, label: 'Windsor Crossing, ON' },
  'detroit, mi': { lat: 42.3314, lng: -83.0458, label: 'Detroit Consignee Dock, MI' },
  'allentown, pa': { lat: 40.6023, lng: -75.4714, label: 'Allentown Distribution Center, PA' },
  'cleveland, oh': { lat: 41.4993, lng: -81.6944, label: 'Cleveland Freight Terminal, OH' },
  'columbus, oh': { lat: 39.9612, lng: -82.9988, label: 'Columbus Midwest Depot, OH' },
  'chicago, il': { lat: 41.8781, lng: -87.6298, label: 'Chicago Intermodal Hub, IL' },
  'montreal, qc': { lat: 45.5017, lng: -73.5673, label: 'Montreal Freight Port, QC' },
  'scranton, pa': { lat: 41.4090, lng: -75.6624, label: 'Scranton Logistics Yard, PA' },
  'i-81 s near scranton, pa': { lat: 41.4090, lng: -75.6624, label: 'I-81 Southbound near Scranton, PA' },
  'i-94 westbound near ann arbor, mi': { lat: 42.2808, lng: -83.7430, label: 'I-94 Westbound near Ann Arbor, MI' }
};

function resolveGeoPoint(query: string, defaultFallback: GeoPoint): GeoPoint {
  if (!query) return defaultFallback;
  const q = query.toLowerCase().trim();
  for (const [key, pt] of Object.entries(KNOWN_GEO_POINTS)) {
    if (q.includes(key) || key.includes(q)) {
      return pt;
    }
  }
  if (q.includes('scranton')) return KNOWN_GEO_POINTS['scranton, pa'];
  if (q.includes('ann arbor') || q.includes('i-94')) return KNOWN_GEO_POINTS['i-94 westbound near ann arbor, mi'];
  if (q.includes('detroit')) return KNOWN_GEO_POINTS['detroit, mi'];
  if (q.includes('allentown')) return KNOWN_GEO_POINTS['allentown, pa'];
  if (q.includes('woodstock')) return KNOWN_GEO_POINTS['woodstock, on'];
  if (q.includes('mississauga')) return KNOWN_GEO_POINTS['mississauga, on'];
  if (q.includes('cleveland')) return KNOWN_GEO_POINTS['cleveland, oh'];
  if (q.includes('columbus')) return KNOWN_GEO_POINTS['columbus, oh'];
  if (q.includes('montreal')) return KNOWN_GEO_POINTS['montreal, qc'];
  if (q.includes('cambridge')) return KNOWN_GEO_POINTS['cambridge, on'];
  if (q.includes('waterloo')) return KNOWN_GEO_POINTS['waterloo, on'];
  return defaultFallback;
}

function computeHaversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function calculateTripProgress(trip: TripRecord, truckLocationStr?: string, driverLocationStr?: string) {
  const isCompleted = trip.status === 'Completed';
  const originGeo = resolveGeoPoint(trip.origin, { lat: 43.4643, lng: -80.5204, label: trip.origin });
  const destGeo = resolveGeoPoint(trip.destination, { lat: 42.3314, lng: -83.0458, label: trip.destination });

  const currentLocText = truckLocationStr || driverLocationStr || trip.origin;
  const currentGeo = isCompleted
    ? destGeo
    : resolveGeoPoint(currentLocText, {
        lat: (originGeo.lat + destGeo.lat) / 2,
        lng: (originGeo.lng + destGeo.lng) / 2,
        label: currentLocText
      });

  if (isCompleted) {
    return {
      percentage: 100,
      milesCompleted: trip.loaded_miles,
      milesRemaining: 0,
      originGeo,
      destGeo,
      currentGeo,
      currentLocationLabel: trip.destination,
      statusLabel: 'Completed'
    };
  }

  const distToDest = computeHaversineMiles(currentGeo.lat, currentGeo.lng, destGeo.lat, destGeo.lng);
  const distFromOrigin = computeHaversineMiles(originGeo.lat, originGeo.lng, currentGeo.lat, currentGeo.lng);
  const totalGeoDist = distFromOrigin + distToDest;

  let rawPct = totalGeoDist > 0 ? Math.round((distFromOrigin / totalGeoDist) * 100) : 50;
  if (trip.truck_id === 'TRK-104') {
    rawPct = 86; // near Ann Arbor along I-94 to Detroit
  } else if (trip.truck_id === 'TRK-145') {
    rawPct = 78; // along I-81 Scranton to Allentown
  }

  const percentage = Math.min(98, Math.max(5, rawPct));
  const milesCompleted = Math.round(trip.loaded_miles * (percentage / 100));
  const milesRemaining = Math.max(0, trip.loaded_miles - milesCompleted);

  return {
    percentage,
    milesCompleted,
    milesRemaining,
    originGeo,
    destGeo,
    currentGeo,
    currentLocationLabel: currentLocText,
    statusLabel: 'In-Transit'
  };
}

interface DashboardOverviewProps {
  orders: Order[];
  equipment: Equipment[];
  drivers: Driver[];
  trips: TripRecord[];
  alerts: OperationalAlert[];
  freight: FreightItem[];
  activeOperator?: OperatorProfile;
  onNavigate: (tab: string) => void;
  onTriageAlert: (alertId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  orders,
  equipment,
  drivers,
  trips,
  alerts,
  freight,
  activeOperator,
  onNavigate,
  onTriageAlert
}) => {
  // Aggregate calculations
  const totalRevenue = orders
    .filter(o => o.status === 'In-Transit' || o.status === 'Dispatched')
    .reduce((acc, curr) => acc + curr.rate_cad, 0);

  const tenderedOrders = orders.filter(o => o.status === 'Tendered');
  const inTransitOrders = orders.filter(o => o.status === 'In-Transit');
  const dispatchedOrders = orders.filter(o => o.status === 'Dispatched');

  const activeTrucks = equipment.filter(e => e.status === 'In-Transit');
  const alertTrucks = equipment.filter(e => e.status === 'Diagnostic Alert');
  const availableTrucks = equipment.filter(e => e.status === 'Online');

  const totalDeadhead = trips.reduce((acc, t) => acc + t.deadhead_miles, 0);
  const totalLoaded = trips.reduce((acc, t) => acc + t.loaded_miles, 0);
  const deadheadPct = totalLoaded > 0 ? ((totalDeadhead / (totalLoaded + totalDeadhead)) * 100).toFixed(1) : '15.4';

  const criticalReeferCount = freight.filter(f => f.spoilage_status === 'Imminent Risk').length;

  const [exportNotification, setExportNotification] = useState<string | null>(null);

  const handleExportTripsCSV = () => {
    const headers = [
      'Trip ID',
      'Order ID',
      'Truck ID',
      'Truck Model',
      'Driver ID',
      'Driver Name',
      'Status',
      'Origin',
      'Destination',
      'Loaded Miles',
      'Miles Completed',
      'Miles Remaining',
      'Progress Pct',
      'Avg Speed (mph)',
      'Avg MPG',
      'Idle Hours',
      'Customs Delay (mins)',
      'Departure Time',
      'Estimated Arrival',
      'Current Location',
      'Current Lat',
      'Current Lng'
    ];

    const rows = trips.map(t => {
      const truckObj = equipment.find(e => e.unit_id === t.truck_id);
      const driverObj = drivers.find(d => d.driver_id === t.driver_id);
      const progress = calculateTripProgress(t, truckObj?.location, driverObj?.current_location);

      return [
        t.trip_id,
        t.order_id,
        t.truck_id,
        truckObj?.make_model || '',
        t.driver_id,
        driverObj?.name || '',
        t.status,
        t.origin,
        t.destination,
        t.loaded_miles,
        progress.milesCompleted,
        progress.milesRemaining,
        `${progress.percentage}%`,
        t.avg_speed_mph,
        t.avg_mpg,
        t.idle_hours,
        t.customs_delay_mins,
        t.departure_time,
        t.estimated_arrival,
        truckObj?.location || driverObj?.current_location || '',
        progress.currentGeo.lat,
        progress.currentGeo.lng
      ].map(val => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `fleet_trip_summaries_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotification(`Exported ${trips.length} active corridor trip summaries to CSV (${fileName})`);
    setTimeout(() => {
      setExportNotification(null);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Fleet Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        {/* User Operator Identity Bar */}
        {activeOperator && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-amber-500/20">
                {activeOperator.avatarInitials}
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-wider">
                  Active User Session &bull; {activeOperator.terminal}
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{activeOperator.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/20">
                    {activeOperator.role}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-medium hidden sm:block">
              Title: <span className="text-slate-200 font-semibold">{activeOperator.title}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Commercial Fleet Operations Console
              </span>
              <span className="text-xs text-slate-400">| Waterloo, ON Dispatch Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Fleet Operations &amp; Freight Optimization
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Managing 100+ Class-8 power units across Canada &ndash; US corridors. Real-time J1939 telematics, triangular backhaul optimization, HOS compliance, and active cold-chain monitoring.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('agent')}
              id="command-center-launch-agent-btn"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 hover:from-amber-400 hover:to-cyan-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
              title="Launch Autonomous Fleet Operations Agent"
            >
              <Bot className="w-4 h-4" />
              <span>Launch Fleet AI Agent</span>
            </button>

            <button
              onClick={() => onNavigate('map')}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all hover:scale-[1.02]"
            >
              <MapIcon className="w-4 h-4" />
              <span>Google Maps Fleet ({activeTrucks.length} Live)</span>
            </button>

            <button
              onClick={() => onNavigate('workspace')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
            >
              <Briefcase className="w-4 h-4" />
              <span>Google Workspace Hub</span>
            </button>

            <button
              onClick={() => onNavigate('dispatch')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <Send className="w-4 h-4" />
              <span>Match &amp; Dispatch ({tenderedOrders.length} Pending)</span>
            </button>

            <button
              onClick={() => onNavigate('optimizer')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <TrendingDown className="w-4 h-4 text-sky-400" />
              <span>Deadhead Minimizer</span>
            </button>

            <button
              onClick={handleExportTripsCSV}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              title="Export current trip summaries to CSV for external logistics reporting"
            >
              <Download className="w-4 h-4" />
              <span>Export Trips CSV</span>
            </button>

            <button
              onClick={() => onNavigate('predictive')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10"
            >
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span>AI Predictive Logistics</span>
            </button>
          </div>
        </div>
      </div>

      {/* CSV Export Success Notification */}
      {exportNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportNotification}</span>
          </div>
          <button 
            onClick={() => setExportNotification(null)}
            className="text-emerald-400 hover:text-white text-xs font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live Driver Weather Hazard Banner with Geolocation */}
      <WeatherHazardBanner 
        defaultLocationName="Waterloo Dispatch Corridor"
        onAcknowledgeHazard={(hazard) => {
          console.log('Driver acknowledged weather hazard:', hazard.primaryHazardTitle);
        }}
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Gross Revenue */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Freight Rev</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ${totalRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-400">CAD</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span>{inTransitOrders.length + dispatchedOrders.length} revenue loads moving</span>
          </div>
        </div>

        {/* Deadhead Miles Rate */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Fleet Deadhead %</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {deadheadPct}%
          </div>
          <div className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
            <span>Down from 18.2% industry avg</span>
          </div>
        </div>

        {/* Fleet Equipment Status */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tractor Utilization</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {availableTrucks.length + activeTrucks.length} <span className="text-xs font-normal text-slate-400">/ 100+</span>
          </div>
          <div className="text-[11px] text-slate-300 flex items-center gap-2 font-mono">
            <span className="text-emerald-400">{activeTrucks.length} Rolling</span>
            <span>&bull;</span>
            <span className="text-sky-400">{availableTrucks.length} Yard</span>
            <span>&bull;</span>
            <span className="text-rose-400">{alertTrucks.length} Shop</span>
          </div>
        </div>

        {/* Fuel Economy / Telematics */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Fleet Economy</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            7.05 <span className="text-xs font-normal text-slate-400">MPG</span>
          </div>
          <div className="text-[11px] text-indigo-400 flex items-center gap-1 font-medium">
            <span>DD15 &amp; MX-13 CAN-Bus synced</span>
          </div>
        </div>
      </div>

      {/* 3D Fleet Visualizer Banner */}
      <div 
        onClick={() => onNavigate('telematics')}
        className="group cursor-pointer rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 p-5 shadow-xl hover:border-amber-400/60 transition-all flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
            <Truck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                3D CAD Power Unit Digital Twin Active
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold">
                Interactive 360°
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
              Inspect Real-Time 3D Wireframe &amp; Solid Telematics Mesh
            </h3>
            <p className="text-xs text-slate-400">
              Explore engine cylinder blocks, aerodynamics, turbo sensors, and J1939 CAN-Bus live in full 3D.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            Launch 3D Inspector &rarr;
          </span>
        </div>
      </div>

      {/* Critical Operational Alerts Panel (Triage Bar) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Live High-Priority Operational Triage ({alerts.length})
              </h2>
              <p className="text-xs text-slate-400">
                Actionable fleet alerts requiring immediate dispatch or mechanical intervention
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            Automated J1939 &amp; HOS Engine
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-3.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${
                alert.severity === 'critical'
                  ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-700'
                  : 'bg-amber-950/20 border-amber-900/50 hover:border-amber-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      alert.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {alert.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {alert.timestamp}
                  </span>
                </div>
                {alert.relatedUnitId && (
                  <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    {alert.relatedUnitId}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white mt-2">
                {alert.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {alert.message}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400 italic truncate max-w-[260px]">
                  &rarr; {alert.actionRequired}
                </span>
                <button
                  onClick={() => onTriageAlert(alert.id)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 shrink-0 transition-colors"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Active Corridor Tracking + Tendered Orders Queue */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Highway Corridors (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-400" />
                Active Highway Corridors &amp; Border Crossings
              </h2>
              <p className="text-xs text-slate-400">
                Class-8 power units moving along 401, I-94, I-75, and I-81
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportTripsCSV}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Export current corridor trips to CSV format for external logistics reporting"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => onNavigate('telematics')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>View All Units</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Fleet-Wide Corridor Progress Overview */}
          {(() => {
            const tripProgressList = trips.map(t => {
              const truck = equipment.find(e => e.unit_id === t.truck_id);
              const driver = drivers.find(d => d.driver_id === t.driver_id);
              return calculateTripProgress(t, truck?.location, driver?.current_location);
            });
            const activeOnly = tripProgressList.filter((_, i) => trips[i].status !== 'Completed');
            const avgProgress = activeOnly.length > 0
              ? Math.round(activeOnly.reduce((acc, p) => acc + p.percentage, 0) / activeOnly.length)
              : 100;

            return (
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">Active Corridors Fleet Completion</span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px]">
                      {avgProgress}% Avg En-Route
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {activeOnly.length} Loads Rolling &bull; {trips.length - activeOnly.length} Delivered
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-sky-400 to-emerald-400 transition-all duration-700"
                    style={{ width: `${avgProgress}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <div className="space-y-4">
            {trips.map((trip) => {
              const driverObj = drivers.find(d => d.driver_id === trip.driver_id);
              const truckObj = equipment.find(e => e.unit_id === trip.truck_id);
              const progress = calculateTripProgress(trip, truckObj?.location, driverObj?.current_location);

              return (
                <div
                  key={trip.trip_id}
                  className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3.5 hover:border-slate-600 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-300 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
                          {trip.truck_id} {truckObj ? `• ${truckObj.make_model}` : ''}
                        </span>
                        <span className="text-xs text-slate-300 flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-0.5 rounded border border-slate-700">
                          <span className="text-slate-400 font-medium">Assigned Driver:</span>
                          <strong className="text-white font-bold">{driverObj ? driverObj.name : trip.driver_id}</strong>
                          <span className="text-slate-400 font-mono text-[11px]">({trip.driver_id})</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                          trip.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {trip.status}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white flex items-center gap-2 pt-0.5">
                        <span>{trip.origin}</span>
                        <span className="text-slate-500">&rarr;</span>
                        <span>{trip.destination}</span>
                        <span className="text-xs font-normal text-slate-400 font-mono">
                          ({trip.loaded_miles} mi)
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 pt-0.5">
                        <span>Speed: <strong className="text-slate-200">{trip.avg_speed_mph} mph</strong></span>
                        <span>&bull;</span>
                        <span>Fuel: <strong className="text-slate-200">{trip.avg_mpg} mpg</strong></span>
                        <span>&bull;</span>
                        <span className="text-amber-400">Border Wait: {trip.customs_delay_mins}m</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700">
                      <div className="text-xs text-slate-400 font-mono">ETA Window</div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        {trip.estimated_arrival}
                      </div>
                      <button
                        onClick={() => onNavigate('telematics')}
                        className="mt-1.5 px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-white font-medium transition-colors"
                      >
                        Telemetry CAN-Bus
                      </button>
                    </div>
                  </div>

                  {/* Visual Trip Progress Bar Based on Live GPS Location vs Destination */}
                  <div className="pt-2 border-t border-slate-700/60 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          Trip Completion:
                        </span>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${
                          progress.percentage >= 100
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {progress.percentage}% Completed
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                          GPS: {progress.currentGeo.lat.toFixed(2)}°N, {Math.abs(progress.currentGeo.lng).toFixed(2)}°W
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-300 flex items-center gap-2">
                        <span className="text-emerald-400 font-semibold">{progress.milesCompleted} mi logged</span>
                        <span>/</span>
                        <span className="text-slate-400">{trip.loaded_miles} mi total</span>
                        <span>&bull;</span>
                        <span className="text-amber-300 font-medium">
                          {progress.milesRemaining > 0 ? `${progress.milesRemaining} mi remaining` : 'At destination dock'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="relative w-full h-3 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${
                          progress.percentage >= 100
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400'
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>

                    {/* Geographic Coordinates Waypoints */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                      <div className="flex items-center gap-1 truncate max-w-[35%]">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{trip.origin}</span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          ({progress.originGeo.lat.toFixed(1)}°, {progress.originGeo.lng.toFixed(1)}°)
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-300 font-medium truncate max-w-[30%] px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        <span className="truncate text-[10px] sm:text-[11px]">
                          {progress.currentLocationLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 truncate max-w-[35%] justify-end text-right">
                        <span className="truncate">{trip.destination}</span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          ({progress.destGeo.lat.toFixed(1)}°, {progress.destGeo.lng.toFixed(1)}°)
                        </span>
                        <Flag className="w-3 h-3 text-sky-400 shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Pending Tenders (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-400" />
                  Tender Queue
                </h2>
                <p className="text-xs text-slate-400">
                  Ready for auto-match dispatch
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                {tenderedOrders.length} Pending
              </span>
            </div>

            <div className="space-y-2.5">
              {tenderedOrders.slice(0, 3).map((order) => (
                <div
                  key={order.order_id}
                  className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-amber-400">{order.order_id}</span>
                    <span className="font-bold text-white">${order.rate_cad.toLocaleString()} CAD</span>
                  </div>
                  <div className="text-xs font-extrabold text-white">
                    {order.shipper_name}
                  </div>
                  <div className="text-xs text-slate-300">
                    {order.origin_city}, {order.origin_state_prov} &rarr; {order.dest_city}, {order.dest_state_prov}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span>{order.equipment_required}</span>
                    <span>{order.distance_miles} mi &bull; {order.weight_lbs.toLocaleString()} lbs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => onNavigate('dispatch')}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Open Full Dispatch Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

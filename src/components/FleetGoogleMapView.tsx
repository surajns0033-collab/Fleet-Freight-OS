import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { Equipment, Order, Driver } from '../types';
import { 
  Truck, 
  Navigation, 
  ShieldAlert, 
  Fuel, 
  Gauge, 
  Thermometer, 
  Crosshair, 
  MapPin, 
  Clock, 
  Search, 
  X, 
  Layers, 
  Radio, 
  Compass, 
  RefreshCw, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Activity, 
  Eye,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  ExternalLink,
  History
} from 'lucide-react';
import { HISTORICAL_TRIPS_LAST_24H, HistoricalTripReplay } from '../data/tripBreadcrumbs';
import { TripReplayOverlay } from './TripReplayOverlay';

interface FleetGoogleMapViewProps {
  equipment: Equipment[];
  orders: Order[];
  drivers: Driver[];
  onSelectEquipment?: (unitId: string) => void;
  onOpenDriverCab?: () => void;
}

export interface FleetVehiclePin {
  unitId: string;
  lat: number;
  lng: number;
  status: Equipment['status'];
  makeModel: string;
  year: number;
  speedMph: number;
  driverName: string;
  driverId?: string;
  currentLocation: string;
  destination: string;
  origin: string;
  headingDeg: number;
  telematics: Equipment['telematics'];
  assignedOrder?: Order;
  routeCoordinates: [number, number][];
}

export interface TerminalWaypoint {
  id: string;
  name: string;
  type: 'Terminal' | 'Border Crossing' | 'Customer Facility';
  lat: number;
  lng: number;
  status: string;
  waitMinutes?: number;
  city: string;
}

export const FleetGoogleMapView: React.FC<FleetGoogleMapViewProps> = ({
  equipment,
  orders,
  drivers,
  onSelectEquipment,
  onOpenDriverCab
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const replayLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Active state
  const [activeTileType, setActiveTileType] = useState<'streets' | 'dark' | 'satellite'>('streets');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehiclePin | null>(null);
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalWaypoint | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'In-Transit' | 'Online' | 'Diagnostic Alert'>('ALL');
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [activeTabInModal, setActiveTabInModal] = useState<'telematics' | 'route' | 'order' | 'driver'>('telematics');

  // 24-Hour Historical Trip Breadcrumb Replay State
  const [isReplayMode, setIsReplayMode] = useState<boolean>(false);
  const [selectedReplayTrip, setSelectedReplayTrip] = useState<HistoricalTripReplay>(HISTORICAL_TRIPS_LAST_24H[0]);
  const [currentBreadcrumbIndex, setCurrentBreadcrumbIndex] = useState<number>(0);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);

  // Key Commercial Terminals & International Border Crossings in the Ontario-US Midwest Corridor
  const corridorTerminals: TerminalWaypoint[] = useMemo(() => [
    {
      id: 'term-waterloo',
      name: 'Central HQ & Fleet Terminal',
      type: 'Terminal',
      lat: 43.4643,
      lng: -80.5204,
      city: 'Waterloo, ON',
      status: 'Main Operations Yard • Dispatch Control & J1939 Maintenance Bays'
    },
    {
      id: 'term-cambridge',
      name: 'Cambridge Logistics Hub & Cross-Dock',
      type: 'Terminal',
      lat: 43.3616,
      lng: -80.3144,
      city: 'Cambridge, ON',
      status: '24/7 Staging Lot • Trailer Drop & Deep Freeze Storage'
    },
    {
      id: 'border-ambassador',
      name: 'Ambassador Bridge Commercial Border Crossing',
      type: 'Border Crossing',
      lat: 42.3117,
      lng: -83.0745,
      city: 'Windsor, ON / Detroit, MI',
      status: 'Active Commercial Port of Entry • FAST Express Clearance',
      waitMinutes: 14
    },
    {
      id: 'border-bluewater',
      name: 'Blue Water Bridge Commercial Crossing',
      type: 'Border Crossing',
      lat: 42.9994,
      lng: -82.4239,
      city: 'Sarnia, ON / Port Huron, MI',
      status: 'Active Commercial Port of Entry • HazMat & Heavy Freight Allowed',
      waitMinutes: 9
    },
    {
      id: 'border-peace',
      name: 'Peace Bridge Commercial Crossing',
      type: 'Border Crossing',
      lat: 42.9069,
      lng: -78.9056,
      city: 'Fort Erie, ON / Buffalo, NY',
      status: 'Active Commercial Port of Entry • Expedited Lane Open',
      waitMinutes: 20
    },
    {
      id: 'cust-detroit',
      name: 'Detroit Automotive Tier-1 Assembly Plant',
      type: 'Customer Facility',
      lat: 42.3610,
      lng: -82.9750,
      city: 'Detroit, MI',
      status: 'JIT Component Receiving Dock doors 14-22'
    },
    {
      id: 'cust-chicago',
      name: 'Midwest Intermodal Cold Logistics Center',
      type: 'Customer Facility',
      lat: 41.8781,
      lng: -87.6298,
      city: 'Chicago, IL',
      status: 'Continuous Cold Chain Reefer Receiving (-20°C)'
    },
    {
      id: 'cust-allentown',
      name: 'Lehigh Valley Freight Distribution Terminal',
      type: 'Customer Facility',
      lat: 40.6023,
      lng: -75.4714,
      city: 'Allentown, PA',
      status: 'High Volume Palletized Cargo Drop'
    },
    {
      id: 'cust-columbus',
      name: 'Columbus Midwest Logistics Depot',
      type: 'Customer Facility',
      lat: 39.9612,
      lng: -82.9988,
      city: 'Columbus, OH',
      status: 'Cross-Border Consolidation Yard'
    }
  ], []);

  // Compute geocoded vehicle pins and realistic route polylines along commercial freeways
  const vehiclePins: FleetVehiclePin[] = useMemo(() => {
    return equipment.map((eq, index) => {
      let lat = 43.4643;
      let lng = -80.5204;
      let heading = 90;
      let origin = 'Waterloo, ON';
      let dest = 'Detroit, MI';
      let routeCoords: [number, number][] = [];

      if (eq.unit_id === 'TRK-104') {
        lat = 42.3200;
        lng = -83.2500; // I-94 west of Detroit
        heading = 265;
        origin = 'Waterloo, ON';
        dest = 'Detroit, MI (Auto Assembly)';
        routeCoords = [
          [43.4643, -80.5204], // Waterloo Yard
          [43.3616, -80.3144], // Cambridge
          [43.1315, -80.7472], // Woodstock
          [42.9849, -81.2453], // London
          [42.4048, -82.1910], // Chatham
          [42.3117, -83.0745], // Ambassador Bridge
          [42.3200, -83.2500], // Current GPS
          [42.3610, -82.9750]  // Detroit Delivery
        ];
      } else if (eq.unit_id === 'TRK-112') {
        lat = 43.4643;
        lng = -80.5204; // Waterloo Yard Staged
        heading = 0;
        origin = 'Waterloo, ON';
        dest = 'Cambridge Logistics Depot';
        routeCoords = [
          [43.4643, -80.5204],
          [43.3616, -80.3144]
        ];
      } else if (eq.unit_id === 'TRK-128') {
        lat = 43.3616;
        lng = -80.3144; // Cambridge Yard Maintenance
        heading = 0;
        origin = 'Cambridge, ON';
        dest = 'Central Maintenance Bay';
        routeCoords = [
          [43.3616, -80.3144],
          [43.4643, -80.5204]
        ];
      } else if (eq.unit_id === 'TRK-145') {
        lat = 42.9849;
        lng = -81.2453; // London, ON on Hwy 401
        heading = 75;
        origin = 'Windsor, ON';
        dest = 'Allentown, PA';
        routeCoords = [
          [42.3117, -83.0745], // Windsor
          [42.4048, -82.1910], // Chatham
          [42.9849, -81.2453], // Current (London)
          [43.1315, -80.7472], // Woodstock
          [43.2557, -79.8711], // Hamilton
          [42.9069, -78.9056], // Peace Bridge Buffalo
          [40.6023, -75.4714]  // Allentown, PA
        ];
      } else if (eq.unit_id === 'TRK-156') {
        lat = 42.3000;
        lng = -82.9800; // Approaching Ambassador Bridge
        heading = 240;
        origin = 'Toronto, ON';
        dest = 'Chicago Intermodal Terminal';
        routeCoords = [
          [43.6532, -79.3832], // Toronto
          [43.4643, -80.5204], // Waterloo
          [42.9849, -81.2453], // London
          [42.3000, -82.9800], // Current (Windsor Border approach)
          [42.3117, -83.0745], // Ambassador Bridge
          [42.2808, -83.7430], // Ann Arbor
          [42.2711, -85.5872], // Kalamazoo
          [41.8781, -87.6298]  // Chicago, IL
        ];
      } else if (eq.unit_id === 'TRK-168') {
        lat = 43.1315;
        lng = -80.7472; // Woodstock, ON
        heading = 260;
        origin = 'Montreal, QC';
        dest = 'Columbus Midwest Depot';
        routeCoords = [
          [43.6532, -79.3832], // Toronto
          [43.1315, -80.7472], // Current (Woodstock)
          [42.9849, -81.2453], // London
          [42.9994, -82.4239], // Blue Water Bridge Sarnia
          [42.3314, -83.0458], // Detroit
          [41.6528, -83.5379], // Toledo
          [39.9612, -82.9988]  // Columbus, OH
        ];
      } else {
        lat = 43.0 - (index * 0.25);
        lng = -80.5 - (index * 0.4);
        routeCoords = [
          [43.4643, -80.5204],
          [lat, lng]
        ];
      }

      const assignedDriver = drivers.find(d => d.current_truck_id === eq.unit_id);
      const assignedOrder = orders.find(o => o.assigned_truck_id === eq.unit_id);

      if (assignedOrder) {
        dest = `${assignedOrder.dest_city}, ${assignedOrder.dest_state_prov}`;
        origin = `${assignedOrder.origin_city}, ${assignedOrder.origin_state_prov}`;
      }

      return {
        unitId: eq.unit_id,
        lat,
        lng,
        status: eq.status,
        makeModel: eq.make_model,
        year: eq.year,
        speedMph: eq.telematics.speedMph,
        driverName: assignedDriver?.name || 'Unassigned Fleet Driver',
        driverId: assignedDriver?.driver_id,
        currentLocation: eq.location,
        destination: dest,
        origin,
        headingDeg: heading,
        telematics: eq.telematics,
        assignedOrder,
        routeCoordinates: routeCoords
      };
    });
  }, [equipment, drivers, orders]);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehiclePins.filter(v => {
      if (statusFilter === 'ALL') return true;
      return v.status === statusFilter;
    });
  }, [vehiclePins, statusFilter]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    const vehicleMatches = vehiclePins
      .filter(v => 
        v.unitId.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        v.destination.toLowerCase().includes(q) ||
        v.origin.toLowerCase().includes(q) ||
        v.currentLocation.toLowerCase().includes(q) ||
        (v.assignedOrder && v.assignedOrder.order_id.toLowerCase().includes(q))
      )
      .map(v => ({ type: 'vehicle' as const, item: v, label: `${v.unitId} • ${v.driverName}`, sub: `${v.currentLocation} → ${v.destination}` }));

    const terminalMatches = corridorTerminals
      .filter(t => 
        t.name.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
      )
      .map(t => ({ type: 'terminal' as const, item: t, label: t.name, sub: `${t.type} • ${t.city}` }));

    return [...vehicleMatches, ...terminalMatches];
  }, [searchQuery, vehiclePins, corridorTerminals]);

  // Tile Layer URLs - strictly watermark-free OpenStreetMap and Esri World Imagery
  const getTileConfig = (type: 'streets' | 'dark' | 'satellite') => {
    if (type === 'streets') {
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        className: ''
      };
    } else if (type === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        className: ''
      };
    } else {
      // Dark Navigation Mode: Pure OpenStreetMap tiles styled cleanly via CSS filter (zero external watermarks or API keys)
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        className: 'map-tile-dark'
      };
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default centered on Southwestern Ontario / Detroit-Windsor freight corridor
      const map = L.map(mapContainerRef.current, {
        center: [42.85, -81.80],
        zoom: 8,
        zoomControl: false,
        attributionControl: false
      });

      // Add Zoom control at bottom-left
      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

      const tileConfig = getTileConfig(activeTileType);
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        className: tileConfig.className,
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // LayerGroup for markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerGroupRef.current = markersLayer;

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when user switches style
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileConfig = getTileConfig(activeTileType);
    const newTileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      className: tileConfig.className,
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [activeTileType]);

  // Redraw Markers and Active Polyline when state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Terminals and Border Crossings
    corridorTerminals.forEach(terminal => {
      const isSelected = selectedTerminal?.id === terminal.id;
      const isBorder = terminal.type === 'Border Crossing';

      const iconHtml = `
        <div class="relative group cursor-pointer">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md transition-all duration-200 transform hover:scale-110 ${
            isSelected 
              ? 'ring-2 ring-cyan-400 bg-cyan-950/90 text-cyan-200 border-cyan-400 shadow-cyan-900/60 scale-105' 
              : isBorder 
              ? 'bg-blue-950/90 text-blue-200 border-blue-500/60 shadow-blue-900/50' 
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/60 shadow-emerald-900/50'
          }">
            <span class="w-2 h-2 rounded-full ${isBorder ? 'bg-blue-400' : 'bg-emerald-400'} ${isSelected ? 'animate-ping' : ''}"></span>
            <span class="whitespace-nowrap">${terminal.name.split(' ')[0]} ${isBorder ? '🛂' : '🏢'}</span>
            ${terminal.waitMinutes ? `<span class="bg-blue-500/20 text-blue-300 px-1 rounded text-[10px]">${terminal.waitMinutes}m</span>` : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'border-terminal-custom-marker',
        iconSize: [110, 32],
        iconAnchor: [55, 16]
      });

      const marker = L.marker([terminal.lat, terminal.lng], { icon: customIcon });
      marker.on('click', () => {
        setSelectedTerminal(terminal);
        setSelectedVehicle(null);
        map.flyTo([terminal.lat, terminal.lng], Math.max(map.getZoom(), 10), { duration: 0.8 });
      });

      marker.addTo(markersGroup);
    });

    // 2. Active Fleet Vehicles
    filteredVehicles.forEach(vehicle => {
      const isSelected = selectedVehicle?.unitId === vehicle.unitId;
      const isMoving = vehicle.status === 'In-Transit';
      const isAlert = vehicle.status === 'Diagnostic Alert';

      const markerColorClass = isAlert 
        ? 'bg-amber-950/95 text-amber-200 border-amber-500 shadow-amber-900/60' 
        : isMoving 
        ? 'bg-cyan-950/95 text-cyan-200 border-cyan-400 shadow-cyan-900/60' 
        : 'bg-zinc-900/95 text-zinc-200 border-zinc-700 shadow-black/80';

      const iconHtml = `
        <div class="relative group cursor-pointer">
          ${isMoving ? `
            <div class="absolute -inset-1 rounded-xl bg-cyan-500/30 animate-pulse blur-xs"></div>
          ` : ''}
          <div class="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shadow-2xl border text-xs font-bold backdrop-blur-md transition-all duration-200 transform hover:scale-110 ${markerColorClass} ${
            isSelected ? 'ring-2 ring-cyan-300 scale-110' : ''
          }">
            <svg class="w-3.5 h-3.5 ${isAlert ? 'text-amber-400' : isMoving ? 'text-cyan-400' : 'text-zinc-400'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
              <circle cx="17" cy="18" r="2"/>
              <circle cx="7" cy="18" r="2"/>
            </svg>
            <span class="font-mono">${vehicle.unitId}</span>
            ${vehicle.speedMph > 0 ? `
              <span class="text-[10px] bg-cyan-500/20 px-1 py-0.2 rounded font-mono text-cyan-300">${Math.round(vehicle.speedMph)}mph</span>
            ` : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'vehicle-custom-marker',
        iconSize: [100, 34],
        iconAnchor: [50, 17]
      });

      const marker = L.marker([vehicle.lat, vehicle.lng], { icon: customIcon });
      marker.on('click', () => {
        // DO NOT navigate away! Open popup window right on the map!
        setSelectedVehicle(vehicle);
        setSelectedTerminal(null);
        map.flyTo([vehicle.lat, vehicle.lng], Math.max(map.getZoom(), 10), { duration: 0.8 });
      });

      marker.addTo(markersGroup);
    });

    // 3. Draw Route Polyline for Selected Vehicle
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (selectedVehicle && selectedVehicle.routeCoordinates.length > 1) {
      const polyline = L.polyline(selectedVehicle.routeCoordinates, {
        color: '#06b6d4',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(map);

      routePolylineRef.current = polyline;
    }
  }, [corridorTerminals, filteredVehicles, selectedVehicle, selectedTerminal]);

  // 24-Hour Historical Replay Leaflet Visualization Effect
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!replayLayerGroupRef.current) {
      replayLayerGroupRef.current = L.layerGroup().addTo(map);
    }
    const replayGroup = replayLayerGroupRef.current;
    replayGroup.clearLayers();

    if (!isReplayMode || !selectedReplayTrip) return;

    const breadcrumbs = selectedReplayTrip.breadcrumbs;
    if (!breadcrumbs || breadcrumbs.length === 0) return;

    const latLngs: [number, number][] = breadcrumbs.map(b => [b.lat, b.lng]);

    // 1. Draw glowing polyline route
    L.polyline(latLngs, {
      color: '#f59e0b',
      weight: 5,
      opacity: 0.9,
      dashArray: '8, 8',
      lineCap: 'round'
    }).addTo(replayGroup);

    // 2. Milestone breadcrumb markers
    breadcrumbs.forEach((pt, idx) => {
      const isCurrent = idx === currentBreadcrumbIndex;
      const isKey = pt.landmarkType && pt.landmarkType !== 'Highway';

      const circle = L.circleMarker([pt.lat, pt.lng], {
        radius: isCurrent ? 8 : isKey ? 6 : 4,
        color: isCurrent ? '#f59e0b' : isKey ? '#38bdf8' : '#e2e8f0',
        fillColor: isCurrent ? '#f59e0b' : isKey ? '#0284c7' : '#64748b',
        fillOpacity: isCurrent ? 1 : 0.8,
        weight: isCurrent ? 3 : 1.5
      });

      circle.bindTooltip(`
        <div style="font-family: monospace; font-size: 11px; padding: 2px;">
          <strong>[${pt.timestamp}] ${pt.locationName}</strong><br/>
          Speed: ${pt.speedMph} mph | ${pt.eventNote || 'Nominal telemetry'}
        </div>
      `, { direction: 'top', offset: [0, -6] });

      circle.on('click', () => {
        setCurrentBreadcrumbIndex(idx);
      });

      circle.addTo(replayGroup);
    });

    // 3. Animated Replay Truck Marker
    const currentPt = breadcrumbs[currentBreadcrumbIndex] || breadcrumbs[0];
    const truckIconHtml = `
      <div class="relative cursor-pointer">
        <div class="absolute -inset-2 rounded-full bg-amber-400/40 animate-ping"></div>
        <div class="relative px-2.5 py-1.5 rounded-xl bg-slate-950 border-2 border-amber-400 text-white text-xs font-black shadow-2xl flex items-center gap-1.5 font-mono">
          <svg class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
          <span>${selectedReplayTrip.unitId}</span>
          <span class="text-[10px] text-amber-300">${currentPt.speedMph}mph</span>
        </div>
      </div>
    `;

    const truckMarker = L.marker([currentPt.lat, currentPt.lng], {
      icon: L.divIcon({
        html: truckIconHtml,
        className: 'replay-truck-marker',
        iconSize: [110, 36],
        iconAnchor: [55, 18]
      }),
      zIndexOffset: 1000
    });
    truckMarker.addTo(replayGroup);
  }, [isReplayMode, selectedReplayTrip, currentBreadcrumbIndex]);

  const handleToggleReplay = () => {
    if (!isReplayMode) {
      setIsReplayMode(true);
      setCurrentBreadcrumbIndex(0);
      setIsPlayingReplay(true);
      setSelectedVehicle(null);
      setSelectedTerminal(null);
      const map = mapInstanceRef.current;
      if (map && selectedReplayTrip) {
        const bounds = L.latLngBounds(selectedReplayTrip.breadcrumbs.map(b => [b.lat, b.lng]));
        map.fitBounds(bounds, { padding: [80, 80] });
      }
    } else {
      setIsReplayMode(false);
      setIsPlayingReplay(false);
      if (replayLayerGroupRef.current) {
        replayLayerGroupRef.current.clearLayers();
      }
    }
  };

  // Handle Preset Corridor Jumps
  const handleCorridorZoom = (corridor: 'all' | 'windsor' | 'hwy401' | 'midwest' | 'niagara') => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (corridor === 'all') {
      map.flyTo([42.85, -81.80], 8, { duration: 1 });
    } else if (corridor === 'windsor') {
      map.flyTo([42.3117, -83.0745], 11, { duration: 1 });
    } else if (corridor === 'hwy401') {
      map.flyTo([43.20, -80.80], 9, { duration: 1 });
    } else if (corridor === 'midwest') {
      map.flyTo([42.10, -84.50], 8, { duration: 1 });
    } else if (corridor === 'niagara') {
      map.flyTo([42.95, -79.05], 10, { duration: 1 });
    }
  };

  // Handle Search Selection
  const handleSelectSearchResult = (result: { type: 'vehicle' | 'terminal'; item: FleetVehiclePin | TerminalWaypoint }) => {
    const map = mapInstanceRef.current;
    setShowSearchDropdown(false);
    setSearchQuery('');

    if (result.type === 'vehicle') {
      const vehicle = result.item as FleetVehiclePin;
      setSelectedVehicle(vehicle);
      setSelectedTerminal(null);
      if (map) {
        map.flyTo([vehicle.lat, vehicle.lng], 12, { duration: 1 });
      }
    } else {
      const terminal = result.item as TerminalWaypoint;
      setSelectedTerminal(terminal);
      setSelectedVehicle(null);
      if (map) {
        map.flyTo([terminal.lat, terminal.lng], 12, { duration: 1 });
      }
    }
  };

  return (
    <div id="fleet-real-map-wrapper" className="space-y-4">
      {/* Top Map Action & Search Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* Left: Title and Live Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Live Commercial Fleet Corridor Map
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Real-World Radar
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Interactive Highway 401/402 corridor &amp; US Midwest cross-border telematics
            </p>
          </div>
        </div>

        {/* Center: Search Option */}
        <div className="relative w-full xl:w-80">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              id="fleet-map-search-input"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search truck, driver, city, route..."
              className="w-full pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Autocomplete Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-zinc-800">
              {searchResults.map((res, idx) => (
                <button
                  key={`${res.type}-${idx}`}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full px-3 py-2.5 text-left flex items-start justify-between gap-2 hover:bg-zinc-800 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {res.type === 'vehicle' ? (
                        <Truck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                      <span>{res.label}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{res.sub}</div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                    {res.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Tile Layer & Corridor Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'ALL' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({vehiclePins.length})
            </button>
            <button
              onClick={() => setStatusFilter('In-Transit')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'In-Transit' ? 'bg-cyan-600 text-white shadow-sm' : 'text-zinc-400 hover:text-cyan-400'
              }`}
            >
              Moving ({vehiclePins.filter(v => v.status === 'In-Transit').length})
            </button>
            <button
              onClick={() => setStatusFilter('Diagnostic Alert')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'Diagnostic Alert' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-amber-400'
              }`}
            >
              Alerts ({vehiclePins.filter(v => v.status === 'Diagnostic Alert').length})
            </button>
          </div>

          {/* Tile Layer Selector (Streets / Dark / Satellite) */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTileType('dark')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTileType === 'dark' ? 'bg-zinc-800 text-cyan-400 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="High Contrast Dark Dispatch Map"
            >
              Dark
            </button>
            <button
              onClick={() => setActiveTileType('streets')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTileType === 'streets' ? 'bg-zinc-800 text-cyan-400 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Real-World OpenStreetMap Streets & Roads"
            >
              Streets
            </button>
            <button
              onClick={() => setActiveTileType('satellite')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTileType === 'satellite' ? 'bg-zinc-800 text-cyan-400 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Real High-Resolution Satellite Photography"
            >
              Satellite
            </button>
          </div>

          {/* Quick Corridor Navigation Buttons */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => handleCorridorZoom('all')}
              className="px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800"
              title="All Corridor Units"
            >
              Corridor
            </button>
            <button
              onClick={() => handleCorridorZoom('windsor')}
              className="px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800"
              title="Ambassador Bridge / Windsor-Detroit"
            >
              Windsor/Detroit
            </button>
            <button
              onClick={() => handleCorridorZoom('hwy401')}
              className="px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800"
              title="Highway 401 Trucking Trunk"
            >
              Hwy 401
            </button>
          </div>

          {/* 24-Hour Historical Breadcrumb Replay Toggle */}
          <button
            onClick={handleToggleReplay}
            id="fleet-map-24h-replay-btn"
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isReplayMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/20'
                : 'bg-zinc-950 hover:bg-zinc-800 text-amber-300 border-zinc-800 hover:border-amber-500/40'
            }`}
            title="Visualize actual breadcrumb path taken by trucks for completed trips in the last 24 hours"
          >
            <History className="w-3.5 h-3.5" />
            <span>24h Replay</span>
            {isReplayMode && (
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
            )}
          </button>
        </div>
      </div>

      {/* Real Map Stage Container */}
      <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
        {/* Leaflet Map Canvas Element */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* 24-Hour Historical Replay Floating Overlay Controls */}
        {isReplayMode && selectedReplayTrip && (
          <TripReplayOverlay
            availableTrips={HISTORICAL_TRIPS_LAST_24H}
            selectedTrip={selectedReplayTrip}
            onSelectTrip={(trip) => {
              setSelectedReplayTrip(trip);
              setCurrentBreadcrumbIndex(0);
              setIsPlayingReplay(true);
              const map = mapInstanceRef.current;
              if (map) {
                const bounds = L.latLngBounds(trip.breadcrumbs.map(b => [b.lat, b.lng]));
                map.fitBounds(bounds, { padding: [80, 80] });
              }
            }}
            currentIndex={currentBreadcrumbIndex}
            onIndexChange={(idx) => setCurrentBreadcrumbIndex(idx)}
            isPlaying={isPlayingReplay}
            onTogglePlay={() => setIsPlayingReplay(!isPlayingReplay)}
            playbackSpeed={replaySpeed}
            onChangeSpeed={(spd) => setReplaySpeed(spd)}
            onClose={() => {
              setIsReplayMode(false);
              setIsPlayingReplay(false);
              if (replayLayerGroupRef.current) {
                replayLayerGroupRef.current.clearLayers();
              }
            }}
          />
        )}

        {/* Floating Telematics Quick Stats Badge (Top-Left) */}
        <div className="absolute top-4 left-4 z-10 bg-zinc-950/85 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-800 shadow-2xl text-xs text-zinc-300 pointer-events-none hidden sm:block">
          <div className="font-bold text-white mb-1.5 flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Commercial Corridor Radar</span>
          </div>
          <div className="space-y-1 text-[11px] text-zinc-400">
            <div>• Active Tractors: <span className="text-white font-semibold">{filteredVehicles.length} units</span></div>
            <div>• Ports of Entry: <span className="text-cyan-400 font-semibold">Ambassador &amp; Blue Water</span></div>
            <div>• Telematics Stream: <span className="text-emerald-400 font-semibold">J1939 CAN Live</span></div>
          </div>
        </div>

        {/* Floating Legend (Bottom-Right) */}
        <div className="absolute bottom-4 right-4 z-10 bg-zinc-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-800 shadow-2xl text-[11px] text-zinc-400 flex items-center gap-3.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>In-Transit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Diagnostic Alert</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span>Border Crossing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Terminal</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* POP-UP WINDOW STYLE OVERLAY: SELECTED VEHICLE (NO TAB JUMP!) */}
        {/* ========================================================================= */}
        {selectedVehicle && (
          <div 
            id="fleet-vehicle-window-popup"
            className={`absolute z-30 transition-all duration-200 ${
              isWindowMaximized
                ? 'inset-4 bg-zinc-900/98 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-6 shadow-2xl overflow-y-auto flex flex-col'
                : 'top-4 right-4 w-96 max-w-[calc(100vw-2rem)] bg-zinc-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-5 shadow-2xl text-zinc-100 max-h-[560px] overflow-y-auto'
            }`}
          >
            {/* Pop-up Window Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-white">
                      {selectedVehicle.unitId}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedVehicle.status === 'In-Transit' 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                        : selectedVehicle.status === 'Diagnostic Alert'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}>
                      {selectedVehicle.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {selectedVehicle.year} {selectedVehicle.makeModel}
                  </div>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsWindowMaximized(!isWindowMaximized)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title={isWindowMaximized ? 'Restore window' : 'Maximize window'}
                >
                  {isWindowMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setSelectedVehicle(null);
                    setIsWindowMaximized(false);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Close popup window"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Window Navigation Sub-Tabs */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs mb-4">
              <button
                onClick={() => setActiveTabInModal('telematics')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors text-center ${
                  activeTabInModal === 'telematics' ? 'bg-zinc-800 text-cyan-400 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Telematics
              </button>
              <button
                onClick={() => setActiveTabInModal('route')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors text-center ${
                  activeTabInModal === 'route' ? 'bg-zinc-800 text-cyan-400 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Active Route
              </button>
              <button
                onClick={() => setActiveTabInModal('driver')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors text-center ${
                  activeTabInModal === 'driver' ? 'bg-zinc-800 text-cyan-400 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Driver &amp; HOS
              </button>
            </div>

            {/* Modal Body: Tab 1 - Telematics & CAN Bus */}
            {activeTabInModal === 'telematics' && (
              <div className="space-y-3">
                {/* Live Speed Gauge Banner */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">CAN Road Speed</div>
                      <div className="text-xl font-mono font-bold text-white">
                        {selectedVehicle.speedMph} <span className="text-xs font-normal text-zinc-400">MPH</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Engine RPM</div>
                    <div className="text-sm font-mono font-semibold text-emerald-400">
                      {selectedVehicle.speedMph > 0 ? '1,420 RPM' : '0 RPM (Idling)'}
                    </div>
                  </div>
                </div>

                {/* 4-Grid Diagnostic Metrics */}
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase mb-1">
                      <Fuel className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Fuel Tank</span>
                    </div>
                    <div className="text-base font-bold text-white">
                      {selectedVehicle.telematics.fuelLevelPct}%
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="bg-cyan-500 h-full rounded-full" 
                        style={{ width: `${selectedVehicle.telematics.fuelLevelPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase mb-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Coolant Temp</span>
                    </div>
                    <div className="text-base font-bold text-white">
                      {selectedVehicle.telematics.coolantTempF}°F
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">Nominal Range (180-210°F)</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase mb-1">
                      <Activity className="w-3.5 h-3.5 text-blue-400" />
                      <span>DEF Fluid</span>
                    </div>
                    <div className="text-base font-bold text-white">
                      {selectedVehicle.telematics.defLevelPct}%
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">EPA Emission Standard</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase mb-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CAN Bus Faults</span>
                    </div>
                    <div className="text-base font-bold text-white">
                      {selectedVehicle.status === 'Diagnostic Alert' ? (
                        <span className="text-amber-400">SPN 111 FMI 1</span>
                      ) : (
                        <span className="text-emerald-400">Clear (0 DTC)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">SAE J1939 Protocol</div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body: Tab 2 - Active Route */}
            {activeTabInModal === 'route' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-mono">Origin Facility</div>
                      <div className="font-semibold text-white mt-0.5">{selectedVehicle.origin}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-cyan-400 mt-2 shrink-0" />
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-500 uppercase font-mono">Destination Dock</div>
                      <div className="font-semibold text-cyan-300 mt-0.5">{selectedVehicle.destination}</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Current GPS Position:</span>
                    <span className="font-semibold text-white">{selectedVehicle.currentLocation}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Coordinates:</span>
                    <span className="font-mono text-zinc-300">{selectedVehicle.lat.toFixed(4)}, {selectedVehicle.lng.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Corridor Highway:</span>
                    <span className="font-semibold text-cyan-400">Hwy 401 / I-94 Trunk</span>
                  </div>
                  {selectedVehicle.assignedOrder && (
                    <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-400">Assigned Load ID:</span>
                      <span className="font-mono font-bold text-cyan-300">{selectedVehicle.assignedOrder.order_id}</span>
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>The cyan dashed path on the map highlights the authorized routing.</span>
                </div>
              </div>
            )}

            {/* Modal Body: Tab 3 - Driver & HOS */}
            {activeTabInModal === 'driver' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Assigned Commercial Driver:</span>
                    <span className="font-bold text-white text-sm">{selectedVehicle.driverName}</span>
                  </div>
                  {selectedVehicle.driverId && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Driver ID:</span>
                      <span className="font-mono text-zinc-300">{selectedVehicle.driverId}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Duty Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedVehicle.speedMph > 0 ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {selectedVehicle.speedMph > 0 ? 'DRIVING (ON DUTY)' : 'OFF-DUTY / REST'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">HOS Drive Time Remaining:</span>
                    <span className="font-mono font-semibold text-emerald-400">07h 42m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">70h/8-Day Cycle:</span>
                    <span className="font-mono text-zinc-300">48h 15m remaining</span>
                  </div>
                </div>

                {onOpenDriverCab && (
                  <button
                    onClick={onOpenDriverCab}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 transition-all"
                  >
                    <Gauge className="w-4 h-4" />
                    Launch Driver In-Cab Pilot Simulator
                  </button>
                )}
              </div>
            )}

            {/* Pop-up Window Footer */}
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => {
                  const map = mapInstanceRef.current;
                  if (map) {
                    map.flyTo([selectedVehicle.lat, selectedVehicle.lng], 14, { duration: 0.8 });
                  }
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                Center on Unit
              </button>
              <button
                onClick={() => {
                  setSelectedVehicle(null);
                  setIsWindowMaximized(false);
                }}
                className="py-2 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* POP-UP WINDOW STYLE OVERLAY: SELECTED TERMINAL / BORDER CROSSING */}
        {/* ========================================================================= */}
        {selectedTerminal && (
          <div 
            id="fleet-terminal-window-popup"
            className="absolute top-4 right-4 z-30 w-96 max-w-[calc(100vw-2rem)] bg-zinc-900/95 backdrop-blur-xl border border-blue-500/40 rounded-2xl p-5 shadow-2xl text-zinc-100"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    {selectedTerminal.type}
                  </div>
                  <h4 className="font-bold text-sm text-white">{selectedTerminal.name}</h4>
                </div>
              </div>
              <button
                onClick={() => setSelectedTerminal(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300 mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">City / Jurisdiction:</span>
                <span className="font-semibold text-white">{selectedTerminal.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Coordinates:</span>
                <span className="font-mono text-zinc-400">{selectedTerminal.lat.toFixed(4)}, {selectedTerminal.lng.toFixed(4)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300">
                <div className="text-[10px] text-zinc-500 uppercase font-mono mb-0.5">Status &amp; Facilities</div>
                <div>{selectedTerminal.status}</div>
              </div>

              {selectedTerminal.waitMinutes && (
                <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-200 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Commercial FAST Lane</span>
                  </div>
                  <span className="font-mono text-sm text-blue-300 font-bold">~{selectedTerminal.waitMinutes} min queue</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const map = mapInstanceRef.current;
                  if (map) {
                    map.flyTo([selectedTerminal.lat, selectedTerminal.lng], 14, { duration: 0.8 });
                  }
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center justify-center gap-1.5 transition-colors text-xs"
              >
                <Crosshair className="w-3.5 h-3.5 text-blue-400" />
                Zoom to Terminal
              </button>
              <button
                onClick={() => setSelectedTerminal(null)}
                className="py-2 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium transition-colors text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Corridor Units Quick Strip (Below the Map) */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Corridor Fleet Units ({filteredVehicles.length})</span>
          </h4>
          <span className="text-[11px] text-zinc-500">
            Click any truck to open pop-up telemetry window without leaving map
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {filteredVehicles.map(vehicle => {
            const isSelected = selectedVehicle?.unitId === vehicle.unitId;
            return (
              <button
                key={vehicle.unitId}
                onClick={() => {
                  // Click on route/truck opens pop-up right on map — DOES NOT JUMP TABS!
                  setSelectedVehicle(vehicle);
                  setSelectedTerminal(null);
                  const map = mapInstanceRef.current;
                  if (map) {
                    map.flyTo([vehicle.lat, vehicle.lng], 12, { duration: 0.8 });
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected 
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-950/50 scale-[1.02]' 
                    : 'bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs text-white flex items-center gap-1">
                    <Truck className={`w-3.5 h-3.5 ${vehicle.status === 'In-Transit' ? 'text-cyan-400' : 'text-zinc-400'}`} />
                    {vehicle.unitId}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    vehicle.status === 'In-Transit' ? 'bg-cyan-400' : 
                    vehicle.status === 'Diagnostic Alert' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-500'
                  }`} />
                </div>
                <div className="text-[11px] text-zinc-400 truncate">{vehicle.driverName}</div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">{vehicle.currentLocation}</div>
                <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400">{vehicle.speedMph} mph</span>
                  <span className="text-cyan-400 font-semibold">{vehicle.telematics.fuelLevelPct}% fuel</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

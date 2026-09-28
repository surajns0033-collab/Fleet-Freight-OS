import React, { useState, useMemo } from 'react';
import { 
  Droplets, TrendingUp, DollarSign, Clock, 
  BarChart3, Zap, Calendar, AlertCircle, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

export interface DailyFleetFuelRecord {
  date: string;
  fullDate: string;
  dayOfWeek: string;
  totalFuelBurned: number; // in gallons
  productiveFuel: number; // in gallons
  idleFuelWasted: number; // in gallons
  fleetAvgMpg: number; // miles per gallon
  fleetTotalMiles: number;
  dieselCostCad: number; // $ CAD
  activeTrucks: number;
}

// Generate high-fidelity 30-day historical CAN-bus telematics fuel data
const HISTORICAL_30_DAYS_FUEL_DATA: DailyFleetFuelRecord[] = [
  { date: 'Aug 16', fullDate: '2026-08-16', dayOfWeek: 'Sun', totalFuelBurned: 960, productiveFuel: 885, idleFuelWasted: 75, fleetAvgMpg: 7.24, fleetTotalMiles: 6950, dieselCostCad: 6048, activeTrucks: 16 },
  { date: 'Aug 17', fullDate: '2026-08-17', dayOfWeek: 'Mon', totalFuelBurned: 1390, productiveFuel: 1270, idleFuelWasted: 120, fleetAvgMpg: 7.08, fleetTotalMiles: 9840, dieselCostCad: 8757, activeTrucks: 23 },
  { date: 'Aug 18', fullDate: '2026-08-18', dayOfWeek: 'Tue', totalFuelBurned: 1420, productiveFuel: 1315, idleFuelWasted: 105, fleetAvgMpg: 7.15, fleetTotalMiles: 10150, dieselCostCad: 8946, activeTrucks: 24 },
  { date: 'Aug 19', fullDate: '2026-08-19', dayOfWeek: 'Wed', totalFuelBurned: 1360, productiveFuel: 1255, idleFuelWasted: 105, fleetAvgMpg: 7.18, fleetTotalMiles: 9760, dieselCostCad: 8568, activeTrucks: 23 },
  { date: 'Aug 20', fullDate: '2026-08-20', dayOfWeek: 'Thu', totalFuelBurned: 1480, productiveFuel: 1335, idleFuelWasted: 145, fleetAvgMpg: 6.94, fleetTotalMiles: 10270, dieselCostCad: 9324, activeTrucks: 24 },
  { date: 'Aug 21', fullDate: '2026-08-21', dayOfWeek: 'Fri', totalFuelBurned: 1310, productiveFuel: 1215, idleFuelWasted: 95, fleetAvgMpg: 7.21, fleetTotalMiles: 9440, dieselCostCad: 8253, activeTrucks: 22 },
  { date: 'Aug 22', fullDate: '2026-08-22', dayOfWeek: 'Sat', totalFuelBurned: 1050, productiveFuel: 965, idleFuelWasted: 85, fleetAvgMpg: 7.28, fleetTotalMiles: 7640, dieselCostCad: 6615, activeTrucks: 18 },
  { date: 'Aug 23', fullDate: '2026-08-23', dayOfWeek: 'Sun', totalFuelBurned: 940, productiveFuel: 865, idleFuelWasted: 75, fleetAvgMpg: 7.32, fleetTotalMiles: 6880, dieselCostCad: 5922, activeTrucks: 15 },
  { date: 'Aug 24', fullDate: '2026-08-24', dayOfWeek: 'Mon', totalFuelBurned: 1380, productiveFuel: 1265, idleFuelWasted: 115, fleetAvgMpg: 7.11, fleetTotalMiles: 9810, dieselCostCad: 8694, activeTrucks: 23 },
  { date: 'Aug 25', fullDate: '2026-08-25', dayOfWeek: 'Tue', totalFuelBurned: 1440, productiveFuel: 1320, idleFuelWasted: 120, fleetAvgMpg: 7.05, fleetTotalMiles: 10150, dieselCostCad: 9072, activeTrucks: 24 },
  { date: 'Aug 26', fullDate: '2026-08-26', dayOfWeek: 'Wed', totalFuelBurned: 1370, productiveFuel: 1270, idleFuelWasted: 100, fleetAvgMpg: 7.20, fleetTotalMiles: 9860, dieselCostCad: 8631, activeTrucks: 23 },
  { date: 'Aug 27', fullDate: '2026-08-27', dayOfWeek: 'Thu', totalFuelBurned: 1460, productiveFuel: 1325, idleFuelWasted: 135, fleetAvgMpg: 6.98, fleetTotalMiles: 10190, dieselCostCad: 9198, activeTrucks: 24 },
  { date: 'Aug 28', fullDate: '2026-08-28', dayOfWeek: 'Fri', totalFuelBurned: 1330, productiveFuel: 1230, idleFuelWasted: 100, fleetAvgMpg: 7.16, fleetTotalMiles: 9520, dieselCostCad: 8379, activeTrucks: 22 },
  { date: 'Aug 29', fullDate: '2026-08-29', dayOfWeek: 'Sat', totalFuelBurned: 1080, productiveFuel: 995, idleFuelWasted: 85, fleetAvgMpg: 7.25, fleetTotalMiles: 7830, dieselCostCad: 6804, activeTrucks: 18 },
  { date: 'Aug 30', fullDate: '2026-08-30', dayOfWeek: 'Sun', totalFuelBurned: 970, productiveFuel: 895, idleFuelWasted: 75, fleetAvgMpg: 7.30, fleetTotalMiles: 7080, dieselCostCad: 6111, activeTrucks: 16 },
  { date: 'Aug 31', fullDate: '2026-08-31', dayOfWeek: 'Mon', totalFuelBurned: 1410, productiveFuel: 1290, idleFuelWasted: 120, fleetAvgMpg: 7.06, fleetTotalMiles: 9950, dieselCostCad: 8883, activeTrucks: 24 },
  { date: 'Sep 01', fullDate: '2026-09-01', dayOfWeek: 'Tue', totalFuelBurned: 1450, productiveFuel: 1335, idleFuelWasted: 115, fleetAvgMpg: 7.12, fleetTotalMiles: 10320, dieselCostCad: 9135, activeTrucks: 24 },
  { date: 'Sep 02', fullDate: '2026-09-02', dayOfWeek: 'Wed', totalFuelBurned: 1390, productiveFuel: 1285, idleFuelWasted: 105, fleetAvgMpg: 7.19, fleetTotalMiles: 9990, dieselCostCad: 8757, activeTrucks: 23 },
  { date: 'Sep 03', fullDate: '2026-09-03', dayOfWeek: 'Thu', totalFuelBurned: 1490, productiveFuel: 1350, idleFuelWasted: 140, fleetAvgMpg: 6.95, fleetTotalMiles: 10350, dieselCostCad: 9387, activeTrucks: 24 },
  { date: 'Sep 04', fullDate: '2026-09-04', dayOfWeek: 'Fri', totalFuelBurned: 1340, productiveFuel: 1245, idleFuelWasted: 95, fleetAvgMpg: 7.22, fleetTotalMiles: 9670, dieselCostCad: 8442, activeTrucks: 22 },
  { date: 'Sep 05', fullDate: '2026-09-05', dayOfWeek: 'Sat', totalFuelBurned: 1060, productiveFuel: 975, idleFuelWasted: 85, fleetAvgMpg: 7.26, fleetTotalMiles: 7690, dieselCostCad: 6678, activeTrucks: 18 },
  { date: 'Sep 06', fullDate: '2026-09-06', dayOfWeek: 'Sun', totalFuelBurned: 950, productiveFuel: 875, idleFuelWasted: 75, fleetAvgMpg: 7.34, fleetTotalMiles: 6970, dieselCostCad: 5985, activeTrucks: 16 },
  { date: 'Sep 07', fullDate: '2026-09-07', dayOfWeek: 'Mon', totalFuelBurned: 1120, productiveFuel: 1035, idleFuelWasted: 85, fleetAvgMpg: 7.31, fleetTotalMiles: 8180, dieselCostCad: 7056, activeTrucks: 19 }, // Labor Day
  { date: 'Sep 08', fullDate: '2026-09-08', dayOfWeek: 'Tue', totalFuelBurned: 1470, productiveFuel: 1340, idleFuelWasted: 130, fleetAvgMpg: 7.04, fleetTotalMiles: 10340, dieselCostCad: 9261, activeTrucks: 24 },
  { date: 'Sep 09', fullDate: '2026-09-09', dayOfWeek: 'Wed', totalFuelBurned: 1410, productiveFuel: 1300, idleFuelWasted: 110, fleetAvgMpg: 7.17, fleetTotalMiles: 10100, dieselCostCad: 8883, activeTrucks: 24 },
  { date: 'Sep 10', fullDate: '2026-09-10', dayOfWeek: 'Thu', totalFuelBurned: 1520, productiveFuel: 1370, idleFuelWasted: 150, fleetAvgMpg: 6.92, fleetTotalMiles: 10510, dieselCostCad: 9576, activeTrucks: 24 },
  { date: 'Sep 11', fullDate: '2026-09-11', dayOfWeek: 'Fri', totalFuelBurned: 1360, productiveFuel: 1260, idleFuelWasted: 100, fleetAvgMpg: 7.18, fleetTotalMiles: 9760, dieselCostCad: 8568, activeTrucks: 23 },
  { date: 'Sep 12', fullDate: '2026-09-12', dayOfWeek: 'Sat', totalFuelBurned: 1090, productiveFuel: 1005, idleFuelWasted: 85, fleetAvgMpg: 7.24, fleetTotalMiles: 7890, dieselCostCad: 6867, activeTrucks: 18 },
  { date: 'Sep 13', fullDate: '2026-09-13', dayOfWeek: 'Sun', totalFuelBurned: 980, productiveFuel: 900, idleFuelWasted: 80, fleetAvgMpg: 7.33, fleetTotalMiles: 7180, dieselCostCad: 6174, activeTrucks: 17 },
  { date: 'Sep 14', fullDate: '2026-09-14', dayOfWeek: 'Mon', totalFuelBurned: 1430, productiveFuel: 1310, idleFuelWasted: 120, fleetAvgMpg: 7.13, fleetTotalMiles: 10190, dieselCostCad: 9009, activeTrucks: 24 } // Today
];

type FuelViewMode = 'volume' | 'mpg' | 'cost';

export const FleetFuelHistoricalChart: React.FC = () => {
  const [viewMode, setViewMode] = useState<FuelViewMode>('volume');

  // Aggregated 30-day stats
  const stats = useMemo(() => {
    const totalGal = HISTORICAL_30_DAYS_FUEL_DATA.reduce((acc, d) => acc + d.totalFuelBurned, 0);
    const idleGal = HISTORICAL_30_DAYS_FUEL_DATA.reduce((acc, d) => acc + d.idleFuelWasted, 0);
    const productiveGal = HISTORICAL_30_DAYS_FUEL_DATA.reduce((acc, d) => acc + d.productiveFuel, 0);
    const totalMiles = HISTORICAL_30_DAYS_FUEL_DATA.reduce((acc, d) => acc + d.fleetTotalMiles, 0);
    const totalCostCad = HISTORICAL_30_DAYS_FUEL_DATA.reduce((acc, d) => acc + d.dieselCostCad, 0);
    const avgMpg = totalGal > 0 ? (totalMiles / totalGal).toFixed(2) : '7.12';
    const idlePct = totalGal > 0 ? ((idleGal / totalGal) * 100).toFixed(1) : '8.2';

    return {
      totalGal,
      idleGal,
      productiveGal,
      totalMiles,
      totalCostCad,
      avgMpg,
      idlePct
    };
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
      {/* Header and View Mode Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              Fleet Fuel Telematics &bull; J1939 CAN-Bus ECM Logs
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
              Last 30 Days
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Fleet Historical Fuel Consumption &amp; Efficiency
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Continuous 30-day telematics audit across all Class-8 Detroit DD15 and Cummins X15 power units.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 self-start lg:self-center shrink-0">
          <button
            onClick={() => setViewMode('volume')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'volume'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Fuel Volume (Gal)</span>
          </button>

          <button
            onClick={() => setViewMode('mpg')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'mpg'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Fleet Avg MPG</span>
          </button>

          <button
            onClick={() => setViewMode('cost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'cost'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Diesel Cost ($ CAD)</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px]">30-Day Diesel Burn</span>
            <Droplets className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {stats.totalGal.toLocaleString()} <span className="text-xs text-slate-400 font-normal">gal</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Productive: <strong className="text-amber-300">{stats.productiveGal.toLocaleString()} gal</strong></span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px]">Fleet Avg Economy</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {stats.avgMpg} <span className="text-xs text-slate-400 font-normal">MPG</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+0.32 MPG vs 6.80 benchmark</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px]">Idle Detention Burn</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
            {stats.idleGal.toLocaleString()} <span className="text-xs text-slate-400 font-normal">gal</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>{stats.idlePct}% of total fuel volume</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px]">30-Day Fuel Spend</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            ${stats.totalCostCad.toLocaleString()} <span className="text-xs text-slate-400 font-normal">CAD</span>
          </div>
          <div className="text-[11px] text-sky-400 flex items-center gap-1">
            <span>${(stats.totalCostCad / stats.totalMiles).toFixed(2)}/mile fuel cost</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Telematics Aggregate (Aug 16 &ndash; Sep 14, 2026)</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Hover over bars or nodes for daily CAN-Bus telemetry
          </div>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'volume' ? (
              <AreaChart data={HISTORICAL_30_DAYS_FUEL_DATA} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="idleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  interval={3}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  unit=" gal"
                  domain={[600, 1600]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DailyFleetFuelRecord;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs space-y-1.5">
                          <div className="font-bold text-white flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
                            <span>{data.fullDate} ({data.dayOfWeek})</span>
                            <span className="font-mono text-amber-400">{data.activeTrucks} Power Units</span>
                          </div>
                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="flex justify-between gap-3 text-slate-300">
                              <span>Total Diesel Consumed:</span>
                              <strong className="text-white">{data.totalFuelBurned.toLocaleString()} gal</strong>
                            </div>
                            <div className="flex justify-between gap-3 text-amber-400">
                              <span>Productive Haul Fuel:</span>
                              <strong>{data.productiveFuel.toLocaleString()} gal</strong>
                            </div>
                            <div className="flex justify-between gap-3 text-rose-400">
                              <span>Detention / Idle Waste:</span>
                              <strong>{data.idleFuelWasted} gal ({((data.idleFuelWasted / data.totalFuelBurned) * 100).toFixed(1)}%)</strong>
                            </div>
                            <div className="flex justify-between gap-3 text-emerald-400">
                              <span>Fleet Avg Economy:</span>
                              <strong>{data.fleetAvgMpg} MPG</strong>
                            </div>
                            <div className="flex justify-between gap-3 text-sky-400">
                              <span>Total Fleet Mileage:</span>
                              <strong>{data.fleetTotalMiles.toLocaleString()} mi</strong>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => <span className="text-xs font-semibold text-slate-300">{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="totalFuelBurned"
                  name="Total Daily Diesel (Gal)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#fuelGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="idleFuelWasted"
                  name="Idle Detention Waste (Gal)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#idleGradient)"
                />
              </AreaChart>
            ) : viewMode === 'mpg' ? (
              <ComposedChart data={HISTORICAL_30_DAYS_FUEL_DATA} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  interval={3}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  unit=" MPG"
                  domain={[6.6, 7.5]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DailyFleetFuelRecord;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs space-y-1.5">
                          <div className="font-bold text-white border-b border-slate-800 pb-1">
                            {data.fullDate} ({data.dayOfWeek})
                          </div>
                          <div className="font-mono text-[11px] space-y-1">
                            <div className="flex justify-between gap-3 text-emerald-400">
                              <span>Fleet Efficiency:</span>
                              <strong>{data.fleetAvgMpg} MPG</strong>
                            </div>
                            <div className="flex justify-between gap-3 text-slate-300">
                              <span>Fleet Target:</span>
                              <strong>7.00 MPG</strong>
                            </div>
                            <div className="flex justify-between gap-3 text-sky-400">
                              <span>Miles Traveled:</span>
                              <strong>{data.fleetTotalMiles.toLocaleString()} mi</strong>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => <span className="text-xs font-semibold text-slate-300">{value}</span>}
                />
                <ReferenceLine 
                  y={7.0} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Target: 7.00 MPG', fill: '#10b981', fontSize: 11, position: 'right' }} 
                />
                <Line
                  type="monotone"
                  dataKey="fleetAvgMpg"
                  name="Fleet Avg Economy (MPG)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
              </ComposedChart>
            ) : (
              <ComposedChart data={HISTORICAL_30_DAYS_FUEL_DATA} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  interval={3}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  unit="$"
                  domain={[5000, 10500]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DailyFleetFuelRecord;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs space-y-1.5">
                          <div className="font-bold text-white border-b border-slate-800 pb-1">
                            {data.fullDate} ({data.dayOfWeek})
                          </div>
                          <div className="font-mono text-[11px] space-y-1">
                            <div className="flex justify-between gap-3 text-sky-400">
                              <span>Daily Diesel Spend:</span>
                              <strong>${data.dieselCostCad.toLocaleString()} CAD</strong>
                            </div>
                            <div className="flex justify-between gap-3 text-slate-300">
                              <span>Gallons Purchased:</span>
                              <strong>{data.totalFuelBurned} gal</strong>
                            </div>
                            <div className="flex justify-between gap-3 text-amber-400">
                              <span>Avg Gallon Price:</span>
                              <strong>$6.30 CAD/gal</strong>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => <span className="text-xs font-semibold text-slate-300">{value}</span>}
                />
                <Bar
                  dataKey="dieselCostCad"
                  name="Daily Diesel Cost ($ CAD)"
                  fill="#38bdf8"
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fleet Telematics Diagnostic Notes & Recommendations */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>CAN-Bus ECM Telemetry Observation:</strong> Thursday detention spikes (Ambassador Bridge &amp; I-94 Detroit border) generate 28% higher idle fuel consumption. Automated APU auxiliary power units engaged on TRK-104 and TRK-145 to mitigate dock idling.
          </span>
        </div>
        <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800 shrink-0">
          ESTIMATED ANNUAL DIESEL SAVINGS: $48,200 CAD
        </span>
      </div>
    </div>
  );
};

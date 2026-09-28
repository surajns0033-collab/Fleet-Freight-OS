import React, { useState } from 'react';
import { 
  TrendingDown, DollarSign, ArrowRight, CheckCircle2, 
  MapPin, Truck, Fuel, Sliders, ShieldCheck, Sparkles, Navigation
} from 'lucide-react';
import { BackhaulOpportunity, TripRecord, Order } from '../types';
import { INITIAL_BACKHAULS } from '../data/fleetData';

interface FreightOptimizerProps {
  trips: TripRecord[];
  orders: Order[];
  onBookBackhaul: (backhaul: BackhaulOpportunity) => void;
}

export const FreightOptimizer: React.FC<FreightOptimizerProps> = ({
  trips,
  orders,
  onBookBackhaul
}) => {
  const [backhauls, setBackhauls] = useState<BackhaulOpportunity[]>(INITIAL_BACKHAULS);
  const [fuelPricePerLitre, setFuelPricePerLitre] = useState<number>(1.68); // CAD
  const [bookedMsg, setBookedMsg] = useState<string | null>(null);

  // Diesel math: 1 gallon = 3.78541 Litres. At 7.0 MPG, cost per mile = (1/7) * 3.785 * fuelPrice
  const costPerDeadheadMile = ((1 / 6.9) * 3.78541 * fuelPricePerLitre).toFixed(2);

  // Total deadhead miles in available backhaul pool
  const totalDeadheadSavable = backhauls.reduce((acc, b) => acc + b.deadhead_saved_miles, 0);
  const totalPotentialRevenue = backhauls.reduce((acc, b) => acc + b.rate_cad, 0);

  const handleBook = (item: BackhaulOpportunity) => {
    onBookBackhaul(item);
    setBookedMsg(`Backhaul booked with ${item.shipper}! Deadhead of ${item.deadhead_saved_miles} miles converted into $${item.rate_cad.toLocaleString()} CAD revenue.`);
    // remove from available list
    setBackhauls(prev => prev.filter(b => b.id !== item.id));
    setTimeout(() => setBookedMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              Continuous Loop Freight Optimization
            </span>
            <span className="text-xs text-slate-400">| Corey &amp; Joe&rsquo;s Deadhead-Zero Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Deadhead Minimizer &amp; Triangular Backhauls
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Never return an 80,000 lb rig empty. Automatically match outbound corridor drops in Detroit, Chicago, and Allentown with lucrative high-yield return freight.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1 self-start sm:self-center shrink-0">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              Diesel Rack Price (CAD/L):
            </span>
            <span className="font-mono font-bold text-white">${fuelPricePerLitre.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="1.30"
            max="2.30"
            step="0.02"
            value={fuelPricePerLitre}
            onChange={(e) => setFuelPricePerLitre(parseFloat(e.target.value))}
            className="w-44 accent-amber-500 cursor-pointer"
          />
          <div className="text-[10px] text-amber-400 font-mono">
            Empty burn: ${costPerDeadheadMile} CAD per mile
          </div>
        </div>
      </div>

      {bookedMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{bookedMsg}</span>
        </div>
      )}

      {/* Metric Callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Deadhead Miles Recoverable
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {totalDeadheadSavable.toLocaleString()} <span className="text-xs font-normal text-slate-400">miles</span>
          </div>
          <p className="text-[11px] text-amber-400">
            Saves ~${(totalDeadheadSavable * parseFloat(costPerDeadheadMile)).toFixed(0)} in wasted diesel
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Backhaul Gross Revenue
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            ${totalPotentialRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-400">CAD</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Across {backhauls.length} continuous return loops
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Average Revenue Per Mile (RPM)
          </span>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">
            $7.14 <span className="text-xs font-normal text-slate-400">CAD / mi</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Transforming zero-yield return legs into top-tier freight
          </p>
        </div>
      </div>

      {/* Backhaul Matching Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Active Triangular Backhaul Opportunities
          </h2>
          <span className="text-xs text-slate-400">
            Matched with returning fleet tractors
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {backhauls.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {b.id}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {b.shipper}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-mono">Rate Revenue</span>
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      ${b.rate_cad.toLocaleString()} CAD
                    </div>
                  </div>
                </div>

                {/* Corridor Route Visualizer */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{b.origin_city}</span>
                    <span className="text-amber-400">&rarr;</span>
                    <span>{b.dest_city}</span>
                    <span className="text-slate-400 font-mono font-normal">({b.distance_miles} mi)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Routing: {b.corridor}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Empty Miles Cut</span>
                    <span className="font-bold text-amber-400 font-mono">+{b.deadhead_saved_miles} mi avoided</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Net Profit Gain</span>
                    <span className="font-bold text-emerald-400 font-mono">+${b.net_profit_gain_cad.toLocaleString()} CAD</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{b.equipment}</span>
                  <span>{b.weight_lbs.toLocaleString()} lbs &bull; {b.pallets} Pallets</span>
                </div>
              </div>

              <button
                onClick={() => handleBook(b)}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Pair Tractor &amp; Lock Backhaul Rate</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

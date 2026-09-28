import React, { useState, useMemo } from 'react';
import { 
  Clock, ShieldAlert, CheckCircle2, AlertTriangle, 
  MapPin, User, ShieldCheck, Fuel, Coffee, ArrowRight,
  Award, TrendingUp, Star, Sliders, Check, FileCheck,
  AlertOctagon, Plus, Calendar, Sparkles
} from 'lucide-react';
import { Driver, DriverDutyStatus, DriverPerformanceMetrics, AuditLogEntry } from '../types';

interface DriverHOSComplianceProps {
  drivers: Driver[];
  onUpdateDutyStatus: (driverId: string, newStatus: DriverDutyStatus) => void;
  onUpdateDriverPerformance?: (driverId: string, updatedMetrics: DriverPerformanceMetrics) => void;
}

const FALLBACK_DRIVER: Driver = {
  driver_id: 'DRV-742',
  name: 'Wayne MacLeod',
  phone: '+1 (519) 555-0192',
  home_terminal: 'Waterloo Hub, ON',
  current_location: 'Cambridge, ON',
  duty_status: 'Driving',
  drive_time_remaining_hours: 6.5,
  shift_time_remaining_hours: 9.0,
  cycle_time_remaining_hours: 48.0,
  fast_card_approved: true,
  hazmat_endorsement: true,
  current_truck_id: 'TRK-104'
};

export const DriverHOSCompliance: React.FC<DriverHOSComplianceProps> = ({
  drivers,
  onUpdateDutyStatus,
  onUpdateDriverPerformance
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.driver_id || 'DRV-742');
  const [activeSubTab, setActiveSubTab] = useState<'scorecard' | 'clocks' | 'parking'>('scorecard');
  
  // Interactive weight slider between HOS compliance and Delivery accuracy
  const [hosWeight, setHosWeight] = useState<number>(50); // Default 50% HOS, 50% Delivery
  const deliveryWeight = 100 - hosWeight;

  // Local state for dynamic performance tracking so user can log simulated deliveries
  const [driverPerformanceMap, setDriverPerformanceMap] = useState<Record<string, DriverPerformanceMetrics>>(() => {
    const map: Record<string, DriverPerformanceMetrics> = {};
    drivers.forEach(d => {
      if (d.performance) {
        map[d.driver_id] = d.performance;
      }
    });
    return map;
  });

  // Modal for logging simulated trip audit event
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [logStatus, setLogStatus] = useState<'On-Time' | 'Early' | 'Delayed'>('On-Time');
  const [logVariance, setLogVariance] = useState<number>(-10);
  const [logHosStatus, setLogHosStatus] = useState<'Clean' | 'Warning' | 'Violation'>('Clean');
  const [logDestination, setLogDestination] = useState<string>('Detroit, MI');
  const [logNotes, setLogNotes] = useState<string>('Arrived on schedule. ELD duty records validated.');
  const [logSuccessMsg, setLogSuccessMsg] = useState<string | null>(null);

  const selectedDriver = drivers.find(d => d.driver_id === selectedDriverId) || drivers[0] || FALLBACK_DRIVER;
  const currentPerf = (selectedDriver && driverPerformanceMap[selectedDriver.driver_id]) || selectedDriver?.performance;

  // Function to calculate scores dynamically based on weights & driver history
  const calculateScores = (perf: DriverPerformanceMetrics, hWeight: number) => {
    // 1. Calculate HOS Compliance Score
    const violationPenalty = perf.hosViolationsCount * 25;
    const warningPenalty = perf.hosWarningsCount * 6;
    const cleanStreakBonus = Math.min(6, Math.floor(perf.hosCleanStreakDays / 20));
    const adherenceBonus = Math.max(0, (perf.restBreakAdherencePct - 90) * 0.4);
    const rawHosScore = Math.min(100, Math.max(0, 100 - violationPenalty - warningPenalty + cleanStreakBonus + adherenceBonus));
    const finalHosScore = Math.round(rawHosScore);

    // 2. Calculate Delivery Time Accuracy Score
    const onTimeBase = perf.onTimeRatePct;
    const delayPenalty = perf.averageDeliveryVarianceMins > 0 ? perf.averageDeliveryVarianceMins * 0.35 : 0;
    const earlyBonus = perf.averageDeliveryVarianceMins < 0 ? Math.min(2.5, Math.abs(perf.averageDeliveryVarianceMins) * 0.2) : 0;
    const rawDeliveryScore = Math.min(100, Math.max(0, onTimeBase - delayPenalty + earlyBonus));
    const finalDeliveryScore = Math.round(rawDeliveryScore);

    // 3. Composite Performance Score
    const dWeight = 100 - hWeight;
    const compositeScore = Math.round((finalHosScore * (hWeight / 100)) + (finalDeliveryScore * (dWeight / 100)));

    // Rating tier
    let tier: 'Elite Fleet Master' | 'Compliant Pro' | 'Satisfactory' | 'Audit Flagged' = 'Compliant Pro';
    if (compositeScore >= 95) tier = 'Elite Fleet Master';
    else if (compositeScore >= 88) tier = 'Compliant Pro';
    else if (compositeScore >= 75) tier = 'Satisfactory';
    else tier = 'Audit Flagged';

    return {
      hosScore: finalHosScore,
      deliveryScore: finalDeliveryScore,
      compositeScore,
      tier
    };
  };

  // Memoized dynamic score calculations for all drivers
  const driversRanking = useMemo(() => {
    return drivers.map(d => {
      const perf = driverPerformanceMap[d.driver_id] || d.performance;
      if (!perf) return { driver: d, hosScore: 80, deliveryScore: 80, compositeScore: 80, tier: 'Compliant Pro' as const, perf: null };
      const { hosScore, deliveryScore, compositeScore, tier } = calculateScores(perf, hosWeight);
      return {
        driver: d,
        perf,
        hosScore,
        deliveryScore,
        compositeScore,
        tier
      };
    }).sort((a, b) => b.compositeScore - a.compositeScore);
  }, [drivers, driverPerformanceMap, hosWeight]);

  const currentDriverScores = useMemo(() => {
    if (!currentPerf) return { hosScore: 80, deliveryScore: 80, compositeScore: 80, tier: 'Compliant Pro' as const };
    return calculateScores(currentPerf, hosWeight);
  }, [currentPerf, hosWeight]);

  // Truck Stop / Safe Parking Locations along 401 & I-75
  const truckStops = [
    {
      name: 'TA Travel Center (Woodstock, ON)',
      highway: 'Highway 401 Exit 230',
      availableSpaces: 24,
      amenities: ['Diesel DEF', 'Showers', 'CAT Scale', 'Reserve Available'],
      distanceMiles: 28
    },
    {
      name: 'Pilot Flying J Travel Plaza (Tilbury, ON)',
      highway: 'Highway 401 Exit 63',
      availableSpaces: 12,
      amenities: ['Ultra-Clean Diesel', 'Sleeper Rest Lot', 'Wendy\'s', 'Driver Lounge'],
      distanceMiles: 112
    },
    {
      name: 'Petro-Pass Truck Stop (Cambridge, ON)',
      highway: 'Highway 401 & Townline Rd',
      availableSpaces: 8,
      amenities: ['Cardlock', '24/7 Security', 'Heavy Tire Shop'],
      distanceMiles: 14
    },
    {
      name: 'Love\'s Travel Stop (Monroe, MI)',
      highway: 'I-75 Exit 15',
      availableSpaces: 31,
      amenities: ['DEF at Pump', 'CAT Scale', 'Speedco Service'],
      distanceMiles: 185
    }
  ];

  // Handler to log a new delivery event and update performance score
  const handleLogDeliveryEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPerf) return;

    const newTripId = `TRP-${Math.floor(8815 + Math.random() * 50)}`;
    const todayStr = '2026-09-12';

    const newAuditEntry: AuditLogEntry = {
      tripId: newTripId,
      date: todayStr,
      destination: logDestination,
      status: logStatus,
      varianceMins: Number(logVariance),
      hosStatus: logHosStatus,
      notes: logNotes
    };

    const isDelOnTime = logStatus === 'On-Time' || logStatus === 'Early';
    const updatedTotalTrips = currentPerf.totalTripsCompleted + 1;
    const updatedOnTime = isDelOnTime ? currentPerf.onTimeDeliveries + 1 : currentPerf.onTimeDeliveries;
    const updatedLate = !isDelOnTime ? currentPerf.lateDeliveries + 1 : currentPerf.lateDeliveries;
    const updatedOnTimeRate = Number(((updatedOnTime / updatedTotalTrips) * 100).toFixed(1));

    const updatedViolations = logHosStatus === 'Violation' ? currentPerf.hosViolationsCount + 1 : currentPerf.hosViolationsCount;
    const updatedWarnings = logHosStatus === 'Warning' ? currentPerf.hosWarningsCount + 1 : currentPerf.hosWarningsCount;
    const updatedStreak = logHosStatus === 'Clean' ? currentPerf.hosCleanStreakDays + 1 : 0;

    // Rolling average variance
    const updatedAvgVariance = Number(
      (((currentPerf.averageDeliveryVarianceMins * currentPerf.totalTripsCompleted) + Number(logVariance)) / updatedTotalTrips).toFixed(1)
    );

    const updatedPerf: DriverPerformanceMetrics = {
      ...currentPerf,
      totalTripsCompleted: updatedTotalTrips,
      onTimeDeliveries: updatedOnTime,
      lateDeliveries: updatedLate,
      onTimeRatePct: updatedOnTimeRate,
      hosViolationsCount: updatedViolations,
      hosWarningsCount: updatedWarnings,
      hosCleanStreakDays: updatedStreak,
      averageDeliveryVarianceMins: updatedAvgVariance,
      recentAuditLogs: [newAuditEntry, ...currentPerf.recentAuditLogs.slice(0, 4)]
    };

    // Recalculate composite
    const recalculated = calculateScores(updatedPerf, hosWeight);
    updatedPerf.hosScore = recalculated.hosScore;
    updatedPerf.deliveryAccuracyScore = recalculated.deliveryScore;
    updatedPerf.compositeSafetyScore = recalculated.compositeScore;
    updatedPerf.ratingTier = recalculated.tier;

    setDriverPerformanceMap(prev => ({
      ...prev,
      [selectedDriver.driver_id]: updatedPerf
    }));

    if (onUpdateDriverPerformance) {
      onUpdateDriverPerformance(selectedDriver.driver_id, updatedPerf);
    }

    setShowLogModal(false);
    setLogSuccessMsg(`New delivery audit logged for ${selectedDriver.name}! Recalculated Score: ${recalculated.compositeScore}/100 (${recalculated.tier}).`);
    setTimeout(() => setLogSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              Safety &bull; HOS Logs &bull; On-Time Delivery Analytics
            </span>
            <span className="text-xs text-slate-400">| Corey &amp; Joe Fleet Safety Standards</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Driver Performance &amp; HOS Compliance Engine
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Composite driver scoring tracking FMCSA Hours-of-Service discipline alongside customer appointment delivery accuracy. Proactively mitigates roadside inspection violations.
          </p>
        </div>

        {/* Action Controls & Sub-tab Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('scorecard')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeSubTab === 'scorecard'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Performance Scorecard</span>
            </button>
            <button
              onClick={() => setActiveSubTab('clocks')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeSubTab === 'clocks'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Mandated HOS Clocks</span>
            </button>
            <button
              onClick={() => setActiveSubTab('parking')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeSubTab === 'parking'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Safe Haven Parking</span>
            </button>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Delivery Event</span>
          </button>
        </div>
      </div>

      {logSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{logSuccessMsg}</span>
        </div>
      )}

      {/* Driver Selector Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {driversRanking.map(({ driver, compositeScore, tier }) => {
          const isSelected = driver.driver_id === selectedDriverId;
          return (
            <div
              key={driver.driver_id}
              onClick={() => setSelectedDriverId(driver.driver_id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                isSelected
                  ? 'bg-slate-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-white truncate max-w-[110px]">
                    {driver.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {driver.driver_id}
                  </div>
                </div>

                <div className={`text-sm font-black font-mono px-1.5 py-0.5 rounded ${
                  compositeScore >= 95 ? 'text-emerald-400 bg-emerald-950/60' :
                  compositeScore >= 88 ? 'text-sky-400 bg-sky-950/60' :
                  compositeScore >= 75 ? 'text-amber-400 bg-amber-950/60' : 'text-rose-400 bg-rose-950/60'
                }`}>
                  {compositeScore}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className={`font-semibold truncate max-w-[90px] ${
                  tier === 'Elite Fleet Master' ? 'text-emerald-400' :
                  tier === 'Compliant Pro' ? 'text-sky-400' :
                  tier === 'Satisfactory' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {tier}
                </span>
                <span className="text-slate-400 font-mono">
                  {driver.duty_status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SUB-TAB 1: DRIVER PERFORMANCE SCORECARD VIEW */}
      {activeSubTab === 'scorecard' && (
        <div className="space-y-6">
          {/* Main Selected Driver Performance Cockpit */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            {/* Driver Profile Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                    Driver Safety &amp; On-Time Performance Profile
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    currentDriverScores.tier === 'Elite Fleet Master'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : currentDriverScores.tier === 'Compliant Pro'
                      ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                      : currentDriverScores.tier === 'Satisfactory'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}>
                    {currentDriverScores.tier}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>{selectedDriver.name}</span>
                  <span className="text-sm font-normal text-slate-400 font-mono">
                    ({selectedDriver.driver_id} &bull; {selectedDriver.home_terminal})
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Phone: <span className="text-slate-200">{selectedDriver.phone}</span> &bull; Current Truck: <span className="text-amber-400 font-mono font-bold">{selectedDriver.current_truck_id || 'TRK-104'}</span> &bull; Location: <span className="text-slate-200">{selectedDriver.current_location}</span>
                </p>
              </div>

              {/* Dynamic Weight Configuration Bar */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2 max-w-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Weight Distribution:
                  </span>
                  <span className="font-mono text-xs text-white">
                    HOS: <strong className="text-amber-400">{hosWeight}%</strong> &bull; Delivery: <strong className="text-sky-400">{deliveryWeight}%</strong>
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={hosWeight}
                  onChange={(e) => setHosWeight(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>More Delivery Focus</span>
                  <span>Balanced</span>
                  <span>More HOS Focus</span>
                </div>
              </div>
            </div>

            {/* Tri-Scorecard Metrics Breakdown: Composite vs HOS vs Delivery Accuracy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Overall Composite Score Card */}
              <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/70 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Overall Performance Score
                  </span>
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black font-mono ${
                    currentDriverScores.compositeScore >= 95 ? 'text-emerald-400' :
                    currentDriverScores.compositeScore >= 88 ? 'text-sky-400' :
                    currentDriverScores.compositeScore >= 75 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {currentDriverScores.compositeScore}
                  </span>
                  <span className="text-sm text-slate-400 font-bold">/ 100</span>
                </div>

                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      currentDriverScores.compositeScore >= 95 ? 'bg-emerald-400' :
                      currentDriverScores.compositeScore >= 88 ? 'bg-sky-400' :
                      currentDriverScores.compositeScore >= 75 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${currentDriverScores.compositeScore}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Formula: ({hosWeight}% &times; HOS) + ({deliveryWeight}% &times; Delivery Accuracy). Evaluates compliance reliability and transit punctuality.
                </p>
              </div>

              {/* HOS Compliance History Sub-Score Card */}
              <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    HOS Compliance History
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                    {hosWeight}%
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-mono text-amber-400">
                    {currentDriverScores.hosScore}
                  </span>
                  <span className="text-sm text-slate-400 font-bold">/ 100</span>
                </div>

                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${currentDriverScores.hosScore}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-0.5">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Violations:</span>
                    <strong className={currentPerf?.hosViolationsCount ? 'text-rose-400' : 'text-emerald-400'}>
                      {currentPerf?.hosViolationsCount || 0} Critical
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Clean Streak:</span>
                    <strong className="text-amber-400 font-mono">
                      {currentPerf?.hosCleanStreakDays || 0} Days
                    </strong>
                  </div>
                </div>
              </div>

              {/* Delivery Time Accuracy Sub-Score Card */}
              <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Delivery Time Accuracy
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs">
                    {deliveryWeight}%
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-mono text-sky-400">
                    {currentDriverScores.deliveryScore}
                  </span>
                  <span className="text-sm text-slate-400 font-bold">/ 100</span>
                </div>

                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full rounded-full transition-all"
                    style={{ width: `${currentDriverScores.deliveryScore}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-0.5">
                  <div>
                    <span className="text-slate-400 block text-[10px]">On-Time Rate:</span>
                    <strong className="text-sky-400 font-mono">
                      {currentPerf?.onTimeRatePct || 0}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Avg Variance:</span>
                    <strong className={(currentPerf?.averageDeliveryVarianceMins || 0) <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                      {(currentPerf?.averageDeliveryVarianceMins || 0) <= 0 
                        ? `${Math.abs(currentPerf?.averageDeliveryVarianceMins || 0)}m early`
                        : `+${currentPerf?.averageDeliveryVarianceMins}m late`}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Deep Operational Statistics Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Lifetime Trips Logged</span>
                <span className="text-base font-bold text-white font-mono">
                  {currentPerf?.totalTripsCompleted || 0} loads
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {currentPerf?.onTimeDeliveries} on-time &bull; {currentPerf?.lateDeliveries} delayed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Mandatory 30m Break Adherence</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {currentPerf?.restBreakAdherencePct || 0}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Taken before 8-hour drive window
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">FMCSA Log Warnings</span>
                <span className={`text-base font-bold font-mono ${
                  (currentPerf?.hosWarningsCount || 0) > 0 ? 'text-amber-400' : 'text-slate-200'
                }`}>
                  {currentPerf?.hosWarningsCount || 0} flagged
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Approached 11h/14h limits
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Safety Bonus Status</span>
                <span className={`text-base font-bold ${
                  currentDriverScores.tier === 'Elite Fleet Master' ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {currentDriverScores.tier === 'Elite Fleet Master' ? 'Eligible ($750 CAD)' : 'Standard Rate'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Requires 95+ score &amp; 0 violations
                </span>
              </div>
            </div>

            {/* Recent Delivery Audit & HOS History Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Recent Delivery &amp; HOS Electronic Audit Logs
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  ELD Automated Verification
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-800/70 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Trip ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Delivery Accuracy</th>
                      <th className="p-3">Variance</th>
                      <th className="p-3">HOS Log Status</th>
                      <th className="p-3">Audit Inspector Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {currentPerf?.recentAuditLogs?.map((audit, i) => (
                      <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-400">{audit.tripId}</td>
                        <td className="p-3 text-slate-300 font-mono">{audit.date}</td>
                        <td className="p-3 text-white font-medium">{audit.destination}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            audit.status === 'On-Time'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : audit.status === 'Early'
                              ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          }`}>
                            {audit.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {audit.varianceMins <= 0 ? `${Math.abs(audit.varianceMins)}m early` : `+${audit.varianceMins}m late`}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            audit.hosStatus === 'Clean'
                              ? 'text-emerald-400 bg-emerald-950/60'
                              : audit.hosStatus === 'Warning'
                              ? 'text-amber-400 bg-amber-950/60'
                              : 'text-rose-400 bg-rose-950/60'
                          }`}>
                            {audit.hosStatus}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 italic max-w-xs truncate">{audit.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Fleet-Wide Driver Safety Leaderboard */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Fleet Driver Safety &amp; Accuracy Leaderboard
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time ranking across all 100+ fleet operators weighted at {hosWeight}% HOS / {deliveryWeight}% Delivery
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {driversRanking.map(({ driver, perf, compositeScore, hosScore, deliveryScore, tier }, rank) => (
                <div
                  key={driver.driver_id}
                  onClick={() => setSelectedDriverId(driver.driver_id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    driver.driver_id === selectedDriverId
                      ? 'bg-slate-800/90 border-amber-500'
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs ${
                      rank === 0 ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' :
                      rank === 1 ? 'bg-slate-300 text-slate-950' :
                      rank === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{rank + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{driver.name}</span>
                        <span className="text-xs text-slate-400 font-mono">({driver.driver_id})</span>
                        {driver.fast_card_approved && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            FAST
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                        <span>Terminal: <strong className="text-slate-300">{driver.home_terminal}</strong></span>
                        <span>&bull;</span>
                        <span>Completed: <strong className="text-slate-300">{perf?.totalTripsCompleted || 0} trips</strong></span>
                        <span>&bull;</span>
                        <span>Clean Streak: <strong className="text-amber-400">{perf?.hosCleanStreakDays || 0}d</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 self-end sm:self-center">
                    <div className="text-right text-xs">
                      <div className="text-slate-400 font-mono text-[11px]">
                        HOS: <strong className="text-amber-400">{hosScore}</strong> &bull; On-Time: <strong className="text-sky-400">{deliveryScore}</strong>
                      </div>
                      <div className={`font-semibold text-[11px] ${
                        tier === 'Elite Fleet Master' ? 'text-emerald-400' :
                        tier === 'Compliant Pro' ? 'text-sky-400' :
                        tier === 'Satisfactory' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {tier}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-2xl font-black font-mono ${
                        compositeScore >= 95 ? 'text-emerald-400' :
                        compositeScore >= 88 ? 'text-sky-400' :
                        compositeScore >= 75 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {compositeScore}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MANDATED HOS CLOCKS VIEW */}
      {activeSubTab === 'clocks' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  Active Driver Duty Status
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {selectedDriver.name} &bull; {selectedDriver.phone}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Current Location: <strong className="text-slate-200">{selectedDriver.current_location}</strong>
                </p>
              </div>

              {/* Change Duty Status Buttons */}
              <div className="flex items-center gap-1.5">
                {(['Driving', 'On-Duty', 'Sleeper Berth', 'Off-Duty'] as DriverDutyStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => onUpdateDutyStatus(selectedDriver.driver_id, st)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedDriver.duty_status === st
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Large HOS Visual Clocks */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Mandated Rest Break Clocks:
              </h3>

              {/* 11-Hour Driving Clock Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">11-Hour Driving Limit</span>
                  <span className="font-mono font-bold text-white">
                    {selectedDriver.drive_time_remaining_hours}h / 11.00h remaining
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      selectedDriver.drive_time_remaining_hours < 2.0 ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${(selectedDriver.drive_time_remaining_hours / 11) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* 14-Hour Shift Clock Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">14-Hour On-Duty Shift Window</span>
                  <span className="font-mono font-bold text-white">
                    {selectedDriver.shift_time_remaining_hours}h / 14.00h remaining
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full rounded-full transition-all"
                    style={{ width: `${(selectedDriver.shift_time_remaining_hours / 14) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* 70-Hour 8-Day Rolling Cycle Clock Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">70-Hour / 8-Day Rolling Cycle</span>
                  <span className="font-mono font-bold text-white">
                    {selectedDriver.cycle_time_remaining_hours}h / 70.00h remaining
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-400 h-full rounded-full transition-all"
                    style={{ width: `${(selectedDriver.cycle_time_remaining_hours / 70) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-400 font-mono">Corey Barron&rsquo;s Safety Rule: </strong>
              &ldquo;You cannot simply pull an 80-foot rig onto the shoulder of Highway 401 when your 11-hour clock hits zero. Dispatch software must guide drivers to reserved truck parking at least 45 minutes before expiration.&rdquo;
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SAFE HAVEN TRUCK PARKING VIEW */}
      {activeSubTab === 'parking' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-400" />
                Verified Truck Parking &amp; Rest Plazas Along Route
              </h3>
              <p className="text-xs text-slate-400">
                Live 80-foot rig spot availability along Highway 401 &amp; I-75
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {truckStops.map((stop, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {stop.name}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      {stop.highway} &bull; {stop.distanceMiles} mi away
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {stop.availableSpaces} Spots Open
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {stop.amenities.map((a, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-850 text-slate-300 border border-slate-700/50"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Log Simulated Delivery Event */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  Log Delivery &amp; HOS Audit Event
                </h3>
                <p className="text-xs text-slate-400">
                  For: <strong className="text-white">{selectedDriver.name}</strong> ({selectedDriver.driver_id})
                </p>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLogDeliveryEvent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold uppercase">Destination City / Terminal</label>
                <input
                  type="text"
                  value={logDestination}
                  onChange={(e) => setLogDestination(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold uppercase">Delivery Punctuality</label>
                  <select
                    value={logStatus}
                    onChange={(e) => {
                      const val = e.target.value as 'On-Time' | 'Early' | 'Delayed';
                      setLogStatus(val);
                      if (val === 'Early') setLogVariance(-15);
                      else if (val === 'On-Time') setLogVariance(0);
                      else setLogVariance(30);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="On-Time">On-Time (Dock Window Met)</option>
                    <option value="Early">Early Arrival</option>
                    <option value="Delayed">Delayed / Late Arrival</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold uppercase">Variance (Mins: - early, + late)</label>
                  <input
                    type="number"
                    value={logVariance}
                    onChange={(e) => setLogVariance(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold uppercase">ELD HOS Log Audit Status</label>
                <select
                  value={logHosStatus}
                  onChange={(e) => setLogHosStatus(e.target.value as 'Clean' | 'Warning' | 'Violation')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Clean">Clean Log (100% rest breaks compliant)</option>
                  <option value="Warning">Approached Driving Threshold (&lt; 45m buffer)</option>
                  <option value="Violation">11h / 14h Rule Exceeded (Violation)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold uppercase">Auditor / Dispatcher Notes</label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  Save &amp; Recalculate Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

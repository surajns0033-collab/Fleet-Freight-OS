import React, { useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, RotateCcw, 
  Clock, Gauge, Compass, Fuel, Truck, MapPin, X, 
  Calendar, Award, CheckCircle2, ChevronRight, Activity, ShieldCheck
} from 'lucide-react';
import { HistoricalTripReplay, BreadcrumbPoint } from '../data/tripBreadcrumbs';

interface TripReplayOverlayProps {
  availableTrips: HistoricalTripReplay[];
  selectedTrip: HistoricalTripReplay;
  onSelectTrip: (trip: HistoricalTripReplay) => void;
  currentIndex: number;
  onIndexChange: (idx: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onClose: () => void;
}

export const TripReplayOverlay: React.FC<TripReplayOverlayProps> = ({
  availableTrips,
  selectedTrip,
  onSelectTrip,
  currentIndex,
  onIndexChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  onClose
}) => {
  const currentPoint: BreadcrumbPoint = selectedTrip.breadcrumbs[currentIndex] || selectedTrip.breadcrumbs[0];
  const totalPoints = selectedTrip.breadcrumbs.length;
  const progressPct = totalPoints > 1 ? (currentIndex / (totalPoints - 1)) * 100 : 0;

  // Auto-advance playback interval
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(250, Math.floor(1200 / playbackSpeed));
    const timer = setInterval(() => {
      onIndexChange((prev) => {
        if (prev >= totalPoints - 1) {
          onTogglePlay(); // stop at end
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, totalPoints, onIndexChange, onTogglePlay]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none p-3 sm:p-5 flex flex-col items-center">
      {/* Replay HUD and Scrubber Card */}
      <div className="w-full max-w-4xl bg-slate-950/95 border border-amber-500/60 rounded-2xl shadow-2xl shadow-black/90 p-4 sm:p-5 backdrop-blur-md pointer-events-auto text-white space-y-4 animate-slideUp">
        
        {/* Top Header: Trip Selector, Badges, Close */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  24H HISTORICAL REPLAY
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Completed {selectedTrip.completedAgo}
                </span>
              </div>

              {/* Trip Switcher Dropdown */}
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={selectedTrip.tripId}
                  onChange={(e) => {
                    const found = availableTrips.find(t => t.tripId === e.target.value);
                    if (found) {
                      onSelectTrip(found);
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {availableTrips.map(t => (
                    <option key={t.tripId} value={t.tripId}>
                      {t.tripId} &bull; {t.unitId} ({t.origin.split(' ')[0]} → {t.destination.split(' ')[0]} - {t.totalDistanceMiles} mi)
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-300 font-semibold hidden md:inline">
                  Driver: <strong className="text-amber-300">{selectedTrip.driverName}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Speed Multiplier */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs font-mono">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onChangeSpeed(spd)}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                    playbackSpeed === spd 
                      ? 'bg-amber-500 text-slate-950 shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Exit Replay Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Exit Historical Replay Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Breadcrumb Telematics Telemetry HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Recorded Timestamp
            </div>
            <div className="text-sm font-black font-mono text-white mt-0.5">
              {currentPoint.timestamp}
            </div>
            <div className="text-[10px] text-slate-400">
              +{currentPoint.timeOffsetMins} min into run
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-400" />
              GPS Speed &amp; Heading
            </div>
            <div className="text-sm font-black font-mono text-cyan-300 mt-0.5">
              {currentPoint.speedMph} MPH
            </div>
            <div className="text-[10px] text-slate-400">
              Heading: {currentPoint.headingDeg}&deg; &bull; {currentPoint.engineRpm} RPM
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
              <Fuel className="w-3 h-3 text-amber-400" />
              Fuel Burn Rate
            </div>
            <div className="text-sm font-black font-mono text-amber-300 mt-0.5">
              {currentPoint.fuelBurnRateGalHr} gal/hr
            </div>
            <div className="text-[10px] text-slate-400">
              Coolant: {currentPoint.coolantTempF}&deg;F
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              Waypoint Location
            </div>
            <div className="text-xs font-bold text-white mt-0.5 truncate" title={currentPoint.locationName}>
              {currentPoint.locationName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              Odo: {currentPoint.odometerMiles.toLocaleString()} mi
            </div>
          </div>
        </div>

        {/* Milestone Note / Event Callout */}
        {currentPoint.eventNote && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-ping"></span>
            <span className="font-semibold text-amber-200">
              <strong className="text-amber-400 font-mono">[{currentPoint.landmarkType || 'Event'}]:</strong> {currentPoint.eventNote}
            </span>
          </div>
        )}

        {/* Timeline Range Scrubber and Playback Controls */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 transition-all shrink-0"
              title={isPlaying ? 'Pause Replay' : 'Play Replay'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
            </button>

            <button
              onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 text-slate-300 border border-slate-800"
              title="Step Previous Breadcrumb"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Custom Interactive Range Scrubber */}
            <div className="flex-1 flex flex-col justify-center">
              <input
                type="range"
                min={0}
                max={totalPoints - 1}
                value={currentIndex}
                onChange={(e) => onIndexChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>Waypoint {currentIndex + 1} of {totalPoints} ({progressPct.toFixed(0)}%)</span>
                <span>{selectedTrip.origin.split(',')[0]} &rarr; {selectedTrip.destination.split(',')[0]} ({selectedTrip.totalDistanceMiles} mi)</span>
              </div>
            </div>

            <button
              onClick={() => onIndexChange(Math.min(totalPoints - 1, currentIndex + 1))}
              disabled={currentIndex === totalPoints - 1}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 disabled:opacity-40 text-slate-300 border border-slate-800"
              title="Step Next Breadcrumb"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => onIndexChange(0)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800"
              title="Restart from Departure"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

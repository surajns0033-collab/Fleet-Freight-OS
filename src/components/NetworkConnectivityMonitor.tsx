import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, WifiOff, RefreshCw, Activity, Server, 
  CheckCircle2, AlertOctagon, X, ChevronDown, Radio, ShieldCheck
} from 'lucide-react';

interface NetworkConnectivityMonitorProps {
  theme?: 'dark' | 'day';
}

export const NetworkConnectivityMonitor: React.FC<NetworkConnectivityMonitorProps> = ({ theme = 'dark' }) => {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [latency, setLatency] = useState<number>(28);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [showPopover, setShowPopover] = useState<boolean>(false);
  const [showBannerWarning, setShowBannerWarning] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Overall effective connection status
  const isConnected = isBrowserOnline && !isSimulatedOffline;

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      setLatency(Math.floor(22 + Math.random() * 14));
      setLastHeartbeat(new Date());
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
      setShowBannerWarning(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic heartbeat simulation when connected
  useEffect(() => {
    if (!isConnected) {
      setShowBannerWarning(true);
      return;
    }

    const interval = setInterval(() => {
      // Simulate real-world network jitter between 20ms and 36ms
      const jitter = Math.floor(20 + Math.random() * 16);
      setLatency(jitter);
      setLastHeartbeat(new Date());
    }, 7000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Handle outside clicks to close popover
  useEffect(() => {
    const handleMousedown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleMousedown);
    return () => document.removeEventListener('mousedown', handleMousedown);
  }, []);

  const handleManualReconnect = () => {
    setIsReconnecting(true);
    setReconnectAttempts(prev => prev + 1);

    setTimeout(() => {
      setIsSimulatedOffline(false);
      setIsBrowserOnline(navigator.onLine);
      setIsReconnecting(false);
      setShowBannerWarning(false);
      setLatency(Math.floor(22 + Math.random() * 10));
      setLastHeartbeat(new Date());
    }, 1200);
  };

  const handleToggleSimulatedOffline = () => {
    if (isConnected) {
      setIsSimulatedOffline(true);
      setShowBannerWarning(true);
    } else {
      setIsSimulatedOffline(false);
      setShowBannerWarning(false);
      setLatency(Math.floor(24 + Math.random() * 12));
      setLastHeartbeat(new Date());
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Subtle Status Button in Navbar */}
      <button
        onClick={() => setShowPopover(!showPopover)}
        id="network-connectivity-btn"
        className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all group ${
          isConnected
            ? theme === 'day'
              ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-800'
              : 'bg-slate-800/90 hover:bg-slate-750 border-slate-700/80 text-slate-300 hover:text-white'
            : 'bg-rose-500/20 border-rose-500/60 text-rose-300 ring-2 ring-rose-500/40 animate-pulse'
        }`}
        title={
          isConnected
            ? `Telematics Server Connected (Latency: ${latency}ms, Heartbeat active)`
            : 'ALERT: Telematics Server Connection Lost!'
        }
        aria-label="Telematics server connection status"
      >
        {/* Subtle Status Icon with Pulse Ring */}
        <div className="relative flex items-center justify-center">
          {isConnected ? (
            <>
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </>
          ) : (
            <>
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-90"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <WifiOff className="w-4 h-4 text-rose-400 animate-bounce" />
            </>
          )}
        </div>

        {/* Text Label (Hidden on small mobile screens, visible on tablet/desktop) */}
        <div className="hidden md:flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-bold ${isConnected ? 'text-white' : 'text-rose-300'}`}>
              {isConnected ? 'Telematics Stream' : 'Server Offline'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5">
            {isConnected ? `${latency}ms ping` : 'Link severed'}
          </span>
        </div>

        <ChevronDown className={`w-3 h-3 transition-transform ${showPopover ? 'rotate-180' : ''} ${
          isConnected ? 'text-slate-400' : 'text-rose-300'
        }`} />
      </button>

      {/* Disconnect Alert Floating Toast / Banner (Triggered when connection drops) */}
      {showBannerWarning && !isConnected && (
        <div className="fixed top-20 right-4 z-50 max-w-md w-full bg-rose-950/95 border-2 border-rose-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-slideIn">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    Telematics Connection Severed
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500 text-slate-950">
                    CRITICAL
                  </span>
                </div>
                <p className="text-xs text-rose-200 leading-relaxed">
                  Lost connection to Fleet CAN-bus gateway (<code className="font-mono text-rose-300">telematics-edge.fleetos.io</code>). Live GPS coordinates, J1939 engine faults, and driver HOS duty sync are suspended.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleManualReconnect}
                    disabled={isReconnecting}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
                    <span>{isReconnecting ? 'Attempting Handshake...' : 'Reconnect Telematics'}</span>
                  </button>
                  <button
                    onClick={() => setShowBannerWarning(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-300 text-xs font-semibold"
                  >
                    Dismiss Notice
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBannerWarning(false)}
              className="text-rose-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Popover Dropdown with Real-Time Telemetry Connection Details */}
      {showPopover && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl p-4 z-50 text-left animate-fadeIn space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isConnected ? <Activity className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Telematics Connection Monitor</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Real-time J1939 &amp; ELD telemetry stream
                </div>
              </div>
            </div>

            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
            }`}>
              {isConnected ? 'ONLINE' : 'DISCONNECTED'}
            </span>
          </div>

          {/* Diagnostics Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Round-Trip Latency</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${
                isConnected 
                  ? latency < 50 ? 'text-emerald-400' : 'text-amber-400' 
                  : 'text-rose-400'
              }`}>
                {isConnected ? `${latency} ms` : 'Timeout (∞)'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {isConnected ? 'Low jitter nominal' : 'Packets dropping'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Heartbeat Sync</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                {isConnected ? 'Active' : 'Halted'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                {lastHeartbeat.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Telemetry Gateway</div>
              <div className="text-xs font-bold font-mono text-slate-200 mt-0.5 truncate" title="telematics-edge.fleetos.io:443">
                telematics-edge.io
              </div>
              <div className="text-[10px] text-slate-500">
                Port 443 &bull; WSS Secure
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Fleet Data Throughput</div>
              <div className="text-xs font-bold font-mono text-amber-400 mt-0.5">
                {isConnected ? '142 frames/sec' : '0 frames/sec'}
              </div>
              <div className="text-[10px] text-slate-500">
                CAN-bus ECM feed
              </div>
            </div>
          </div>

          {/* Network Details & Protocol */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Client Transport:</span>
              <span className="font-mono text-white">WebSocket (J1939 Binary)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Host IP Route:</span>
              <span className="font-mono text-slate-300">198.51.100.42 (Primary)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Browser Online Status:</span>
              <span className={`font-mono font-bold ${isBrowserOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isBrowserOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
            {reconnectAttempts > 0 && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Handshake Retries:</span>
                <span className="font-mono text-amber-400">{reconnectAttempts}</span>
              </div>
            )}
          </div>

          {/* Action Controls & Simulation Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={handleToggleSimulatedOffline}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isConnected
                  ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-rose-500/30 hover:border-rose-500/60'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm'
              }`}
            >
              {isConnected ? 'Simulate Server Disconnect' : 'Restore Telematics Feed'}
            </button>

            <button
              onClick={handleManualReconnect}
              disabled={isReconnecting}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
              <span>{isReconnecting ? 'Pinging...' : 'Ping Server'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

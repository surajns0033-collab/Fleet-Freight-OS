import React, { useState, useRef, useEffect } from 'react';
import { 
  Truck, LayoutDashboard, Send, Activity, TrendingDown, 
  Clock, ThermometerSnowflake, FileCode, Smartphone, AlertTriangle, 
  CheckCircle2, User, ChevronDown, Check, ShieldCheck, MapPin, BrainCircuit,
  Map as MapIcon, Briefcase, Sun, Moon, Bot
} from 'lucide-react';
import { OperatorProfile, Driver } from '../types';
import { NetworkConnectivityMonitor } from './NetworkConnectivityMonitor';
import { HOSLimitAlertBadge } from './HOSLimitAlertBadge';

interface AppNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  alertCount: number;
  isCabMode: boolean;
  setIsCabMode: (val: boolean) => void;
  onOpenAlertsModal: () => void;
  activeOperator?: OperatorProfile;
  availableOperators?: OperatorProfile[];
  onSelectOperator?: (operator: OperatorProfile) => void;
  theme?: 'dark' | 'day';
  onToggleTheme?: () => void;
  drivers?: Driver[];
}

const DEFAULT_OPERATOR: OperatorProfile = {
  id: 'OP-01',
  name: 'Corey Barron',
  role: 'Lead Freight Dispatcher',
  title: 'Senior Operations Specialist',
  terminal: 'Waterloo HQ Hub, ON',
  avatarInitials: 'CB'
};

export const AppNavbar: React.FC<AppNavbarProps> = ({
  activeTab,
  setActiveTab,
  alertCount,
  isCabMode,
  setIsCabMode,
  onOpenAlertsModal,
  activeOperator = DEFAULT_OPERATOR,
  availableOperators = [DEFAULT_OPERATOR],
  onSelectOperator,
  theme = 'dark',
  onToggleTheme,
  drivers = []
}) => {
  const currentOperator = activeOperator || DEFAULT_OPERATOR;
  const operatorList = (availableOperators && availableOperators.length > 0) ? availableOperators : [DEFAULT_OPERATOR];
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'agent', label: 'Fleet AI Agent', icon: Bot },
    { id: 'map', label: 'Google Maps Fleet', icon: MapIcon },
    { id: 'workspace', label: 'Google Workspace Hub', icon: Briefcase },
    { id: 'dispatch', label: 'Dispatch & Matching', icon: Send },
    { id: 'predictive', label: 'AI Predictive Logistics', icon: BrainCircuit },
    { id: 'telematics', label: 'Fleet Telematics', icon: Activity },
    { id: 'optimizer', label: 'Deadhead Optimizer', icon: TrendingDown },
    { id: 'hos', label: 'Driver HOS Clocks', icon: Clock },
    { id: 'reefer', label: 'Cold Chain & Reefer', icon: ThermometerSnowflake },
    { id: 'edi', label: 'EDI 204/214 Bridge', icon: FileCode },
    { id: 'cabpilot', label: 'Mobile Apps Suite', icon: Smartphone },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => {
                setActiveTab('overview');
                setIsCabMode(false);
              }}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Truck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-base sm:text-xl tracking-tight">
                    <span className="text-amber-400 font-extrabold">Fleet &amp; Freight</span> OS
                  </span>
                  <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase">
                    Commercial Ops
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="hidden sm:inline">Commercial Fleet Management &amp; Driver Dispatch</span>
                  <span className="sm:hidden font-mono">100+ Fleet Online</span>
                </div>
              </div>
            </button>
          </div>

          {/* Right Action Section: Operator Profile Name Badge, Alerts, & In-Cab Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active User / Operator Name Badge */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 flex items-center gap-2.5 transition-all text-left group"
                title={`Logged in as ${currentOperator.name} (${currentOperator.role})`}
              >
                {/* Initials Avatar */}
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  {currentOperator.avatarInitials}
                </div>

                {/* Operator Name & Role Details (Desktop & Tablet) */}
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      {currentOperator.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-medium font-mono">
                      {currentOperator.role.split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                    {currentOperator.role}
                  </div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
              </button>

              {/* Operator Switcher Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl p-2 z-50 animate-fadeIn">
                  <div className="p-2.5 border-b border-slate-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                      Current Active Operator
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {currentOperator.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {currentOperator.role} &bull; {currentOperator.terminal}
                    </div>
                  </div>

                  <div className="py-1">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase text-slate-500 font-mono">
                      Switch Active User Persona:
                    </div>
                    {operatorList.map((op) => {
                      const isCurrent = op.id === currentOperator.id;
                      return (
                        <button
                          key={op.id}
                          onClick={() => {
                            onSelectOperator?.(op);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all ${
                            isCurrent
                              ? 'bg-amber-500/10 border border-amber-500/30 text-white'
                              : 'hover:bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {op.avatarInitials}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white leading-tight">
                                {op.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {op.role}
                              </div>
                            </div>
                          </div>

                          {isCurrent && (
                            <Check className="w-4 h-4 text-amber-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Driver HOS Regulatory Limit Warning Badge */}
            <HOSLimitAlertBadge 
              drivers={drivers} 
              onNavigateToHOS={() => {
                setActiveTab('hos');
                setIsCabMode(false);
              }}
              theme={theme}
            />

            {/* Telematics Network Connectivity Monitor */}
            <NetworkConnectivityMonitor theme={theme} />

            {/* Global Theme Toggle: Dark Mode vs High-Contrast Day Mode */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                id="theme-toggle-btn"
                className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  theme === 'day'
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500 ring-2 ring-amber-400/40 shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
                }`}
                title={theme === 'day' ? 'Switch to Night Mode (Dark)' : 'Switch to High-Contrast Day Mode (Bright Environments)'}
                aria-label="Toggle display theme"
              >
                {theme === 'day' ? (
                  <>
                    <Sun className="w-4 h-4 text-slate-950 fill-amber-500" />
                    <span className="hidden sm:inline">Day Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Night Mode</span>
                  </>
                )}
              </button>
            )}

            {/* Critical Operational Alerts */}
            <button
              onClick={onOpenAlertsModal}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                alertCount > 0
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={`${alertCount} Active Operational Alerts`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">{alertCount} Alerts</span>
            </button>

            {/* In-Cab Mobile Driver Mode Toggle */}
            <button
              onClick={() => {
                setIsCabMode(!isCabMode);
                if (!isCabMode) {
                  setActiveTab('cabpilot');
                } else {
                  setActiveTab('overview');
                }
              }}
              className={`px-3 py-2 rounded-xl font-bold text-xs border flex items-center gap-2 transition-all ${
                isCabMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">
                {isCabMode ? 'Exit Mobile Apps' : 'Mobile Apps (Driver & Dispatcher)'}
              </span>
              <span className="md:hidden">
                {isCabMode ? 'Exit Apps' : 'Mobile Apps'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      {!isCabMode && (
        <div className="bg-slate-950/80 border-t border-slate-800/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

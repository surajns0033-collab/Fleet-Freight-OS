import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, User, ShieldCheck, Clock, 
  Radio, CheckCheck, Sparkles, ChevronDown, ChevronUp, 
  Volume2, VolumeX, AlertCircle, Truck, PhoneCall
} from 'lucide-react';
import { Driver, ChatMessage } from '../types';

interface DriverCabChatProps {
  driver: Driver;
  dispatcherName?: string;
  dispatcherTerminal?: string;
  themeMode?: 'dark' | 'day';
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'dispatcher',
    senderName: 'Corey Barron',
    senderRole: 'Lead Dispatcher (Waterloo HQ)',
    timestamp: '08:15 EDT',
    text: 'Good morning Wayne. Load ORD-2026-9041 is pre-cleared for Ambassador Bridge FAST lane. Consignee dock window is firm at 14:00.',
    read: true,
    priority: 'normal'
  },
  {
    id: 'msg-2',
    sender: 'driver',
    senderName: 'Wayne MacLeod',
    senderRole: 'Class-1 Senior Driver (TRK-104)',
    timestamp: '08:22 EDT',
    text: 'Pre-trip completed. Heading onto Hwy 401 West now. Weather looks clear through Chatham-Kent.',
    read: true,
    priority: 'normal'
  },
  {
    id: 'msg-3',
    sender: 'dispatcher',
    senderName: 'Corey Barron',
    senderRole: 'Lead Dispatcher (Waterloo HQ)',
    timestamp: '09:48 EDT',
    text: 'CBP automated customs gate release confirmed in ACE portal. You are clear on secondary inspection.',
    read: true,
    priority: 'normal'
  }
];

const QUICK_RESPONSES = [
  'Arrived at consignee gate dock',
  'Waiting in staging queue (+15m)',
  'Customs cleared at Ambassador Bridge',
  'Traffic congestion on Hwy 401',
  'Fueling & 30m rest break taken',
  'PoD signed by receiver'
];

export const DriverCabChat: React.FC<DriverCabChatProps> = ({
  driver,
  dispatcherName = 'Corey Barron',
  dispatcherTerminal = 'Waterloo HQ Hub',
  themeMode = 'dark'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef(true);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth', force = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (force || isNearBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isExpanded) {
      scrollToBottom('smooth');
    }
  }, [messages, isExpanded, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'driver',
      senderName: driver.name,
      senderRole: `Driver (${driver.current_truck_id || 'Cab'})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
      read: true,
      priority: 'normal'
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Trigger realistic dispatcher acknowledgment after 1.8 seconds
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = `Copy that, ${driver.name.split(' ')[0]}. Logged in Fleet Dispatch. Keep the rubber on the road.`;
      
      const lower = text.toLowerCase();
      if (lower.includes('gate') || lower.includes('arrived') || lower.includes('dock')) {
        replyText = `Understood ${driver.name.split(' ')[0]}! Receiver dock master notified. Detention clock auto-syncing.`;
      } else if (lower.includes('customs') || lower.includes('bridge')) {
        replyText = `Excellent news. PAPS match is 100% green on our US Customs feed. Proceed straight to unload.`;
      } else if (lower.includes('traffic') || lower.includes('hwy')) {
        replyText = `Roger that. Telematics corridor re-calculating ETA. You still have 45 min buffer before appointment late flag.`;
      } else if (lower.includes('pod') || lower.includes('signed')) {
        replyText = `Brilliant. PoD electronic scan received and queued for billing. Safe travels on the return run!`;
      }

      const dispatchReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'dispatcher',
        senderName: dispatcherName,
        senderRole: `Lead Dispatcher (${dispatcherTerminal})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: replyText,
        read: true,
        priority: 'normal'
      };

      setMessages(prev => [...prev, dispatchReply]);
    }, 1800);
  };

  const isNight = themeMode === 'dark';

  return (
    <div 
      id="driver-cab-chat-container"
      className={`rounded-2xl border transition-all shadow-xl overflow-hidden ${
        isNight 
          ? 'bg-slate-950 border-slate-800 text-white' 
          : 'bg-white border-slate-300 text-slate-900'
      }`}
    >
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer border-b transition-colors ${
          isNight 
            ? 'bg-slate-900 hover:bg-slate-850 border-slate-800' 
            : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Dispatcher Live Comms</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                CAN-Bus Connected
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <span>Assigned:</span>
              <strong className="text-amber-400 font-semibold">{dispatcherName}</strong>
              <span className="hidden sm:inline">&bull; {dispatcherTerminal}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title={soundEnabled ? 'Mute cab audio chime' : 'Enable cab audio chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            title={isExpanded ? 'Collapse Comms' : 'Expand Comms'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Chat Body */}
      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-4">
          {/* Messages Scroll Area */}
          <div 
            ref={messagesContainerRef}
            className="h-64 sm:h-72 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800"
          >
            {messages.map((msg) => {
              const isMe = msg.sender === 'driver';
              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400 font-mono">
                    <span className="font-bold text-slate-300">{msg.senderName}</span>
                    <span>&bull;</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div 
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                      isMe 
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs shadow-amber-500/10' 
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 px-1 font-mono">
                    <CheckCheck className="w-3 h-3 text-cyan-400" />
                    <span>Delivered to Telematics Gateway</span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>{dispatcherName} (Dispatch) is typing...</span>
              </div>
            )}
          </div>

          {/* Quick 1-Tap Canned Responses for Cab Touch Comfort */}
          <div className="space-y-1.5 border-t border-slate-800 pt-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              1-Tap Quick Driver Updates
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
              {QUICK_RESPONSES.map((quick, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(quick)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{quick}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Input Row */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              id="driver-cab-chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message to Dispatcher Corey Barron..."
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

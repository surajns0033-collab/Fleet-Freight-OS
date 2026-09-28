import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, User, Sparkles, RefreshCw, AlertCircle, 
  Trash2, ShieldCheck, Scale, Wrench, Truck, ChevronDown, Check
} from 'lucide-react';
import { db, collection, addDoc, serverTimestamp } from '../../services/firebase';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  timestamp: string;
}

const ROLES = [
  {
    id: 'dispatch',
    name: 'Fleet Dispatch & Freight Coordinator',
    badge: 'Operations',
    icon: Truck,
    description: 'Load tenders, driver assignments, deadhead reduction along 401/402 corridor'
  },
  {
    id: 'customs',
    name: 'Cross-Border Customs & CBSA/CBP Specialist',
    badge: 'Border Compliance',
    icon: ShieldCheck,
    description: 'ACI/ACE e-Manifests, PARS/PAPS barcode status, Ambassador & Blue Water Bridges'
  },
  {
    id: 'hos',
    name: 'Driver HOS & Safety Compliance Officer',
    badge: 'ELD & HOS',
    icon: Scale,
    description: 'FMCSA 49 CFR Part 395 and Canadian SOR/2005-313, 14-hour clocks, 36h resets'
  },
  {
    id: 'maintenance',
    name: 'SAE J1939 Telematics & Diesel Engineer',
    badge: 'Diagnostics',
    icon: Wrench,
    description: 'CAN bus fault codes (SPN/FMI), DEF crystallization, DPF regen schedules'
  }
];

const MODELS = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'gemini-3.1-flash-lite',
    label: 'Flash Lite (Ultra Fast & Highly Available)',
    tag: 'Recommended Default'
  },
  {
    id: 'gemini-3.8-flash',
    name: 'gemini-3.8-flash',
    label: 'Flash 3.8 (General Tasks)',
    tag: 'Standard Dispatch'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'gemini-3.1-pro-preview',
    label: 'Pro (Complex Reasoning)',
    tag: 'Heavy Tasks & Calculations'
  }
];

export const GeminiChatbot: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('dispatch');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: "Hello! I am your Fleet Copilot. How can I assist with your freight dispatching, cross-border customs manifests, or HOS compliance today?",
      modelUsed: 'gemini-3.1-flash-lite',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
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
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setErrorMessage(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Prepare payload for backend multi-turn chat
      const payloadMessages = newHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          model: selectedModel,
          systemRole: selectedRole
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Chat request failed');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        modelUsed: data.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Save conversation log to Firestore if connected
      try {
        if (db) {
          await addDoc(collection(db, 'user_ai_logs'), {
            type: 'chat_interaction',
            model: selectedModel,
            role: selectedRole,
            userPrompt: userText,
            assistantReply: data.reply,
            createdAt: serverTimestamp()
          });
        }
      } catch {
        // Logging skipped silently
      }

    } catch (err: any) {
      setErrorMessage(err.message || 'Dispatch copilot is experiencing high demand. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        content: "Conversation history reset. Select a role and ask any question!",
        modelUsed: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const currentRoleConfig = ROLES.find(r => r.id === selectedRole) || ROLES[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-[750px]">
      {/* Header with Role and Model Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black shadow-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Gemini Multi-Turn Dispatch Chatbot
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-amber-950/80 border border-amber-800/80 text-amber-300">
                  Role-Aware
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Maintains continuous dialogue history with dedicated system instructions and model switching.
              </p>
            </div>
          </div>
        </div>

        {/* Action toolbar */}
        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] px-2 font-medium">Model:</span>
            {MODELS.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id)}
                title={m.tag}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  selectedModel === m.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label.split(' ')[0]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClearHistory}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role Selection Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-b border-slate-800/80">
        {ROLES.map(role => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isSelected 
                  ? 'border-amber-500 bg-amber-950/30 text-white shadow' 
                  : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold truncate">{role.name.split(' ')[0]} {role.name.split(' ')[1]}</span>
              </div>
              <span className="text-[10px] text-slate-500 block truncate">{role.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Message Thread */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-4 py-4 pr-2"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
              msg.role === 'user'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-amber-400 border border-slate-700'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[80%] rounded-xl p-4 text-xs ${
              msg.role === 'user'
                ? 'bg-amber-500 text-slate-950 font-medium'
                : 'bg-slate-950 border border-slate-800 text-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[10px] opacity-75 mb-1.5 font-mono">
                <span>{msg.role === 'user' ? 'You' : currentRoleConfig.name}</span>
                <span className="flex items-center gap-1">
                  {msg.modelUsed && <span>{msg.modelUsed}</span>}
                  <span>&bull;</span>
                  <span>{msg.timestamp}</span>
                </span>
              </div>
              <div className="leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>{selectedModel} is evaluating request with {currentRoleConfig.badge} system context...</span>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mb-3 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Suggested Quick Inquiries */}
      <div className="pt-2 pb-3 flex flex-wrap gap-1.5">
        {[
          'Check backhaul options from Detroit to Toronto',
          'Calculate driver rest hours for 14-hour FMCSA clock',
          'Explain CBSA ACI e-Manifest filing lead time requirements',
          'Troubleshoot J1939 SPN 3251 FMI 0 DPF differential pressure'
        ].map((promptText, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInputMessage(promptText)}
            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 transition-colors truncate max-w-xs"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSendMessage} className="relative">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Ask ${currentRoleConfig.name} (${selectedModel})...`}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-24 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="absolute right-2 top-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </form>
    </div>
  );
};

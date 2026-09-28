import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, VolumeX, Sparkles, Activity, Radio, 
  AlertCircle, CheckCircle2, PhoneCall, PhoneOff
} from 'lucide-react';

export const LiveVoiceAssistant: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcriptHistory, setTranscriptHistory] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    { sender: 'assistant', text: 'Fleet Live Voice Assistant ready. Click Start Voice Conversation to speak in real-time with gemini-3.1-flash-live-preview.', time: 'System' }
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  // Helper to convert Float32Array PCM to base64
  const pcmToBase64 = (pcmData: Float32Array): string => {
    const pcm16 = new Int16Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      const s = Math.max(-1, Math.min(1, pcmData[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const bytes = new Uint8Array(pcm16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Play queued audio chunks at 24kHz
  const playNextChunk = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsAssistantSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsAssistantSpeaking(true);

    const chunk = audioQueueRef.current.shift()!;
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;

    const buffer = ctx.createBuffer(1, chunk.length, 24000);
    buffer.copyToChannel(chunk, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      playNextChunk();
    };
    source.start();
  };

  const handleStartVoiceSession = async () => {
    setErrorMsg(null);
    try {
      // 1. Establish WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-voice`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setTranscriptHistory(prev => [
          ...prev, 
          { sender: 'assistant', text: 'Live session connected. Listening to your microphone...', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);

        // 2. Initialize Audio
        inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
        const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputAudioCtxRef.current.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputChannel = e.inputBuffer.getChannelData(0);
            // Check volume threshold to toggle speaking indicator
            let sum = 0;
            for (let i = 0; i < inputChannel.length; i++) {
              sum += Math.abs(inputChannel[i]);
            }
            const avg = sum / inputChannel.length;
            setIsTalking(avg > 0.02);

            const base64Audio = pcmToBase64(inputChannel);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            setErrorMsg(msg.error);
            return;
          }

          if (msg.interrupted) {
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            setIsAssistantSpeaking(false);
            return;
          }

          if (msg.audio) {
            // Decode raw PCM base64 string
            const binary = atob(msg.audio);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const int16 = new Int16Array(bytes.buffer);
            const float32 = new Float32Array(int16.length);
            for (let i = 0; i < int16.length; i++) {
              float32[i] = int16[i] / 32768.0;
            }

            audioQueueRef.current.push(float32);
            if (!isPlayingRef.current) {
              playNextChunk();
            }
          }
        } catch (e) {
          console.error('Failed parsing live message:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('Live WebSocket error:', e);
        setErrorMsg('Live WebSocket connection failed. Ensure server is active.');
      };

      ws.onclose = () => {
        handleStopVoiceSession();
      };

    } catch (err: any) {
      console.error('Voice session start error:', err);
      setErrorMsg(err.message || 'Microphone access denied or audio initialization error.');
    }
  };

  const handleStopVoiceSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }

    setIsConnected(false);
    setIsTalking(false);
    setIsAssistantSpeaking(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  useEffect(() => {
    return () => {
      handleStopVoiceSession();
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-lg font-black">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Real-Time Voice Conversations
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
                gemini-3.1-flash-live-preview (Live API)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hands-free, bidirectional voice dialogue with Gemini Live API for dispatch updates, routing, and HOS advisories.
            </p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              Live Connected (16kHz / 24kHz)
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-500 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              Disconnected
            </div>
          )}
        </div>
      </div>

      {/* Voice Control & Equalizer Visualizer */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visualizer and Mic Status */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="relative my-4">
            {/* Pulsing rings */}
            {isConnected && (
              <>
                <div className={`absolute inset-0 rounded-full ${isAssistantSpeaking ? 'bg-indigo-500/20 animate-ping' : isTalking ? 'bg-emerald-500/20 animate-ping' : ''}`} />
                <div className={`absolute -inset-4 rounded-full border border-dashed ${isAssistantSpeaking ? 'border-indigo-500/40 animate-spin' : isTalking ? 'border-emerald-500/40' : 'border-slate-800'}`} style={{ animationDuration: '8s' }} />
              </>
            )}

            <button
              type="button"
              onClick={isConnected ? handleStopVoiceSession : handleStartVoiceSession}
              className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${
                isConnected
                  ? isAssistantSpeaking 
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-500/40'
                    : isTalking
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-emerald-500/40'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isConnected ? (
                isAssistantSpeaking ? (
                  <>
                    <Volume2 className="w-8 h-8 animate-bounce" />
                    <span className="text-[10px] font-bold uppercase mt-1">Speaking</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase mt-1">Listening</span>
                  </>
                )
              ) : (
                <>
                  <PhoneCall className="w-8 h-8" />
                  <span className="text-[10px] font-bold uppercase mt-1">Start Call</span>
                </>
              )}
            </button>
          </div>

          {/* Equalizer animation */}
          <div className="flex items-center justify-center gap-1.5 h-8 my-3">
            {[40, 70, 25, 90, 50, 85, 30, 60, 95, 45, 75, 35].map((height, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isConnected && (isTalking || isAssistantSpeaking)
                    ? isAssistantSpeaking 
                      ? 'bg-indigo-400' 
                      : 'bg-emerald-400'
                    : 'bg-slate-800'
                }`}
                style={{
                  height: isConnected && (isTalking || isAssistantSpeaking) 
                    ? `${Math.max(12, (height * (isTalking ? 0.9 : 1.1)) % 32)}px` 
                    : '6px'
                }}
              />
            ))}
          </div>

          <div className="mt-2 space-y-1">
            <p className="text-xs font-semibold text-white">
              {isConnected 
                ? isAssistantSpeaking 
                  ? 'Gemini Live Speaking (Zephyr Voice)'
                  : isTalking 
                  ? 'Capturing Dispatcher Microphone...' 
                  : 'Listening for voice input...'
                : 'Live Audio Session Inactive'}
            </p>
            <p className="text-[11px] text-slate-500">
              Low-latency WebSocket audio bridge with auto-interruption handling.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {isConnected ? (
              <button
                type="button"
                onClick={handleStopVoiceSession}
                className="px-4 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                End Live Call
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartVoiceSession}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                Start Voice Conversation
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Conversation Activity Log */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Live Session Activity &amp; Guidance
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Model: gemini-3.1-flash-live-preview
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
            {transcriptHistory.map((item, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg ${
                  item.sender === 'assistant'
                    ? 'bg-slate-900 border border-slate-800 text-slate-300'
                    : 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 ml-6'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                  <span>{item.sender === 'assistant' ? 'Fleet Live Assistant' : 'You (Dispatcher)'}</span>
                  <span>{item.time}</span>
                </div>
                <p className="leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Prompt suggestions to speak */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1.5">Try saying:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                '"Check weather along Hwy 401 London corridor"',
                '"What is the current wait time at Ambassador Bridge?"',
                '"How many driving hours does Driver John Miller have left?"'
              ].map((suggestion, i) => (
                <span 
                  key={i}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400"
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

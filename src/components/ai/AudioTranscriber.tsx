import React, { useState, useRef } from 'react';
import { 
  Mic, Square, Upload, FileText, Copy, Check, 
  Download, RefreshCw, AlertCircle, Play, Volume2, Sparkles
} from 'lucide-react';
import { db, collection, addDoc, serverTimestamp } from '../../services/firebase';

export const AudioTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('audio/webm');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    setErrorMsg(null);
    setTranscript(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setMimeType(recorder.mimeType || 'audio/webm');
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Mic recording error:', err);
      setErrorMsg(err.message || 'Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setErrorMsg('Please select an audio file (e.g., MP3, WAV, WebM, M4A).');
      return;
    }

    setAudioBlob(file);
    setMimeType(file.type || 'audio/mp3');
    setAudioUrl(URL.createObjectURL(file));
    setErrorMsg(null);
    setTranscript(null);
  };

  const handleTranscribe = async () => {
    if (!audioBlob) {
      setErrorMsg('Please record audio or upload an audio file first.');
      return;
    }

    setIsTranscribing(true);
    setErrorMsg(null);

    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(',')[1];

        const res = await fetch('/api/ai/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: mimeType
          })
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Transcription failed');
        }

        setTranscript(data.transcript);

        // Save log to Firestore if connected
        try {
          if (db) {
            await addDoc(collection(db, 'user_ai_logs'), {
              type: 'audio_transcription',
              model: 'gemini-3.5-transcribe',
              transcriptLength: data.transcript?.length || 0,
              createdAt: serverTimestamp()
            });
          }
        } catch (dbErr) {
          console.warn('Firestore log save skipped:', dbErr);
        }

        setIsTranscribing(false);
      };
      reader.readAsDataURL(audioBlob);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMsg(err.message || 'Failed to transcribe audio.');
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Microphone Audio Transcription
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-blue-950/80 border border-blue-800/80 text-blue-300">
                gemini-3.5-transcribe
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Record live dispatcher instructions or upload voice memos to transcribe with Gemini 3.5 Transcribe.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Recording and Upload Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Record button panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-4">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
                  isRecording 
                    ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                }`}
              >
                {isRecording ? (
                  <Square className="w-8 h-8 fill-white" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>

              <div className="mt-3">
                <span className="text-sm font-bold text-white block">
                  {isRecording ? 'Recording Active' : 'Click to Record Voice'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {isRecording ? formatSeconds(recordingDuration) : 'Microphone Ready'}
                </span>
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-500 font-bold">OR</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Audio File Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Audio File (WAV, MP3, WebM)
              </button>
            </div>
          </div>

          {/* Audio Player if available */}
          {audioUrl && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium flex items-center gap-1.5 text-white">
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  Captured Audio Recording
                </span>
                <span className="font-mono text-[11px] text-slate-500">{mimeType}</span>
              </div>
              <audio src={audioUrl} controls className="w-full h-8" />
              <button
                type="button"
                disabled={isTranscribing}
                onClick={handleTranscribe}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
              >
                {isTranscribing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Transcribing with gemini-3.5-transcribe...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Transcribe with Gemini 3.5
                  </>
                )}
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Transcript Result */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-5 min-h-[350px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Transcription Output
            </span>
            {transcript && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 py-4">
            {isTranscribing ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-xs text-blue-300 font-mono">Running gemini-3.5-transcribe neural acoustic model...</p>
              </div>
            ) : transcript ? (
              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs leading-relaxed whitespace-pre-wrap">
                {transcript}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12 space-y-2">
                <FileText className="w-10 h-10 text-slate-700" />
                <p className="text-xs">Record audio or upload an audio file and click transcribe.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

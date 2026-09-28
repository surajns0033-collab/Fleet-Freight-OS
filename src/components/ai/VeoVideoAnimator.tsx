import React, { useState, useRef } from 'react';
import { 
  Video, Sparkles, Upload, Play, Download, RefreshCw, 
  Film, AlertCircle, CheckCircle2, ChevronRight, Compass, Shield
} from 'lucide-react';
import { db, collection, addDoc, serverTimestamp } from '../../services/firebase';

const PRESET_PHOTOS = [
  {
    id: 'p1',
    name: 'Kenworth W990 Sleeper on Highway 401',
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
    prompt: 'Cinematic drone shot of this blue semi-truck traveling smoothly on a highway at golden hour, realistic asphalt reflections and exhaust heat haze.'
  },
  {
    id: 'p2',
    name: 'Freightliner Cascadia at Logistics Depot',
    url: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80',
    prompt: 'Dramatic cinematic push-in shot of the freight truck idling in the freight dock with headlights cutting through early morning mist.'
  },
  {
    id: 'p3',
    name: 'Cross-Border Tandem Rig at Dusk',
    url: 'https://images.unsplash.com/photo-1586191582156-f4893796d19a?auto=format&fit=crop&w=1200&q=80',
    prompt: 'Dynamic rolling tracking shot from alongside the cab as it crosses a suspension bridge under dramatic sunset skies.'
  }
];

export const VeoVideoAnimator: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string>(PRESET_PHOTOS[0].url);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [prompt, setPrompt] = useState<string>(PRESET_PHOTOS[0].prompt);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      // Strip data url prefix for API
      const base64Data = result.split(',')[1];
      setCustomImageBase64(base64Data);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof PRESET_PHOTOS[0]) => {
    setSelectedImage(preset.url);
    setPrompt(preset.prompt);
    setCustomImageBase64(null);
    setErrorMessage(null);
  };

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedVideoUrl(null);
    setProgressPercent(10);
    setStatusMessage('Initiating video generation with Veo 3.1 Fast (veo-3.1-fast-generate-preview)...');

    try {
      let imageBase64ToSend = customImageBase64;
      let effectiveMime = mimeType;

      // If user is using preset image URL, fetch it and convert to base64
      if (!imageBase64ToSend && selectedImage.startsWith('http')) {
        setStatusMessage('Encoding source photograph for Veo model...');
        try {
          const res = await fetch(selectedImage);
          const blob = await res.blob();
          effectiveMime = blob.type || 'image/jpeg';
          const buffer = await blob.arrayBuffer();
          let binary = '';
          const bytes = new Uint8Array(buffer);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          imageBase64ToSend = btoa(binary);
        } catch (fetchErr) {
          console.warn('Could not fetch preset image directly, generating prompt-guided video instead.');
        }
      }

      // Step 1: Start video generation
      setProgressPercent(25);
      setStatusMessage('Submitting synthesis request to veo-3.1-fast-generate-preview...');

      const startRes = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageBase64: imageBase64ToSend,
          mimeType: effectiveMime,
          aspectRatio
        })
      });

      const startData = await startRes.json();
      if (!startRes.ok || !startData.operationName) {
        throw new Error(startData.error || 'Failed to start video generation operation.');
      }

      const operationName = startData.operationName;
      setStatusMessage('Synthesizing high-definition motion frames (veo-3.1-fast-generate-preview)...');
      setProgressPercent(45);

      // Step 2: Poll operation until done
      let attempts = 0;
      const maxAttempts = 60; // Up to 3 minutes
      let isDone = false;

      while (!isDone && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 4000));
        attempts++;

        const statusRes = await fetch('/api/ai/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName })
        });

        const statusData = await statusRes.json();
        if (statusData.error) {
          throw new Error(statusData.error.message || 'Error occurred during Veo video generation');
        }

        if (statusData.done) {
          isDone = true;
          setProgressPercent(90);
          setStatusMessage('Rendering finalized. Downloading MP4 video stream...');
          break;
        } else {
          const calcProgress = Math.min(85, 45 + attempts * 2);
          setProgressPercent(calcProgress);
          const reassuringMessages = [
            'Simulating lighting vectors and particle physics...',
            'Rendering commercial vehicle kinematics and wheel rotation...',
            'Calculating perspective geometry and motion smoothing...',
            'Assembling video container...'
          ];
          setStatusMessage(reassuringMessages[attempts % reassuringMessages.length]);
        }
      }

      if (!isDone) {
        throw new Error('Video generation timed out. Please try a simpler prompt or retry.');
      }

      // Step 3: Download video
      const downloadRes = await fetch('/api/ai/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName })
      });

      if (!downloadRes.ok) {
        const errText = await downloadRes.text();
        throw new Error(`Failed to download completed video: ${errText}`);
      }

      const videoBlob = await downloadRes.blob();
      const videoObjectUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideoUrl(videoObjectUrl);
      setProgressPercent(100);
      setStatusMessage('Veo 3.1 Video successfully generated!');

      // Save log in Firestore if connected
      try {
        if (db) {
          await addDoc(collection(db, 'user_ai_logs'), {
            type: 'veo_video',
            model: 'veo-3.1-fast-generate-preview',
            aspectRatio,
            prompt,
            createdAt: serverTimestamp()
          });
        }
      } catch (dbErr) {
        console.warn('Firestore log save skipped:', dbErr);
      }

    } catch (err: any) {
      console.error('Video generation error:', err);
      setErrorMessage(err.message || 'Video generation failed. Please check Gemini API configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Animate Fleet Photos into Video
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-purple-950/80 border border-purple-800/80 text-purple-300">
                  veo-3.1-fast-generate-preview
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Transform still commercial truck photos, terminal docks, or equipment inspections into cinematic videos.
              </p>
            </div>
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] px-2 font-medium">Aspect Ratio:</span>
          <button
            type="button"
            onClick={() => setAspectRatio('16:9')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              aspectRatio === '16:9'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            16:9 Landscape
          </button>
          <button
            type="button"
            onClick={() => setAspectRatio('9:16')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              aspectRatio === '9:16'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            9:16 Portrait
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Image Selection & Prompt */}
        <div className="lg:col-span-6 space-y-5">
          {/* Source Image Preview & Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Source Image to Animate
            </label>
            <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 aspect-video max-h-64 flex items-center justify-center group">
              <img 
                src={selectedImage} 
                alt="Source preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-white/90 hover:bg-white text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Custom Photo
                </button>
              </div>
            </div>

            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="hidden" 
            />

            {/* Presets */}
            <div className="mt-3">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Or select fleet stock photo:</span>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_PHOTOS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-left rounded-md p-1.5 border transition-all text-[11px] truncate ${
                      selectedImage === preset.url 
                        ? 'border-purple-500 bg-purple-950/40 text-purple-200' 
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="h-10 rounded overflow-hidden mb-1">
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate block font-medium">{preset.name.split(' ')[0]} {preset.name.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              2. Animation Prompt &amp; Camera Movement
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how the camera moves, lighting changes, or vehicle drives..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateVideo}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating Video ({progressPercent}%)...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Video with Veo 3.1 Fast
              </>
            )}
          </button>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right Column: Output Player & Status */}
        <div className="lg:col-span-6 flex flex-col">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            3. Veo Generated Video Output ({aspectRatio})
          </label>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center p-4 min-h-[320px] relative overflow-hidden">
            {isGenerating && (
              <div className="w-full max-w-sm text-center space-y-4 py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-purple-950/80 border border-purple-600 flex items-center justify-center text-purple-400">
                  <Film className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Veo Video Engine Active</h4>
                  <p className="text-xs text-purple-300 font-mono mt-1">{statusMessage}</p>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Video synthesis typically takes between 30 to 90 seconds. Please keep this tab open.
                </p>
              </div>
            )}

            {!isGenerating && generatedVideoUrl && (
              <div className="w-full flex flex-col items-center gap-4">
                <div className={`w-full overflow-hidden rounded-lg bg-black border border-slate-800 shadow-2xl ${
                  aspectRatio === '9:16' ? 'max-w-xs aspect-[9/16]' : 'aspect-video'
                }`}>
                  <video 
                    src={generatedVideoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    playsInline 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={generatedVideoUrl}
                    download={`veo-fleet-video-${Date.now()}.mp4`}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download MP4 Video
                  </a>
                  <button
                    type="button"
                    onClick={() => setGeneratedVideoUrl(null)}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {!isGenerating && !generatedVideoUrl && (
              <div className="text-center text-slate-500 py-12 space-y-3">
                <Video className="w-12 h-12 mx-auto text-slate-700" />
                <p className="text-xs max-w-xs mx-auto">
                  Select or upload an image and click <span className="text-purple-400 font-semibold">Generate Video</span> to animate it with Veo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

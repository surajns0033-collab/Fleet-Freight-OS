import React, { useState, useEffect, useRef } from 'react';
import { Truck, RotateCw, Play, Pause, Compass, Zap, Gauge, Thermometer, ShieldAlert, Layers } from 'lucide-react';
import { Equipment } from '../types';

interface Tractor3DViewerProps {
  equipment: Equipment;
  onOpenBayTicket?: (unitId: string) => void;
}

export const Tractor3DViewer: React.FC<Tractor3DViewerProps> = ({ equipment, onOpenBayTicket }) => {
  const [rotation, setRotation] = useState<number>(35); // degrees
  const [pitch, setPitch] = useState<number>(15); // degrees
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [activeXrayComponent, setActiveXrayComponent] = useState<'all' | 'engine' | 'turbo' | 'tires' | 'cooling'>('all');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Auto rotation loop
  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setRotation(r => (r + 0.5) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // Interactive mouse drag controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setIsAutoRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setRotation(r => (r + deltaX * 0.75 + 360) % 360);
    setPitch(p => Math.max(-10, Math.min(45, p - deltaY * 0.5)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Render 3D Wireframe / Isometric Mesh onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Camera setup & perspective math
    const cx = width / 2;
    const cy = height / 2 + 15;
    const radY = (rotation * Math.PI) / 180;
    const radX = (pitch * Math.PI) / 180;

    const project = (x: number, y: number, z: number) => {
      // Rotate around Y (yaw)
      const x1 = x * Math.cos(radY) - z * Math.sin(radY);
      const z1 = x * Math.sin(radY) + z * Math.cos(radY);

      // Rotate around X (pitch)
      const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

      // Perspective scale factor
      const fov = 420;
      const distance = 460 + z2;
      const scale = fov / Math.max(distance, 50);

      return {
        px: cx + x1 * scale,
        py: cy - y2 * scale,
        depth: z2
      };
    };

    // Draw Ground Grid Platform in 3D
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = -160; gx <= 160; gx += 40) {
      const pStart = project(gx, -50, -160);
      const pEnd = project(gx, -50, 160);
      ctx.moveTo(pStart.px, pStart.py);
      ctx.lineTo(pEnd.px, pEnd.py);
    }
    for (let gz = -160; gz <= 160; gz += 40) {
      const pStart = project(-160, -50, gz);
      const pEnd = project(160, -50, gz);
      ctx.moveTo(pStart.px, pStart.py);
      ctx.lineTo(pEnd.px, pEnd.py);
    }
    ctx.stroke();

    // 3D Model Coordinates for a Class-8 Aerodynamic Semi-Tractor (Cab, Hood, Sleeper, Wind Deflector, Tandem Axles, Exhaust Stacks)
    // Cab Body definition
    const drawBox = (
      minX: number, maxX: number, 
      minY: number, maxY: number, 
      minZ: number, maxZ: number, 
      color: string, 
      fillColor?: string
    ) => {
      const v = [
        project(minX, minY, minZ), // 0
        project(maxX, minY, minZ), // 1
        project(maxX, maxY, minZ), // 2
        project(minX, maxY, minZ), // 3
        project(minX, minY, maxZ), // 4
        project(maxX, minY, maxZ), // 5
        project(maxX, maxY, maxZ), // 6
        project(minX, maxY, maxZ), // 7
      ];

      // Faces definition
      const faces = [
        [0, 1, 2, 3], // Front
        [5, 4, 7, 6], // Back
        [4, 0, 3, 7], // Left
        [1, 5, 6, 2], // Right
        [3, 2, 6, 7], // Top
        [4, 5, 1, 0]  // Bottom
      ];

      faces.forEach(face => {
        ctx.beginPath();
        ctx.moveTo(v[face[0]].px, v[face[0]].py);
        for (let i = 1; i < face.length; i++) {
          ctx.lineTo(v[face[i]].px, v[face[i]].py);
        }
        ctx.closePath();

        if (fillColor && !wireframeMode) {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = wireframeMode ? 1.5 : 1;
        ctx.stroke();
      });
    };

    // Color theme based on truck status
    const primaryColor = equipment.status === 'Diagnostic Alert' ? '#f43f5e' : '#f59e0b';
    const primaryFill = equipment.status === 'Diagnostic Alert' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(245, 158, 11, 0.2)';
    const darkCabFill = 'rgba(30, 41, 59, 0.7)';

    // 1. Chassis / Long Rails
    drawBox(-30, 30, -35, -22, -130, 100, '#64748b', 'rgba(51, 65, 85, 0.8)');

    // 2. Engine Block (Under Hood)
    if (activeXrayComponent === 'all' || activeXrayComponent === 'engine') {
      drawBox(-22, 22, -22, 10, 35, 95, '#eab308', 'rgba(234, 179, 8, 0.5)');
    }

    // 3. Front Hood / Engine Cowling
    drawBox(-36, 36, -22, 18, 40, 110, primaryColor, primaryFill);

    // 4. Main Driver Cab & Windshield
    drawBox(-38, 38, -22, 55, -20, 40, primaryColor, darkCabFill);

    // 5. High-Rise Sleeper Aerocap
    drawBox(-38, 38, 20, 75, -80, 0, '#0ea5e9', 'rgba(14, 165, 233, 0.3)');

    // 6. Dual Chrome Exhaust Stacks
    drawBox(33, 38, 0, 90, -28, -23, '#38bdf8', 'rgba(56, 189, 248, 0.6)');
    drawBox(-38, -33, 0, 90, -28, -23, '#38bdf8', 'rgba(56, 189, 248, 0.6)');

    // 7. Fuel Tanks (Cylinders on sides)
    drawBox(31, 46, -35, -12, -40, 20, '#94a3b8', 'rgba(148, 163, 184, 0.4)');
    drawBox(-46, -31, -35, -12, -40, 20, '#94a3b8', 'rgba(148, 163, 184, 0.4)');

    // 8. Wheels / Tandem Drive Axles
    const wheelColor = '#10b981';
    const wheelFill = 'rgba(16, 185, 129, 0.35)';
    // Steer axle
    drawBox(34, 46, -48, -25, 75, 95, wheelColor, wheelFill);
    drawBox(-46, -34, -48, -25, 75, 95, wheelColor, wheelFill);
    // Forward Drive Axle
    drawBox(34, 46, -48, -25, -60, -40, wheelColor, wheelFill);
    drawBox(-46, -34, -48, -25, -60, -40, wheelColor, wheelFill);
    // Rear Drive Axle
    drawBox(34, 46, -48, -25, -105, -85, wheelColor, wheelFill);
    drawBox(-46, -34, -48, -25, -105, -85, wheelColor, wheelFill);

    // 9. Fifth Wheel Coupler Plate
    drawBox(-22, 22, -22, -16, -95, -70, '#f97316', 'rgba(249, 115, 22, 0.7)');

    // 10. Glowing Diagnostic Pulse Indicator if Fault Code exists
    if (equipment.telematics.faultCodes.length > 0) {
      const engCenter = project(0, 5, 65);
      ctx.beginPath();
      ctx.arc(engCenter.px, engCenter.py, 16 + Math.sin(Date.now() / 200) * 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`! SPN ${equipment.telematics.faultCodes[0].spn}`, engCenter.px + 18, engCenter.py - 10);
    }
  }, [rotation, pitch, wireframeMode, activeXrayComponent, equipment]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* 3D Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                3D CAD Telematics Hologram
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                REAL-TIME ROTATION
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              {equipment.unit_id} &bull; {equipment.make_model} ({equipment.year})
            </h3>
          </div>
        </div>

        {/* 3D Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isAutoRotating 
                ? 'bg-amber-500 text-slate-950 font-bold' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle 360 Auto-Rotation"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoRotating ? 'Rotating' : 'Paused'}</span>
          </button>

          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              wireframeMode 
                ? 'bg-sky-500 text-slate-950 font-bold' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {wireframeMode ? 'Wireframe ON' : 'Solid Mesh'}
          </button>
        </div>
      </div>

      {/* Interactive 3D Canvas Stage */}
      <div 
        className="relative w-full h-80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800/80 overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={320} 
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Floating 3D Telematics Status Overlay */}
        <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 space-y-1 pointer-events-none shadow-lg">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Interactive Camera</div>
          <div className="text-xs font-mono font-bold text-amber-400">
            Yaw: {Math.floor(rotation)}° &bull; Pitch: {Math.floor(pitch)}°
          </div>
          <div className="text-[10px] text-slate-300 flex items-center gap-1">
            <Compass className="w-3 h-3 text-amber-400" />
            Drag with mouse to rotate in 3D
          </div>
        </div>

        {/* Live Engine Diagnostic HUD Overlay */}
        <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 space-y-1.5 pointer-events-none shadow-lg text-right">
          <div className="text-[10px] font-mono text-slate-400 uppercase">CAN-Bus Status</div>
          <div className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-end gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE LINK 250 KBPS
          </div>
          <div className="text-xs font-mono text-white">
            {equipment.telematics.speedMph} MPH &bull; {equipment.telematics.engineRpm} RPM
          </div>
        </div>

        {/* Component X-Ray Filter Tabs */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">X-Ray:</span>
            {(['all', 'engine', 'turbo', 'tires'] as const).map(comp => (
              <button
                key={comp}
                onClick={() => setActiveXrayComponent(comp)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors ${
                  activeXrayComponent === comp
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Diagnostics / Fault Summary Bar under 3D model */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-400 font-mono font-bold">
            <Thermometer className="w-4 h-4" />
            <span>Coolant: {equipment.telematics.coolantTempF}°F</span>
          </div>
          <span className="text-slate-600">&bull;</span>
          <div className="flex items-center gap-1 text-sky-400 font-mono font-bold">
            <Gauge className="w-4 h-4" />
            <span>Oil: {equipment.telematics.oilPressurePsi} PSI</span>
          </div>
          <span className="text-slate-600">&bull;</span>
          <div className="text-slate-300 font-mono">
            DEF: <strong className="text-cyan-400">{equipment.telematics.defLevelPct}%</strong>
          </div>
        </div>

        {equipment.telematics.faultCodes.length > 0 && onOpenBayTicket && (
          <button
            onClick={() => onOpenBayTicket(equipment.unit_id)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Dispatch Shop Repair</span>
          </button>
        )}
      </div>
    </div>
  );
};

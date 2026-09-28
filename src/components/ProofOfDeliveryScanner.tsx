import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, FileText, CheckCircle2, AlertTriangle, 
  RefreshCw, Scan, Eye, X, ShieldCheck, Check, Sparkles, 
  RotateCw, ArrowRight, CornerDownRight, CheckSquare, Maximize2
} from 'lucide-react';
import { Order, ProofOfDeliveryDocument, Driver } from '../types';

interface ProofOfDeliveryScannerProps {
  order: Order;
  driver?: Driver;
  isOpen: boolean;
  onClose: () => void;
  onProcessPoD: (orderId: string, podDoc: ProofOfDeliveryDocument) => void;
}

// Generate realistic SVG mock Bill of Lading document images
export function generateSampleBoLDataUrl(
  type: 'toyota' | 'mapleleaf' | 'cascades',
  orderId: string,
  pallets: number
): string {
  let consignee = 'Toyota Boshoku Ontario (Jefferson Plant)';
  let address = '12200 E Jefferson Ave, Detroit, MI 48215';
  let seal = 'RS-88219';
  let dock = 'Dock Door 14';
  let commodity = '26 Skids Automotive Interior Assemblies';
  let receiver = 'J. Martinez (Receiving Lead)';
  let stampColor = '#dc2626'; // red stamp
  let stampText = 'RECEIVED - DOCK 14';

  if (type === 'mapleleaf') {
    consignee = 'Chicago Cold Storage & Distribution Center';
    address = '2255 S Blue Island Ave, Chicago, IL 60608';
    seal = 'ML-44912';
    dock = 'Cold Dock Door 3';
    commodity = '24 Pallets Deep Freeze Bacon (-18°C)';
    receiver = 'R. Kowalski (Quality Dock QA)';
    stampColor = '#2563eb'; // blue cold stamp
    stampText = 'PULP TEMP VERIFIED -18.2°C';
  } else if (type === 'cascades') {
    consignee = 'Lehigh Valley Logistics Hub';
    address = '7442 Industrial Way, Allentown, PA 18106';
    seal = 'CS-99104';
    dock = 'Inbound Bay 7';
    commodity = '28 Reels Containerboard Kraft Paper';
    receiver = 'T. Jenkins (Warehouse Sup.)';
    stampColor = '#059669'; // green warehouse stamp
    stampText = 'CLEAN DELIVERY - NO EXCEPTION';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 950" width="700" height="950">
    <rect width="700" height="950" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
    
    <!-- Document Header -->
    <rect x="25" y="25" width="650" height="95" fill="#0f172a" rx="6"/>
    <text x="45" y="60" fill="#f59e0b" font-family="monospace" font-size="14" font-weight="bold">COMMERCIAL FREIGHT &amp; LOGISTICS OS</text>
    <text x="45" y="90" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="900">OFFICIAL UNIFORM BILL OF LADING (PoD)</text>
    <text x="490" y="55" fill="#94a3b8" font-family="monospace" font-size="11">PRO / BOL NO.</text>
    <text x="490" y="80" fill="#38bdf8" font-family="monospace" font-size="18" font-weight="bold">BOL-${orderId.replace('ORD-', '')}</text>
    <text x="490" y="102" fill="#94a3b8" font-family="monospace" font-size="10">REF: FMCSA-49CFR-373</text>

    <!-- Barcode simulation -->
    <g transform="translate(45, 135)">
      <rect x="0" y="0" width="3" height="36" fill="#0f172a"/>
      <rect x="5" y="0" width="1" height="36" fill="#0f172a"/>
      <rect x="8" y="0" width="4" height="36" fill="#0f172a"/>
      <rect x="15" y="0" width="2" height="36" fill="#0f172a"/>
      <rect x="19" y="0" width="1" height="36" fill="#0f172a"/>
      <rect x="23" y="0" width="5" height="36" fill="#0f172a"/>
      <rect x="31" y="0" width="2" height="36" fill="#0f172a"/>
      <rect x="36" y="0" width="3" height="36" fill="#0f172a"/>
      <rect x="42" y="0" width="1" height="36" fill="#0f172a"/>
      <rect x="46" y="0" width="4" height="36" fill="#0f172a"/>
      <rect x="53" y="0" width="2" height="36" fill="#0f172a"/>
      <rect x="58" y="0" width="3" height="36" fill="#0f172a"/>
      <rect x="64" y="0" width="1" height="36" fill="#0f172a"/>
      <rect x="68" y="0" width="4" height="36" fill="#0f172a"/>
      <rect x="75" y="0" width="2" height="36" fill="#0f172a"/>
      <rect x="80" y="0" width="3" height="36" fill="#0f172a"/>
      <rect x="86" y="0" width="5" height="36" fill="#0f172a"/>
      <rect x="94" y="0" width="2" height="36" fill="#0f172a"/>
      <rect x="99" y="0" width="1" height="36" fill="#0f172a"/>
      <rect x="103" y="0" width="4" height="36" fill="#0f172a"/>
      <rect x="110" y="0" width="2" height="36" fill="#0f172a"/>
      <rect x="115" y="0" width="3" height="36" fill="#0f172a"/>
      <rect x="121" y="0" width="1" height="36" fill="#0f172a"/>
      <rect x="125" y="0" width="4" height="36" fill="#0f172a"/>
      <rect x="132" y="0" width="2" height="36" fill="#0f172a"/>
      <rect x="137" y="0" width="3" height="36" fill="#0f172a"/>
      <rect x="143" y="0" width="5" height="36" fill="#0f172a"/>
      <text x="0" y="48" font-family="monospace" font-size="10" fill="#475569">*BOL-${orderId}*</text>
    </g>

    <!-- Shipper / Carrier / Consignee grid -->
    <rect x="25" y="195" width="315" height="135" fill="#ffffff" stroke="#94a3b8" rx="4"/>
    <rect x="25" y="195" width="315" height="26" fill="#e2e8f0"/>
    <text x="35" y="213" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155">SHIPPER (ORIGIN POINT)</text>
    <text x="35" y="240" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Commercial Dedicated Shipper Fleet</text>
    <text x="35" y="260" font-family="sans-serif" font-size="11" fill="#475569">450 Industrial Parkway East</text>
    <text x="35" y="278" font-family="sans-serif" font-size="11" fill="#475569">Woodstock / Hamilton ON Corridor</text>
    <text x="35" y="300" font-family="monospace" font-size="10" fill="#64748b">Billable Freight: Prepaid / Direct JIT</text>

    <rect x="360" y="195" width="315" height="135" fill="#ffffff" stroke="#94a3b8" rx="4"/>
    <rect x="360" y="195" width="315" height="26" fill="#e2e8f0"/>
    <text x="370" y="213" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155">CONSIGNEE (DESTINATION DELIVERY)</text>
    <text x="370" y="240" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">${consignee}</text>
    <text x="370" y="260" font-family="sans-serif" font-size="11" fill="#475569">${address}</text>
    <text x="370" y="278" font-family="sans-serif" font-size="11" fill="#0369a1" font-weight="bold">Assigned Dock Door: ${dock}</text>
    <text x="370" y="300" font-family="monospace" font-size="10" fill="#64748b">Direct Receiver Contact: Receiving Supt.</text>

    <!-- Transport & Equipment Details -->
    <rect x="25" y="345" width="650" height="70" fill="#ffffff" stroke="#94a3b8" rx="4"/>
    <text x="40" y="368" font-family="sans-serif" font-size="10" font-weight="bold" fill="#64748b">CARRIER / TRACTOR</text>
    <text x="40" y="388" font-family="monospace" font-size="13" font-weight="bold" fill="#0f172a">TRK-104 (Cascadia)</text>
    
    <text x="210" y="368" font-family="sans-serif" font-size="10" font-weight="bold" fill="#64748b">TRAILER UNIT</text>
    <text x="210" y="388" font-family="monospace" font-size="13" font-weight="bold" fill="#0f172a">TLR-882 (53ft)</text>

    <text x="360" y="368" font-family="sans-serif" font-size="10" font-weight="bold" fill="#64748b">SEAL NO. APPLIED</text>
    <text x="360" y="388" font-family="monospace" font-size="13" font-weight="bold" fill="#b91c1c">${seal}</text>

    <text x="520" y="368" font-family="sans-serif" font-size="10" font-weight="bold" fill="#64748b">SHIPMENT DATE</text>
    <text x="520" y="388" font-family="monospace" font-size="13" font-weight="bold" fill="#0f172a">2026-09-12</text>

    <!-- Cargo Table -->
    <rect x="25" y="430" width="650" height="175" fill="#ffffff" stroke="#94a3b8" rx="4"/>
    <rect x="25" y="430" width="650" height="28" fill="#0f172a"/>
    <text x="35" y="449" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff">HANDLING UNITS</text>
    <text x="170" y="449" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff">COMMODITY DESCRIPTION</text>
    <text x="440" y="449" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff">GROSS WT (LBS)</text>
    <text x="560" y="449" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff">NMFC / CLASS</text>

    <text x="40" y="485" font-family="monospace" font-size="14" font-weight="bold" fill="#0f172a">${pallets} PALLETS</text>
    <text x="170" y="485" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">${commodity}</text>
    <text x="440" y="485" font-family="monospace" font-size="13" font-weight="bold" fill="#0f172a">38,400 LBS</text>
    <text x="560" y="485" font-family="monospace" font-size="12" fill="#475569">CLASS 70 / FAK</text>

    <line x1="25" y1="510" x2="675" y2="510" stroke="#e2e8f0"/>
    <text x="40" y="535" font-family="monospace" font-size="11" fill="#475569">MANIFEST TOTAL:</text>
    <text x="170" y="535" font-family="monospace" font-size="12" font-weight="bold" fill="#0f172a">${pallets} Units Verified at Origin Dispatch</text>
    <text x="440" y="535" font-family="monospace" font-size="12" font-weight="bold" fill="#0f172a">CLEAN MANIFEST</text>

    <line x1="25" y1="555" x2="675" y2="555" stroke="#e2e8f0"/>
    <text x="40" y="580" font-family="sans-serif" font-size="11" fill="#64748b">SPECIAL INSTRUCTIONS: Do not break seal prior to receiver dock master inspection.</text>

    <!-- Consignee Delivery Proof & Physical Stamp Area -->
    <rect x="25" y="620" width="650" height="200" fill="#ffffff" stroke="#94a3b8" rx="4"/>
    <rect x="25" y="620" width="650" height="26" fill="#f1f5f9"/>
    <text x="35" y="638" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155">CONSIGNEE CERTIFICATION &amp; PROOF OF DELIVERY RECEIPT</text>
    
    <!-- Stamp Box simulation -->
    <g transform="translate(60, 665) rotate(-3)">
      <rect x="0" y="0" width="260" height="95" fill="none" stroke="${stampColor}" stroke-width="3.5" stroke-dasharray="8 3" rx="8"/>
      <text x="15" y="28" font-family="sans-serif" font-size="14" font-weight="900" fill="${stampColor}">${stampText}</text>
      <text x="15" y="50" font-family="monospace" font-size="12" font-weight="bold" fill="${stampColor}">DATE: 2026-09-12 12:28 EDT</text>
      <text x="15" y="70" font-family="monospace" font-size="11" font-weight="bold" fill="${stampColor}">PIECES: ${pallets}/${pallets} PALLETS OK</text>
      <text x="15" y="88" font-family="monospace" font-size="11" fill="${stampColor}">SEAL: INTACT &amp; VERIFIED</text>
    </g>

    <!-- Signatures section -->
    <g transform="translate(360, 665)">
      <text x="0" y="15" font-family="sans-serif" font-size="11" font-weight="bold" fill="#64748b">RECEIVED BY (PRINT NAME):</text>
      <text x="0" y="35" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${receiver}</text>
      <line x1="0" y1="42" x2="280" y2="42" stroke="#94a3b8"/>

      <text x="0" y="65" font-family="sans-serif" font-size="11" font-weight="bold" fill="#64748b">RECEIVER SIGNATURE:</text>
      <!-- Simulated cursive signature -->
      <path d="M 10 95 Q 30 75 55 90 T 90 85 T 130 95 T 170 80 T 220 95" fill="none" stroke="#1e293b" stroke-width="2.5"/>
      <line x1="0" y1="102" x2="280" y2="102" stroke="#94a3b8"/>
      <text x="0" y="118" font-family="monospace" font-size="10" fill="#059669">&#x2714; Verified Delivery &bull; No Shortage / No Damage</text>
    </g>

    <!-- Footer Certification -->
    <rect x="25" y="835" width="650" height="85" fill="#f8fafc" stroke="#cbd5e1" rx="4"/>
    <text x="40" y="860" font-family="sans-serif" font-size="10" fill="#64748b">FMCSA Electronic Recordkeeping &bull; 49 CFR Part 373 Compliant &bull; Timestamped Digital Image</text>
    <text x="40" y="880" font-family="monospace" font-size="11" font-weight="bold" fill="#0f172a">CARRIER ARCHIVE HASH: SHA256-POD-${orderId}-${Date.now().toString().slice(-6)}</text>
    <text x="40" y="900" font-family="sans-serif" font-size="10" fill="#0369a1">&#x2714; Captured via In-Cab Tablet Pilot</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export const ProofOfDeliveryScanner: React.FC<ProofOfDeliveryScannerProps> = ({
  order,
  driver,
  isOpen,
  onClose,
  onProcessPoD
}) => {
  const driverName = driver?.name || 'Wayne MacLeod';
  const driverId = driver?.driver_id || 'DRV-742';

  // Modes: 'camera' | 'upload' | 'preset' | 'preview'
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'preset'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<'toyota' | 'mapleleaf' | 'cascades'>('toyota');
  
  // Image data
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Simulated OCR execution states
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const [ocrStep, setOcrStep] = useState<number>(0);
  const [ocrStepMessage, setOcrStepMessage] = useState<string>('');
  const [ocrCompleted, setOcrCompleted] = useState<boolean>(false);

  // Extracted OCR fields
  const [extractedData, setExtractedData] = useState<{
    consigneeName: string;
    receiverName: string;
    dockNumber: string;
    bolNumber: string;
    manifestPallets: number;
    receivedPallets: number;
    sealNumber: string;
    sealIntact: boolean;
    osDStatus: 'Clean / Accepted' | 'Over / Short' | 'Damaged Exception';
    confidence: number;
    signatureName: string;
    notes: string;
  }>({
    consigneeName: order.shipper_name,
    receiverName: 'J. Martinez',
    dockNumber: 'Dock 14',
    bolNumber: `BOL-${order.order_id.replace('ORD-', '')}`,
    manifestPallets: order.pallets,
    receivedPallets: order.pallets,
    sealNumber: 'RS-88219',
    sealIntact: true,
    osDStatus: 'Clean / Accepted',
    confidence: 99.4,
    signatureName: 'J. Martinez (Receiving Dock)',
    notes: 'No freight exceptions. Pallet wraps intact, barcodes scanned.'
  });

  // Load default preset on initial open
  useEffect(() => {
    if (isOpen && !capturedImage) {
      const defaultImg = generateSampleBoLDataUrl('toyota', order.order_id, order.pallets);
      setCapturedImage(defaultImg);
    }
  }, [isOpen, order]);

  // Clean up camera stream when closing
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setActiveMode('camera');
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera error or permission denied:', err);
      setCameraError(err.message || 'Unable to access device camera. Please upload an image or select a sample BoL.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCaptureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
      // Reset OCR state
      setOcrCompleted(false);
      triggerSimulatedOcr(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        stopCamera();
        setOcrCompleted(false);
        triggerSimulatedOcr(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (type: 'toyota' | 'mapleleaf' | 'cascades') => {
    setSelectedPreset(type);
    stopCamera();
    const presetUrl = generateSampleBoLDataUrl(type, order.order_id, order.pallets);
    setCapturedImage(presetUrl);
    setOcrCompleted(false);
    triggerSimulatedOcr(presetUrl, type);
  };

  // Simulated OCR Trigger logic
  const triggerSimulatedOcr = (imageSource?: string, presetType: 'toyota' | 'mapleleaf' | 'cascades' = selectedPreset) => {
    setIsOcrProcessing(true);
    setOcrCompleted(false);
    setOcrStep(1);
    setOcrStepMessage('Rectifying document geometry & contrast enhancement...');

    setTimeout(() => {
      setOcrStep(2);
      setOcrStepMessage('Extracting Consignee ink stamp, receiving dock & date markings...');
    }, 600);

    setTimeout(() => {
      setOcrStep(3);
      setOcrStepMessage('Validating Manifested vs Delivered pallet count & trailer seal...');
    }, 1200);

    setTimeout(() => {
      setOcrStep(4);
      setOcrStepMessage('Verifying FMCSA e-BoL digital signature legality & OS&D compliance...');
    }, 1800);

    setTimeout(() => {
      setIsOcrProcessing(false);
      setOcrCompleted(true);
      setOcrStepMessage('OCR Process Completed (99.4% Match Rate)');

      // Configure extracted results based on order or preset
      let consigneeName = order.shipper_name;
      let receiverName = 'J. Martinez';
      let dockNumber = 'Dock Door 14';
      let seal = 'RS-88219';

      if (presetType === 'mapleleaf') {
        consigneeName = 'Chicago Cold Storage Distribution Hub';
        receiverName = 'R. Kowalski (Cold QA)';
        dockNumber = 'Cold Dock Door 3';
        seal = 'ML-44912';
      } else if (presetType === 'cascades') {
        consigneeName = 'Lehigh Valley Logistics Hub';
        receiverName = 'T. Jenkins (Warehouse Sup.)';
        dockNumber = 'Inbound Bay 7';
        seal = 'CS-99104';
      }

      setExtractedData({
        consigneeName,
        receiverName,
        dockNumber,
        bolNumber: `BOL-${order.order_id.replace('ORD-', '')}`,
        manifestPallets: order.pallets,
        receivedPallets: order.pallets,
        sealNumber: seal,
        sealIntact: true,
        osDStatus: 'Clean / Accepted',
        confidence: 99.4,
        signatureName: `${receiverName} (Signed)`,
        notes: 'Document edge detected with clean stamp. No shortage or damage reported.'
      });
    }, 2400);
  };

  const handleCommitToOrderHistory = () => {
    if (!capturedImage) return;

    const podDoc: ProofOfDeliveryDocument = {
      id: `pod-${order.order_id}-${Date.now()}`,
      order_id: order.order_id,
      captured_at: new Date().toLocaleString([], { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      }),
      image_url: capturedImage,
      consignee_name: extractedData.consigneeName,
      receiver_name: extractedData.receiverName,
      dock_number: extractedData.dockNumber,
      seal_number: extractedData.sealNumber,
      seal_intact: extractedData.sealIntact,
      manifest_pallets: extractedData.manifestPallets,
      received_pallets: extractedData.receivedPallets,
      weight_lbs: order.weight_lbs,
      os_d_status: extractedData.osDStatus,
      ocr_confidence_pct: extractedData.confidence,
      bol_number: extractedData.bolNumber,
      driver_id: driverId,
      driver_name: driverName,
      signature_name: extractedData.signatureName,
      notes: extractedData.notes
    };

    onProcessPoD(order.order_id, podDoc);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl my-auto text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-md">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold text-amber-400">
                  Mobile In-Cab Scanner &bull; FMCSA e-BoL
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  OCR ENGINE READY
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Proof-of-Delivery Capture &amp; OCR Engine</span>
                <span className="text-xs font-mono font-normal text-slate-400">({order.order_id})</span>
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left Column: Photo Acquisition & Preview (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 space-y-4 flex flex-col justify-between">
            <div>
              {/* Photo Input Modes */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  1. Document Capture Source:
                </span>
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => {
                      setActiveMode('preset');
                      stopCamera();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeMode === 'preset'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Sample BoL</span>
                  </button>

                  <button
                    onClick={startCamera}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeMode === 'camera'
                        ? 'bg-sky-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>In-Cab Camera</span>
                  </button>

                  <label className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeMode === 'upload'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                      onClick={() => setActiveMode('upload')}
                    />
                  </label>
                </div>
              </div>

              {/* Sample Presets Buttons (When Preset mode is active) */}
              {activeMode === 'preset' && (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-3 space-y-2">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Select pre-stamped logistics BoL for instant test:</span>
                    <span className="text-amber-400 font-mono text-[10px]">1-CLICK PRESET</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('toyota')}
                      className={`p-2 rounded-lg text-left text-xs transition-all border ${
                        selectedPreset === 'toyota'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <div className="truncate font-semibold">Toyota Tier-1 BoL</div>
                      <div className="text-[10px] text-slate-400 truncate">26 Pallets &bull; Stamped</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset('mapleleaf')}
                      className={`p-2 rounded-lg text-left text-xs transition-all border ${
                        selectedPreset === 'mapleleaf'
                          ? 'bg-blue-500/15 border-blue-500 text-blue-300 font-bold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <div className="truncate font-semibold">Cold Chain Dock</div>
                      <div className="text-[10px] text-slate-400 truncate">24 Pallets &bull; -18°C verified</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset('cascades')}
                      className={`p-2 rounded-lg text-left text-xs transition-all border ${
                        selectedPreset === 'cascades'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <div className="truncate font-semibold">Cascades Manifest</div>
                      <div className="text-[10px] text-slate-400 truncate">28 Reels &bull; Clean Receipt</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Document Image Frame / Live Video Viewer */}
              <div className="relative rounded-2xl border-2 border-slate-700 bg-slate-950 overflow-hidden min-h-[330px] flex items-center justify-center group shadow-inner">
                {isCameraActive ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-80 object-cover"
                    />
                    {/* Viewfinder Target Guides */}
                    <div className="absolute inset-4 border-2 border-dashed border-sky-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                      <div className="flex justify-between text-[11px] font-mono text-sky-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm self-start">
                        <span>ALIGN BILL OF LADING WITHIN FRAME</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-sky-300/80 font-mono bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm self-end">
                        <span>AUTOFOCUS ACTIVE &bull; CAMERAX</span>
                      </div>
                    </div>

                    <div className="p-3 w-full bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleCaptureFromCamera}
                        className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Snap Document Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-750"
                      >
                        Cancel Camera
                      </button>
                    </div>
                  </div>
                ) : capturedImage ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-2">
                    <img
                      src={capturedImage}
                      alt="Proof of Delivery Document"
                      className="max-h-[380px] w-auto object-contain rounded-lg border border-slate-800 shadow-md"
                    />

                    {/* Simulated Laser OCR Scanning Line Animation */}
                    {isOcrProcessing && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce duration-1000" />
                        <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[0.5px]" />
                        <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-mono flex items-center gap-2.5 shadow-xl">
                          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                          <div className="flex-1">
                            <div className="font-bold">COMMERCIAL OCR ENGINE RUNNING</div>
                            <div className="text-[11px] text-slate-300">{ocrStepMessage}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verified Document Stamp Badge */}
                    {ocrCompleted && !isOcrProcessing && (
                      <div className="absolute top-4 right-4 bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm animate-in zoom-in-95 duration-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>OCR VERIFIED (99.4%)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <FileText className="w-12 h-12 mx-auto text-slate-600" />
                    <div className="text-sm font-bold text-slate-300">No Document Selected</div>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Choose a sample Bill of Lading, take a photo with your device camera, or upload a delivery receipt.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* OCR Execution Button */}
            <div className="pt-2">
              <button
                type="button"
                id="trigger-ocr-btn"
                onClick={() => triggerSimulatedOcr()}
                disabled={!capturedImage || isOcrProcessing}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOcrProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Document OCR ({ocrStep}/4)...</span>
                  </>
                ) : ocrCompleted ? (
                  <>
                    <RotateCw className="w-4 h-4" />
                    <span>Re-Run Simulated OCR Scan</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Simulated OCR Extraction Trigger</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: OCR Results & Order History Integration (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-6 space-y-4 flex flex-col justify-between bg-slate-900/50">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2.5 border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  2. OCR Extracted Proof Data:
                </span>
                {ocrCompleted && (
                  <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    99.4% Match
                  </span>
                )}
              </div>

              {/* Data Fields */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                    Consignee / Delivery Facility
                  </label>
                  <input
                    type="text"
                    value={extractedData.consigneeName}
                    onChange={e => setExtractedData({ ...extractedData, consigneeName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                      Receiver Signed Name
                    </label>
                    <input
                      type="text"
                      value={extractedData.receiverName}
                      onChange={e => setExtractedData({ ...extractedData, receiverName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                      Dock Door Number
                    </label>
                    <input
                      type="text"
                      value={extractedData.dockNumber}
                      onChange={e => setExtractedData({ ...extractedData, dockNumber: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                      Pallets (Received / Manifested)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={extractedData.receivedPallets}
                        onChange={e => setExtractedData({ ...extractedData, receivedPallets: Number(e.target.value) })}
                        className="w-16 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-center focus:border-amber-500 focus:outline-none"
                      />
                      <span className="text-slate-400 font-mono">/ {extractedData.manifestPallets} pkgs</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                      Trailer Seal Verification
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={extractedData.sealNumber}
                        onChange={e => setExtractedData({ ...extractedData, sealNumber: e.target.value })}
                        className="w-24 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-mono text-xs focus:border-amber-500 focus:outline-none"
                      />
                      <label className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={extractedData.sealIntact}
                          onChange={e => setExtractedData({ ...extractedData, sealIntact: e.target.checked })}
                          className="rounded text-emerald-500"
                        />
                        <span>Intact</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                    OS&amp;D (Over, Short, Damage) Audit
                  </label>
                  <select
                    value={extractedData.osDStatus}
                    onChange={e => setExtractedData({ ...extractedData, osDStatus: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 font-semibold focus:border-amber-500 focus:outline-none text-xs"
                  >
                    <option value="Clean / Accepted">✓ Clean / 100% Accepted (No Exception)</option>
                    <option value="Over / Short">⚠ Over / Short Exception</option>
                    <option value="Damaged Exception">✖ Damaged Freight Exception</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                    Driver &amp; Consignee Notes
                  </label>
                  <textarea
                    rows={2}
                    value={extractedData.notes}
                    onChange={e => setExtractedData({ ...extractedData, notes: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:border-amber-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Order History Preview Notice */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-[11px]">
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>AUTOMATIC ORDER HISTORY PIPELINE</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Upon confirmation, this document will be logged into the permanent order history, 
                  marking the shipment as <strong className="text-emerald-400">Delivered</strong> and transmitting 
                  real-time confirmation to dispatch and customer billing.
                </p>
              </div>
            </div>

            {/* Commit Button */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                id="commit-pod-order-history-btn"
                onClick={handleCommitToOrderHistory}
                disabled={!capturedImage || isOcrProcessing}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-400/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Process into Order History</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

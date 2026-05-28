import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  RefreshCw, 
  Check, 
  X, 
  Video,
  AlertCircle,
  FileImage
} from 'lucide-react';
import axios from 'axios';
import type { Transaction, User } from '../types';

interface ReceiptScannerProps {
  onAddTransaction: (txn: Omit<Transaction, 'id'>) => Promise<boolean>;
  currentUser: User | null;
}

interface ScanResult {
  merchantName: string;
  totalAmount: number;
  date: string;
  category: string;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onAddTransaction, currentUser }) => {
  const [scanCount, setScanCount] = useState(() => {
    const key = `aether_scans_count_${currentUser?.email || 'default'}`;
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Webcam states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [scannedData, setScannedData] = useState<ScanResult>({
    merchantName: '',
    totalAmount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'Others'
  });

  const categories = [
    'Food & Dining', 'Shopping', 'Bills & Utilities', 
    'Transport', 'Entertainment', 'Others'
  ];

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Start Webcam
  const startCamera = async () => {
    setError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setError("Unable to access camera. Please drop file or grant browser permission.");
      setIsCameraActive(false);
    }
  };

  // Stop Webcam
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture Snapshot
  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Match canvas dimensions to video feed dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Grab base64 image data
        const base64Image = canvas.toDataURL('image/jpeg');
        
        // Turn off stream
        stopCamera();
        
        // Process
        uploadAndScan(base64Image, 'image/jpeg');
      }
    }
  };

  // Handle Drag & Drop / File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError("File type not supported. Please upload a JPEG or PNG receipt image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      uploadAndScan(base64Data, file.type);
    };
    reader.onerror = () => {
      setError("Error reading the image file.");
    };
    reader.readAsDataURL(file);
  };

  // Send to server
  const uploadAndScan = async (base64Data: string, mimeType: string) => {
    setScanning(true);
    setError(null);

    try {
      const response = await axios.post('/api/scan-receipt', {
        image: base64Data,
        mimeType: mimeType
      });

      if (response.data.success && response.data.data) {
        const parsed = response.data.data;
        setScannedData({
          merchantName: parsed.merchantName || 'Merchant',
          totalAmount: parseFloat(parsed.totalAmount) || 0,
          date: parsed.date || new Date().toISOString().split('T')[0],
          category: parsed.category || 'Others'
        });

        // Update local scan counter
        const key = `aether_scans_count_${currentUser?.email || 'default'}`;
        const newCount = scanCount + 1;
        setScanCount(newCount);
        localStorage.setItem(key, newCount.toString());

        setShowReviewModal(true);
      } else {
        throw new Error("Invalid parse response from receipt analyzer.");
      }
    } catch (err: any) {
      console.error("Scanning failed:", err);
      setError(err.response?.data?.error || "AI Receipt processing failed. Try manual input or a clearer image.");
    } finally {
      setScanning(false);
    }
  };

  // Modal Review save
  const handleSaveScanned = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!scannedData.merchantName.trim() || scannedData.totalAmount <= 0) {
      setError("Valid Merchant Name and Amount greater than zero are required.");
      return;
    }

    const success = await onAddTransaction({
      narration: scannedData.merchantName.trim(),
      amount: scannedData.totalAmount,
      date: scannedData.date,
      category: scannedData.category,
      type: 'DEBIT' // receipts are always expenses
    });

    if (success) {
      setShowReviewModal(false);
    } else {
      setError("Failed to commit transaction to backend ledger.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      
      <div>
        <h2 className="font-display font-bold text-2xl text-white tracking-tight">AI Receipt Scanner</h2>
        <p className="text-slate-400 text-sm mt-0.5">Capture or upload receipt images to extract transaction parameters instantly.</p>
      </div>

      {error && (
        <div className="p-4 bg-danger/15 text-danger border border-danger/20 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Scanner Dropzone or Webcam Container */}
      <div className="glass-panel p-6 relative overflow-hidden min-h-[320px] flex flex-col items-center justify-center">
        
        {/* Dynamic Scan Spinner overlay */}
        {scanning && (
          <div className="absolute inset-0 bg-[#0b0f19]/80 backdrop-blur-[6px] z-10 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <RefreshCw className="h-10 w-10 animate-spin text-primary" />
            <div>
              <h4 className="text-white font-display font-bold text-sm">Gemini AI OCR Engine Working</h4>
              <p className="text-slate-500 text-xs mt-1">Reading receipt image and extracting parameters into JSON variables...</p>
            </div>
            <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-[pulse_1.5s_infinite] w-full"></div>
            </div>
          </div>
        )}

        {/* Live Camera Viewport */}
        {currentUser?.tier !== 'premium' && scanCount >= 3 ? (
          <div className="text-center p-6 space-y-4 animate-in fade-in duration-300 max-w-sm">
            <div className="mx-auto h-12 w-12 rounded-full bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center text-yellow-400 text-lg font-bold">
              ★
            </div>
            <div>
              <h4 className="text-white font-display font-extrabold text-sm">Free Scan Limit Reached (3/3)</h4>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                You have reached your standard free tier limit of 3 receipt scans. Upgrade to Premium Pro to scan unlimited receipts.
              </p>
            </div>
          </div>
        ) : isCameraActive ? (
          <div className="w-full flex flex-col items-center space-y-4 animate-in fade-in duration-200">
            <div className="relative w-full max-h-[300px] overflow-hidden rounded-xl border border-slate-800 bg-[#000]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={captureSnapshot}
                className="bg-success hover:bg-success-hover text-white text-xs font-bold py-2.5 px-6 rounded-xl flex items-center gap-1.5 shadow-lg shadow-success/15 active:scale-95 transition-all"
              >
                <Check className="h-4 w-4" /> Snapshot Receipt
              </button>
              <button
                onClick={stopCamera}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          /* File Drop / Camera Activation Panel */
          <div className="w-full flex flex-col items-center justify-center space-y-6 py-6">
            <div className="flex items-center justify-center gap-4">
              {/* File input click triggers */}
              <label className="bg-[#151b2c] hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white px-5 py-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors w-36 gap-2">
                <Upload className="h-7 w-7 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Upload File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Start Camera Trigger */}
              <button
                onClick={startCamera}
                className="bg-[#151b2c] hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white px-5 py-4 rounded-2xl flex flex-col items-center justify-center w-36 gap-2 transition-colors"
              >
                <Video className="h-7 w-7 text-success" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Use Camera</span>
              </button>
            </div>

            <div className="text-center">
              <p className="text-slate-400 text-xs font-medium">Drag & drop your receipt image file here</p>
              <p className="text-slate-600 text-[10px] mt-1 font-semibold">Supports JPEG, PNG format receipts (Max 10MB)</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Canvas for Webcam Grabs */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Review & Pre-fill Transaction Modal Overlay */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-[#05070c]/85 backdrop-blur-[8px] z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1322] border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#141b2c] border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <FileImage className="h-4.5 w-4.5 text-primary" /> Review Scanned Receipt
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveScanned} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Merchant / Store Name</label>
                <input
                  type="text"
                  required
                  value={scannedData.merchantName}
                  onChange={(e) => setScannedData({ ...scannedData, merchantName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={scannedData.totalAmount || ''}
                    onChange={(e) => setScannedData({ ...scannedData, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Category</label>
                  <select
                    value={scannedData.category}
                    onChange={(e) => setScannedData({ ...scannedData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={scannedData.date}
                  onChange={(e) => setScannedData({ ...scannedData, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary/80"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-success hover:bg-success-hover text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-success/10 active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <Check className="h-4.5 w-4.5" /> Save to Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs font-bold py-3 rounded-xl border border-slate-750 active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
